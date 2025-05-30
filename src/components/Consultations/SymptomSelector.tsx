
import React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SymptomSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// Common symptoms list
const SYMPTOMS = [
  "Headache", "Fever", "Cough", "Sore Throat", "Fatigue",
  "Nausea", "Vomiting", "Diarrhea", "Shortness of Breath", "Chest Pain",
  "Back Pain", "Joint Pain", "Muscle Pain", "Rash", "Dizziness",
  "Anxiety", "Depression", "Insomnia", "Loss of Appetite", "Weight Loss",
  "Abdominal Pain", "Constipation", "Blood in Stool", "Blood in Urine", "Frequent Urination",
  "Painful Urination", "Swelling", "Numbness", "Tingling", "Vision Changes",
  "Hearing Problems", "Allergies", "Congestion", "Runny Nose", "Sinus Pressure"
];

const SymptomSelector: React.FC<SymptomSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  
  const handleSelect = (symptom: string) => {
    if (value.includes(symptom)) {
      onChange(value.filter(s => s !== symptom));
    } else {
      onChange([...value, symptom]);
    }
  };

  const handleRemove = (symptom: string) => {
    onChange(value.filter(s => s !== symptom));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full justify-start border-dashed text-muted-foreground"
          >
            {value.length > 0 ? `${value.length} symptom(s) selected` : "Select symptoms..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start"> {/* Adjusted width for better popover sizing */}
          <Command>
            <CommandInput placeholder="Search symptoms..." className="h-9" />
            <CommandList>
              <CommandEmpty>No symptoms found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto"> {/* Explicitly overflow-y-auto */}
                {SYMPTOMS.map((symptom) => (
                  <CommandItem
                    key={symptom}
                    onSelect={() => handleSelect(symptom)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        value.includes(symptom) ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}
                    >
                      {value.includes(symptom) && <Check className="h-3 w-3" />}
                    </div>
                    {symptom}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(symptom => (
            <Badge key={symptom} variant="secondary" className="flex items-center gap-1">
              {symptom}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemove(symptom)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default SymptomSelector;
