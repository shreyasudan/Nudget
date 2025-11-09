'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Target,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { alertService } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await alertService.getAll(true, 100);
      setUnreadAlertCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch unread alerts:', error);
    }
  };

  // Fetch unread alert count
  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh count when pathname changes (especially when navigating to/from alerts)
  useEffect(() => {
    fetchUnreadCount();
  }, [pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/goals', label: 'Goals', icon: Target },
    { href: '/dashboard/budgets', label: 'Budgets', icon: CreditCard },
    { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: Receipt },
    { href: '/dashboard/alerts', label: 'Recent Alerts', icon: Bell },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-[#FFFAFA]">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-[#2C1810]" /> : <Menu className="w-6 h-6 text-[#2C1810]" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 w-72 h-full bg-white border-r border-gray-200 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-8 border-b border-gray-200" style={{ paddingLeft: '20px' }}>
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/logo.svg"
                alt="Nudget logo"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
              <span className="text-2xl font-bold text-[#2C1810]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Nudget
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-6 py-6">
            <ul>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href} style={{ marginBottom: index < navItems.length - 1 ? '12px' : '0' }}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-5 py-3 rounded-lg transition-all duration-200 relative ${
                        active
                          ? 'bg-[#E97451]/10 text-[#E97451] font-medium'
                          : 'text-[#2C1810] hover:bg-[#E97451]/5 hover:text-[#E97451]'
                      }`}
                      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '15px', letterSpacing: '0.01em', paddingLeft: '20px', paddingRight: '16px' }}
                    >
                      <div className="relative">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {item.icon === Bell && unreadAlertCount > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                            {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                          </div>
                        )}
                      </div>
                      <span className="leading-relaxed">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-6 py-6 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full py-3 text-[#2C1810] hover:bg-[#E97451]/5 hover:text-[#E97451] rounded-lg transition-all duration-200"
              style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '15px', letterSpacing: '0.01em', paddingLeft: '20px', paddingRight: '16px' }}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium leading-relaxed">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#FFFAFA]">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8" style={{ paddingRight: 'clamp(3rem, 8vw, 8rem)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}