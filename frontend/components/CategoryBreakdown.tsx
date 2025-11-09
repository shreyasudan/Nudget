'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronLeft } from 'lucide-react';

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
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  // Calculate total to determine percentages
  const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

  // Separate categories into main (>=10%) and small (<10%)
  const mainCategories: Array<{ name: string; value: number }> = [];
  const otherCategories: Array<{ name: string; value: number; percentage: number }> = [];
  let otherTotal = 0;

  Object.entries(categories).forEach(([name, value]) => {
    const percentage = (value / total) * 100;
    if (percentage >= 10) {
      mainCategories.push({ name, value });
    } else {
      otherTotal += value;
      otherCategories.push({
        name,
        value,
        percentage: percentage
      });
    }
  });

  // Sort other categories by value descending
  otherCategories.sort((a, b) => b.value - a.value);

  // Add "Other" category if there are small categories
  if (otherTotal > 0) {
    mainCategories.push({ name: 'Other', value: otherTotal });
  }

  // Sort by value descending
  const data = mainCategories.sort((a, b) => b.value - a.value);

  // Custom label function to handle click on Other
  const renderLabel = (entry: any) => {
    const percentage = ((entry.percent || 0) * 100).toFixed(0);
    return `${entry.name} ${percentage}%`;
  };

  // Custom tooltip to show breakdown for Other
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const isOther = data.name === 'Other';

      if (isOther && otherCategories.length > 0) {
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <p className="font-semibold mb-2">Other Categories: ${data.value.toFixed(2)}</p>
            <div className="space-y-1 text-sm">
              {otherCategories.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex justify-between gap-4">
                  <span className="text-gray-600">{cat.name}:</span>
                  <span className="font-medium">${cat.value.toFixed(2)} ({cat.percentage.toFixed(1)}%)</span>
                </div>
              ))}
              {otherCategories.length > 5 && (
                <div className="text-gray-500 text-xs mt-1">
                  +{otherCategories.length - 5} more categories
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">${data.value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // Handle pie slice click
  const handlePieClick = (data: any) => {
    if (data.name === 'Other') {
      setShowOtherDetails(true);
    }
  };

  // If showing other details, show a detailed breakdown
  if (showOtherDetails) {
    return (
      <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
        <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-[#2C1810] font-normal">Other Categories Breakdown</CardTitle>
            <button
              onClick={() => setShowOtherDetails(false)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to Overview
            </button>
          </div>
        </CardHeader>
        <CardContent className="mt-2 flex-1 bg-[#FAFAFA] rounded-lg" style={{ padding: '24px 48px' }}>
          <div className="space-y-3">
            {otherCategories.map((cat, idx) => {
              const percentage = (cat.value / otherTotal) * 100;
              const overallPercentage = cat.percentage;
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[(idx + mainCategories.length - 1) % COLORS.length] }}
                    />
                    <span className="font-medium text-[#2C1810]">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#2C1810]">${cat.value.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% of Other • {overallPercentage.toFixed(1)}% of Total
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#2C1810]">Total "Other" Categories</span>
                <div className="text-right">
                  <p className="font-bold text-lg text-[#2C1810]">${otherTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{((otherTotal / total) * 100).toFixed(1)}% of Total Spending</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-white" style={{ overflow: 'visible' }}>
      <CardHeader className="bg-white" style={{ padding: '24px 36px 8px 36px', overflow: 'visible' }}>
        <CardTitle className="text-lg text-[#2C1810] font-normal" style={{ whiteSpace: 'nowrap', overflow: 'visible', width: '100%' }}>
          This Month's Spending by Category
        </CardTitle>
        {otherCategories.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">Click "Other" to see detailed breakdown</p>
        )}
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
              label={renderLabel}
              style={{ fontSize: '11px', fill: '#2C1810', cursor: 'pointer' }}
              onClick={handlePieClick}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    outline: 'none',
                    cursor: entry.name === 'Other' ? 'pointer' : 'default'
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend with click hint for Other */}
        {otherCategories.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowOtherDetails(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[data.findIndex(d => d.name === 'Other') % COLORS.length] }} />
              View "Other" Categories ({otherCategories.length} items)
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}