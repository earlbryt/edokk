import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ConsultationForm from './ConsultationForm';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Check, Calendar, Users } from 'lucide-react';

interface ConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConsultationDialog: React.FC<ConsultationDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [step, setStep] = React.useState(0);
  const [formData, setFormData] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset step when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0);
        setFormData(null);
      }, 300); // Wait for dialog close animation
    }
  }, [open]);

  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setStep(1);
  };

  const handleConfirm = async () => {
    if (!formData || !user) {
      console.error('Missing form data or user information');
      return;
    }
    
    console.log('Starting consultation booking process in dialog');
    console.log('User ID:', user.id);
    console.log('Form data:', formData);
    
    setIsSubmitting(true);
    try {
      // Prepare consultation data for insertion
      const consultationData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: formData.email,
        consultation_type: formData.consultationType,
        preferred_date: formData.formattedDate, 
        preferred_time: formData.formattedTime,
        symptoms: formData.symptoms,
        additional_notes: formData.notes,
        status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed'
      };
      
      console.log('Consultation data to submit:', consultationData);
      
      // Create consultation record
      const { data, error } = await supabase
        .from('consultations')
        .insert(consultationData)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Consultation successfully booked:', data);
      
      toast({
        title: "Consultation Booked",
        description: "Your consultation has been scheduled. We'll notify you when a doctor confirms your appointment.",
      });
      
      // Advance to success step
      setStep(2);
    } catch (error: any) {
      console.error('Error booking consultation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking your consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (step === 2) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[850px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Book a Consultation</DialogTitle>
          <DialogDescription>
            Schedule an appointment with one of our healthcare professionals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          
          {step === 0 && (
            <ConsultationForm 
              onSubmit={handleFormSubmit} 
              isDialog={true}
            />
          )}
          
          {step === 1 && formData && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p className="text-base">{formData.fullName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="text-base">{formData.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date</h4>
                    <p className="text-base">{formData.formattedDate}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Time</h4>
                    <p className="text-base">{formData.formattedTime}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Consultation Type</h4>
                  <p className="text-base capitalize">{formData.consultationType.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Symptoms</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.symptoms.map((symptom: string, index: number) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
                
                {formData.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                    <p className="text-sm text-gray-700">{formData.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={handleConfirm} disabled={isSubmitting}>
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {step === 2 && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Booking Confirmed</h3>
                <p className="mt-2 text-gray-600">
                  Your consultation has been scheduled successfully. You'll receive a confirmation email shortly.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className="w-full" onClick={handleClose}>Done</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog;
