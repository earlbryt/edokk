
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

// Simple placeholder component to be replaced with consultation management functionality
interface PositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PositionDialog: React.FC<PositionDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Consultation Details</DialogTitle>
          <Button
            className="absolute right-4 top-4"
            variant="outline"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-muted-foreground">
            Consultation management functionality will be available soon.
          </p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PositionDialog;
