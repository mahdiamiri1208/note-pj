// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const TEN_MINUTES = 10 * 60; // seconds

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),

    CredentialsProvider({
      id: "password",
      name: "Password",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.password) {
            return null;
          }

          await connectDB();
          const identifier = credentials.identifier.trim().toLowerCase();

          const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }],
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: `${user.firstName} ${user.lastName}`.trim(),
          };
        } catch (err) {
          console.error("Password authorize error:", err);
          return null;
        }
      },
    }),

    CredentialsProvider({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.otp) {
            return null;
          }

          await connectDB();
          const email = credentials.email.trim().toLowerCase();

          const record = await Otp.findOne({ email }).sort({ createdAt: -1 });
          if (!record) return null;

          if (Date.now() > record.expiresAt.getTime()) {
            await Otp.deleteMany({ email });
            return null;
          }

          const match = await bcrypt.compare(credentials.otp, record.code);
          if (!match) return null;

          await Otp.deleteMany({ email });

          const user = await User.findOne({ email });
          if (!user) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: `${user.firstName} ${user.lastName}`.trim(),
          };
        } catch (err) {
          console.error("OTP authorize error:", err);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  // ===== Session + JWT configuration =====
  session: {
    strategy: "jwt",
    maxAge: TEN_MINUTES, // session valid for 10 minutes
    updateAge: 0,        // don't auto-refresh session
  },

  jwt: {
    maxAge: TEN_MINUTES,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // jwt callback runs on sign-in and subsequent calls
    async jwt({ token, user }) {
      // On initial sign-in, set token claims
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;

        // set explicit exp (seconds since epoch)
        token.exp = Math.floor(Date.now() / 1000) + TEN_MINUTES;
      }
      // otherwise, preserve existing token.exp (do not refresh here)
      return token;
    },

    // session callback exposes safe fields to client
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.name = token.name;

      // expose expiresAt as ms (client-friendly)
      if (token?.exp) {
        session.expiresAt = Number(token.exp) * 1000;
        session.expires = new Date(Number(token.exp) * 1000).toISOString();
      }

      return session;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/notes`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
