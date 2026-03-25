import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { babies, accessShares } from "@/app/db/schema";
import { getDictionary } from "@/app/dictionaries";
import { calculateAge } from "@/app/utils/age";


// ── Page ──────────────────────────────────────────────────────────────

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${lang}/login`);
  }

  const userId = session.user.id;
  const dict = await getDictionary(lang);
  const d = dict.dashboard;

  // 2. Parallel data fetch: owned babies + shared babies
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

  // 3. Merge & deduplicate
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
  const userName = session.user.name || session.user.email || "";

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="dash-page">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1 className="dash-greeting">
            {d.welcome}, {userName.split(" ")[0]} 👋
          </h1>
          <p className="dash-subtitle">{d.yourBabies}</p>
        </div>
        <Link href={`/${lang}/dashboard/add`} className="dash-add-button">
          + {d.addBaby}
        </Link>
      </header>

      {/* Content */}
      {allBabies.length === 0 ? (
        /* ── Empty State ── */
        <div className="dash-empty">
          <span className="dash-empty-icon">🍼</span>
          <h2 className="dash-empty-title">{d.emptyTitle}</h2>
          <p className="dash-empty-msg">{d.emptyMessage}</p>
          <Link href={`/${lang}/dashboard/add`} className="dash-empty-cta">
            + {d.addBaby}
          </Link>
        </div>
      ) : (
        /* ── Baby Grid ── */
        <div className="dash-grid">
          {allBabies.map((baby) => (
            <Link
              key={baby.id}
              href={`/${lang}/album/${baby.id}`}
              className="baby-card"
            >
              {/* Avatar */}
              <div className="baby-avatar">
                {baby.profileImageKey ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${baby.profileImageKey}`}
                    alt={baby.name}
                    className="baby-avatar-img"
                  />
                ) : (
                  <span className="baby-avatar-placeholder">
                    {baby.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="baby-info">
                <h3 className="baby-name">{baby.name}</h3>
                <p className="baby-age">
                  {calculateAge(baby.birthday, d)}
                </p>
                {sharedIds.has(baby.id) && (
                  <span className="baby-shared-badge">{d.shared}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
