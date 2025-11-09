'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryBreakdownProps {
  categories: Record<string, number>;
}

const COLORS = [
  '#D4A574', // desaturated gold
  '#8FA68E', // desaturated sage green
  '#A1887F', // warm brown
  '#C9A882', // muted gold-brown
  '#9DB89A', // soft green
  '#B89A6B', // golden brown
  '#7A9A7A', // muted olive green
  '#8B6F5E', // earthy brown
  '#A8B88A', // sage-tan
  '#9C7D6B'  // warm taupe
];

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  // Calculate total to determine percentages
  const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
  
  // Separate categories into main (>=10%) and small (<10%)
  const mainCategories: Array<{ name: string; value: number }> = [];
  let otherTotal = 0;
  
  Object.entries(categories).forEach(([name, value]) => {
    const percentage = (value / total) * 100;
    if (percentage >= 10) {
      mainCategories.push({ name, value });
    } else {
      otherTotal += value;
    }
  });
  
  // Add "Other" category if there are small categories
  if (otherTotal > 0) {
    mainCategories.push({ name: 'Other', value: otherTotal });
  }
  
  // Sort by value descending
  const data = mainCategories.sort((a, b) => b.value - a.value);

  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="mt-2 flex-1 bg-[#FAFAFA] rounded-lg">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#D4A574"
              dataKey="value"
              label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
              style={{ fontSize: '11px', fill: '#2C1810' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}