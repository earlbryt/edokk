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
import { Link, useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);
  const [profileData, setProfileData] = useState<any>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('consultations');
  const { toast } = useToast();
  
  // Check URL parameters for tab selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    // Set active tab if specified in URL
    if (tabParam && ['consultations', 'orders', 'assessments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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
        // First fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          throw ordersError;
        }
        
        // Then fetch order items for each order
        const ordersWithItems = await Promise.all(
          (ordersData || []).map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id);
              
            if (itemsError) {
              console.error('Error fetching order items:', itemsError);
              return { ...order, order_items: [] };
            }
            
            return { ...order, order_items: itemsData || [] };
          })
        );
        
        setOrders(ordersWithItems);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your order history. Please try again later.',
          variant: 'destructive',
        });
        setOrders([]);
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
        // First fetch user assessments
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('user_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (assessmentsError) {
          console.error('Error fetching user assessments:', assessmentsError);
          throw assessmentsError;
        }
        
        // Then fetch assessment titles for each assessment
        const assessmentsWithTitles = await Promise.all(
          (assessmentsData || []).map(async (assessment) => {
            const { data: titleData, error: titleError } = await supabase
              .from('mental_health_assessments')
              .select('title')
              .eq('id', assessment.assessment_id)
              .single();
              
            if (titleError) {
              console.error('Error fetching assessment title:', titleError);
              return { ...assessment, mental_health_assessment: null };
            }
            
            return { ...assessment, mental_health_assessment: titleData };
          })
        );
        
        setAssessments(assessmentsWithTitles);
      } catch (error) {
        console.error('Error fetching user assessments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your assessments. Please try again later.',
          variant: 'destructive',
        });
        setAssessments([]);
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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navbar />
      <div className="container max-w-7xl mx-auto px-4 py-16 md:py-32 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - User profile info */}
        <div className="md:col-span-1">
          <Card className="border-none shadow-lg overflow-hidden bg-white backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-r from-lens-purple/5 to-lens-purple/10 opacity-50 z-0"></div>
            <CardHeader className="text-center pb-2 relative z-10">
              <div className="flex flex-col items-center">
                {isLoadingProfile ? (
                  <Skeleton className="h-28 w-28 rounded-full" />
                ) : (
                  <div className="rounded-full p-1 bg-gradient-to-r from-lens-purple to-indigo-500 shadow-lg mb-4">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                      <AvatarImage src={profileData.avatar_url} />
                      <AvatarFallback className="bg-white text-lens-purple text-2xl font-bold">
                        {getInitials(user?.name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                {isLoadingProfile ? (
                  <>
                    <Skeleton className="h-8 w-48 mt-4" />
                    <Skeleton className="h-5 w-40 mt-2" />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-lens-purple to-indigo-600 bg-clip-text text-transparent">{user?.name}</CardTitle>
                    <CardDescription className="text-lg mt-1">{user?.email}</CardDescription>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
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
            <CardFooter className="relative z-10">
              <Button 
                variant="outline" 
                className="w-full border-lens-purple text-lens-purple transition-all duration-300 opacity-50 cursor-not-allowed" 
                disabled
              >
                Edit Profile (Coming Soon)
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column - Consultations and other tabs */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="consultations" className="w-full">
            <TabsList className="mb-8 w-full max-w-full overflow-x-auto flex">
              <TabsTrigger value="consultations">
                Consultations {!isLoadingConsultations && (
                  <span className="ml-1.5 rounded-full bg-lens-purple/20 text-lens-purple px-2 py-0.5 text-xs font-medium">
                    {consultations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders">
                Order History {!isLoadingOrders && (
                  <span className="ml-1.5 rounded-full bg-lens-purple/20 text-lens-purple px-2 py-0.5 text-xs font-medium">
                    {orders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="assessments">
                Assessments {!isLoadingAssessments && (
                  <span className="ml-1.5 rounded-full bg-lens-purple/20 text-lens-purple px-2 py-0.5 text-xs font-medium">
                    {assessments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultations">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lens-purple to-indigo-600 bg-clip-text text-transparent flex flex-wrap items-center gap-2">
                    <span>Your Consultations</span>
                    <span className="text-sm sm:text-base bg-lens-purple/10 text-lens-purple px-2 py-0.5 rounded-full">
                      {consultations.length}
                    </span>
                  </h2>
                  <Button className="bg-lens-purple hover:bg-lens-purple-light text-white" onClick={() => setShowConsultationDialog(true)}>
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
                  <Card className="border-dashed bg-gradient-to-br from-white to-lens-purple/5">
                    <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="rounded-full bg-gradient-to-r from-lens-purple/20 to-indigo-200/50 p-5 shadow-inner">
                        <Calendar className="h-10 w-10 text-lens-purple" />
                      </div>
                      <div className="max-w-md">
                        <h3 className="text-xl font-medium text-gray-800">No consultations yet</h3>
                        <p className="text-muted-foreground mt-2">
                          Book your first consultation with our healthcare professionals and start your health journey today.
                        </p>
                      </div>
                      <Button 
                        className="bg-lens-purple hover:bg-lens-purple-light text-white" 
                        onClick={() => setShowConsultationDialog(true)}
                      >
                        Book Your First Consultation
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  // Consultations list
                  <div className="space-y-4">
                    {consultations.map((consultation) => (
                      <Card key={consultation.id} className="overflow-hidden border hover:shadow-md transition-all duration-200">
                        <div className={`h-1.5 w-full ${
                          consultation.status === 'confirmed' ? 'bg-green-500' :
                          consultation.status === 'completed' ? 'bg-blue-500' :
                          consultation.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4 overflow-hidden">
                            {/* Left section - Consultation details */}
                            <div className="space-y-3.5">
                              {/* Status badges */}
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {getStatusBadge(consultation.status)}
                                <Badge variant="outline" className="bg-gray-50 capitalize font-medium">
                                  {consultation.consultation_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              {/* Title and date/time */}
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5 break-words">
                                  Consultation on {formatDate(consultation.preferred_date)}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">{consultation.preferred_time}</span>
                                  </div>
                                  {consultation.symptoms.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">{consultation.symptoms.length} Symptoms</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Symptoms tags */}
                              {consultation.symptoms.length > 0 && (
                                <div className="pt-1">
                                  <p className="text-xs text-gray-500 mb-1.5">Reported symptoms:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {consultation.symptoms.slice(0, 3).map((symptom, i) => (
                                      <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700 font-normal">
                                        {symptom}
                                      </Badge>
                                    ))}
                                    {consultation.symptoms.length > 3 && (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-normal">
                                        +{consultation.symptoms.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Status indicator */}
                            <div className="self-end md:self-center mt-2 md:mt-0">
                              <Badge variant="secondary" className="text-xs px-2 py-1 capitalize">
                                {consultation.status}
                              </Badge>
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lens-purple to-indigo-600 bg-clip-text text-transparent flex flex-wrap items-center gap-2">
                    <span>Your Orders</span>
                    <span className="text-sm sm:text-base bg-lens-purple/10 text-lens-purple px-2 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  </h2>
                  <Button asChild className="bg-lens-purple hover:bg-lens-purple-light text-white">
                    <Link to="/pharmacy">Visit Pharmacy</Link>
                  </Button>
                </div>
                
                <OrderHistory orders={orders} isLoading={isLoadingOrders} />
              </div>
            </TabsContent>
            
            <TabsContent value="assessments">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-lens-purple to-indigo-600 bg-clip-text text-transparent flex flex-wrap items-center gap-2">
                    <span>Mental Health Assessments</span>
                    <span className="text-sm sm:text-base bg-lens-purple/10 text-lens-purple px-2 py-0.5 rounded-full">
                      {assessments.length}
                    </span>
                  </h2>
                  <Button asChild className="bg-lens-purple hover:bg-lens-purple-light text-white">
                    <Link to="/mental-health">Take New Assessment</Link>
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment History</CardTitle>
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
                        <Card key={assessment.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border">
                          {/* Top colored bar */}
                          <div className="h-1 w-full bg-indigo-400"></div>
                          
                          <div className="p-5">
                              {/* Header with title and date */}
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2 sm:gap-0">
                              <h4 className="font-semibold text-lg text-lens-purple">
                                {assessment.mental_health_assessment?.title || 'Assessment'}
                              </h4>
                              <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-600 border-gray-200 whitespace-nowrap ml-2">
                                {formatDate(assessment.created_at)}
                              </Badge>
                            </div>
                            
                            {/* Assessment results - boxed for visual separation */}
                            <div className="bg-slate-50 rounded-md p-3 mb-4 border border-slate-200">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">Score</p>
                                  <p className="text-sm font-semibold text-gray-900">{assessment.score}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-0.5">Category</p>
                                  <p className="text-sm font-semibold text-gray-900">{assessment.result_category}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Feedback section */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Professional Feedback:</p>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-slate-200 leading-relaxed">
                                {assessment.llm_feedback}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <div className="rounded-full bg-gray-100 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-500" />
                        </div>
                        <p className="text-gray-700 text-lg font-medium">No assessments found</p>
                        <p className="text-gray-500 mt-1 max-w-md mx-auto">You haven't completed any mental health assessments yet.</p>
                        <Button className="mt-4 bg-lens-purple hover:bg-lens-purple-light text-white" asChild>
                          <Link to="/mental-health">Take Your First Assessment</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
