import Link from "next/link";
import { getDictionary } from "@/app/dictionaries";

export default async function CheckEmailPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-header">
          <span className="login-emoji">✉️</span>
          <h1 className="login-title">{dict.checkEmail.title}</h1>
          <p className="login-subtitle">{dict.checkEmail.message}</p>
        </div>

        <p className="spam-hint">{dict.checkEmail.spamHint}</p>

        <Link href={`/${lang}/login`} className="back-button">
          {dict.checkEmail.backButton}
        </Link>
      </div>
    </div>
  );
}
