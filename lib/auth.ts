import { PrismaAdapter } from "@auth/prisma-adapter";
import { ApprovalStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

providers.push(
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" }
    },
    async authorize(rawCredentials) {
      const credentials = credentialsSchema.safeParse(rawCredentials);

      if (!credentials.success) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.data.email }
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(credentials.data.password, user.passwordHash);

      if (!isValid) {
        return null;
      }

      return user;
    }
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/"
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      if (account?.provider !== "credentials") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              username: existing.username ?? user.email.split("@")[0],
              name: user.name ?? existing.name,
              image: user.image ?? existing.image
            }
          });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.approvalStatus = user.approvalStatus;
        token.username = user.username;
      }

      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.approvalStatus = dbUser.approvalStatus;
          token.username = dbUser.username;
          token.sub = dbUser.id;
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role | undefined) ?? Role.USER;
        session.user.approvalStatus =
          (token.approvalStatus as ApprovalStatus | undefined) ?? ApprovalStatus.PENDING;
        session.user.username = (token.username as string | null | undefined) ?? null;
      }

      return session;
    }
  }
});
