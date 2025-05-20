import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ArrowUpRight, CheckCircle, Clock, Star, Medal, Award, Badge as BadgeIcon, Bookmark, BarChart, Filter, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchCandidate, MatchCandidateResult } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import BucketSelector from './BucketSelector';

// Available profile pictures
const PROFILE_PICTURES = [
  '/assets/profile/androgynous-avatar-non-binary-queer-person.jpg',
  '/assets/profile/avatar1.avif',
  '/assets/profile/androgynous-avatar-non-binary-queer-person_23-2151100279.png',
  '/assets/profile/3d-cartoon-portrait-person-practicing-law-related-profession_23-2151419551.png',
  '/assets/profile/memoji-african-american-man-white-background-emoji_826801-6856.png',
  '/assets/profile/memoji-african-american-man-white-background-emoji_826801-6857.png'
];

type Candidate = {
  id: string;
  name: string;
  role: string;
  status?: string;
  score?: number;
  skills: string[];
  education: string;
  experience: string;
  avatar: string;
  project_id: string;
  rating?: MatchCandidateResult | null;
  upload_date?: string; // ISO date string when the candidate was uploaded
  text_extraction_date?: string; // Optional: when text was extracted
  processing_date?: string; // Optional: when processing started
};

interface CandidateTableProps {
  title: string;
  candidates: Candidate[];
  onViewCandidate?: (candidate: Candidate) => void;
}

