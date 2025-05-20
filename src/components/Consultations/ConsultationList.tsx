
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Consultation {
  id: string;
  full_name: string;
  consultation_type: 'virtual' | 'in_person';
  preferred_date: string;
  preferred_time: string;
  symptoms: string[];
  additional_notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

const ConsultationList: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!user?.id) return;
      
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsultations();
  }, [user]);
  
  // Format date for display (e.g., "Monday, May 20, 2025")
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
  };
  
  // Format time for display (e.g., "2:30 PM")
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Get status color based on consultation status
  const getStatusColor = (status: Consultation['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading consultations...</div>;
  }

  if (consultations.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">You don't have any consultations scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {consultations.map((consultation) => (
        <Card key={consultation.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">{consultation.consultation_type === 'virtual' ? 'Virtual Consultation' : 'In-Person Consultation'}</h3>
              <Badge className={getStatusColor(consultation.status)}>
                {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(consultation.preferred_date)}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(consultation.preferred_time)}
            </div>
            
            <div className="mt-3">
              <p className="text-sm font-medium">Symptoms:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {consultation.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
            
            {consultation.additional_notes && (
              <div className="mt-3">
                <p className="text-sm font-medium">Additional Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{consultation.additional_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConsultationList;
