import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Calendar, Clock, Utensils, ChevronDown, Trash2 } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { MealTrackingEntry, saveMealEntry, getMealEntries } from "@/services/nutritionService";

// Meal types
const mealTypes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" }
];

// Initial entry form
const initialEntry: MealTrackingEntry = {
  date: format(new Date(), "yyyy-MM-dd"),
  meal_type: "breakfast",
  foods: [],
  calories: undefined,
  protein_g: undefined,
  carbs_g: undefined,
  fat_g: undefined,
  notes: ""
};

const MealTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState("add");
  const [entries, setEntries] = useState<MealTrackingEntry[]>([]);
  const [newEntry, setNewEntry] = useState<MealTrackingEntry>({ ...initialEntry });
  const [foodItems, setFoodItems] = useState<{ name: string; amount: string }[]>([
    { name: "", amount: "" }
  ]);

  useEffect(() => {
    if (user?.id) {
      loadEntries();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user?.id) return;
    
    try {
      const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const endDate = format(new Date(), "yyyy-MM-dd");
      const data = await getMealEntries(user.id, startDate, endDate);
      setEntries(data);
    } catch (error) {
      console.error("Error loading meal entries:", error);
      toast({
        title: "Error",
        description: "Failed to load your meal entries.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setNewEntry(prev => ({
      ...prev,
      [name]: name === 'notes' 
        ? value 
        : (value === '' ? undefined : isNaN(Number(value)) ? value : Number(value))
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFoodItemChange = (index: number, field: 'name' | 'amount', value: string) => {
    const updatedItems = [...foodItems];
    updatedItems[index][field] = value;
    setFoodItems(updatedItems);
  };

  const addFoodItem = () => {
    setFoodItems(prev => [...prev, { name: "", amount: "" }]);
  };

  const removeFoodItem = (index: number) => {
    if (foodItems.length === 1) return;
    setFoodItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    // Filter out empty food items
    const validFoodItems = foodItems.filter(item => item.name.trim() !== "");
    
    if (validFoodItems.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one food item.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      await saveMealEntry({
        ...newEntry,
        user_id: user.id,
        foods: validFoodItems
      });
      
      toast({
        title: "Meal Logged",
        description: "Your meal has been saved successfully.",
      });
      
      // Reset form
      setNewEntry({ ...initialEntry });
      setFoodItems([{ name: "", amount: "" }]);
      
      // Reload entries
      await loadEntries();
      
      // Switch to history tab
      setCurrentTab("history");
    } catch (error) {
      console.error("Error saving meal entry:", error);
      toast({
        title: "Error",
        description: "Failed to save your meal entry.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-lens-purple" />
      </div>
    );
  }

  // Group entries by date
  const entriesByDate: Record<string, MealTrackingEntry[]> = {};
  entries.forEach(entry => {
    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = [];
    }
    entriesByDate[entry.date].push(entry);
  });

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="add" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Meal
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> History
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="add" className="m-0">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={newEntry.date}
                  onChange={handleEntryChange}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meal_type">Meal Type</Label>
                <Select
                  value={newEntry.meal_type}
                  onValueChange={handleSelectChange('meal_type')}
                >
                  <SelectTrigger id="meal_type">
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Food Items</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addFoodItem}
                  className="text-lens-purple border-lens-purple/30 hover:bg-lens-purple/5"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {foodItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Food name"
                      value={item.name}
                      onChange={(e) => handleFoodItemChange(index, 'name', e.target.value)}
                      className="flex-grow"
                    />
                    <Input
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleFoodItemChange(index, 'amount', e.target.value)}
                      className="w-1/3"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFoodItem(index)}
                      disabled={foodItems.length === 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories (kcal)</Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  min="0"
                  value={newEntry.calories || ''}
                  onChange={handleEntryChange}
                  placeholder="Optional"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="protein_g">Protein (g)</Label>
                <Input
                  id="protein_g"
                  name="protein_g"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newEntry.protein_g || ''}
                  onChange={handleEntryChange}
                  placeholder="Optional"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carbs_g">Carbs (g)</Label>
                <Input
                  id="carbs_g"
                  name="carbs_g"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newEntry.carbs_g || ''}
                  onChange={handleEntryChange}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={newEntry.notes || ''}
                onChange={handleEntryChange}
                placeholder="Optional notes about this meal"
                className="resize-none"
              />
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
                "Log Meal"
              )}
            </Button>
          </div>
        </form>
      </TabsContent>
      
      <TabsContent value="history" className="m-0">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-600">No meals logged yet</h3>
            <p className="text-gray-500 mt-1">Start tracking your meals to see your history</p>
            <Button 
              onClick={() => setCurrentTab("add")}
              variant="outline" 
              className="mt-4 border-lens-purple text-lens-purple hover:bg-lens-purple/5"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Your First Meal
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <motion.div 
                key={date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-lens-purple" />
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h3>
                
                <div className="space-y-2">
                  {entriesByDate[date].map((entry, index) => (
                    <Card key={entry.id || index} className="overflow-hidden border-0 shadow-sm">
                      <CardHeader className="py-3 px-4 bg-gray-50 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-lens-purple" />
                          <CardTitle className="text-base font-medium capitalize">
                            {entry.meal_type}
                          </CardTitle>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {entry.created_at ? format(new Date(entry.created_at), "h:mm a") : ""}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-1">Foods:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 pl-1">
                              {(entry.foods as { name: string; amount: string }[]).map((food, i) => (
                                <li key={i} className="mb-1">
                                  <span className="font-medium">{food.name}</span>
                                  {food.amount && <span className="text-gray-500"> - {food.amount}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {(entry.calories || entry.protein_g || entry.carbs_g || entry.fat_g) && (
                            <div className="flex flex-wrap gap-4 mt-1">
                              {entry.calories !== undefined && (
                                <div className="text-sm">
                                  <span className="font-medium">Calories:</span> {entry.calories} kcal
                                </div>
                              )}
                              {entry.protein_g !== undefined && (
                                <div className="text-sm">
                                  <span className="font-medium">Protein:</span> {entry.protein_g}g
                                </div>
                              )}
                              {entry.carbs_g !== undefined && (
                                <div className="text-sm">
                                  <span className="font-medium">Carbs:</span> {entry.carbs_g}g
                                </div>
                              )}
                              {entry.fat_g !== undefined && (
                                <div className="text-sm">
                                  <span className="font-medium">Fat:</span> {entry.fat_g}g
                                </div>
                              )}
                            </div>
                          )}
                          
                          {entry.notes && (
                            <div className="mt-1 text-sm">
                              <span className="font-medium">Notes:</span> {entry.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
            
            <div className="text-center pt-2">
              <Button
                onClick={() => setCurrentTab("add")}
                variant="outline"
                className="border-lens-purple text-lens-purple hover:bg-lens-purple/5"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Another Meal
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default MealTracker;
