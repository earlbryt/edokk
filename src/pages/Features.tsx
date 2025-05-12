import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Zap, 
  BrainCircuit, 
  LayoutDashboard,
  Shield,
  GanttChart,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Features: React.FC = () => {
  const mainFeatures = [
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

  const advancedFeatures = [
    {
      icon: <BrainCircuit className="h-8 w-8 text-lens-purple" />,
      title: "AI-Driven Screening",
      description: "Our AI helps you identify the most qualified candidates by analyzing skills, experience, and cultural fit from resumes and cover letters."
    },
    {
      icon: <LayoutDashboard className="h-8 w-8 text-lens-blue" />,
      title: "Unified Dashboard",
      description: "All your recruitment activities in one place. Track candidates, manage pipelines, and collaborate with team members seamlessly."
    },
    {
      icon: <Shield className="h-8 w-8 text-lens-green" />,
      title: "Data Privacy Compliance",
      description: "GDPR and CCPA compliant. We ensure candidate data is handled securely and in accordance with all relevant regulations."
    },
    {
      icon: <GanttChart className="h-8 w-8 text-lens-orange" />,
      title: "Project Management",
      description: "Organize candidates by recruitment project, set timelines, and track progress from initial application to final hiring decision."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-lens-purple" />,
      title: "Team Collaboration",
      description: "Share candidates, leave comments, and tag team members to collaborate efficiently on hiring decisions."
    },
    {
      icon: <Clock className="h-8 w-8 text-lens-blue" />,
      title: "Time-Saving Automation",
      description: "Automated candidate sorting, email notifications, and status updates to reduce manual work and speed up your recruitment process."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-lens-purple/90 to-blue-600/90 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              className="font-display text-5xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Powerful Features for<br />Modern Recruiters
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-white/90"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover how Lens can transform your recruitment process with AI-powered tools designed for efficiency and accuracy.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Main Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Core Features</h2>
            <p className="text-xl text-gray-600">
              Our platform helps recruiters save time, reduce bias, and find the best candidates efficiently.
            </p>
          </div>
          
          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {mainFeatures.map((feature, index) => (
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
        </div>
      </section>
      
      {/* AI Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl font-bold text-gray-900">AI-Powered Recruitment</h2>
              <p className="text-lg text-gray-600">
                Lens uses advanced AI algorithms to understand the content of resumes and match candidates to your specific requirements with unprecedented accuracy.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-purple/10 flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-lens-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Semantic Understanding</h3>
                    <p className="text-gray-600">Our AI doesn't just look for keywords - it understands the meaning behind candidate experience and skills.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-blue/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-lens-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Automatic Categorization</h3>
                    <p className="text-gray-600">Candidates are automatically sorted into A, B, C, and D categories based on their match to your requirements.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-green/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-lens-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Bias Reduction</h3>
                    <p className="text-gray-600">Our AI is designed to focus on skills and qualifications, helping to reduce unconscious bias in the screening process.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right side - Image */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="relative z-10 rounded-xl shadow-xl overflow-hidden">
                <img 
                  src="/assets/ai-recruitment.jpg" 
                  alt="AI-Powered Recruitment" 
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80";
                  }}
                />
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-lens-purple/20 rounded-full z-0"></div>
              <div className="absolute -top-6 -left-6 w-40 h-40 bg-lens-blue/20 rounded-full z-0"></div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Advanced Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Advanced Features</h2>
            <p className="text-xl text-gray-600">
              Take your recruitment process to the next level with these powerful tools.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1 * (index % 3),
                  duration: 0.5,
                  ease: "easeOut"
                }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-lens-blue/90 to-lens-purple/90 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join forward-thinking recruiting agencies and HR departments who have already cut their screening time by 80%.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-white text-white bg-lens-purple/20 hover:bg-lens-purple/30">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Features;
