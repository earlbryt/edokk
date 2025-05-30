import React from 'react';
import { 
  Calendar,
  Pill, 
  Apple, 
  Brain,
  Flower2,
  Stethoscope
} from 'lucide-react';
import { motion } from "framer-motion";

const Features: React.FC = () => {
  const features = [
    {
      icon: <Calendar className="h-10 w-10 text-lens-purple" />,
      title: "Consultation Booking",
      description: "Book appointments with healthcare professionals through our AI-optimized scheduling system. Get reminders and join virtual consultations with ease."
    },
    {
      icon: <Pill className="h-10 w-10 text-lens-blue" />,
      title: "E-Pharmacy",
      description: "Upload prescriptions for instant validation, check drug interactions, and order medications with secure delivery tracking and automatic refill options."
    },
    {
      icon: <Brain className="h-10 w-10 text-lens-orange" />,
      title: "Mental Health Support",
      description: "Track your emotional wellbeing, access guided assessments, and connect with therapists. Includes emergency protocols and personalized coping strategies."
    },
    {
      icon: <Flower2 className="h-10 w-10 text-emerald-500" />,
      title: "Herbal Medicine",
      description: "Explore evidence-based herbal treatments with our comprehensive database. Check herb-drug interactions and receive proper usage guidance from traditional knowledge."
    }
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold mb-6 text-gray-900">Comprehensive Healthcare at Your Fingertips</h2>
          <p className="text-xl text-gray-600">
            eDok integrates conventional and alternative medicine in one platform, providing holistic care for your complete wellbeing.
          </p>
        </div>
        
        {/* Feature grid - adjusted for 4 cards */}
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
                alt="eDok Health Platform" 
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
            <h2 className="font-display text-3xl font-bold text-gray-900">Your Health Assistant Powered by AI</h2>
            <p className="text-lg text-gray-600">
              Our intuitive platform provides personalized healthcare solutions, integrating cutting-edge AI with trusted medical knowledge.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-purple/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-lens-purple" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Integrated Health Record</h3>
                  <p className="text-gray-600">All your health data in one place, securely stored and accessible to your care providers with your permission.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-blue/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-lens-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Appointment Scheduling</h3>
                  <p className="text-gray-600">AI suggests optimal appointment times based on your schedule and specialist availability.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-lens-green/10 flex items-center justify-center">
                  <Pill className="h-6 w-6 text-lens-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Prescription Management</h3>
                  <p className="text-gray-600">Upload prescriptions for validation, receive medication reminders, and get automatic refill notifications.</p>
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
