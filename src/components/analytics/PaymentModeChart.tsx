import React, { useState } from 'react';
import { Doughnut, Pie, Bar } from 'react-chartjs-2';
 import './chartConfig.ts';
import { PaymentMethodBreakdownItem, Currency } from '../../types.ts';
import { Smartphone, Banknote, CreditCard, Building2, Disc, PieChart as PieIcon, BarChart3 } from 'lucide-react';

export type PaymentChartType = 'doughnut' | 'pie' | 'bar';

interface PaymentModeChartProps {
  data: PaymentMethodBreakdownItem[];
  currency: Currency;
  totalExpenses: number;
  defaultChartType?: PaymentChartType;
}

export const PaymentModeChart: React.FC<PaymentModeChartProps> = ({
  data,
  currency,
  totalExpenses,
  defaultChartType = 'doughnut',
}) => {
  const [chartType, setChartType] = useState<PaymentChartType>(defaultChartType);
  const activeMethods = data.filter((item) => item.total > 0);

  if (activeMethods.length === 0 || totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-xs text-[#8c857b] space-y-1">
        <p className="font-serif text-sm font-semibold text-[#3b3832]">No payment instrument data</p>
        <span className="text-[11px] text-[#9c958b]">Instrument shares will appear once entries are logged</span>
      </div>
    );
  }

  const locale = currency.code === 'INR' ? 'en-IN' : undefined;

  const circularChartData = {
    labels: activeMethods.map((m) => m.method),
    datasets: [
      {
        data: activeMethods.map((m) => m.total),
        backgroundColor: activeMethods.map((m) => m.color || '#1f3d2b'),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const barChartData = {
    labels: activeMethods.map((m) => m.method),
    datasets: [
      {
        label: 'Disbursed',
        data: activeMethods.map((m) => m.total),
        backgroundColor: activeMethods.map((m) => m.color || '#1f3d2b'),
        borderRadius: 2,
        borderSkipped: false,
        maxBarThickness: 32,
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
            const item = activeMethods[index];
            const amountStr = `${currency.symbol}${item.total.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            return ` ${item.method}: ${amountStr} (${item.percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions: any = {
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
            const item = activeMethods[index];
            const amountStr = `${currency.symbol}${item.total.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            return ` ${item.method}: ${amountStr} (${item.percentage}%)`;
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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-[#1b3d2b]" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-[#6d5c48]" />;
      case 'Bank Transfer':
        return <Building2 className="w-3.5 h-3.5 text-[#374b5c]" />;
      case 'Debit Card':
      case 'Credit Card':
        return <CreditCard className="w-3.5 h-3.5 text-[#6b2c37]" />;
      default:
        return <Building2 className="w-3.5 h-3.5 text-[#524f4b]" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1c221e] font-serif tracking-wide">
            Payment Instruments
          </h3>
          <p className="text-xs text-[#736e67]">Settlement channels &amp; methods</p>
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
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-2xs transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-[#1b3829] text-[#fbfaf6] shadow-xs font-semibold'
                : 'text-[#6c655b] hover:text-[#1c221e] hover:bg-[#e8e1d4]'
            }`}
            title="Bar Distribution Chart"
            aria-label="View as Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bar</span>
          </button>
        </div>
      </div>

      <div className="relative h-52 flex items-center justify-center">
        {chartType === 'doughnut' && (
          <>
            <Doughnut data={circularChartData} options={circularOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7c7871]">Primary</span>
              <span className="text-sm font-bold text-[#1c221e] tabular-nums font-serif">
                {activeMethods[0]?.method || 'N/A'}
              </span>
            </div>
          </>
        )}
        {chartType === 'pie' && <Pie data={circularChartData} options={circularOptions} />}
        {chartType === 'bar' && <Bar data={barChartData} options={barOptions} />}
      </div>

      {/* Methods breakdown list */}
      <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {activeMethods.map((m) => (
          <div
            key={m.method}
            className="flex items-center justify-between text-xs p-1.5 rounded-xs hover:bg-[#faf8f4] transition-colors border border-transparent hover:border-[#ece6db]"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <div className="flex items-center gap-1.5">
                {getMethodIcon(m.method)}
                <span className="text-[#2c332e] font-serif font-semibold">{m.method}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 tabular-nums font-mono text-[11px]">
              <span className="text-[#7c7871]">{m.percentage}%</span>
              <span className="font-semibold text-[#1c221e]">
                {currency.symbol}
                {Number(m.total || 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