const CandidateTable: React.FC<CandidateTableProps> = ({
  title,
  candidates,
  onViewCandidate
}) => {
  const [processingCandidates, setProcessingCandidates] = useState<Record<string, boolean>>({});
  const [candidatesMap, setCandidatesMap] = useState<Record<string, Candidate>>({});
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Convert candidates array to map for easier updates
  useEffect(() => {
    const newMap: Record<string, Candidate> = {};
    candidates.forEach(candidate => {
      newMap[candidate.id] = { ...candidate };
    });
    setCandidatesMap(newMap);
  }, [candidates]);
  
  // Set up realtime subscription for candidate ratings
  useEffect(() => {
    // Subscribe to changes in the candidate_ratings table
    const subscription = supabase
      .channel('candidate-ratings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidate_ratings',
        },
        (payload) => {
          console.log('Received realtime update:', payload);
          const { new: newRating } = payload;
          
          // If this rating is for one of our candidates, update it
          if (newRating && candidatesMap[newRating.cv_file_id]) {
            const updatedCandidate = { ...candidatesMap[newRating.cv_file_id] };
            updatedCandidate.rating = newRating;
            updatedCandidate.status = `bucket-${newRating.rating.toLowerCase()}`;
            
            setCandidatesMap(prev => ({
              ...prev,
              [newRating.cv_file_id]: updatedCandidate
            }));
            
            toast({
              title: "Candidate Rated",
              description: `${updatedCandidate.name} has been rated as Category ${newRating.rating}`,
            });
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [candidatesMap, toast]);
  
  // Function to handle rating a candidate
  const handleRateCandidate = async (candidate: Candidate) => {
    if (processingCandidates[candidate.id]) return;
    
    setProcessingCandidates(prev => ({ ...prev, [candidate.id]: true }));
    
    try {
      // Use the matchCandidate utility function instead of direct RPC
      const ratingData = await matchCandidate({
        candidate_id: candidate.id,
        project_id: candidate.project_id
      });
      
      if (!ratingData) {
        throw new Error("Failed to rate candidate");
      }
      
      // Update UI
      setCandidatesMap(prev => {
        const updated = { ...prev };
        if (updated[candidate.id]) {
          updated[candidate.id] = {
            ...updated[candidate.id],
            rating: ratingData,
            status: ratingData?.rating ? `bucket-${ratingData.rating.toLowerCase()}` : undefined
          };
        }
        return updated;
      });
      
      // Update rating in database
      await supabase
        .from('cv_files')
        .update({
          status: ratingData?.rating ? `bucket-${ratingData.rating.toLowerCase()}` : 'completed',
        })
        .eq('id', candidate.id);
      
      toast({
        title: 'Candidate Rated',
        description: `${candidate.name} has been rated and categorized`
      });
    } catch (error: any) {
      console.error('Error rating candidate:', error);
      
      // Check if this is the specific "No requirements" error
      if (error.message && error.message.includes('No requirements found')) {
        toast({
          title: 'Requirements Missing',
          description: 'Please define requirements for this position before rating candidates. Go to the "Requirements" tab in the position details.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to rate candidate. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setProcessingCandidates(prev => {
        const updated = { ...prev };
        delete updated[candidate.id];
        return updated;
      });
    }
  };

  // Function to render badge based on candidate status
  const renderStatusBadge = (status?: string, candidate?: Candidate) => {
    if (!status) {
      // Check the candidate's upload timestamp
      const isRecentlyUploaded = candidate && 
        candidate.upload_date && 
        (new Date().getTime() - new Date(candidate.upload_date).getTime() < 5 * 60 * 1000); // 5 minutes
      
      if (isRecentlyUploaded) {
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Clock className="h-3 w-3 mr-1 text-purple-600" /> Processing
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Bookmark className="h-3 w-3 mr-1 text-gray-600" /> Review
          </Badge>
        );
      }
    }
    
    let badgeClass = '';
    let label = '';
    let icon = null;
    
    switch(status) {
      case 'bucket-a':
        badgeClass = 'bg-green-50 text-green-700 border-green-200';
        label = 'A';
        icon = <Star className="h-3 w-3 mr-1 text-green-600" />;
        break;
      case 'bucket-b':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'B';
        icon = <Medal className="h-3 w-3 mr-1 text-blue-600" />;
        break;
      case 'bucket-c':
        badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'C';
        icon = <Award className="h-3 w-3 mr-1 text-orange-600" />;
        break;
      case 'bucket-d':
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
        label = 'D';
        icon = <BadgeIcon className="h-3 w-3 mr-1 text-red-600" />;
        break;
      default:
        badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
        label = 'Unknown';
    }
    
    return (
      <Badge variant="outline" className={badgeClass}>
        {icon}{label}
      </Badge>
    );
  };
  
  // Function to get bucket name from status
  const getBucketName = (status?: string, candidate?: Candidate) => {
    if (!status) {
      // Check if candidate was recently uploaded (consistent with renderStatusBadge)
      const isRecentlyUploaded = candidate && 
        candidate.upload_date && 
        (new Date().getTime() - new Date(candidate.upload_date).getTime() < 5 * 60 * 1000); // 5 minutes
      
      return isRecentlyUploaded ? 'Processing' : 'Not Rated';
    }
    
    switch(status) {
      case 'bucket-a':
        return 'Excellent Match';
      case 'bucket-b':
        return 'Good Match';
      case 'bucket-c':
        return 'Potential Match';
      case 'bucket-d':
        return 'Not Suitable';
      default:
        return 'Unknown';
    }
  };

  // Calculate counts for each bucket
  const bucketCounts = {
    a: Object.values(candidatesMap).filter(c => c.status === 'bucket-a').length,
    b: Object.values(candidatesMap).filter(c => c.status === 'bucket-b').length,
    c: Object.values(candidatesMap).filter(c => c.status === 'bucket-c').length,
    d: Object.values(candidatesMap).filter(c => c.status === 'bucket-d').length,
    unrated: Object.values(candidatesMap).filter(c => !c.status).length
  };

  // Filter candidates based on selected bucket
  const filteredCandidates = selectedBucket
    ? Object.values(candidatesMap).filter(c => c.status === selectedBucket)
    : Object.values(candidatesMap);

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-100">
        <CardTitle className="font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <BucketSelector 
            selectedBucket={selectedBucket}
            onBucketChange={setSelectedBucket}
            counts={bucketCounts}
          />
        </div>
        
        {filteredCandidates.length > 0 ? (
          <div className="space-y-2">
            {filteredCandidates.map((candidate) => (
              <div 
                key={candidate.id} 
                className="p-4 border rounded-lg cursor-pointer hover:border-lens-purple transition-colors"
                onClick={() => onViewCandidate && onViewCandidate(candidate)}
              >
                <div className="flex items-center mb-3">
                  <div className="mr-3 h-12 w-12 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: getBucketBorderColor(candidate.status) }}>
                    <img 
                      src={getProfilePicture(candidate.id)}
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{candidate.name ? candidate.name.replace(/\.pdf$/i, '') : ''}</span>
                        {renderStatusBadge(candidate.status, candidate)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {processingCandidates[candidate.id] && (
                          <Progress value={50} className="w-16" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title="Rate Candidate"
                          onClick={() => handleRateCandidate(candidate)}
                          disabled={processingCandidates[candidate.id]}
                        >
                          <BarChart className="h-4 w-4" />
                        </Button>
                        
                        {candidate.rating && candidate.rating.rating_reason && (
                          <Dialog open={openDialogId === candidate.id} onOpenChange={(open) => {
                            if (open) {
                              setOpenDialogId(candidate.id);
                            } else {
                              setOpenDialogId(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                title="Rating Reason"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <span className="text-lens-purple">Rating Explanation</span>
                                  {candidate.status && (
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        candidate.status === 'bucket-a' ? "bg-green-50 text-green-700 border-green-200" :
                                        candidate.status === 'bucket-b' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        candidate.status === 'bucket-c' ? "bg-orange-50 text-orange-700 border-orange-200" :
                                        candidate.status === 'bucket-d' ? "bg-red-50 text-red-700 border-red-200" :
                                        "bg-gray-50 text-gray-700 border-gray-200"
                                      )}
                                    >
                                      {candidate.status === 'bucket-a' ? "A" :
                                      candidate.status === 'bucket-b' ? "B" :
                                      candidate.status === 'bucket-c' ? "C" :
                                      candidate.status === 'bucket-d' ? "D" : ""}
                                    </Badge>
                                  )}
                                </DialogTitle>
                                <DialogDescription>
                                  Explanation for why this candidate was rated as they were.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="p-4 bg-gray-50 rounded-md border border-gray-100 max-h-[60vh] overflow-y-auto">
                                <p className="text-sm whitespace-pre-line">{candidate.rating.rating_reason}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title="View Candidate"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCandidate && onViewCandidate(candidate);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {candidate.role && (
                      <div className="text-xs text-gray-500 mt-1">
                        {candidate.role}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Experience Column */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Experience</div>
                    <div className="text-xs text-gray-700">{candidate.experience || 'No experience listed'}</div>
                  </div>
                  
                  {/* Skills Column */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 3).map((skill, i) => (
                        <span 
                          key={i}
                          className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-0.5 rounded-md font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="bg-lens-purple bg-opacity-10 text-lens-purple border border-lens-purple border-opacity-20 text-xs px-2.5 py-0.5 rounded-md font-medium">
                          +{candidate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <div className="rounded-full bg-gray-50 p-3 mx-auto w-fit">
              {selectedBucket && selectedBucket === 'bucket-a' ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : selectedBucket && selectedBucket === 'bucket-b' ? (
                <Clock className="h-6 w-6 text-blue-400" />
              ) : selectedBucket && selectedBucket === 'bucket-c' ? (
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              ) : selectedBucket && selectedBucket === 'bucket-d' ? (
                <XCircle className="h-6 w-6 text-red-400" />
              ) : (
                <User className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="text-xl font-medium text-gray-900 mt-4">
              No candidates{selectedBucket ? ` in ${getBucketName(selectedBucket)}` : ''}
            </div>
            <p className="text-gray-500 mt-2">
              {selectedBucket ? 'No candidates match this filter yet' : 'Upload and rate some resumes to get started'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

  // Helper function to get border color based on status (for profile picture)
  const getBucketBorderColor = (status?: string) => {
    if (!status) return '#d1d5db'; // gray-300
    
    switch(status) {
      case 'bucket-a':
        return '#10b981'; // green-500
      case 'bucket-b':
        return '#3b82f6'; // blue-500
      case 'bucket-c':
        return '#f97316'; // orange-500
      case 'bucket-d':
        return '#ef4444'; // red-500
      default:
        return '#d1d5db'; // gray-300
    }
  };
  
  // Helper function to deterministically select a profile picture based on the candidate ID
  const getProfilePicture = (candidateId: string) => {
    // Create a more diverse hash from the entire ID
    // Use the sum of character codes to create a better distribution
    let charSum = 0;
    for (let i = 0; i < candidateId.length; i++) {
      charSum += candidateId.charCodeAt(i);
    }
    
    // Add the length of the ID to further improve distribution
    charSum += candidateId.length + candidateId.charCodeAt(0) + candidateId.charCodeAt(candidateId.length - 1);
    
    // Use the entire ID's hash to select a picture
    const pictureIndex = Math.abs(charSum) % PROFILE_PICTURES.length;
    
    return PROFILE_PICTURES[pictureIndex];
  };
  
  // Helper function to get the background color based on status
  // Keep this for other parts of the UI that might need it
  const getBucketColor = (status?: string) => {
    if (!status) return 'bg-gray-100';
    
    switch(status) {
      case 'bucket-a':
        return 'bg-green-100';
      case 'bucket-b':
        return 'bg-blue-100';
      case 'bucket-c':
        return 'bg-orange-100';
      case 'bucket-d':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

export default CandidateTable;
