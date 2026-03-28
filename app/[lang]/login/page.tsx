import { SignIn } from "@clerk/nextjs";
import { getDictionary } from "@/app/dictionaries";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="login-page flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-8">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="bg-white w-20 h-20 rounded-3xl shadow-sm flex items-center justify-center text-4xl mb-4 mx-auto border border-slate-100">
          👶
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {dict.login.title}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {dict.login.subtitle}
        </p>
      </div>

      {/* Clerk SignIn Component */}
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full mx-auto",
              card: "shadow-xl border border-slate-200 rounded-3xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              footer: "bg-slate-50/50 border-t border-slate-100 p-6 rounded-b-3xl",
              socialButtonsBlockButton: "rounded-xl border-slate-200 hover:bg-slate-50 transition-colors",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-sm font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]",
              formFieldInput: "rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400 font-medium text-xs uppercase tracking-widest"
            }
          }}
          routing="path" 
          path={`/${lang}/login`} 
          fallbackRedirectUrl={`/${lang}/dashboard`}
        />
      </div>
    </div>
  );
}
