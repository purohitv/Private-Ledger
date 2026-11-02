import React, { useState } from 'react';
import { Doughnut, Pie, PolarArea, Bar } from 'react-chartjs-2';
import './chartConfig.ts';
import { CategoryBreakdownItem, Currency } from '../../types.ts';
import { Disc, PieChart as PieIcon, Compass, AlignLeft } from 'lucide-react';

export type CategoryChartType = 'doughnut' | 'pie' | 'polarArea' | 'bar';

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  currency: Currency;
  totalExpenses: number;
  defaultChartType?: CategoryChartType;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  currency,
  totalExpenses,
  defaultChartType = 'doughnut',
}) => {
  const [chartType, setChartType] = useState<CategoryChartType>(defaultChartType);
  const activeCategories = data.filter((item) => item.total > 0);

  if (activeCategories.length === 0 || totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-[#8c857b] space-y-1">
        <p className="font-serif text-sm font-semibold text-[#3b3832]">No category disbursements recorded</p>
        <span className="text-[11px] text-[#9c958b]">Allocation distribution will appear as entries are logged</span>
      </div>
    );
  }

  const locale = currency.code === 'INR' ? 'en-IN' : undefined;

  // Circular / Polar chart data
  const circularChartData = {
    labels: activeCategories.map((c) => c.category),
    datasets: [
      {
        data: activeCategories.map((c) => c.total),
        backgroundColor: activeCategories.map((c) => c.color || '#1f3d2b'),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  // Horizontal bar data
  const barChartData = {
    labels: activeCategories.map((c) => c.category),
    datasets: [
      {
        label: 'Disbursed',
        data: activeCategories.map((c) => c.total),
        backgroundColor: activeCategories.map((c) => c.color || '#1f3d2b'),
        borderRadius: 2,
        borderSkipped: false,
        maxBarThickness: 24,
      },
    ],
  };

  const circularOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: chartType === 'doughnut' ? '70%' : 0,
    plugins: {
      legend: {
        display: false,
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
            const index = context.dataIndex;
            const item = activeCategories[index];
            const amountStr = `${currency.symbol}${item.total.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            return ` ${item.category}: ${amountStr} (${item.percentage}%)`;
          },
        },
      },
    },
    scales:
      chartType === 'polarArea'
        ? {
            r: {
              grid: { color: 'rgba(229, 223, 212, 0.7)' },
              ticks: { display: false },
            },
          }
        : undefined,
  };

  const barOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
            const index = context.dataIndex;
            const item = activeCategories[index];
            const amountStr = `${currency.symbol}${item.total.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            return ` ${item.category}: ${amountStr} (${item.percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(229, 223, 212, 0.7)' },
        ticks: {
          color: '#716c65',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value: any) =>
            `${currency.symbol}${Number(value).toLocaleString(locale)}`,
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#3b3832',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
        },
      },
    },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1c221e] font-serif tracking-wide">
            Portfolio Allocation
          </h3>
          <p className="text-xs text-[#736e67]">Distribution across categories</p>
        </div>

        {/* Graph Type Switcher */}
        <div className="inline-flex items-center p-0.5 bg-[#f2ede4] border border-[#dcd4c6] rounded-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setChartType('doughnut')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'doughnut'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Doughnut Ring Chart"
            aria-label="View as Doughnut Chart"
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Donut</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'pie'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Solid Pie Chart"
            aria-label="View as Pie Chart"
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pie</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('polarArea')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'polarArea'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Polar Radial Area Chart"
            aria-label="View as Polar Area Chart"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Polar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Horizontal Ranking Bar Chart"
            aria-label="View as Bar Chart"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rank</span>
          </button>
        </div>
      </div>

      <div className="relative h-56 flex items-center justify-center">
        {chartType === 'doughnut' && (
          <>
            <Doughnut data={circularChartData} options={circularOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c7871]">Total</span>
              <span className="text-base font-bold text-[#1c221e] tabular-nums font-serif">
                {currency.symbol}
                {Number(totalExpenses || 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </>
        )}
        {chartType === 'pie' && <Pie data={circularChartData} options={circularOptions} />}
        {chartType === 'polarArea' && <PolarArea data={circularChartData} options={circularOptions} />}
        {chartType === 'bar' && <Bar data={barChartData} options={barOptions} />}
      </div>

      {/* Category distribution list */}
      <div className="mt-4 space-y-2 max-h-44 overflow-y-auto pr-1 divide-y divide-[#f5f1ea]">
        {activeCategories.slice(0, 6).map((cat) => (
          <div key={cat.category} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[#2c332e] font-serif truncate">{cat.category}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 tabular-nums font-mono text-[11px]">
              <span className="text-[#7c7871]">{cat.percentage}%</span>
              <span className="font-semibold text-[#1c221e]">
                {currency.symbol}
                {Number(cat.total || 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

