import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, FileText, Mail, MapPin, Phone, ShoppingBag, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import ConsultationDialog from '@/components/Consultations/ConsultationDialog';
import OrderHistory, { Order } from '@/components/Orders/OrderHistory';

// Define the user assessment type
interface UserAssessment {
  id: string;
  created_at: string;
  user_id: string;
  assessment_id: string;
  responses: any; // jsonb in database
  score: number;
  result_category: string;
  llm_feedback: string; // Column is named llm_feedback, not feedback
  mental_health_assessment: {
    title: string;
  } | null; // Joined data for assessment title
}

// Define the consultation type
interface Consultation {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  consultation_type: 'virtual' | 'in_person';
  preferred_date: string; // Will be formatted from DB date type
  preferred_time: string; // Will be formatted from DB time type
  symptoms: string[];
  additional_notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

const Profile = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [profileData, setProfileData] = useState<any>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const { toast } = useToast();

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date nicely for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchUserConsultations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setConsultations(data || []);
      } catch (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your consultations. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingConsultations(false);
      }
    };

    const fetchUserOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('orders' as any)
          .select(`
            *,
            order_items(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your order history. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingOrders(false);
      }
    };

    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setProfileData(data || {});
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile information. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchUserAssessments = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_assessments')
          .select(`
            id,
            created_at,
            score,
            result_category,
            llm_feedback,
            mental_health_assessment:mental_health_assessments(title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setAssessments(data || []);
      } catch (error) {
        console.error('Error fetching user assessments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your assessments. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingAssessments(false);
      }
    };

    fetchUserConsultations();
    fetchUserOrders();
    fetchProfileData();
    fetchUserAssessments();
  }, [user, toast]);

  // Get status badge color based on consultation status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - User profile info */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="flex flex-col items-center">
                {isLoadingProfile ? (
                  <Skeleton className="h-24 w-24 rounded-full" />
                ) : (
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md mb-4">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="bg-lens-purple-light/10 text-lens-purple text-xl">
                      {getInitials(user?.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                )}
                {isLoadingProfile ? (
                  <>
                    <Skeleton className="h-8 w-48 mt-4" />
                    <Skeleton className="h-5 w-40 mt-2" />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold">{user?.name}</CardTitle>
                    <CardDescription className="text-lg mt-1">{user?.email}</CardDescription>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-lens-purple opacity-70" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patient ID</p>
                      <p className="font-medium">{user?.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  
                  {/* Show email from user object directly */}
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-lens-purple opacity-70" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Show name from profile data if available */}
                  {profileData.name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-lens-purple opacity-70" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{profileData.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Add role information if available */}
                  {profileData.role && (
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-lens-purple opacity-70" />
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{profileData.role}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/settings">Edit Profile</a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-lens-purple/5 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-lens-purple">
                    {isLoadingConsultations ? 
                      <Skeleton className="h-8 w-8 mx-auto" /> : 
                      consultations.length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Consultations</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {isLoadingConsultations ? 
                      <Skeleton className="h-8 w-8 mx-auto" /> : 
                      consultations.filter(c => c.status === 'completed').length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {isLoadingConsultations ? 
                      <Skeleton className="h-8 w-8 mx-auto" /> : 
                      consultations.filter(c => c.status === 'pending').length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Pending</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {isLoadingConsultations ? 
                      <Skeleton className="h-8 w-8 mx-auto" /> : 
                      consultations.filter(c => c.status === 'confirmed').length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Consultations and other tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="consultations" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultations">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your Consultations</h2>
                  <Button className="bg-lens-purple hover:bg-lens-purple-light" onClick={() => setShowConsultationDialog(true)}>
                    Book New Consultation
                  </Button>
                </div>

                {isLoadingConsultations ? (
                  // Loading state
                  <div className="space-y-4">
                    <Skeleton className="h-[120px] w-full rounded-xl" />
                    <Skeleton className="h-[120px] w-full rounded-xl" />
                    <Skeleton className="h-[120px] w-full rounded-xl" />
                  </div>
                ) : consultations.length === 0 ? (
                  // Empty state
                  <Card className="border-dashed">
                    <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="rounded-full bg-lens-purple/10 p-3">
                        <Calendar className="h-8 w-8 text-lens-purple" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No consultations yet</h3>
                        <p className="text-muted-foreground mt-1">
                          Book your first consultation with our healthcare professionals.
                        </p>
                      </div>
                      <Button 
                        className="bg-lens-purple hover:bg-lens-purple-light" 
                        onClick={() => setShowConsultationDialog(true)}
                      >
                        Book Consultation
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Consultations list
                  <div className="space-y-4">
                    {consultations.map((consultation) => (
                      <Card key={consultation.id} className="overflow-hidden">
                        <div className={`h-1.5 w-full ${
                          consultation.status === 'confirmed' ? 'bg-green-500' :
                          consultation.status === 'completed' ? 'bg-blue-500' :
                          consultation.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(consultation.status)}
                                <Badge variant="outline" className="bg-gray-50 capitalize">
                                  {consultation.consultation_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-semibold">
                                  Consultation on {formatDate(consultation.preferred_date)}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{consultation.preferred_time}</span>
                                  </div>
                                  {consultation.symptoms.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span>{consultation.symptoms.length} Symptoms</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {consultation.symptoms.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {consultation.symptoms.slice(0, 3).map((symptom, i) => (
                                    <Badge key={i} variant="secondary" className="bg-gray-100">
                                      {symptom}
                                    </Badge>
                                  ))}
                                  {consultation.symptoms.length > 3 && (
                                    <Badge variant="secondary" className="bg-gray-100">
                                      +{consultation.symptoms.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 md:flex-col md:items-end self-end md:self-center">
                              {consultation.status === 'pending' && (
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                                  Cancel
                                </Button>
                              )}
                              {consultation.status === 'confirmed' && (
                                <Button size="sm" className="bg-lens-purple hover:bg-lens-purple-light">
                                  Join Call
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="orders">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Your Orders</h2>
                  <Button asChild className="bg-lens-purple hover:bg-lens-purple-light">
                    <a href="/pharmacy">Visit Pharmacy</a>
                  </Button>
                </div>
                
                <OrderHistory orders={orders} isLoading={isLoadingOrders} />
              </div>
            </TabsContent>
            
            <TabsContent value="assessments">
              <Card>
                <CardHeader>
                  <CardTitle>Mental Health Assessments</CardTitle>
                  <CardDescription>Review your completed mental health assessments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingAssessments ? (
                    Array.from({ length: 2 }).map((_, index) => (
                      <Card key={index} className="p-4 border shadow-sm">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-1" />
                        <Skeleton className="h-4 w-1/4 mb-3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full mt-1" />
                      </Card>
                    ))
                  ) : assessments.length > 0 ? (
                    assessments.map((assessment) => (
                      <Card key={assessment.id} className="p-4 hover:shadow-lg transition-shadow duration-200 ease-in-out border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg text-lens-purple">
                            {assessment.mental_health_assessment?.title || 'Assessment'}
                          </h4>
                          <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-600 border-gray-200">{formatDate(assessment.created_at)}</Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-800">Score:</span> {assessment.score}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-800">Category:</span> <span className="font-semibold">{assessment.result_category}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-1">Feedback:</p>
                          <p className="text-sm text-gray-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                            {assessment.llm_feedback}
                          </p>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-lg font-medium">No assessments found.</p>
                      <p className="text-sm text-gray-500 mt-1">You haven't completed any mental health assessments yet.</p>
                      {/* Consider adding a link/button to the mental health page if desired */}
                      {/* <Button variant="outline" className="mt-4" onClick={() => navigate('/mental-health?open_assessments=true')}>Take an Assessment</Button> */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
      {/* End of main content grid */}
      </div> {/* This closes the container div started after Navbar */}
      <Footer />
      
      {/* Consultation Dialog */}
      <ConsultationDialog 
        open={showConsultationDialog} 
        onOpenChange={setShowConsultationDialog} 
      />
    </div> /* This closes the outermost div started after <Navbar /> */
  );
};

export default Profile;
