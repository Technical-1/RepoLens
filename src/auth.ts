import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { serverEnv } from "@/lib/env"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: serverEnv.AUTH_GITHUB_ID,
      clientSecret: serverEnv.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
})
