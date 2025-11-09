'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isDashboard = pathname.startsWith('/dashboard');

  if (isDashboard) return null;

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[9999] border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        padding: '12px 0',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="mx-auto flex items-center justify-between" style={{ padding: '0 40px' }}>
        {/* Left side: Brand name */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Nudget logo"
            width={48}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <Link 
            href="/"
            className="text-2xl font-bold text-[#2C1810] no-underline hover:text-[#E97451] transition-colors duration-300"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem' }}
          >
            Nudget
          </Link>
        </div>

        {/* Center: Navigation links */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center" style={{ gap: '32px', listStyle: 'none', margin: 0, padding: 0 }}>
            <Link 
              href="#home" 
              className="text-[#2C1810] font-medium no-underline relative hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem' }}
            >
              Home
            </Link>
            <Link 
              href="#features" 
              className="text-[#2C1810] font-medium no-underline relative hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem' }}
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="text-[#2C1810] font-medium no-underline relative hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem' }}
            >
              Pricing
            </Link>
            <Link 
              href="#faq" 
              className="text-[#2C1810] font-medium no-underline relative hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem' }}
            >
              FAQs
            </Link>
          </nav>
        )}

        {/* Right side: Auth links */}
        {!isAuthPage && (
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/login')}
              className="text-[#2C1810] bg-transparent border-none cursor-pointer hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem', fontWeight: '500' }}
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/register')}
              className="text-[#2C1810] bg-transparent border-none cursor-pointer hover:text-[#E97451] transition-colors duration-300"
              style={{ fontSize: '0.95rem', fontWeight: '500' }}
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}