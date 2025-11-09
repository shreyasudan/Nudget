'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@nudget.com');
    setPassword('demo1234');
    setError('');
    setIsLoading(true);

    try {
      await login('demo@nudget.com', 'demo1234');
      router.push('/dashboard');
    } catch (err: any) {
      setError('Demo account not found. Please run create_demo_user.py in the backend.');
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
                Welcome Back!
              </h2>
              <p className="text-[#2C1810]/70">
                Log in to your personal finance coach
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 px-4 py-3 text-sm text-[#2C1810] placeholder:text-gray-400 focus:outline-none focus:border-[#E97451] focus:ring-1 focus:ring-[#E97451]"
                  placeholder="Enter your password"
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
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#2C1810]/60">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-3 px-4 text-sm font-medium text-[#2C1810] border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Try Demo Account
                </button>
              </div>

              <p className="text-center text-sm text-[#2C1810]/70">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-[#E97451] hover:text-[#A0522D] transition-colors">
                  Sign up for free
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}