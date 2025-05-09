import React, { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Upload, Download, FileText, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { processDocument } from '@/lib/documentProcessor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZuZGFidmxhZWJmZXhoaG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0OTIxOTYsImV4cCI6MjAzMTA2ODE5Nn0.Vw6eeXMG7wbZ9q2SUqR-36XnYCFaEYeYWKdm94f5w-o';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DocumentFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  summary?: string;
  content?: string; // Original text content
  error?: string;
  needsProcessing?: boolean; // Flag to indicate file needs processing
}

const DocumentTest: React.FC = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'summary' | 'full-text'>('summary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Track files that need processing
  const processingQueue = useRef<string[]>([]);
  
  // Get authentication token on component mount
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAuthToken(session.access_token);
        } else {
          console.log("No active session found, using anonymous access");
        }
      } catch (error) {
        console.error("Error getting auth session:", error);
      }
    };
    
    getAuthToken();
  }, []);
  
  // Debug current progress in case of UI not updating
  useEffect(() => {
    console.log("Files state updated:", files);
    
    // Check if any files need processing
    const filesToProcess = files.filter(file => file.needsProcessing);
    
    if (filesToProcess.length > 0) {
      console.log("Files needing processing:", filesToProcess);
      
      // Process one file at a time to avoid race conditions
      const fileToProcess = filesToProcess[0];
      processingQueue.current = [
        ...processingQueue.current, 
        ...filesToProcess.slice(1).map(f => f.id)
      ];
      
      // Remove the needsProcessing flag from all files
      setFiles(prev => prev.map(file => ({
        ...file,
        needsProcessing: file.id === fileToProcess.id ? false : file.needsProcessing 
      })));
      
      // Process the first file
      processFile(fileToProcess);
    }
  }, [files]);
  
  // Process the next file in queue when processing is complete
  useEffect(() => {
    // If we're not processing and there are files in the queue, process the next one
    if (!isProcessing && processingQueue.current.length > 0) {
      const nextFileId = processingQueue.current[0];
      processingQueue.current = processingQueue.current.slice(1);
      
      const fileToProcess = files.find(f => f.id === nextFileId);
      if (fileToProcess) {
        processFile(fileToProcess);
      }
    }
  }, [isProcessing, files]);
  
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
  
  const handleFiles = (fileList: File[]) => {
    console.log("handleFiles called with:", fileList);
    
    // Helper function to determine actual file type based on extension and reported type
    const getFileType = (file: File): string => {
      // Get extension from filename
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      // Check the reported MIME type and extension
      console.log(`File ${file.name} has type: ${file.type}, extension: ${extension}`);
      
      if (file.type === 'application/pdf' || extension === 'pdf') {
        return 'application/pdf';
      } else if (
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === 'doc' || 
        extension === 'docx'
      ) {
        return extension === 'docx' 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/msword';
      }
      
      // Return the original type if we don't have a specific match
      return file.type;
    };
    
    // Validate file types (only PDF, DOC, DOCX)
    const validFiles = fileList.filter(file => {
      const fileType = getFileType(file);
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validTypes.includes(fileType);
    });
    
    console.log("Valid files:", validFiles);
    
    if (validFiles.length !== fileList.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, DOC, and DOCX files are supported",
        variant: "destructive",
      });
      
      if (validFiles.length === 0) {
        return;
      }
    }
    
    // Create file objects for UI
    const newFiles = validFiles.map(file => {
      // Get consistent file type for processing
      const fileType = getFileType(file);
      
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: fileType, // Use our determined type, not file.type
        status: 'uploading' as const,
        progress: 0,
        needsProcessing: true // Mark for processing
      };
    });
    
    console.log("Created file objects:", newFiles);
    
    // Add files to state - processing will be triggered by useEffect
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      console.log("Updated files state:", updated);
      return updated;
    });
    
    toast({
      title: "Files added",
      description: `${validFiles.length} file(s) added for processing`,
    });
  };
  
  // Process a single file
  const processFile = async (fileData: DocumentFile) => {
    console.log(`Processing file: ${fileData.name} with ID: ${fileData.id}`);
    
    try {
      setIsProcessing(true);
      
      // Find file index again to ensure it's current
      const fileIndex = files.findIndex(f => f.id === fileData.id);
      if (fileIndex === -1) {
        console.error(`File not found in state: ${fileData.id}`);
        setIsProcessing(false);
        return;
      }
      
      // Update status to processing
      const updateProgress = (progress: number) => {
        console.log(`Progress update for ${fileData.name}: ${progress}%`);
        
        setFiles(prev => {
          const newFiles = [...prev];
          const currentIndex = newFiles.findIndex(f => f.id === fileData.id);
          
          if (currentIndex !== -1) {
            newFiles[currentIndex] = { 
              ...newFiles[currentIndex], 
              status: 'processing',
              progress 
            };
          }
          
          return newFiles;
        });
      };
      
      // Start processing
      updateProgress(10);
      console.log("Starting document processing with Edge Function...");
      
      // Process document with our utility, and track progress
      const { text, summary } = await processDocument(
        fileData.file,
        updateProgress,
        authToken || undefined
      );
      
      console.log("Document processing completed:", {
        textLength: text?.length,
        summaryLength: summary?.length
      });
      
      // Update status to completed
      setFiles(prev => {
        const newFiles = [...prev];
        const currentIndex = newFiles.findIndex(f => f.id === fileData.id);
        
        if (currentIndex !== -1) {
          newFiles[currentIndex] = { 
            ...newFiles[currentIndex], 
            status: 'completed',
            progress: 100,
            content: text,
            summary: summary
          };
        }
        
        return newFiles;
      });
      
      toast({
        title: "Processing completed",
        description: `${fileData.name} has been successfully processed`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      
      // Update file status to failed
      setFiles(prev => {
        const newFiles = [...prev];
        const currentIndex = newFiles.findIndex(f => f.id === fileData.id);
        
        if (currentIndex !== -1) {
          newFiles[currentIndex] = { 
            ...newFiles[currentIndex], 
            status: 'failed',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
          };
        }
        
        return newFiles;
      });
      
      toast({
        title: "Processing failed",
        description: `Failed to process ${fileData.name}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Download text or summary as a text file
  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    
    toast({
      title: "File removed",
      description: "The file has been removed from the list",
    });
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  
  const filteredFiles = () => {
    switch (activeTab) {
      case 'completed':
        return files.filter(file => file.status === 'completed');
      case 'processing':
        return files.filter(file => file.status === 'uploading' || file.status === 'processing');
      case 'failed':
        return files.filter(file => file.status === 'failed');
      default:
        return files;
    }
  };
  
  const renderFilesList = () => {
    const filesList = filteredFiles();
    
    if (filesList.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium">No documents found</h3>
          <p className="mt-1 text-gray-500">
            {activeTab === 'all' 
              ? 'Upload documents to get started' 
              : `No ${activeTab} documents`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filesList.map(file => (
          <Card key={file.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <CardTitle className="text-base">{file.name}</CardTitle>
                    <CardDescription>{file.size} • {file.type}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFileStatusBadge(file.status)}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {(file.status === 'uploading' || file.status === 'processing') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{file.status === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                    <span>{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                </div>
              )}
              
              {file.status === 'failed' && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{file.error || 'An unknown error occurred'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {file.status === 'completed' && (
                <div>
                  <div className="flex justify-between mb-3">
                    <h3 className="text-sm font-medium">
                      {viewMode === 'summary' ? 'Document Summary' : 'Document Text'}
                    </h3>
                    <div className="flex gap-2">
                      <div className="flex border rounded-md overflow-hidden">
                        <Button 
                          variant={viewMode === 'summary' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 rounded-none px-2"
                          onClick={() => setViewMode('summary')}
                        >
                          Summary
                        </Button>
                        <Button
                          variant={viewMode === 'full-text' ? 'default' : 'ghost'}
                          size="sm"
                          className="h-7 rounded-none px-2"
                          onClick={() => setViewMode('full-text')}
                        >
                          Full Text
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => {
                          const content = viewMode === 'summary' ? file.summary : file.content;
                          const filename = `${file.name.split('.')[0]}_${viewMode === 'summary' ? 'summary' : 'text'}.txt`;
                          downloadTextFile(content || '', filename);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-gray-50 p-4 max-h-80 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-sm">
                      {viewMode === 'summary' 
                        ? file.summary 
                        : file.content}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Document Test</h1>
              <p className="text-gray-600">Test document processing and summarization with Groq</p>
            </div>
          </div>
          
          <div className="grid gap-6">
            {/* Browser Limitation Alert */}
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Browser-based document extraction has limitations. Text extraction may be incomplete,
                especially for complex documents. For production use, consider a server-side approach.
              </AlertDescription>
            </Alert>
            
            {/* Processing Status Information */}
            {isProcessing && (
              <Alert variant="warning">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Document processing in progress. This may take a few moments depending on the file size and complexity.
                  Please be patient - the process might appear to be stuck at 0%, but it is working in the background.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload documents to test the summarization feature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-gray-200'
                  } ${isProcessing ? 'opacity-50' : ''}`}
                  onDragEnter={isProcessing ? undefined : handleDragEnter}
                  onDragOver={isProcessing ? undefined : handleDragEnter}
                  onDragLeave={isProcessing ? undefined : handleDragLeave}
                  onDrop={isProcessing ? undefined : handleDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                      {isProcessing ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      ) : (
                        <Upload className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {isProcessing ? "Processing Documents..." : "Drag & Drop Files"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isProcessing 
                          ? "Please wait while we extract and analyze your documents" 
                          : "or click to browse files (PDF, DOC, DOCX)"}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Best results with simple, text-based documents</p>
                        <p>Complex documents with tables, images or special formatting may have limited extraction</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      disabled={isProcessing}
                    />
                    <label htmlFor="file-upload">
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        disabled={isProcessing}
                        asChild
                      >
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Documents List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid grid-cols-4 h-8 w-full sm:w-auto">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
                      <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {files.length} document{files.length !== 1 ? 's' : ''} uploaded for processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderFilesList()}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentTest; 