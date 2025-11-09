'use client';

import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import SubscriptionList from '@/components/SubscriptionList';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CreditCard, AlertCircle } from 'lucide-react';

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-charcoal">Subscriptions</h1>
              <p className="text-gray mt-1">Manage your recurring payments and services</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray">Active Subscriptions</p>
                <CreditCard className="h-5 w-5 text-teal" />
              </div>
              <p className="text-2xl font-bold text-charcoal">12</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray">Monthly Total</p>
                <CreditCard className="h-5 w-5 text-amber" />
              </div>
              <p className="text-2xl font-bold text-charcoal">$287.94</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray">Unused Services</p>
                <AlertCircle className="h-5 w-5 text-coral" />
              </div>
              <p className="text-2xl font-bold text-charcoal">3</p>
            </motion.div>
          </div>

          <SubscriptionList />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-teal to-amber rounded-2xl p-6 text-white"
          >
            <h3 className="text-xl font-bold mb-2">💡 Smart Tip</h3>
            <p>
              You haven't used 3 subscriptions in the last 30 days. Consider canceling them to save $45/month.
            </p>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}