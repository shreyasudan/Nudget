'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TransactionTable from '@/components/TransactionTable';
import TransactionFilters from '@/components/TransactionFilters';
import { Receipt, Download, Filter } from 'lucide-react';
import { transactionService } from '@/lib/api';

export default function TransactionsPage() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-charcoal">Transactions</h1>
              <p className="text-gray mt-1">View and manage all your financial transactions</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border-2 border-teal text-teal rounded-xl hover:bg-teal hover:text-white transition-all duration-200 flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-amber text-white rounded-xl hover:bg-coral transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export
              </motion.button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <TransactionFilters />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <TransactionTable />
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}