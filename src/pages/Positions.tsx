import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import CandidateTable from '@/components/Dashboard/CandidateTable';
import { Search, Users, Star, Award, ThumbsUp, UserCheck, ChevronLeft, ArrowUpRight, Download, User, Filter, Plus, X, Save, Tag, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import LoadingAnimation from '@/components/ui/loading-animation';
import BucketSelector from '@/components/Dashboard/BucketSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface Position {
  id: string;
  title: string;
  description: string;
  key_skills: string[];
  qualifications: string[];
  candidate_count: number;
}

interface Requirement {
  id: string;
  type: 'skill' | 'experience' | 'education' | 'location' | 'keyword';
  value: string;
  required: boolean;
}

interface RequirementGroup {
  id: string;
  name: string;
  filters: Requirement[];
  enabled: boolean;
  projectId: string;
  positionId: string;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  status?: string;
  project_id: string;
  skills: string[];
  education: string;
  experience: string;
  avatar: string;
  rating: any;
  position: string;
  confidence: number;
  parsed?: any;
  cvFile?: {
    storage_url?: string;
    raw_text?: string;
  };
}

const Positions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'positions' | 'candidates' | 'detail'>('positions');
  const [activePosition, setActivePosition] = useState<Position | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  
  // Requirements management state
  const [activeTab, setActiveTab] = useState('candidates');
  const [requirementGroup, setRequirementGroup] = useState<RequirementGroup | null>(null);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [newRequirementType, setNewRequirementType] = useState<Requirement['type']>('skill');
  const [newRequirementValue, setNewRequirementValue] = useState('');
  
  // Position-specific common skills - comprehensive map covering more position titles and variations
  const positionSkillsMap: {[key: string]: string[]} = {
    // Software Developer skills and variations
    'Software Developer': [
      'JavaScript', 'React', 'TypeScript', 'Python', 'Java', 'C#', 'Node.js',
      'SQL', 'AWS', 'Docker', 'Kubernetes', 'HTML', 'CSS', 'Git', 'Agile',
      'REST API', 'GraphQL', 'MongoDB', 'Redis', 'CI/CD', 'DevOps'
    ],
    'Software Engineer': [
      'JavaScript', 'React', 'TypeScript', 'Python', 'Java', 'C#', 'Node.js',
      'SQL', 'AWS', 'Docker', 'Kubernetes', 'HTML', 'CSS', 'Git', 'Agile',
      'REST API', 'GraphQL', 'MongoDB', 'Redis', 'CI/CD', 'DevOps'
    ],
    'Frontend Developer': [
      'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Redux',
      'Responsive Design', 'Webpack', 'Jest', 'CSS-in-JS', 'Web Accessibility',
      'Web Performance', 'Browser APIs', 'UI/UX', 'SASS/LESS'
    ],
    'Backend Developer': [
      'Node.js', 'Python', 'Java', 'C#', '.NET', 'Spring', 'Django', 'Express',
      'SQL', 'NoSQL', 'PostgreSQL', 'MongoDB', 'Redis', 'API Design', 'AWS', 'Azure',
      'Microservices', 'Docker', 'Kubernetes'
    ],
    'Full Stack Developer': [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
      'HTML', 'CSS', 'SQL', 'NoSQL', 'Git', 'AWS', 'Docker', 'REST API',
      'GraphQL', 'Redux', 'Express', 'MongoDB', 'PostgreSQL'
    ],
    
    // Data Science skills and variations
    'Data Scientist': [
      'Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
      'Pandas', 'NumPy', 'SciPy', 'scikit-learn', 'Big Data', 'Spark', 'Hadoop',
      'Statistics', 'A/B Testing', 'Data Visualization', 'NLP', 'Computer Vision'
    ],
    'Machine Learning Engineer': [
      'Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Deep Learning', 'Computer Vision',
      'NLP', 'Reinforcement Learning', 'MLOps', 'Docker', 'Kubernetes', 'AWS',
      'Distributed Computing', 'Data Pipeline', 'Model Deployment', 'Model Optimization'
    ],
    'Data Engineer': [
      'Python', 'SQL', 'Spark', 'Hadoop', 'AWS', 'Azure', 'ETL', 'Data Warehouse',
      'Data Pipeline', 'Airflow', 'Kafka', 'Docker', 'Kubernetes', 'NoSQL',
      'Data Modeling', 'Snowflake', 'BigQuery', 'Redshift'
    ],
    'Data Analyst': [
      'SQL', 'Python', 'R', 'Excel', 'Power BI', 'Tableau', 'Data Visualization',
      'Statistics', 'A/B Testing', 'Data Cleaning', 'ETL', 'Google Analytics',
      'Data Modeling', 'Dashboard Design', 'Business Intelligence'
    ],
    
    // Product roles
    'Product Manager': [
      'Product Roadmap', 'User Stories', 'Market Research', 'Competitive Analysis',
      'User Experience', 'Agile', 'Scrum', 'JIRA', 'Product Strategy', 'Prioritization',
      'Stakeholder Management', 'User Testing', 'KPIs', 'Product Analytics', 'A/B Testing'
    ],
    'Project Manager': [
      'Agile', 'Scrum', 'Kanban', 'JIRA', 'Project Planning', 'Risk Management',
      'Budget Management', 'Stakeholder Management', 'Communication', 'Microsoft Project',
      'Timeline Management', 'Resource Planning', 'PMP', 'Critical Path'
    ],
    
    // Design roles
    'UX Designer': [
      'Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping',
      'Usability Testing', 'Information Architecture', 'User Flows', 'UI Design',
      'Design Systems', 'Accessibility', 'Design Thinking', 'User Personas'
    ],
    'UI Designer': [
      'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Illustrator', 'Photoshop',
      'Visual Design', 'Color Theory', 'Typography', 'Design Systems', 'Responsive Design',
      'Micro-interactions', 'Design Principles', 'Animation', 'Brand Guidelines'
    ],
    'UI/UX Designer': [
      'Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping',
      'Usability Testing', 'Visual Design', 'Typography', 'Color Theory', 'Responsive Design',
      'Design Systems', 'Accessibility', 'User Flows', 'Design Thinking'
    ],
    
    // DevOps roles
    'DevOps Engineer': [
      'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Jenkins',
      'CI/CD', 'Linux', 'Scripting', 'Monitoring', 'Git', 'Infrastructure as Code',
      'Prometheus', 'Grafana', 'ELK Stack', 'Security', 'Networking'
    ],
    'Site Reliability Engineer': [
      'Linux', 'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform', 'Prometheus',
      'Grafana', 'CI/CD', 'Automation', 'Monitoring', 'Alerting', 'Incident Response',
      'High Availability', 'Scalability', 'Performance Tuning', 'Networking'
    ],
    'Cloud Engineer': [
      'AWS', 'Azure', 'GCP', 'Terraform', 'CloudFormation', 'Kubernetes', 'Docker',
      'CI/CD', 'Infrastructure as Code', 'Serverless', 'Cloud Security', 'Networking',
      'Monitoring', 'Cost Optimization', 'Multi-cloud', 'Microservices'
    ],
    
    // Marketing roles
    'Marketing Manager': [
      'Digital Marketing', 'Content Marketing', 'SEO', 'SEM', 'Social Media Marketing',
      'Email Marketing', 'Marketing Analytics', 'Campaign Management', 'Brand Strategy',
      'Marketing Automation', 'CRM', 'Google Analytics', 'Adobe Analytics'
    ],
    'Digital Marketer': [
      'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Social Media',
      'Email Marketing', 'Analytics', 'Landing Page Optimization', 'A/B Testing',
      'Marketing Automation', 'CRM', 'Google Analytics', 'Tag Manager'
    ]
  };
  
  // Function to fetch positions and candidates
  const fetchPositionsAndCandidates = async () => {
    try {
      setLoading(true);
      
      // Fetch all positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*');
      
      if (positionsError) throw positionsError;
      
      // Fetch candidates with inferred positions
      const { data: candidatePositions, error: candidatePositionsError } = await supabase
        .from('candidate_positions')
        .select(`
          *,
          cv_files (
            id,
            name,
            status,
            project_id,
            summary_id,
            parsed_data
          )
        `)
        .order('confidence', { ascending: false });
        
      if (candidatePositionsError) throw candidatePositionsError;
      
      if (!candidatePositions || candidatePositions.length === 0) {
        setPositions(positionsData || []);
        setAllCandidates([]);
        setFilteredCandidates([]);
        setLoading(false);
        return;
      }
      
      // Get the CV file IDs to fetch summaries
      const cvFileIds = candidatePositions
        .map(cp => cp.cv_files?.id)
        .filter(Boolean);
        
      // Fetch summaries for the candidates
      const { data: summariesData, error: summariesError } = await supabase
        .from('summaries')
        .select('*')
        .in('cv_file_id', cvFileIds);
        
      if (summariesError) throw summariesError;
      
      // Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('candidate_ratings')
        .select('*')
        .in('cv_file_id', cvFileIds);
        
      if (ratingsError) throw ratingsError;
      
      // Process candidates
      const processedCandidates = candidatePositions.map(cp => {
        const cvFile = cp.cv_files;
        if (!cvFile) return null;
        
        // Find the summary and rating
        const summary = summariesData?.find(s => s.cv_file_id === cvFile.id);
        const rating = ratingsData?.find(r => r.cv_file_id === cvFile.id);
        
        // Get candidate data
        const candidateData = summary || cvFile.parsed_data || {};
        
        return {
          id: cvFile.id,
          name: cvFile.name || candidateData.name || 'Unnamed Candidate',
          role: (candidateData.experience && candidateData.experience[0]) || 'Position Unknown',
          status: rating ? `bucket-${rating.rating.toLowerCase()}` : undefined,
          project_id: cvFile.project_id,
          skills: candidateData.skills || [],
          education: (candidateData.education && candidateData.education[0]) || 'Education Unknown',
          experience: candidateData.experience 
            ? `${candidateData.experience.length} experiences` 
            : 'Experience Unknown',
          avatar: `/assets/profile/avatar1.avif`, // Default avatar
          rating,
          position: cp.position,
          confidence: cp.confidence
        };
      }).filter(Boolean) as Candidate[];
      
      console.log('Raw positions data:', positionsData);
      
      // Count candidates per position and ensure key_skills is an array
      const positionsWithCounts = positionsData?.map(position => {
        const count = processedCandidates.filter(
          candidate => candidate.position?.toLowerCase() === position.title?.toLowerCase()
        ).length;
        
        // Ensure key_skills is an array (handle both string JSON and arrays)
        let keySkills = [];
        if (position.key_skills) {
          if (typeof position.key_skills === 'string') {
            try {
              keySkills = JSON.parse(position.key_skills);
            } catch (e) {
              // If it's not valid JSON, treat it as a comma-separated string
              keySkills = position.key_skills.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(position.key_skills)) {
            keySkills = position.key_skills;
          }
        }
        
        // Similarly handle qualifications if needed
        let qualifications = [];
        if (position.qualifications) {
          if (typeof position.qualifications === 'string') {
            try {
              qualifications = JSON.parse(position.qualifications);
            } catch (e) {
              qualifications = position.qualifications.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(position.qualifications)) {
            qualifications = position.qualifications;
          }
        }
        
        return {
          ...position,
          key_skills: keySkills,
          qualifications: qualifications,
          candidate_count: count
        };
      }) || [];
      
      console.log('Processed positions with counts:', positionsWithCounts);
      
      // Sort positions by candidate count (descending)
      positionsWithCounts.sort((a, b) => b.candidate_count - a.candidate_count);
      
      setPositions(positionsWithCounts);
      setAllCandidates(processedCandidates);
      setFilteredCandidates(processedCandidates);
      
    } catch (error) {
      console.error('Error fetching positions and candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load positions and candidates. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on initial load
  useEffect(() => {
    fetchPositionsAndCandidates();
  }, []);
  
  // Filter candidates when position changes
  useEffect(() => {
    if (activePosition) {
      const filtered = allCandidates.filter(
        candidate => candidate.position?.toLowerCase() === activePosition.title?.toLowerCase()
      );
      setFilteredCandidates(filtered);
    } else {
      setFilteredCandidates(allCandidates);
    }
  }, [activePosition, allCandidates]);
  
  // Search in positions view
  const getFilteredPositions = () => {
    if (!searchQuery.trim()) {
      return positions;
    }
    
    const query = searchQuery.toLowerCase();
    return positions.filter(position => 
      position.title.toLowerCase().includes(query) ||
      position.description.toLowerCase().includes(query) ||
      position.key_skills.some((skill: string) => skill.toLowerCase().includes(query)) ||
      position.qualifications.some((qual: string) => qual.toLowerCase().includes(query))
    );
  };

  // Filter by search query for candidates
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, reset to filter by active position
      if (activePosition) {
        const filtered = allCandidates.filter(
          candidate => candidate.position.toLowerCase() === activePosition.title.toLowerCase()
        );
        setFilteredCandidates(filtered);
      } else {
        setFilteredCandidates(allCandidates);
      }
      return;
    }
    
    const query = searchQuery.toLowerCase();
    let filtered = allCandidates;
    
    // If there's an active position, filter by that first
    if (activePosition) {
      filtered = filtered.filter(
        candidate => candidate.position.toLowerCase() === activePosition.title.toLowerCase()
      );
    }
    
    // Then apply the search filter
    filtered = filtered.filter(candidate => 
      candidate.name.toLowerCase().includes(query) ||
      (candidate.position && candidate.position.toLowerCase().includes(query)) ||
      (candidate.skills && Array.isArray(candidate.skills) && candidate.skills.some(skill => 
        typeof skill === 'string' && skill.toLowerCase().includes(query)
      )) ||
      (candidate.education && candidate.education.toLowerCase().includes(query)) ||
      (candidate.experience && candidate.experience.toLowerCase().includes(query))
    );
    
    setFilteredCandidates(filtered);
  }, [searchQuery, activePosition, allCandidates]);
  
  // Handle view candidate details
  const handleViewCandidate = async (candidate: Candidate) => {
    setLoading(true);
    
    try {
      // Fetch the full CV file data
      const { data: cvFile, error: cvError } = await supabase
        .from('cv_files')
        .select('*')
        .eq('id', candidate.id)
        .single();
      
      if (cvError) throw cvError;
      
      // Fetch the associated summary if it exists
      let summaryData = null;
      if (cvFile.summary_id) {
        const { data: summary, error: summaryError } = await supabase
          .from('summaries')
          .select('*')
          .eq('id', cvFile.summary_id)
          .single();
        
        if (summaryError) throw summaryError;
        summaryData = summary;
      }
      
      // Combine the data
      const fullCandidateData = {
        ...candidate,
        cvFile,
        parsed: summaryData || cvFile.parsed_data || {},
        summaryData
      };
      
      setActiveCandidate(fullCandidateData as any);
      setViewMode('detail');
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle view position candidates
  const handleViewPosition = (position: Position) => {
    setActivePosition(position);
    setViewMode('candidates');
    
    // Load requirements for this position when viewing it
    findOrCreatePositionRequirementGroup(position);
  };
  
  // Function to find or create a requirement group for a position
  const findOrCreatePositionRequirementGroup = async (position: Position) => {
    if (!user || !position) return;
    
    setLoadingRequirements(true);
    
    try {
      // Get all the projects first to ensure we have a valid project_id to use
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      if (projectsError) throw projectsError;
      
      // Use first project or fallback
      const defaultProjectId = projects && projects.length > 0 ? projects[0].id : 'default-project';
      
      // First, try to find an existing requirement group for this position
      const { data: existingGroups, error: findError } = await supabase
        .from('filter_groups')
        .select('*')
        .eq('position_id', position.id)
        .eq('user_id', user.id);
      
      if (findError) throw findError;
      
      let groupId: string;
      
      // If a group exists, use it
      if (existingGroups && existingGroups.length > 0) {
        groupId = existingGroups[0].id;
      } else {
        // No group exists, so create one
        groupId = `group-${Date.now()}`;
        const positionTitle = position.title || 'Position';
        const groupName = `${positionTitle} Requirements`;
        
        const projectId = existingGroups && existingGroups.length > 0 
          ? existingGroups[0].project_id 
          : defaultProjectId;
        
        const { error } = await supabase
          .from('filter_groups')
          .insert({
            id: groupId,
            name: groupName,
            user_id: user.id,
            project_id: projectId,
            position_id: position.id,
            enabled: true
          });
        
        if (error) throw error;
      }
      
      // Load the requirements for this group
      await loadRequirements(groupId, position.id);
    } catch (error: any) {
      console.error('Error with position requirement group:', error);
      toast({
        title: 'Error setting up requirements',
        description: error.message || 'There was a problem setting up requirements for this position.',
        variant: 'destructive'
      });
      
      // Set a minimal requirementGroup to avoid UI issues
      if (position) {
        setRequirementGroup({
          id: `temp-${Date.now()}`,
          name: `${position.title} Requirements`,
          projectId: 'default-project',
          positionId: position.id,
          enabled: true,
          filters: []
        });
      }
    } finally {
      setLoadingRequirements(false);
    }
  };
  
  // Load requirements for a group
  const loadRequirements = async (groupId: string, positionId: string) => {
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
        projectId: 'default-project', // Using a default value since we might not have the project ID
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
  
  // Get common skills for the selected position with smart matching
  const getCommonSkills = () => {
    if (!activePosition) return [];
    
    // Direct match case - position title is exactly in our map
    if (positionSkillsMap[activePosition.title]) {
      return positionSkillsMap[activePosition.title];
    }
    
    // Partial match case - find if position title contains any key in our map
    // For example "Senior Software Engineer" contains "Software Engineer"
    for (const key of Object.keys(positionSkillsMap)) {
      if (activePosition.title.toLowerCase().includes(key.toLowerCase())) {
        return positionSkillsMap[key];
      }
    }
    
    // Keyword match case - look for common job categories
    const titleLower = activePosition.title.toLowerCase();
    
    // Software development related titles
    if (titleLower.includes('developer') || titleLower.includes('engineer') || 
        titleLower.includes('programmer') || titleLower.includes('coding')) {
      return positionSkillsMap['Software Developer'];
    }
    
    // Data science related titles
    if (titleLower.includes('data') || titleLower.includes('machine learning') || 
        titleLower.includes('ai') || titleLower.includes('analytics')) {
      return positionSkillsMap['Data Scientist'];
    }
    
    // Design related titles
    if (titleLower.includes('design') || titleLower.includes('ux') || 
        titleLower.includes('ui') || titleLower.includes('user experience')) {
      return positionSkillsMap['UX Designer'];
    }
    
    // DevOps related titles
    if (titleLower.includes('devops') || titleLower.includes('sre') || 
        titleLower.includes('operations') || titleLower.includes('infrastructure')) {
      return positionSkillsMap['DevOps Engineer'];
    }
    
    // Marketing related titles
    if (titleLower.includes('market') || titleLower.includes('brand') || 
        titleLower.includes('content') || titleLower.includes('seo')) {
      return positionSkillsMap['Marketing Manager'];
    }
    
    // Product related titles
    if (titleLower.includes('product') || titleLower.includes('project') || 
        titleLower.includes('program') || titleLower.includes('manager')) {
      return positionSkillsMap['Product Manager'];
    }
    
    // If no match is found, return generic professional skills as fallback
    return [
      'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
      'Adaptability', 'Time Management', 'Leadership', 'Attention to Detail',
      'Project Management', 'Collaboration', 'Research', 'Presentation',
      'Writing', 'Microsoft Office', 'Google Workspace', 'Remote Work'
    ];
  };
  
  // Add a new requirement
  const handleAddRequirement = async () => {
    if (!user || !requirementGroup) {
      toast({
        title: 'Cannot add requirement',
        description: !user ? 'You must be logged in' : 'No position selected',
        variant: 'destructive'
      });
      return;
    }
    
    if (!newRequirementValue.trim()) {
      toast({
        title: 'Cannot add requirement',
        description: 'Please enter a requirement value',
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
  
  // Function to get a color for a position (used for folder styling)
  const getPositionColor = (position: Position, index: number) => {
    // Premium gradient colors with improved visual contrast
    const colors = [
      {
        gradient: 'from-purple-50 via-purple-100 to-white',
        accentGradient: 'from-purple-600 to-purple-400',
        text: 'text-purple-800',
        lightText: 'text-purple-700',
        border: 'border-purple-200',
        iconBg: 'bg-purple-100',
        badgeBg: 'bg-purple-50',
        hoverBg: 'hover:bg-purple-50'
      },
      {
        gradient: 'from-blue-50 via-blue-100 to-white',
        accentGradient: 'from-blue-600 to-blue-400',
        text: 'text-blue-800',
        lightText: 'text-blue-700',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        badgeBg: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-50'
      },
      {
        gradient: 'from-emerald-50 via-emerald-100 to-white',
        accentGradient: 'from-emerald-600 to-emerald-400',
        text: 'text-emerald-800',
        lightText: 'text-emerald-700',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        badgeBg: 'bg-emerald-50',
        hoverBg: 'hover:bg-emerald-50'
      },
      {
        gradient: 'from-amber-50 via-amber-100 to-white',
        accentGradient: 'from-amber-600 to-amber-400',
        text: 'text-amber-800',
        lightText: 'text-amber-700',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        badgeBg: 'bg-amber-50',
        hoverBg: 'hover:bg-amber-50'
      },
      {
        gradient: 'from-rose-50 via-rose-100 to-white',
        accentGradient: 'from-rose-600 to-rose-400',
        text: 'text-rose-800',
        lightText: 'text-rose-700',
        border: 'border-rose-200',
        iconBg: 'bg-rose-100',
        badgeBg: 'bg-rose-50',
        hoverBg: 'hover:bg-rose-50'
      },
      {
        gradient: 'from-indigo-50 via-indigo-100 to-white',
        accentGradient: 'from-indigo-600 to-indigo-400',
        text: 'text-indigo-800',
        lightText: 'text-indigo-700',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        badgeBg: 'bg-indigo-50',
        hoverBg: 'hover:bg-indigo-50'
      },
    ];
    
    // Use modulo to cycle through colors
    return colors[index % colors.length];
  };
  
  // Position-specific icons instead of generic folders
  const getPositionIcon = (position: Position) => {
    const title = position.title.toLowerCase();
    
    if (title.includes('engineer') || title.includes('developer')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>; // Code icon
    }
    if (title.includes('data') || title.includes('scientist') || title.includes('analyst')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>; // Chart icon
    }
    if (title.includes('design') || title.includes('ux') || title.includes('ui')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>; // Smile icon
    }
    if (title.includes('product') || title.includes('manager')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1 0 7.75"/></svg>; // Users icon
    }
    if (title.includes('marketing') || title.includes('sales')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M5 3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M16 8.5 18 10l-7 8-5-5 1.5-1.5L11 15Z"/></svg>; // Check Square icon
    }
    // Default icon
    return <Briefcase className="h-5 w-5" />;
  };
  
  // Render the positions view (folders)
  const renderPositionsView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      );
    }
    
    if (positions.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <div className="rounded-full bg-gray-50 p-3 mx-auto w-fit">
            <Briefcase className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-xl font-medium text-gray-900 mt-4">
            No positions found
          </div>
          <p className="text-gray-500 mt-2">
            Upload and process some resumes to start seeing position matches.
          </p>
        </div>
      );
    }
    
    // Get filtered positions based on search query
    const filteredPositions = getFilteredPositions();
    
    // Show empty state if no matching positions after filtering
    if (filteredPositions.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <div className="rounded-full bg-gray-50 p-3 mx-auto w-fit">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-xl font-medium text-gray-900 mt-4">
            No positions found
          </div>
          <p className="text-gray-500 mt-2">
            No positions match your search. Try different keywords.
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPositions.map((position, index) => (
          <Card 
            key={position.id} 
            className={cn(
              "cursor-pointer overflow-hidden border transition-all hover:shadow-lg relative",
              position.candidate_count > 0 ? "opacity-100" : "opacity-85"
            )}
            onClick={() => handleViewPosition(position)}
          >
            {/* Position color scheme */}
            {position.candidate_count > 0 && (
              <div className={cn(
                "absolute top-0 left-0 h-1 w-full bg-gradient-to-r",
                getPositionColor(position, index).accentGradient
              )} />
            )}
            
            <div className={cn(
              "h-full flex flex-col bg-gradient-to-br",
              getPositionColor(position, index).gradient
            )}>
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-full p-2 flex items-center justify-center",
                    getPositionColor(position, index).iconBg
                  )}>
                    {getPositionIcon(position)}
                  </div>
                  <div>
                    <CardTitle className={cn(
                      "text-lg font-semibold",
                      getPositionColor(position, index).text
                    )}>
                      {position.title}
                    </CardTitle>
                    {position.candidate_count > 0 && (
                      <p className={cn(
                        "text-xs font-medium mt-1",
                        getPositionColor(position, index).lightText
                      )}>
                        {position.candidate_count} {position.candidate_count === 1 ? 'Candidate' : 'Candidates'}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "bg-white/80 backdrop-blur-sm",
                  position.candidate_count > 0 
                    ? getPositionColor(position, index).text
                    : "text-gray-500"
                )}>
                  {position.candidate_count > 0 ? "Active" : "No Candidates"}
                </Badge>
              </CardHeader>
              
              <CardContent className="p-5 pt-0 h-full flex flex-col">
                <p className={cn(
                  "text-sm mb-4 flex-1 leading-relaxed",
                  position.candidate_count > 0
                    ? "text-gray-700"
                    : "text-gray-500"
                )}>
                  {position.description}
                </p>
                
                <div className="text-xs space-y-3">
                  {position.key_skills.length > 0 && (
                    <div>
                      <p className={cn(
                        "font-medium mb-2",
                        getPositionColor(position, index).text
                      )}>
                        Key Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {position.key_skills.slice(0, 5).map((skill, i) => (
                          <span 
                            key={i} 
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium", 
                              getPositionColor(position, index).badgeBg,
                              getPositionColor(position, index).text
                            )}
                          >
                            {skill}
                          </span>
                        ))}
                        {position.key_skills.length > 5 && (
                          <span className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            "bg-gray-100 text-gray-700"
                          )}>
                            +{position.key_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <Button 
                    variant={position.candidate_count > 0 ? "default" : "outline"}
                    size="sm" 
                    className={cn(
                      position.candidate_count > 0
                        ? "bg-gradient-to-r shadow-sm"
                        : "",
                      getPositionColor(position, index).accentGradient,
                      position.candidate_count > 0 ? "text-white" : getPositionColor(position, index).text
                    )}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the card's onClick from also firing
                      handleViewPosition(position);
                    }}
                  >
                    {position.candidate_count > 0 
                      ? <>
                          View Candidates <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      : <>
                          View Position
                        </>
                    }
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render candidates for a selected position
  const renderCandidatesView = () => {
    if (!activePosition) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => {
              setActivePosition(null);
              setViewMode('positions');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Positions
          </Button>
          <h2 className="text-xl font-medium">{activePosition.title}</h2>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-2",
              getPositionColor(activePosition, 0).badgeBg,
              getPositionColor(activePosition, 0).text
            )}
          >
            {filteredCandidates.length} {filteredCandidates.length === 1 ? 'Candidate' : 'Candidates'}
          </Badge>
        </div>
        
        <Tabs defaultValue="candidates" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Requirements
            </TabsTrigger>
          </TabsList>
          
          {/* Candidates Tab */}
          <TabsContent value="candidates">
            {filteredCandidates.length > 0 ? (
              <CandidateTable 
                title={`Candidates for ${activePosition.title}`}
                candidates={filteredCandidates}
                onViewCandidate={handleViewCandidate}
              />
            ) : (
              <Card className="mt-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-gray-50 p-6 mb-4">
                    <Briefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No candidates found for {activePosition.title}
                  </h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    There are currently no candidates matching this position. Upload new resumes to find potential matches or check back later.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Requirements Tab */}
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-lens-purple" />
                  Requirements
                </CardTitle>
                <CardDescription>
                  Define the requirements candidates must meet for this position
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {loadingRequirements ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lens-purple"></div>
                    <span className="ml-3 text-gray-600">Loading requirements...</span>
                  </div>
                ) : (
                  <>
                    {/* Common skills section */}
                    <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-600">Common Skills</h3>
                        <Badge variant="secondary" className="bg-lens-purple/10 text-lens-purple border-0 text-xs">
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
                    
                    {/* Add requirement form */}
                    <div className="flex gap-3">
                      <div className="w-1/4">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Requirement Type
                        </label>
                        <div className="relative">
                          <select
                            className="w-full h-10 bg-white border border-input pl-3 pr-10 py-2 rounded-md text-sm font-medium shadow-sm focus:ring-2 focus:ring-lens-purple/40 focus:border-lens-purple transition-colors cursor-pointer"
                            value={newRequirementType}
                            onChange={(e) => setNewRequirementType(e.target.value as Requirement['type'])}
                          >
                            <option value="skill">Skill</option>
                            <option value="experience">Experience</option>
                            <option value="education">Education</option>
                            <option value="location">Location</option>
                            <option value="keyword">Keyword</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="h-4 w-4 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
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
                    
                    {/* Requirements list */}
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
                                <Badge className="capitalize bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">{requirement.type}</Badge>
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
                  </>
                )}
              </CardContent>
              
              <CardFooter>
                <div className="flex items-center text-sm text-gray-500">
                  <Tag className="h-4 w-4 mr-2 text-lens-purple" />
                  Requirements are automatically saved and used to match candidates with this position
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };
  
  // Updated renderCandidateDetails function to match the one in Candidates.tsx
  const renderCandidateDetails = () => {
    if (!activeCandidate) return null;

    // Access the parsed data which contains the complete CV information
    const parsed = activeCandidate.parsed || {};
    const candidateName = parsed.name || activeCandidate.name;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => {
              setActiveCandidate(null);
              setViewMode('candidates');
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
          <h2 className="text-xl font-medium">{candidateName}</h2>
          {activeCandidate.status && (
            <Badge 
              variant="outline" 
              className={cn(
                "ml-2",
                activeCandidate.status === 'bucket-a' ? "bg-green-50 text-green-700 border-green-200" :
                activeCandidate.status === 'bucket-b' ? "bg-blue-50 text-blue-700 border-blue-200" :
                activeCandidate.status === 'bucket-c' ? "bg-orange-50 text-orange-700 border-orange-200" :
                activeCandidate.status === 'bucket-d' ? "bg-red-50 text-red-700 border-red-200" :
                "bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {activeCandidate.status === 'bucket-a' ? "Excellent Match" :
               activeCandidate.status === 'bucket-b' ? "Good Match" :
               activeCandidate.status === 'bucket-c' ? "Potential Match" :
               activeCandidate.status === 'bucket-d' ? "Not Suitable" :
               "Unrated"}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Navigation Sidebar and Main Content */}
              <div className="grid grid-cols-12 gap-8">
                {/* Left sidebar navigation */}
                <div className="col-span-3 space-y-4 h-fit sticky top-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Navigation</h3>
                    <nav className="space-y-2">
                      <a href="#basic-info" className="block text-sm text-lens-purple font-medium hover:text-lens-purple transition-colors">Basic Information</a>
                      {parsed.skills?.length > 0 && (
                        <a href="#skills" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Skills & Expertise</a>
                      )}
                      {parsed.experience?.length > 0 && (
                        <a href="#experience" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Professional Experience</a>
                      )}
                      {parsed.education?.length > 0 && (
                        <a href="#education" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Education</a>
                      )}
                      {parsed.projects?.length > 0 && (
                        <a href="#projects" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Projects</a>
                      )}
                      {parsed.certifications?.length > 0 && (
                        <a href="#certifications" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Certifications</a>
                      )}
                      {parsed.languages?.length > 0 && (
                        <a href="#languages" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Languages</a>
                      )}
                      {parsed.awards?.length > 0 && (
                        <a href="#awards" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Awards</a>
                      )}
                      {parsed.publications?.length > 0 && (
                        <a href="#publications" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Publications</a>
                      )}
                      {parsed.volunteer?.length > 0 && (
                        <a href="#volunteer" className="block text-sm text-gray-600 hover:text-lens-purple transition-colors">Volunteer Experience</a>
                      )}
                    </nav>
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="col-span-9 space-y-8 divide-y divide-gray-100">
                  {/* Basic Info Section */}
                  <div id="basic-info" className="pt-8 first:pt-0">
                    <div className="text-center pb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{parsed.name || candidateName}</h2>
                      <div className="flex items-center justify-center gap-4 text-gray-600">
                        {parsed.email && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{parsed.email}</span>
                          </div>
                        )}
                        {parsed.phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{parsed.phone}</span>
                          </div>
                        )}
                        {parsed.role && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{parsed.role}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills Section */}
                  {parsed.skills && parsed.skills.length > 0 && (
                    <div id="skills" className="pt-6">
                      <div className="bg-gradient-to-r from-lens-purple/5 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Skills & Expertise
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {parsed.skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-white border border-lens-purple/20 text-lens-purple hover:bg-lens-purple/5 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Experience Section */}
                  {parsed.experience && parsed.experience.length > 0 && (
                    <div id="experience" className="pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Professional Experience
                        </h3>
                        <div className="space-y-4">
                          {parsed.experience.map((job, index) => (
                            <div key={index} className="border-l-2 border-lens-purple/30 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{job.title || job.position || job}</h4>
                                {job.dates && <span className="text-sm text-gray-500">{job.dates}</span>}
                              </div>
                              {job.company && <div className="text-xs text-gray-700 mb-1">{job.company}</div>}
                              {job.description && <div className="text-xs text-gray-600">{job.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Education Section */}
                  {parsed.education && parsed.education.length > 0 && (
                    <div id="education" className="pt-6">
                      <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Education
                        </h3>
                        <div className="space-y-4">
                          {parsed.education.map((edu, index) => (
                            <div key={index} className="border-l-2 border-blue-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{edu.degree || edu}</h4>
                                {edu.dates && <span className="text-sm text-gray-500">{edu.dates}</span>}
                              </div>
                              {edu.institution && <div className="text-xs text-gray-700 mb-1">{edu.institution}</div>}
                              {edu.description && <div className="text-xs text-gray-600">{edu.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Projects Section */}
                  {parsed.projects && parsed.projects.length > 0 && (
                    <div id="projects" className="pt-6">
                      <div className="bg-gradient-to-r from-green-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Projects
                        </h3>
                        <div className="space-y-4">
                          {parsed.projects.map((project, index) => (
                            <div key={index} className="border-l-2 border-green-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{project.name || project}</h4>
                              {project.description && (
                                <div className="text-sm text-gray-600 mt-1">{project.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Certifications Section */}
                  {parsed.certifications && parsed.certifications.length > 0 && (
                    <div id="certifications" className="pt-6">
                      <div className="bg-gradient-to-r from-amber-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-1.946 0.806 3.42 3.42 0 010 4.438 3.42 3.42 0 00.806 1.946 3.42 3.42 0 013.138-3.138 3.42 3.42 0 001.946.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946-.806 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Certifications
                        </h3>
                        <div className="space-y-4">
                          {parsed.certifications.map((cert, index) => (
                            <div key={index} className="border-l-2 border-amber-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{cert.name || cert}</h4>
                              {cert.issuer && <div className="text-gray-700">{cert.issuer}</div>}
                              {cert.date && <div className="text-gray-500 text-sm">{cert.date}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Languages Section */}
                  {parsed.languages && parsed.languages.length > 0 && (
                    <div id="languages" className="pt-6">
                      <div className="bg-gradient-to-r from-cyan-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {parsed.languages.map((lang, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors"
                            >
                              {typeof lang === 'string' ? lang : `${lang.language}: ${lang.proficiency}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Awards Section */}
                  {parsed.awards && parsed.awards.length > 0 && (
                    <div id="awards" className="pt-6">
                      <div className="bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Awards & Achievements
                        </h3>
                        <div className="space-y-4">
                          {parsed.awards.map((award, index) => (
                            <div key={index} className="border-l-2 border-purple-300 pl-4 py-1">
                              <h4 className="text-sm font-medium text-gray-900">{award.title || award}</h4>
                              {award.issuer && <div className="text-gray-700">{award.issuer}</div>}
                              {award.date && <div className="text-gray-500 text-sm">{award.date}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Publications Section */}
                  {parsed.publications && parsed.publications.length > 0 && (
                    <div id="publications" className="pt-6">
                      <div className="bg-gradient-to-r from-cyan-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Publications
                        </h3>
                        <div className="space-y-4">
                          {parsed.publications.map((pub, index) => (
                            <div key={index} className="border-l-2 border-cyan-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{pub.title || pub}</h4>
                                {pub.date && <span className="text-sm text-gray-500">{pub.date}</span>}
                              </div>
                              {pub.publisher && <div className="text-xs text-gray-700 mb-1">{pub.publisher}</div>}
                              {pub.description && <div className="text-xs text-gray-600">{pub.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Volunteer Experience Section */}
                  {parsed.volunteer && parsed.volunteer.length > 0 && (
                    <div id="volunteer" className="pt-6">
                      <div className="bg-gradient-to-r from-indigo-50 to-transparent p-4 rounded-xl">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          Volunteer Experience
                        </h3>
                        <div className="space-y-4">
                          {parsed.volunteer.map((vol, index) => (
                            <div key={index} className="border-l-2 border-indigo-300 pl-4 py-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium text-gray-900">{vol.role || vol}</h4>
                                {vol.dates && <span className="text-sm text-gray-500">{vol.dates}</span>}
                              </div>
                              {vol.organization && <div className="text-xs text-gray-700 mb-1">{vol.organization}</div>}
                              {vol.description && <div className="text-xs text-gray-600">{vol.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* If no structured data is available, show raw text */}
                  {!parsed.skills && !parsed.experience && !parsed.education && 
                   !parsed.projects && !parsed.certifications && !parsed.languages && 
                   !parsed.awards && !parsed.publications && !parsed.volunteer && 
                   activeCandidate.cvFile?.raw_text && (
                    <div className="pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Text</h2>
                      <div className="border rounded-lg p-4 whitespace-pre-wrap font-mono text-sm">
                        {activeCandidate.cvFile.raw_text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      
      <div className="pl-64 pt-16">
        <main className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Positions</h1>
              <p className="text-gray-500">
                Browse candidates organized by their inferred job positions
              </p>
            </div>
            
            {/* Search box removed */}
          </div>
          
          {/* Display different views based on the current mode */}
          {viewMode === 'positions' && renderPositionsView()}
          {viewMode === 'candidates' && renderCandidatesView()}
          {viewMode === 'detail' && renderCandidateDetails()}
          
          {loading && (
            <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
              <LoadingAnimation />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Positions;
