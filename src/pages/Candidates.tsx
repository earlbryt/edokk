import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import { Search, Users, Star, Award, ThumbsUp, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import LoadingAnimation from '@/components/ui/loading-animation';

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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucketCounts, setBucketCounts] = useState({
    'bucket-a': 0,
    'bucket-b': 0,
    'bucket-c': 0,
    'bucket-d': 0,
    'unrated': 0
  });
  
  // Function to fetch candidates from the database
  useEffect(() => {
    async function fetchCandidates() {
      try {
        setLoading(true);
        
        // First fetch CV files with project info
        const { data: cvFiles, error: cvError } = await supabase
          .from('cv_files')
          .select(`
            id,
            name,
            project_id,
            summary_id,
            parsed_data,
            projects (name, id)
          `);
        
        if (cvError) throw cvError;
        
        // Fetch summaries for the CVs
        const summaryIds = cvFiles
          .filter(file => file.summary_id)
          .map(file => file.summary_id);
          
        let summariesData = {};
        if (summaryIds.length > 0) {
          const { data: summaries, error: summariesError } = await supabase
            .from('summaries')
            .select('*')
            .in('id', summaryIds);
          
          if (summariesError) throw summariesError;
          
          // Create a map of summaries by id for easier lookup
          summariesData = summaries.reduce((acc, summary) => {
            acc[summary.id] = summary;
            return acc;
          }, {});
        }
        
        // Fetch ratings for these candidates
        const { data: ratings, error: ratingsError } = await supabase
          .from('candidate_ratings')
          .select('*');
          
        if (ratingsError) throw ratingsError;
        
        // Process the data into the format expected by CandidateTable
        const processedCandidates = cvFiles.map(file => {
          // Find rating for this candidate if it exists
          const rating = ratings?.find(r => r.cv_file_id === file.id);
          
          // Determine status based on rating
          const status = rating ? `bucket-${rating.rating.toLowerCase()}` : undefined;
          
          // Get summary data or fallback to parsed_data
          const summary = file.summary_id ? summariesData[file.summary_id] : null;
          const candidateData = summary || file.parsed_data || {};
          
          // Extract skills
          const skills = candidateData.skills || [];
          
          // Extract experience
          const experience = candidateData.experience || [];
          
          // Extract education
          const education = candidateData.education || [];
          
          return {
            id: file.id,
            name: file.name || candidateData.name || 'Unnamed Candidate',
            role: experience[0] || 'Position Unknown',
            status,
            project_id: file.project_id,
            skills: skills.slice(0, 5),
            education: education[0] || 'Education Unknown',
            experience: experience.length ? `${experience.length} experiences` : 'Experience Unknown',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(file.name || 'Candidate')}&background=random`,
            rating: rating || null
          };
        });
        
        // Update the candidates state
        setCandidates(processedCandidates);
        
        // Update bucket counts
        const counts = {
          'bucket-a': 0,
          'bucket-b': 0,
          'bucket-c': 0,
          'bucket-d': 0,
          'unrated': 0
        };
        
        processedCandidates.forEach(candidate => {
          if (!candidate.status) {
            counts.unrated++;
          } else {
            counts[candidate.status]++;
          }
        });
        
        setBucketCounts(counts);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load candidates. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchCandidates();
  }, [toast]);
  
  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      candidate.name.toLowerCase().includes(query) ||
      candidate.role.toLowerCase().includes(query) ||
      candidate.skills.some((skill: string) => skill.toLowerCase().includes(query))
    );
  });
  
  // Define buckets with more positive icons
  const buckets: Bucket[] = [
    {
      id: 'bucket-a',
      name: 'Bucket A',
      description: 'Perfect Match',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: <Star className="h-5 w-5 text-amber-500" />,
      count: bucketCounts['bucket-a']
    },
    {
      id: 'bucket-b',
      name: 'Bucket B',
      description: 'Strong Candidate',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: <Award className="h-5 w-5 text-blue-500" />,
      count: bucketCounts['bucket-b']
    },
    {
      id: 'bucket-c',
      name: 'Bucket C',
      description: 'Potential Fit',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: <ThumbsUp className="h-5 w-5 text-indigo-500" />,
      count: bucketCounts['bucket-c']
    },
    {
      id: 'bucket-d',
      name: 'Bucket D',
      description: 'Consider Later',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: <UserCheck className="h-5 w-5 text-purple-500" />,
      count: bucketCounts['bucket-d']
    }
  ];
  
  // Add bucket for unrated candidates
  buckets.push({
    id: 'unrated',
    name: 'Unrated',
    description: 'Pending Assessment',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: <Users className="h-5 w-5 text-gray-500" />,
    count: bucketCounts['unrated']
  });


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
          
          {/* Candidates */}
          <div className="w-full">
            {loading ? (
              <LoadingAnimation message="Finding top talent..." />
            ) : (
              <CandidateTable title="Candidates" candidates={filteredCandidates} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Candidates; 