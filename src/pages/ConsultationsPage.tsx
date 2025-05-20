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
      
      // Fetch all consultations
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
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

  // Update consultation status
  const updateConsultationStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed' | 'pending') => {
    try {
      setIsLoading(true);
      
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
      
      toast({
        title: `Consultation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `The consultation has been ${status} successfully.`,
      });
    } catch (error) {
      console.error(`Error updating consultation status:`, error);
      toast({
        title: 'Action Failed',
        description: `Failed to update the consultation. Please try again.`,
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
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Consultations Management</h1>
            <p className="text-gray-600">
              Manage all patient consultation requests
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-red-50 rounded-full">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cancelled</p>
                    <p className="text-2xl font-bold">{countByStatus('cancelled')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search in Top Right */}
          <div className="flex justify-end mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search consultations..." 
                className="pl-10 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Consultations Table */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>All Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="all">All ({countByStatus(null)})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({countByStatus('pending')})</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmed ({countByStatus('confirmed')})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({countByStatus('completed')})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({countByStatus('cancelled')})</TabsTrigger>
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
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Symptoms</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredConsultations.map((consultation) => (
                            <TableRow key={consultation.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{consultation.full_name}</p>
                                  <p className="text-sm text-gray-500">{consultation.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{formatDate(consultation.preferred_date)}</p>
                                  <p className="text-sm text-gray-500">{consultation.preferred_time}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className="capitalize">{consultation.consultation_type.replace('_', ' ')}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {consultation.symptoms.slice(0, 2).map((symptom, index) => (
                                    <Badge key={index} variant="outline">{symptom}</Badge>
                                  ))}
                                  {consultation.symptoms.length > 2 && (
                                    <Badge variant="outline">+{consultation.symptoms.length - 2} more</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(consultation.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {consultation.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                        onClick={() => updateConsultationStatus(consultation.id, 'confirmed')}
                                      >
                                        Confirm
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => updateConsultationStatus(consultation.id, 'cancelled')}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                  {consultation.status === 'confirmed' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                      onClick={() => updateConsultationStatus(consultation.id, 'completed')}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                  {consultation.status === 'cancelled' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => updateConsultationStatus(consultation.id, 'pending')}
                                    >
                                      Reactivate
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
