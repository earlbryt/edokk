import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Check, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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

const ConsultationsList: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the most recent pending consultations
        const { data, error } = await supabase
          .from('consultations')
          .select('*')
          .eq('status', 'pending') // Only get pending consultations
          .order('preferred_date', { ascending: true }) // Order by date ascending (earliest first)
          .limit(5);
        
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

    fetchConsultations();
  }, [toast]);

  // Update consultation status
  const updateConsultationStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setConsultations(prevConsultations => 
        prevConsultations.filter(consultation => consultation.id !== id)
      );
      
      toast({
        title: status === 'confirmed' ? 'Consultation Confirmed' : 'Consultation Cancelled',
        description: status === 'confirmed' 
          ? 'The consultation has been confirmed successfully.' 
          : 'The consultation has been cancelled.',
      });
    } catch (error) {
      console.error(`Error ${status === 'confirmed' ? 'confirming' : 'cancelling'} consultation:`, error);
      toast({
        title: 'Action Failed',
        description: `Failed to ${status === 'confirmed' ? 'confirm' : 'cancel'} the consultation. Please try again.`,
        variant: 'destructive',
      });
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-semibold">Pending Consultations</h3>
        </div>
        {[1, 2,, 3].map((_, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Pending Consultations</h3>
        <Button variant="link" size="sm" asChild>
          <Link to="/admin/consultations" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {consultations.length === 0 ? (
        <div className="text-center py-6 border rounded-lg bg-gray-50">
          <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No pending consultations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((consultation) => (
            <div 
              key={consultation.id} 
              className="border rounded-lg p-3 hover:shadow-sm transition-shadow bg-white"
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium">{consultation.full_name}</span>
                {getStatusBadge(consultation.status)}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                <div className="flex items-center mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <span>{formatDate(consultation.preferred_date)}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>{consultation.preferred_time}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => updateConsultationStatus(consultation.id, 'confirmed')}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Confirm
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => updateConsultationStatus(consultation.id, 'cancelled')}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsultationsList;
