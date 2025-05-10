
export interface CVFile {
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
    name?: string;
    email?: string;
    phone?: string;
    skills: string[];
    experience: string[];
    education: string[];
  };
}
