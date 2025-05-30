import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Brain, BookOpen, Moon, Phone, ClipboardCheck, X } from 'lucide-react'; // Added X icon
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence } from "framer-motion"; // Added AnimatePresence
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Re-added Dialog imports for assessment
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from '@supabase/supabase-js';

// Types for assessments
type Assessment = {
  id: string;
  title: string;
  description: string;
  type: string;
};

type AssessmentQuestion = {
  id: string;
  assessment_id: string;
  question_text: string;
  question_order: number;
  response_type: string;
  response_options: ResponseOption[];
};

type ResponseOption = {
  value: number;
  label: string;
};

type UserResponses = Record<number, number>; // question_order -> selected value

// Define message types
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

// Initial messages to demonstrate the chatbot functionality
const initialMessages: Message[] = []; // Removed placeholder messages

// Quick suggestions for the chatbot
const quickSuggestions = [
  "I'm feeling anxious",
  "Help with stress",
  "Sleep issues"
];

// Mental health resources
const resources = [
  {
    title: "Mindfulness Exercises",
    description: "Guided meditation and breathing exercises to reduce stress",
    icon: <Brain className="h-5 w-5 text-lens-purple" />,
    url: "#mindfulness"
  },
  {
    title: "Stress Management",
    description: "Techniques and strategies to cope with daily stress",
    icon: <BookOpen className="h-5 w-5 text-lens-purple" />,
    url: "#stress"
  },
  {
    title: "Sleep Hygiene",
    description: "Tips for improving your sleep quality and duration",
    icon: <Moon className="h-5 w-5 text-lens-purple" />,
    url: "#sleep"
  },
  {
    title: "Crisis Support",
    description: "Emergency contacts and professional help options",
    icon: <Phone className="h-5 w-5 text-lens-purple" />,
    url: "#crisis"
  }
];

// Mental health assessments
const assessments = [
  {
    title: "Anxiety Screening",
    description: "Quick assessment to understand your anxiety levels",
    questions: 7,
    timeInMinutes: 5
  },
  {
    title: "Stress Level Test",
    description: "Evaluate your current stress levels and identify stressors",
    questions: 10,
    timeInMinutes: 8
  },
  {
    title: "Mood Tracker",
    description: "Track your mood patterns over time for better self-awareness",
    questions: 5,
    timeInMinutes: 3
  },
  {
    title: "Sleep Quality Assessment",
    description: "Assess your sleep quality and identify improvement areas",
    questions: 8,
    timeInMinutes: 6
  }
];

// Tips categories
const tipCategories = [
  {
    title: "Self-Care Basics",
    tips: [
      "Prioritize 7-9 hours of sleep each night",
      "Stay hydrated throughout your day",
      "Incorporate 30 minutes of movement daily",
      "Practice deep breathing when feeling overwhelmed"
    ]
  },
  {
    title: "Emotional Regulation",
    tips: [
      "Name your emotions to tame them",
      "Try the 5-4-3-2-1 grounding technique for anxiety",
      "Write down intrusive thoughts to gain perspective",
      "Practice self-compassion through positive self-talk"
    ]
  },
  {
    title: "Stress Management",
    tips: [
      "Break large tasks into smaller, manageable steps",
      "Set boundaries with work and digital technology",
      "Schedule regular short breaks during your day",
      "Try progressive muscle relaxation before bed"
    ]
  }
];

