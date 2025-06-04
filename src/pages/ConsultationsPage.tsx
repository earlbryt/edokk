
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Calendar, Clock, X, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { sendConsultationConfirmationEmail } from '@/utils/email';
import { useAuth } from '@/context/AuthContext';

// Define the consultation type
interface Consultation {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  consultation_type: 'virtual' | 'in_person';
  preferred_date: string;
  preferred_time: string;
  symptoms: string[];
  additional_notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  user_id: string;
}

const ConsultationsPage: React.FC = () => {
  const { user } = useAuth(); // Add useAuth hook to get current user
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    // Apply filters when activeTab or searchQuery changes
    filterConsultations();
  }, [activeTab, searchQuery, consultations]);

  const fetchConsultations = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to fetch consultations for admin view');
      
      // For the admin dashboard, we want to fetch all consultations without filtering by user_id
      // This makes it simpler and avoids issues with database schema changes
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Database error when fetching consultations:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} consultations`);
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load consultations. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterConsultations = () => {
    let filtered = [...consultations];
    
    // Apply status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(consultation => consultation.status === activeTab);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        consultation => 
          consultation.full_name.toLowerCase().includes(query) ||
          consultation.email.toLowerCase().includes(query) ||
          (consultation.additional_notes && consultation.additional_notes.toLowerCase().includes(query)) ||
          consultation.symptoms.some(symptom => symptom.toLowerCase().includes(query))
      );
    }
    
    setFilteredConsultations(filtered);
  };

  // Update consultation status (only allow confirming pending consultations)
  const updateConsultationStatus = async (id: string, status: 'confirmed') => {
    try {
      setIsLoading(true);
      
      // Find the consultation to be updated
      const consultationToUpdate = consultations.find(c => c.id === id);
      
      if (!consultationToUpdate) {
        throw new Error('Consultation not found');
      }
      
      // Update the status in the database
      const { error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setConsultations(prevConsultations => 
        prevConsultations.map(consultation => 
          consultation.id === id ? { ...consultation, status } : consultation
        )
      );
      
      // Send confirmation email if status is changed to confirmed
      if (status === 'confirmed') {
        console.log('Confirmed consultation, preparing to send email notification...');
        try {
          // Format date and time for email
          const formattedDate = formatDate(consultationToUpdate.preferred_date);
          const formattedTime = consultationToUpdate.preferred_time;
          
          console.log('Email data prepared:', {
            email: consultationToUpdate.email,
            name: consultationToUpdate.full_name,
            date: formattedDate,
            time: formattedTime,
            type: consultationToUpdate.consultation_type
          });
          
          // Send the confirmation email
          console.log('Calling sendConsultationConfirmationEmail function...');
          const emailResult = await sendConsultationConfirmationEmail(
            consultationToUpdate.email,
            consultationToUpdate.full_name,
            formattedDate,
            formattedTime,
            consultationToUpdate.consultation_type
          );
          
          console.log('Email sending result:', emailResult);
          
          if (emailResult.success) {
            toast({
              title: 'Success',
              description: `Consultation confirmed and email notification sent to patient.`,
            });
          } else {
            console.error('Email sending failed but returned without throwing:', emailResult);
            toast({
              title: 'Warning',
              description: 'Consultation was confirmed but there was an issue sending the email notification.',
              variant: 'destructive',
            });
          }
        } catch (emailError) {
          console.error('Error in email sending process:', emailError);
          console.error('Error details:', JSON.stringify(emailError, null, 2));
          toast({
            title: 'Warning',
            description: 'Consultation was confirmed but we couldn\'t send the email notification.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: `Consultation status updated to ${status}.`,
        });
      }
      
    } catch (error) {
      console.error('Error updating consultation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update consultation status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge based on consultation status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get count by status
  const countByStatus = (status: string | null) => {
    if (status === null) return consultations.length;
    return consultations.filter(c => c.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-8 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Consultations Management</h1>
              <p className="text-gray-600">
                Manage all patient consultation requests
              </p>
            </div>
            
            {/* Search in Top Right */}
            <div className="relative w-64 mt-2 sm:mt-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search consultations..." 
                className="pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{countByStatus(null)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-yellow-50 rounded-full">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold">{countByStatus('pending')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-50 rounded-full">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold">{countByStatus('confirmed')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Consultations Table */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>All Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full max-w-md mx-auto mb-6" style={{ background: 'rgba(125, 94, 234, 0.05)', borderColor: 'rgba(125, 94, 234, 0.2)' }}>
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">All <span className="ml-1 text-xs">({countByStatus(null)})</span></TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">Pending <span className="ml-1 text-xs">({countByStatus('pending')})</span></TabsTrigger>
                  <TabsTrigger value="confirmed" className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">Confirmed <span className="ml-1 text-xs">({countByStatus('confirmed')})</span></TabsTrigger>
                </TabsList>

                {/* Table Content - Same for all tabs, filtering done in JS */}
                <TabsContent value={activeTab} className="mt-0">
                  {isLoading ? (
                    <div className="text-center py-10">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                      <p className="mt-2 text-gray-500">Loading consultations...</p>
                    </div>
                  ) : filteredConsultations.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No consultations found</h3>
                      <p className="mt-1 text-gray-500">
                        {searchQuery 
                          ? "Try adjusting your search query or filters" 
                          : `No ${activeTab !== 'all' ? activeTab : ''} consultations available`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredConsultations.map((consultation) => {
                        // Calculate border color based on status
                        const getBorderColor = (status: string) => {
                          switch(status) {
                            case 'confirmed':
                              return '#10b981'; // green-500
                            case 'pending':
                              return '#f59e0b'; // amber-500
                            default:
                              return '#d1d5db'; // gray-300
                          }
                        };
                        
                        // Random profile pictures (would be replaced with actual patient photos in a real app)
                        const PROFILE_PICTURES = [
                          '/assets/profile/avatar1.avif',
                          '/assets/profile/androgynous-avatar-non-binary-queer-person.jpg',
                          '/assets/profile/androgynous-avatar-non-binary-queer-person_23-2151100279.png',
                          '/assets/profile/3d-cartoon-portrait-person-practicing-law-related-profession_23-2151419551.png',
                          '/assets/profile/memoji-african-american-man-white-background-emoji_826801-6856.png',
                          '/assets/profile/memoji-african-american-man-white-background-emoji_826801-6857.png'
                        ];
                        
                        // Deterministically select a profile picture based on the patient email
                        const getProfilePicture = (email: string) => {
                          let charSum = 0;
                          for (let i = 0; i < email.length; i++) {
                            charSum += email.charCodeAt(i);
                          }
                          const pictureIndex = Math.abs(charSum) % PROFILE_PICTURES.length;
                          return PROFILE_PICTURES[pictureIndex];
                        };
                        
                        return (
                          <div 
                            key={consultation.id} 
                            className="p-4 border rounded-lg hover:border-blue-400 transition-colors bg-white"
                          >
                            <div className="flex items-center mb-3">
                              <div className="mr-3 h-12 w-12 rounded-full overflow-hidden border-2 flex-shrink-0" 
                                style={{ borderColor: getBorderColor(consultation.status) }}>
                                <img 
                                  src={getProfilePicture(consultation.email)}
                                  alt={consultation.full_name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    // Fallback to first letter of name if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-gray-100 text-gray-800 font-bold text-xl">${consultation.full_name.charAt(0)}</div>`;
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{consultation.full_name}</span>
                                    {getStatusBadge(consultation.status)}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {consultation.status === 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={() => updateConsultationStatus(consultation.id, 'confirmed')}
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Confirm
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 mt-1">
                                  {consultation.email}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              {/* Date and Time Column */}
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1">Appointment Time</div>
                                <div className="text-xs text-gray-700 flex items-center">
                                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                  {formatDate(consultation.preferred_date)}
                                  <span className="mx-1">•</span>
                                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                  {consultation.preferred_time}
                                </div>
                                <div className="mt-1.5 flex items-center">
                                  <Badge className="text-xs capitalize">{consultation.consultation_type.replace('_', ' ')}</Badge>
                                </div>
                              </div>
                              
                              {/* Symptoms Column */}
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1">Symptoms</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {consultation.symptoms.slice(0, 3).map((symptom, i) => (
                                    <span 
                                      key={i}
                                      className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-2.5 py-0.5 rounded-md font-medium"
                                    >
                                      {symptom}
                                    </span>
                                  ))}
                                  {consultation.symptoms.length > 3 && (
                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 border-opacity-30 text-xs px-2.5 py-0.5 rounded-md font-medium">
                                      +{consultation.symptoms.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {consultation.additional_notes && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs font-semibold text-gray-600 mb-1">Additional Notes</div>
                                <p className="text-xs text-gray-600 line-clamp-2">{consultation.additional_notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ConsultationsPage;
