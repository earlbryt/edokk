import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
    console.log('🚀 handleSendMessage called');
    if (!inputMessage.trim() || isLoading || !user) {
      console.log('❌ Early return conditions:', { 
        emptyInput: !inputMessage.trim(), 
        isLoading, 
        userExists: !!user 
      });
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };
    console.log('📝 User message created:', userMessage);

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    console.log('🔄 Loading state set to true');

    try {
      // Call the Edge Function to get a response
      console.log('🔑 Getting auth session...');
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      console.log('✅ Session obtained:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0
      });
      
      // Use the environment variable or fallback to the hardcoded URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eoxgpdtrszswnpilkzma.supabase.co';
      console.log('🌐 Using Supabase URL:', supabaseUrl);
      
      const endpoint = `${supabaseUrl}/functions/v1/herbal-medicine-chat`;
      console.log('🌐 Full endpoint URL:', endpoint);
      
      console.log('🚀 Sending request with payload:', {
        user_id: user.id,
        message: userMessage.content
      });
      
      const response = await fetch(endpoint, {
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

      console.log('📥 Response received:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error details:', errorText);
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
      }

      console.log('📦 Parsing response JSON...');
      const data = await response.json();
      console.log('📦 Parsed response data:', data);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      console.log('🤖 Created assistant message:', assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);
      console.log('✅ Added assistant message to chat');
    } catch (error) {
      console.error('❌ Error in herbal medicine chat:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      console.log('⚠️ Created error message:', errorMessage);

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log('🔄 Loading state set to false');
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
          {/* Overlay that covers the entire screen with enhanced backdrop effect */}
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(5px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-black/25 backdrop-blur-[5px] z-50"
            onClick={onClose}
          />

          {/* Chatbot panel that slides in from the bottom with enhanced animations */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0.5, scale: 0.98 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 400, 
              mass: 0.9, 
              restDelta: 0.001,
              restSpeed: 0.001,
              bounce: 0,
            }}
            className={`fixed inset-0 ${isFullScreen ? '' : 'top-auto h-[90vh] rounded-t-3xl'} bg-white z-50 flex flex-col overflow-hidden shadow-2xl will-change-transform`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with title and control buttons - added subtle entrance animation */}
            <motion.div 
              className={`px-6 py-4 bg-gradient-to-r from-lens-purple/20 to-green-100/50 border-b flex items-center justify-between ${isFullScreen ? 'pt-7 pb-5' : ''}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
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
            </motion.div>

            {/* Enhanced decorative accent elements with subtle animations - only visible in non-fullscreen mode */}
            {!isFullScreen && (
              <>
                <motion.div 
                  className="absolute top-0 left-1/4 w-32 h-1 bg-gradient-to-r from-green-500/30 to-lens-purple/30 rounded-full translate-y-[-50%] blur-sm"
                  initial={{ opacity: 0, width: "10%" }}
                  animate={{ opacity: 1, width: "32%" }}
                  transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
                />
                <motion.div 
                  className="absolute top-0 right-1/4 w-24 h-1 bg-gradient-to-r from-amber-500/30 to-green-400/30 rounded-full translate-y-[-50%] blur-sm"
                  initial={{ opacity: 0, width: "6%" }}
                  animate={{ opacity: 1, width: "24%" }}
                  transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
                />
              </>
            )}
            
            {/* Chat area with ambient gradient background */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-green-50/30 relative">
              {/* Ambient decorative elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
                <motion.div
                  className="absolute top-10 right-10 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400 via-green-300 to-amber-200 blur-3xl"
                  animate={{opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1], x: [0, 10, 0]}}
                  transition={{duration: 12, repeat: Infinity, ease: "easeInOut"}}
                />
                <motion.div
                  className="absolute bottom-40 left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-amber-300 via-lens-purple/60 to-emerald-200 blur-3xl"
                  animate={{opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1], y: [0, -10, 0]}}
                  transition={{duration: 14, repeat: Infinity, ease: "easeInOut"}}
                />
              </div>

              {/* Messages area with scrolling */}
              <ScrollArea className="h-full px-4 md:px-8 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <motion.div 
                    className="flex justify-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="px-4 py-2 bg-green-100/50 rounded-full flex items-center gap-2 border border-green-200/50 backdrop-blur-sm">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                      >
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                      </motion.div>
                      <span className="text-sm text-emerald-800">Powered by traditional knowledge and AI</span>
                    </div>
                  </motion.div>

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
            
            {/* Input area at the bottom with entrance animation */}
            <motion.div 
              className="p-4 md:p-6 border-t bg-white/80 backdrop-blur-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
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
                  className="rounded-full h-12 w-12 bg-lens-purple hover:bg-lens-purple-light shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              {!user && (
                <p className="text-sm text-red-500 mt-3 text-center">Please log in to use the herbal medicine consultant</p>
              )}
            </motion.div>
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
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 overflow-visible mt-16 md:mt-24">
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
              className="relative mt-12 lg:mt-0 lg:ml-4 lg:mr-auto w-full max-w-[486px]" /* Moved slightly back to the right with ml-4 */
            >
              {/* Dynamic background elements */}
              <div className="absolute -inset-14 overflow-hidden"> {/* Reduced from -inset-16 to -inset-14 */}
                {/* Dramatic radial gradient backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-transparent to-amber-700/5 z-0"></div>
                
                {/* Animated background circles */}
                <motion.div 
                  className="absolute -right-18 top-9 w-52 h-52 rounded-full bg-gradient-to-br from-emerald-500/20 via-green-400/10 to-transparent blur-xl" /* Reduced size by 10% */
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
                  className="absolute -left-18 bottom-0 w-58 h-58 rounded-full bg-gradient-to-tr from-amber-500/15 via-yellow-400/10 to-transparent blur-xl" /* Reduced size by 10% */
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
              
              {/* Main showcase display - Hexagonal style from Nutrition page */}
              <div className="relative">
                {/* Divine angelic backdrop */}
                <div className="relative">
                  {/* Completely solid hexagonal outer layer - fully visible and extended */}
                  <div className="absolute inset-[-45px] bg-gradient-to-tr from-purple-100 via-teal-100 to-indigo-50 transform rotate-45 rounded-3xl -z-0"></div>
                  
                  {/* Removed the beaming rays as requested */}
                  
                  {/* Consistent, non-dimming ethereal glow - inspired by OrderConfirmation */}
                  <div className="absolute inset-0 z-1 flex items-center justify-center">
                    <div className="absolute inset-0 shadow-[inset_0_0_30px_15px_rgba(126,58,242,0.1)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-lens-purple/20 via-teal-200/15 to-indigo-100/20 blur-xl"></div>
                    </div>
                  </div>
                  
                  {/* Subtle, static sacred geometric patterns */}
                  <div className="absolute inset-0 z-2 flex items-center justify-center overflow-hidden">
                    <svg className="absolute w-full h-full opacity-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#7e3af2" strokeWidth="0.2" strokeDasharray="0.5 0.5" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#14b8a6" strokeWidth="0.2" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="#7e3af2" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
                      <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="none" stroke="#14b8a6" strokeWidth="0.2" />
                      <path d="M50,20 L80,50 L50,80 L20,50 Z" fill="none" stroke="#7e3af2" strokeWidth="0.2" />
                      <path d="M10,50 L50,10 L90,50 L50,90 Z" fill="none" stroke="#4f46e5" strokeWidth="0.2" strokeDasharray="1 1" />
                    </svg>
                  </div>
                  
                  {/* Divine halo frame with white glow - inspired by OrderConfirmation */}
                  <div className="relative z-10 p-5"> {/* Reduced padding from p-6 to p-5 */}
                    {/* Angelic glow ring - consistent, non-dimming */}
                    <div className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_5px_rgba(255,255,255,0.7),0_0_30px_15px_rgba(126,58,242,0.3)]"></div>
                    
                    {/* Main image container with divine border */}
                    <div className="relative overflow-hidden rounded-full border-7 border-gradient-to-r from-lens-purple/80 via-white/90 to-indigo-300/80 shadow-xl"> {/* Reduced border from 8 to 7 */}
                      {/* Accent layer */}
                      <div className="absolute inset-0 border-3 border-lens-purple/20 rounded-full z-20 pointer-events-none"></div> {/* Reduced border from 4 to 3 */}
                      
                      {/* Actual image */}
                      <img 
                        src="/assets/herbal.png" 
                        alt="Herbal Medicine" 
                        className="w-full h-auto transform scale-100 z-10" /* Reduced scale from 110% to 100% */
                      />
                      
                      {/* Divine light from above effect - consistent */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/40 via-transparent to-lens-purple/10 mix-blend-soft-light z-30"></div>
                      
                      {/* Subtle light reflection - single, fixed positioning */}
                      <div className="absolute right-0 top-0 w-1/3 h-1/3 bg-white/20 rounded-full blur-md mix-blend-overlay z-40"></div>
                    </div>
                  </div>
                  
                  {/* Smaller decorative accent elements - consistent, static styling */}
                  <div className="absolute top-0 right-0 w-11 h-11 bg-gradient-to-br from-lens-purple/40 to-indigo-300/20 rounded-full blur-sm z-10 shadow-[0_0_10px_5px_rgba(126,58,242,0.15)]"></div> {/* Reduced from 12x12 to 11x11 */}
                  <div className="absolute bottom-4 left-0 w-12 h-12 bg-gradient-to-tr from-teal-400/25 to-teal-200/15 rounded-full blur-sm z-10 shadow-[0_0_10px_5px_rgba(20,184,166,0.15)]"></div> {/* Reduced from 14x14 to 12x12 */}
                </div>
                
                {/* Modern geometric leaf pattern background */}
                <motion.div 
                  className="absolute -inset-6 z-0 opacity-25"
                  animate={{
                    rotate: [0, 0.5, 0],
                    scale: [1, 1.01, 1]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    {/* Clean, modern honeycomb/leaf pattern */}
                    <defs>
                      <pattern id="leafGrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                        {/* Single leaf shape */}
                        <path d="M25,10 Q35,25 25,40 Q15,25 25,10" fill="none" stroke="#14532d" strokeWidth="0.5" />
                        
                        {/* Single hexagon */}
                        <path d="M35,15 L45,25 L45,35 L35,45 L25,35 L25,25 Z" fill="none" stroke="#15803d" strokeWidth="0.3" opacity="0.4" />
                      </pattern>
                      
                      <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="#b45309" opacity="0.5" />
                      </pattern>
                    </defs>
                    
                    {/* Background patterns */}
                    <rect x="0" y="0" width="200" height="200" fill="url(#dotGrid)" />
                    <rect x="0" y="0" width="200" height="200" fill="url(#leafGrid)" />
                    
                    {/* Central geometric element */}
                    <path d="M70,70 L130,70 L130,130 L70,130 Z" fill="none" stroke="#15803d" strokeWidth="0.4" opacity="0.6" transform="rotate(45, 100, 100)" />
                    <path d="M80,80 L120,80 L120,120 L80,120 Z" fill="none" stroke="#b45309" strokeWidth="0.3" opacity="0.5" transform="rotate(45, 100, 100)" />
                    
                    {/* Clean symmetrical cross elements */}
                    <line x1="0" y1="100" x2="200" y2="100" stroke="#15803d" strokeWidth="0.2" opacity="0.3" />
                    <line x1="100" y1="0" x2="100" y2="200" stroke="#15803d" strokeWidth="0.2" opacity="0.3" />
                    
                    {/* Diagonal elements */}
                    <line x1="0" y1="0" x2="200" y2="200" stroke="#15803d" strokeWidth="0.2" opacity="0.2" />
                    <line x1="200" y1="0" x2="0" y2="200" stroke="#15803d" strokeWidth="0.2" opacity="0.2" />
                    
                    {/* Corner decorative elements - minimal */}
                    <circle cx="25" cy="25" r="15" fill="none" stroke="#b45309" strokeWidth="0.3" opacity="0.4" />
                    <circle cx="175" cy="25" r="15" fill="none" stroke="#b45309" strokeWidth="0.3" opacity="0.4" />
                    <circle cx="25" cy="175" r="15" fill="none" stroke="#b45309" strokeWidth="0.3" opacity="0.4" />
                    <circle cx="175" cy="175" r="15" fill="none" stroke="#b45309" strokeWidth="0.3" opacity="0.4" />
                  </svg>
                </motion.div>
                
                {/* Bold floating herbal elements */}
                <motion.div
                  className="absolute -bottom-7 -right-7 w-25 h-25 bg-gradient-to-br from-amber-400/70 to-amber-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm" /* Reduced size and position */  
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
                    <Flower className="w-11 h-11 text-amber-700/90" /> {/* Reduced from 12x12 to 11x11 */}
                  </motion.div>
                </motion.div>
                
                <motion.div
                  className="absolute -top-7 -left-7 w-25 h-25 bg-gradient-to-tl from-emerald-500/70 to-green-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm" /* Reduced size and position */
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
                    <Leaf className="w-11 h-11 text-green-800/90" /> {/* Reduced from 12x12 to 11x11 */}
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
            {/* Button with beaming rays effect */}
            <div className="relative">
              {/* Beaming rays around the button */}
              <div className="absolute inset-0 z-0 overflow-visible rounded-full">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute top-1/2 left-1/2 h-[180%] w-0.5 bg-gradient-to-t from-lens-purple/0 via-lens-purple/20 to-indigo-300/0"
                    style={{ 
                      transformOrigin: 'center center',
                      transform: `translate(-50%, -50%) rotate(${i * 30}deg)` 
                    }}
                  />
                ))}
              </div>
              
              <Button 
                onClick={() => setIsChatOpen(true)}
                className="rounded-full h-16 w-16 bg-lens-purple hover:bg-lens-purple-light shadow-xl flex items-center justify-center transition-transform hover:scale-105 relative z-10"
              >
                <MessageCircle className="h-7 w-7" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HerbalMedicine;
