import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, ArrowUpRight, CheckCircle, Clock, AlertTriangle, XCircle, BarChart, Filter, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { matchCandidate, MatchCandidateResult } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import BucketSelector from './BucketSelector';

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
}

const CandidateTable: React.FC<CandidateTableProps> = ({
  title,
  candidates
}) => {
  const [processingCandidates, setProcessingCandidates] = useState<Record<string, boolean>>({});
  const [candidatesMap, setCandidatesMap] = useState<Record<string, Candidate>>({});
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
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
    if (!candidate.project_id) {
      toast({
        title: "Error",
        description: "Candidate must be associated with a project to be rated",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingCandidates(prev => ({ ...prev, [candidate.id]: true }));
    
    try {
      const result = await matchCandidate({
        candidate_id: candidate.id,
        project_id: candidate.project_id
      });
      
      if (result) {
        toast({
          title: "Candidate Rated",
          description: `${candidate.name} has been rated as Category ${result.rating}`,
        });
        
        // Update the candidate with the rating result
        candidate.rating = result;
        candidate.status = `bucket-${result.rating.toLowerCase()}`;
      } else {
        toast({
          title: "Rating Failed",
          description: "Could not rate the candidate. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error rating candidate:", error);
      toast({
        title: "Rating Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setProcessingCandidates(prev => ({ ...prev, [candidate.id]: false }));
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
            Unrated
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
        icon = <CheckCircle className="h-3 w-3 mr-1 text-green-600" />;
        break;
      case 'bucket-b':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'B';
        icon = <Clock className="h-3 w-3 mr-1 text-blue-600" />;
        break;
      case 'bucket-c':
        badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'C';
        icon = <AlertTriangle className="h-3 w-3 mr-1 text-orange-600" />;
        break;
      case 'bucket-d':
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
        label = 'D';
        icon = <XCircle className="h-3 w-3 mr-1 text-red-600" />;
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
              >
                <div className="flex items-center mb-3">
                  <div className={`mr-3 p-2 rounded-lg ${getBucketColor(candidate.status)}`}>
                    {getBucketIcon(candidate.status, candidate)}
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
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          title="View Candidate"
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

  // Helper function to get the background color based on status
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
  
  // Helper function to get the icon based on status
  const getBucketIcon = (status?: string, candidate?: Candidate) => {
    if (!status) {
      // Check if candidate was recently uploaded
      const isRecentlyUploaded = candidate && 
        candidate.upload_date && 
        (new Date().getTime() - new Date(candidate.upload_date).getTime() < 5 * 60 * 1000); // 5 minutes
      
      return isRecentlyUploaded ? 
        <Clock className="h-6 w-6 text-purple-600" /> : 
        <User className="h-6 w-6 text-gray-600" />;
    }
    
    switch(status) {
      case 'bucket-a':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'bucket-b':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'bucket-c':
        return <AlertTriangle className="h-6 w-6 text-orange-600" />;
      case 'bucket-d':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <User className="h-6 w-6 text-gray-600" />;
    }
  };

export default CandidateTable;
