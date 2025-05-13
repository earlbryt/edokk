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
    // Colors for folders - premium gradient colors
    const colors = [
      'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
      'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
      'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
      'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
      'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
    ];
    
    // Use modulo to cycle through colors
    return colors[index % colors.length];
  };
  
  // Render folder icon for positions
  const renderFolderIcon = (active: boolean) => {
    return active ? 
      <FolderOpen className="h-6 w-6" /> : 
      <Folders className="h-6 w-6" />;
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
              "cursor-pointer overflow-hidden border transition-all hover:shadow-md",
              position.candidate_count > 0 ? "opacity-100" : "opacity-70"
            )}
            onClick={() => handleViewPosition(position)}
          >
            <div className={cn(
              "h-full flex flex-col bg-gradient-to-br",
              getPositionColor(position, index)
            )}>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderFolderIcon(false)}
                  <CardTitle className="text-lg font-semibold">{position.title}</CardTitle>
                </div>
                <Badge variant="outline" className={cn(
                  "bg-white/70 backdrop-blur-sm",
                  position.candidate_count > 0 ? "" : "text-gray-500"
                )}>
                  {position.candidate_count} {position.candidate_count === 1 ? 'Candidate' : 'Candidates'}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2 h-full flex flex-col">
                <p className="text-sm mb-3 flex-1">{position.description}</p>
                
                <div className="text-xs space-y-2">
                  {position.key_skills.length > 0 && (
                    <div>
                      <strong>Key Skills:</strong> 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {position.key_skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                        {position.key_skills.length > 5 && (
                          <span className="bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">
                            +{position.key_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {position.candidate_count > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 self-end bg-white/50 hover:bg-white/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the card's onClick from also firing
                      handleViewPosition(position);
                    }}
                  >
                    View Candidates <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
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
              getPositionColor(activePosition, 0).split(' ')[0],
              getPositionColor(activePosition, 0).split(' ')[2]
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
  
  // Render candidate details view
  const renderCandidateDetails = () => {
    if (!activeCandidate) return null;
    
    // This is reusing the detailed view from Candidates page
    // You can render the candidate details similarly to how it's done in the Candidates component
    const parsed = activeCandidate.parsed || {};
    const candidateName = parsed.name || activeCandidate.name;
    
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
               activeCandidate.status === 'bucket-d' ? "Consider Later" :
               "Unrated"}
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className="ml-2 bg-purple-50 text-purple-700 border-purple-200"
          >
            {activeCandidate.position} ({activeCandidate.confidence}%)
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Display candidate details */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {candidateName}
                </h3>
                <p className="text-gray-600">
                  {activeCandidate.position} • {activeCandidate.confidence}% Match
                </p>
              </div>
              
              {/* Skills Section */}
              {activeCandidate.skills && activeCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeCandidate.skills.map((skill, index) => (
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
              )}
              
              {/* Experience Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Experience</h4>
                <p className="text-sm text-gray-600">
                  {activeCandidate.experience}
                </p>
              </div>
              
              {/* Education Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Education</h4>
                <p className="text-sm text-gray-600">
                  {activeCandidate.education}
                </p>
              </div>
              
              {/* Position Match Explanation */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">
                  Position Match: {activeCandidate.position}
                </h4>
                <div className="flex items-center mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${activeCandidate.confidence}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-purple-700">
                    {activeCandidate.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
