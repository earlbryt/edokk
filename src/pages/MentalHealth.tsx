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
  
  // Assessment state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentListLoading, setAssessmentListLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  
  // Questions and responses state
  const [currentStep, setCurrentStep] = useState<'select' | 'questions' | 'results'>('select');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<UserResponses>({});
  const [responseLoading, setResponseLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    result_category: string;
    feedback: string;
  } | null>(null);
  
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
        return;
      }
      
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
  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
    
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue("");
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const assistantResponses = [
        "I understand how you're feeling. Would you like to explore some coping strategies?",
        "That's completely valid. Remember that your feelings matter and it's okay to take things at your own pace.",
        "Thank you for sharing that with me. Would you consider taking one of our assessments to help us better understand how to support you?",
        "I'm here to listen without judgment. Would you like to tell me more about what's going on?",
        "It sounds like you're going through a challenging time. Would it help to discuss some mindfulness techniques?"
      ];
      
      const randomResponse = assistantResponses[Math.floor(Math.random() * assistantResponses.length)];
      
      const newAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: randomResponse,
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      setIsTyping(false);
    }, 1500);
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
        <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src="/assets/bot-avatar.png" alt="AI Assistant" />
                <AvatarFallback className="bg-lens-purple text-white">AI</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-lg">Mental Health Assistant</DialogTitle>
                <p className="text-sm text-gray-500">AI-powered emotional support</p>
              </div>
              <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block"></span> Online
              </Badge>
            </div>
          </DialogHeader>
          
          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user' 
                        ? 'bg-lens-purple text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-tl-none">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-gray-50 border-t border-b">
            <p className="text-xs text-gray-500 mb-2">Suggested topics:</p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-auto bg-white"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 border-t bg-white flex-shrink-0">
            <form 
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <Input
                id="message-input"
                placeholder="Type your message..."
                className="flex-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button type="submit" size="icon" className="bg-lens-purple hover:bg-lens-purple/90">
                <Send className="h-4 w-4" />
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
                <ScrollArea className="flex-1 pr-4 max-h-[60vh] my-4">
                  <div className="space-y-4">
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
                    
                    <RadioGroup
                      value={userResponses[questions[currentQuestionIndex].question_order]?.toString()}
                      onValueChange={(value) => 
                        handleResponseSelect(questions[currentQuestionIndex].question_order, parseInt(value))
                      }
                    >
                      {questions[currentQuestionIndex].response_options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem 
                            value={option.value.toString()} 
                            id={`option-${option.value}`} 
                          />
                          <Label htmlFor={`option-${option.value}`} className="cursor-pointer">
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
          
          {/* Results Screen */}
          {currentStep === 'results' && assessmentResult && selectedAssessment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">{selectedAssessment.title} Results</DialogTitle>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
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
