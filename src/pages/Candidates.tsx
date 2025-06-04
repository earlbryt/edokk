import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import { Search, Users, Star, Award, ThumbsUp, UserCheck, ChevronLeft, ArrowUpRight, Download, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import LoadingAnimation from '@/components/ui/loading-animation';

// Define bucket types
type BucketType = 'bucket-a' | 'bucket-b' | 'bucket-c' | 'bucket-d' | 'unrated';

interface Bucket {
  id: BucketType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  count: number;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  status?: string;
  project_id: string;
  skills: string[];
  education: string;
  experience: string;
  avatar: string;
  rating: any;
  parsed?: any;
  cvFile?: {
    storage_url?: string;
  };
}

const Candidates: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [bucketCounts, setBucketCounts] = useState({
    'bucket-a': 0,
    'bucket-b': 0,
    'bucket-c': 0,
    'bucket-d': 0,
    'unrated': 0
  });
  
  // Function to fetch candidates from the database
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      
      // Only fetch CV files that have completed the full processing pipeline
      // This means they either have a rating or they're marked as completed
      const { data: cvFiles, error: cvError } = await supabase
        .from('cv_files')
        .select(`
          id,
          name,
          status,
          project_id,
          summary_id,
          parsed_data,
          projects (name, id)
        `)
        .or('status.eq.completed,status.like.bucket-%');
      
      if (cvError) throw cvError;
      
      if (!cvFiles || cvFiles.length === 0) {
        setCandidates([]);
        setLoading(false);
        return;
      }
      
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
      
      // Filter out any candidates that don't have complete information
      const fullyProcessedCandidates = processedCandidates.filter(candidate => {
        // Ensure the candidate has essential information
        const hasBasicInfo = candidate.name !== 'Unnamed Candidate' && 
                           candidate.skills.length > 0 &&
                           candidate.education !== 'Education Unknown' &&
                           candidate.experience !== 'Experience Unknown';
        
        // Either it's rated (has a status) or it's marked as completed
        const isProcessed = !!candidate.status;
        
        return hasBasicInfo && isProcessed;
      });
      
      // Update the candidates state with only fully processed candidates
      setCandidates(fullyProcessedCandidates);
      
      // Update bucket counts
      const counts = {
        'bucket-a': 0,
        'bucket-b': 0,
        'bucket-c': 0,
        'bucket-d': 0,
        'unrated': 0
      };
      
      fullyProcessedCandidates.forEach(candidate => {
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
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchCandidates();
  }, []);
  
  // Set up a real-time subscription to update when new candidates are processed
  useEffect(() => {
    // Set up a subscription to listen for changes to cv_files
    const subscription = supabase
      .channel('candidates-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cv_files',
        filter: `status=eq.completed OR status=like.bucket-%`
      }, (payload) => {
        console.log('CV file updated:', payload);
        // Refresh the candidates list when a document completes processing
        fetchCandidates();
      })
      .subscribe();
      
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
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
  
  // Define buckets with descriptive icons
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
    },
    {
      id: 'unrated',
      name: 'Unrated',
      description: 'Pending Assessment',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: <Users className="h-5 w-5 text-gray-500" />,
      count: bucketCounts['unrated']
    }
  ];

  // Handle candidate click
  const handleViewCandidate = async (candidate: Candidate) => {
    setLoading(true);
    
    try {
      // Fetch the full CV file data
      const { data: cvFile, error: cvError } = await supabase
        .from('cv_files')
        .select('*')
        .eq('id', candidate.id)
        .single();
      
      if (cvError) throw cvError;
      
      // Fetch the associated summary if it exists
      let summaryData = null;
      if (cvFile.summary_id) {
        const { data: summary, error: summaryError } = await supabase
          .from('summaries')
          .select('*')
          .eq('id', cvFile.summary_id)
          .single();
        
        if (summaryError) throw summaryError;
        summaryData = summary;
      }
      
      // Combine the data
      const fullCandidateData = {
        ...candidate,
        cvFile,
        summaryData,
        // Use the most detailed data source available
        parsed: summaryData || cvFile.parsed_data || {}
      };
      
      setActiveCandidate(fullCandidateData as any);
      setViewMode('detail');
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render candidate details
  const renderCandidateDetails = () => {
    if (!activeCandidate) return null;

    // Access the parsed data which contains the complete CV information
    const parsed = activeCandidate.parsed || {};
    const candidateName = parsed.name || activeCandidate.name;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setViewMode('list')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
          <h2 className="text-xl font-medium">{candidateName}</h2>
          {activeCandidate.status && (
            <Badge 
              variant="outline" 
              className={cn(
                "ml-2",
                activeCandidate.status === 'bucket-a' ? "bg-green-50 text-green-700 border-green-200" :
                activeCandidate.status === 'bucket-b' ? "bg-blue-50 text-blue-700 border-blue-200" :
                activeCandidate.status === 'bucket-c' ? "bg-orange-50 text-orange-700 border-orange-200" :
                activeCandidate.status === 'bucket-d' ? "bg-red-50 text-red-700 border-red-200" :
                "bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {activeCandidate.status === 'bucket-a' ? "Excellent Match" :
               activeCandidate.status === 'bucket-b' ? "Good Match" :
               activeCandidate.status === 'bucket-c' ? "Potential Match" :
               activeCandidate.status === 'bucket-d' ? "Not Suitable" :
               "Unrated"}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Navigation Sidebar and Main Content */}
              <div className="grid grid-cols-12 gap-8">
                {/* Left sidebar navigation */}
                <div className="col-span-3 space-y-4 h-fit sticky top-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Navigation</h3>
                    <nav className="space-y-2">
                      <a href="#basic-info" className="block text-sm text-lens-purple font-medium hover:text-lens-purple transition-colors">Basic Information</a>
                      {parsed.skills?.length > 0 && (
                        <a href="#skills" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Skills & Expertise</a>
                      )}
                      {parsed.experience?.length > 0 && (
                        <a href="#experience" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Professional Experience</a>
                      )}
                      {parsed.education?.length > 0 && (
                        <a href="#education" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Education</a>
                      )}
                      {parsed.projects?.length > 0 && (
                        <a href="#projects" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Projects</a>
                      )}
                      {parsed.certifications?.length > 0 && (
                        <a href="#certifications" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Certifications</a>
                      )}
                      {parsed.languages?.length > 0 && (
                        <a href="#languages" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Languages</a>
                      )}
                      {parsed.awards?.length > 0 && (
                        <a href="#awards" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Awards</a>
                      )}
                      {parsed.publications?.length > 0 && (
                        <a href="#publications" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Publications</a>
                      )}
                      {parsed.volunteer?.length > 0 && (
                        <a href="#volunteer" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Volunteer Experience</a>
                      )}
                    </nav>
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="col-span-9 space-y-8 divide-y divide-gray-100">
                  {/* Basic Info Section */}
                  <div id="basic-info" className="pt-8 first:pt-0">
                    <div className="text-center pb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{parsed.name || candidateName}</h2>
                      <div className="flex items-center justify-center gap-4 text-gray-600">
                        {parsed.email && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{parsed.email}</span>
                          </div>
                        )}
                        {parsed.phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{parsed.phone}</span>
                          </div>
                        )}
                        {parsed.role && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{parsed.role}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills Section */}
                  {parsed.skills && parsed.skills.length > 0 && (
                    <div id="skills" className="pt-6">
                      <div className="bg-gradient-to-r from-lens-purple/5 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Skills & Expertise
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {parsed.skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-white border border-lens-purple/20 text-lens-purple hover:bg-lens-purple/5 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Experience Section */}
                  {parsed.experience && parsed.experience.length > 0 && (
                    <div id="experience" className="pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Professional Experience
                        </h3>
                        <div className="space-y-4">
                          {parsed.experience.map((job: any, index: number) => (
                            <div key={index} className="border-l-2 border-lens-purple/30 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{job.title || job.position || job}</h4>
                                {job.dates && <span className="text-sm text-gray-500">{job.dates}</span>}
                              </div>
                              {job.company && <div className="text-xs text-gray-700 mb-1">{job.company}</div>}
                              {job.description && <div className="text-xs text-gray-600">{job.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Education Section */}
                  {parsed.education && parsed.education.length > 0 && (
                    <div id="education" className="pt-6">
                      <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Education
                        </h3>
                        <div className="space-y-4">
                          {parsed.education.map((edu: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{edu.degree || edu}</h4>
                                {edu.dates && <span className="text-sm text-gray-500">{edu.dates}</span>}
                              </div>
                              {edu.institution && <div className="text-xs text-gray-700 mb-1">{edu.institution}</div>}
                              {edu.description && <div className="text-xs text-gray-600">{edu.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Projects Section */}
                  {/* Projects Section */}
                  {parsed.projects && parsed.projects.length > 0 && (
                    <div id="projects" className="pt-6">
                      <div className="bg-gradient-to-r from-green-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Projects
                        </h3>
                        <div className="space-y-4">
                          {parsed.projects.map((project: any, index: number) => (
                            <div key={index} className="border-l-2 border-green-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{project.name || project}</h4>
                              {project.description && (
                                <div className="text-sm text-gray-600 mt-1">{project.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Certifications Section */}
                  {parsed.certifications && parsed.certifications.length > 0 && (
                    <div id="certifications" className="pt-6">
                      <div className="bg-gradient-to-r from-amber-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Certifications
                        </h3>
                        <div className="space-y-4">
                          {parsed.certifications.map((cert: any, index: number) => (
                            <div key={index} className="border-l-2 border-amber-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{cert.name || cert}</h4>
                              {cert.issuer && <div className="text-gray-700">{cert.issuer}</div>}
                              {cert.date && <div className="text-gray-500 text-sm">{cert.date}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Languages Section */}
                  {parsed.languages && parsed.languages.length > 0 && (
                    <div id="languages" className="pt-6">
                      <div className="bg-gradient-to-r from-cyan-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {parsed.languages.map((lang: any, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors"
                            >
                              {typeof lang === 'string' ? lang : `${lang.language}: ${lang.proficiency}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Awards Section */}
                  {parsed.awards && parsed.awards.length > 0 && (
                    <div id="awards" className="pt-6">
                      <div className="bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Awards & Achievements
                        </h3>
                        <div className="space-y-4">
                          {parsed.awards.map((award: any, index: number) => (
                            <div key={index} className="border-l-2 border-purple-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{award.title || award}</h4>
                              {award.issuer && <div className="text-gray-700">{award.issuer}</div>}
                              {award.date && <div className="text-gray-500 text-sm">{award.date}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Publications Section */}
                  {parsed.publications && parsed.publications.length > 0 && (
                    <div id="publications" className="pt-6">
                      <div className="bg-gradient-to-r from-cyan-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Publications
                        </h3>
                        <div className="space-y-4">
                          {parsed.publications.map((pub: any, index: number) => (
                            <div key={index} className="border-l-2 border-cyan-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{pub.title || pub}</h4>
                                {pub.date && <span className="text-sm text-gray-500">{pub.date}</span>}
                              </div>
                              {pub.publisher && <div className="text-xs text-gray-700 mb-1">{pub.publisher}</div>}
                              {pub.description && <div className="text-xs text-gray-600">{pub.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Volunteer Experience Section */}
                  {parsed.volunteer && parsed.volunteer.length > 0 && (
                    <div id="volunteer" className="pt-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Volunteer Experience
                        </h3>
                        <div className="space-y-4">
                          {parsed.volunteer.map((vol: any, index: number) => (
                            <div key={index} className="border-l-2 border-indigo-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{vol.role || vol}</h4>
                                {vol.dates && <span className="text-sm text-gray-500">{vol.dates}</span>}
                              </div>
                              {vol.organization && <div className="text-xs text-gray-700 mb-1">{vol.organization}</div>}
                              {vol.description && <div className="text-xs text-gray-600">{vol.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* If no structured data is available, show raw text */}
                  {!parsed.skills && !parsed.experience && !parsed.education && 
                   !parsed.projects && !parsed.certifications && !parsed.languages && 
                   !parsed.awards && !parsed.publications && !parsed.volunteer && 
                   activeCandidate.cvFile?.raw_text && (
                    <div className="pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Text</h2>
                      <div className="border rounded-lg p-4 whitespace-pre-wrap font-mono text-sm">
                        {activeCandidate.cvFile.raw_text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          {viewMode === 'list' ? (
            <>
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
                ) : candidates.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No fully processed candidates found yet.</p>
                    <p className="text-gray-400 text-sm mt-2">Candidates will appear here after document processing is complete.</p>
                  </div>
                ) : (
                  <CandidateTable 
                    title="Candidates" 
                    candidates={filteredCandidates} 
                    onViewCandidate={handleViewCandidate}
                  />
                )}
              </div>
            </>
          ) : (
            renderCandidateDetails()
          )}
        </main>
      </div>
    </div>
  );
};

export default Candidates; 