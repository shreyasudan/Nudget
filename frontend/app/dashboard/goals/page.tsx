'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreateGoalModal from '@/components/CreateGoalModal';
import { Plus, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { goalService, Goal } from '@/lib/api';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [addingMoneyTo, setAddingMoneyTo] = useState<number | null>(null);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalService.getAll();
      setGoals(response.data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (goalId: number) => {
    const amount = parseFloat(moneyAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    try {
      await goalService.updateProgress(goalId, amount);
      setMoneyAmount('');
      setAddingMoneyTo(null);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to add money:', error);
    }
  };

  const handleDelete = async (goalId: number) => {
    try {
      await goalService.delete(goalId);
      setDeleteConfirm(null);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
              <p className="text-sm text-gray-500">Set savings goals and track progress over time.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-amber-600 hover:underline text-sm font-medium"
            >
              + Add goal
            </button>
          </div>

          {/* Create/Edit Goal Modal */}
          <CreateGoalModal
            isOpen={showAddModal || !!editingGoal}
            onClose={() => {
              setShowAddModal(false);
              setEditingGoal(null);
            }}
            onSuccess={fetchGoals}
            editingGoal={editingGoal}
          />

          {/* Goal Cards */}
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" style={{ marginTop: '0' }}>
              {goals.map((goal) => {
                const percentComplete = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                const isAddingMoney = addingMoneyTo === goal.id;
                const isDeleting = deleteConfirm === goal.id;
                
                return (
                  <div
                    key={goal.id}
                    className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                    style={{ padding: '32px' }}
                  >
                    {/* Goal Name */}
                    <h3 className="text-lg font-semibold text-gray-900" style={{ marginBottom: '16px' }}>{goal.name}</h3>
                    
                    {/* Saved Amount with goal target */}
                    <p className="text-2xl font-bold text-gray-900" style={{ marginBottom: '12px' }}>
                      ${goal.current_amount.toFixed(2)} <span className="text-sm font-normal text-gray-600">of ${goal.target_amount.toFixed(2)} goal</span>
                    </p>
                    
                    {/* Progress and days */}
                    <p className="text-sm text-gray-600" style={{ marginBottom: '20px' }}>
                      {percentComplete.toFixed(1)}% complete
                      <span className="mx-1 text-gray-400">•</span>
                      {goal.days_remaining} days left
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-gray-200" style={{ marginBottom: '20px' }}>
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>

                    {/* Add Money Input (when active) */}
                    {isAddingMoney && (
                      <div className="flex flex-wrap gap-3 items-center" style={{ marginTop: '24px' }}>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={moneyAmount}
                          onChange={(e) => setMoneyAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddMoney(goal.id);
                            } else if (e.key === 'Escape') {
                              setAddingMoneyTo(null);
                              setMoneyAmount('');
                            }
                          }}
                          className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
                          style={{ minWidth: '120px' }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddMoney(goal.id)}
                          className="text-sm text-amber-600 hover:underline font-medium whitespace-nowrap"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingMoneyTo(null);
                            setMoneyAmount('');
                          }}
                          className="text-sm text-gray-600 hover:underline whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Actions Row - Inline text links */}
                    {!isAddingMoney && !isDeleting && (
                      <div className="flex gap-4 text-sm" style={{ marginTop: '24px' }}>
                        <button
                          onClick={() => {
                            setAddingMoneyTo(goal.id);
                            setMoneyAmount('');
                          }}
                          className="text-amber-600 hover:underline font-medium"
                        >
                          $ Add money
                        </button>
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="text-gray-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(goal.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Delete Confirmation */}
                    {isDeleting && (
                      <div className="flex gap-2 items-center mt-3">
                        <span className="text-sm text-gray-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-sm text-gray-600 hover:underline"
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
            <div className="text-center py-16 mt-8">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first savings goal to start tracking your progress.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-amber-600 hover:underline text-sm font-medium"
                >
                  + Add goal
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
