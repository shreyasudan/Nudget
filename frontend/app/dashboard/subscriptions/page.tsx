'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

interface RecurringCharge {
  id: number;
  merchant: string;
  average_amount: number;
  frequency_days: number;
  last_charge_date: string;
  next_expected_date: string;
  category: string;
  is_active: boolean;
  confidence_score: number;
}

interface GrayCharge {
  merchant: string;
  average_amount: number;
  frequency_days: number;
  last_charge_date: string;
  next_expected_date: string;
  reasons: string[];
  confidence_score: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<RecurringCharge[]>([]);
  const [grayCharges, setGrayCharges] = useState<GrayCharge[]>([]);
  const [totalMonthlySpend, setTotalMonthlySpend] = useState(0);
  const [potentialSavings, setPotentialSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchGrayCharges();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get<RecurringCharge[]>('/api/subscriptions');
      setSubscriptions(response.data);

      // Calculate total monthly spend
      const monthly = response.data
        .filter(sub => sub.frequency_days <= 31)
        .reduce((sum, sub) => sum + sub.average_amount, 0);
      setTotalMonthlySpend(monthly);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrayCharges = async () => {
    try {
      const response = await api.get<{
        gray_charges: GrayCharge[];
        total: number;
        potential_monthly_savings: number;
      }>('/api/subscriptions/gray-charges');

      setGrayCharges(response.data.gray_charges);
      setPotentialSavings(response.data.potential_monthly_savings);
    } catch (error) {
      console.error('Failed to fetch gray charges:', error);
    }
  };

  const handleDetectSubscriptions = async () => {
    setDetecting(true);
    try {
      await api.post('/api/subscriptions/detect');
      await fetchSubscriptions();
      await fetchGrayCharges();
    } catch (error) {
      console.error('Failed to detect subscriptions:', error);
    } finally {
      setDetecting(false);
    }
  };

  const formatFrequency = (days: number) => {
    if (days <= 7) return 'Weekly';
    if (days <= 14) return 'Bi-weekly';
    if (days <= 31) return 'Monthly';
    if (days <= 92) return 'Quarterly';
    if (days <= 186) return 'Semi-annually';
    if (days <= 366) return 'Annually';
    return `Every ${days} days`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilNext = (nextDate: string) => {
    const next = new Date(nextDate);
    const now = new Date();
    const diffInDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E97451]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8 space-y-8" style={{ paddingLeft: '60px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '32px' }}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#2C1810]">Subscriptions & Recurring Charges</h1>
              <p className="text-[#2C1810]/70 mt-1">
                Track and manage your recurring payments
              </p>
            </div>
            <button
              onClick={handleDetectSubscriptions}
              disabled={detecting}
              className="flex items-center gap-2 text-[#E97451] hover:text-[#D86441] transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
              {detecting ? 'Detecting...' : 'Detect Subscriptions'}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3" style={{ marginBottom: '48px' }}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <CreditCard className="w-5 h-5 text-[#E97451]" />
              </div>
              <p className="text-2xl font-bold text-[#2C1810]">{subscriptions.length}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
                <DollarSign className="w-5 h-5 text-[#E97451]" />
              </div>
              <p className="text-2xl font-bold text-[#2C1810]">${totalMonthlySpend.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">${potentialSavings.toFixed(2)}</p>
            </div>
          </div>

          {/* Gray Charges Alert */}
          {grayCharges.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" style={{ marginTop: '48px', marginBottom: '48px' }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Review These Subscriptions</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    We've identified {grayCharges.length} subscription{grayCharges.length !== 1 ? 's' : ''} you might want to review.
                    These could be forgotten or underused services.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions List */}
          {subscriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#2C1810]">Detected Subscriptions</h2>
              </div>
              <div className="px-6 py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recurring charges detected yet.</p>
                <button
                  onClick={handleDetectSubscriptions}
                  className="mt-3 text-[#E97451] hover:underline"
                >
                  Run Detection
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-[#2C1810] mb-6">Detected Subscriptions</h2>
              <div className="flex flex-col gap-6" style={{ marginTop: '0' }}>
                {subscriptions.map((subscription) => {
                  const daysUntil = getDaysUntilNext(subscription.next_expected_date);
                  const isGray = grayCharges.some(gc => gc.merchant === subscription.merchant);

                  return (
                    <div
                      key={subscription.id}
                      className={`rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition ${isGray ? 'bg-yellow-50/50' : ''}`}
                      style={{ padding: '32px' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-[#2C1810]">{subscription.merchant}</h3>
                            {isGray && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                Review
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatFrequency(subscription.frequency_days)}
                            </span>
                            <span>Category: {subscription.category}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(subscription.confidence_score)}`}>
                              {Math.round(subscription.confidence_score * 100)}% confident
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#2C1810]">${subscription.average_amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {daysUntil === 0 ? (
                              <span className="text-red-600">Due today</span>
                            ) : daysUntil === 1 ? (
                              <span className="text-orange-600">Due tomorrow</span>
                            ) : daysUntil <= 3 ? (
                              <span className="text-yellow-600">Due in {daysUntil} days</span>
                            ) : (
                              <span>Next: {formatDate(subscription.next_expected_date)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {isGray && (
                        <div className="mt-3 text-sm text-yellow-700">
                          {grayCharges.find(gc => gc.merchant === subscription.merchant)?.reasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-yellow-500">•</span>
                              {reason}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Payments */}
          {subscriptions.filter(sub => {
            const days = getDaysUntilNext(sub.next_expected_date);
            return days >= 0 && days <= 7;
          }).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#2C1810] mb-6">Upcoming Payments (Next 7 Days)</h2>
              <div className="flex flex-col gap-6" style={{ marginTop: '0' }}>
                {subscriptions
                  .filter(sub => {
                    const days = getDaysUntilNext(sub.next_expected_date);
                    return days >= 0 && days <= 7;
                  })
                  .sort((a, b) => getDaysUntilNext(a.next_expected_date) - getDaysUntilNext(b.next_expected_date))
                  .map((subscription) => {
                    const daysUntil = getDaysUntilNext(subscription.next_expected_date);

                    return (
                      <div
                        key={`upcoming-${subscription.id}`}
                        className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                        style={{ padding: '32px' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className={`w-5 h-5 ${daysUntil <= 1 ? 'text-red-500' : daysUntil <= 3 ? 'text-yellow-500' : 'text-gray-400'}`} />
                            <div>
                              <p className="font-medium text-[#2C1810]">{subscription.merchant}</p>
                              <p className="text-sm text-gray-600">
                                {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-[#2C1810]">${subscription.average_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}