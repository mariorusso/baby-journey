import { getDictionary } from "@/app/dictionaries";
import { auth } from "@clerk/nextjs/server";
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

  // 1. Clerk Auth check
  const { userId } = await auth();
  if (!userId) {
    redirect(`/${lang}/login`);
  }

  const dict = await getDictionary(lang);
  const t = dict.addBaby;

  return (
    <div className="add-baby-page flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <header className="mb-8">
            <Link href={`/${lang}/dashboard`} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline mb-4">
              ← {t.backLink}
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.title}</h1>
            <p className="text-slate-500 mt-1 font-medium italic text-sm">Add a new little one to your journey</p>
          </header>

          <form action={createBaby} className="space-y-6">
            <input type="hidden" name="lang" value={lang} />
            
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                {t.nameLabel}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
                placeholder="e.g. Leo"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="birthday" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                {t.birthdayLabel}
              </label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                required
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none"
              />
            </div>

            <div className="pt-4">
              <SubmitButton
                idleText={t.submitButton}
                loadingText={t.submitting}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
