
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
            <div className="space-y-6">
              {/* Modern Header */}
              <div className="text-center pb-4 border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-lens-purple/10 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-lens-purple" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Review Your Consultation</h3>
                <p className="text-gray-600 mt-1">Please verify your information before confirming</p>
              </div>

              {/* Modern Card Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Information Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Personal Details</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                      <p className="text-gray-900 font-medium">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-gray-900 font-medium">{formData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Information Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Appointment</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</p>
                      <p className="text-gray-900 font-medium">{formData.formattedDate} at {formData.formattedTime}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</p>
                      <p className="text-gray-900 font-medium capitalize">{formData.consultationType.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Symptoms & Notes */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Medical Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.symptoms.map((symptom: string, index: number) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-purple-700 border border-purple-200 shadow-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {formData.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Additional Notes</p>
                      <div className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-gray-700 text-sm leading-relaxed">{formData.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 bg-lens-purple hover:bg-lens-purple/90">
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
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-lens-purple/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-lens-purple/10 rounded-full translate-x-1/3 translate-y-1/3" />
                
                <div className="relative text-center space-y-6 py-8">
                  {/* Circular success icon with ripple effect */}
                  <div className="relative mb-8 flex justify-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [1, 1.1, 1.2, 1.3],
                        opacity: [0.6, 0.4, 0.2, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="absolute inset-0 rounded-full bg-green-500"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [1, 1.2, 1.3, 1.4],
                        opacity: [0.5, 0.3, 0.2, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        delay: 0.5,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                      className="absolute inset-0 rounded-full bg-green-500"
                    />
                    <div className="relative h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={checkmarkControls}
                      >
                        <Check className="h-10 w-10 text-white" strokeWidth={3} />
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Success text */}
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={textControls}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                    >
                      <h2 className="text-2xl font-bold text-gray-900">Consultation Booked!</h2>
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
                      className="flex flex-col items-center justify-center gap-2 mt-4 mb-4 w-full max-w-sm mx-auto bg-lens-purple/5 p-4 rounded-lg border border-lens-purple/20"
                    >
                      <div className="flex items-center gap-2 text-lens-purple font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>Your consultation has been scheduled!</span>
                      </div>
                      <p className="text-center text-gray-700 text-sm">
                        You can view all your consultations and track their status in your{" "}
                        <Link 
                          to="/consultations" 
                          className="font-semibold text-lens-purple hover:underline cursor-pointer transition-colors"
                        >
                          Consultations
                        </Link>{" "}
                        page
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      className="flex flex-col gap-3 my-6"
                    >
                      <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="mr-3 h-9 w-9 flex items-center justify-center bg-lens-purple/10 rounded-full">
                          <Users className="h-4 w-4 text-lens-purple" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Consultation Type</p>
                          <p className="text-sm font-semibold capitalize">{formData?.consultationType?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="mr-3 h-9 w-9 flex items-center justify-center bg-lens-purple/10 rounded-full">
                          <Clock className="h-4 w-4 text-lens-purple" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Scheduled For</p>
                          <p className="text-sm font-semibold">{formData?.formattedDate} at {formData?.formattedTime}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      className="flex flex-col gap-3 w-full max-w-xs mx-auto"
                    >
                      <Link 
                        to="/consultations" 
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-lens-purple text-white font-medium rounded-lg hover:bg-lens-purple-light focus:outline-none focus:ring-2 focus:ring-lens-purple focus:ring-offset-2 transition-all duration-200 w-full"
                      >
                        <Calendar className="h-4 w-4" />
                        View My Consultations
                      </Link>
                      
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 w-full relative overflow-hidden group"
                      >
                        <span className="relative z-10">Continue Browsing</span>
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
