import { locales, defaultLocale } from "@/app/dictionaries";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale — fallback to default if invalid
  const validLang = locales.includes(lang) ? lang : defaultLocale;

  return <div lang={validLang}>{children}</div>;
}
