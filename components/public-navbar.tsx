'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogIn, Zap } from 'lucide-react'

function MasarekLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#006233"/>
      <path d="M8 28 C8 28 10 20 16 20 C19 20 20 22 20 24 C20 26 18 27 16 27 C14 27 13 26 13 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 24 L32 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 12 L32 12 L32 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const navLinks: [string, string][] = [
  ['/', 'الرئيسية'],
  ['/explorer', 'التخصصات'],
  ['/universities', 'الجامعات'],
  ['/#how-it-works', 'كيف يعمل'],
]

/** Full public navbar — used on landing page and public browse pages */
export function PublicNavbar({ variant = 'sticky' }: { variant?: 'fixed' | 'sticky' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const positionClass = variant === 'fixed'
    ? 'fixed top-0 right-0 left-0'
    : 'sticky top-0'

  return (
    <header className={`${positionClass} z-50 backdrop-blur-md bg-white/95 border-b border-[#E2E8F0] shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <MasarekLogo size={38} />
          <div>
            <span className="text-xl font-bold text-[#0B2340]" style={{ fontFamily: 'Noto Sans Arabic, sans-serif' }}>
              مساركَ
            </span>
            <span className="text-xs text-[#006233] block leading-none">Masarek.dz</span>
          </div>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-[#0B2340] hover:text-[#006233] text-sm font-medium transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          {/* تسجيل الدخول — outlined ghost button */}
          <Link href="/sign-in">
            <button className="
              inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
              border border-[#006233] text-[#006233]
              hover:bg-[#006233] hover:text-white
              transition-all duration-200
            ">
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </button>
          </Link>

          {/* ابدأ الآن — filled CTA */}
          <Link href="/sign-up">
            <button className="
              relative inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold
              bg-[#006233] text-white
              hover:bg-[#004d28]
              shadow-md shadow-[#006233]/25 hover:shadow-lg hover:shadow-[#006233]/30
              hover:-translate-y-0.5 active:translate-y-0
              transition-all duration-200 overflow-hidden group
            ">
              <span className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-20deg] -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 ease-out" />
              <Zap className="w-4 h-4" />
              ابدأ الآن
            </button>
          </Link>
        </div>

        {/* Mobile hamburger — always visible on mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[#F4F6F9] transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="قائمة التنقل"
        >
          {mobileMenuOpen
            ? <X className="w-5 h-5 text-[#0B2340]" />
            : <Menu className="w-5 h-5 text-[#0B2340]" />
          }
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] shadow-lg">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-[#0B2340] hover:text-[#006233] hover:bg-[#F4F6F9] text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            {/* Auth buttons — mobile only shown here */}
            <div className="border-t border-[#E2E8F0] mt-2 pt-3 flex flex-col gap-2">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <button className="
                  w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold
                  border border-[#006233] text-[#006233]
                  hover:bg-[#006233] hover:text-white
                  transition-all duration-200
                ">
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <button className="
                  w-full relative inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold
                  bg-[#006233] text-white hover:bg-[#004d28]
                  shadow-md shadow-[#006233]/20
                  transition-all duration-200 overflow-hidden group
                ">
                  <Zap className="w-4 h-4" />
                  ابدأ الآن
                </button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
