'use client';

export default function DashboardPreview() {
  // Mock data for preview
  const income = 5420;
  const expenses = 3280;
  const netSavings = 2140;
  const savingsPercent = (netSavings / income) * 100;
  const expensesPercent = (expenses / income) * 100;

  const goalCurrent = 3200;
  const goalTarget = 5000;
  const goalPercent = Math.round((goalCurrent / goalTarget) * 100);

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-visible" style={{ padding: '0' }}>
      {/* Top summary row */}
      <div className="flex justify-between border-b border-gray-100" style={{ padding: '32px 40px' }}>
        <div style={{ minWidth: '120px' }}>
          <p className="text-xs uppercase tracking-wide text-gray-500" style={{ marginBottom: '12px' }}>Income this month</p>
          <p className="text-2xl font-bold text-black">${income.toLocaleString()}</p>
        </div>
        <div style={{ minWidth: '120px', textAlign: 'center' }}>
          <p className="text-xs uppercase tracking-wide text-gray-500" style={{ marginBottom: '12px' }}>Expenses this month</p>
          <p className="text-2xl font-bold text-black">${expenses.toLocaleString()}</p>
        </div>
        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          <p className="text-xs uppercase tracking-wide text-gray-500" style={{ marginBottom: '12px' }}>Net savings</p>
          <p className="text-2xl font-bold text-black">${netSavings.toLocaleString()}</p>
        </div>
      </div>

      {/* First green progress bar */}
      <div className="border-b border-gray-100" style={{ padding: '40px 40px' }}>
        <p className="text-sm text-gray-600" style={{ marginBottom: '20px' }}>This month</p>
        <div className="h-1.5 rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${savingsPercent}%` }} />
        </div>
      </div>

      {/* Red progress bar */}
      <div className="border-b border-gray-100" style={{ padding: '40px 40px' }}>
        <p className="text-sm text-gray-600" style={{ marginBottom: '20px' }}>Budget Usage</p>
        <div className="h-1.5 rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${expensesPercent}%` }} />
        </div>
      </div>

      {/* Single goal - green bar */}
      <div style={{ padding: '40px 40px' }}>
        <div className="flex items-center justify-between text-sm" style={{ marginBottom: '20px' }}>
          <span className="font-medium text-gray-800">Emergency Fund</span>
          <span className="font-semibold text-emerald-600">{goalPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${goalPercent}%` }} />
        </div>
      </div>
    </div>
  );
}

