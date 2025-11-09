'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateBudgetModal from '@/components/CreateBudgetModal';
import { budgetService, BudgetUsage } from '@/lib/api';

// Helper function to format category for display
const formatCategory = (category: string | null | undefined): string => {
  if (!category) return 'Overall';
  
  const categoryMap: Record<string, string> = {
    'grocery': 'Grocery',
    'restaurant': 'Restaurant',
    'utilities': 'Utilities',
    'transport': 'Transportation',
    'shopping': 'Shopping',
    'entertainment': 'Entertainment',
    'healthcare': 'Healthcare',
    'fitness': 'Fitness',
    'subscription': 'Subscription',
    'Other': 'Other'
  };
  
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetUsage | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await budgetService.getUsage();
      setBudgets(response.data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budgetId: string) => {
    try {
      await budgetService.delete(budgetId);
      setDeleteConfirm(null);
      await fetchBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };


  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E97451]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8" style={{ paddingLeft: '60px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '32px' }}>
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: '28px' }}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
              <p className="text-sm text-gray-500">Set monthly budgets to manage your spending by category.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-amber-600 hover:underline text-sm font-medium"
            >
              + New Budget
            </button>
          </div>

          {/* Create/Edit Budget Modal */}
          <CreateBudgetModal
            isOpen={showAddModal || !!editingBudget}
            onClose={() => {
              setShowAddModal(false);
              setEditingBudget(null);
            }}
            onSuccess={fetchBudgets}
            editingBudget={editingBudget}
          />

          {/* Budget Cards */}
          {budgets.length > 0 ? (
            <div className="flex flex-col gap-6" style={{ marginTop: '0' }}>
              {budgets.map((budget) => {
                const percentUsed = Math.min(budget.percent_used, 100);
                const isOverBudget = budget.percent_used > 100;
                const remaining = budget.remaining_amount;
                const isDeleting = deleteConfirm === budget.budget_id;

                return (
                  <div
                    key={budget.budget_id}
                    className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                    style={{ padding: '32px' }}
                  >
                    {/* Category Name */}
                    <h3 className="text-lg font-semibold text-gray-900" style={{ marginBottom: '16px' }}>
                      {formatCategory(budget.category)}
                    </h3>
                    
                    {/* Spent/Remaining Amount */}
                    <p className="text-2xl font-bold text-gray-900" style={{ marginBottom: '12px' }}>
                      ${Math.abs(remaining).toFixed(2)} <span className="text-sm font-normal text-gray-600">{remaining >= 0 ? 'left' : 'over'} / ${budget.budgeted_amount.toFixed(2)}</span>
                    </p>
                    
                    {/* Percentage and Status */}
                    <p className="text-sm text-gray-600" style={{ marginBottom: '20px' }}>
                      {percentUsed.toFixed(1)}% used
                      {isOverBudget && (
                        <>
                          <span className="mx-1 text-gray-400">•</span>
                          <span className="text-red-500">Over budget</span>
                        </>
                      )}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-gray-200" style={{ marginBottom: '20px' }}>
                      <div
                        className={`h-2 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>

                    {/* Actions Row - Inline text links */}
                    {!isDeleting ? (
                      <div className="flex gap-4 text-sm" style={{ marginTop: '24px' }}>
                        <button
                          onClick={() => setEditingBudget(budget)}
                          className="text-amber-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          className="text-gray-600 hover:underline"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(budget.budget_id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center text-sm" style={{ marginTop: '24px' }}>
                        <span className="text-gray-600">Delete this budget?</span>
                        <button
                          onClick={() => handleDelete(budget.budget_id)}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first budget to start tracking your spending by category.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-amber-600 hover:underline text-sm font-medium"
                >
                  + New Budget
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
