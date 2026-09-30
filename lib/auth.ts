import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/db/mongoClient";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          walletBalanceCents: user.walletBalanceCents,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "customer";
        token.walletBalanceCents = user.walletBalanceCents ?? 0;
      }

      if (trigger === "update" && token.id) {
        await dbConnect();
        const fresh = await User.findById(token.id);
        if (fresh) {
          token.role = fresh.role;
          token.walletBalanceCents = fresh.walletBalanceCents;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "customer" | "admin") ?? "customer";
        session.user.walletBalanceCents = (token.walletBalanceCents as number) ?? 0;
      }
      return session;
    },
  },
});
