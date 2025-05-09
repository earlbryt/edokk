
import React from 'react';
import { Check, MessageSquare, FileText, Calendar, Upload, CheckSquare, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Activity {
  id: string;
  type: 'comment' | 'file' | 'task' | 'event' | 'upload' | 'feedback' | 'job' | 'interview';
  title: string;
  description: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
}

interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  const getActivityIcon = (type: Activity['type']) => {
    const iconMap = {
      'comment': <MessageSquare className="h-4 w-4 text-blue-500" />,
      'file': <FileText className="h-4 w-4 text-green-500" />,
      'task': <Check className="h-4 w-4 text-purple-500" />,
      'event': <Calendar className="h-4 w-4 text-orange-500" />,
      'upload': <Upload className="h-4 w-4 text-green-500" />,
      'feedback': <CheckSquare className="h-4 w-4 text-blue-500" />,
      'job': <Briefcase className="h-4 w-4 text-purple-500" />,
      'interview': <Calendar className="h-4 w-4 text-orange-500" />
    };
    
    return iconMap[type] || <FileText className="h-4 w-4 text-gray-500" />;
  };
  
  const getActivityBgColor = (type: Activity['type']) => {
    const colorMap = {
      'comment': 'bg-blue-100',
      'file': 'bg-green-100',
      'task': 'bg-purple-100',
      'event': 'bg-orange-100',
      'upload': 'bg-green-100',
      'feedback': 'bg-blue-100',
      'job': 'bg-purple-100',
      'interview': 'bg-orange-100'
    };
    
    return colorMap[type] || 'bg-gray-100';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div className="p-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                      getActivityBgColor(activity.type)
                    )}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full overflow-hidden">
                            <img 
                              src={activity.user.avatar}
                              alt={activity.user.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {activity.user.name}
                          </div>
                          <span className="text-sm text-gray-500">&middot;</span>
                          <div className="text-xs text-gray-500">
                            {activity.timestamp}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-900">{activity.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ActivityList;
