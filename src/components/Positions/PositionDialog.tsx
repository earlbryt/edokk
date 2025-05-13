import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, LinkIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Position {
  id?: string;
  title: string;
  description: string;
  key_skills: string[];
  qualifications: string[];
  project_id: string;
}

interface RequirementGroup {
  id: string;
  name: string;
  enabled: boolean;
}

interface PositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position;
  projectId: string;
  onSave?: () => void;
}

const PositionDialog: React.FC<PositionDialogProps> = ({
  open,
  onOpenChange,
  position,
  projectId,
  onSave
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skill, setSkill] = useState('');
  const [keySkills, setKeySkills] = useState<string[]>([]);
  const [qualification, setQualification] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing position data if editing
  useEffect(() => {
    if (position) {
      setTitle(position.title || '');
      setDescription(position.description || '');
      setKeySkills(position.key_skills || []);
      setQualifications(position.qualifications || []);
    } else {
      resetForm();
    }
  }, [position, open]);

  // Load requirement groups for this position when dialog opens
  useEffect(() => {
    if (open && projectId && position?.id) {
      loadRequirementGroups();
    }
  }, [open, projectId, position?.id]);

  const loadRequirementGroups = async () => {
    if (!position?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('filter_groups')
        .select('id, name, enabled')
        .eq('project_id', projectId)
        .eq('position_id', position.id);

      if (error) throw error;
      setRequirementGroups(data || []);
    } catch (error) {
      console.error('Error loading requirement groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requirement groups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSkill('');
    setKeySkills([]);
    setQualification('');
    setQualifications([]);
  };

  const handleAddSkill = () => {
    if (!skill.trim()) return;
    if (!keySkills.includes(skill.trim())) {
      setKeySkills([...keySkills, skill.trim()]);
    }
    setSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setKeySkills(keySkills.filter(s => s !== skillToRemove));
  };

  const handleAddQualification = () => {
    if (!qualification.trim()) return;
    if (!qualifications.includes(qualification.trim())) {
      setQualifications([...qualifications, qualification.trim()]);
    }
    setQualification('');
  };

  const handleRemoveQualification = (qualificationToRemove: string) => {
    setQualifications(qualifications.filter(q => q !== qualificationToRemove));
  };

  const handleCreateRequirements = () => {
    if (!position?.id) {
      toast({
        title: 'Save position first',
        description: 'You need to save the position before creating requirements',
        variant: 'default'
      });
      return;
    }
    
    navigate(`/dashboard/filters?project=${projectId}&position=${position.id}`);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a position title',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const positionData: Position = {
        title: title.trim(),
        description: description.trim(),
        key_skills: keySkills,
        qualifications: qualifications,
        project_id: projectId
      };

      if (position?.id) {
        // Update existing position
        const { error } = await supabase
          .from('positions')
          .update(positionData)
          .eq('id', position.id);

        if (error) throw error;

        toast({
          title: 'Position updated',
          description: 'The position has been successfully updated'
        });
      } else {
        // Create new position
        const { data, error } = await supabase
          .from('positions')
          .insert(positionData)
          .select();

        if (error) throw error;

        toast({
          title: 'Position created',
          description: 'The position has been successfully created'
        });
      }

      resetForm();
      onOpenChange(false);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: 'Error',
        description: 'Failed to save position',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{position ? 'Edit Position' : 'Create Position'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter position description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skills">Key Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g., JavaScript"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <Button type="button" onClick={handleAddSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {keySkills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications</Label>
            <div className="flex gap-2">
              <Input
                id="qualifications"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g., Bachelor's degree in Computer Science"
                onKeyDown={(e) => e.key === 'Enter' && handleAddQualification()}
              />
              <Button type="button" onClick={handleAddQualification} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {qualifications.map((qual, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {qual}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveQualification(qual)}
                  />
                </Badge>
              ))}
            </div>
          </div>
          
          {position?.id && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label>Position Requirements</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateRequirements}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  {requirementGroups.length > 0 ? 'Manage Requirements' : 'Create Requirements'}
                </Button>
              </div>
              
              {requirementGroups.length > 0 ? (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500 mb-2">
                    This position has {requirementGroups.length} requirement group(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requirementGroups.map(group => (
                      <Badge key={group.id} variant={group.enabled ? "default" : "outline"}>
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No requirements defined yet. Create requirements to help match candidates to this position.
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Position'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PositionDialog;
