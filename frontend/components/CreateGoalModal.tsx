'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { goalService, Goal } from '@/lib/api';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGoal?: Goal | null;
}

export default function CreateGoalModal({ isOpen, onClose, onSuccess, editingGoal }: CreateGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        target_amount: editingGoal.target_amount.toString(),
        deadline: editingGoal.deadline.split('T')[0], // Extract date part from ISO string
        description: editingGoal.description || ''
      });
    } else {
      setFormData({
        name: '',
        target_amount: '',
        deadline: '',
        description: ''
      });
    }
    setErrors({});
    setError(null);
  }, [editingGoal, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!editingGoal && !formData.name.trim()) {
      newErrors.name = 'Please enter a goal name.';
    }

    const targetAmount = parseFloat(formData.target_amount);
    if (isNaN(targetAmount) || targetAmount < 0.50) {
      newErrors.target_amount = 'Please enter a target amount of at least $0.50.';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Please choose a deadline.';
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingGoal) {
        await goalService.update(editingGoal.id, {
          target_amount: parseFloat(formData.target_amount),
          deadline: new Date(formData.deadline).toISOString(),
          description: formData.description.trim() || undefined
        });
      } else {
        await goalService.create({
          name: formData.name.trim(),
          target_amount: parseFloat(formData.target_amount),
          deadline: new Date(formData.deadline).toISOString(),
          description: formData.description.trim() || undefined
        });
      }
      
      setFormData({ name: '', target_amount: '', deadline: '', description: '' });
      setErrors({});
      setError(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.message
        || error.message
        || 'Failed to create goal. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', target_amount: '', deadline: '', description: '' });
    setErrors({});
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4" style={{ padding: '40px' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">Goal Name</label>
            <input
              type="text"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ''});
              }}
              disabled={!!editingGoal}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-0.5">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">Target Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.target_amount}
              onChange={(e) => {
                setFormData({...formData, target_amount: e.target.value});
                if (errors.target_amount) setErrors({...errors, target_amount: ''});
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
              step="0.50"
              min="0.50"
            />
            {errors.target_amount && (
              <p className="text-xs text-red-600 mt-0.5">{errors.target_amount}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => {
                setFormData({...formData, deadline: e.target.value});
                if (errors.deadline) setErrors({...errors, deadline: ''});
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
            />
            {errors.deadline && (
              <p className="text-xs text-red-600 mt-0.5">{errors.deadline}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900">Description (optional)</label>
            <textarea
              placeholder="Add a description for this goal"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-medium text-[#228B22] hover:text-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (editingGoal ? 'Updating...' : 'Creating...') : (editingGoal ? 'Update goal' : 'Create goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

