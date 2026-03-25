"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface LoginFormProps {
  dict: {
    emailLabel: string;
    emailPlaceholder: string;
    submitButton: string;
    submitting: string;
  };
  lang: string;
}

export function LoginForm({ dict, lang }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    try {
      await signIn("nodemailer", {
        email,
        callbackUrl: `/${lang}`,
        redirect: true,
      });
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="email-form">
      <label htmlFor="email" className="email-label">
        {dict.emailLabel}
      </label>
      <input
        id="email"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.emailPlaceholder}
        required
        disabled={isLoading}
        className="email-input"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={isLoading || !email}
        className="email-submit"
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            {dict.submitting}
          </>
        ) : (
          dict.submitButton
        )}
      </button>
    </form>
  );
}
