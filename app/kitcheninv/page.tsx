"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit3,
  Plus,
  Trash2,
  ChefHat,
  AlertTriangle,
  UtensilsCrossed,
  Pencil,
  X,
  Loader2,
  RefreshCw,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

interface DishIngredient {
  name: string;
  amount: number;
  unit: string;
  ingredient_id?: string;
}

interface Dish {
  id: string;
  name: string;
  category?: string;
  created_at?: string;
  active?: boolean;
  ingredients: Record<string, number>;
}

interface Transaction {
  id: string;
  time: string;
  type: "make" | "add" | "edit" | "create_dish" | "delete_dish";
  details: string;
}

const unitOptions = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "l", label: "Liters (l)" },
  { value: "pcs", label: "Pieces (pcs)" },
];

const categoryOptions = [
  "grains", "meat", "seafood", "dairy", "vegetables", 
  "cooking", "spices", "sweeteners", "beverages", "others"
];

const dishCategoryOptions = [
  "Main Course", "Appetizer", "Dessert", "Beverage", 
  "Soup", "Salad", "Bread", "Rice", "Pasta"
];

export default function KitchenInventoryResort() {
  const [store, setStore] = useState<Ingredient[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<string>("");
  const [portions, setPortions] = useState(1);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: 0,
    unit: "g",
    category: "others",
  });
  const [newDish, setNewDish] = useState({
    name: "",
    category: "Main Course",
    ingredients: [] as DishIngredient[],
  });
  const [tempIngredient, setTempIngredient] = useState({ 
    name: "", 
    amount: 0, 
    unit: "g"
  });
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editTempIngredient, setEditTempIngredient] = useState({ name: "", amount: 0, unit: "g" });
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [loading, setLoading] = useState({
    store: true,
    dishes: true,
    cooking: false,
    saving: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter ingredients based on search
  const filteredIngredients = store.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load data from Supabase
  const loadInventory = async () => {
    try {
      setLoading(prev => ({ ...prev, store: true }));
      console.log("🚀 Loading inventory...");
      
      // Test connection
      const { data: testData, error: testError } = await supabase
        .from('kitchen_ingredients')
        .select('id')
        .limit(1);

      if (testError) {
        console.error("❌ Database connection error:", testError);
        setConnectionStatus({
          connected: false,
          message: "Database connection failed"
        });
        loadDemoData();
        return;
      }
      
      setConnectionStatus({
        connected: true,
        message: "Connected to database"
      });

      // Load ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('kitchen_ingredients')
        .select('*')
        .order('name');

      if (ingredientsError) {
        console.error("❌ Ingredients error:", ingredientsError);
        throw ingredientsError;
      }
      
      console.log(`✅ Loaded ${ingredients?.length || 0} ingredients`);
      setStore(ingredients || []);
      
      // Load dishes
      setLoading(prev => ({ ...prev, dishes: true }));
      
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (dishesError) {
        console.error("❌ Dishes error:", dishesError);
        throw dishesError;
      }

      console.log(`✅ Loaded ${dishesData?.length || 0} dishes`);

      // Load dish ingredients for each dish
      const dishPromises = (dishesData || []).map(async (dish) => {
        try {
          const { data: ingredientsData, error: dishIngError } = await supabase
            .from('dish_ingredients')
            .select(`
              quantity,
              unit,
              kitchen_ingredients!inner(name)
            `)
            .eq('dish_id', dish.id);

          if (dishIngError) {
            console.error(`⚠️ Error loading ingredients for ${dish.name}:`, dishIngError);
            return {
              id: dish.id,
              name: dish.name,
              category: dish.category,
              active: dish.active,
              created_at: dish.created_at,
              ingredients: {},
            };
          }

          const ingredients: Record<string, number> = {};
          ingredientsData?.forEach(item => {
            if (item.kitchen_ingredients?.name) {
              ingredients[item.kitchen_ingredients.name] = item.quantity;
            }
          });

          return {
            id: dish.id,
            name: dish.name,
            category: dish.category,
            active: dish.active,
            created_at: dish.created_at,
            ingredients,
          };
        } catch (error) {
          console.error(`❌ Error processing dish ${dish.name}:`, error);
          return {
            id: dish.id,
            name: dish.name,
            category: dish.category,
            active: dish.active,
            created_at: dish.created_at,
            ingredients: {},
          };
        }
      });

      const dishesWithIngredients = await Promise.all(dishPromises);
      setDishes(dishesWithIngredients);
      
      if (dishesWithIngredients.length > 0 && !selectedDish) {
        setSelectedDish(dishesWithIngredients[0].id);
      }

      toast.success("Inventory loaded");
      
    } catch (error: any) {
      console.error("❌ Error loading inventory:", error);
      toast.error(`Failed to load inventory: ${error?.message || "Unknown error"}`);
      
      loadDemoData();
    } finally {
      setLoading({ store: false, dishes: false, cooking: false, saving: false });
    }
  };

  // Load demo data
  const loadDemoData = () => {
    const demoIngredients: Ingredient[] = [
      { id: "1", name: "rice", quantity: 10000, unit: "g", category: "grains" },
      { id: "2", name: "chicken", quantity: 7000, unit: "g", category: "meat" },
      { id: "3", name: "fish", quantity: 4000, unit: "g", category: "seafood" },
      { id: "4", name: "egg", quantity: 200, unit: "pcs", category: "dairy" },
      { id: "5", name: "vegetables", quantity: 5000, unit: "g", category: "vegetables" },
    ];
    
    const demoDishes: Dish[] = [
      {
        id: "1",
        name: "Chicken Biryani",
        category: "Main Course",
        active: true,
        ingredients: { rice: 160, chicken: 180, oil: 10, spices: 8, salt: 5 }
      },
      {
        id: "2",
        name: "Fish Curry",
        category: "Main Course",
        active: true,
        ingredients: { fish: 150, spices: 6, oil: 10, tomato: 80, onion: 40 }
      },
    ];
    
    setStore(demoIngredients);
    setDishes(demoDishes);
    if (demoDishes.length > 0 && !selectedDish) {
      setSelectedDish(demoDishes[0].id);
    }
    
    setConnectionStatus({
      connected: false,
      message: "Using demo data"
    });
    
    toast.warning("Using demo data");
  };

  useEffect(() => {
    loadInventory();

    try {
      const channel = supabase
        .channel('kitchen-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'kitchen_ingredients' }, 
          () => loadInventory()
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'dishes' }, 
          () => loadInventory()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("❌ Error setting up real-time:", error);
    }
  }, []);

  function sanitizeNumberInput(value: string): number {
    if (value === "") return 0;
    const num = parseFloat(value) || 0;
    return num < 0 ? 0 : num;
  }

  // Cook dish logic
  async function makeDish(dishId: string, qty: number) {
    if (qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const dish = dishes.find((d) => d.id === dishId);
    if (!dish) {
      toast.error("Dish not found");
      return;
    }

    // Check stock availability
    const insufficient = Object.entries(dish.ingredients).filter(([ing, need]) => {
      const item = store.find((s) => s.name === ing);
      return !item || item.quantity < need * qty;
    });

    if (insufficient.length) {
      toast.error(`Insufficient stock for: ${insufficient.map(([k]) => k).join(", ")}`);
      return;
    }

    setLoading(prev => ({ ...prev, cooking: true }));

    try {
      if (!connectionStatus?.connected) {
        // Demo mode
        setStore(prev => prev.map(ing => {
          const need = dish.ingredients[ing.name] || 0;
          if (need) {
            const newQuantity = Math.max(0, ing.quantity - need * qty);
            return { ...ing, quantity: newQuantity };
          }
          return ing;
        }));
        
        toast.success(`Successfully cooked ${qty} ${dish.name}`);
        return;
      }

      // Real database update
      const updates = Object.entries(dish.ingredients).map(async ([ingName, need]) => {
        const ingredient = store.find(s => s.name === ingName);
        if (!ingredient) {
          console.warn(`Ingredient not found: ${ingName}`);
          return;
        }

        const newQuantity = Math.max(0, ingredient.quantity - need * qty);
        
        const { error } = await supabase
          .from('kitchen_ingredients')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', ingredient.id);

        if (error) {
          console.error(`Error updating ${ingName}:`, error);
          throw error;
        }

        // Log transaction
        await supabase
          .from('stock_transactions')
          .insert({
            type: 'consumption',
            ingredient_id: ingredient.id,
            dish_id: dishId,
            quantity: need * qty,
            unit: ingredient.unit,
            notes: `Cooked ${qty}× ${dish.name}`,
          });
      });

      await Promise.all(updates);

      toast.success(`Successfully cooked ${qty} ${dish.name}`);
      await loadInventory();

    } catch (error: any) {
      console.error("❌ Error cooking dish:", error);
      toast.error(error.message || "Failed to cook dish");
    } finally {
      setLoading(prev => ({ ...prev, cooking: false }));
    }
  }

  // Add ingredient
  async function addIngredient() {
    if (!newIngredient.name.trim()) {
      toast.error("Please enter ingredient name");
      return;
    }

    if (newIngredient.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const name = newIngredient.name.trim().toLowerCase();
    
    try {
      if (!connectionStatus?.connected) {
        const existingIndex = store.findIndex(i => i.name === name);
        if (existingIndex >= 0) {
          const updatedStore = [...store];
          updatedStore[existingIndex] = {
            ...updatedStore[existingIndex],
            quantity: updatedStore[existingIndex].quantity + newIngredient.quantity
          };
          setStore(updatedStore);
          toast.success(`Added ${newIngredient.quantity}${newIngredient.unit} to ${name}`);
        } else {
          setStore(prev => [...prev, {
            id: Date.now().toString(),
            name,
            quantity: newIngredient.quantity,
            unit: newIngredient.unit,
            category: newIngredient.category
          }]);
          toast.success(`Created new ingredient: ${name}`);
        }
        
        setNewIngredient({ name: "", quantity: 0, unit: "g", category: "others" });
        return;
      }

      // Real database operation - UPSERT
      const { error } = await supabase
        .from('kitchen_ingredients')
        .upsert({
          name,
          quantity: newIngredient.quantity,
          unit: newIngredient.unit,
          category: newIngredient.category,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success(`Saved ingredient: ${name}`);
      await loadInventory();
      setNewIngredient({ name: "", quantity: 0, unit: "g", category: "others" });

    } catch (error: any) {
      console.error("❌ Error adding ingredient:", error);
      toast.error(error.message || "Failed to add ingredient");
    }
  }

  // Delete ingredient
  async function deleteIngredient(ingredientId: string, name: string) {
    try {
      if (!connectionStatus?.connected) {
        setStore(prev => prev.filter(i => i.id !== ingredientId));
        toast.success(`Deleted ingredient: ${name}`);
        return;
      }

      const { error } = await supabase
        .from('kitchen_ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;

      toast.success(`Deleted ingredient: ${name}`);
      await loadInventory();
    } catch (error: any) {
      console.error("❌ Error deleting ingredient:", error);
      toast.error(error.message || "Failed to delete ingredient");
    }
  }

  // Update ingredient
  async function updateIngredient(ingredientId: string, updates: Partial<Ingredient>) {
    try {
      if (!connectionStatus?.connected) {
        setStore(prev => prev.map(item => 
          item.id === ingredientId ? { ...item, ...updates } : item
        ));
        return;
      }

      const { error } = await supabase
        .from('kitchen_ingredients')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ingredientId);

      if (error) throw error;

    } catch (error: any) {
      console.error("❌ Error updating ingredient:", error);
      toast.error(error.message || "Failed to update ingredient");
    }
  }

  // Create new dish
  async function createDish() {
    if (!newDish.name.trim()) {
      toast.error("Please enter a dish name");
      return;
    }

    if (newDish.ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, saving: true }));

      if (!connectionStatus?.connected) {
        const newDishId = Date.now().toString();
        const ingredientsObj: Record<string, number> = {};
        newDish.ingredients.forEach(ing => {
          ingredientsObj[ing.name] = ing.amount;
        });
        
        setDishes(prev => [...prev, {
          id: newDishId,
          name: newDish.name.trim(),
          category: newDish.category,
          active: true,
          ingredients: ingredientsObj
        }]);
        
        toast.success(`Created dish: ${newDish.name}`);
        setNewDish({ name: "", category: "Main Course", ingredients: [] });
        setIsAddDishOpen(false);
        return;
      }

      // 1. Create the dish
      const { data: dish, error: dishError } = await supabase
        .from('dishes')
        .insert([{
          name: newDish.name.trim(),
          category: newDish.category,
          active: true
        }])
        .select()
        .single();

      if (dishError) throw dishError;

      // 2. Add dish ingredients
      const ingredientPromises = newDish.ingredients.map(async (ing) => {
        try {
          // Find or create ingredient
          const { data: existingIng } = await supabase
            .from('kitchen_ingredients')
            .select('id')
            .eq('name', ing.name.toLowerCase())
            .maybeSingle();

          let ingredientId = existingIng?.id;

          if (!ingredientId) {
            const { data: newIng } = await supabase
              .from('kitchen_ingredients')
              .insert([{
                name: ing.name.toLowerCase(),
                quantity: 0,
                unit: ing.unit,
                category: 'others',
              }])
              .select()
              .single();

            ingredientId = newIng?.id;
          }

          if (ingredientId) {
            await supabase
              .from('dish_ingredients')
              .insert([{
                dish_id: dish.id,
                ingredient_id: ingredientId,
                quantity: ing.amount,
                unit: ing.unit,
              }]);
          }
        } catch (error) {
          console.error(`❌ Error processing ingredient ${ing.name}:`, error);
        }
      });

      await Promise.all(ingredientPromises);

      toast.success(`Created dish: ${newDish.name}`);
      setNewDish({ name: "", category: "Main Course", ingredients: [] });
      setIsAddDishOpen(false);
      await loadInventory();

    } catch (error: any) {
      console.error("❌ Error creating dish:", error);
      toast.error(error.message || "Failed to create dish");
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  }

  // Add ingredient to new dish
  function addIngredientToNewDish() {
    if (!tempIngredient.name.trim()) {
      toast.error("Please enter ingredient name");
      return;
    }

    if (tempIngredient.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const ingredientName = tempIngredient.name.trim().toLowerCase();
    setNewDish((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { 
        name: ingredientName, 
        amount: tempIngredient.amount, 
        unit: tempIngredient.unit 
      }],
    }));
    setTempIngredient({ name: "", amount: 0, unit: "g" });
  }

  function removeIngredientFromNewDish(index: number) {
    setNewDish((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  // Delete dish
  async function deleteDish(dishId: string, name: string) {
    try {
      if (!connectionStatus?.connected) {
        setDishes(prev => prev.filter(d => d.id !== dishId));
        toast.success(`Deleted dish: ${name}`);
        return;
      }

      const { error } = await supabase
        .from('dishes')
        .update({ active: false })
        .eq('id', dishId);

      if (error) throw error;

      toast.success(`Deleted dish: ${name}`);
      await loadInventory();
    } catch (error: any) {
      console.error("❌ Error deleting dish:", error);
      toast.error(error.message || "Failed to delete dish");
    }
  }

  // Add ingredient to editing dish
  function addIngredientToEditingDish() {
    if (!editingDish || !editTempIngredient.name.trim() || editTempIngredient.amount <= 0) {
      toast.error("Please enter valid ingredient details");
      return;
    }
    
    const ingredientName = editTempIngredient.name.trim().toLowerCase();
    
    setEditingDish(prev =>
      prev ? { 
        ...prev, 
        ingredients: { 
          ...prev.ingredients, 
          [ingredientName]: editTempIngredient.amount 
        } 
      } : null
    );
    
    setEditTempIngredient({ name: "", amount: 0, unit: "g" });
  }

  // Save edited dish to database
  async function saveEditedDish() {
    if (!editingDish) return;

    try {
      setLoading(prev => ({ ...prev, saving: true }));

      if (!connectionStatus?.connected) {
        setDishes(prev => prev.map(d => 
          d.id === editingDish.id ? editingDish : d
        ));
        toast.success(`Updated dish: ${editingDish.name}`);
        setEditingDish(null);
        return;
      }

      // Update dish_ingredients in database
      // First, delete existing ingredients for this dish
      const { error: deleteError } = await supabase
        .from('dish_ingredients')
        .delete()
        .eq('dish_id', editingDish.id);

      if (deleteError) throw deleteError;

      // Then, insert updated ingredients
      const ingredientPromises = Object.entries(editingDish.ingredients).map(async ([ingName, amount]) => {
        // Find ingredient ID
        const { data: ingredient } = await supabase
          .from('kitchen_ingredients')
          .select('id')
          .eq('name', ingName.toLowerCase())
          .maybeSingle();

        if (ingredient?.id) {
          await supabase
            .from('dish_ingredients')
            .insert([{
              dish_id: editingDish.id,
              ingredient_id: ingredient.id,
              quantity: amount,
              unit: "g", // Default unit, you might want to store this separately
            }]);
        }
      });

      await Promise.all(ingredientPromises);

      toast.success(`Updated dish: ${editingDish.name}`);
      setEditingDish(null);
      await loadInventory();

    } catch (error: any) {
      console.error("❌ Error updating dish:", error);
      toast.error(error.message || "Failed to update dish");
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kitchen Inventory</h1>
              <p className="text-gray-600">Manage ingredients and dishes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {connectionStatus && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus.connected 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {connectionStatus.connected ? '✅ Connected' : '⚠️ Demo Mode'}
              </div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={loadInventory} 
                disabled={loading.store || loading.dishes}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading.store ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Cook Dish Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-xl rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <UtensilsCrossed className="w-5 h-5" /> Cook Dish
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Dish</Label>
                  <Select value={selectedDish} onValueChange={setSelectedDish}>
                    <SelectTrigger className="border-2 bg-white">
                      <SelectValue placeholder="Select dish" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading.dishes ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : dishes.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No dishes available
                        </div>
                      ) : (
                        dishes.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Portions</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={portions === 0 ? "" : portions}
                      onChange={(e) => setPortions(sanitizeNumberInput(e.target.value))}
                      className="border-2 bg-white"
                      placeholder="Qty"
                      min="1"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                      <Button 
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 w-full"
                        onClick={() => makeDish(selectedDish, portions)}
                        disabled={loading.cooking || !selectedDish || dishes.length === 0}
                      >
                        {loading.cooking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cooking...
                          </>
                        ) : (
                          <>
                            <ChefHat className="w-4 h-4 mr-2" />
                            Cook
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Inventory Card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-0 shadow-xl rounded-2xl h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <AlertTriangle className="w-5 h-5 text-blue-600" /> 
                      Ingredients ({store.length} items)
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Search and manage ingredients</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                          <Plus className="w-4 h-4" /> Add Ingredient
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Ingredient</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Name *</Label>
                          <Input 
                            placeholder="e.g., Rice, Chicken" 
                            value={newIngredient.name} 
                            onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                            className="border-2"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              value={newIngredient.quantity === 0 ? "" : newIngredient.quantity} 
                              onChange={(e) => setNewIngredient({ ...newIngredient, quantity: sanitizeNumberInput(e.target.value) })}
                              className="border-2"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Unit *</Label>
                            <Select 
                              value={newIngredient.unit} 
                              onValueChange={(v: string) => setNewIngredient({ ...newIngredient, unit: v })}
                            >
                              <SelectTrigger className="border-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {unitOptions.map(unit => (
                                  <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select 
                            value={newIngredient.category} 
                            onValueChange={(v) => setNewIngredient({ ...newIngredient, category: v })}
                          >
                            <SelectTrigger className="border-2">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          onClick={addIngredient} 
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                          disabled={!newIngredient.name.trim() || newIngredient.quantity <= 0}
                        >
                          Save Ingredient
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search ingredients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-2 bg-white"
                    />
                  </div>
                </div>

                {loading.store ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <p className="text-gray-500">Loading ingredients...</p>
                  </div>
                ) : store.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <AlertTriangle className="w-16 h-16 text-gray-300" />
                    <p className="text-gray-500">No ingredients found</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader className="bg-gray-50 sticky top-0">
                          <TableRow>
                            <TableHead className="font-semibold">Item</TableHead>
                            <TableHead className="font-semibold">Quantity</TableHead>
                            <TableHead className="font-semibold">Unit</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {filteredIngredients.map((item, index) => (
                              <motion.tr 
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-gray-50 border-b border-gray-100"
                              >
                                <TableCell>
                                  <div className="font-medium capitalize">{item.name}</div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateIngredient(item.id, { quantity: sanitizeNumberInput(e.target.value) })}
                                    className="w-32 border-2 bg-white"
                                    min="0"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="w-24">
                                    <Select
                                      value={item.unit}
                                      onValueChange={(v: string) => updateIngredient(item.id, { unit: v })}
                                    >
                                      <SelectTrigger className="border-2 bg-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {unitOptions.map(unit => (
                                          <SelectItem key={unit.value} value={unit.value}>
                                            {unit.value}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium capitalize w-fit">
                                    {item.category || 'others'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      onClick={() => deleteIngredient(item.id, item.name)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </motion.div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    {filteredIngredients.length === 0 && searchTerm && (
                      <div className="text-center py-8 text-gray-500">
                        No ingredients found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Dishes Card */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="border-0 shadow-xl rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                      Dishes ({dishes.length})
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Create and manage dishes</p>
                  </div>
                  <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
                    <DialogTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700">
                          <Plus className="w-4 h-4" /> Add New Dish
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Create New Dish</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6 py-2">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Dish Name *</Label>
                                <Input
                                  placeholder="Enter dish name"
                                  value={newDish.name}
                                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                                  className="border-2"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                  value={newDish.category}
                                  onValueChange={(v) => setNewDish({ ...newDish, category: v })}
                                >
                                  <SelectTrigger className="border-2">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dishCategoryOptions.map(cat => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <Label className="text-lg font-semibold mb-4 block">Ingredients *</Label>
                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                              <Input
                                placeholder="Ingredient name"
                                value={tempIngredient.name}
                                onChange={(e) => setTempIngredient({ ...tempIngredient, name: e.target.value })}
                                className="border-2 flex-1"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  placeholder="Amount"
                                  value={tempIngredient.amount === 0 ? "" : tempIngredient.amount}
                                  onChange={(e) => setTempIngredient({ ...tempIngredient, amount: sanitizeNumberInput(e.target.value) })}
                                  className="border-2 w-24"
                                  min="0"
                                  step="0.01"
                                />
                                <Select 
                                  value={tempIngredient.unit} 
                                  onValueChange={(v: string) => setTempIngredient({ ...tempIngredient, unit: v })}
                                >
                                  <SelectTrigger className="border-2 w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unitOptions.map(unit => (
                                      <SelectItem key={unit.value} value={unit.value}>
                                        {unit.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button 
                                  onClick={addIngredientToNewDish} 
                                  className="px-4"
                                  disabled={!tempIngredient.name.trim() || tempIngredient.amount <= 0}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </div>

                            <ScrollArea className="h-[200px]">
                              {newDish.ingredients.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                  <p>No ingredients added yet</p>
                                  <p className="text-sm mt-1">Add at least one ingredient to create the dish</p>
                                </div>
                              ) : (
                                <div className="space-y-2 pr-4">
                                  {newDish.ingredients.map((ing, idx) => (
                                    <motion.div 
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium capitalize">{ing.name}</span>
                                        <span className="text-gray-600 ml-2">{ing.amount} {ing.unit}</span>
                                      </div>
                                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeIngredientFromNewDish(idx)}
                                        >
                                          <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </motion.div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      </ScrollArea>
                      <DialogFooter className="mt-4">
                        <Button
                          onClick={createDish}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700"
                          disabled={!newDish.name.trim() || newDish.ingredients.length === 0 || loading.saving}
                        >
                          {loading.saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Dish'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading.dishes ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : dishes.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-64 space-y-4">
                    <UtensilsCrossed className="w-16 h-16 text-gray-300" />
                    <p className="text-gray-500">No dishes created yet</p>
                    <Button 
                      onClick={() => setIsAddDishOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Dish
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {dishes.map((dish, index) => (
                        <motion.div
                          key={dish.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -5 }}
                          className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900 truncate">{dish.name}</h3>
                              {dish.category && (
                                <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium capitalize mt-1 inline-block">
                                  {dish.category}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingDish(dish)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteDish(dish.id, dish.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Ingredients:</p>
                            <ScrollArea className="h-32">
                              <ul className="space-y-1 pr-2">
                                {Object.entries(dish.ingredients).map(([ing, qty]) => (
                                  <li key={ing} className="text-sm text-gray-600 flex justify-between">
                                    <span className="capitalize truncate mr-2">{ing}</span>
                                    <span className="font-medium whitespace-nowrap">{qty}</span>
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Dish Dialog */}
      <Dialog open={!!editingDish} onOpenChange={() => setEditingDish(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Dish: {editingDish?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-2">
              <div className="space-y-4">
                <Label className="text-lg font-semibold block">Current Ingredients</Label>
                <ScrollArea className="h-[250px] border rounded-lg p-4">
                  <div className="space-y-3">
                    {editingDish && Object.entries(editingDish.ingredients).map(([ing, qty]) => (
                      <div key={ing} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <Label className="block capitalize font-medium mb-1">{ing}</Label>
                          <Input
                            type="number"
                            value={qty}
                            onChange={(e) => {
                              setEditingDish(prev => prev ? {
                                ...prev,
                                ingredients: { ...prev.ingredients, [ing]: sanitizeNumberInput(e.target.value) }
                              } : null);
                            }}
                            className="border-2"
                            placeholder="0"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setEditingDish(prev => {
                                if (!prev) return null;
                                const newIngredients = { ...prev.ingredients };
                                delete newIngredients[ing];
                                return { ...prev, ingredients: newIngredients };
                              });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="border-t pt-4">
                <Label className="text-lg font-semibold mb-4 block">Add New Ingredient</Label>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Input
                    placeholder="Ingredient name"
                    value={editTempIngredient.name}
                    onChange={(e) => setEditTempIngredient({ ...editTempIngredient, name: e.target.value })}
                    className="border-2 flex-1"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={editTempIngredient.amount === 0 ? "" : editTempIngredient.amount}
                      onChange={(e) => setEditTempIngredient({ ...editTempIngredient, amount: sanitizeNumberInput(e.target.value) })}
                      className="border-2 w-24"
                      min="0"
                      step="0.01"
                    />
                    <Select 
                      value={editTempIngredient.unit} 
                      onValueChange={(v: string) => setEditTempIngredient({ ...editTempIngredient, unit: v })}
                    >
                      <SelectTrigger className="border-2 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={addIngredientToEditingDish} 
                      className="px-4"
                      disabled={!editTempIngredient.name.trim() || editTempIngredient.amount <= 0}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setEditingDish(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveEditedDish} 
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700"
              disabled={loading.saving}
            >
              {loading.saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}