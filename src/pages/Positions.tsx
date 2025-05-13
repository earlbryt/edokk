import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import { Briefcase, Search, Users, Folders, FolderOpen, ChevronLeft, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import LoadingAnimation from '@/components/ui/loading-animation';
import BucketSelector from '@/components/Dashboard/BucketSelector';

interface Position {
  id: string;
  title: string;
  description: string;
  key_skills: string[];
  qualifications: string[];
  candidate_count: number;
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
  position: string;
  confidence: number;
  parsed?: any;
  cvFile?: {
    storage_url?: string;
  };
}

const Positions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'positions' | 'candidates' | 'detail'>('positions');
  const [activePosition, setActivePosition] = useState<Position | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  
  // Function to fetch positions and candidates
  const fetchPositionsAndCandidates = async () => {
    try {
      setLoading(true);
      
      // Fetch all positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*');
      
      if (positionsError) throw positionsError;
      
      // Fetch candidates with inferred positions
      const { data: candidatePositions, error: candidatePositionsError } = await supabase
        .from('candidate_positions')
        .select(`
          *,
          cv_files (
            id,
            name,
            status,
            project_id,
            summary_id,
            parsed_data
          )
        `)
        .order('confidence', { ascending: false });
        
      if (candidatePositionsError) throw candidatePositionsError;
      
      if (!candidatePositions || candidatePositions.length === 0) {
        setPositions(positionsData || []);
        setAllCandidates([]);
        setFilteredCandidates([]);
        setLoading(false);
        return;
      }
      
      // Get the CV file IDs to fetch summaries
      const cvFileIds = candidatePositions
        .map(cp => cp.cv_files?.id)
        .filter(Boolean);
        
      // Fetch summaries for the candidates
      const { data: summariesData, error: summariesError } = await supabase
        .from('summaries')
        .select('*')
        .in('cv_file_id', cvFileIds);
        
      if (summariesError) throw summariesError;
      
      // Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('candidate_ratings')
        .select('*')
        .in('cv_file_id', cvFileIds);
        
      if (ratingsError) throw ratingsError;
      
      // Process candidates
      const processedCandidates = candidatePositions.map(cp => {
        const cvFile = cp.cv_files;
        if (!cvFile) return null;
        
        // Find the summary and rating
        const summary = summariesData?.find(s => s.cv_file_id === cvFile.id);
        const rating = ratingsData?.find(r => r.cv_file_id === cvFile.id);
        
        // Get candidate data
        const candidateData = summary || cvFile.parsed_data || {};
        
        return {
          id: cvFile.id,
          name: cvFile.name || candidateData.name || 'Unnamed Candidate',
          role: (candidateData.experience && candidateData.experience[0]) || 'Position Unknown',
          status: rating ? `bucket-${rating.rating.toLowerCase()}` : undefined,
          project_id: cvFile.project_id,
          skills: candidateData.skills || [],
          education: (candidateData.education && candidateData.education[0]) || 'Education Unknown',
          experience: candidateData.experience 
            ? `${candidateData.experience.length} experiences` 
            : 'Experience Unknown',
          avatar: `/assets/profile/avatar1.avif`, // Default avatar
          rating,
          position: cp.position,
          confidence: cp.confidence
        };
      }).filter(Boolean) as Candidate[];
      
      console.log('Raw positions data:', positionsData);
      
      // Count candidates per position and ensure key_skills is an array
      const positionsWithCounts = positionsData?.map(position => {
        const count = processedCandidates.filter(
          candidate => candidate.position?.toLowerCase() === position.title?.toLowerCase()
        ).length;
        
        // Ensure key_skills is an array (handle both string JSON and arrays)
        let keySkills = [];
        if (position.key_skills) {
          if (typeof position.key_skills === 'string') {
            try {
              keySkills = JSON.parse(position.key_skills);
            } catch (e) {
              // If it's not valid JSON, treat it as a comma-separated string
              keySkills = position.key_skills.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(position.key_skills)) {
            keySkills = position.key_skills;
          }
        }
        
        // Similarly handle qualifications if needed
        let qualifications = [];
        if (position.qualifications) {
          if (typeof position.qualifications === 'string') {
            try {
              qualifications = JSON.parse(position.qualifications);
            } catch (e) {
              qualifications = position.qualifications.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(position.qualifications)) {
            qualifications = position.qualifications;
          }
        }
        
        return {
          ...position,
          key_skills: keySkills,
          qualifications: qualifications,
          candidate_count: count
        };
      }) || [];
      
      console.log('Processed positions with counts:', positionsWithCounts);
      
      // Sort positions by candidate count (descending)
      positionsWithCounts.sort((a, b) => b.candidate_count - a.candidate_count);
      
      setPositions(positionsWithCounts);
      setAllCandidates(processedCandidates);
      setFilteredCandidates(processedCandidates);
      
    } catch (error) {
      console.error('Error fetching positions and candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load positions and candidates. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on initial load
  useEffect(() => {
    fetchPositionsAndCandidates();
  }, []);
  
  // Filter candidates when position changes
  useEffect(() => {
    if (activePosition) {
      const filtered = allCandidates.filter(
        candidate => candidate.position?.toLowerCase() === activePosition.title?.toLowerCase()
      );
      setFilteredCandidates(filtered);
    } else {
      setFilteredCandidates(allCandidates);
    }
  }, [activePosition, allCandidates]);
  
  // Search in positions view
  const getFilteredPositions = () => {
    if (!searchQuery.trim()) {
      return positions;
    }
    
    const query = searchQuery.toLowerCase();
    return positions.filter(position => 
      position.title.toLowerCase().includes(query) ||
      position.description.toLowerCase().includes(query) ||
      position.key_skills.some((skill: string) => skill.toLowerCase().includes(query)) ||
      position.qualifications.some((qual: string) => qual.toLowerCase().includes(query))
    );
  };

  // Filter by search query for candidates
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, reset to filter by active position
      if (activePosition) {
        const filtered = allCandidates.filter(
          candidate => candidate.position?.toLowerCase() === activePosition.title?.toLowerCase()
        );
        setFilteredCandidates(filtered);
      } else {
        setFilteredCandidates(allCandidates);
      }
      return;
    }
    
    const query = searchQuery.toLowerCase();
    let filtered = allCandidates;
    
    // If there's an active position, filter by that first
    if (activePosition) {
      filtered = filtered.filter(
        candidate => candidate.position.toLowerCase() === activePosition.title.toLowerCase()
      );
    }
    
    // Then apply the search filter
    filtered = filtered.filter(candidate => 
      candidate.name.toLowerCase().includes(query) ||
      (candidate.position && candidate.position.toLowerCase().includes(query)) ||
      (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.some(skill => 
        typeof skill === 'string' && skill.toLowerCase().includes(query)
      )) ||
      (candidate.education && candidate.education.toLowerCase().includes(query)) ||
      (candidate.experience && candidate.experience.toLowerCase().includes(query))
    );
    
    setFilteredCandidates(filtered);
  }, [searchQuery, activePosition, allCandidates]);
  
  // Handle view candidate details
  const handleViewCandidate = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setViewMode('detail');
  };
  
  // Handle view position candidates
  const handleViewPosition = (position: Position) => {
    setActivePosition(position);
    setViewMode('candidates');
  };
  
  // Function to get a color for a position (used for folder styling)
  const getPositionColor = (position: Position, index: number) => {
    // Premium gradient colors with improved visual contrast
    const colors = [
      {
        gradient: 'from-purple-50 via-purple-100 to-white',
        accentGradient: 'from-purple-600 to-purple-400',
        text: 'text-purple-800',
        lightText: 'text-purple-700',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        badgeBg: 'bg-purple-50',
        hoverBg: 'hover:bg-purple-50'
      },
      {
        gradient: 'from-blue-50 via-blue-100 to-white',
        accentGradient: 'from-blue-600 to-blue-400',
        text: 'text-blue-800',
        lightText: 'text-blue-700',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        badgeBg: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-50'
      },
      {
        gradient: 'from-emerald-50 via-emerald-100 to-white',
        accentGradient: 'from-emerald-600 to-emerald-400',
        text: 'text-emerald-800',
        lightText: 'text-emerald-700',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        badgeBg: 'bg-emerald-50',
        hoverBg: 'hover:bg-emerald-50'
      },
      {
        gradient: 'from-amber-50 via-amber-100 to-white',
        accentGradient: 'from-amber-600 to-amber-400',
        text: 'text-amber-800',
        lightText: 'text-amber-700',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        badgeBg: 'bg-amber-50',
        hoverBg: 'hover:bg-amber-50'
      },
      {
        gradient: 'from-rose-50 via-rose-100 to-white',
        accentGradient: 'from-rose-600 to-rose-400',
        text: 'text-rose-800',
        lightText: 'text-rose-700',
        border: 'border-rose-200',
        iconBg: 'bg-rose-100',
        badgeBg: 'bg-rose-50',
        hoverBg: 'hover:bg-rose-50'
      },
      {
        gradient: 'from-indigo-50 via-indigo-100 to-white',
        accentGradient: 'from-indigo-600 to-indigo-400',
        text: 'text-indigo-800',
        lightText: 'text-indigo-700',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        badgeBg: 'bg-indigo-50',
        hoverBg: 'hover:bg-indigo-50'
      },
    ];
    
    // Use modulo to cycle through colors
    return colors[index % colors.length];
  };
  
  // Position-specific icons instead of generic folders
  const getPositionIcon = (position: Position) => {
    const title = position.title.toLowerCase();
    
    if (title.includes('engineer') || title.includes('developer')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>; // Code icon
    }
    if (title.includes('data') || title.includes('scientist') || title.includes('analyst')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>; // Chart icon
    }
    if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>; // Smile icon
    }
    if (title.includes('product') || title.includes('manager')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; // Users icon
    }
    if (title.includes('marketing') || title.includes('sales')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M5 3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z"/><path d="M16 8.5 18 10l-7 8-5-5 1.5-1.5L11 15Z"/></svg>; // Check Square icon
    }
    // Default icon
    return <Briefcase className="h-5 w-5" />;
  };
  
  // Render the positions view (folders)
  const renderPositionsView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      );
    }
    
    if (positions.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <div className="rounded-full bg-gray-50 p-3 mx-auto w-fit">
            <Briefcase className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-xl font-medium text-gray-900 mt-4">
            No positions found
          </div>
          <p className="text-gray-500 mt-2">
            Upload and process some resumes to start seeing position matches.
          </p>
        </div>
      );
    }
    
    // Get filtered positions based on search query
    const filteredPositions = getFilteredPositions();
    
    // Show empty state if no matching positions after filtering
    if (filteredPositions.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <div className="rounded-full bg-gray-50 p-3 mx-auto w-fit">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-xl font-medium text-gray-900 mt-4">
            No positions found
          </div>
          <p className="text-gray-500 mt-2">
            No positions match your search. Try different keywords.
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPositions.map((position, index) => (
          <Card 
            key={position.id} 
            className={cn(
              "cursor-pointer overflow-hidden border transition-all hover:shadow-lg relative",
              position.candidate_count > 0 ? "opacity-100" : "opacity-85"
            )}
            onClick={() => handleViewPosition(position)}
          >
            {/* Position color scheme */}
            {position.candidate_count > 0 && (
              <div className={cn(
                "absolute top-0 left-0 h-1 w-full bg-gradient-to-r",
                getPositionColor(position, index).accentGradient
              )} />
            )}
            
            <div className={cn(
              "h-full flex flex-col bg-gradient-to-br",
              getPositionColor(position, index).gradient
            )}>
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-full p-2 flex items-center justify-center",
                    getPositionColor(position, index).iconBg
                  )}>
                    {getPositionIcon(position)}
                  </div>
                  <div>
                    <CardTitle className={cn(
                      "text-lg font-semibold",
                      getPositionColor(position, index).text
                    )}>
                      {position.title}
                    </CardTitle>
                    {position.candidate_count > 0 && (
                      <p className={cn(
                        "text-xs font-medium mt-1",
                        getPositionColor(position, index).lightText
                      )}>
                        {position.candidate_count} {position.candidate_count === 1 ? 'Candidate' : 'Candidates'}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "bg-white/80 backdrop-blur-sm",
                  position.candidate_count > 0 
                    ? getPositionColor(position, index).text
                    : "text-gray-500"
                )}>
                  {position.candidate_count > 0 ? "Active" : "No Candidates"}
                </Badge>
              </CardHeader>
              
              <CardContent className="p-5 pt-0 h-full flex flex-col">
                <p className={cn(
                  "text-sm mb-4 flex-1 leading-relaxed",
                  position.candidate_count > 0
                    ? "text-gray-700"
                    : "text-gray-500"
                )}>
                  {position.description}
                </p>
                
                <div className="text-xs space-y-3">
                  {position.key_skills.length > 0 && (
                    <div>
                      <p className={cn(
                        "font-medium mb-2",
                        getPositionColor(position, index).text
                      )}>
                        Key Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {position.key_skills.slice(0, 5).map((skill, i) => (
                          <span 
                            key={i} 
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium", 
                              getPositionColor(position, index).badgeBg,
                              getPositionColor(position, index).text
                            )}
                          >
                            {skill}
                          </span>
                        ))}
                        {position.key_skills.length > 5 && (
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            "bg-gray-100 text-gray-700"
                          )}>
                            +{position.key_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <Button 
                    variant={position.candidate_count > 0 ? "default" : "outline"}
                    size="sm" 
                    className={cn(
                      position.candidate_count > 0
                        ? "bg-gradient-to-r shadow-sm"
                        : "",
                      getPositionColor(position, index).accentGradient,
                      position.candidate_count > 0 ? "text-white" : getPositionColor(position, index).text
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the card's onClick from also firing
                      handleViewPosition(position);
                    }}
                  >
                    {position.candidate_count > 0 
                      ? <>
                          View Candidates <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      : <>
                          View Position
                        </>
                    }
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render candidates for a selected position
  const renderCandidatesView = () => {
    if (!activePosition) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => {
              setActivePosition(null);
              setViewMode('positions');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Positions
          </Button>
          <h2 className="text-xl font-medium">{activePosition.title}</h2>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-2",
              getPositionColor(activePosition, 0).badgeBg,
              getPositionColor(activePosition, 0).text
            )}
          >
            {filteredCandidates.length} {filteredCandidates.length === 1 ? 'Candidate' : 'Candidates'}
          </Badge>
        </div>
        
        {filteredCandidates.length > 0 ? (
          <CandidateTable 
            title={`Candidates for ${activePosition.title}`}
            candidates={filteredCandidates}
            onViewCandidate={handleViewCandidate}
          />
        ) : (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-50 p-6 mb-4">
                <Briefcase className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No candidates found for {activePosition.title}
              </h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                There are currently no candidates matching this position. Upload new resumes to find potential matches or check back later.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setActivePosition(null);
                  setViewMode('positions');
                }}
              >
                Back to all positions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  // Updated renderCandidateDetails function to match the one in Candidates.tsx
  const renderCandidateDetails = () => {
    if (!activeCandidate) return null;
    
    const { name, skills, role, education, experience, parsed, status, position, confidence } = activeCandidate;
    const candidateName = parsed?.name || name;
    
    // Get bucket counts (hardcoded similar to Candidates.tsx since we don't have real data here)
    const bucketCounts = { a: 0, b: 0, c: 0, d: 0, unrated: 0 };
    if (status === 'bucket-a') bucketCounts.a = 1;
    else if (status === 'bucket-b') bucketCounts.b = 1;
    else if (status === 'bucket-c') bucketCounts.c = 1;
    else if (status === 'bucket-d') bucketCounts.d = 1;
    else bucketCounts.unrated = 1;

    // Handle bucket selection (following Candidates.tsx pattern)
    const handleBucketChange = async (newBucket: string | null) => {
      try {
        setLoading(true);
        
        if (!newBucket) return; // No bucket selected
        
        // Update the candidate rating in the database
        const { error } = await supabase
          .from('candidate_ratings')
          .upsert({
            cv_file_id: activeCandidate.id,
            rating: newBucket.replace('bucket-', '').toUpperCase(),
            project_id: activeCandidate.project_id,
          }, { onConflict: 'cv_file_id' });
        
        if (error) throw error;
        
        // Update local state
        setActiveCandidate({
          ...activeCandidate,
          status: newBucket
        });
        
        // Update in the filtered candidates list
        const updatedCandidates = filteredCandidates.map(c => 
          c.id === activeCandidate.id ? { ...c, status: newBucket } : c
        );
        setFilteredCandidates(updatedCandidates);
        
        // Update in all candidates list
        const updatedAllCandidates = allCandidates.map(c => 
          c.id === activeCandidate.id ? { ...c, status: newBucket } : c
        );
        setAllCandidates(updatedAllCandidates);
        
        toast({
          title: "Rating updated",
          description: `Candidate placed in ${newBucket.replace('bucket-', 'Bucket ')}`,
        });
      } catch (error) {
        console.error('Error updating bucket:', error);
        toast({
          title: "Error",
          description: "Failed to update candidate rating.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => {
              setActiveCandidate(null);
              setViewMode('candidates');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
          <h2 className="text-xl font-medium">{candidateName}</h2>
          <Badge 
            className={cn(
              "ml-2",
              status === 'bucket-a' ? "bg-green-100 text-green-800" : 
              status === 'bucket-b' ? "bg-blue-100 text-blue-800" :
              status === 'bucket-c' ? "bg-orange-100 text-orange-800" :
              status === 'bucket-d' ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-800"
            )}
          >
            {status === 'bucket-a' ? "Excellent Match" :
             status === 'bucket-b' ? "Good Match" :
             status === 'bucket-c' ? "Potential Match" :
             status === 'bucket-d' ? "Consider Later" :
             "Unrated"}
          </Badge>
        </div>

        {/* Bucket Selector (now matching Candidates.tsx) */}
        <BucketSelector 
          selectedBucket={status} 
          onBucketChange={handleBucketChange} 
          counts={bucketCounts}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Basic info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Candidate Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full overflow-hidden">
                      <img 
                        src={activeCandidate.avatar || "/assets/profile/avatar1.avif"} 
                        alt={candidateName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{candidateName}</h3>
                    <p className="text-gray-500">{role || position || "No role specified"}</p>
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    {position && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Position Match</p>
                        <div className="flex items-center mt-1">
                          <div className="flex-1 mr-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div 
                                className={cn(
                                  "h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500",
                                  confidence < 40 ? "bg-red-500" : 
                                  confidence < 70 ? "bg-amber-500" : "bg-green-500"
                                )}
                                style={{ width: `${confidence}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            {confidence}%
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">{position}</p>
                      </div>
                    )}
                    
                    {activeCandidate.rating && (
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-500">Rating</p>
                        <div className="flex items-center mt-1">
                          <Badge
                            className={cn(
                              status === 'bucket-a' ? "bg-green-100 text-green-800" : 
                              status === 'bucket-b' ? "bg-blue-100 text-blue-800" :
                              status === 'bucket-c' ? "bg-orange-100 text-orange-800" :
                              status === 'bucket-d' ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            )}
                          >
                            {status === 'bucket-a' ? "Excellent Match" :
                             status === 'bucket-b' ? "Good Match" :
                             status === 'bucket-c' ? "Potential Match" :
                             status === 'bucket-d' ? "Consider Later" :
                             "Unrated"}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {activeCandidate.cvFile?.storage_url && (
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() => window.open(activeCandidate.cvFile?.storage_url, '_blank')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15v-2"/><path d="M12 15v-6"/><path d="M15 15v-4"/></svg>
                          View Resume
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Middle and Right columns - Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills && skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No skills information available</p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(education) ? (
                  <div className="space-y-4">
                    {education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-purple-200 pl-4">
                        <p className="font-medium">{edu}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-l-2 border-purple-200 pl-4">
                    <p>{education || "No education information available"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(experience) ? (
                  <div className="space-y-4">
                    {experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-purple-200 pl-4 py-2">
                        <p className="font-medium">{exp}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-l-2 border-purple-200 pl-4">
                    <p>{experience || "No experience information available"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      
      <div className="pl-64 pt-16">
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Positions</h1>
              <p className="text-gray-500">
                Browse candidates organized by their inferred job positions
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search positions or candidates..."
                className="pl-10 w-64"
              />
            </div>
          </div>
          
          {/* Display different views based on the current mode */}
          {viewMode === 'positions' && renderPositionsView()}
          {viewMode === 'candidates' && renderCandidatesView()}
          {viewMode === 'detail' && renderCandidateDetails()}
          
          {loading && (
            <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
              <LoadingAnimation />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Positions;
