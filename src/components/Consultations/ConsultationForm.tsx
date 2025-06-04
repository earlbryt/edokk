
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import SymptomSelector from './SymptomSelector';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Form validation schema
const consultationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  consultationType: z.enum(['virtual', 'in_person']),
  preferredDate: z.date({
    required_error: 'Please select a date',
  }),
  preferredTime: z.string().min(1, 'Please select a time'),
  symptoms: z.array(z.string()).min(1, 'Please select at least one symptom'),
  notes: z.string().optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface ConsultationFormProps {
  onSubmit?: (data: any) => void;
  isDialog?: boolean;
  initialData?: any; // Add initialData prop
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ 
  onSubmit, 
  isDialog = false,
  initialData // Accept initialData
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    initialData?.symptoms || [] // Use initial symptoms if available
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: initialData?.fullName || user?.user_metadata?.name || '',
      email: initialData?.email || user?.email || '',
      consultationType: initialData?.consultationType || 'virtual',
      preferredDate: initialData?.preferredDate || undefined,
      preferredTime: initialData?.preferredTime || '',
      symptoms: initialData?.symptoms || [],
      notes: initialData?.notes || '',
    }
  });

  // Watch form values
  const watchedDate = watch('preferredDate');

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setValue('fullName', initialData.fullName || user?.user_metadata?.name || '');
      setValue('email', initialData.email || user?.email || '');
      setValue('consultationType', initialData.consultationType || 'virtual');
      setValue('preferredDate', initialData.preferredDate || undefined);
      setValue('preferredTime', initialData.preferredTime || '');
      setValue('notes', initialData.notes || '');
      setSelectedSymptoms(initialData.symptoms || []);
    }
  }, [initialData, setValue, user]);

  // Time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const handleFormSubmit = async (data: ConsultationFormData) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a consultation.",
        variant: "destructive"
      });
      return;
    }

    if (selectedSymptoms.length === 0) {
      toast({
        title: "Symptoms Required",
        description: "Please select at least one symptom.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the data for submission
      const formattedData = {
        ...data,
        symptoms: selectedSymptoms,
        formattedDate: format(data.preferredDate, 'yyyy-MM-dd'),
        formattedTime: data.preferredTime,
      };

      if (isDialog && onSubmit) {
        // If in dialog mode, pass data to parent for confirmation step
        onSubmit(formattedData);
      } else {
        // Direct submission (non-dialog mode)
        const consultationData = {
          user_id: user.id,
          full_name: data.fullName,
          email: data.email,
          consultation_type: data.consultationType,
          preferred_date: formattedData.formattedDate,
          preferred_time: data.preferredTime,
          symptoms: selectedSymptoms,
          additional_notes: data.notes,
          status: 'pending' as const
        };

        const { error } = await supabase
          .from('consultations')
          .insert(consultationData);

        if (error) throw error;

        toast({
          title: "Consultation Booked",
          description: "Your consultation has been scheduled. We'll notify you when a doctor confirms your appointment.",
        });

        // Reset form
        reset();
        setSelectedSymptoms([]);
      }
    } catch (error: any) {
      console.error('Error booking consultation:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking your consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Consultation Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Consultation Type</h3>
        <RadioGroup
          defaultValue={initialData?.consultationType || "virtual"}
          onValueChange={(value) => setValue('consultationType', value as 'virtual' | 'in_person')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="virtual" id="virtual" />
            <Label htmlFor="virtual">Virtual Consultation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="in_person" id="in_person" />
            <Label htmlFor="in_person">In-Person Consultation</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Date and Time Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Preferred Date & Time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preferred Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDate ? format(watchedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedDate}
                  onSelect={(date) => setValue('preferredDate', date as Date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.preferredDate && (
              <p className="text-sm text-red-600">{errors.preferredDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Preferred Time *</Label>
            <select
              {...register('preferredTime')}
              className="w-full p-2 border border-gray-300 rounded-md"
              defaultValue={initialData?.preferredTime || ''}
            >
              <option value="">Select a time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.preferredTime && (
              <p className="text-sm text-red-600">{errors.preferredTime.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Symptoms */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Symptoms</h3>
        <SymptomSelector
          selectedSymptoms={selectedSymptoms}
          onSymptomsChange={setSelectedSymptoms}
        />
        {selectedSymptoms.length === 0 && (
          <p className="text-sm text-red-600">Please select at least one symptom</p>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Notes</h3>
        <Textarea
          {...register('notes')}
          placeholder="Any additional information you'd like to share..."
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Booking..." : isDialog ? "Continue" : "Book Consultation"}
      </Button>
    </form>
  );
};

export default ConsultationForm;
