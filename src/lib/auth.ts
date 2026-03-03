import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: { signIn: '/auth/signin' },
  providers: [Credentials({ name: 'Email', credentials: { email: {}, password: {} }, async authorize(credentials) {
    if (!credentials?.email || !credentials.password) return null;
    const user = await prisma.user.findUnique({ where: { email: String(credentials.email) } });
    if (!user?.passwordHash) return null;
    const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
    return ok ? { id: user.id, email: user.email, name: user.name } : null;
  } })],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
