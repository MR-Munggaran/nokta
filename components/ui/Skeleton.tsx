import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} 
    />
  );
};

export const CardSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`bg-white rounded-2xl border border-stone-100 p-4 animate-pulse ${className}`}>
      <div className="h-3 bg-stone-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-stone-100 rounded w-3/4 mb-2" />
      <div className="h-2 bg-stone-100 rounded w-full" />
    </div>
  );
};
