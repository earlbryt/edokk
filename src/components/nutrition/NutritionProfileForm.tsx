import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { NutritionProfile, getNutritionProfile, saveNutritionProfile } from "@/services/nutritionService";

interface NutritionProfileFormProps {
  onProfileUpdated?: () => void;
}

// Activity level options
const activityLevels = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "light", label: "Lightly Active (light exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderately Active (moderate exercise 3-5 days/week)" },
  { value: "active", label: "Active (hard exercise 6-7 days/week)" },
  { value: "very_active", label: "Very Active (very hard exercise & physical job)" }
];

// Diet restrictions options
const dietaryRestrictions = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "dairy_free", label: "Dairy-Free" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" }
];

// Health conditions options
const healthConditions = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "Hypertension" },
  { value: "heart_disease", label: "Heart Disease" },
  { value: "high_cholesterol", label: "High Cholesterol" },
  { value: "ibs", label: "Irritable Bowel Syndrome" }
];

// Health goals options
const healthGoals = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "weight_gain", label: "Weight Gain" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "general_health", label: "Improve General Health" },
  { value: "energy", label: "Increase Energy" },
  { value: "sports_performance", label: "Improve Sports Performance" }
];

// Common food allergies
const commonAllergies = [
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "peanuts", label: "Peanuts" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "soy", label: "Soy" },
  { value: "wheat", label: "Wheat" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" }
];

const NutritionProfileForm: React.FC<NutritionProfileFormProps> = ({ onProfileUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [profile, setProfile] = useState<NutritionProfile>({
    user_id: user?.id,
    age: undefined,
    gender: undefined,
    weight: undefined,
    height: undefined,
    activity_level: undefined,
    dietary_restrictions: [],
    health_conditions: [],
    health_goals: [],
    allergies: []
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await getNutritionProfile(user!.id);
      
      if (data) {
        setProfile(data);
      } else {
        setProfile(prev => ({ ...prev, user_id: user!.id }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your nutrition profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      await saveNutritionProfile({
        ...profile,
        user_id: user.id
      });
      
      toast({
        title: "Profile Updated",
        description: "Your nutrition profile has been saved successfully.",
      });
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your nutrition profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value === '' ? undefined : isNaN(Number(value)) ? value : Number(value)
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (category: string, value: string, checked: boolean) => {
    setProfile(prev => {
      const currentArray = prev[category as keyof NutritionProfile] as string[] || [];
      
      return {
        ...prev,
        [category]: checked
          ? [...currentArray, value]
          : currentArray.filter(item => item !== value)
      };
    });
  };

  const isChecked = (category: string, value: string) => {
    const currentArray = profile[category as keyof NutritionProfile] as string[] || [];
    return currentArray.includes(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-lens-purple" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="1"
                max="120"
                value={profile.age || ''}
                onChange={handleInputChange}
                placeholder="Enter your age"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={profile.gender}
                onValueChange={handleSelectChange('gender')}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="20"
                max="500"
                step="0.1"
                value={profile.weight || ''}
                onChange={handleInputChange}
                placeholder="Enter your weight in kg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                min="50"
                max="250"
                value={profile.height || ''}
                onChange={handleInputChange}
                placeholder="Enter your height in cm"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Activity Level</h3>
          <div className="space-y-2">
            <Label htmlFor="activity_level">How active are you?</Label>
            <Select
              value={profile.activity_level}
              onValueChange={handleSelectChange('activity_level')}
            >
              <SelectTrigger id="activity_level">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                {activityLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Health Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthGoals.map(goal => (
              <div key={goal.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`goal-${goal.value}`}
                  checked={isChecked('health_goals', goal.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('health_goals', goal.value, checked as boolean)
                  }
                />
                <Label htmlFor={`goal-${goal.value}`} className="cursor-pointer">
                  {goal.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dietary Restrictions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dietaryRestrictions.map(restriction => (
              <div key={restriction.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`restriction-${restriction.value}`}
                  checked={isChecked('dietary_restrictions', restriction.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('dietary_restrictions', restriction.value, checked as boolean)
                  }
                />
                <Label htmlFor={`restriction-${restriction.value}`} className="cursor-pointer">
                  {restriction.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Health Conditions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {healthConditions.map(condition => (
              <div key={condition.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`condition-${condition.value}`}
                  checked={isChecked('health_conditions', condition.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('health_conditions', condition.value, checked as boolean)
                  }
                />
                <Label htmlFor={`condition-${condition.value}`} className="cursor-pointer">
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Food Allergies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {commonAllergies.map(allergy => (
              <div key={allergy.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergy-${allergy.value}`}
                  checked={isChecked('allergies', allergy.value)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('allergies', allergy.value, checked as boolean)
                  }
                />
                <Label htmlFor={`allergy-${allergy.value}`} className="cursor-pointer">
                  {allergy.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-lens-purple hover:bg-lens-purple-light"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </div>
    </form>
  );
};

export default NutritionProfileForm;
