
import React from 'react';
import Sidebar from '@/components/Dashboard/Sidebar';
import TopBar from '@/components/Dashboard/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const CVParser: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Document Analysis</h1>
            <p className="text-gray-600">Analyze medical documents and reports</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Document Parser
                </h3>
                <p className="text-gray-500 mb-4">
                  This section will be used to analyze and parse medical documents,
                  lab reports, and patient records for better healthcare insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default CVParser;
