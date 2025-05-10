import React from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import ChartCard from '@/components/Dashboard/ChartCard';
import { Users, FileText, CheckSquare, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for the charts
  const monthlyData = [
    { name: 'Jan', value: 165 },
    { name: 'Feb', value: 159 },
    { name: 'Mar', value: 180 },
    { name: 'Apr', value: 281 },
    { name: 'May', value: 156 },
    { name: 'Jun', value: 235 },
    { name: 'Jul', value: 290 },
    { name: 'Aug', value: 175 },
    { name: 'Sep', value: 185 }
  ];
  
  const bucketData = [
    { name: 'Bucket A', value: 35 },
    { name: 'Bucket B', value: 45 },
    { name: 'Bucket C', value: 20 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Recruitment Dashboard'}
            </h1>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Candidates"
              value="547"
              icon={<Users size={20} />}
            />
            <StatsCard 
              title="CVs Processed Today"
              value="39"
              icon={<FileText size={20} />}
              trend={{ value: 12, positive: true }}
            />
            <StatsCard 
              title="Bucket A Matches"
              value="147"
              icon={<CheckSquare size={20} />}
            />
            <StatsCard 
              title="Average Match Score"
              value="76.5"
              suffix="%"
              icon={<BarChart3 size={20} />}
              trend={{ value: 8, positive: true }}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard 
              title="CVs Processed per Month"
              subtitle="Monthly recruitment volume"
              data={monthlyData}
              type="bar"
            />
            <ChartCard 
              title="Candidate Distribution by Bucket"
              subtitle="Based on match score"
              data={bucketData}
              type="pie"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
