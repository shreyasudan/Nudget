'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import SpendingChart from '@/components/SpendingChart';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import GoalTracker from '@/components/GoalTracker';
import BudgetTracker from '@/components/BudgetTracker';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SpendingOverview, transactionService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [overview, setOverview] = useState<SpendingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const overviewRes = await transactionService.getOverview();
      setOverview(overviewRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8" style={{ paddingLeft: 'clamp(2rem, 5vw, 4rem)' }}>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-[#2C1810]">Dashboard</h1>
            <p className="text-[#2C1810]/70 mt-1">Welcome back, {user?.name || user?.email}</p>
          </div>

          {/* Overview Cards - Make numbers more dominant */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#2C1810]/70 uppercase tracking-wide">Total Income</p>
                  <DollarSign className="h-5 w-5 text-[#E97451]" />
                </div>
                <p className="text-4xl font-bold text-black">
                  ${overview?.total_income?.toFixed(2) || '0.00'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#2C1810]/70 uppercase tracking-wide">Total Expenses</p>
                  <TrendingDown className="h-5 w-5 text-[#E97451]" />
                </div>
                <p className="text-4xl font-bold text-black">
                  ${overview?.total_expenses?.toFixed(2) || '0.00'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#2C1810]/70 uppercase tracking-wide">Net Savings</p>
                  <TrendingUp className="h-5 w-5 text-[#E97451]" />
                </div>
                <p className="text-4xl font-bold text-black">
                  ${overview?.net_savings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Spacing between summary cards and charts */}
          <div className="h-12"></div>

          {/* Charts Section - Fixed alignment and spacing */}
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="h-full"
            >
              <SpendingChart data={overview?.monthly_trend || []} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="h-full"
            >
              <CategoryBreakdown categories={overview?.current_month_categories || overview?.categories || {}} />
            </motion.div>
          </div>

          {/* Spacing between charts and bottom cards */}
          <div className="h-12"></div>

          {/* Goals and Budgets */}
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="h-full"
            >
              <GoalTracker />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="h-full"
            >
              <BudgetTracker />
            </motion.div>
          </div>

          {/* Bottom padding */}
          <div className="h-16"></div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}