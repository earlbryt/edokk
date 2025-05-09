
import React from 'react';
import { 
  Upload,
  FileText, 
  CheckCircle, 
  BarChart3 
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Upload className="h-10 w-10 text-lens-purple" />,
      title: "Bulk CV Upload",
      description: "Upload hundreds of CVs in seconds via drag-and-drop, cloud link, or zip folder. Our system handles the processing so you can focus on decision making."
    },
    {
      icon: <FileText className="h-10 w-10 text-lens-blue" />,
      title: "Intelligent CV Parsing",
      description: "Our AI extracts key information from CVs including experience, education, skills, and certifications with industry-leading accuracy."
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-lens-green" />,
      title: "Smart Candidate Matching",
      description: "Match candidates against job requirements using AI-powered scoring. Automatically sort applicants into A, B, and C buckets based on fit."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-lens-orange" />,
      title: "Insightful Analytics",
      description: "Track your hiring pipeline with comprehensive analytics. Identify bottlenecks and optimize your recruitment process with data-driven insights."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Revolutionize Your Recruitment Process</h2>
          <p className="text-xl text-gray-600">
            Our platform helps recruiters in Ghana and beyond save time, reduce bias, and find the best candidates efficiently.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover-scale"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
