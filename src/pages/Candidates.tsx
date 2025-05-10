import React, { useState } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import { Search, Users, Star, Award, ThumbsUp, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";

// Define bucket types
type BucketType = 'bucket-a' | 'bucket-b' | 'bucket-c' | 'bucket-d';

interface Bucket {
  id: BucketType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  count: number;
}

const Candidates: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Define buckets with more positive icons
  const buckets: Bucket[] = [
    {
      id: 'bucket-a',
      name: 'Bucket A',
      description: 'Perfect Match',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: <Star className="h-5 w-5 text-amber-500" />,
      count: 12
    },
    {
      id: 'bucket-b',
      name: 'Bucket B',
      description: 'Strong Candidate',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: <Award className="h-5 w-5 text-blue-500" />,
      count: 24
    },
    {
      id: 'bucket-c',
      name: 'Bucket C',
      description: 'Potential Fit',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: <ThumbsUp className="h-5 w-5 text-indigo-500" />,
      count: 18
    },
    {
      id: 'bucket-d',
      name: 'Bucket D',
      description: 'Consider Later',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: <UserCheck className="h-5 w-5 text-purple-500" />,
      count: 7
    }
  ];
  
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
      status: 'bucket-c',
      score: 65,
      skills: ['Content Strategy', 'SEO', 'Social Media'],
      education: 'BSc Marketing',
      experience: '3 years',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    },
    {
      id: '5',
      name: 'Candidate Five',
      role: 'Data Analyst',
      status: 'bucket-d',
      score: 45,
      skills: ['SQL', 'Tableau', 'Python'],
      education: 'BSc Statistics',
      experience: '2 years',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
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
          
          {/* Candidates & Buckets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CandidateTable title="Top Candidates" candidates={candidates} />
            </div>
            <div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Candidate Buckets</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {buckets.map((bucket) => (
                      <div 
                        key={bucket.id}
                        className={cn(
                          "rounded-lg border transition-all hover:shadow-sm cursor-pointer",
                          bucket.bgColor
                        )}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm">
                              {bucket.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className={cn("font-medium text-gray-900")}>{bucket.name}</h3>
                                <span className="text-xs bg-white px-2 py-0.5 rounded-full border">
                                  {bucket.count}
                                </span>
                              </div>
                              <p className={cn("text-sm", bucket.color)}>{bucket.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Candidates; 