
import React from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import ChartCard from '@/components/Dashboard/ChartCard';
import TaskList from '@/components/Dashboard/TaskList';
import ActivityList from '@/components/Dashboard/ActivityList';
import { Users, Briefcase, Calendar, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data for the charts
  const monthlyData = [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 59 },
    { name: 'Mar', value: 80 },
    { name: 'Apr', value: 81 },
    { name: 'May', value: 56 },
    { name: 'Jun', value: 85 },
    { name: 'Jul', value: 90 },
    { name: 'Aug', value: 75 },
    { name: 'Sep', value: 85 }
  ];
  
  const weeklyData = [
    { name: 'Mon', value: 25 },
    { name: 'Tue', value: 38 },
    { name: 'Wed', value: 52 },
    { name: 'Thu', value: 47 },
    { name: 'Fri', value: 60 },
    { name: 'Sat', value: 15 },
    { name: 'Sun', value: 10 },
  ];
  
  // Mock data for tasks
  const tasks = [
    {
      id: '1',
      title: 'Redesign the landing page',
      status: 'completed' as const,
      dueDate: 'Sep 15, 2023',
      assignees: [
        { name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' },
        { name: 'Michael Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' }
      ]
    },
    {
      id: '2',
      title: 'Create wireframes for new dashboard',
      status: 'in-progress' as const,
      dueDate: 'Sep 20, 2023',
      assignees: [
        { name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' }
      ]
    },
    {
      id: '3',
      title: 'User research and interviews',
      status: 'in-progress' as const,
      dueDate: 'Sep 25, 2023',
      assignees: [
        { name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' },
        { name: 'James Peterson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' },
        { name: 'Emily Wilson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' }
      ]
    },
    {
      id: '4',
      title: 'Competitive analysis of similar products',
      status: 'cancelled' as const,
      dueDate: 'Sep 10, 2023',
      assignees: [
        { name: 'David Wang', avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80' }
      ]
    }
  ];
  
  // Mock data for activities
  const activities = [
    {
      id: '1',
      type: 'comment' as const,
      title: 'New comment on Project X',
      description: 'Sarah left a comment on the design mockup for Project X.',
      user: {
        name: 'Sarah Kim',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'file' as const,
      title: 'New file uploaded',
      description: 'Michael uploaded the final version of the presentation.',
      user: {
        name: 'Michael Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'task' as const,
      title: 'Task completed',
      description: 'James completed the backend integration for user authentication.',
      user: {
        name: 'James Peterson',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: 'Yesterday'
    },
    {
      id: '4',
      type: 'event' as const,
      title: 'Team meeting scheduled',
      description: 'Weekly team meeting scheduled for Friday at 10:00 AM.',
      user: {
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: 'Yesterday'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Alex</h1>
            <p className="text-gray-600">Here's what's happening with your projects today.</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Active Employees"
              value="547"
              icon={<Users size={20} />}
            />
            <StatsCard 
              title="Number of Projects"
              value="339"
              icon={<Briefcase size={20} />}
              trend={{ value: 12, positive: true }}
            />
            <StatsCard 
              title="Number of Tasks"
              value="147"
              icon={<Calendar size={20} />}
            />
            <StatsCard 
              title="Target % Completed"
              value="89.75"
              suffix="%"
              icon={<BarChart3 size={20} />}
              trend={{ value: 8, positive: true }}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard 
              title="Projects Completed per Month"
              subtitle="Monthly performance metrics"
              data={monthlyData}
              type="bar"
            />
            <ChartCard 
              title="Weekly Task Completion"
              subtitle="Tasks completed this week"
              data={weeklyData}
              type="area"
            />
          </div>
          
          {/* Tasks & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TaskList title="Ongoing Tasks" tasks={tasks} />
            </div>
            <div>
              <ActivityList activities={activities} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
