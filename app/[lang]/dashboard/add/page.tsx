import { getDictionary } from "@/app/dictionaries";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createBaby } from "@/app/actions/baby";
import { SubmitButton } from "@/app/[lang]/dashboard/add/submit-button";

export default async function AddBabyPage({
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

  const dict = await getDictionary(lang);
  const t = dict.addBaby;

  return (
    <div className="add-baby-page">
      <div className="add-baby-bg" />
      
      <div className="add-baby-card">
        <header className="add-baby-header">
          <Link href={`/${lang}/dashboard`} className="back-link">
            ← {t.backLink}
          </Link>
          <h1 className="add-baby-title">{t.title}</h1>
        </header>

        <form action={createBaby} className="add-baby-form">
          {/* Pass lang to the server action for proper redirect */}
          <input type="hidden" name="lang" value={lang} />
          
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t.nameLabel}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-input"
              placeholder="e.g. Leo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthday" className="form-label">
              {t.birthdayLabel}
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              required
              className="form-input"
            />
          </div>

          <SubmitButton
            idleText={t.submitButton}
            loadingText={t.submitting}
          />
        </form>
      </div>
    </div>
  );
}
