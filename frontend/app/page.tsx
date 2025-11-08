'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingOverview, transactionService, subscriptionService, anomalyService } from '@/lib/api';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import SpendingChart from '@/components/SpendingChart';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import FileUpload from '@/components/FileUpload';
import SubscriptionList from '@/components/SubscriptionList';
import GoalTracker from '@/components/GoalTracker';

export default function Dashboard() {
  const [overview, setOverview] = useState<SpendingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [anomalySummary, setAnomalySummary] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [overviewRes, anomalyRes] = await Promise.all([
        transactionService.getOverview(),
        anomalyService.getSummary(),
      ]);
      setOverview(overviewRes.data);
      setAnomalySummary(anomalyRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async () => {
    await fetchData();
    await subscriptionService.detect();
    await anomalyService.detect();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Nudget Financial Dashboard</h1>
        <FileUpload onUploadComplete={handleFileUpload} />
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${overview?.total_income?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${overview?.total_expenses?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(overview?.net_savings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${overview?.net_savings?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {anomalySummary?.total_anomalies || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SpendingChart data={overview?.monthly_trend || []} />
        <CategoryBreakdown categories={overview?.categories || {}} />
      </div>

      {/* Subscriptions and Goals */}
      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionList />
        <GoalTracker />
      </div>
    </div>
  );
}
