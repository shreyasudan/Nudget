'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAFA]" style={{ paddingTop: '80px', paddingLeft: 'clamp(4rem, 12vw, 10rem)', paddingRight: 'clamp(4rem, 12vw, 10rem)', paddingBottom: '40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          <div className="bg-white shadow-sm border border-gray-200" style={{ padding: '48px 56px' }}>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#2C1810] mb-3">
                Start Your Journey
              </h2>
              <p className="text-[#2C1810]/70">
                Create your account and take control of your finances
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-900">
                  Name (optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 px-4 py-3 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                  placeholder="Your name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 px-4 py-3 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-900">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 px-4 py-3 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-gray-300 px-4 py-3 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 p-4"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-sm font-medium text-[#E97451] hover:text-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Start Free Trial'}
              </button>

              <p className="text-center text-sm text-[#2C1810]/70">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-[#E97451] hover:text-[#A0522D] transition-colors">
                  Sign in
                </Link>
              </p>

              <p className="text-xs text-center text-[#2C1810]/60 mt-4">
                By creating an account, you agree to our{' '}
                <Link href="#terms" className="text-[#E97451] hover:text-[#A0522D]">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#privacy" className="text-[#E97451] hover:text-[#A0522D]">Privacy Policy</Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}