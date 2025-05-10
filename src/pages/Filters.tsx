import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Filter, Plus, X, Check, Save, FolderPlus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  documentsCount: number;
}

interface RequirementGroup {
  id: string;
  name: string;
  filters: Requirement[];
  enabled: boolean;
  projectId?: string;
}

interface Requirement {
  id: string;
  type: 'skill' | 'experience' | 'education' | 'keyword' | 'location';
  value: string;
  weight: number;
  required: boolean;
}

const Filters: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const [requirementGroups, setRequirementGroups] = useState<RequirementGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newRequirementType, setNewRequirementType] = useState<Requirement['type']>('skill');
  const [newRequirementValue, setNewRequirementValue] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [commonSkills, setCommonSkills] = useState<string[]>([
    'JavaScript', 'React', 'TypeScript', 'Python', 'Java', 'C#', 'Node.js', 
    'SQL', 'AWS', 'Docker', 'Kubernetes', 'HTML', 'CSS', 'Git', 'Agile',
    'Product Management', 'UI/UX', 'Data Analysis', 'Machine Learning'
  ]);
  
  const currentGroup = requirementGroups.find(group => group.id === selectedGroup);
  
  // Parse URL parameters for project selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    
    if (projectId) {
      setSelectedProject(projectId);
    }
  }, [location]);
  
  // Load user's projects and requirement groups
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Load user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        
        if (projectsData) {
          const formattedProjects = projectsData.map(project => ({
            id: project.id,
            name: project.name,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at),
            documentsCount: project.documents_count || 0
          }));
          
          setProjects(formattedProjects);
          
          // If URL has a project parameter and it exists in the projects list, use that
          const params = new URLSearchParams(location.search);
          const projectIdFromUrl = params.get('project');
          
          if (projectIdFromUrl && formattedProjects.some(p => p.id === projectIdFromUrl)) {
            setSelectedProject(projectIdFromUrl);
            await loadRequirementGroups(projectIdFromUrl);
          } 
          // Otherwise, if there are projects, select the first one by default
          else if (formattedProjects.length > 0 && !selectedProject) {
            setSelectedProject(formattedProjects[0].id);
            await loadRequirementGroups(formattedProjects[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          description: 'There was a problem loading your projects and requirements.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast, location.search]);
  
  // Load requirement groups for a specific project
  const loadRequirementGroups = async (projectId: string) => {
    if (!user) return;
    
    try {
      // Load requirement groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('filter_groups')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (groupsError) throw groupsError;
      
      if (groupsData) {
        const groups = [];
        
        for (const group of groupsData) {
          // Load requirements for each group
          const { data: requirementsData, error: requirementsError } = await supabase
            .from('filters')
            .select('*')
            .eq('filter_group_id', group.id)
            .order('created_at', { ascending: true });
          
          if (requirementsError) throw requirementsError;
          
          groups.push({
            id: group.id,
            name: group.name,
            enabled: group.enabled,
            projectId: group.project_id,
            filters: requirementsData ? requirementsData.map(requirement => ({
              id: requirement.id,
              type: requirement.type as Requirement['type'],
              value: requirement.value,
              weight: requirement.weight,
              required: requirement.required
            })) : []
          });
        }
        
        setRequirementGroups(groups);
        
        // Select the first group if available
        if (groups.length > 0) {
          setSelectedGroup(groups[0].id);
        } else {
          setSelectedGroup(null);
        }
      }
    } catch (error) {
      console.error('Error loading requirement groups:', error);
      toast({
        title: 'Error loading requirement groups',
        description: 'There was a problem loading your requirement groups.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle project selection change
  useEffect(() => {
    if (selectedProject) {
      loadRequirementGroups(selectedProject);
    }
  }, [selectedProject]);
  
  const handleToggleRequirementGroup = async (groupId: string) => {
    const group = requirementGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const newEnabled = !group.enabled;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('filter_groups')
        .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
        .eq('id', groupId);
      
      if (error) throw error;
      
      // Update local state
      setRequirementGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, enabled: newEnabled } : group
    ));
    
    toast({
        title: "Requirement group updated",
        description: `Requirement group ${group.name} ${newEnabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating requirement group:', error);
      toast({
        title: 'Error updating requirement group',
        description: 'There was a problem updating the requirement group.',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddRequirement = async () => {
    if (!user) {
      console.error("User not authenticated");
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to add requirements',
        variant: 'destructive'
      });
      return;
    }

    if (!newRequirementValue.trim() || !selectedGroup) {
      console.error("Cannot add requirement: empty value or no selected group", { 
        newRequirementValue, 
        selectedGroup 
      });
      toast({
        title: 'Cannot add requirement',
        description: !newRequirementValue.trim() 
          ? 'Please enter a requirement value' 
          : 'No requirement group selected',
        variant: 'destructive'
      });
      return;
    }
    
    console.log("Adding requirement:", { 
      newRequirementType, 
      newRequirementValue, 
      selectedGroup,
      user_id: user.id
    });
    
    const requirementId = `filter-${Date.now()}`;
    
    try {
      // Add to database
      console.log("Inserting requirement into database:", {
        id: requirementId,
        filter_group_id: selectedGroup,
        type: newRequirementType,
        value: newRequirementValue
      });
      
      const { data, error } = await supabase
        .from('filters')
        .insert({
          id: requirementId,
          filter_group_id: selectedGroup,
          type: newRequirementType,
          value: newRequirementValue,
          weight: 50,
          required: false
        })
        .select();
      
      console.log("Database response:", { data, error });
      
      if (error) throw error;
      
      // Create the new requirement object from the returned data
      const newRequirement: Requirement = {
        id: requirementId,
        type: newRequirementType,
        value: newRequirementValue,
      weight: 50,
      required: false
    };
    
      // Update local state
      setRequirementGroups(prev => prev.map(group => 
      group.id === selectedGroup 
          ? { ...group, filters: [...group.filters, newRequirement] } 
        : group
    ));
    
      setNewRequirementValue('');
    
    toast({
        title: "Requirement added",
        description: `Added ${newRequirementType} requirement: ${newRequirementValue}`
      });
    } catch (error: any) {
      console.error('Error adding requirement:', error);
      toast({
        title: 'Error adding requirement',
        description: error.message || 'There was a problem adding the requirement.',
        variant: 'destructive'
      });
    }
  };
  
  const handleRemoveRequirement = async (requirementId: string) => {
    if (!selectedGroup) return;
    
    const requirementToRemove = requirementGroups
      .find(group => group.id === selectedGroup)?.filters
      .find(requirement => requirement.id === requirementId);
    
    if (!requirementToRemove) return;
    
    try {
      // Remove from database
      const { error } = await supabase
        .from('filters')
        .delete()
        .eq('id', requirementId);
      
      if (error) throw error;
      
      // Update local state
      setRequirementGroups(prev => prev.map(group => 
      group.id === selectedGroup 
        ? { 
            ...group, 
              filters: group.filters.filter(requirement => requirement.id !== requirementId) 
          } 
        : group
    ));
    
    toast({
        title: "Requirement removed",
        description: `Removed ${requirementToRemove.type} requirement: ${requirementToRemove.value}`
      });
    } catch (error) {
      console.error('Error removing requirement:', error);
      toast({
        title: 'Error removing requirement',
        description: 'There was a problem removing the requirement.',
        variant: 'destructive'
      });
    }
  };
  
  const handleUpdateRequirement = async (requirementId: string, updates: Partial<Requirement>) => {
    if (!selectedGroup) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('filters')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requirementId);
      
      if (error) throw error;
      
      // Update local state
      setRequirementGroups(prev => prev.map(group => 
      group.id === selectedGroup 
        ? { 
            ...group, 
              filters: group.filters.map(requirement => 
                requirement.id === requirementId 
                  ? { ...requirement, ...updates } 
                  : requirement
            ) 
          } 
        : group
    ));
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast({
        title: 'Error updating requirement',
        description: 'There was a problem updating the requirement.',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddGroup = async () => {
    if (!newGroupName.trim() || !selectedProject) return;
    
    const groupId = `filtergroup-${Date.now()}`;
    
    try {
      // Add to database
      const { error } = await supabase
        .from('filter_groups')
        .insert({
          id: groupId,
          name: newGroupName,
          project_id: selectedProject,
          user_id: user?.id,
          enabled: true
        });
      
      if (error) throw error;
      
      // Update local state
      const newGroup: RequirementGroup = {
        id: groupId,
      name: newGroupName,
      enabled: true,
        projectId: selectedProject,
      filters: []
    };
    
      setRequirementGroups(prev => [newGroup, ...prev]);
      setSelectedGroup(groupId);
    setNewGroupName('');
    setIsCreatingGroup(false);
    
    toast({
        title: "Requirement group created",
        description: `Created new requirement group: ${newGroupName}`
      });
    } catch (error) {
      console.error('Error creating requirement group:', error);
      toast({
        title: 'Error creating requirement group',
        description: 'There was a problem creating the requirement group.',
        variant: 'destructive'
      });
    }
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    const group = requirementGroups.find(g => g.id === groupId);
    if (!group) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('filter_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
      
      // Update local state
      setRequirementGroups(prev => prev.filter(group => group.id !== groupId));
    
    if (selectedGroup === groupId) {
        setSelectedGroup(requirementGroups.length > 1 ? requirementGroups.filter(g => g.id !== groupId)[0]?.id : null);
    }
    
    toast({
        title: "Requirement group deleted",
        description: `Deleted requirement group: ${group.name}`
      });
    } catch (error) {
      console.error('Error deleting requirement group:', error);
      toast({
        title: 'Error deleting requirement group',
        description: 'There was a problem deleting the requirement group.',
        variant: 'destructive'
      });
    }
  };
  
  const handleSelectSkill = (skill: string) => {
    setNewRequirementValue(skill);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Job Requirements</h1>
              <p className="text-gray-600">Define requirements for candidate matching</p>
            </div>
            
            {projects.length > 0 && (
              <div className="flex items-center gap-3">
                <Label htmlFor="project-select" className="text-sm font-medium">
                  Project:
                </Label>
                <Select
                  value={selectedProject || ''}
                  onValueChange={(value) => setSelectedProject(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lens-purple"></div>
                  <span className="ml-3 text-gray-600">Loading requirements...</span>
                </div>
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderPlus className="h-16 w-16 mx-auto opacity-20 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Projects Available</h3>
                <p className="text-gray-600 mb-4">
                  You need to create a project in the Resume Upload section first
                </p>
                <Button
                  className="bg-lens-purple hover:bg-lens-purple/90"
                  onClick={() => window.location.href = '/dashboard/parser'}
                >
                  Go to Resume Upload
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Requirement Groups Sidebar */}
            <Card className="lg:col-span-1">
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {requirementGroups.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No requirement groups yet</p>
                      <p className="text-sm">Create your first requirement group</p>
                    </div>
                  ) : (
                    requirementGroups.map(group => (
                    <div
                      key={group.id}
                      className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedGroup === group.id ? 'bg-lens-purple/5 border-l-4 border-l-lens-purple' : ''
                      }`}
                      onClick={() => setSelectedGroup(group.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${group.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{group.name}</span>
                        <Badge variant="outline" className="text-xs">
                            {group.filters.length} requirements
                        </Badge>
                      </div>
                      {selectedGroup === group.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    ))
                  )}
                </div>
                
                {isCreatingGroup ? (
                  <div className="p-3 border-t">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Group name" 
                        className="h-8 text-sm"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-lens-purple hover:bg-lens-purple/90"
                        onClick={handleAddGroup}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => {
                          setIsCreatingGroup(false);
                          setNewGroupName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsCreatingGroup(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Requirement Group
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Requirement Content */}
            <div className="lg:col-span-3 space-y-6">
              {currentGroup ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-xl">{currentGroup.name}</CardTitle>
                        <CardDescription>
                          These requirements will be applied to all resumes processed for this position
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentGroup.enabled}
                          onCheckedChange={() => handleToggleRequirementGroup(currentGroup.id)}
                        />
                        <Label htmlFor="requirement-active">{currentGroup.enabled ? 'Active' : 'Inactive'}</Label>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Select 
                            value={newRequirementType}
                            onValueChange={(value) => setNewRequirementType(value as Requirement['type'])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Requirement type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skill">Skill</SelectItem>
                              <SelectItem value="experience">Experience</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="keyword">Keyword</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="md:col-span-2">
                          <Input 
                              placeholder="Requirement value" 
                              value={newRequirementValue}
                              onChange={(e) => setNewRequirementValue(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {newRequirementType === 'skill' && (
                          <div>
                            <Label className="text-sm text-gray-500 mb-2 block">Common Skills</Label>
                            <div className="flex flex-wrap gap-1">
                              {commonSkills.map((skill) => (
                                <Badge 
                                  key={skill} 
                                  variant="outline" 
                                  className="cursor-pointer hover:bg-lens-purple/10"
                                  onClick={() => handleSelectSkill(skill)}
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          className="bg-lens-purple hover:bg-lens-purple/90 w-full md:w-auto"
                          onClick={handleAddRequirement}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Requirement
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-4">
                        {currentGroup.filters.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Filter className="h-12 w-12 mx-auto opacity-20 mb-2" />
                            <p>No requirements added yet</p>
                            <p className="text-sm">Start by adding requirements above</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-2">
                              <div className="col-span-3">Type</div>
                              <div className="col-span-4">Value</div>
                              <div className="col-span-2">Weight</div>
                              <div className="col-span-2">Required</div>
                              <div className="col-span-1"></div>
                            </div>
                            
                            {currentGroup.filters.map(requirement => (
                              <div key={requirement.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
                                <div className="col-span-3">
                                  <Badge className="capitalize">{requirement.type}</Badge>
                                </div>
                                <div className="col-span-4 font-medium">{requirement.value}</div>
                                <div className="col-span-2">
                                  <Slider
                                    value={[requirement.weight]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                    onValueChange={(value) => handleUpdateRequirement(requirement.id, { weight: value[0] })}
                                  />
                                  <div className="text-xs text-center mt-1">{requirement.weight}%</div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <Checkbox 
                                    checked={requirement.required} 
                                    onCheckedChange={(checked) => handleUpdateRequirement(requirement.id, { required: !!checked })}
                                  />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleRemoveRequirement(requirement.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="bg-lens-purple hover:bg-lens-purple/90 gap-2">
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </Button>
                    </CardFooter>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Filter className="h-16 w-16 mx-auto opacity-20 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Requirement Group Selected</h3>
                    <p className="text-gray-600 mb-4">
                      Select an existing requirement group or create a new one to get started
                    </p>
                    <Button
                      className="bg-lens-purple hover:bg-lens-purple/90 mx-auto"
                      onClick={() => setIsCreatingGroup(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Requirement Group
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Filters;
