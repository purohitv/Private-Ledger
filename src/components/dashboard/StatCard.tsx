import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  const safeTitle = typeof title === 'object' ? '' : String(title ?? '');
  const safeValue = typeof value === 'object' ? '' : String(value ?? '');
  const safeSubtitle = typeof subtitle === 'object' ? '' : subtitle ? String(subtitle) : undefined;
  const safeBadgeText = badge ? (typeof badge.text === 'object' ? '' : String(badge.text ?? '')) : '';

  return (
    <div className="bg-[#ffffff] p-5 rounded-sm border border-[#e5dfd4] shadow-2xs flex flex-col justify-between hover:border-[#cfc6b6] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#7c7871] uppercase tracking-wider font-mono">
          {safeTitle}
        </span>
        <div className="w-8 h-8 rounded-sm bg-[#f6f2e9] border border-[#e4dcce] flex items-center justify-center text-[#1b3829]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-[#1c221e] tabular-nums font-serif tracking-tight">
          {safeValue}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          {badge && safeBadgeText && (
            <span
              className={`font-semibold tabular-nums text-[11px] px-1.5 py-0.5 rounded-xs border ${
                badge.isNeutral
                  ? 'bg-[#f4efe6] text-[#55524c] border-[#dfd6c5]'
                  : badge.isPositive
                  ? 'bg-[#edf4ee] text-[#1b3d2b] border-[#bed7c3]'
                  : 'bg-[#faeded] text-[#6d252a] border-[#e8c1c4]'
              }`}
            >
              {safeBadgeText}
            </span>
          )}
          {safeSubtitle && (
            <span className="text-[#716e68] truncate text-xs">{safeSubtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
};
