import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { motion } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  CalendarCheck, 
  PillIcon, 
  Users, 
  Stethoscope, 
  BrainCircuit, 
  LayoutDashboard,
  Shield,
  Clock,
  MessageSquare,
  Bell
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: <BrainCircuit className="h-10 w-10 text-lens-purple" />,
      title: "Your Health Assistant Powered by AI",
      description: "Our intuitive platform provides personalized healthcare solutions, integrating cutting-edge AI with trusted medical knowledge."
    },
    {
      icon: <FileText className="h-10 w-10 text-lens-blue" />,
      title: "Integrated Health Record",
      description: "All your health data in one place, securely stored and accessible to your care providers with your permission."
    },
    {
      icon: <CalendarCheck className="h-10 w-10 text-lens-green" />,
      title: "Smart Appointment Scheduling",
      description: "AI suggests optimal appointment times based on your schedule and specialist availability."
    },
    {
      icon: <PillIcon className="h-10 w-10 text-lens-orange" />,
      title: "Prescription Management",
      description: "Upload prescriptions for validation, receive medication reminders, and get automatic refill notifications."
    }
  ];

  const advancedFeatures = [
    {
      icon: <Stethoscope className="h-8 w-8 text-lens-purple" />,
      title: "Virtual Consultations",
      description: "Connect with healthcare professionals from the comfort of your home with secure video consultations for diagnoses, follow-ups, and specialist opinions."
    },
    {
      icon: <LayoutDashboard className="h-8 w-8 text-lens-blue" />,
      title: "Health Dashboard",
      description: "Access all your health metrics, upcoming appointments, and medication schedules in one comprehensive, easy-to-navigate dashboard."
    },
    {
      icon: <Shield className="h-8 w-8 text-lens-green" />,
      title: "Data Privacy Protection",
      description: "Your health data is encrypted and protected by industry-leading security protocols, ensuring your medical information remains private and secure."
    },
    {
      icon: <Heart className="h-8 w-8 text-lens-orange" />,
      title: "Personalized Health Plans",
      description: "Receive customized nutrition, exercise, and wellness recommendations based on your health profile, goals, and medical history."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-lens-purple" />,
      title: "AI Health Chatbots",
      description: "Get immediate answers to health questions from our specialized AI assistants for nutrition guidance, mental health support, and herbal medicine."
    },
    {
      icon: <Bell className="h-8 w-8 text-lens-blue" />,
      title: "Health Reminders",
      description: "Never miss important medications, appointments, or health check-ups with our intelligent reminder system tailored to your schedule."
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
              Advanced Healthcare<br />At Your Fingertips
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 text-white/90"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover how eDok's integrated platform combines AI innovation with trusted healthcare expertise for personalized medical care.
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
              Our platform makes healthcare accessible, personalized, and convenient for patients and providers alike.
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
              <h2 className="font-display text-4xl font-bold text-gray-900">AI-Powered Healthcare</h2>
              <p className="text-lg text-gray-600">
                eDok uses advanced AI to provide personalized health insights, recommendations, and support, complementing traditional medical care with cutting-edge technology.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-purple/10 flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-lens-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Contextual Understanding</h3>
                    <p className="text-gray-600">Our AI comprehends your health concerns in context, providing relevant information tailored to your specific medical profile.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-blue/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-lens-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Intelligent Health Monitoring</h3>
                    <p className="text-gray-600">Our system continuously analyzes your health data to identify patterns and alert you to potential concerns before they become serious.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-green/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-lens-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Evidence-Based Guidance</h3>
                    <p className="text-gray-600">Our AI combines the latest medical research with your personal health data to provide accurate, science-backed recommendations.</p>
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
                  alt="AI-Powered Healthcare" 
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
              Enhance your healthcare experience with these specialized tools and services.
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
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">Ready to Take Control of Your Health?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join thousands of patients who have experienced more convenient, personalized, and effective healthcare with eDok.
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
