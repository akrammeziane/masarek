import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google'
import { SessionProvider } from 'next-auth/react' // ✅ استيراد الـ Provider الخاص بـ NextAuth
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const notoArabic = Noto_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Masarek - مساركَ | دليلك الذكي للجامعة',
  description: 'منصة ذكية تساعد طلاب البكالوريا الجزائريين على اكتشاف التخصصات الجامعية المناسبة لهم من خلال اختبارات شخصية وتوصيات مخصصة',
  keywords: ['جامعة', 'بكالوريا', 'الجزائر', 'تخصصات', 'توجيه', 'طلاب', 'university', 'algeria', 'guidance'],
  authors: [{ name: 'Masarek Team' }],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#14b8a6' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {/* ✅ تغليف المكونات بالـ SessionProvider لتوفير حالة الجلسة وإصلاح أخطاء الـ Router */}
        <SessionProvider>
          {children}
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}