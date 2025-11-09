'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateGoalModal from '@/components/CreateGoalModal';
import { goalService, Goal } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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

  if (loading) return <div>Loading goals...</div>;

  const activeGoals = goals.filter(g => g.is_active);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const topGoals = activeGoals.slice(0, 4);

  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="flex items-center justify-between text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>
          <span>Goals</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Add goal"
          >
            <Plus className="h-4 w-4 text-gray-600" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1" style={{ padding: '16px 36px 24px 36px' }}>
        {/* Create Goal Modal */}
        <CreateGoalModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchGoals}
        />

        {/* Summary */}
        {activeGoals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500">
              {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''} · ${totalSaved.toFixed(2)} saved of ${totalTarget.toFixed(2)}
            </p>
          </div>
        )}

        {/* Compact Goals List */}
        <div className="space-y-4">
          {topGoals.length > 0 ? (
            topGoals.map((goal) => {
              const percentComplete = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{goal.name}</span>
                    <span className="text-xs text-gray-500">
                      ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No goals yet. Click + to add your first goal!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
