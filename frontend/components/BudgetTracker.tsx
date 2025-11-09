'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { budgetService, BudgetUsage } from '@/lib/api';
import { Plus } from 'lucide-react';

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

export default function BudgetTracker() {
  const [budgets, setBudgets] = useState<BudgetUsage[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading budgets...</div>;

  const topBudgets = budgets.slice(0, 4);

  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="flex items-center justify-between text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>
          <span>Budgets</span>
          <Link
            href="/dashboard/budgets"
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="View all budgets"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1" style={{ padding: '16px 36px 24px 36px' }}>
        {/* Summary */}
        {budgets.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500">
              {budgets.length} active budget{budgets.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Compact Budgets List */}
        <div className="space-y-4">
          {topBudgets.length > 0 ? (
            topBudgets.map((budget) => {
              const percentUsed = Math.min(budget.percent_used, 100);
              const isOverBudget = budget.percent_used > 100;
              const remaining = budget.remaining_amount;
              
              return (
                <div key={budget.budget_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCategory(budget.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ${Math.abs(remaining).toFixed(2)} {remaining >= 0 ? 'left' : 'over'} / ${budget.budgeted_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-1.5 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No budgets yet. <Link href="/dashboard/budgets" className="text-[#E97451] hover:underline">Create one</Link></p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

