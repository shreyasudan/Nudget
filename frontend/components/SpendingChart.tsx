'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SpendingChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export default function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>Monthly Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent className="mt-2 flex-1 bg-[#FAFAFA] rounded-lg">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB"
              strokeOpacity={0.5}
            />
            <XAxis 
              dataKey="month" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip 
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{ 
                fontSize: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#7CB342"
              name="Income"
              strokeWidth={2.5}
              dot={{ fill: '#7CB342', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#E67E5F"
              name="Expenses"
              strokeWidth={2.5}
              dot={{ fill: '#E67E5F', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}