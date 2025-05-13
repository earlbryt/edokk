import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Filter, Plus, X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  documentsCount: number;
}

interface Position {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  key_skills?: string[];
  qualifications?: string[];
}

interface RequirementGroup {
  id: string;
  name: string;
  filters: Requirement[];
  enabled: boolean;
  projectId: string;
  positionId: string;
}

interface Requirement {
  id: string;
  type: 'skill' | 'experience' | 'education' | 'location' | 'keyword';
  value: string;
  required: boolean;
}

const Filters: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [requirementGroup, setRequirementGroup] = useState<RequirementGroup | null>(null);
  const [newRequirementType, setNewRequirementType] = useState<Requirement['type']>('skill');
  const [newRequirementValue, setNewRequirementValue] = useState('');
  // Position-specific common skills
  const positionSkillsMap = {
    // Software Developer skills
    'Software Developer': [
      'JavaScript', 'React', 'TypeScript', 'Python', 'Java', 'C#', 'Node.js',
      'SQL', 'AWS', 'Docker', 'Kubernetes', 'HTML', 'CSS', 'Git', 'Agile',
      'REST API', 'GraphQL', 'MongoDB', 'Redis', 'CI/CD', 'DevOps'
    ],
    // Data Scientist skills
    'Data Scientist': [
      'Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
      'Pandas', 'NumPy', 'SciPy', 'scikit-learn', 'Big Data', 'Spark', 'Hadoop',
      'Statistics', 'A/B Testing', 'Data Visualization', 'NLP', 'Computer Vision'
    ],
    // Product Manager skills
    'Product Manager': [
      'Product Roadmap', 'User Stories', 'Market Research', 'Competitive Analysis',
      'User Experience', 'Agile', 'Scrum', 'JIRA', 'Product Strategy', 'Prioritization',
      'Stakeholder Management', 'User Testing', 'KPIs', 'Product Analytics', 'A/B Testing'
    ],
    // UX Designer skills
    'UX Designer': [
      'Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping',
      'Usability Testing', 'Information Architecture', 'User Flows', 'UI Design',
      'Design Systems', 'Accessibility', 'Design Thinking', 'User Personas'
    ],
    // Marketing Manager skills
    'Marketing Manager': [
      'Digital Marketing', 'Content Marketing', 'SEO', 'SEM', 'Social Media Marketing',
      'Email Marketing', 'Marketing Analytics', 'Campaign Management', 'Brand Strategy',
      'Marketing Automation', 'CRM', 'Google Analytics', 'Adobe Analytics'
    ]
  };
  
  // Determine current common skills based on selected position
  const getCommonSkills = () => {
    if (!selectedPosition) return [];
    
    const position = positions.find(p => p.id === selectedPosition);
    if (!position) return [];
    
    return positionSkillsMap[position.title] || [];
  };
  
  // Parse URL parameters for project and position selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    const positionId = params.get('position');
    
    if (projectId) {
      setSelectedProject(projectId);
    }
    
    if (positionId) {
      setSelectedPosition(positionId);
    }
  }, [location]);
  
  // Load user's projects
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
          
          // If there's only one project and none selected, select it automatically
          if (formattedProjects.length === 1 && !selectedProject) {
            setSelectedProject(formattedProjects[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: 'Error loading projects',
          description: 'There was a problem loading your projects.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast]);
  
  // Load positions (hardcoded in database for all projects)
  const loadPositions = async () => {
    if (!user) return;
    
    try {
      // Get all positions without filtering by project_id since they're hardcoded
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*');
      
      if (positionsError) throw positionsError;
      
      if (positionsData) {
        setPositions(positionsData);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: 'Error loading positions',
        description: 'There was a problem loading positions.',
        variant: 'destructive'
      });
    }
  };
  
  // Load project data when a project is selected
  useEffect(() => {
    if (selectedProject) {
      loadPositions();
    }
  }, [selectedProject]);
  
  // Find or create a requirement group for a position
  const findOrCreateRequirementGroup = async (projectId: string, positionId: string) => {
    if (!user || !projectId || !positionId) return;
    
    setIsLoading(true);
    
    try {
      // First, try to find an existing requirement group for this position
      const { data: existingGroups, error: findError } = await supabase
        .from('filter_groups')
        .select('*')
        .eq('project_id', projectId)
        .eq('position_id', positionId)
        .eq('user_id', user.id);
      
      if (findError) throw findError;
      
      let groupId: string;
      
      // If a group exists, use it
      if (existingGroups && existingGroups.length > 0) {
        groupId = existingGroups[0].id;
      } else {
        // Get position title for the group name
        const position = positions.find(p => p.id === positionId);
        const positionTitle = position ? position.title : 'Position';
        
        // No group exists, so create one
        groupId = `group-${Date.now()}`;
        const groupName = `${positionTitle} Requirements`;
        
        const { error } = await supabase
          .from('filter_groups')
          .insert({
            id: groupId,
            name: groupName,
            user_id: user.id,
            project_id: projectId,
            position_id: positionId,
            enabled: true
          });
        
        if (error) throw error;
      }
      
      // Load the requirements for this group
      await loadRequirements(groupId, projectId, positionId);
    } catch (error) {
      console.error('Error with position requirement group:', error);
      toast({
        title: 'Error setting up requirements',
        description: 'There was a problem setting up requirements for this position.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load requirements for a group
  const loadRequirements = async (groupId: string, projectId: string, positionId: string) => {
    try {
      const { data: requirementsData, error: requirementsError } = await supabase
        .from('filters')
        .select('*')
        .eq('filter_group_id', groupId)
        .order('created_at', { ascending: true });
      
      if (requirementsError) throw requirementsError;
      
      // Get the position info
      const position = positions.find(p => p.id === positionId);
      
      // Create the requirement group object
      setRequirementGroup({
        id: groupId,
        name: position ? `${position.title} Requirements` : 'Position Requirements',
        projectId: projectId,
        positionId: positionId,
        enabled: true,
        filters: requirementsData ? requirementsData.map(requirement => ({
          id: requirement.id,
          type: requirement.type as Requirement['type'],
          value: requirement.value,
          required: requirement.required
        })) : []
      });
    } catch (error) {
      console.error('Error loading requirements:', error);
      toast({
        title: 'Error loading requirements',
        description: 'There was a problem loading requirements for this position.',
        variant: 'destructive'
      });
    }
  };
  
  // When position is selected, find or create its requirement group
  useEffect(() => {
    if (selectedProject && selectedPosition) {
      findOrCreateRequirementGroup(selectedProject, selectedPosition);
    } else {
      setRequirementGroup(null);
    }
  }, [selectedPosition, selectedProject]);
  
  // Add a new requirement
  const handleAddRequirement = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to add requirements',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newRequirementValue.trim() || !requirementGroup) {
      toast({
        title: 'Cannot add requirement',
        description: !newRequirementValue.trim() 
          ? 'Please enter a requirement value' 
          : 'No position selected',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate input based on requirement type
    let validationError = '';
    switch(newRequirementType) {
      case 'experience':
        if (!/\d+/.test(newRequirementValue) && !newRequirementValue.toLowerCase().includes('year')) {
          validationError = 'Experience should include years (e.g., "3 years Java")';
        }
        break;
      case 'education':
      case 'skill':
      case 'location':
      case 'keyword':
        // No specific validation for these types
        break;
    }
    
    if (validationError) {
      toast({
        title: 'Invalid requirement format',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }
    
    const requirementId = `filter-${Date.now()}`;
    
    try {
      // Add to database
      const { data, error } = await supabase
        .from('filters')
        .insert({
          id: requirementId,
          filter_group_id: requirementGroup.id,
          type: newRequirementType,
          value: newRequirementValue,
          required: false
        })
        .select();
      
      if (error) throw error;
      
      // Use the returned data if available, otherwise use our generated data
      const newRequirement: Requirement = data && data[0] ? {
        id: data[0].id,
        type: data[0].type as Requirement['type'],
        value: data[0].value,
        required: data[0].required
      } : {
        id: requirementId,
        type: newRequirementType,
        value: newRequirementValue,
        required: false
      };
    
      // Update local state
      setRequirementGroup(prev => prev ? {
        ...prev,
        filters: [...prev.filters, newRequirement]
      } : null);
    
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
  
  // Remove a requirement
  const handleRemoveRequirement = async (requirementId: string) => {
    if (!requirementGroup) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('filters')
        .delete()
        .eq('id', requirementId);
      
      if (error) throw error;
      
      // Update local state
      setRequirementGroup(prev => prev ? {
        ...prev,
        filters: prev.filters.filter(requirement => requirement.id !== requirementId)
      } : null);
      
      toast({
        title: "Requirement removed",
        description: "The requirement has been removed"
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
  
  // Update a requirement (e.g., toggle required)
  const handleUpdateRequirement = async (requirementId: string, updates: Partial<Requirement>) => {
    if (!requirementGroup) return;
    
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
      setRequirementGroup(prev => prev ? {
        ...prev,
        filters: prev.filters.map(requirement => 
          requirement.id === requirementId 
            ? { ...requirement, ...updates } 
            : requirement
        )
      } : null);
    } catch (error: any) {
      console.error('Error updating requirement:', error);
      toast({
        title: 'Error updating requirement',
        description: error.message || 'There was a problem updating the requirement.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Position Requirements</h1>
              <p className="text-gray-600">Define requirements for candidate matching</p>
            </div>
            
            {projects.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    Select a project
                  </label>
                  <div className="relative">
                    <select
                      className="appearance-none w-full bg-white border border-gray-100 hover:border-gray-200 px-4 py-3 pr-10 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-lens-purple/50 focus:border-lens-purple/10 transition-all duration-200 text-gray-700 font-medium"
                      value={selectedProject || ''}
                      onChange={(e) => {
                        setSelectedProject(e.target.value);
                        setSelectedPosition(null);
                      }}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        Select a project
                      </option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-lens-purple">
                      <svg className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    Select a position
                  </label>
                  <div className="relative">
                    <select
                      className="appearance-none w-full bg-white border border-gray-100 hover:border-gray-200 px-4 py-3 pr-10 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-lens-purple/50 focus:border-lens-purple/10 transition-all duration-200 text-gray-700 font-medium"
                      value={selectedPosition || ''}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      disabled={isLoading || positions.length === 0}
                    >
                      <option value="" disabled>
                        {positions.length > 0 ? 'Select a position' : 'No positions available'}
                      </option>
                      {positions.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-lens-purple">
                      <svg className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {positions.length === 0 && selectedProject && (
                    <p className="text-xs text-red-500 mt-1">
                      No positions found for this project. Please create positions first.
                    </p>
                  )}
                </div>
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
                <AlertCircle className="h-16 w-16 mx-auto opacity-20 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Projects Available</h3>
                <p className="text-gray-600 mb-4">
                  You need to create a project in the Resume Upload section first
                </p>
                <Button
                  className="bg-lens-purple hover:bg-lens-purple/90"
                  onClick={() => navigate('/dashboard/parser')}
                >
                  Go to Resume Upload
                </Button>
              </CardContent>
            </Card>
          ) : !selectedProject ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Filter className="h-16 w-16 mx-auto opacity-20 mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a Project</h3>
                <p className="text-gray-600 mb-4">
                  Please select a project to view and manage position requirements
                </p>
              </CardContent>
            </Card>
          ) : !selectedPosition ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Filter className="h-16 w-16 mx-auto opacity-20 mb-4" />
                <h3 className="text-xl font-medium mb-2">Select a Position</h3>
                <p className="text-gray-600 mb-4">
                  Please select a position to define requirements for candidate matching
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {positions.find(p => p.id === selectedPosition)?.title} Requirements
                    </CardTitle>
                    <CardDescription>
                      Define the requirements candidates must meet for this position
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold text-gray-800">Common Skills for {positions.find(p => p.id === selectedPosition)?.title}</h3>
                      <Badge variant="secondary" className="bg-lens-purple/10 text-lens-purple border-0">
                        Click to add
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {getCommonSkills().map(skill => (
                        <Badge 
                          key={skill} 
                          variant="outline" 
                          className="py-1.5 px-3 cursor-pointer bg-white hover:bg-lens-purple/5 hover:border-lens-purple/30 transition-all duration-150 font-medium"
                          onClick={() => {
                            setNewRequirementType('skill');
                            setNewRequirementValue(skill);
                            // No auto-submit - user will click the Add button themselves
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                      
                      {getCommonSkills().length === 0 && (
                        <p className="text-sm text-gray-500 italic py-2">No common skills available for this position</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-1/4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requirement Type
                      </label>
                      <div className="relative">
                        <select
                          className="appearance-none w-full bg-white border border-gray-100 hover:border-gray-200 px-4 py-3 pr-10 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-lens-purple/50 focus:border-lens-purple/10 transition-all duration-200 text-gray-700 font-medium"
                          value={newRequirementType}
                          onChange={(e) => setNewRequirementType(e.target.value as Requirement['type'])}
                        >
                          <option value="skill">Skill</option>
                          <option value="experience">Experience</option>
                          <option value="education">Education</option>
                          <option value="location">Location</option>
                          <option value="keyword">Keyword</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-lens-purple">
                          <svg className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requirement Value
                      </label>
                      <div className="flex">
                        <Input
                          value={newRequirementValue}
                          onChange={(e) => setNewRequirementValue(e.target.value)}
                          placeholder={`Enter ${newRequirementType} requirement`}
                          className="rounded-r-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRequirement()}
                        />
                        <Button
                          onClick={handleAddRequirement}
                          className="bg-lens-purple hover:bg-lens-purple/90 rounded-l-none"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    {requirementGroup && requirementGroup.filters.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="h-12 w-12 mx-auto opacity-20 mb-2" />
                        <p>No requirements added yet</p>
                        <p className="text-sm">Start by adding requirements above</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-2">
                          <div className="col-span-4">Type</div>
                          <div className="col-span-6">Value</div>
                          <div className="col-span-1 text-center">Required</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {requirementGroup && requirementGroup.filters.map(requirement => (
                          <div key={requirement.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b">
                            <div className="col-span-4">
                              <Badge className="capitalize">{requirement.type}</Badge>
                            </div>
                            <div className="col-span-6 font-medium">{requirement.value}</div>
                            <div className="col-span-1 flex justify-center">
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
                  <Button 
                    className="bg-lens-purple hover:bg-lens-purple/90 gap-2"
                    onClick={() => {
                      toast({
                        title: "Requirements saved",
                        description: "All changes have been automatically saved"
                      });
                    }}
                  >
                    <Save className="h-4 w-4" />
                    Requirements Saved
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Filters;
