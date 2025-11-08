'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { goalService, Goal } from '@/lib/api';
import { Plus, Target, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    description: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalService.create({
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        deadline: new Date(formData.deadline).toISOString(),
        description: formData.description || undefined
      });
      setFormData({ name: '', target_amount: '', deadline: '', description: '' });
      setShowAddForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await goalService.delete(id);
      fetchGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleAddProgress = async (id: number, amount: string) => {
    const value = parseFloat(amount);
    if (!isNaN(value) && value > 0) {
      try {
        await goalService.updateProgress(id, value);
        fetchGoals();
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  if (loading) return <div>Loading goals...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Financial Goals</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mb-4 p-4 border rounded-lg">
            <input
              type="text"
              placeholder="Goal name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Target amount"
              value={formData.target_amount}
              onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border rounded"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add Goal
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {goal.days_remaining} days left
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Add amount"
                    className="flex-1 p-1 border rounded text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddProgress(goal.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {goal.progress_percentage.toFixed(1)}% complete
                  </span>
                </div>
              </div>
            </div>
          ))}

          {goals.length === 0 && !showAddForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No goals yet. Click + to add your first goal!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}