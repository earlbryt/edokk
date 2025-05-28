import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SendIcon, Loader2Icon, ChevronsDown, Salad, User, Clipboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { NutritionMessage, getNutritionProfile, getChatHistory, sendChatMessage } from "@/services/nutritionService";
import NutritionProfileForm from "./NutritionProfileForm";
import MealTracker from "./MealTracker";

const suggestedQuestions = [
  "What's a balanced breakfast for weight loss?",
  "How can I increase my protein intake?",
  "What foods help reduce inflammation?",
  "Is intermittent fasting healthy?",
  "Best foods for energy during workouts?",
  "What's a balanced meal plan for diabetes?",
  "How much water should I drink daily?",
  "What snacks are good for heart health?"
];

const NutritionChat: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState<NutritionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [tab, setTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initial chat message for new conversations
  const initialMessages: NutritionMessage[] = [
    {
      role: "assistant",
      content: "👋 Hello! I'm Nutrient Sage, your personal nutrition guide. I can help with meal planning, diet advice, and answering nutrition questions. How can I assist you today?"
    }
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatHistory();
      checkProfile();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user?.id) return;
    
    try {
      const history = await getChatHistory(user.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages(initialMessages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages(initialMessages);
    }
  };

  const checkProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profile = await getNutritionProfile(user.id);
      setHasProfile(!!profile);
    } catch (error) {
      console.error("Failed to check profile:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing || !user?.id) return;
    
    const userMessage = {
      role: "user" as const,
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);
    
    try {
      const response = await sendChatMessage(user.id, inputMessage);
      
      if (response.success) {
        setMessages(prev => [...prev, { 
          role: "assistant" as const, 
          content: response.message 
        }]);
        
        setHasProfile(response.has_profile);
        
        if (!response.has_profile) {
          toast({
            title: "Tip: Complete your nutrition profile",
            description: "For personalized advice, complete your nutrition profile in the Profile tab.",
            duration: 5000,
          });
        }
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2Icon className="h-8 w-8 animate-spin text-lens-purple" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Nutrition Consultation</CardTitle>
          <CardDescription>
            Sign in to access personalized nutrition guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Salad className="h-16 w-16 mx-auto text-lens-purple opacity-70 mb-4" />
          <p className="mb-4 text-gray-600">
            Our nutrition assistant provides personalized diet advice, meal planning, and answers to your nutrition questions.
          </p>
          <Button className="bg-lens-purple hover:bg-lens-purple-light">
            Sign In to Access
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-lens-purple/5 rounded-t-lg border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-emerald-100">
            <AvatarImage src="/assets/nutrition-avatar.png" alt="Nutrient Sage" />
            <AvatarFallback className="bg-emerald-100 text-emerald-700">NS</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Nutrient Sage
              <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                AI Nutrition Guide
              </Badge>
            </CardTitle>
            <CardDescription>Your personal nutrition assistant</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="chat" value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Salad className="h-4 w-4" /> Chat
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" /> Meal Tracker
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="m-0">
          <CardContent className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin">
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-lens-purple text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content.split("\n").map((text, i) => (
                      <p key={i} className={`${i > 0 ? "mt-2" : ""}`}>
                        {text}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
              
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce delay-75">•</span>
                      <span className="animate-bounce delay-150">•</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {messages.length > 5 && (
              <div className="flex justify-center my-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollToBottom}
                  className="text-gray-500 hover:text-lens-purple"
                >
                  <ChevronsDown className="h-4 w-4 mr-1" /> Scroll to bottom
                </Button>
              </div>
            )}

            {/* Suggested questions */}
            {messages.length < 3 && (
              <div className="mt-4 mb-2">
                <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                      onClick={() => handleQuestionClick(question)}
                    >
                      {question}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 pt-2 border-t bg-gray-50/50">
            <div className="flex w-full gap-2">
              <Textarea
                placeholder="Ask your nutrition question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-10 resize-none"
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                className="bg-lens-purple hover:bg-lens-purple-light"
              >
                {isProcessing ? (
                  <Loader2Icon className="h-5 w-5 animate-spin" />
                ) : (
                  <SendIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="profile" className="m-0">
          <CardContent className="p-4">
            <NutritionProfileForm onProfileUpdated={() => setHasProfile(true)} />
          </CardContent>
        </TabsContent>
        
        <TabsContent value="meals" className="m-0">
          <CardContent className="p-4">
            <MealTracker />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default NutritionChat;
