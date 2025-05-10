import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpRight, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Candidate = {
  id: string;
  name: string;
  role: string;
  status: string;
  score: number;
  skills: string[];
  education: string;
  experience: string;
  avatar: string;
};

interface CandidateTableProps {
  title: string;
  candidates: Candidate[];
}

const CandidateTable: React.FC<CandidateTableProps> = ({
  title,
  candidates
}) => {
  // Function to render badge based on candidate status
  const renderStatusBadge = (status: string) => {
    let borderColor = '';
    let textColor = '';
    let label = '';
    let icon = null;
    
    switch(status) {
      case 'bucket-a':
        borderColor = 'border-green-200';
        textColor = 'text-green-700';
        label = 'A';
        icon = <CheckCircle className="h-3 w-3 mr-1 text-green-600" />;
        break;
      case 'bucket-b':
        borderColor = 'border-blue-200';
        textColor = 'text-blue-700';
        label = 'B';
        icon = <Clock className="h-3 w-3 mr-1 text-blue-600" />;
        break;
      case 'bucket-c':
        borderColor = 'border-orange-200';
        textColor = 'text-orange-700';
        label = 'C';
        icon = <AlertTriangle className="h-3 w-3 mr-1 text-orange-600" />;
        break;
      case 'bucket-d':
        borderColor = 'border-red-200';
        textColor = 'text-red-700';
        label = 'D';
        icon = <XCircle className="h-3 w-3 mr-1 text-red-600" />;
        break;
      default:
        borderColor = 'border-gray-200';
        textColor = 'text-gray-700';
        label = 'Unknown';
    }
    
    return (
      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center border bg-white', borderColor, textColor)}>
        {icon}{label}
      </span>
    );
  };
  
  // Function to get bucket name from status
  const getBucketName = (status: string) => {
    switch(status) {
      case 'bucket-a':
        return 'Excellent Match';
      case 'bucket-b':
        return 'Good Match';
      case 'bucket-c':
        return 'Potential Match';
      case 'bucket-d':
        return 'Not Suitable';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Button variant="ghost" size="sm" className="text-sm font-medium">
          View All <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Bucket</TableHead>
              <TableHead>Match Quality</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Education</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full overflow-hidden">
                      <img 
                        src={candidate.avatar} 
                        alt={candidate.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-gray-500">{candidate.role}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{renderStatusBadge(candidate.status)}</TableCell>
                <TableCell>
                  <span className="text-sm">{getBucketName(candidate.status)}</span>
                </TableCell>
                <TableCell>{candidate.experience}</TableCell>
                <TableCell>{candidate.education}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map((skill, i) => (
                      <span 
                        key={i}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 2 && (
                      <span className="text-xs text-gray-500">+{candidate.skills.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CandidateTable;
