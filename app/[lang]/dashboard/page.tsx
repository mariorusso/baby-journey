import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, inArray } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/app/db";
import { babies, accessShares } from "@/app/db/schema";
import { getDictionary } from "@/app/dictionaries";
import { calculateAge } from "@/app/utils/age";
import { syncUser } from "@/app/actions/user";

// ── Page ──────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // 1. Clerk Auth check
  const { userId } = await auth();
  if (!userId) {
    redirect(`/${lang}/login`);
  }

  // 2. Sync User with D1 on first land
  const user = await syncUser();
  if (!user) {
     // This shouldn't happen if userId exists, but safety first
     redirect(`/${lang}/login`);
  }

  const dict = await getDictionary(lang);
  const d = dict.dashboard;
  const db = await getDb();

  // 3. Parallel data fetch: owned babies + shared babies
  const [ownedBabies, sharedAccess] = await Promise.all([
    db.query.babies.findMany({
      where: eq(babies.ownerId, userId),
    }),
    db.query.accessShares.findMany({
      where: and(
        eq(accessShares.userId, userId),
        inArray(accessShares.role, ["editor", "viewer"])
      ),
      with: { baby: true },
    }),
  ]);

  // 4. Merge & deduplicate
  const babyMap = new Map<string, (typeof ownedBabies)[0]>();
  const sharedIds = new Set<string>();

  for (const b of ownedBabies) {
    babyMap.set(b.id, b);
  }
  for (const share of sharedAccess) {
    if (share.baby && !babyMap.has(share.baby.id)) {
      babyMap.set(share.baby.id, share.baby);
      sharedIds.add(share.baby.id);
    }
  }

  const allBabies = Array.from(babyMap.values());
  const displayUserName = user.name || user.email || "";

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="dash-page w-full max-w-5xl mx-auto p-6">
      {/* Header */}
      <header className="dash-header flex justify-between items-center mb-10">
        <div>
          <h1 className="dash-greeting text-3xl font-bold text-slate-900">
            {d.welcome}, {displayUserName.split(" ")[0]} 👋
          </h1>
          <p className="dash-subtitle text-slate-500 mt-1">{d.yourBabies}</p>
        </div>
        <Link 
          href={`/${lang}/dashboard/add`} 
          className="dash-add-button bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + {d.addBaby}
        </Link>
      </header>

      {/* Content */}
      {allBabies.length === 0 ? (
        /* ── Empty State ── */
        <div className="dash-empty bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center flex flex-col items-center">
          <span className="dash-empty-icon text-5xl mb-4">🍼</span>
          <h2 className="dash-empty-title text-xl font-bold text-slate-800">{d.emptyTitle}</h2>
          <p className="dash-empty-msg text-slate-500 mt-2 max-w-sm mb-8">{d.emptyMessage}</p>
          <Link 
            href={`/${lang}/dashboard/add`} 
            className="dash-empty-cta bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-transform active:scale-95 shadow-md"
          >
            + {d.addBaby}
          </Link>
        </div>
      ) : (
        /* ── Baby Grid ── */
        <div className="dash-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBabies.map((baby) => (
            <Link
              key={baby.id}
              href={`/${lang}/album/${baby.id}`}
              className="baby-card bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-indigo-100 transition-all group"
            >
              {/* Avatar */}
              <div className="baby-avatar w-16 h-16 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white shadow-inner group-hover:border-indigo-200 transition-colors">
                {baby.profileImageKey ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${baby.profileImageKey}`}
                    alt={baby.name}
                    className="baby-avatar-img w-full h-full object-cover"
                  />
                ) : (
                  <span className="baby-avatar-placeholder text-2xl font-bold text-indigo-300">
                    {baby.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="baby-info flex-1">
                <h3 className="baby-name text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{baby.name}</h3>
                <p className="baby-age text-sm text-slate-500 font-medium tracking-tight">
                  {calculateAge(baby.birthday, d)}
                </p>
                {sharedIds.has(baby.id) && (
                  <span className="baby-shared-badge mt-1.5 inline-block text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    {d.shared}
                  </span>
                )}
              </div>
              
              <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
