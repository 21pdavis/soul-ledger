import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail, readGateConfig } from "@/lib/staging-gate";

/**
 * Google sign-in for the staging gate only (ADR 0042). Production has no login (ADR 0002) and
 * never loads this module. Reads AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.
 */
export const { handlers, auth } = NextAuth({
  providers: [Google],
  // Render terminates TLS in front of the app, so trust its forwarded host.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    signIn: ({ profile }) =>
      isAllowedEmail(
        profile?.email,
        profile?.email_verified as boolean | undefined,
        readGateConfig(process.env).allowedEmails,
      ),
  },
});
