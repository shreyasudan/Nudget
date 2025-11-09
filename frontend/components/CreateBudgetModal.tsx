'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { budgetService, BudgetUsage } from '@/lib/api';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBudget?: BudgetUsage | null;
}

const CATEGORY_OPTIONS = [
  { value: 'Overall', label: 'Overall' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transport', label: 'Transportation' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'Other', label: 'Other' }
];

export default function CreateBudgetModal({
  isOpen,
  onClose,
  onSuccess,
  editingBudget
}: CreateBudgetModalProps) {
  const [formData, setFormData] = useState({
    category: '',
    amount_monthly: '',
    currency: 'USD'
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category || '',
        amount_monthly: editingBudget.budgeted_amount.toString(),
        currency: 'USD'
      });
    } else {
      setFormData({
        category: '',
        amount_monthly: '',
        currency: 'USD'
      });
    }
    setError(null);
  }, [editingBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validation
    const amount = parseFloat(formData.amount_monthly);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid monthly budget amount');
      setSubmitting(false);
      return;
    }

    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.budget_id, {
          amount_monthly: amount
        });
      } else {
        await budgetService.create({
          category: formData.category === 'Overall' ? undefined : formData.category,
          amount_monthly: amount,
          currency: formData.currency
        });
      }

      // Reset form
      setFormData({
        category: '',
        amount_monthly: '',
        currency: 'USD'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create budget:', error);
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.message
        || error.message
        || 'Failed to create budget. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      category: '',
      amount_monthly: '',
      currency: 'USD'
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleReset}
    >
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4"
        style={{ padding: '40px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{editingBudget ? 'Edit Budget' : 'Create New Budget'}</h2>
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              disabled={!!editingBudget}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#E97451] focus:ring-[#E97451] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="" disabled>Select a category</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose "Overall" for your total monthly budget
            </p>
          </div>

          {/* Monthly Amount */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">
              Monthly Budget Amount
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.amount_monthly}
              onChange={(e) => setFormData({...formData, amount_monthly: e.target.value})}
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E97451] focus:ring-[#E97451] focus:outline-none"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          {/* Currency (Hidden but included for future use) */}
          <input type="hidden" value={formData.currency} />

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-medium text-[#E97451] hover:text-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (editingBudget ? 'Updating...' : 'Creating...') : (editingBudget ? 'Update Budget' : 'Create Budget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}