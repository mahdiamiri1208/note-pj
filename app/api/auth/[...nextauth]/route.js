// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

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
      id: "credentials",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        // اعتبارسنجی ساده ورودی
        if (!credentials?.email || !credentials?.otp) return null;

        try {
          await connectDB();

          // پیدا کردن آخرین OTP صادر شده برای ایمیل
          const record = await Otp.findOne({ email: credentials.email }).sort({ createdAt: -1 });
          if (!record) return null;

          // اگر منقضی شده --> حذف و رد کن
          if (Date.now() > record.expiresAt.getTime()) {
            await Otp.deleteMany({ email: credentials.email });
            return null;
          }

          // بررسی تطابق (record.code حاوی هش است)
          const match = await bcrypt.compare(credentials.otp, record.code);
          if (!match) return null;

          // OTP مصرف شده -> حذف همه رکوردهای قدیمی آن ایمیل
          await Otp.deleteMany({ email: credentials.email });

          // اینجا می‌توانی کاربر واقعی از DB بارگذاری کنی؛ برای سادگی:
          const user = { id: credentials.email, email: credentials.email };

          return user;
        } catch (err) {
          console.error("Credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // وقتی از provider وارد می‌شود، اطلاعاتی اضافه کن
      if (account && user) {
        token.accessToken = account.access_token || token.accessToken;
      }
      if (user) {
        token.user = user;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = token.user || session.user;
      session.accessToken = token.accessToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // اگر redirect داخلی است، اجازه بده؛ در غیر اینصورت به /notes برو
      if (url && url.startsWith(baseUrl)) return url;
      return `${baseUrl}/notes`;
    },
  },

  debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
