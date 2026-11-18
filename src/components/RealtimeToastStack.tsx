/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Heart, RefreshCw, X } from 'lucide-react';

export interface RealtimeToastItem {
  id: string;
  title: string;
  subtitle?: string;
  tone: 'farm' | 'pink' | 'sync';
}

interface RealtimeToastStackProps {
  toasts: RealtimeToastItem[];
  onDismiss: (id: string) => void;
}

export const RealtimeToastStack: React.FC<RealtimeToastStackProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="การแจ้งเตือนข้อมูลอัปเดตล่าสุด"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map(toast => {
        const isPink = toast.tone === 'pink';
        const isSync = toast.tone === 'sync';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl border shadow-lg px-4 py-3 flex items-start gap-3 transition-all bg-[#FFFDF9]/95 backdrop-blur-sm ${
              isPink
                ? 'border-[#F9A8D4] border-l-4 border-l-[#DB2777]'
                : isSync
                  ? 'border-[#C5DEC9] border-l-4 border-l-[#2E6B47]'
                  : 'border-[#DFCBB3] border-l-4 border-l-[#1E3F2B]'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isPink
                  ? 'bg-[#FCE7F3] text-[#DB2777]'
                  : isSync
                    ? 'bg-[#EDF4EF] text-[#2E6B47]'
                    : 'bg-[#F3ECE0] text-[#1E3F2B]'
              }`}
            >
              {isPink ? (
                <Heart className="w-4 h-4 fill-current" />
              ) : isSync ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-xs sm:text-sm font-semibold leading-snug ${
                  isPink ? 'text-[#831843]' : 'text-[#1E3F2B]'
                }`}
              >
                {toast.title}
              </p>
              {toast.subtitle && (
                <p className="text-[11px] text-[#5C5346] mt-0.5 leading-snug">
                  {toast.subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="ปิดการแจ้งเตือน"
              className="text-[#8C7F6E] hover:text-[#24201B] p-1 rounded-lg hover:bg-[#F3ECE0] transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
