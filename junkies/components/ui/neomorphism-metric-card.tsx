"use client";

/*
 * Neomorphism Metric Card — integrated from the provided prompt.
 * Uses the token version of the component: `bg-neo-bg`, `shadow-neo`,
 * `shadow-neo-inner-sm` and `text-neo-text` are defined in app/globals.css.
 * Changes vs. original:
 *  - "use client" (framer-motion)
 *  - optional `className` and `accent` (keycap LED colour for the icon well)
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  trendLabel?: string;
  accent?: string;
  className?: string;
}
export function MetricCard({ title, value, trend, icon: Icon, trendLabel = "vs last month", accent, className }: MetricCardProps) {
  const isPositive = trend >= 0;
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("p-8 rounded-3xl bg-neo-bg shadow-neo w-full max-w-md flex flex-col gap-6", className)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h3 className="text-neo-text/70 font-medium uppercase tracking-wider text-sm">
            {title}
          </h3>
          <h2 className="text-neo-text font-bold text-4xl tracking-tight">
            {value}
          </h2>
        </div>

        {/* Neomorphic Icon Container */}
        <div
          className="p-4 rounded-full shadow-neo-inner-sm text-neo-text/80 bg-neo-bg flex items-center justify-center"
          style={accent ? { color: accent } : undefined}
        >
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Neomorphic Trend Badge */}
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full shadow-neo-inner-sm text-sm font-semibold
            ${isPositive ? 'text-green-600' : 'text-red-500'}
          `}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend)}%</span>
        </div>
        <span className="text-neo-text/60 text-sm font-medium">
          {trendLabel}
        </span>
      </div>
    </motion.div>
  );
}
