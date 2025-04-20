import React from "react";

interface SkeletonLoaderProps {
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 4 }) => {
  const items = Array.from({ length: count });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {items.map((_, idx) => (
        <div
          key={idx}
          className="border rounded-xl bg-gray-700 p-4 space-y-4 shadow-sm"
        >
          <div className="h-6 bg-gray-600 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-600 rounded" />
            <div className="h-4 bg-gray-600 rounded w-5/6" />
          </div>
          <div className="h-6 bg-gray-600 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
