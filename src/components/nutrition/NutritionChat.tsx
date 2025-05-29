import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SendIcon, Loader2Icon, ChevronsDown, Salad, User, Clipboard, BarChart3, Calendar, PieChart, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { NutritionMessage, getNutritionProfile, getChatHistory, sendChatMessage, getMealEntries, MealTrackingEntry } from "@/services/nutritionService";
// Placeholder components in case the actual ones aren't available yet
const NutritionProfileForm = ({ onProfileUpdated }: { onProfileUpdated?: () => void }) => (
  <div className="p-4 bg-gray-50 rounded-lg text-center">
    <h3 className="text-lg font-medium mb-2">Nutrition Profile</h3>
    <p className="text-gray-600 mb-4">Complete your profile to get personalized nutrition advice.</p>
    <Button 
      onClick={() => onProfileUpdated && onProfileUpdated()}
      className="bg-lens-purple hover:bg-lens-purple-light"
    >
      Start Profile
    </Button>
  </div>
);

const MealTracker = () => (
  <div className="p-4 bg-gray-50 rounded-lg text-center">
    <h3 className="text-lg font-medium mb-2">Meal Tracker</h3>
    <p className="text-gray-600 mb-4">Log your meals to track your nutrition intake.</p>
    <Button 
      className="bg-lens-purple hover:bg-lens-purple-light"
    >
      Start Tracking
    </Button>
  </div>
);

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
  const [mealEntries, setMealEntries] = useState<MealTrackingEntry[]>([]);
  const [mealDataLoading, setMealDataLoading] = useState(false);
  const [showMealSummary, setShowMealSummary] = useState(false);
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
      loadRecentMeals();
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
  
  const loadRecentMeals = async () => {
    if (!user?.id) return;
    
    setMealDataLoading(true);
    try {
      // Get meals from the last 7 days
      const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");
      const data = await getMealEntries(user.id, startDate, endDate);
      setMealEntries(data);
    } catch (error) {
      console.error("Failed to load meal entries:", error);
    } finally {
      setMealDataLoading(false);
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
      // Include meal data context in the request
      let mealContext = {};
      if (mealEntries.length > 0) {
        // Add meal data summary to provide context to the AI
        mealContext = {
          meal_data: mealEntries.slice(0, 10), // Only send the 10 most recent meals
          meal_count: mealEntries.length,
          date_range: {
            start: mealEntries.length > 0 ? mealEntries[mealEntries.length - 1].date : null,
            end: mealEntries.length > 0 ? mealEntries[0].date : null
          }
        };
      }
      
      console.log('Sending message to nutrition chat with meal context:', { 
        userId: user.id, 
        message: inputMessage,
        hasMealData: mealEntries.length > 0
      });
      
      // @ts-ignore - We've updated the function to accept a third parameter for meal context
      const response = await sendChatMessage(user.id, inputMessage, mealContext);
      console.log('Response from nutrition chat:', response);
      
      if (response && response.success) {
        setMessages(prev => [...prev, { 
          role: "assistant" as const, 
          content: response.message 
        }]);
        
        setHasProfile(response.has_profile);
        
        // If the response mentions meal patterns and we haven't shown meal summary yet
        if (response.message.toLowerCase().includes("meal") && 
            !showMealSummary && mealEntries.length > 0) {
          setShowMealSummary(true);
        }
        
        if (!response.has_profile) {
          toast({
            title: "Tip: Complete your nutrition profile",
            description: "For personalized advice, complete your nutrition profile in the Profile tab.",
            duration: 5000,
          });
        }
      } else {
        console.error('Invalid response format:', response);
        throw new Error(response?.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add assistant message to indicate error
      setMessages(prev => [...prev, { 
        role: "assistant" as const, 
        content: "I'm sorry, I'm having trouble connecting to the nutrition service right now. Please try again later." 
      }]);
      
      toast({
        title: "Connection Error",
        description: "Could not reach the nutrition service. Please check your connection and try again.",
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

  // Function to calculate nutrition stats from meal entries
  const calculateNutritionStats = () => {
    if (mealEntries.length === 0) return null;
    
    // Calculate averages
    const caloriesValues = mealEntries.filter(entry => entry.calories).map(entry => entry.calories as number);
    const proteinValues = mealEntries.filter(entry => entry.protein_g).map(entry => entry.protein_g as number);
    const carbsValues = mealEntries.filter(entry => entry.carbs_g).map(entry => entry.carbs_g as number);
    const fatValues = mealEntries.filter(entry => entry.fat_g).map(entry => entry.fat_g as number);
    
    // Only return stats if we have enough data
    if (caloriesValues.length === 0) return null;
    
    const avgCalories = caloriesValues.reduce((sum, val) => sum + val, 0) / caloriesValues.length;
    const avgProtein = proteinValues.length > 0 ? proteinValues.reduce((sum, val) => sum + val, 0) / proteinValues.length : 0;
    const avgCarbs = carbsValues.length > 0 ? carbsValues.reduce((sum, val) => sum + val, 0) / carbsValues.length : 0;
    const avgFat = fatValues.length > 0 ? fatValues.reduce((sum, val) => sum + val, 0) / fatValues.length : 0;
    
    // Count meals by type
    const mealTypeCounts: Record<string, number> = {};
    mealEntries.forEach(entry => {
      const type = entry.meal_type;
      mealTypeCounts[type] = (mealTypeCounts[type] || 0) + 1;
    });
    
    return {
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein * 10) / 10,
      avgCarbs: Math.round(avgCarbs * 10) / 10,
      avgFat: Math.round(avgFat * 10) / 10,
      mealTypeCounts,
      totalEntries: mealEntries.length
    };
  };
  
  const nutritionStats = calculateNutritionStats();
  
  return (
    <Card className="w-full border-0 shadow-md">
      <CardHeader className="py-3 bg-gradient-to-r from-emerald-50 to-lens-purple/5 rounded-t-lg border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-emerald-100">
            <AvatarFallback className="bg-emerald-100 text-emerald-700">
              <Salad className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Nutrition Assistant
              <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                AI Powered
              </Badge>
            </CardTitle>
            <CardDescription>Get guidance based on your actual meal data</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {/* Show meal data context if we have meal entries */}
      {showMealSummary && nutritionStats && (
        <div className="px-4 py-3 bg-emerald-50/50 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-emerald-800 flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" /> 
              Based on your recent {nutritionStats.totalEntries} meal entries
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
              onClick={() => setShowMealSummary(false)}
            >
              Hide
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="bg-white rounded p-2 text-center">
              <p className="text-xs text-gray-500">Daily Avg</p>
              <p className="font-semibold text-emerald-700">{nutritionStats.avgCalories} kcal</p>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <p className="text-xs text-gray-500">Protein</p>
              <p className="font-semibold text-emerald-700">{nutritionStats.avgProtein}g</p>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="font-semibold text-emerald-700">{nutritionStats.avgCarbs}g</p>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <p className="text-xs text-gray-500">Fat</p>
              <p className="font-semibold text-emerald-700">{nutritionStats.avgFat}g</p>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
        
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

            {/* Suggested questions that reference meal data if available */}
            {messages.length < 3 && (
              <div className="mt-4 mb-2">
                <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {mealEntries.length > 0 ? (
                    // Questions that reference meal data
                    <>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                        onClick={() => handleQuestionClick("What nutritional improvements can I make based on my meal log?")}>
                        Improve my nutrition
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                        onClick={() => handleQuestionClick("Am I getting enough protein based on my logged meals?")}>
                        Protein intake
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                        onClick={() => handleQuestionClick("What's my calorie intake pattern?")}>
                        Calorie analysis
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                        onClick={() => handleQuestionClick("Suggest meals similar to what I usually eat but healthier")}>
                        Healthier alternatives
                      </Badge>
                    </>
                  ) : (
                    // Generic questions if no meal data
                    suggestedQuestions.slice(0, 4).map((question, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer bg-white hover:bg-lens-purple/5 transition-colors"
                        onClick={() => handleQuestionClick(question)}
                      >
                        {question}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
          
      </CardContent>
      
      <CardFooter className="p-4 pt-2 border-t bg-gray-50/50">
        <div className="flex w-full gap-2">
          <Textarea
            placeholder={mealEntries.length > 0 
              ? "Ask about your nutrition or meal patterns..." 
              : "Ask your nutrition question..."}
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
        
        {/* Meal data status indicator */}
        {!mealDataLoading && mealEntries.length > 0 && (
          <div className="w-full mt-2 flex justify-center">
            <Badge 
              variant="outline" 
              className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs gap-1"
              onClick={() => setShowMealSummary(!showMealSummary)}
            >
              <Calendar className="h-3 w-3" />
              {mealEntries.length} meal entries analyzed
              {showMealSummary ? (
                <ChevronsDown className="h-3 w-3" />
              ) : (
                <PieChart className="h-3 w-3" />
              )}
            </Badge>
          </div>
        )}
        
        {mealDataLoading && (
          <div className="w-full mt-2 flex justify-center">
            <Badge variant="outline" className="bg-gray-50 text-gray-500 text-xs gap-1">
              <Loader2Icon className="h-3 w-3 animate-spin" />
              Loading meal data...
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default NutritionChat;
