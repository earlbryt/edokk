
import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskStatus = 'completed' | 'in-progress' | 'cancelled';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignees: {
    name: string;
    avatar: string;
  }[];
}

interface TaskListProps {
  title: string;
  tasks: Task[];
}

const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const statusConfig = {
    'completed': {
      label: 'Completed',
      className: 'bg-green-100 text-green-800',
      icon: <Check className="h-3 w-3" />
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800',
      icon: <Clock className="h-3 w-3" />
    },
    'cancelled': {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-800',
      icon: <X className="h-3 w-3" />
    }
  };

  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className
    )}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const TaskList: React.FC<TaskListProps> = ({ title, tasks }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <li key={task.id} className="hover:bg-gray-50 transition-colors">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                <TaskStatusBadge status={task.status} />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {task.assignees.map((assignee, index) => (
                    <div key={index} className="h-7 w-7 rounded-full ring-2 ring-white">
                      <img 
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="h-full w-full object-cover rounded-full"
                        title={assignee.name}
                      />
                    </div>
                  ))}
                </div>
                {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    Due {task.dueDate}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
