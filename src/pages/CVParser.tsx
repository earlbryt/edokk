import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Upload, FileText, Check, AlertTriangle, X, File, FolderPlus, ChevronLeft, Clock, Calendar, User, PlusCircle, Download, Eye, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getStoragePath, getPublicURL, STORAGE_BUCKET } from '@/lib/supabase';
import { processDocumentInBrowser } from '@/lib/browserDocumentProcessor';
import { runMigrations } from '@/lib/migrations';
import LoadingAnimation from '@/components/ui/loading-animation';
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { CVFile } from '@/types/CVFile';
import { addToProcessingQueue } from '@/lib/documentProcessor';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  documentsCount: number;
}

const CVParser: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<CVFile[]>([]);
  const [activeTab, setActiveTab] = useState("projects");
  const [dragActive, setDragActive] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [innerActiveTab, setInnerActiveTab] = useState("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Run migrations and load user's projects on component mount
  useEffect(() => {
    const initializeData = async () => {
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
          setProjects(projectsData.map(project => ({
            id: project.id,
            name: project.name,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at),
            documentsCount: project.documents_count
          })));
        }
        
        // Load files for all projects
        const { data: filesData, error: filesError } = await supabase
          .from('cv_files')
          .select('*')
          .eq('user_id', user.id);
        
        if (filesError) throw filesError;
        
        if (filesData) {
          setFiles(filesData.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            status: file.status as 'uploading' | 'processing' | 'completed' | 'failed',
            progress: file.progress,
            projectId: file.project_id,
            uploadedAt: new Date(file.uploaded_at),
            storagePath: file.storage_path,
            storageUrl: file.storage_url,
            error: file.error,
            parsed: file.parsed_data as {
              name?: string;
              email?: string;
              phone?: string;
              skills: string[];
              experience: string[];
              education: string[];
            }
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          description: 'There was a problem loading your projects and files.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
    initializeData();

      // Subscribe to changes in the cv_files table
      const subscription = supabase
        .channel('cv_files_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cv_files',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Received real-time update:', payload);
            
            // Handle different types of changes
            if (payload.eventType === 'UPDATE') {
              setFiles(prevFiles => 
                prevFiles.map(file => 
                  file.id === payload.new.id
                    ? {
                        ...file,
                        status: payload.new.status,
                        progress: payload.new.progress,
                        error: payload.new.error,
                        parsed: {
                          name: payload.new.parsed_data?.name,
                          email: payload.new.parsed_data?.email,
                          phone: payload.new.parsed_data?.phone,
                          skills: payload.new.parsed_data?.skills || [],
                          experience: payload.new.parsed_data?.experience || [],
                          education: payload.new.parsed_data?.education || [],
                          projects: payload.new.parsed_data?.projects || [],
                          awards: payload.new.parsed_data?.awards || [],
                          certifications: payload.new.parsed_data?.certifications || [],
                          languages: payload.new.parsed_data?.languages || [],
                          publications: payload.new.parsed_data?.publications || [],
                          volunteer: payload.new.parsed_data?.volunteer || []
                        }
                      }
                    : file
                )
              );
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please provide a name for your project",
        variant: "destructive",
      });
      return;
    }
    
    // Debug authentication
    console.log("Current user:", user);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }
    
    // Generate a unique ID for the project
    const projectId = `project-${Date.now()}`;
    
    const newProject: Project = {
      id: projectId,
      name: newProjectName,
      createdAt: new Date(),
      updatedAt: new Date(),
      documentsCount: 0
    };
    
    try {
      // Debug Supabase insert
      console.log("Inserting project with user_id:", user.id);
      
      // Insert project into Supabase
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          name: newProjectName,
          user_id: user.id,
          created_at: newProject.createdAt.toISOString(),
          updated_at: newProject.updatedAt.toISOString(),
          documents_count: 0
        })
        .select();
      
      console.log("Insert response:", { data, error });
      
      if (error) throw error;
      
      // Automatically create a filter group for this project
      const filterGroupId = `filtergroup-${Date.now()}`;
      const { error: filterGroupError } = await supabase
        .from('filter_groups')
        .insert({
          id: filterGroupId,
          name: newProjectName, // Use the same name as the project
          project_id: projectId,
          user_id: user.id,
          enabled: true
        });
      
      if (filterGroupError) {
        console.error('Error creating filter group:', filterGroupError);
        // Continue anyway since the project was created successfully
      } else {
        console.log('Filter group created successfully');
      }
      
      // Update local state
      setProjects(prev => [newProject, ...prev]);
      setActiveProject(newProject);
      setNewProjectName('');
      
      toast({
        title: "Project created",
        description: `Project "${newProject.name}" has been created successfully`,
      });

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: "There was a problem creating your project. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleFiles = (fileList: File[]) => {
    if (!activeProject) {
      toast({
        title: "No active project",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      return;
    }
    
    console.log('User uploading files:', user);
    console.log('Storage bucket being used:', STORAGE_BUCKET);
    
    const newFiles: CVFile[] = fileList.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      status: 'uploading',
      progress: 0,
      projectId: activeProject.id,
      uploadedAt: new Date(),
      originalFile: file
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Update project with new document count
    const updatedProjects = projects.map(project => 
      project.id === activeProject.id 
        ? { 
            ...project, 
            documentsCount: project.documentsCount + newFiles.length, 
            updatedAt: new Date() 
          }
        : project
    );
    setProjects(updatedProjects);
    setActiveProject({ 
      ...activeProject, 
      documentsCount: activeProject.documentsCount + newFiles.length, 
      updatedAt: new Date() 
    });
    
    // Update project documents count in Supabase
    supabase
      .from('projects')
      .update({ 
        documents_count: activeProject.documentsCount + newFiles.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeProject.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating project document count:', error);
        }
      });
    
    // Upload each file to Supabase storage
    try {
      newFiles.forEach(fileData => {
        uploadFileToStorage(fileData);
      });
      
      toast({
        title: "Files added",
        description: `${newFiles.length} file(s) added to project "${activeProject.name}"`,
      });
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Upload error",
        description: "There was an error uploading the files. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const uploadFileToStorage = async (fileData: CVFile) => {
    if (!fileData.originalFile || !user) {
      setFiles(prev => prev.map(file => 
        file.id === fileData.id 
          ? { ...file, status: 'failed', error: 'Missing file data or user not authenticated' } 
          : file
      ));
      return;
    }
    
    const file = fileData.originalFile;
    const fileId = fileData.id;
    const storagePath = getStoragePath(fileId, file.name);
    
    try {
      // Insert a database record first
      const { error: dbError } = await supabase
        .from('cv_files')
        .insert({
          id: fileId,
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          status: 'uploading',
          progress: 0,
          project_id: fileData.projectId,
          user_id: user.id,
          uploaded_at: fileData.uploadedAt.toISOString()
        });
      
      if (dbError) throw dbError;
      
      // Update local state to show uploading
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, status: 'uploading', progress: 10 } 
          : file
      ));
      
      console.log(`Uploading file to ${STORAGE_BUCKET} bucket, path: ${storagePath}`);
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      // Get the public URL
      const storageUrl = getPublicURL(storagePath);
      
      // Update the file record in the database
      const { error: updateError } = await supabase
        .from('cv_files')
        .update({
          status: 'processing',
          progress: 30,
          storage_path: storagePath,
          storage_url: storageUrl
        })
        .eq('id', fileId);
      
      if (updateError) throw updateError;
      
      // Update the file record in state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              status: 'processing', 
              progress: 30,
              storagePath,
              storageUrl
            } 
          : file
      ));
      
      // Add the file to the processing queue
      addToProcessingQueue(fileId);
      
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Update the error status in the database
      await supabase
        .from('cv_files')
        .update({
          status: 'failed',
          error: error.message || 'Failed to upload file'
        })
        .eq('id', fileId);
      
      // Update state
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { 
              ...file, 
              status: 'failed', 
              error: error.message || 'Failed to upload file' 
            } 
          : file
      ));
      
      // Show error toast
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload file',
        variant: "destructive"
      });
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getActiveFile = () => {
    return files.find(file => file.id === activeFileId) || null;
  };
  
  const getFileStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Uploading</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return null;
    }
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };
  
  const getProjectFiles = () => {
    if (!activeProject) return [];
    return files.filter(file => file.projectId === activeProject.id);
  };
  
  const filteredProjectFiles = () => {
    const projectFiles = getProjectFiles();
    
    switch (innerActiveTab) {
      case 'all':
        return projectFiles;
      case 'completed':
        return projectFiles.filter(file => file.status === 'completed');
      case 'processing':
        return projectFiles.filter(file => file.status === 'uploading' || file.status === 'processing');
      case 'failed':
        return projectFiles.filter(file => file.status === 'failed');
      default:
        return projectFiles;
    }
  };
  
  const renderProjectView = () => {
    if (!activeProject) return null;
    
    if (viewMode === 'detail' && activeFileId) {
      const file = getActiveFile();
      if (!file) return null;
      
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setViewMode('list')}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Files
            </Button>
            <h2 className="text-xl font-medium">{removeFileExtension(file.name)}</h2>
            {getFileStatusBadge(file.status)}
          </div>
          
          <Card className="md:col-span-3">
            <CardContent className="p-8">
                  {file.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                      <h3 className="font-medium mb-1">Error</h3>
                      <p>{file.error || 'Unknown error occurred'}</p>
                    </div>
                  )}
                  
                  {file.status === 'completed' && file.parsed && (
                <div className="space-y-8">
                  {/* Navigation Sidebar */}
                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-3 space-y-4 h-fit sticky top-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Navigation</h3>
                        <nav className="space-y-2">
                          <a 
                            href="#basic-info" 
                            className={`block text-sm hover:text-lens-purple transition-colors ${
                              activeSection === 'basic-info' ? 'text-lens-purple font-medium' : 'text-gray-600'
                            }`}
                          >
                            Basic Information
                          </a>
                          {file.parsed.skills?.length > 0 && (
                            <a 
                              href="#skills" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'skills' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Skills & Expertise
                            </a>
                          )}
                          {file.parsed.experience?.length > 0 && (
                            <a 
                              href="#experience" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'experience' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Professional Experience
                            </a>
                          )}
                          {file.parsed.education?.length > 0 && (
                            <a 
                              href="#education" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'education' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Education
                            </a>
                          )}
                          {file.parsed.projects?.length > 0 && (
                            <a 
                              href="#projects" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'projects' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Projects
                            </a>
                          )}
                          {file.parsed.awards?.length > 0 && (
                            <a 
                              href="#awards" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'awards' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Awards
                            </a>
                          )}
                          {file.parsed.certifications?.length > 0 && (
                            <a 
                              href="#certifications" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'certifications' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Certifications
                            </a>
                          )}
                          {file.parsed.languages?.length > 0 && (
                            <a 
                              href="#languages" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'languages' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Languages
                            </a>
                          )}
                          {file.parsed.publications?.length > 0 && (
                            <a 
                              href="#publications" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'publications' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Publications
                            </a>
                          )}
                          {file.parsed.volunteer?.length > 0 && (
                            <a 
                              href="#volunteer" 
                              className={`block text-sm hover:text-lens-purple transition-colors ${
                                activeSection === 'volunteer' ? 'text-lens-purple font-medium' : 'text-gray-600'
                              }`}
                            >
                              Volunteer Experience
                            </a>
                          )}
                        </nav>
                        </div>
                        </div>

                    {/* Main Content */}
                    <div className="col-span-9 space-y-8 divide-y divide-gray-100">
                      {/* Basic Info Section */}
                      <div 
                        id="basic-info" 
                        className="pt-8 first:pt-0"
                        ref={(el) => {
                          if (el) {
                            const observer = new IntersectionObserver(
                              ([entry]) => {
                                if (entry.isIntersecting) {
                                  setActiveSection('basic-info');
                                }
                              },
                              { threshold: 0.5 }
                            );
                            observer.observe(el);
                          }
                        }}
                      >
                        <div className="text-center pb-8">
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{file.parsed.name}</h2>
                          <div className="flex items-center justify-center gap-4 text-gray-600">
                            {file.parsed.email && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{file.parsed.email}</span>
                              </div>
                            )}
                            {file.parsed.phone && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{file.parsed.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Skills Section */}
                      {file.parsed.skills && file.parsed.skills.length > 0 && (
                        <div 
                          id="skills" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('skills');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="bg-gradient-to-r from-lens-purple/5 to-transparent p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Skills & Expertise
                            </h3>
                            <div className="flex flex-wrap gap-2">
                          {file.parsed.skills.map((skill, index) => (
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

                      {/* Rest of the sections with id attributes and pt-8 class */}
                      {/* Experience Section */}
                      {file.parsed.experience && file.parsed.experience.length > 0 && (
                        <div 
                          id="experience" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('experience');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Professional Experience
                            </h3>
                            <div className="space-y-4">
                          {file.parsed.experience.map((exp, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-lens-purple/20 transition-colors">
                                  <p className="text-gray-700">{exp}</p>
                                </div>
                          ))}
                      </div>
                          </div>
                        </div>
                      )}

                      {/* Education Section */}
                      {file.parsed.education && file.parsed.education.length > 0 && (
                        <div 
                          id="education" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('education');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                              Education
                            </h3>
                            <div className="space-y-4">
                          {file.parsed.education.map((edu, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-lens-purple/20 transition-colors">
                                  <p className="text-gray-700">{edu}</p>
                                </div>
                          ))}
                            </div>
                      </div>
                    </div>
                  )}
                  
                      {/* Projects Section */}
                      {file.parsed.projects && file.parsed.projects.length > 0 && (
                        <div 
                          id="projects" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('projects');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                              Notable Projects
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                              {file.parsed.projects.map((project, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-lens-purple/20 transition-colors">
                                  <p className="text-gray-700">{project}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                    </div>
                  )}

                      {/* Awards Section */}
                      {file.parsed.awards && file.parsed.awards.length > 0 && (
                        <div 
                          id="awards" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('awards');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              Awards & Achievements
                            </h3>
                            <div className="space-y-2">
                              {file.parsed.awards.map((award, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-lens-purple/10">
                                  <p className="text-gray-700">{award}</p>
                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Certifications Section */}
                      {file.parsed.certifications && file.parsed.certifications.length > 0 && (
                        <div 
                          id="certifications" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('certifications');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              Certifications
                            </h3>
                            <div className="space-y-2">
                              {file.parsed.certifications.map((cert, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-lens-purple/10">
                                  <p className="text-gray-700">{cert}</p>
                  </div>
                              ))}
                  </div>
                  </div>
                </div>
                      )}

                      {/* Languages Section */}
                      {file.parsed.languages && file.parsed.languages.length > 0 && (
                        <div 
                          id="languages" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('languages');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              Languages
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {file.parsed.languages.map((language, index) => (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="bg-white border border-lens-purple/20 text-lens-purple hover:bg-lens-purple/5 transition-colors"
                                >
                                  {language}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Publications Section */}
                      {file.parsed.publications && file.parsed.publications.length > 0 && (
                        <div 
                          id="publications" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('publications');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              Publications
                            </h3>
                            <div className="space-y-4">
                              {file.parsed.publications.map((pub, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-lens-purple/20 transition-colors">
                                  <p className="text-gray-700">{pub}</p>
          </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Volunteer Experience Section */}
                      {file.parsed.volunteer && file.parsed.volunteer.length > 0 && (
                        <div 
                          id="volunteer" 
                          className="pt-8"
                          ref={(el) => {
                            if (el) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  if (entry.isIntersecting) {
                                    setActiveSection('volunteer');
                                  }
                                },
                                { threshold: 0.5 }
                              );
                              observer.observe(el);
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-lens-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              Volunteer Experience
                            </h3>
                            <div className="space-y-4">
                              {file.parsed.volunteer.map((vol, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-lens-purple/20 transition-colors">
                                  <p className="text-gray-700">{vol}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {(file.status === 'uploading' || file.status === 'processing') && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lens-purple mb-4"></div>
                  <p className="text-gray-600">
                    {file.status === 'uploading' ? 'Uploading document...' : 'Processing document...'}
                  </p>
                  {file.progress !== undefined && (
                    <Progress value={file.progress} className="w-64 mt-4" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">{activeProject.name}</h2>
            <p className="text-gray-500 text-sm">
              Created on {formatDate(activeProject.createdAt)} • {activeProject.documentsCount} documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setActiveProject(null)}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Projects
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => goToFilters(activeProject.id)}
            >
              <Filter className="h-4 w-4" />
              Requirements
            </Button>
            {innerActiveTab === 'all' && (
              <div 
                className={`border-2 border-dashed rounded-lg px-4 py-2 text-center flex items-center gap-2 cursor-pointer ${
                  dragActive ? 'border-lens-purple bg-lens-purple/5' : 'border-gray-300'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('project-file-upload')?.click()}
              >
                <PlusCircle className="h-4 w-4 text-lens-purple" />
                <span className="text-sm">Add Files</span>
                <input
                  id="project-file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Manage all documents in this project
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="all" value={innerActiveTab} onValueChange={setInnerActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="processing" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Processing
                  {getProjectFiles().filter(file => file.status === 'uploading' || file.status === 'processing').length > 0 && (
                    <Badge className="ml-1 bg-yellow-500 hover:bg-yellow-500">
                      {getProjectFiles().filter(file => file.status === 'uploading' || file.status === 'processing').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Completed
                  {getProjectFiles().filter(file => file.status === 'completed').length > 0 && (
                    <Badge className="ml-1 bg-green-500 hover:bg-green-500">
                      {getProjectFiles().filter(file => file.status === 'completed').length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="failed" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Failed
                  {getProjectFiles().filter(file => file.status === 'failed').length > 0 && (
                    <Badge className="ml-1 bg-red-500 hover:bg-red-500">
                      {getProjectFiles().filter(file => file.status === 'failed').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="m-0">
                {renderFilesList(filteredProjectFiles())}
              </TabsContent>
              <TabsContent value="processing" className="m-0">
                {renderFilesList(filteredProjectFiles())}
              </TabsContent>
              <TabsContent value="completed" className="m-0">
                {renderFilesList(filteredProjectFiles())}
              </TabsContent>
              <TabsContent value="failed" className="m-0">
                {renderFilesList(filteredProjectFiles())}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderFilesList = (filesList: CVFile[]) => {
    if (filesList.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="mt-1 text-gray-500">
            {innerActiveTab === 'all' 
              ? 'Upload documents to get started' 
              : `No ${innerActiveTab} documents in this project`}
          </p>
          {innerActiveTab === 'all' && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById('project-file-upload')?.click()}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Documents
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {filesList.map(file => (
          <div 
            key={file.id} 
            className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-lens-purple transition-colors"
            onClick={() => {
              setActiveFileId(file.id);
              setViewMode('detail');
            }}
          >
            <div className={`mr-4 p-2 rounded-lg
              ${file.status === 'completed' ? 'bg-green-100' : ''}
              ${file.status === 'processing' || file.status === 'uploading' ? 'bg-yellow-100' : ''}
              ${file.status === 'failed' ? 'bg-red-100' : ''}
            `}>
              {file.status === 'completed' && <File className="h-6 w-6 text-green-600" />}
              {(file.status === 'processing' || file.status === 'uploading') && <Clock className="h-6 w-6 text-yellow-600" />}
              {file.status === 'failed' && <AlertTriangle className="h-6 w-6 text-red-600" />}
            </div>
            
            <div className="flex-1 mr-4">
              <h3 className="font-medium">{removeFileExtension(file.name)}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{formatDate(file.uploadedAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getFileStatusBadge(file.status)}
              
              {file.status === 'uploading' && (
                <Progress value={file.progress} className="w-16" />
              )}
              
              <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => {
                e.stopPropagation();
                setActiveFileId(file.id);
                setViewMode('detail');
              }}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add a function to navigate to filters page for a specific project
  const goToFilters = (projectId: string) => {
    navigate(`/dashboard/filters?project=${projectId}`);
  };

  // Add this function near your other utility functions
  const removeFileExtension = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Resume Upload</h1>
              <p className="text-gray-600">Manage projects and upload candidate resumes</p>
            </div>
            
            {activeProject && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Active Project:</p>
                  <p className="text-lens-purple font-semibold">{activeProject.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => goToFilters(activeProject.id)}
                >
                  <Filter className="h-4 w-4" />
                  Requirements
                </Button>
              </div>
            )}
          </div>
          
          {activeProject && viewMode ? (
            renderProjectView()
          ) : (
            <div>
              <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Projects
              </h2>
              
              {isLoading ? (
                <LoadingAnimation message="Loading your projects..." />
              
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                <CardHeader>
                      <CardTitle>Your Projects</CardTitle>
                </CardHeader>
                <CardContent>
                      {projects.length === 0 ? (
                        <div className="text-center py-10 border border-dashed rounded-lg">
                          <p className="text-gray-500 mb-4">No projects created yet</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button>Create Your First Project</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                              </DialogHeader>
                              <DialogDescription>
                                Create a new project to organize your CV documents.
                              </DialogDescription>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="project-name">Project Name</Label>
                                  <Input 
                                    id="project-name" 
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g., Software Engineer Recruitment" 
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={handleCreateProject}>Create Project</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {projects.map((project) => (
                            <div 
                              key={project.id} 
                              className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-lens-purple transition-colors ${
                                activeProject?.id === project.id ? 'border-lens-purple bg-lens-purple/5' : ''
                              }`}
                              onClick={() => {
                                setActiveProject(project);
                                setViewMode('list');
                              }}
                            >
                              <div className="mr-4 bg-lens-purple/10 p-3 rounded-lg">
                                <FolderPlus className="h-6 w-6 text-lens-purple" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">{project.name}</h3>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>Created: {formatDate(project.createdAt)}</span>
                                  <span>{project.documentsCount} Documents</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center gap-1 text-gray-600 hover:text-lens-purple"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToFilters(project.id);
                                  }}
                                >
                                  <Filter className="h-4 w-4" />
                                  Filters
                                </Button>
                              
                                {activeProject?.id === project.id && (
                                  <div 
                                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer ${
                      dragActive ? 'border-lens-purple bg-lens-purple/5' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      document.getElementById('file-upload')?.click();
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Upload className="h-4 w-4 text-lens-purple" />
                                      <span className="text-sm">Upload CVs</span>
                    </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                                  </div>
                                )}
                              </div>
                    </div>
                          ))}
                  </div>
                      )}
                    </CardContent>
                  </Card>
                  
              <Card>
                <CardHeader>
                      <CardTitle>Create New Project</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="new-project-name">Project Name</Label>
                          <Input 
                            id="new-project-name" 
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., Software Engineer Recruitment" 
                          />
                        </div>
                        <Button onClick={handleCreateProject} className="w-full">
                          Create Project
                        </Button>
                              </div>
                              
                      {activeProject && (
                        <div className="mt-6">
                          <h3 className="font-medium text-lg mb-4">Upload CVs to Project</h3>
                          <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center ${
                              dragActive ? 'border-lens-purple bg-lens-purple/5' : 'border-gray-300'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="mb-2 flex justify-center">
                              <div className="h-10 w-10 bg-lens-purple/10 rounded-full flex items-center justify-center">
                                <Upload className="h-5 w-5 text-lens-purple" />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Drag and drop CVs here or
                            </p>
                            <Button
                              size="sm"
                              onClick={() => document.getElementById('file-upload-sidebar')?.click()}
                              className="bg-lens-purple hover:bg-lens-purple/90"
                            >
                              Browse Files
                            </Button>
                            <input
                              id="file-upload-sidebar"
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <p className="text-xs text-gray-500 mt-3">
                              Supports PDF, DOCX, DOC formats (Max 10MB per file)
                            </p>
                          </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CVParser;
