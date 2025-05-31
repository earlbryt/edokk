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
  Minimize2,
  HeartPulse,
  ClipboardList
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
      content: "Hello! I'm Nature's Wisdom, your guide to herbal remedies. Describe your symptoms or health concerns, and I can share information about relevant herbal treatments from our database.",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat history when the component opens and user is available
  useEffect(() => {
    const fetchHistory = async () => {
      if (isOpen && user && !historyLoaded) {
        setIsLoading(true); // Show loading indicator while fetching history
        try {
          const { data, error } = await supabase
            .from('herbal_chat_messages')
            .select('id, content, role, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('Error fetching chat history:', error);
            // Optionally, show an error message to the user in the chat
            setMessages(prev => [...prev, {
              id: 'history-error',
              content: 'Could not load chat history. Please try again later.',
              sender: 'assistant',
              timestamp: new Date()
            }]);
          } else if (data && data.length > 0) {
            const fetchedMessages: Message[] = data.map((msg: any) => ({
              id: msg.id.toString(), // Use DB id as string
              content: msg.content,
              sender: msg.role === 'user' ? 'user' : 'assistant', // DB role is 'user' or 'assistant'
              timestamp: new Date(msg.created_at)
            }));
            setMessages(fetchedMessages);
          } else {
            // No history, keep the default welcome message which is already in state
          }
          setHistoryLoaded(true);
        } catch (e) {
          console.error('Unexpected error fetching chat history:', e);
          setMessages(prev => [...prev, {
            id: 'history-fetch-error',
            content: 'An unexpected error occurred while loading history.',
            sender: 'assistant',
            timestamp: new Date()
          }]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
  }, [isOpen, user, historyLoaded, supabase]);

  // Reset historyLoaded when chat is closed so it refetches on reopen
  useEffect(() => {
    if (!isOpen) {
      setHistoryLoaded(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    console.log('🚀 handleSendMessage called');
    if (!inputMessage.trim() || isLoading) {
      console.log('❌ Early return conditions:', { 
        emptyInput: !inputMessage.trim(), 
        isLoading 
      });
      return;
    }
    
    // Check for user authentication and display appropriate message
    if (!user) {
      console.log('❌ No authenticated user found');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Please sign in to use the herbal medicine consultant.",
        sender: 'assistant' as const,
        timestamp: new Date()
      }]);
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
      
      // Check if we have a valid Supabase URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL is not configured properly');
      }
      
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
        
        // More specific error messages based on status code
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication error (${response.status}): Your session may have expired. Please sign in again.`);
        } else if (response.status === 404) {
          throw new Error(`Edge function not found (${response.status}): The herbal medicine chat function may not be deployed.`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): The edge function encountered an internal error.`);
        } else {
          throw new Error(`Failed to get response: ${response.status} ${response.statusText}\n${errorText}`);
        }
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
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Refined backdrop with subtle fade-in and blur */}
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[8px] z-50"
            onClick={onClose}
          />

          {/* iOS-style sheet that slides up with dynamic spring physics */}
          <motion.div
            initial={{ y: '100%', borderRadius: '24px 24px 0 0' }}
            animate={{ 
              y: 0, 
              borderRadius: isFullScreen ? '0' : '24px 24px 0 0',
              height: '100%'
            }}
            exit={{ y: '100%' }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 350, 
              mass: 0.8,
              restSpeed: 0.003,
            }}
            className="fixed bottom-0 left-0 right-0 mx-auto z-50 bg-white overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)] will-change-transform w-full md:w-3/5 lg:w-1/2 max-w-2xl"
            style={{ height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium drag handle for iOS feel */}
            <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 pb-2 touch-none z-10">
              <div className="w-10 h-1 rounded-full bg-gray-300/80"></div>
            </div>

            {/* iOS-style frosted glass header - mobile optimized */}
            <motion.div 
              className="pt-8 pb-4 px-4 sm:px-6 backdrop-blur-md bg-white/80 border-b border-gray-200/50 sticky top-0 z-10 overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                    <Flower2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">Nature's Wisdom</h3>
                    <p className="text-xs text-emerald-600 truncate">Herbal Remedy Guide</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-7 w-7 sm:h-8 sm:w-8 hover:bg-gray-100/80"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                  >
                    {isFullScreen ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-7 w-7 sm:h-8 sm:w-8 hover:bg-gray-100/80"
                    onClick={onClose}
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            </motion.div>
            
            {/* Main content container with flexbox column layout */}
            <div className="flex flex-col h-[calc(100%-72px)] bg-white relative overflow-hidden">
              {/* Enhanced ambient background with depth elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Gradient base layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50/80"></div>
                
                {/* Soft abstract shapes for visual interest */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-lens-purple/5 rounded-full blur-3xl opacity-70"></div>
                <div className="absolute top-1/3 -left-20 w-80 h-80 bg-emerald-100/20 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-50/30 rounded-full blur-3xl opacity-50"></div>
                
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] [mask-image:linear-gradient(to_bottom,transparent,black)]">
                  <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="herb-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(5)">
                      <path d="M10,10 Q15,5 20,10 T30,10 M0,20 Q5,15 10,20 T20,20" stroke="#15803d" strokeWidth="1" fill="none" />
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#herb-pattern)" />
                  </svg>
                </div>
                
                {/* Decorative subtle elements */}
                <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-lens-purple/40 rounded-full shadow-lg shadow-lens-purple/20"></div>
                <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-emerald-400/30 rounded-full shadow-lg shadow-emerald-400/10"></div>
                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-amber-300/40 rounded-full shadow-lg shadow-amber-300/10"></div>
                
                {/* Soft light effect at the top */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/80 to-transparent opacity-70"></div>
              </div>

              {/* Messages with iOS-like styling - mobile optimized */}
              <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-16 overflow-x-hidden">
                <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
                  {/* Status pill - mobile optimized with enhanced styling */}
                  <motion.div 
                    className="flex justify-center my-3 sm:my-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="relative max-w-[95%] px-2 sm:px-3 py-1 sm:py-1.5 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1 sm:gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-200/70 overflow-hidden">
                      {/* Inner highlight for pill */}
                      <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white to-transparent opacity-70 pointer-events-none"></div>
                      {/* Left glow accent */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-emerald-400/20 blur-xl rounded-full"></div>
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 text-emerald-600 relative z-10" />
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700 truncate relative z-10">Offering herbal solutions to health issues</span>
                    </div>
                  </motion.div>

                  {/* Message bubbles with iOS-like styling - mobile optimized */}
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end w-full`}
                    >
                      {message.sender === 'assistant' && (
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-1.5 sm:mr-2 mb-1 shadow-sm border border-emerald-200/50 flex-shrink-0">
                          <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[75%] sm:max-w-[85%] md:max-w-[70%] p-2.5 sm:p-3.5 ${message.sender === 'user' 
                          ? 'bg-gradient-to-br from-lens-purple to-lens-purple-light text-white rounded-2xl rounded-tr-sm shadow-[0_2px_8px_rgba(126,58,242,0.25)]' 
                          : 'bg-white/95 backdrop-blur-sm border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.03)]'}`}
                      >
                        {/* Inner highlight effect for depth */}
                        <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl opacity-50 pointer-events-none"></div>
                        <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">{message.content}</p>
                      </div>

                      {message.sender === 'user' && (
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-lens-purple-light flex items-center justify-center ml-1.5 sm:ml-2 mb-1 shadow-sm flex-shrink-0">
                          <div className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 rounded-full bg-white/90"></div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* iOS-style typing indicator - mobile optimized */}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start items-end"
                    >
                      <div className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mr-1.5 sm:mr-2 mb-1 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-emerald-200/50 flex-shrink-0 overflow-hidden">
                        {/* Inner highlight */}
                        <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/80 to-transparent rounded-t-full"></div>
                        <Leaf className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 relative z-10" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm p-2 sm:p-3 bg-white border border-gray-100 shadow-sm">
                        <div className="flex items-center h-4 sm:h-5 space-x-1 sm:space-x-1.5">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1000ms' }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '300ms', animationDuration: '1000ms' }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '600ms', animationDuration: '1000ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-5" />
                </div>
              </ScrollArea>
            </div>
            
            {/* Premium iOS-style input area fixed at bottom - mobile optimized */}
            <motion.div 
              className="sticky bottom-0 p-3 sm:p-4 border-t border-gray-200/70 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              {/* Decorative accents for input area */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-3 left-1/4 right-1/4 h-1.5 bg-gradient-to-r from-transparent via-lens-purple/10 to-transparent blur-sm"></div>
                <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-white/70 to-white/30 opacity-50"></div>
              </div>
              <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Ask about herbal remedies..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || !user}
                    className="flex-1 py-2 sm:py-2.5 pl-3 sm:pl-4 pr-8 sm:pr-10 text-sm sm:text-base rounded-full border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.9)] focus-visible:ring-lens-purple focus-visible:border-lens-purple bg-white/90 backdrop-blur-md transition-all duration-200 hover:shadow-[0_2px_20px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.9)]"
                  />
                  {inputMessage.length > 0 && (
                    <Button 
                      onClick={() => setInputMessage('')}
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-7 sm:w-7 rounded-full hover:bg-gray-100/80"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputMessage.trim() || !user}
                  className="rounded-full h-9 w-9 sm:h-10 sm:w-10 p-0 bg-lens-purple hover:bg-lens-purple-light shadow-sm transition-all duration-200 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </Button>
              </div>
              {!user && (
                <div className="mt-2 sm:mt-3 max-w-2xl mx-auto">
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-amber-800 text-center">Please sign in to use the herbal medicine consultant</p>
                  </div>
                </div>
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
    <div className="min-h-screen pt-[72px] bg-white"> {/* Added explicit padding-top to account for fixed navbar */}
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 overflow-hidden mt-0"> {/* Fixed overflow and margin */}
        <div className="space-y-16">
          {/* Hero Section with 3D effect */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl -mt-6 lg:-mt-12 lg:pl-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                <span className="text-lens-purple">Traditional</span> Herbal Medicine
              </h1>
              <p className="mt-5 text-lg text-gray-600">
                Your guide to traditional herbal remedies. Learn about natural treatments, their preparation, and uses.
              </p>

              {/* Statistics Section */}
              <motion.div 
                className="mt-10 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {[ 
                  { icon: HeartPulse, label: 'Diseases Covered', value: 49, color: 'text-red-500' },
                  { icon: Leaf, label: 'Herbal Remedies', value: 49, color: 'text-green-500' },
                  { icon: ClipboardList, label: 'Preparation Methods', value: 49, color: 'text-blue-500' },
                ].map((stat, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg shadow-sm flex flex-col items-center">
                    <stat.icon className={`w-7 h-7 mb-1.5 ${stat.color}`} />
                    <p className="text-xl font-semibold text-gray-700">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
              
              {/* Chat button - prominent call to action */}
              <div className="mt-10">
                <Button 
                  className="bg-lens-purple hover:bg-lens-purple-light w-full md:w-auto text-lg py-6 px-8 shadow-lg transition-all duration-300 hover:scale-102"
                  onClick={() => setIsChatOpen(true)}
                >
                  <span className="flex items-center gap-3 font-medium">
                    <MessageCircle className="h-5 w-5" />
                    Find Herbal Remedies
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </span>
                </Button>
              </div>
              

            </motion.div>
            
            {/* Bold and visually striking herbal showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mt-12 lg:mt-0 lg:ml-4 lg:mr-auto w-full max-w-[85vw] sm:max-w-[400px] lg:max-w-[486px] overflow-hidden sm:overflow-visible lg:overflow-visible" /* Mobile constraints with original desktop design */
            >
              {/* Dynamic background elements */}
              <div className="absolute -inset-6 sm:-inset-10 lg:-inset-14 overflow-hidden"> {/* Mobile constraints with original desktop values */}
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
                  <div className="absolute inset-[-20px] sm:inset-[-30px] lg:inset-[-45px] bg-gradient-to-tr from-purple-100 via-teal-100 to-indigo-50 transform rotate-45 rounded-3xl -z-0"></div>
                  
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
                  <div className="relative z-10 p-3 sm:p-4 lg:p-6"> {/* Original p-6 for desktop */}
                    {/* Angelic glow ring - consistent, non-dimming */}
                    <div className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_5px_rgba(255,255,255,0.7),0_0_30px_15px_rgba(126,58,242,0.3)]"></div>
                    
                    {/* Main image container with divine border */}
                    <div className="relative overflow-hidden rounded-full border-4 sm:border-5 lg:border-8 border-gradient-to-r from-lens-purple/80 via-white/90 to-indigo-300/80 shadow-xl"> {/* Original border-8 for desktop */}
                      {/* Accent layer */}
                      <div className="absolute inset-0 border-3 border-lens-purple/20 rounded-full z-20 pointer-events-none"></div> 
                      
                      {/* Actual image */}
                      <img 
                        src="/assets/herbal.png" 
                        alt="Herbal Medicine" 
                        className="w-full h-auto transform scale-100 z-10" 
                      />
                      
                      {/* Divine light from above effect - consistent */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/40 via-transparent to-lens-purple/10 mix-blend-soft-light z-30"></div>
                      
                      {/* Subtle light reflection - single, fixed positioning */}
                      <div className="absolute right-0 top-0 w-1/3 h-1/3 bg-white/20 rounded-full blur-md mix-blend-overlay z-40"></div>
                    </div>
                  </div>
                  
                  {/* Smaller decorative accent elements - consistent, static styling */}
                  <div className="absolute top-0 right-0 w-11 h-11 bg-gradient-to-br from-lens-purple/40 to-indigo-300/20 rounded-full blur-sm z-10 shadow-[0_0_10px_5px_rgba(126,58,242,0.15)]"></div> 
                  <div className="absolute bottom-4 left-0 w-12 h-12 bg-gradient-to-tr from-teal-400/25 to-teal-200/15 rounded-full blur-sm z-10 shadow-[0_0_10px_5px_rgba(20,184,166,0.15)]"></div> 
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
                  className="absolute -bottom-3 -right-3 sm:-bottom-5 sm:-right-5 lg:-bottom-8 lg:-right-8 w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 bg-gradient-to-br from-amber-400/70 to-amber-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm"  
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
                    <Flower className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-amber-700/90" /> {/* Original icon size for desktop */}
                  </motion.div>
                </motion.div>
                
                <motion.div
                  className="absolute -top-3 -left-3 sm:-top-5 sm:-left-5 lg:-top-8 lg:-left-8 w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 bg-gradient-to-tl from-emerald-500/70 to-green-200/50 rounded-full z-20 flex items-center justify-center shadow-lg backdrop-blur-sm" 
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
                    <Leaf className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-700/90" />
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
          
          {/* True floating action button that won't cause overflow */}
          <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-30">
            <div className="relative">
              {/* Main FAB with simplified design */}
              <Button
                onClick={() => setIsChatOpen(true)}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-lens-purple hover:bg-lens-purple-light shadow-lg flex items-center justify-center border-2 border-white/20 transition-all duration-300"
                aria-label="Chat with Nature's Wisdom"
              >
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-30"></div>
                
                {/* Icon */}
                <MessageCircle className="h-6 w-6 text-white" />
              </Button>
              
              {/* Tooltip - only on larger screens */}
              <div className="hidden md:block absolute bottom-full right-0 mb-2 whitespace-nowrap">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-sm font-medium text-lens-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  Chat with Nature's Wisdom
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HerbalMedicine;
