
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
import { Check, Calendar, Users, Clock, User, Mail, FileText, Sparkles, ExternalLink } from 'lucide-react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

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
  const { user, isAuthenticated } = useAuth();
  const checkmarkControls = useAnimationControls();
  const textControls = useAnimationControls();

  // Reset step when dialog closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0);
        setFormData(null);
      }, 300); // Wait for dialog close animation
    }
  }, [open]);

  // Initialize animations when success step opens
  React.useEffect(() => {
    if (step === 2) {
      const animateSequence = async () => {
        await checkmarkControls.start({
          scale: [0, 1.05, 1],
          opacity: 1,
          transition: { duration: 0.6, ease: "easeOut" }
        });
        
        await textControls.start({
          opacity: 1,
          y: 0,
          transition: { staggerChildren: 0.08, ease: "easeOut" }
        });
      };
      
      animateSequence();
    }
  }, [step, checkmarkControls, textControls]);

  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setStep(1);
  };

  const handleConfirm = async () => {
    if (!formData || !user || !isAuthenticated) {
      console.error('Missing form data or user information, or not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a consultation.",
        variant: "destructive"
      });
      onOpenChange(false);
      return;
    }
    
    console.log('Starting consultation booking process in dialog');
    console.log('User ID:', user.id);
    console.log('Form data:', formData);
    
    setIsSubmitting(true);
    try {
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
      <DialogContent className={`${step === 1 ? 'sm:max-w-[500px]' : step === 2 ? 'sm:max-w-[450px]' : 'sm:max-w-[600px] md:max-w-[850px] lg:max-w-[1000px]'}`}>
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
              initialData={formData}
            />
          )}
          
          {step === 1 && formData && (
            <div className="space-y-4">
              {/* Compact Header */}
              <div className="text-center pb-3 border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-lens-purple/10 rounded-full mb-2">
                  <FileText className="h-5 w-5 text-lens-purple" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Review Your Consultation</h3>
                <p className="text-gray-600 text-sm">Please verify your information before confirming</p>
              </div>

              {/* Compact Card Layout */}
              <div className="space-y-3">
                {/* Personal Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">Personal Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Name</p>
                      <p className="text-gray-900">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Email</p>
                      <p className="text-gray-900">{formData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">Appointment</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Date & Time</p>
                      <p className="text-gray-900">{formData.formattedDate} at {formData.formattedTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Type</p>
                      <p className="text-gray-900 capitalize">{formData.consultationType.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">Symptoms & Notes</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 font-medium text-xs mb-1">Symptoms</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.symptoms.map((symptom: string, index: number) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-purple-700 border border-purple-200"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {formData.notes && (
                      <div>
                        <p className="text-gray-500 font-medium text-xs mb-1">Additional Notes</p>
                        <div className="bg-white rounded-md p-2 border border-purple-200">
                          <p className="text-gray-700 text-xs leading-relaxed">{formData.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex gap-2 pt-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 bg-lens-purple hover:bg-lens-purple/90 text-sm">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {step === 2 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative overflow-hidden"
              >
                <div className="relative text-center space-y-4 py-6">
                  {/* Success icon with subtle pulsation */}
                  <div className="relative mb-6 flex justify-center">
                    <div className="relative h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={checkmarkControls}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Check className="h-8 w-8 text-white" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Success text */}
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={textControls}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                    >
                      <h2 className="text-xl font-bold text-gray-900">Consultation Booked!</h2>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Sparkles className="h-4 w-4 text-lens-purple" />
                        <p className="text-sm text-lens-purple font-medium">Thank you for choosing our service</p>
                        <Sparkles className="h-4 w-4 text-lens-purple" />
                      </div>
                    </motion.div>
                    
                    {/* Instructions */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-lens-purple/5 p-3 rounded-lg border border-lens-purple/20 mx-auto max-w-sm"
                    >
                      <div className="flex items-center gap-2 text-lens-purple font-medium text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Your consultation has been scheduled!</span>
                      </div>
                      <p className="text-center text-gray-700 text-xs mt-1">
                        View all consultations in your{" "}
                        <Link 
                          to="/profile?tab=consultations" 
                          className="font-semibold text-lens-purple hover:underline"
                        >
                          Consultations
                        </Link>{" "}
                        page
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      className="flex flex-col gap-2 my-4"
                    >
                      <div className="flex items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="mr-2 h-8 w-8 flex items-center justify-center bg-lens-purple/10 rounded-full">
                          <Users className="h-3 w-3 text-lens-purple" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Type</p>
                          <p className="text-sm font-semibold capitalize">{formData?.consultationType?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="mr-2 h-8 w-8 flex items-center justify-center bg-lens-purple/10 rounded-full">
                          <Clock className="h-3 w-3 text-lens-purple" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Scheduled For</p>
                          <p className="text-sm font-semibold">{formData?.formattedDate} at {formData?.formattedTime}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      className="flex flex-col gap-2 w-full max-w-xs mx-auto"
                    >
                      <Link 
                        to="/profile?tab=consultations" 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-lens-purple text-white font-medium rounded-lg hover:bg-lens-purple-light transition-all duration-200 w-full text-sm"
                      >
                        <Calendar className="h-4 w-4" />
                        View My Consultations
                      </Link>
                      
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 w-full text-sm"
                      >
                        Continue Browsing
                      </button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultationDialog;
