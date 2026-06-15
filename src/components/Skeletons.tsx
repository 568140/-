import React from 'react';

export function ProductSkeleton() {
  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      {/* Image Placeholder */}
      <div className="aspect-square bg-gray-200" />
      
      {/* Content Placeholder */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-8 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded-full" />
        </div>
        
        <div className="h-6 w-3/4 bg-gray-200 rounded mx-auto" />
        <div className="h-3 w-1/4 bg-gray-100 rounded mx-auto" />
        
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-5/6 bg-gray-100 rounded ml-auto" />
        </div>
        
        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <div className="space-y-1">
            <div className="h-2 w-8 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-10 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="h-10 w-24 bg-gray-100 rounded-2xl animate-pulse" />
  );
}
