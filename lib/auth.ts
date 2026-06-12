import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const [found] = await db.select().from(user).where(eq(user.email, credentials.email as string)).limit(1)
        if (!found) return null
        const accounts = await db.query.account?.findMany?.({ where: (a: any, { eq }: any) => eq(a.userId, found.id) }) ?? []
        const credAccount = accounts.find((a: any) => a.providerId === 'credentials')
        if (!credAccount?.password) return null
        const valid = await bcrypt.compare(credentials.password as string, credAccount.password)
        if (!valid) return null
        // Block sign-in if email not verified
        if (!found.emailVerified) return null
        return { id: found.id, name: found.name, email: found.email }
      },
    }),
  ],
  // 👉 تمت إضافة السطر هنا بأمان لحماية الجلسات وتشفيرها
  secret: process.env.NEXTAUTH_SECRET,
  
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    newUser: '/dashboard',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
})