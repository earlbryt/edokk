import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SymptomSelector from './SymptomSelector';
import { cn } from '@/lib/utils';
import { FormEvent } from 'react';

// Generate time slots from 8 AM to 8 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    const hourStr = hour > 12 ? (hour - 12).toString() : hour.toString();
    const amPm = hour >= 12 ? 'PM' : 'AM';
    slots.push(`${hourStr}:00 ${amPm}`);
    slots.push(`${hourStr}:30 ${amPm}`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface ConsultationFormProps {
  onSubmit?: (data: any) => void;
  isDialog?: boolean;
  initialData?: any;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ onSubmit, isDialog = false, initialData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [consultationType, setConsultationType] = useState<'virtual' | 'in_person'>('virtual');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Prefill user data if available
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Prefill form with initial data if provided (when editing)
  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setEmail(initialData.email || '');
      setConsultationType(initialData.consultationType || 'virtual');
      setDate(initialData.date || undefined);
      setTime(initialData.time || undefined);
      setSymptoms(initialData.symptoms || []);
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    if (!date || !time) {
      toast({
        title: "Missing information",
        description: "Please select both date and time for your consultation",
        variant: "destructive"
      });
      return;
    }
    
    if (symptoms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select at least one symptom",
        variant: "destructive"
      });
      return;
    }
    
    // Format date and time for the database
    const formattedDate = format(date, 'yyyy-MM-dd');
    console.log('Formatted date:', formattedDate);
    
    // Extract hour and minute from time string (e.g., "2:30 PM" -> "14:30")
    const timeParts = time.split(' ')[0].split(':');
    let hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);
    const period = time.split(' ')[1];
    
    // Convert to 24-hour format
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    console.log('Formatted time:', formattedTime);
    
    // If we're in dialog mode, pass the data to the parent
    if (isDialog && onSubmit) {
      console.log('Using dialog mode, passing data to parent');
      onSubmit({
        fullName,
        email,
        consultationType,
        date,
        time,
        formattedDate,
        formattedTime,
        symptoms,
        notes,
      });
      return;
    }
    
    // Otherwise handle as standalone form
    setIsSubmitting(true);
    console.log('Starting direct submission to database');
    
    try {
      // Prepare the consultation data
      const consultationData = {
        user_id: user?.id,
        full_name: fullName,
        email,
        consultation_type: consultationType,
        preferred_date: formattedDate,
        preferred_time: formattedTime,
        symptoms,
        additional_notes: notes,
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
      
      console.log('Consultation successfully saved:', data);
      
      toast({
        title: "Consultation Booked",
        description: "Your consultation has been scheduled. We'll notify you when a doctor confirms your appointment.",
      });
      
      // Reset form
      setConsultationType('virtual');
      setDate(undefined);
      setTime(undefined);
      setSymptoms([]);
      setNotes('');
      
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {/* Mobile: Portrait layout | Desktop: Landscape layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left column - personal info */}
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Consultation Type</Label>
            <RadioGroup
              value={consultationType}
              onValueChange={(value) => setConsultationType(value as 'virtual' | 'in_person')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virtual" id="virtual" />
                <Label htmlFor="virtual" className="cursor-pointer">Virtual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="in_person" />
                <Label htmlFor="in_person" className="cursor-pointer">In-Person</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        {/* Middle column - date/time */}
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-2">
            <Label>Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Preferred Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !time && "text-muted-foreground"
                  )}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {time || "Select time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="max-h-60 overflow-y-auto p-2">
                  {TIME_SLOTS.map((timeSlot) => (
                    <Button
                      key={timeSlot}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        timeSlot === time && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => {
                        setTime(timeSlot);
                        document.body.click(); // Close the popover
                      }}
                    >
                      {timeSlot}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Submit button moved here on mobile, visible on mobile only */}
          <div className="lg:hidden pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Booking..." : "Book Consultation"}
            </Button>
          </div>
        </div>
        
        {/* Right column - symptoms and notes */}
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-2">
            <Label>Symptoms</Label>
            <SymptomSelector value={symptoms} onChange={setSymptoms} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Describe your symptoms or concerns in more detail..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Submit button at the bottom, only visible on desktop */}
      <div className="hidden lg:block pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Consultation"}
        </Button>
      </div>
    </form>
  );
};

export default ConsultationForm;
