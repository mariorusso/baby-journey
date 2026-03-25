import { auth } from "@/auth";
import { db } from "@/app/db";
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

  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lang}/login`);
  }

  const userId = session.user.id;
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
  const babyMoments = await db.query.moments.findMany({
    where: eq(moments.babyId, babyId),
    orderBy: [desc(moments.capturedAt)],
  });

  const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  return (
    <div className="album-page">
      {/* Header */}
      <header className="album-header">
        <div className="album-header-left">
          <Link href={`/${lang}/dashboard`} className="back-to-dash">
            ← {t.backToDashboard}
          </Link>
          <h1 className="album-title">{baby.name}</h1>
          <p className="album-subtitle">
            {calculateAge(baby.birthday, dict.dashboard)}
          </p>
        </div>
      </header>

      {/* Uploader (only for owners/editors) */}
      {canUpload && (
        <section className="album-uploader-section">
          <h2 className="section-title">{t.uploadTitle}</h2>
          <UploaderWrapper 
            babyId={babyId} 
            dict={dict.uploader} 
          />
        </section>
      )}

      {/* Moments Grid */}
      <main className="album-content">
        {babyMoments.length === 0 ? (
          <div className="album-empty">
            <span className="empty-emoji">📸</span>
            <h3 className="empty-title">{t.noMomentsTitle}</h3>
            <p className="empty-msg">{t.noMomentsMessage}</p>
          </div>
        ) : (
          <div className="moments-grid">
            {babyMoments.map((moment) => (
              <div key={moment.id} className="moment-card">
                <div className="moment-media">
                  {moment.mediaType.startsWith("video") ? (
                    <video
                      src={`${R2_URL}/${moment.r2Key}`}
                      controls
                      className="moment-video"
                    />
                  ) : (
                    <img
                      src={`${R2_URL}/${moment.r2Key}`}
                      alt={moment.r2Key}
                      className="moment-image"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="moment-info">
                  <span className="moment-date">
                    {t.momentDateLabel}{" "}
                    {new Date(moment.capturedAt).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
