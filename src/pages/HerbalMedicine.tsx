import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Flower,
  Leaf,
  AlertCircle,
  Send,
  MessageSquare,
  Flower2,
  MessageCircle,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";

// No herbal remedy types needed since we removed the database section

// Herb card component removed as it's no longer needed

// Message type for the chatbot
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Herbal Medicine Chatbot component
interface HerbalChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const HerbalChatbot: React.FC<HerbalChatbotProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: "Hello! I'm Nature's Wisdom, your herbal medicine consultant. Tell me about your symptoms or health concerns, and I'll provide information on relevant herbal remedies from our database.",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the Edge Function to get a response
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use the environment variable or fallback to the hardcoded URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eoxgpdtrszswnpilkzma.supabase.co';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/herbal-medicine-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          user_id: user.id,
          message: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from herbal medicine chatbot');
      }

      const data = await response.json();

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'assistant' as const,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in herbal medicine chat:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        sender: 'assistant' as const,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay that covers the entire screen */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Chatbot panel that slides in from the bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-0 ${isFullScreen ? '' : 'top-auto h-[90vh]'} bg-white z-50 flex flex-col rounded-t-3xl overflow-hidden shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with title and control buttons */}
            <div className="px-6 py-4 bg-gradient-to-r from-lens-purple/20 to-green-100/50 border-b flex items-center justify-between">
              <div className="flex items-center">
                <Flower2 className="h-6 w-6 text-emerald-600 mr-2" />
                <h3 className="font-semibold text-lg">Nature's Wisdom - Herbal Medicine Consultant</h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-white/20"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                >
                  {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-white/20"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Decorative accent elements */}
            <div className="absolute top-0 left-1/4 w-32 h-1 bg-gradient-to-r from-green-500/30 to-lens-purple/30 rounded-full translate-y-[-50%] blur-sm"></div>
            <div className="absolute top-0 right-1/4 w-24 h-1 bg-gradient-to-r from-amber-500/30 to-green-400/30 rounded-full translate-y-[-50%] blur-sm"></div>
            
            {/* Chat area with ambient gradient background */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-green-50/30 relative">
              {/* Ambient decorative elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
                <motion.div
                  className="absolute top-10 right-10 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400 via-green-300 to-amber-200 blur-3xl"
                  animate={{opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1]}}
                  transition={{duration: 8, repeat: Infinity, ease: "easeInOut"}}
                />
                <motion.div
                  className="absolute bottom-40 left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-amber-300 via-lens-purple/60 to-emerald-200 blur-3xl"
                  animate={{opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1]}}
                  transition={{duration: 10, repeat: Infinity, ease: "easeInOut"}}
                />
              </div>

              {/* Messages area with scrolling */}
              <ScrollArea className="h-full px-4 md:px-8 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="px-4 py-2 bg-green-100/50 rounded-full flex items-center gap-2 border border-green-200/50">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-800">Powered by traditional knowledge and AI</span>
                    </div>
                  </div>

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${message.sender === 'user' 
                          ? 'bg-lens-purple text-white' 
                          : 'bg-gradient-to-r from-emerald-50 to-green-100 text-gray-800 border border-green-200/50'}`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] md:max-w-[70%] rounded-2xl p-4 bg-gray-100/80 backdrop-blur-sm text-gray-500 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '600ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-5" />
                </div>
              </ScrollArea>
            </div>
            
            {/* Input area at the bottom */}
            <div className="p-4 md:p-6 border-t bg-white/80 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <Input
                  placeholder="Ask about herbal remedies for your symptoms..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || !user}
                  className="flex-1 py-6 px-4 text-base rounded-xl border-lens-purple/20 shadow-sm focus-visible:ring-lens-purple"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputMessage.trim() || !user}
                  size="icon"
                  className="rounded-full h-12 w-12 bg-lens-purple hover:bg-lens-purple-light shadow-md"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              {!user && (
                <p className="text-sm text-red-500 mt-3 text-center">Please log in to use the herbal medicine consultant</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main component
const HerbalMedicine = () => {
  // State for controlling the chat interface visibility
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 overflow-hidden mt-16 md:mt-24">
        <div className="space-y-16">
          {/* Hero Section with 3D effect */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl -mt-6 lg:-mt-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                <span className="text-lens-purple">Traditional</span> Herbal Medicine
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Discover the power of nature with our AI-powered herbal remedy consultant, combining ancient wisdom with modern science.
              </p>
              
              {/* Chat button - prominent call to action */}
              <div className="mt-8">
                <Button 
                  className="bg-lens-purple hover:bg-lens-purple-light w-full md:w-auto text-lg py-6 px-8 shadow-lg transition-all duration-300 hover:scale-102"
                  onClick={() => setIsChatOpen(true)}
                >
                  <span className="flex items-center gap-3 font-medium">
                    <MessageCircle className="h-5 w-5" />
                    Chat with Nature's Wisdom
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </span>
                </Button>
              </div>
              
              {/* How to Use Guide - directly on the hero section */}
              <div className="mt-10 space-y-4 border-t border-lens-purple/10 pt-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-lens-purple">
                  <Info className="h-5 w-5" /> 
                  How to Use the Herbal Consultant
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lens-purple/10 text-lens-purple text-sm font-medium">1</div>
                    <p className="text-sm text-gray-600">Describe your symptoms or health concerns in detail</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lens-purple/10 text-lens-purple text-sm font-medium">2</div>
                    <p className="text-sm text-gray-600">Receive information about relevant herbal remedies from our database</p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lens-purple/10 text-lens-purple text-sm font-medium">3</div>
                    <p className="text-sm text-gray-600">Ask follow-up questions about preparation methods and dosage</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Bold and visually striking herbal showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mt-12 lg:mt-0 lg:ml-auto w-full max-w-[600px]"
            >
              {/* Dynamic background elements */}
              <div className="absolute -inset-16 overflow-hidden">
                {/* Dramatic radial gradient backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-amber-700/5 z-0"></div>
                
                {/* Animated background circles */}
                <motion.div 
                  className="absolute -right-20 top-10 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/20 via-green-400/10 to-transparent blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <motion.div 
                  className="absolute -left-20 bottom-0 w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/15 via-yellow-400/10 to-transparent blur-xl"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Artistic botanical pattern layer */}
                <div className="absolute inset-0 opacity-20 overflow-hidden">
                  <motion.div
                    animate={{
                      rotate: [0, 2, 0],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0"
                  >
                    <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10,50 Q30,20 50,50 T90,50" stroke="#166534" strokeWidth="0.5" fill="none" />
                      <path d="M10,60 Q30,90 50,60 T90,60" stroke="#15803d" strokeWidth="0.5" fill="none" />
                      <path d="M10,70 Q30,40 50,70 T90,70" stroke="#166534" strokeWidth="0.5" fill="none" />
                      <path d="M10,40 Q30,70 50,40 T90,40" stroke="#15803d" strokeWidth="0.5" fill="none" />
                      <path d="M10,30 Q30,0 50,30 T90,30" stroke="#166534" strokeWidth="0.5" fill="none" />
                      <path d="M20,20 Q40,-10 60,20 T100,20" stroke="#b45309" strokeWidth="0.4" fill="none" opacity="0.6" />
                      <path d="M0,80 Q20,110 40,80 T80,80" stroke="#b45309" strokeWidth="0.4" fill="none" opacity="0.6" />
                    </svg>
                  </motion.div>
                </div>
              </div>
              
              {/* Main showcase display */}
              <div className="relative">
                {/* Dramatic outer frame with golden ratio proportions */}
                <motion.div
                  className="absolute -inset-6 bg-gradient-to-br from-amber-700/30 via-emerald-600/20 to-green-700/30 rounded-[38px] z-0 backdrop-blur-sm"
                  animate={{
                    opacity: [0.7, 0.9, 0.7],
                    boxShadow: [
                      "0 10px 30px -5px rgba(0, 0, 0, 0.2)",
                      "0 20px 40px -5px rgba(0, 0, 0, 0.3)",
                      "0 10px 30px -5px rgba(0, 0, 0, 0.2)"
                    ]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-16 h-16">
                    <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-amber-400/70 rounded-tl-xl"></div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-green-500/70 rounded-tr-xl"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-16 h-16">
                    <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-green-500/70 rounded-bl-xl"></div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-16 h-16">
                    <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-amber-400/70 rounded-br-xl"></div>
                  </div>
                </motion.div>
                
                {/* Inner frame with premium border */}
                <motion.div
                  className="relative z-10 p-1 rounded-[30px] overflow-hidden bg-gradient-to-br from-amber-300/30 via-green-100/20 to-emerald-300/30"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  {/* Rich inner container */}
                  <div className="relative p-5 bg-white/90 backdrop-blur-md rounded-[26px] overflow-hidden">
                    {/* Golden ratio mask for image */}
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* Dark vignette border */}
                      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] pointer-events-none z-20"></div>
                      
                      <img 
                        src="/assets/herbal.png" 
                        alt="Herbal Medicine" 
                        className="w-full h-auto max-h-[450px] object-contain transform scale-110"
                      />
                      
                      {/* Rich color overlay */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-green-900/20"
                        animate={{
                          opacity: [0.4, 0.6, 0.4],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      {/* Dynamic light sweep effect */}
                      <motion.div 
                        className="absolute -inset-full w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/30 to-transparent transform -rotate-45"
                        animate={{
                          left: ["-150%", "100%"],
                          top: ["-150%", "100%"],
                        }}
                        transition={{
                          duration: 7,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
                
                {/* Bold floating herbal elements */}
                <motion.div
                  className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-br from-amber-400/70 to-amber-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Flower className="w-12 h-12 text-amber-700/90" />
                  </motion.div>
                </motion.div>
                
                <motion.div
                  className="absolute -top-8 -left-8 w-28 h-28 bg-gradient-to-tl from-emerald-500/70 to-green-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, -360],
                    }}
                    transition={{
                      duration: 25,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Leaf className="w-12 h-12 text-green-800/90" />
                  </motion.div>
                </motion.div>
              </div>
              
              {/* Signature decorative elements */}
              <motion.div
                className="absolute top-1/3 -right-10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <motion.div 
                  className="w-20 h-3 bg-gradient-to-r from-amber-400/80 to-transparent rounded-full"
                  animate={{
                    width: ["5rem", "7rem", "5rem"],
                    opacity: [0.7, 0.9, 0.7],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              
              <motion.div
                className="absolute bottom-1/3 -left-10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.div 
                  className="w-20 h-3 bg-gradient-to-l from-emerald-500/80 to-transparent rounded-full"
                  animate={{
                    width: ["5rem", "7rem", "5rem"],
                    opacity: [0.7, 0.9, 0.7],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
              
              {/* Floating accent elements */}
              <motion.div
                className="absolute top-0 right-1/4 flex"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-amber-400"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              
              <motion.div
                className="absolute bottom-10 left-1/4 flex"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-emerald-500"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          </div>
          
          {/* Slide-in Fullscreen Chat Interface */}
          <HerbalChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
          
          {/* Footer section with floating chat button */}
          <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-30">
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="rounded-full h-16 w-16 bg-lens-purple hover:bg-lens-purple-light shadow-xl flex items-center justify-center transition-transform hover:scale-105"
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HerbalMedicine;
