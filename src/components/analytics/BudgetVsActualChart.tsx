import React, { useState } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import './chartConfig.ts';
import { BudgetComparisonItem, Currency } from '../../types.ts';
import { AlertCircle, CheckCircle2, SlidersHorizontal, BarChart3, Target } from 'lucide-react';

export type BudgetChartType = 'progress' | 'bar' | 'radar';

interface BudgetVsActualChartProps {
  data: BudgetComparisonItem[];
  currency: Currency;
  defaultChartType?: BudgetChartType;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({
  data,
  currency,
  defaultChartType = 'progress',
}) => {
  const [chartType, setChartType] = useState<BudgetChartType>(defaultChartType);
  const categoriesWithBudget = data.filter((item) => item.budget > 0);

  const formatAmount = (num: any) => {
    const n = typeof num === 'number' ? num : parseFloat(num) || 0;
    if (currency.code === 'INR') {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (categoriesWithBudget.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-[#8c857b] space-y-1">
        <p className="font-serif text-sm font-semibold text-[#3b3832]">No category budgets established</p>
        <span className="text-[11px] text-[#9c958b]">Set limits under Allocations to view budget utilization</span>
      </div>
    );
  }

  const totalBudgeted = categoriesWithBudget.reduce((sum, item) => sum + item.budget, 0);
  const totalSpentInBudgeted = categoriesWithBudget.reduce((sum, item) => sum + item.spent, 0);
  const overallUsed = totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0;
  const locale = currency.code === 'INR' ? 'en-IN' : undefined;

  // Comparison Bar chart data
  const barChartData = {
    labels: categoriesWithBudget.map((c) => c.category),
    datasets: [
      {
        label: 'Budget Cap',
        data: categoriesWithBudget.map((c) => c.budget),
        backgroundColor: 'rgba(181, 140, 73, 0.45)',
        borderColor: '#b58c49',
        borderWidth: 1.5,
        borderRadius: 2,
        maxBarThickness: 28,
      },
      {
        label: 'Disbursed',
        data: categoriesWithBudget.map((c) => c.spent),
        backgroundColor: categoriesWithBudget.map((c) =>
          c.spent > c.budget ? 'rgba(120, 40, 45, 0.85)' : 'rgba(27, 56, 41, 0.85)'
        ),
        borderColor: categoriesWithBudget.map((c) =>
          c.spent > c.budget ? '#78282d' : '#1b3829'
        ),
        borderWidth: 1.5,
        borderRadius: 2,
        maxBarThickness: 28,
      },
    ],
  };

  const barOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
          color: '#3b3832',
        },
      },
      tooltip: {
        backgroundColor: '#112217',
        borderColor: '#c5a265',
        borderWidth: 1,
        titleFont: { family: 'Cormorant Garamond', size: 14, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        padding: 10,
        cornerRadius: 2,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            return ` ${label}: ${currency.symbol}${Number(val).toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#3b3832',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
        },
      },
      y: {
        grid: { color: 'rgba(229, 223, 212, 0.7)' },
        ticks: {
          color: '#716c65',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value: any) =>
            `${currency.symbol}${Number(value).toLocaleString(locale)}`,
        },
        beginAtZero: true,
      },
    },
  };

  // Radar chart data
  const radarChartData = {
    labels: categoriesWithBudget.map((c) => c.category),
    datasets: [
      {
        label: 'Budget Cap',
        data: categoriesWithBudget.map((c) => c.budget),
        backgroundColor: 'rgba(181, 140, 73, 0.18)',
        borderColor: '#b58c49',
        borderWidth: 2,
        pointBackgroundColor: '#b58c49',
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
      {
        label: 'Disbursed',
        data: categoriesWithBudget.map((c) => c.spent),
        backgroundColor: 'rgba(27, 56, 41, 0.28)',
        borderColor: '#1b3829',
        borderWidth: 2,
        pointBackgroundColor: '#1b3829',
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
    ],
  };

  const radarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
          color: '#3b3832',
        },
      },
      tooltip: {
        backgroundColor: '#112217',
        borderColor: '#c5a265',
        borderWidth: 1,
        titleFont: { family: 'Cormorant Garamond', size: 14, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        padding: 10,
        cornerRadius: 2,
      },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(229, 223, 212, 0.7)' },
        grid: { color: 'rgba(229, 223, 212, 0.7)' },
        pointLabels: {
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
          color: '#3b3832',
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1c221e] font-serif tracking-wide">
            Budget vs. Actual Disbursements
          </h3>
          <p className="text-xs text-[#736e67]">Monthly allocation caps vs. real expenditure</p>
        </div>

        {/* Graph Type Switcher */}
        <div className="inline-flex items-center p-0.5 bg-[#f2ede4] border border-[#dcd4c6] rounded-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setChartType('progress')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'progress'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Detailed Progress Allocation Bars"
            aria-label="View as Progress Bars"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Progress</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Side-by-Side Comparison Bar Chart"
            aria-label="View as Bar Comparison Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('radar')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'radar'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Multi-Axis Radar Portfolio Chart"
            aria-label="View as Radar Chart"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar</span>
          </button>
        </div>
      </div>

      {chartType === 'progress' && (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-72">
          {categoriesWithBudget.map((item) => {
            const isOver = item.spent > item.budget;
            const percent = Math.min(item.percentUsed, 100);

            return (
              <div key={item.category} className="p-3 bg-[#faf8f4] rounded-xs border border-[#e8e2d7] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-[#1c221e] font-serif">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums font-mono text-[11px]">
                    <span className="text-[#6d6861]">
                      Spent: <strong className="text-[#1c221e] font-serif">{currency.symbol}{formatAmount(item.spent)}</strong>
                    </span>
                    <span className="text-[#bbb3a7]">/</span>
                    <span className="text-[#7c7871]">
                      Cap: {currency.symbol}{formatAmount(item.budget)}
                    </span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded-xs text-[10px] border ${
                        isOver
                          ? 'bg-[#faeded] text-[#6d252a] border-[#e8c1c4]'
                          : 'bg-[#edf4ee] text-[#1b3d2b] border-[#bed7c3]'
                      }`}
                    >
                      {item.percentUsed}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#e8e2d6] rounded-xs overflow-hidden">
                  <div
                    className={`h-full rounded-xs transition-all duration-500 ${
                      isOver ? 'bg-[#78282d]' : 'bg-[#1b3829]'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#736e67]">
                  <span>
                    {isOver ? (
                      <span className="text-[#78282d] font-semibold flex items-center gap-1 font-serif">
                        <AlertCircle className="w-3 h-3" />
                        Excess of {currency.symbol}{formatAmount(item.spent - item.budget)}
                      </span>
                    ) : (
                      <span className="text-[#1b3d2b] font-medium flex items-center gap-1 font-serif">
                        <CheckCircle2 className="w-3 h-3" />
                        {currency.symbol}{formatAmount(item.remaining)} remaining under cap
                      </span>
                    )}
                  </span>
                  <span className="text-[#8c857b] font-mono text-[10px]">
                    Monthly allocation
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chartType === 'bar' && (
        <div className="h-64 pt-2">
          <Bar data={barChartData} options={barOptions} />
        </div>
      )}

      {chartType === 'radar' && (
        <div className="h-64 pt-2">
          <Radar data={radarChartData} options={radarOptions} />
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#ece6db] flex items-center justify-between text-xs text-[#716c65]">
        <span className="font-serif">Portfolio Allocation Used</span>
        <span className="font-semibold text-[#1c221e] tabular-nums font-mono text-[11px]">
          {overallUsed}% of {currency.symbol}{formatAmount(totalBudgeted)}
        </span>
      </div>
    </div>
  );
};

