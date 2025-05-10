import React from 'react';
import { 
  Upload,
  FileText, 
  CheckCircle, 
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { motion } from "framer-motion";

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
      description: "Match candidates against job requirements using AI-powered scoring. Automatically sort applicants into A, B, C, and D buckets based on fit."
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
            Our platform helps recruiters save time, reduce bias, and find the best candidates efficiently.
          </p>
        </div>
        
        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover:translate-y-[-4px] transform transition-transform"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.1 * index,
                duration: 0.5,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="font-display text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Dashboard showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Dashboard image */}
          <div className="relative">
            <motion.div 
              className="relative z-10 rounded-xl shadow-md overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
              whileInView={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1
              }}
              viewport={{ once: true }}
            >
              <img 
                src="/assets/data-analyst-avatar-icon-poster-2.png" 
                alt="Data Analyst" 
                className="w-full h-auto"
              />
            </motion.div>
            
            {/* Decorative elements */}
            <motion.div 
              className="absolute -bottom-4 -right-4 w-32 h-32 bg-lens-purple/10 rounded-full z-0"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            ></motion.div>
            <motion.div 
              className="absolute -top-4 -left-4 w-32 h-32 bg-lens-blue/10 rounded-full z-0"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              viewport={{ once: true }}
            ></motion.div>
          </div>
          
          {/* Right side - Feature list */}
          <div className="space-y-8">
            <h2 className="font-display text-3xl font-bold text-gray-900">Powerful Tools for Modern Recruiters</h2>
            <p className="text-lg text-gray-600">
              Our intuitive dashboard gives you all the tools you need to streamline your recruitment process from start to finish.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-purple/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-lens-purple" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Candidate Buckets</h3>
                  <p className="text-gray-600">Organize candidates into buckets based on their match score, making it easy to prioritize your outreach.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-blue/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-lens-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">One-Click Requirements</h3>
                  <p className="text-gray-600">Create custom requirements for each role and instantly match your candidate pool against them.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-green/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-lens-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
                  <p className="text-gray-600">Get insights into your recruitment funnel with beautiful, actionable analytics that help you make better decisions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
