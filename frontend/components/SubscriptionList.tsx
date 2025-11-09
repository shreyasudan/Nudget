'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subscriptionService, RecurringCharge } from '@/lib/api';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<RecurringCharge[]>([]);
  const [grayCharges, setGrayCharges] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const [subsRes, grayRes] = await Promise.all([
        subscriptionService.getAll(),
        subscriptionService.getGrayCharges(),
      ]);
      setSubscriptions(subsRes.data);
      setGrayCharges(grayRes.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading subscriptions...</div>;

  const totalMonthly = subscriptions
    .filter(s => s.frequency_days <= 31)
    .reduce((sum, s) => sum + s.average_amount, 0);

  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="flex items-center justify-between text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>
          <span>Alerts / Insights</span>
          <span className="text-xs font-normal text-muted-foreground">
            ${totalMonthly.toFixed(2)}/month
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {grayCharges?.gray_charges?.length > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Potential Gray Charges</span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {grayCharges.gray_charges.length} subscriptions detected that might be forgotten
                (${grayCharges.potential_monthly_savings?.toFixed(2)}/month)
              </p>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{sub.merchant}</div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${sub.average_amount.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Every {sub.frequency_days} days
                    </span>
                  </div>
                  {sub.next_expected_date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Next: {format(new Date(sub.next_expected_date), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    sub.confidence_score > 0.8 ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(sub.confidence_score * 100).toFixed(0)}% confident
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}