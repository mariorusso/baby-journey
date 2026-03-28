import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/app/db";
import { moments } from "@/app/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/app/dictionaries";
import { getBabyWithAccess } from "@/app/lib/permissions";
import { calculateAge } from "@/app/utils/age";
import { UploaderWrapper } from "./uploader-wrapper";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ lang: string; babyId: string }>;
}) {
  const { lang, babyId } = await params;

  // 1. Clerk Auth check
  const { userId } = await auth();
  if (!userId) {
    redirect(`/${lang}/login`);
  }

  const dict = await getDictionary(lang);
  const t = dict.album;

  // 2. Permission & Baby check
  const access = await getBabyWithAccess(userId, babyId);
  if (!access) {
    // If user has no access, 404 to avoid leaking existence
    notFound();
  }

  const { baby, role } = access;
  const canUpload = role === "owner" || role === "editor";

  // 3. Fetch moments for this baby
  const db = getDb();
  const babyMoments = await db.query.moments.findMany({
    where: eq(moments.babyId, babyId),
    orderBy: [desc(moments.capturedAt)],
  });

  const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  return (
    <div className="album-page max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="album-header mb-8">
        <div className="album-header-left">
          <Link href={`/${lang}/dashboard`} className="back-to-dash text-indigo-600 font-semibold mb-4 inline-block hover:underline">
            ← {t.backToDashboard}
          </Link>
          <h1 className="album-title text-4xl font-extrabold text-slate-900">{baby.name}</h1>
          <p className="album-subtitle text-slate-500 font-medium mt-1">
            {calculateAge(baby.birthday, dict.dashboard)}
          </p>
        </div>
      </header>

      {/* Uploader (only for owners/editors) */}
      {canUpload && (
        <section className="album-uploader-section mb-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="section-title text-xl font-bold text-slate-800 mb-4">{t.uploadTitle}</h2>
          <UploaderWrapper 
            babyId={babyId} 
            dict={dict.uploader} 
          />
        </section>
      )}

      {/* Moments Grid */}
      <main className="album-content">
        {babyMoments.length === 0 ? (
          <div className="album-empty py-20 text-center flex flex-col items-center">
            <span className="empty-emoji text-6xl mb-4">📸</span>
            <h3 className="empty-title text-2xl font-bold text-slate-800">{t.noMomentsTitle}</h3>
            <p className="empty-msg text-slate-500 mt-2 max-w-md">{t.noMomentsMessage}</p>
          </div>
        ) : (
          <div className="moments-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {babyMoments.map((moment) => (
              <div key={moment.id} className="moment-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100 group">
                <div className="moment-media aspect-square overflow-hidden bg-slate-50 relative">
                  {moment.mediaType.startsWith("video") ? (
                    <video
                      src={`${R2_URL}/${moment.r2Key}`}
                      controls
                      className="moment-video w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={`${R2_URL}/${moment.r2Key}`}
                      alt={moment.r2Key}
                      className="moment-image w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="moment-info p-4 flex justify-between items-center">
                  <span className="moment-date text-sm font-semibold text-slate-400 capitalize">
                    {t.momentDateLabel}{" "}
                    {new Date(moment.capturedAt).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {moment.isFavorite && <span className="text-xl">❤️</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
