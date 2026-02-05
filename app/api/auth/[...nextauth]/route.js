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

async function ensureUniqueUsername(base) {
  base = (base || "user").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24);
  let attempt = base || "user";
  let i = 0;
  while (await User.findOne({ username: attempt })) {
    i++;
    attempt = `${base}${Math.floor(Math.random() * 9000) + 100}`;
    if (i > 20) break;
  }
  return attempt;
}

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
            provider: user.provider || "local",
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
            provider: user.provider || "local",
          };
        } catch (err) {
          console.error("OTP authorize error:", err);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: TEN_MINUTES,
    updateAge: 0,
  },

  jwt: {
    maxAge: TEN_MINUTES,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // قبل از قبول لاگین از OAuth: اگر ایمیل موجود نبود، رکورد بساز
    async signIn({ user, account, profile }) {
      try {
        // فقط برای providerهای OAuth
        if (account && (account.provider === "google" || account.provider === "github")) {
          await connectDB();

          const email = (user?.email || profile?.email || "").toLowerCase();
          if (!email) return false;

          let existing = await User.findOne({ email });
          if (!existing) {
            // نام و نام‌خانوادگی را استخراج کن
            const firstName = profile.given_name || (profile.name ? profile.name.split(" ")[0] : "") || "";
            const lastName = profile.family_name || (profile.name ? profile.name.split(" ").slice(1).join(" ") : "") || "";

            // ساخت username یکتا
            const preferred = (profile.preferred_username || (firstName + lastName) || email.split("@")[0]);
            const username = await ensureUniqueUsername(preferred);

            const newUser = await User.create({
              firstName: firstName || "User",
              lastName: lastName || "",
              username,
              email,
              provider: account.provider,
              providerId: profile.sub || profile.id || null,
              hasPassword: false,
              // password را نریزیم (undef) چون این کاربر با oauth ثبت شده
            });

            // nothing to return specifically — allow sign-in
          } else {
            // اگر کاربر هست اما providerId ثبت نشده، بروز کن
            let changed = false;
            if (!existing.providerId) {
              existing.provider = account.provider;
              existing.providerId = profile.sub || profile.id || existing.providerId;
              changed = true;
            }
            if (!existing.hasPassword && existing.password) {
              existing.hasPassword = true;
              changed = true;
            }
            if (changed) await existing.save();
          }
        }

        return true;
      } catch (err) {
        console.error("signIn callback error:", err);
        return false;
      }
    },

    // کنترل توکن JWT — وقتی لاگین اتفاق افتاد، مقادیر DB را داخل token بگذار
    async jwt({ token, user, account, profile }) {
      // وقتی اولین بار (حین sign in) account موجود است — بهتر ایمیل را از DB بخوانیم و id و username بگذاریم
      try {
        if (account) {
          await connectDB();
          const email = (user?.email || token?.email || profile?.email || "").toLowerCase();
          if (email) {
            const dbUser = await User.findOne({ email }).select("firstName lastName username _id provider");
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.email = email;
              token.username = dbUser.username;
              token.name = `${dbUser.firstName} ${dbUser.lastName}`.trim();
              token.provider = dbUser.provider || account.provider;
              token.exp = Math.floor(Date.now() / 1000) + TEN_MINUTES;
            }
          }
        } else if (user) {
          // credentials flow returns user object
          token.id = user.id;
          token.email = user.email;
          token.username = user.username;
          token.name = user.name;
          token.exp = Math.floor(Date.now() / 1000) + TEN_MINUTES;
        }
      } catch (err) {
        console.error("jwt callback error:", err);
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.name = token.name;
      session.user.provider = token.provider || "local";

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
