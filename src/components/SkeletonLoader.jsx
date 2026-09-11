import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-5/6" />
      </div>
      <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-32" />
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-md w-20" />
        </div>
      </div>
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-16" />
    </div>
  );
}
