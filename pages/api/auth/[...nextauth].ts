import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Get allowed emails from environment variable
const ALLOWED_EMAILS =
  process.env.ALLOWED_EMAILS?.split(",").map((email) => email.trim()) || [];

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
    error: "/auth/access-denied", // Custom error page
  },
  callbacks: {
    async signIn({ user }) {
      // Check if the user's email is in the allowed list
      if (user.email && ALLOWED_EMAILS.includes(user.email)) {
        return true;
      }
      // Redirect to custom error page with user email
      return `/auth/access-denied?email=${encodeURIComponent(
        user.email || ""
      )}`;
    },
    async session({ session }) {
      // You can add additional user info to the session here if needed
      return session;
    },
    async jwt({ token }) {
      // Persist additional user info in the token if needed
      return token;
    },
  },
});
