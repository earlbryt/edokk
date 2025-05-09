import React, { useState } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import StatsCard from '@/components/Dashboard/StatsCard';
import ChartCard from '@/components/Dashboard/ChartCard';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import ActivityList from '@/components/Dashboard/ActivityList';
import { Users, FileText, CheckSquare, BarChart3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  
  // Mock data for candidates
  const candidates = [
    {
      id: '1',
      name: 'Emma Wilson',
      role: 'Senior Software Engineer',
      status: 'bucket-a',
      score: 92,
      skills: ['React', 'Node.js', 'Python'],
      education: 'MSc Computer Science',
      experience: '8 years',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    {
      id: '2',
      name: 'Michael Chen',
      role: 'Product Manager',
      status: 'bucket-a',
      score: 89,
      skills: ['Product Strategy', 'Market Research', 'Agile'],
      education: 'MBA',
      experience: '6 years',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    {
      id: '3',
      name: 'Alex Johnson',
      role: 'UX Designer',
      status: 'bucket-b',
      score: 78,
      skills: ['Figma', 'User Research', 'Prototyping'],
      education: 'BA Design',
      experience: '4 years',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    {
      id: '4',
      name: 'Sarah Kim',
      role: 'Marketing Specialist',
      status: 'bucket-b',
      score: 72,
      skills: ['Content Strategy', 'SEO', 'Social Media'],
      education: 'BSc Marketing',
      experience: '3 years',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    {
      id: '5',
      name: 'James Peterson',
      role: 'Data Analyst',
      status: 'bucket-c',
      score: 65,
      skills: ['SQL', 'Tableau', 'Python'],
      education: 'BSc Statistics',
      experience: '2 years',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    }
  ];
  
  // Mock data for activities
  const activities = [
    {
      id: '1',
      type: 'upload' as const,
      title: 'New CVs uploaded',
      description: 'Sarah uploaded 15 new CVs for the Software Engineer position.',
      user: {
        name: 'Sarah Kim',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'feedback' as const,
      title: 'Match score adjusted',
      description: 'Michael adjusted the match score for Emma Wilson from B to A bucket.',
      user: {
        name: 'Michael Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'job' as const,
      title: 'New job position created',
      description: 'James created a new Senior Product Manager position with custom scoring criteria.',
      user: {
        name: 'James Peterson',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: 'Yesterday'
    },
    {
      id: '4',
      type: 'interview' as const,
      title: 'Interview scheduled',
      description: 'Alex scheduled an interview with Emma Wilson for the Software Engineer position.',
      user: {
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: 'Yesterday'
    }
  ];

  // State for active job position filter
  const [activeJob, setActiveJob] = useState('Software Engineer');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Recruitment Dashboard'}
              </h1>
              <div className="flex items-center">
                <p className="text-gray-600">Active job: </p>
                <div className="ml-2 flex items-center gap-1">
                  <span className="bg-lens-purple/10 text-lens-purple px-3 py-1 rounded-full text-sm font-medium">
                    {activeJob}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7">
                    Change
                  </Button>
                </div>
              </div>
            </div>
            
            <Button className="bg-lens-purple hover:bg-lens-purple/90 text-white">
              <Upload className="mr-2 h-4 w-4" /> Upload CVs
            </Button>
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
          
          {/* Upload Area */}
          <Card className="p-6 mb-8 border border-dashed border-gray-300 bg-white/50">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 bg-lens-purple/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-lens-purple" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Drag and drop CVs here</h3>
              <p className="text-gray-500 text-center mb-4">
                Supports PDF, DOCX, DOC formats (Max 10MB per file)
              </p>
              <div className="flex gap-4">
                <Button className="bg-lens-purple hover:bg-lens-purple/90 text-white">
                  Upload Files
                </Button>
                <Button variant="outline">
                  Import from Cloud
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Candidates & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CandidateTable title="Top Candidates" candidates={candidates} />
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
