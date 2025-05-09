import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Upload, FileText, Check, AlertTriangle, X, File, FolderPlus, ChevronLeft, Clock, Calendar, User, PlusCircle, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { supabase, getStoragePath, getPublicURL, STORAGE_BUCKET } from '@/lib/supabase';
import { runMigrations } from '@/lib/migrations';
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  documentsCount: number;
}

interface CVFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  projectId: string;
  uploadedAt: Date;
  storagePath?: string;
  storageUrl?: string;
  originalFile?: File;
  error?: string;
  parsed?: {
    name: string;
    email: string;
    phone: string;
    skills: string[];
    experience: string[];
    education: string[];
  };
}

const CVParser: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
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
            parsed: file.parsed_data
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
    
    initializeData();
  }, [user, toast]);
  
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
      
      if (error) throw error;
      
      // Get the public URL
      const storageUrl = getPublicURL(storagePath);
      
      // Update the file record in the database
      const { error: updateError } = await supabase
        .from('cv_files')
        .update({
          status: 'processing',
          progress: 100,
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
              progress: 100,
              storagePath,
              storageUrl
            } 
          : file
      ));
      
      // Process the file
      processUploadedFile(fileId);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Update the error status in the database
      supabase
        .from('cv_files')
        .update({
          status: 'failed',
          error: error.message || 'Failed to upload file'
        })
        .eq('id', fileId)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error('Error updating file status:', updateError);
          }
        });
      
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
    }
  };
  
  const processUploadedFile = async (fileId: string) => {
    // Simulate processing of uploaded file
    setTimeout(async () => {
      // Example parsed data (in a real app, this would come from an AI processing service)
      const parsedData = {
        name: 'Candidate Name',
        email: 'candidate@example.com',
                phone: '+233 20 123 4567',
                skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'UI/UX Design'],
                experience: [
                  'Senior Frontend Developer at TechCorp (2019-Present)',
                  'UI Developer at WebSolutions (2016-2019)'
                ],
                education: [
                  'BSc Computer Science, University of Ghana (2012-2016)'
                ]
      };
      
      try {
        // Update the database with parsed data
        const { error } = await supabase
          .from('cv_files')
          .update({
            status: 'completed',
            parsed_data: parsedData
          })
          .eq('id', fileId);
        
        if (error) throw error;
        
        // Update state
        setFiles(prev => {
          return prev.map(file => 
            file.id === fileId ? { 
              ...file, 
              status: 'completed' as const,
              parsed: parsedData
            } : file
          );
        });
      } catch (error) {
        console.error('Error updating parsed data:', error);
        
        // Mark as failed in the database
        supabase
          .from('cv_files')
          .update({
            status: 'failed',
            error: 'Failed to process file'
          })
          .eq('id', fileId);
        
        // Update state
        setFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { 
                ...file, 
                status: 'failed', 
                error: 'Failed to process file' 
              } 
            : file
        ));
      }
    }, 2000);
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
            <h2 className="text-xl font-medium">{file.name}</h2>
            {getFileStatusBadge(file.status)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {file.status === 'failed' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Error</h3>
                      <p>{file.error || 'Unknown error occurred'}</p>
                    </div>
                  )}
                  
                  {file.status === 'completed' && file.parsed && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Name</Label>
                          <p className="font-medium">{file.parsed.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Email</Label>
                          <p>{file.parsed.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Phone</Label>
                          <p>{file.parsed.phone}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500">Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.parsed.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-lens-purple/10 text-lens-purple">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500">Experience</Label>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {file.parsed.experience.map((exp, index) => (
                            <li key={index} className="text-sm">{exp}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-500">Education</Label>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {file.parsed.education.map((edu, index) => (
                            <li key={index} className="text-sm">{edu}</li>
                          ))}
                        </ul>
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
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">File Type</Label>
                    <p>{file.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Uploaded</Label>
                    <p>{formatDate(file.uploadedAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">{getFileStatusBadge(file.status)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                {file.storageUrl && (
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={() => window.open(file.storageUrl, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                    Download Original
                  </Button>
                )}
                {file.status === 'failed' && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 border-red-200 hover:border-red-300 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete File
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
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
              <h3 className="font-medium">{file.name}</h3>
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">CV Parser</h1>
              <p className="text-gray-600">Manage projects and parse CV documents</p>
            </div>
            
            {activeProject && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Active Project:</p>
                  <p className="text-lens-purple font-semibold">{activeProject.name}</p>
                </div>
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
              <Card>
                  <CardContent className="p-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-lens-purple"></div>
                      <span className="ml-3 text-gray-600">Loading projects...</span>
                    </div>
                  </CardContent>
                </Card>
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
