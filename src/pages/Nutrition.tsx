import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { motion } from "framer-motion";
import { ArrowRight, Apple, Beef, Fish, Wheat, Salad, PlusCircle, BarChart3, Calendar, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import NutritionChat from "@/components/nutrition/NutritionChat";
import MealTracker from "@/components/nutrition/MealTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Diet plan types and data
type DietaryRestriction = "None" | "Vegetarian" | "Vegan" | "Gluten-Free" | "Dairy-Free";
type HealthCondition = "None" | "Diabetes" | "Hypertension" | "Heart Disease" | "Weight Management";

interface MealPlan {
  id: string;
  name: string;
  description: string;
  healthCondition: HealthCondition;
  restrictions: DietaryRestriction[];
  image: string;
  backgroundColor: string;
  price: number;
  duration: string;
}

// Sample meal plans
const mealPlans: MealPlan[] = [
  {
    id: "1",
    name: "Balanced Nutrition Plan",
    description: "A well-rounded diet plan with balanced macronutrients for general health maintenance",
    healthCondition: "None",
    restrictions: ["None"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#e6f7f2]", // Light mint green
    price: 49.99,
    duration: "4 weeks"
  },
  {
    id: "2",
    name: "Diabetes Management",
    description: "Low glycemic index foods with portion control to help maintain stable blood sugar levels",
    healthCondition: "Diabetes",
    restrictions: ["None"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#fdf0e6]", // Light peach
    price: 59.99,
    duration: "4 weeks"
  },
  {
    id: "3",
    name: "Heart-Healthy Diet",
    description: "Low sodium, low fat diet plan focusing on heart-healthy foods and omega-3 rich options",
    healthCondition: "Heart Disease",
    restrictions: ["None"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#f0f7fd]", // Light blue
    price: 54.99,
    duration: "4 weeks"
  },
  {
    id: "4",
    name: "Vegetarian Lifestyle",
    description: "Plant-based meal plans rich in protein and essential nutrients without meat",
    healthCondition: "None",
    restrictions: ["Vegetarian"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#f7f7f7]", // Light gray
    price: 44.99,
    duration: "4 weeks"
  },
  {
    id: "5",
    name: "Gluten-Free Essential",
    description: "Carefully crafted meal plans excluding all gluten sources while maintaining nutritional balance",
    healthCondition: "None",
    restrictions: ["Gluten-Free"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#e6f7f2]", // Light mint green
    price: 49.99,
    duration: "4 weeks"
  },
  {
    id: "6",
    name: "Weight Management",
    description: "Calorie-controlled meal plans with optimal protein intake to support healthy weight loss",
    healthCondition: "Weight Management",
    restrictions: ["None"],
    image: "/assets/nutrition.png",
    backgroundColor: "bg-[#fdf0e6]", // Light peach
    price: 54.99,
    duration: "4 weeks"
  }
];

// Filter options
const healthConditions: HealthCondition[] = ["None", "Diabetes", "Hypertension", "Heart Disease", "Weight Management"];
const dietaryRestrictions: DietaryRestriction[] = ["None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"];

// Diet plan card component
interface MealPlanCardProps {
  plan: MealPlan;
}

const MealPlanCard: React.FC<MealPlanCardProps> = ({ plan }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card 
        className={`overflow-hidden transition-all ${plan.backgroundColor} border-0 shadow-md hover:shadow-xl`}
      >
        <div className="flex flex-col md:flex-row h-full">
          <div className="flex-1 p-6">
            <CardHeader className="p-0">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <Badge className="bg-lens-purple hover:bg-lens-purple-light">
                  {plan.duration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 mt-2">
              <p className="text-gray-600">{plan.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {plan.healthCondition !== "None" && (
                  <Badge variant="outline" className="bg-white/70 text-lens-purple border-lens-purple">
                    {plan.healthCondition}
                  </Badge>
                )}
                
                {plan.restrictions.map(restriction => 
                  restriction !== "None" && (
                    <Badge key={restriction} variant="outline" className="bg-white/70 text-emerald-600 border-emerald-600">
                      {restriction}
                    </Badge>
                  )
                )}
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  GH₵{plan.price.toFixed(2)}
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-0 mt-4">
              <Button 
                className="w-full md:w-auto bg-lens-purple hover:bg-lens-purple-light text-white"
              >
                <motion.div
                  className="flex items-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Get This Plan
                </motion.div>
              </Button>
            </CardFooter>
          </div>
          <div className="flex items-center justify-center p-6 md:w-2/5 relative overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10"
            >
              <img 
                src={plan.image} 
                alt={plan.name}
                className="h-52 w-auto object-contain transition-transform"
              />
            </motion.div>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-full scale-90 opacity-50" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Feature card for nutrition services
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-6 rounded-xl ${color} shadow-md`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </motion.div>
  );
};

// Main component
const Nutrition = () => {

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 overflow-hidden mt-10 md:mt-0">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start lg:items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl -mt-6 lg:-mt-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                <span className="text-lens-purple">Personalized</span> Nutrition Plans
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Get customized meal plans tailored to your health goals, dietary preferences, and specific health conditions.
              </p>
              <div className="mt-8 flex gap-4">
                <Button className="bg-lens-purple hover:bg-lens-purple-light">
                  Start Health Assessment
                </Button>
                <Button variant="outline" className="border-lens-purple text-lens-purple hover:bg-lens-purple/5">
                  Learn More
                </Button>
              </div>
              
              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-purple-100">
                  <p className="text-3xl font-bold text-lens-purple">100+</p>
                  <p className="text-sm text-gray-600">Meal Options</p>
                </div>
                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-purple-100">
                  <p className="text-3xl font-bold text-lens-purple">24/7</p>
                  <p className="text-sm text-gray-600">Dietitian Support</p>
                </div>
                <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-purple-100">
                  <p className="text-3xl font-bold text-lens-purple">15k+</p>
                  <p className="text-sm text-gray-600">Happy Clients</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mt-12 lg:mt-0 lg:ml-auto"
            >
              {/* Hexagonal frame with image */}
              <div className="relative">
                {/* Hexagonal background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-lens-purple/10 transform rotate-45 rounded-3xl -z-0"></div>
                
                {/* Image container with mask */}
                <div className="relative z-10 p-6">
                  <div className="relative overflow-hidden rounded-full border-8 border-white/80 shadow-xl">
                    <img 
                      src="/assets/nutrition.png" 
                      alt="Nutrition and Diet Planning" 
                      className="w-full h-auto transform scale-110"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent"></div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <motion.div
                  className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/30 rounded-full z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute bottom-4 left-0 w-20 h-20 bg-lens-purple/20 rounded-full z-10"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.9, 0.6]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              
              {/* Small decorative food icons */}
              <motion.div 
                className="absolute -bottom-8 right-12 p-3 bg-white rounded-full shadow-lg z-20"
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                <Apple className="w-6 h-6 text-emerald-500" />
              </motion.div>
              <motion.div 
                className="absolute -left-4 top-1/3 p-3 bg-white rounded-full shadow-lg z-20"
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                <Salad className="w-6 h-6 text-emerald-600" />
              </motion.div>
            </motion.div>
          </div>
          
          
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900">Our Nutrition Services</h2>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive nutrition solutions tailored to your unique health needs
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <FeatureCard 
              title="Personalized Meal Plans" 
              description="Custom meal plans based on your health goals, preferences, and dietary needs"
              icon={<Apple className="w-6 h-6 text-lens-purple" />}
              color="bg-[#e6f7f2]"
            />
            <FeatureCard 
              title="Dietary Analysis" 
              description="Comprehensive analysis of your current diet with detailed improvement recommendations"
              icon={<Salad className="w-6 h-6 text-emerald-600" />}
              color="bg-[#fdf0e6]"
            />
            <FeatureCard 
              title="Health Condition Support" 
              description="Specialized nutrition guidance for managing specific health conditions"
              icon={<Beef className="w-6 h-6 text-red-500" />}
              color="bg-[#f0f7fd]"
            />
            <FeatureCard 
              title="Food Allergen Management" 
              description="Expert guidance on managing food allergies and intolerances safely"
              icon={<Wheat className="w-6 h-6 text-amber-600" />}
              color="bg-[#f7f7f7]"
            />
          </motion.div>
          
          {/* Placeholder for removed section */}
          
          {/* Call to Action */}
          {/* <motion.div 
            className="bg-gradient-to-r from-lens-purple/10 to-purple-100 rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Ready to transform your nutrition journey?
            </h2>
            <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
              Get started with a personalized nutrition assessment and receive a custom plan tailored to your specific needs.
            </p>
            <Button 
              size="lg" 
              className="mt-6 bg-lens-purple hover:bg-lens-purple-light"
            >
              <span className="flex items-center gap-2">
                Start Your Assessment <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </motion.div> */} 
        </div>
        
        {/* Nutrition Dashboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16"
        >
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Your Nutrition Dashboard</h2>
            <p className="mt-4 text-lg text-gray-600">
              Track your meals, analyze your nutrition intake, and get personalized AI guidance based on your eating habits
            </p>
          </div>
          
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-lens-purple/5 border-b">
              <CardTitle className="text-xl flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-emerald-600" />
                Nutrition Tracker & Assistant
              </CardTitle>
              <CardDescription>
                Log your meals and get AI-powered nutrition advice based on your actual eating habits
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              <Tabs defaultValue="tracker" className="w-full">
                <TabsList className="w-full rounded-none border-b grid grid-cols-2">
                  <TabsTrigger value="tracker" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none py-3">
                    <Calendar className="h-4 w-4 mr-2" /> Meal Tracker
                  </TabsTrigger>
                  <TabsTrigger value="assistant" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:shadow-none py-3">
                    <MessageSquare className="h-4 w-4 mr-2" /> Nutrition Assistant
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tracker" className="m-0">
                  <div className="p-0">
                    <MealTracker />
                  </div>
                </TabsContent>
                
                <TabsContent value="assistant" className="m-0">
                  <div className="p-0">
                    <NutritionChat />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Nutrition Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-emerald-50 to-lens-purple/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nutrition Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                      <Salad className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span>Track calories and macronutrients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                      <Salad className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span>Review your weekly meal patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                      <Salad className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span>Get personalized nutritional guidance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-lens-purple/5">
                <CardTitle className="text-lg">Nutritional Impact</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-700 text-sm">
                  Tracking your nutrition can impact health markers:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Blood Pressure</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Energy Levels</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recovery</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-lens-purple/5">
                <CardTitle className="text-lg">AI Assistant Benefits</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-lens-purple/20 p-1 mt-0.5">
                      <MessageSquare className="h-3 w-3 text-lens-purple" />
                    </div>
                    <span>Analyzes your logged meals for patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-lens-purple/20 p-1 mt-0.5">
                      <MessageSquare className="h-3 w-3 text-lens-purple" />
                    </div>
                    <span>Suggests dietary improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-lens-purple/20 p-1 mt-0.5">
                      <MessageSquare className="h-3 w-3 text-lens-purple" />
                    </div>
                    <span>Answers nutrition questions with context</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Nutrition;
