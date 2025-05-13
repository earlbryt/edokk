import React from 'react';
import { Star, Medal, Award, Badge as BadgeIcon, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BucketSelectorProps {
  selectedBucket: string | null;
  onBucketChange: (bucket: string | null) => void;
  counts: {
    a: number;
    b: number;
    c: number;
    d: number;
    unrated: number;
  };
}

const BucketSelector: React.FC<BucketSelectorProps> = ({
  selectedBucket,
  onBucketChange,
  counts
}) => {
  const buckets = [
    {
      id: 'bucket-a',
      label: 'Bucket A',
      description: 'Excellent Match',
      icon: <Star className="h-4 w-4 mr-2 text-green-600" />,
      count: counts.a,
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-300',
      bgColor: selectedBucket === 'bucket-a' ? 'bg-green-50' : 'bg-white',
      textColor: 'text-green-700'
    },
    {
      id: 'bucket-b',
      label: 'Bucket B',
      description: 'Good Match',
      icon: <Medal className="h-4 w-4 mr-2 text-blue-600" />,
      count: counts.b,
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-300',
      bgColor: selectedBucket === 'bucket-b' ? 'bg-blue-50' : 'bg-white',
      textColor: 'text-blue-700'
    },
    {
      id: 'bucket-c',
      label: 'Bucket C',
      description: 'Potential Match',
      icon: <Award className="h-4 w-4 mr-2 text-orange-600" />,
      count: counts.c,
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-300',
      bgColor: selectedBucket === 'bucket-c' ? 'bg-orange-50' : 'bg-white',
      textColor: 'text-orange-700'
    },
    {
      id: 'bucket-d',
      label: 'Bucket D',
      description: 'Consider Later',
      icon: <BadgeIcon className="h-4 w-4 mr-2 text-red-600" />,
      count: counts.d,
      borderColor: 'border-red-200',
      hoverColor: 'hover:border-red-300',
      bgColor: selectedBucket === 'bucket-d' ? 'bg-red-50' : 'bg-white',
      textColor: 'text-red-700'
    },
    {
      id: null,
      label: 'All Candidates',
      description: 'View everyone',
      icon: null,
      count: counts.a + counts.b + counts.c + counts.d + counts.unrated,
      borderColor: 'border-gray-200',
      hoverColor: 'hover:border-gray-300',
      bgColor: selectedBucket === null ? 'bg-gray-50' : 'bg-white',
      textColor: 'text-gray-700'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {buckets.map((bucket) => (
        <button
          key={bucket.id || 'all'}
          onClick={() => onBucketChange(bucket.id)}
          className={cn(
            'px-4 py-2 rounded-lg border flex items-center transition-all',
            bucket.borderColor,
            bucket.hoverColor,
            bucket.bgColor,
            bucket.textColor,
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          )}
        >
          {bucket.icon}
          <div className="flex flex-col items-start">
            <div className="font-medium">{bucket.label}</div>
            <div className="text-xs flex gap-1">
              <span>{bucket.description}</span>
              <span className="font-semibold">({bucket.count})</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default BucketSelector;
