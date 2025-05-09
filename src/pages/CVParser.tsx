
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Upload, FileText, Check, AlertTriangle, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface CVFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
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
  const [files, setFiles] = useState<CVFile[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [dragActive, setDragActive] = useState(false);
  
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
    const newFiles: CVFile[] = fileList.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      status: 'uploading',
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Simulate file upload and processing
    newFiles.forEach(file => {
      simulateFileUploadAndProcess(file.id);
    });
    
    toast({
      title: "Files added",
      description: `${newFiles.length} file(s) added for processing`,
    });
    
    setActiveTab("processing");
  };
  
  const simulateFileUploadAndProcess = (fileId: string) => {
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 10;
      
      if (progress <= 100) {
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, progress } : file
        ));
      }
      
      if (progress === 100) {
        clearInterval(uploadInterval);
        
        setFiles(prev => prev.map(file => 
          file.id === fileId ? { ...file, status: 'processing' } : file
        ));
        
        // Simulate processing
        setTimeout(() => {
          const success = Math.random() > 0.2; // 80% success rate for demo
          
          if (success) {
            setFiles(prev => prev.map(file => 
              file.id === fileId ? { 
                ...file, 
                status: 'completed',
                parsed: {
                  name: 'John Smith',
                  email: 'john.smith@example.com',
                  phone: '+233 20 123 4567',
                  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'UI/UX Design'],
                  experience: [
                    'Senior Frontend Developer at TechCorp (2019-Present)',
                    'UI Developer at WebSolutions (2016-2019)'
                  ],
                  education: [
                    'BSc Computer Science, University of Ghana (2012-2016)'
                  ]
                }
              } : file
            ));
          } else {
            setFiles(prev => prev.map(file => 
              file.id === fileId ? { ...file, status: 'failed' } : file
            ));
          }
        }, 2000);
      }
    }, 300);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const filteredFiles = {
    processing: files.filter(file => file.status === 'uploading' || file.status === 'processing'),
    completed: files.filter(file => file.status === 'completed'),
    failed: files.filter(file => file.status === 'failed')
  };
  
  const getFileCountByStatus = (status: 'uploading' | 'processing' | 'completed' | 'failed'): number => {
    return files.filter(file => file.status === status).length;
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
              <p className="text-gray-600">Upload CVs to automatically extract relevant information</p>
            </div>
          </div>
          
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload CVs
              </TabsTrigger>
              <TabsTrigger value="processing" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Processing
                {filteredFiles.processing.length > 0 && (
                  <span className="ml-1 bg-lens-purple text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {filteredFiles.processing.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Completed
                {filteredFiles.completed.length > 0 && (
                  <span className="ml-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {filteredFiles.completed.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failed
                {filteredFiles.failed.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {filteredFiles.failed.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload CVs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-10 text-center ${
                      dragActive ? 'border-lens-purple bg-lens-purple/5' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="mb-4 flex justify-center">
                      <div className="h-12 w-12 bg-lens-purple/10 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-lens-purple" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Drag and drop CVs here</h3>
                    <p className="text-gray-600 mb-4">
                      Supports PDF, DOCX, DOC formats (Max 10MB per file)
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="bg-lens-purple hover:bg-lens-purple/90"
                      >
                        Browse Files
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button variant="outline">
                        Import from Cloud
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-4">Upload Tips</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">Structured Format</h4>
                      <p className="text-sm text-gray-600">
                        For best results, use structured CV templates with clear sections.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">File Types</h4>
                      <p className="text-sm text-gray-600">
                        PDF files provide the best parsing accuracy compared to DOC/DOCX.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">Batch Processing</h4>
                      <p className="text-sm text-gray-600">
                        Upload multiple files at once to save time during bulk recruitment.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="processing">
              <Card>
                <CardHeader>
                  <CardTitle>Processing CVs</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFiles.processing.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No files are currently processing</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFiles.processing.map(file => (
                        <div key={file.id} className="flex items-center p-3 border rounded-lg">
                          <div className="mr-3 bg-gray-100 p-2 rounded">
                            <FileText className="h-8 w-8 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{file.name}</h4>
                              <span className="text-xs text-gray-500">{file.size}</span>
                            </div>
                            <div className="mt-1">
                              <Progress value={file.progress} className="h-2" />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">
                                {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                              </span>
                              <span className="text-xs">{file.progress}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed CVs</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFiles.completed.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No completed files yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredFiles.completed.map(file => (
                        <div key={file.id} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center p-4 bg-gray-50 border-b">
                            <div className="mr-3 bg-green-100 p-2 rounded">
                              <File className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{file.name}</h4>
                              <span className="text-xs text-gray-500">{file.size}</span>
                            </div>
                            <div>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Completed
                              </span>
                            </div>
                          </div>
                          {file.parsed && (
                            <div className="p-4">
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="text-xs text-gray-500">Name</label>
                                  <p className="font-medium">{file.parsed.name}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Email</label>
                                  <p>{file.parsed.email}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Phone</label>
                                  <p>{file.parsed.phone}</p>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <label className="text-xs text-gray-500">Skills</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {file.parsed.skills.map((skill, index) => (
                                    <span 
                                      key={index} 
                                      className="bg-lens-purple/10 text-lens-purple text-xs px-2 py-1 rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <label className="text-xs text-gray-500">Experience</label>
                                <ul className="list-disc list-inside mt-1">
                                  {file.parsed.experience.map((exp, index) => (
                                    <li key={index} className="text-sm">{exp}</li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <label className="text-xs text-gray-500">Education</label>
                                <ul className="list-disc list-inside mt-1">
                                  {file.parsed.education.map((edu, index) => (
                                    <li key={index} className="text-sm">{edu}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="failed">
              <Card>
                <CardHeader>
                  <CardTitle>Failed CVs</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFiles.failed.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No failed files</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredFiles.failed.map(file => (
                        <div key={file.id} className="flex items-center p-3 border rounded-lg bg-red-50">
                          <div className="mr-3 bg-red-100 p-2 rounded">
                            <X className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{file.name}</h4>
                              <span className="text-xs text-gray-500">{file.size}</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Failed to parse document. File may be damaged or in an unsupported format.
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-2">
                            Retry
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default CVParser;
