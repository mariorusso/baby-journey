import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/app/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/app/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Google,
    Nodemailer({
      server: {
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
          user: process.env.BREVO_SMTP_USER!,
          pass: process.env.BREVO_SMTP_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    }),
  ],
  pages: {
    signIn: "/en/login",
    verifyRequest: "/en/check-email",
  },
  callbacks: {
    session({ session, user }) {
      // Ensure session.user.id is always available in route handlers
      session.user.id = user.id;
      return session;
    },
  },
});
