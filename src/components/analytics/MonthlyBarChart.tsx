import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import './chartConfig.ts';
import { MonthlyTrendItem, Currency } from '../../types.ts';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

export type MonthlyChartType = 'bar' | 'line' | 'area';

interface MonthlyBarChartProps {
  data: MonthlyTrendItem[];
  currency: Currency;
  height?: number;
  defaultChartType?: MonthlyChartType;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({
  data,
  currency,
  height = 280,
  defaultChartType = 'bar',
}) => {
  const [chartType, setChartType] = useState<MonthlyChartType>(defaultChartType);

  const hasData = data && data.some((item) => item.total > 0);

  if (!data || data.length === 0 || !hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-[#8c857b] space-y-1">
        <p className="font-serif text-sm font-semibold text-[#3b3832]">No historical transactions recorded</p>
        <span className="text-[11px] text-[#9c958b]">6-month distribution will appear once you record expenses</span>
      </div>
    );
  }

  const currentMonthTotal = data[data.length - 1]?.total || 0;
  const previousMonthTotal = data[data.length - 2]?.total || 0;
  const diff = currentMonthTotal - previousMonthTotal;

  // Bar dataset
  const barDataset = {
    label: 'Disbursements',
    data: data.map((item) => item.total),
    backgroundColor: data.map((_, index) =>
      index === data.length - 1 ? 'rgba(27, 56, 41, 0.92)' : 'rgba(115, 128, 120, 0.5)'
    ),
    hoverBackgroundColor: 'rgba(19, 41, 30, 1)',
    borderRadius: 2,
    borderSkipped: false,
    maxBarThickness: 42,
  };

  // Line / Area dataset
  const lineDataset = {
    label: 'Disbursements',
    data: data.map((item) => item.total),
    borderColor: '#1b3829',
    borderWidth: 2.5,
    backgroundColor: chartType === 'area' ? 'rgba(27, 56, 41, 0.18)' : 'transparent',
    fill: chartType === 'area',
    tension: 0.35,
    pointBackgroundColor: '#fbf9f5',
    pointBorderColor: '#1b3829',
    pointBorderWidth: 2.5,
    pointRadius: 5,
    pointHoverRadius: 7,
    pointHoverBackgroundColor: '#c5a265',
    pointHoverBorderColor: '#112217',
    pointHoverBorderWidth: 2,
  };

  const chartData = {
    labels: data.map((item) => item.shortLabel),
    datasets: [chartType === 'bar' ? barDataset : lineDataset],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
        displayColors: false,
        callbacks: {
          title: (items: any) => {
            const index = items[0]?.dataIndex;
            return data[index]?.label || '';
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const item = data[index];
            const locale = currency.code === 'INR' ? 'en-IN' : undefined;
            const formatted = `${currency.symbol}${context.parsed.y.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            return [`Disbursed: ${formatted}`, `Entries: ${item?.count || 0}`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#716c65',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' },
        },
      },
      y: {
        grid: {
          color: 'rgba(229, 223, 212, 0.7)',
        },
        ticks: {
          color: '#716c65',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value: any) =>
            `${currency.symbol}${Number(value).toLocaleString(currency.code === 'INR' ? 'en-IN' : undefined)}`,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1c221e] font-serif tracking-wide">
            Monthly Disbursement Trend
          </h3>
          <p className="text-xs text-[#736e67]">6-Month chronological expenditure trajectory</p>
        </div>

        {/* Graph Type Switcher Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-[#f2ede4] border border-[#dcd4c6] rounded-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                  : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
              }`}
              title="Column Bar Chart"
              aria-label="View as Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                  : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
              }`}
              title="Trend Line Chart"
              aria-label="View as Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                  : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
              }`}
              title="Shaded Area Chart"
              aria-label="View as Area Chart"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
          </div>

          <div className="text-right pl-2 border-l border-[#e5dfd4] hidden sm:block">
            <span className="text-[10px] text-[#736e67] font-serif uppercase tracking-wider block">Current</span>
            <div className="text-xs font-bold text-[#1c221e] tabular-nums font-mono">
              {currency.symbol}
              {Number(currentMonthTotal || 0).toLocaleString(currency.code === 'INR' ? 'en-IN' : undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height }}>
        {chartType === 'bar' ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[#ece6db] flex items-center justify-between text-xs text-[#716c65]">
        <span className="font-serif text-[11px]">Historical Interval (6 Mos)</span>
        <span className="font-medium text-[#2c332e] tabular-nums font-mono text-[11px]">
          MoM Delta: {diff >= 0 ? `+${currency.symbol}${diff.toFixed(2)}` : `-${currency.symbol}${Math.abs(diff).toFixed(2)}`}
        </span>
      </div>
    </div>
  );
};

