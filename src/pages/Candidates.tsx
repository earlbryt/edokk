import React, { useState } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import ActivityList from '@/components/Dashboard/ActivityList';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const Candidates: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for candidates
  const candidates = [
    {
      id: '1',
      name: 'Candidate One',
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
      name: 'Candidate Two',
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
      name: 'Candidate Three',
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
      name: 'Candidate Four',
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
      name: 'Candidate Five',
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
      description: 'User uploaded 15 new CVs for the Software Engineer position.',
      user: {
        name: 'Team Member',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'feedback' as const,
      title: 'Match score adjusted',
      description: 'User adjusted the match score for a candidate from B to A bucket.',
      user: {
        name: 'Team Member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      type: 'job' as const,
      title: 'New job position created',
      description: 'User created a new Senior Product Manager position with custom scoring criteria.',
      user: {
        name: 'Team Member',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
      },
      timestamp: 'Yesterday'
    },
    {
      id: '4',
      type: 'interview' as const,
      title: 'Interview scheduled',
      description: 'User scheduled an interview with a candidate for the Software Engineer position.',
      user: {
        name: 'Team Member',
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Candidates</h1>
            </div>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search candidates..." 
                className="pl-9 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
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

export default Candidates; 