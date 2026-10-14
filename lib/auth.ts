import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcryptjs";
import getMongoClient from "@/lib/db/mongoClient";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { clientIdentity, consumeLimit } from "@/lib/security/rateLimit";
import { z } from "zod";
import { trustedAppOrigin } from "@/lib/security/request";
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72),
});
const dummyHash = bcrypt.hashSync("unusable-comparison-password", 10);
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  (!authSecret || Buffer.byteLength(authSecret) < 32)
)
  throw new Error("Configure an authentication secret of at least 32 bytes");
if (process.env.NODE_ENV === "production") trustedAppOrigin();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  adapter: MongoDBAdapter(getMongoClient),
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
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const limits = await Promise.all([
          consumeLimit("login-account", email, 10, 15 * 60000),
          consumeLimit(
            "login-client",
            clientIdentity(request),
            100,
            15 * 60000,
          ),
        ]);
        if (limits.some((limit) => !limit.allowed)) return null;

        await dbConnect();
        const user = await User.findOne({ email }).select("+passwordHash");
        const valid = await bcrypt.compare(
          password,
          user?.passwordHash || dummyHash,
        );
        if (!valid || !user?.passwordHash) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          walletBalanceCents: user.walletBalanceCents,
          sessionVersion: user.sessionVersion ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      return account?.provider !== "google" || profile?.email_verified === true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "customer";
        token.walletBalanceCents = user.walletBalanceCents ?? 0;
      }

      if (token.id) {
        if (typeof token.id !== "string" || !/^[a-f\d]{24}$/i.test(token.id))
          return null;
        await dbConnect();
        const fresh = await User.findById(token.id).select(
          "role walletBalanceCents sessionVersion",
        );
        if (
          !fresh ||
          (user?.sessionVersion !== undefined && user.sessionVersion !== (fresh.sessionVersion ?? 0)) ||
          (!user && (token.sessionVersion ?? 0) !== (fresh.sessionVersion ?? 0))
        )
          return null;
        if (fresh) {
          token.sessionVersion = fresh.sessionVersion ?? 0;
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
        session.user.walletBalanceCents =
          (token.walletBalanceCents as number) ?? 0;
      }
      return session;
    },
  },
});