const MentalHealth: React.FC = () => {
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use auth context consistently
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // State for assessment flow
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'questions' | 'processing' | 'results'>('select');
  const [assessmentListLoading, setAssessmentListLoading] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<Record<number, number>>({});
  const [assessmentResult, setAssessmentResult] = useState<{ score: number; result_category: string; feedback: string; } | null>(null);
  const [responseLoading, setResponseLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Check for redirect from login page with assessment dialog flag or chat flag
  useEffect(() => {
    // Logic for chat history fetching (similar to HerbalMedicine.tsx)
    const fetchChatHistory = async () => {
      if (chatOpen && user && !messages.find(m => m.id === 'history-loaded')) { // Simple check to avoid re-fetching
        setIsTyping(true);
        try {
          const { data, error } = await supabase
            .from('chat_messages') // Assuming 'chat_messages' table from memory
            .select('id, content, role, created_at') // session_id might be relevant based on mental-health-chat edge function
            .eq('user_id', user.id)
            // .eq('session_id', user.active_session_id) // If session_id is actively managed and known on client
            .order('created_at', { ascending: true })
            .limit(50); // Fetch more history if needed

          if (error) {
            console.error('Error fetching mental health chat history:', error);
            setMessages(prev => [...prev, { id: 'history-error', content: 'Could not load chat history.', sender: 'assistant', timestamp: new Date() }]);
          } else if (data && data.length > 0) {
            const fetchedMessages: Message[] = data.map((msg: any) => ({
              id: msg.id.toString(),
              content: msg.content,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.created_at)
            }));
            setMessages([...fetchedMessages, {id: 'history-loaded', content: '', sender: 'assistant', timestamp: new Date()}]); // Mark history as loaded, removed initialMessages
          } else {
             setMessages([{id: 'history-loaded', content: '', sender: 'assistant', timestamp: new Date()}]); // History is empty, removed initialMessages
          }
        } catch (e) {
          console.error('Unexpected error fetching mental health chat history:', e);
          setMessages(prev => [...prev, { id: 'history-fetch-error', content: 'Error loading history.', sender: 'assistant', timestamp: new Date() }]);
        } finally {
          setIsTyping(false);
        }
      }
    };
    if (chatOpen && isAuthenticated) fetchChatHistory();
  }, [chatOpen, user, isAuthenticated, supabase]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openAssessment = params.get('openAssessment');
    const openChat = params.get('openChat');
    
    if (openAssessment === 'true') {
      setAssessmentDialogOpen(true);
      
      toast({
        title: "You're logged in!",
        description: "You can now take your mental health assessment.",
        duration: 5000
      });
      
      // Clean up the URL
      navigate('/mental-health', { replace: true });
    }
    
    if (openChat === 'true') {
      setChatOpen(true);
      
      toast({
        title: "You're logged in!",
        description: "You can now chat with our Serene Companion.",
        duration: 5000
      });
      
      // Clean up the URL
      navigate('/mental-health', { replace: true });
    }
    
    // Legacy support for session storage method
    const openAssessmentDialog = sessionStorage.getItem('openAssessmentDialog');
    if (openAssessmentDialog === 'true') {
      // Open the assessment dialog and clear the flag
      setAssessmentDialogOpen(true);
      sessionStorage.removeItem('openAssessmentDialog');
    }
  }, [navigate, toast]);
  
  // Fetch assessments when dialog opens
  useEffect(() => {
    if (assessmentDialogOpen && assessments.length === 0) {
      fetchAssessments();
    }
  }, [assessmentDialogOpen]);
  
  // Fetch assessments from Supabase
  const fetchAssessments = async () => {
    setAssessmentListLoading(true);
    try {
      const { data, error } = await supabase
        .from('mental_health_assessments')
        .select('*')
        .order('title');
        
      if (error) throw error;
      
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: 'Error',
        description: 'Could not load assessments. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setAssessmentListLoading(false);
    }
  };
  
  // Fetch questions for a selected assessment
  const fetchQuestions = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_order');
        
      if (error) throw error;
      
      setQuestions(data || []);
      setCurrentQuestionIndex(0);
      setUserResponses({});
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Could not load assessment questions. Please try again later.',
        variant: 'destructive'
      });
    }
  };
  
  // Handle assessment selection
  const handleAssessmentSelect = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    await fetchQuestions(assessment.id);
    setCurrentStep('questions');
  };
  
  // Handle user response to a question
  const handleResponseSelect = (questionOrder: number, value: number) => {
    setUserResponses(prev => ({
      ...prev,
      [questionOrder]: value
    }));
  };
  
  // Go to next question or submit if last question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };
  
  // Go to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Submit assessment for scoring
  const submitAssessment = async () => {
    if (!selectedAssessment) return;
    
    setResponseLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to save your assessment results.',
          variant: 'destructive'
        });
        setResponseLoading(false);
        return;
      }
      
      // Show an intermediate step while the LLM processes the assessment
      setCurrentStep('processing');
      
      // Call Edge Function to score the assessment
      const { data, error } = await supabase.functions.invoke('score-mental-health-assessment', {
        body: {
          user_id: user.id,
          assessment_id: selectedAssessment.id,
          responses: userResponses
        }
      });
      
      if (error) throw error;
      
      // Set results
      setAssessmentResult({
        score: data.score,
        result_category: data.result_category,
        feedback: data.feedback
      });
      
      // Move to results step
      setCurrentStep('results');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: 'Error',
        description: 'Could not process your assessment. Please try again later.',
        variant: 'destructive'
      });
      // Go back to questions if there's an error
      if (currentStep === 'processing') {
        setCurrentStep('questions');
      }
    } finally {
      setResponseLoading(false);
    }
  };
  
  // Reset assessment state
  const resetAssessment = () => {
    setCurrentStep('select');
    setSelectedAssessment(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserResponses({});
    setAssessmentResult(null);
  };
  
  // Handle start chat click - check auth or redirect to login
  const handleStartChat = () => {
    if (!isAuthenticated) {
      // User is not logged in, redirect to login page
      navigate(`/login?returnUrl=${encodeURIComponent('/mental-health')}&openChat=true`);
      return;
    }
    
    // User is logged in, open chat dialog
    setChatOpen(true);
  };

  // Check auth and open assessment dialog or redirect to login
  const handleTakeAssessment = () => {
    if (!isAuthenticated) {
      // User is not logged in, redirect to login page
      navigate(`/login?returnUrl=${encodeURIComponent('/mental-health')}&openAssessment=true`);
      return;
    }
    
    // User is logged in, open assessment dialog
    setAssessmentDialogOpen(true);
  };
  
  // Close assessment dialog and reset state
  const handleAssessmentDialogClose = () => {
    setAssessmentDialogOpen(false);
    resetAssessment();
  };
  
  // Track if a message is being sent to prevent multiple submissions
  const [isSending, setIsSending] = useState(false);

  // Handle sending a message - optimized version without sessions
  const handleSendMessage = async () => {
    // Don't allow sending if already processing a message or if input is empty
    if (isSending || inputValue.trim() === "") return;
    
    try {
      // Set sending state to true to prevent multiple submissions
      setIsSending(true);
      
      // Check authentication using context
      if (!isAuthenticated || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the chat feature.",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
      
      // Store message content before clearing input
      const messageContent = inputValue;
      
      // Create and display user message immediately for better UX
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        content: messageContent,
        sender: "user",
        timestamp: new Date()
      };
      
      // Clear input and show the message
      setInputValue("");
      setMessages(prev => [...prev, newUserMessage]);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Call edge function with user ID and message
      const { data, error } = await supabase.functions.invoke(
        'mental-health-chat', 
        {
          body: {
            user_id: user.id,
            message: messageContent
          }
        }
      );
      
      if (error) throw error;
      
      // Display AI response
      const newAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not process your message. Please try again later.",
        variant: "destructive"
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };
  
  // Handle quick suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    
    // Focus on input after selecting suggestion
    const inputElement = document.getElementById('message-input');
    if (inputElement) {
      inputElement.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mt-14 md:mt-8">
        {/* Hero Section */}
        <section className="py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl"
            >
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Mental Health Support
                <span className="block mt-2 text-lens-purple">When You Need It</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Your personal space for emotional wellbeing with AI-powered assistance, scientifically-backed assessments, and guided meditation inspired by Alan Watts' contemplative philosophy—all in a safe, judgment-free environment.
              </p>
              

              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-lens-purple text-lens-purple hover:bg-lens-purple/10"
                  onClick={handleTakeAssessment}
                >
                  <ClipboardCheck className="mr-2 h-5 w-5" />
                  Take Mental Health Screening
                </Button>
                <Button 
                  size="lg" 
                  className="bg-lens-purple hover:bg-lens-purple/90 text-white"
                  onClick={handleStartChat}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start Chatting
                </Button>
              </div>
            </motion.div>
            
            {/* Right side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              {/* Unique asymmetrical collage-style design */}
              <div className="relative z-10">
                {/* Zen-inspired background aura */}
                <motion.div 
                  className="absolute -top-8 -right-8 w-[120%] h-[120%] bg-gradient-to-bl from-indigo-300/30 via-amber-300/20 to-teal-400/30 -rotate-6 z-0 opacity-30 overflow-hidden"
                  style={{ clipPath: 'polygon(35% 0%, 100% 0%, 100% 35%, 65% 100%, 0% 100%, 0% 65%)' }}
                  animate={{ 
                    rotate: [-6, -3, -6]
                  }}
                  transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Contemplative container frame */}
                <div className="relative z-20 bg-gradient-to-tr from-indigo-50/60 to-amber-50/60 backdrop-blur-sm p-5 shadow-inner overflow-hidden" 
                     style={{ clipPath: 'polygon(5% 15%, 15% 5%, 100% 5%, 95% 85%, 85% 95%, 0% 95%)' }}>
                     <div className="absolute inset-0 bg-white/20 backdrop-filter backdrop-blur-md opacity-40"></div>
                  
                  {/* Image container with unique styling */}
                  <div className="relative transform -rotate-3">
                    {/* Meditation-inspired decorative elements */}
                    <div className="absolute inset-0 border-2 border-dashed border-indigo-300/20 transform rotate-3 scale-[1.03]"></div>
                    <div className="absolute inset-0 border-1 border-amber-200/30 transform -rotate-1 scale-[1.01]"></div>
                    
                    {/* Image with subtle zen overlay effects */}
                    <div className="relative overflow-hidden transform rotate-2">
                      <img 
                        src="/assets/mental-health.png" 
                        alt="Mental Health Support" 
                        className="relative z-10 w-full h-auto"
                      />
                      
                      {/* Spiritual journey gradient overlays */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 via-transparent to-amber-300/15 mix-blend-overlay"></div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-teal-400/5 to-transparent mix-blend-color"></div>
                      
                      {/* Sacred geometry inspired subtle lines */}
                      <svg className="absolute top-0 left-0 w-full h-full z-20 opacity-20 mix-blend-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <circle cx="50" cy="50" r="30" stroke="#a5b4fc" strokeWidth="0.3" fill="none" />
                        <circle cx="50" cy="50" r="45" stroke="#bae6fd" strokeWidth="0.2" fill="none" />
                        <path d="M50,20 L50,80" stroke="#fde68a" strokeWidth="0.3" fill="none" />
                        <path d="M20,50 L80,50" stroke="#a5f3fc" strokeWidth="0.3" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Zen-inspired floating elements */}
                <motion.div 
                  className="absolute bottom-0 right-10 w-20 h-20 bg-amber-300/20 z-10 rounded-full overflow-hidden"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.3, 0.2]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div 
                  className="absolute top-6 left-4 w-16 h-16 bg-indigo-400/10 rounded-full z-10 mix-blend-soft-light"
                  animate={{ 
                    scale: [1, 1.08, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div 
                  className="absolute top-1/2 right-2 w-12 h-12 bg-teal-400/15 rounded-full z-10 mix-blend-multiply"
                  animate={{ 
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Mindfulness symbols */}
                <motion.div 
                  className="absolute bottom-3 right-10 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-50 to-white p-3.5 shadow-md z-30 rounded-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 50 }}
                  whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                >
                  <Brain className="h-9 w-9 text-indigo-400" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-10 left-2 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-50 to-white p-3 shadow-md z-30 rounded-full"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 50 }}
                  whileHover={{ y: 3, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                >
                  <Moon className="h-8 w-8 text-amber-400" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mt-12 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-gray-900">Our <span className="text-lens-purple">Mental Health</span> Features</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Discover the tools we've designed to support your emotional wellbeing and mental clarity.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Chatbot */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover:translate-y-[-4px] transform transition-transform"
            >
              <div className="mb-5">
                <MessageSquare className="h-10 w-10 text-lens-purple" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Serene Companion Chatbot</h3>
              <p className="text-gray-600">Our AI-powered chatbot provides personalized emotional support, coping strategies, and mindfulness exercises whenever you need someone to talk to.</p>
            </motion.div>
            
            {/* Feature 2: Assessment */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover:translate-y-[-4px] transform transition-transform"
            >
              <div className="mb-5">
                <ClipboardCheck className="h-10 w-10 text-lens-purple" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Mental Health Assessment</h3>
              <p className="text-gray-600">Assess your emotional balance, stress levels, sleep quality, and thought patterns through clinically-informed screenings. Each assessment provides personalized insights and practical recommendations aligned with both modern psychology and ancient wisdom traditions.</p>
            </motion.div>
            
            {/* Feature 3: Meditation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 hover:translate-y-[-4px] transform transition-transform"
            >
              <div className="mb-5">
                <Moon className="h-10 w-10 text-lens-purple" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Guided Meditation</h3>
              <p className="text-gray-600">Access a library of calming meditations inspired by Alan Watts to help you achieve inner peace, reduce anxiety, and improve your overall mental clarity.</p>
            </motion.div>
          </div>
          
          <div className="mt-12 bg-lens-purple/5 p-8 rounded-xl shadow-sm border border-lens-purple/20">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-gray-700 italic mb-4">"The mind is like water. When it's turbulent, it's difficult to see. When it's calm, everything becomes clear."</p>
              <p className="text-lens-purple font-medium">— Inspired by Alan Watts</p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Chat Dialog */}
      <AnimatePresence>
        {chatOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          {/* Chat Panel */}
          <motion.div
            initial={{ y: "100%", borderRadius: '24px 24px 0 0' }} // Changed from x to y
            animate={{ y: 0, borderRadius: '24px 24px 0 0' }}      // Changed from x to y
            exit={{ y: "100%" }}        // Changed from x to y
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 top-0 left-0 right-0 mx-auto z-50 bg-white overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)] will-change-transform flex flex-col h-full w-full md:w-3/5 lg:w-1/2 max-w-2xl"
          >
            {/* Drag Handle */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 pb-2 touch-none z-10">
              <div className="w-10 h-1 rounded-full bg-gray-300/80"></div>
            </div>
            {/* New Header - iOS-style frosted glass */}
            <motion.div
              className="pt-8 pb-4 px-4 sm:px-6 backdrop-blur-md bg-white/80 border-b border-gray-200/50 sticky top-0 z-[5]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-lens-purple to-indigo-600 shadow-sm">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">Serene Companion</h3>
                    <p className="text-xs text-indigo-600 truncate">Your mindful wellness guide</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Welcome message */}
            {messages.length <= 2 && (
              <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
                <p className="text-sm text-gray-600">
                  Share how you're feeling in a safe space. I'm here to listen and support you.
                </p>
              </div>
            )}
            
            {/* Chat messages with improved styling */}
            <ScrollArea className="flex-1 px-4 py-4 bg-[#f9fafc]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    {message.sender === 'assistant' && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 opacity-85">
                        <AvatarImage src="/assets/bot-avatar.png" alt="Serene Companion" />
                        <AvatarFallback className="bg-teal-50 text-teal-600 text-xs">SC</AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`max-w-[85%] px-4 py-3 text-sm shadow-sm ${
                        message.sender === 'user' 
                          ? 'bg-lens-purple text-white rounded-2xl rounded-tr-sm ml-2' 
                          : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {/* Improved typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 opacity-85">
                      <AvatarImage src="/assets/bot-avatar.png" alt="Serene Companion" />
                      <AvatarFallback className="bg-teal-50 text-teal-600 text-xs">SC</AvatarFallback>
                    </Avatar>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex space-x-1.5 items-center h-5">
                        <div className="h-2 w-2 rounded-full bg-lens-purple/40 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-lens-purple/40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="h-2 w-2 rounded-full bg-lens-purple/40 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </ScrollArea>

            {/* Simplified quick suggestions - no scrolling */}
            <div className="px-4 py-2.5 bg-white border-t border-gray-100">
              <div className="flex justify-center gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 px-3 h-7 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-lens-purple rounded-full flex-1"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            {/* Improved input area */}
            <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
              <form 
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input
                  id="message-input"
                  placeholder="Type your message..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 text-sm py-1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="bg-lens-purple hover:bg-lens-purple/90 h-8 w-8 rounded-full p-0 transition-all"
                  disabled={!inputValue.trim() || isSending || isTyping}
                >
                  {isSending ? (
                    <div className="h-3.5 w-3.5 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>)}
      </AnimatePresence>

      {/* Mental Health Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onOpenChange={handleAssessmentDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Assessment Selection Screen */}
          {currentStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Mental Health Assessments</DialogTitle>
                <DialogDescription>
                  Select an assessment to better understand aspects of your mental wellbeing.
                  All results are confidential and stored securely in your account.
                </DialogDescription>
              </DialogHeader>
              
              {assessmentListLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" className="text-lens-purple" />
                  <span className="ml-3 text-lg">Loading assessments...</span>
                </div>
              ) : (
                <div className="h-[60vh] overflow-hidden my-4">
                  <ScrollArea className="h-full w-full">
                    <div className="space-y-4 pr-4">
                      {assessments.map((assessment) => (
                        <Card 
                          key={assessment.id} 
                          className="cursor-pointer transition-all hover:shadow-md"
                          onClick={() => handleAssessmentSelect(assessment)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle>{assessment.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 mb-3">{assessment.description}</p>
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="bg-lens-purple/10 text-lens-purple border-lens-purple/20">
                                {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                              </Badge>
                              <Button variant="ghost" size="sm" className="text-lens-purple hover:text-lens-purple/90 hover:bg-lens-purple/10">
                                Take Assessment
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {assessments.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-2">No assessments found</p>
                          <Button 
                            variant="outline" 
                            onClick={fetchAssessments}
                            className="mt-2"
                          >
                            Refresh
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
                    {/* Questions Screen */}
          {currentStep === 'questions' && selectedAssessment && questions.length > 0 && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAssessment.title}</DialogTitle>
                <DialogDescription>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </DialogDescription>
                <Progress 
                  value={((currentQuestionIndex + 1) / questions.length) * 100} 
                  className="h-2 mt-2"
                />
              </DialogHeader>
              
              <div className="py-6 flex-1">
                {questions[currentQuestionIndex] && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{questions[currentQuestionIndex].question_text}</h3>
                    
                    {/* Key added to the RadioGroup to force re-render on question change */}
                    <RadioGroup
                      key={`question-${currentQuestionIndex}`}
                      value={userResponses[questions[currentQuestionIndex].question_order]?.toString()}
                      onValueChange={(value) => 
                        handleResponseSelect(questions[currentQuestionIndex].question_order, parseInt(value))
                      }
                    >
                      {questions[currentQuestionIndex].response_options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem 
                            value={option.value.toString()} 
                            id={`option-${currentQuestionIndex}-${option.value}`} 
                          />
                          <Label htmlFor={`option-${currentQuestionIndex}-${option.value}`} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                <Button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={
                    userResponses[questions[currentQuestionIndex]?.question_order] === undefined ||
                    responseLoading
                  }
                  className="bg-lens-purple hover:bg-lens-purple/90"
                >
                  {responseLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    'Next'
                  ) : (
                    'Submit'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Processing Screen */}
          {currentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-lens-purple/20 animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-lens-purple/40"></div>
                <div className="absolute inset-4 flex items-center justify-center">
                  <Spinner size="xl" className="text-lens-purple w-12 h-12" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-xl font-medium text-gray-800">Analyzing Your Responses</h3>
                <p className="text-gray-600">Our AI is carefully reviewing your assessment and preparing personalized feedback...</p>
              </div>
              <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-lens-purple h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          )}
          
          {/* Results Screen */}
          {currentStep === 'results' && assessmentResult && selectedAssessment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">{selectedAssessment.title} Results</DialogTitle>
              </DialogHeader>
              
              <div className="h-[60vh] overflow-hidden my-4">
                <ScrollArea className="h-full w-full">
                  <div className="py-4 space-y-6 pr-4">
                    <div className="text-center">
                      <Badge className="text-lg py-1 px-4 bg-lens-purple text-white">
                        {assessmentResult.result_category}
                      </Badge>
                      <p className="mt-2 text-sm text-gray-500">Score: {assessmentResult.score}</p>
                    </div>
                    
                    <Card className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5 text-lens-purple" />
                          <CardTitle className="text-lg">Assessment Feedback</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <p>{assessmentResult.feedback}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 text-sm">
                        <strong>Important:</strong> This assessment is for educational purposes only and should not 
                        replace professional medical advice, diagnosis, or treatment. If you're experiencing a crisis 
                        or need immediate support, please contact a mental health professional or emergency services.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </div>
              
              <DialogFooter className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetAssessment}
                >
                  Take Another Assessment
                </Button>
                
                <Button
                  type="button"
                  onClick={handleAssessmentDialogClose}
                  className="bg-lens-purple hover:bg-lens-purple/90"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MentalHealth;
