import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Brain, BookOpen, Moon, Phone, ClipboardCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Layout/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
const initialMessages: Message[] = [
  {
    id: "welcome-1",
    content: "Hello! I'm eDok's mental health assistant. I'm here to support your emotional wellbeing.",
    sender: "assistant",
    timestamp: new Date()
  },
  {
    id: "welcome-2",
    content: "You can chat with me about your feelings, take assessments, or explore coping strategies. How can I help you today?",
    sender: "assistant",
    timestamp: new Date(Date.now() + 100)
  }
];

// Quick suggestions for the chatbot
const quickSuggestions = [
  "I'm feeling anxious",
  "I need help with stress",
  "How to improve sleep?",
  "Meditation techniques",
  "Finding a therapist"
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
  
  // Check for redirect from login page with assessment dialog flag
  useEffect(() => {
    const openAssessmentDialog = sessionStorage.getItem('openAssessmentDialog');
    if (openAssessmentDialog === 'true') {
      // Open the assessment dialog and clear the flag
      setAssessmentDialogOpen(true);
      sessionStorage.removeItem('openAssessmentDialog');
    }
  }, []);
  
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
  
  // Check auth and open assessment dialog or redirect to login
  const handleTakeAssessment = async () => {
    console.log('Take Assessment button clicked');
    
    try {
      // Check if user is logged in
      const { data, error } = await supabase.auth.getSession();
      
      console.log('Auth check result:', { data, error });
      
      if (!data.session) {
        console.log('No session found, redirecting to login');
        
        // Show a toast for debugging
        toast({
          title: "Authentication Required",
          description: "Redirecting to login page...",
          variant: "default"
        });
        
        // User is not logged in, redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        // Use React Router navigation
        navigate(`/login?returnUrl=${returnUrl}&action=assessment`);
        return;
      }
      
      console.log('User is logged in, opening assessment dialog');
      // User is logged in, open assessment dialog
      setAssessmentDialogOpen(true);
    } catch (error) {
      console.error('Error in handleTakeAssessment:', error);
      toast({
        title: "Error",
        description: "There was an error checking your authentication status",
        variant: "destructive"
      });
    }
  };
  
  // Close assessment dialog and reset state
  const handleAssessmentDialogClose = () => {
    setAssessmentDialogOpen(false);
    resetAssessment();
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the chat feature.",
          variant: "destructive"
        });
        return;
      }
      
      // Create and display user message
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        content: inputValue,
        sender: "user",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputValue("");
      
      // Show typing indicator
      setIsTyping(true);
      
      // Call the mental-health-chat edge function
      const { data, error } = await supabase.functions.invoke('mental-health-chat', {
        body: {
          user_id: user.id,
          message: newUserMessage.content
        }
      });
      
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
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-16">
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
              <p className="text-xl text-gray-600 mb-8">
                Connect with our AI assistant, track your emotional wellbeing, and access professional support in a safe, judgment-free environment.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-lens-purple hover:bg-lens-purple/90 text-white"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start Chatting
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-lens-purple text-lens-purple hover:bg-lens-purple/10"
                  onClick={handleTakeAssessment}
                >
                  Take Assessment
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
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/assets/mental-health.png" 
                  alt="Mental Health Support" 
                  className="w-full h-auto"
                />
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-lens-purple/10 rounded-full z-0"></div>
              <div className="absolute top-1/4 -left-8 w-16 h-16 bg-lens-purple/20 rounded-full z-0"></div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mt-16">
          {/* All tab content has been removed */}
        </div>
      </main>
      
      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[450px] md:max-w-[500px] h-[85vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden border-0 shadow-xl">
          {/* Header with minimal design */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-lens-purple/20">
                <AvatarImage src="/assets/bot-avatar.png" alt="AI Assistant" />
                <AvatarFallback className="bg-lens-purple/10 text-lens-purple font-medium">AI</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-medium text-gray-900">eDok Assistant</h2>
                <p className="text-xs text-gray-500">Mental health support</p>
              </div>
            </div>
            <Badge variant="outline" className="h-6 bg-green-50 text-green-700 border-green-100 px-2">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>Online
            </Badge>
          </div>
          
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
                      <AvatarImage src="/assets/bot-avatar.png" alt="AI Assistant" />
                      <AvatarFallback className="bg-lens-purple/10 text-lens-purple text-xs">AI</AvatarFallback>
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
                    <AvatarImage src="/assets/bot-avatar.png" alt="AI Assistant" />
                    <AvatarFallback className="bg-lens-purple/10 text-lens-purple text-xs">AI</AvatarFallback>
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

          {/* Simplified quick suggestions */}
          <div className="px-4 py-2.5 bg-white border-t border-gray-100">
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-none">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs whitespace-nowrap py-1 px-3 h-7 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-lens-purple rounded-full flex-shrink-0"
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
                className="bg-lens-purple hover:bg-lens-purple/90 h-8 w-8 rounded-full p-0"
                disabled={!inputValue.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
