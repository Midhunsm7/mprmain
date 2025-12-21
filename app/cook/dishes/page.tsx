// app/admin/dishes/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { 
  ChefHat, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  TrendingUp, 
  Package,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  ChefHat as DishIcon,
  BarChart3,
  DollarSign,
  Percent,
  Grid3X3,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Dish = {
  id: string;
  name: string;
  category: string;
  base_price: number;
  gst_percentage: number;
  price_type: 'fixed' | 'from' | 'size_based';
  active: boolean;
  created_at: string;
  ingredients?: DishIngredient[];
};

type DishIngredient = {
  id: string;
  dish_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: {
    id: string;
    name: string;
    stock: number;
    unit: string;
    unit_price?: number;
    category?: string;
  };
};

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  unit_price?: number;
  category?: string;
};

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("dishes");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Dish | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState<Dish | null>(null);
  
  const [newDish, setNewDish] = useState({
    name: "",
    category: "main",
    base_price: 0,
    gst_percentage: 5,
    price_type: "fixed" as const,
    active: true,
    description: "",
  });

  const [newIngredients, setNewIngredients] = useState<Array<{
    id: string;
    quantity: number;
    unit: string;
    cost_per_unit?: number;
  }>>([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch dishes with their ingredients
      const { data: dishesData, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .order("name");

      if (dishesError) throw dishesError;

      // Fetch dish ingredients with ingredient details
      const dishesWithIngredients = await Promise.all(
        (dishesData || []).map(async (dish) => {
          const { data: dishIngredients, error: ingError } = await supabase
            .from("dish_ingredients")
            .select(`
              *,
              ingredient:inventory_items (
                id,
                name,
                unit,
                stock,
                unit_price,
                category
              )
            `)
            .eq("dish_id", dish.id);

          return {
            ...dish,
            ingredients: dishIngredients || []
          };
        })
      );

      // Fetch all ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");

      if (ingredientsError) throw ingredientsError;

      setDishes(dishesWithIngredients);
      setIngredients(ingredientsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dishes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase()) ||
                         dish.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    
    // Price range filter
    let matchesPrice = true;
    if (priceRange === "under100") {
      matchesPrice = dish.base_price < 100;
    } else if (priceRange === "100-300") {
      matchesPrice = dish.base_price >= 100 && dish.base_price <= 300;
    } else if (priceRange === "300-500") {
      matchesPrice = dish.base_price >= 300 && dish.base_price <= 500;
    } else if (priceRange === "over500") {
      matchesPrice = dish.base_price > 500;
    }
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Categories
  const categories = ["all", ...Array.from(new Set(dishes.map(dish => dish.category).filter(Boolean))) as string[]];

  // Create dish
  const createDish = async () => {
    if (!newDish.name.trim()) {
      toast.error("Dish name is required");
      return;
    }

    try {
      // Create dish
      const { data: dishData, error: dishError } = await supabase
        .from("dishes")
        .insert({
          name: newDish.name,
          category: newDish.category || null,
          base_price: newDish.base_price,
          gst_percentage: newDish.gst_percentage,
          price_type: newDish.price_type,
          active: newDish.active,
        })
        .select()
        .single();

      if (dishError) throw dishError;

      // Create dish ingredients
      if (newIngredients.length > 0) {
        const dishIngredients = newIngredients.map(ing => ({
          dish_id: dishData.id,
          ingredient_id: ing.id,
          quantity: ing.quantity,
          unit: ing.unit,
        }));

        const { error: ingError } = await supabase
          .from("dish_ingredients")
          .insert(dishIngredients);

        if (ingError) throw ingError;
      }

      toast.success("Dish created successfully");
      setShowCreateModal(false);
      resetNewDish();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create dish");
    }
  };

  // Update dish
  const updateDish = async () => {
    if (!showEditModal) return;

    try {
      const { error } = await supabase
        .from("dishes")
        .update({
          name: showEditModal.name,
          category: showEditModal.category,
          base_price: showEditModal.base_price,
          gst_percentage: showEditModal.gst_percentage,
          price_type: showEditModal.price_type,
          active: showEditModal.active,
        })
        .eq("id", showEditModal.id);

      if (error) throw error;

      toast.success("Dish updated successfully");
      setShowEditModal(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update dish");
    }
  };

  // Delete dish
  const deleteDish = async (dishId: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;

    try {
      // First delete dish ingredients
      await supabase
        .from("dish_ingredients")
        .delete()
        .eq("dish_id", dishId);

      // Then delete the dish
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", dishId);

      if (error) throw error;

      toast.success("Dish deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete dish");
    }
  };

  // Calculate dish cost
  const calculateDishCost = (dish: Dish) => {
    if (!dish.ingredients || dish.ingredients.length === 0) return 0;
    
    return dish.ingredients.reduce((total, ing) => {
      const ingredient = ingredients.find(i => i.id === ing.ingredient_id);
      const unitPrice = ingredient?.unit_price || 0;
      return total + (ing.quantity * unitPrice);
    }, 0);
  };

  // Reset new dish form
  const resetNewDish = () => {
    setNewDish({
      name: "",
      category: "main",
      base_price: 0,
      gst_percentage: 5,
      price_type: "fixed",
      active: true,
      description: "",
    });
    setNewIngredients([]);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Fixed at top */}
        <motion.div 
          className="mb-6 sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-white/90 backdrop-blur-sm py-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <ChefHat className="h-7 w-7 text-orange-600" />
                Menu & Recipes Management
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Create and manage dishes, recipes, and menu items
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)} 
              className="gap-2 shrink-0"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Add New Dish
            </Button>
          </div>
        </motion.div>

        {/* Main Content Area with Fixed Height */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
          {/* Left Column - Stats and Filters */}
          <div className="lg:w-1/4 space-y-6 flex flex-col">
            {/* Stats Cards - Scrollable */}
            <ScrollArea className="flex-1">
              <motion.div 
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Dishes</p>
                          <p className="text-xl font-bold mt-1">{dishes.length}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-100">
                          <ChefHat className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Dishes</p>
                          <p className="text-xl font-bold mt-1">
                            {dishes.filter(d => d.active).length}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Cost</p>
                          <p className="text-xl font-bold mt-1">
                            ₹{Math.round(dishes.reduce((sum, dish) => sum + calculateDishCost(dish), 0) / Math.max(dishes.length, 1))}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-100">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Categories</p>
                          <p className="text-xl font-bold mt-1">
                            {new Set(dishes.map(d => d.category).filter(Boolean)).size}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Filters Card */}
                <motion.div variants={itemVariants}>
                  <Card className="hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sliders className="h-4 w-4" />
                        Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                      {/* Category Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat === "all" ? "All Categories" : cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range Filter */}
                      <div className="space-y-2">
                        <Label className="text-xs">Price Range</Label>
                        <Select value={priceRange} onValueChange={setPriceRange}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All Prices" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">All Prices</SelectItem>
                            <SelectItem value="under100" className="text-xs">Under ₹100</SelectItem>
                            <SelectItem value="100-300" className="text-xs">₹100 - ₹300</SelectItem>
                            <SelectItem value="300-500" className="text-xs">₹300 - ₹500</SelectItem>
                            <SelectItem value="over500" className="text-xs">Over ₹500</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters */}
                      {(selectedCategory !== "all" || priceRange !== "all" || search) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs h-8"
                          onClick={() => {
                            setSearch("");
                            setSelectedCategory("all");
                            setPriceRange("all");
                          }}
                        >
                          <X className="h-3 w-3 mr-2" />
                          Clear All Filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </ScrollArea>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:w-3/4 flex flex-col">
            {/* Search Bar - Fixed */}
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search dishes by name or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </motion.div>

            {/* Tabs and Content - Scrollable */}
            <div className="flex-1 flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full md:w-auto grid-cols-2 mb-4 shrink-0">
                  <TabsTrigger value="dishes" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Dishes ({filteredDishes.length})
                  </TabsTrigger>
                  <TabsTrigger value="recipes" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Recipes View
                  </TabsTrigger>
                </TabsList>

                {/* Scrollable Content Area */}
                <ScrollArea className="flex-1">
                  {/* Dishes Tab */}
                  <TabsContent value="dishes" className="mt-0 space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading dishes...</p>
                        </div>
                      </div>
                    ) : filteredDishes.length === 0 ? (
                      <Card>
                        <CardContent className="py-12">
                          <div className="text-center">
                            <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                              No dishes found
                            </h3>
                            <p className="text-gray-500 mb-6">
                              {search || selectedCategory !== "all" || priceRange !== "all"
                                ? "Try adjusting your search or filters"
                                : "Get started by creating your first dish"}
                            </p>
                            <Button onClick={() => setShowCreateModal(true)}>
                              Create Your First Dish
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredDishes.map((dish) => {
                          const dishCost = calculateDishCost(dish);
                          const profitMargin = dish.base_price > 0 
                            ? ((dish.base_price - dishCost) / dish.base_price) * 100 
                            : 0;

                          return (
                            <motion.div
                              key={dish.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                              onClick={() => setShowRecipeModal(dish)}
                            >
                              {/* Dish Header */}
                              <div className="p-4 border-b">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate">{dish.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {dish.category || "Uncategorized"}
                                      </Badge>
                                      <Badge variant={dish.active ? "default" : "secondary"} className="text-xs">
                                        {dish.active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                                    <ChefHat className="h-5 w-5 text-orange-600" />
                                  </div>
                                </div>
                              </div>

                              {/* Dish Details */}
                              <div className="p-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Price</p>
                                    <p className="text-lg font-bold">₹{dish.base_price}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-1">Cost</p>
                                    <p className="text-lg font-bold">₹{Math.round(dishCost)}</p>
                                  </div>
                                </div>

                                {/* Profit Margin */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Profit Margin</span>
                                    <span className={`font-bold ${
                                      profitMargin > 30 ? 'text-green-600' : 
                                      profitMargin > 20 ? 'text-amber-600' : 'text-red-600'
                                    }`}>
                                      {profitMargin.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full rounded-full"
                                      style={{ 
                                        width: `${Math.min(100, profitMargin)}%`,
                                        backgroundColor: profitMargin > 30 ? '#10b981' : 
                                                        profitMargin > 20 ? '#f59e0b' : '#ef4444'
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, profitMargin)}%` }}
                                      transition={{ duration: 1 }}
                                    />
                                  </div>
                                </div>

                                {/* Ingredients Preview */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Ingredients:</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {dish.ingredients?.length || 0} items
                                    </Badge>
                                  </div>
                                  {dish.ingredients && dish.ingredients.slice(0, 2).map((ing, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs text-gray-500">
                                      <span className="truncate">{ing.ingredient?.name || 'Unknown'}</span>
                                      <span>{ing.quantity} {ing.unit}</span>
                                    </div>
                                  ))}
                                  {dish.ingredients && dish.ingredients.length > 2 && (
                                    <div className="text-xs text-gray-400">
                                      +{dish.ingredients.length - 2} more ingredients
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="p-4 border-t bg-gray-50 flex justify-between">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditModal(dish);
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteDish(dish.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Recipes Tab */}
                  <TabsContent value="recipes" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recipes Overview</CardTitle>
                        <CardDescription>
                          Click on any dish to view detailed recipe and cost breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {filteredDishes.map((dish) => {
                            const dishCost = calculateDishCost(dish);
                            
                            return (
                              <motion.div
                                key={dish.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow duration-300 cursor-pointer"
                                onClick={() => setShowRecipeModal(dish)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-lg">{dish.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {dish.category || "Uncategorized"}
                                      </Badge>
                                      <Badge variant={dish.active ? "default" : "secondary"} className="text-xs">
                                        {dish.active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold">₹{dish.base_price}</div>
                                    <div className="text-sm text-gray-500">
                                      Cost: ₹{Math.round(dishCost)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Ingredients List */}
                                <div className="space-y-2 mb-3">
                                  {dish.ingredients?.slice(0, 3).map((ing, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{ing.ingredient?.name || 'Unknown'}</span>
                                      <span className="font-medium">
                                        {ing.quantity} {ing.unit}
                                      </span>
                                    </div>
                                  ))}
                                  {dish.ingredients && dish.ingredients.length > 3 && (
                                    <div className="text-sm text-gray-500">
                                      +{dish.ingredients.length - 3} more ingredients
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t">
                                  <div className="text-sm text-gray-600">
                                    Created: {new Date(dish.created_at).toLocaleDateString()}
                                  </div>
                                  <Button size="sm" variant="ghost" className="gap-1">
                                    <Eye className="h-3.5 w-3.5" />
                                    View Recipe
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Create Dish Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Plus className="h-6 w-6 text-blue-600" />
                        Create New Dish
                      </h2>
                      <p className="text-gray-600 mt-1">Add a new dish to your menu</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dish Name *</Label>
                        <Input
                          value={newDish.name}
                          onChange={(e) => setNewDish({...newDish, name: e.target.value})}
                          placeholder="Enter dish name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newDish.category}
                          onValueChange={(value) => setNewDish({...newDish, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appetizer">Appetizer</SelectItem>
                            <SelectItem value="main">Main Course</SelectItem>
                            <SelectItem value="dessert">Dessert</SelectItem>
                            <SelectItem value="beverage">Beverage</SelectItem>
                            <SelectItem value="side">Side Dish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Base Price (₹) *</Label>
                        <Input
                          type="number"
                          value={newDish.base_price}
                          onChange={(e) => setNewDish({...newDish, base_price: Number(e.target.value)})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST Percentage (%)</Label>
                        <Input
                          type="number"
                          value={newDish.gst_percentage}
                          onChange={(e) => setNewDish({...newDish, gst_percentage: Number(e.target.value)})}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price Type</Label>
                        <Select
                          value={newDish.price_type}
                          onValueChange={(value: any) => setNewDish({...newDish, price_type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select price type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="from">Starting From</SelectItem>
                            <SelectItem value="size_based">Size Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Ingredients Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold">Ingredients</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewIngredients([...newIngredients, { id: "", quantity: 0, unit: "pcs" }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Ingredient
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                        {newIngredients.map((ing, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="col-span-5">
                              <Select
                                value={ing.id}
                                onValueChange={(value) => {
                                  const updated = [...newIngredients];
                                  updated[index].id = value;
                                  const ingredient = ingredients.find(i => i.id === value);
                                  if (ingredient) {
                                    updated[index].unit = ingredient.unit;
                                    updated[index].cost_per_unit = ingredient.unit_price;
                                  }
                                  setNewIngredients(updated);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ingredient" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({item.stock} in stock)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                placeholder="Quantity"
                                value={ing.quantity}
                                onChange={(e) => {
                                  const updated = [...newIngredients];
                                  updated[index].quantity = Number(e.target.value);
                                  setNewIngredients(updated);
                                }}
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                value={ing.unit}
                                onChange={(e) => {
                                  const updated = [...newIngredients];
                                  updated[index].unit = e.target.value;
                                  setNewIngredients(updated);
                                }}
                                placeholder="Unit"
                              />
                            </div>
                            <div className="col-span-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setNewIngredients(newIngredients.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newDish.active}
                        onCheckedChange={(checked) => setNewDish({...newDish, active: checked})}
                      />
                      <Label>Active on menu</Label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                        Cancel
                    </Button>
                      <Button onClick={createDish} className="gap-2">
                        <Save className="h-4 w-4" />
                        Create Dish
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Dish Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Edit className="h-6 w-6 text-blue-600" />
                      Edit Dish
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setShowEditModal(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dish Name</Label>
                      <Input
                        value={showEditModal.name}
                        onChange={(e) => setShowEditModal({...showEditModal, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Base Price (₹)</Label>
                        <Input
                          type="number"
                          value={showEditModal.base_price}
                          onChange={(e) => setShowEditModal({...showEditModal, base_price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GST (%)</Label>
                        <Input
                          type="number"
                          value={showEditModal.gst_percentage}
                          onChange={(e) => setShowEditModal({...showEditModal, gst_percentage: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showEditModal.active}
                        onCheckedChange={(checked) => setShowEditModal({...showEditModal, active: checked})}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button variant="outline" onClick={() => setShowEditModal(null)}>
                        Cancel
                      </Button>
                      <Button onClick={updateDish} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipe View Modal */}
        <AnimatePresence>
          {showRecipeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowRecipeModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ChefHat className="h-6 w-6 text-orange-600" />
                        {showRecipeModal.name} - Recipe
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">{showRecipeModal.category || "Uncategorized"}</Badge>
                        <Badge variant={showRecipeModal.active ? "default" : "secondary"}>
                          {showRecipeModal.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowRecipeModal(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dish Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-600">Selling Price</p>
                          <p className="text-2xl font-bold">₹{showRecipeModal.base_price}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-600">GST</p>
                          <p className="text-2xl font-bold">{showRecipeModal.gst_percentage}%</p>
                        </div>
                      </div>

                      {/* Ingredients List */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Ingredients
                        </h3>
                        {showRecipeModal.ingredients && showRecipeModal.ingredients.length > 0 ? (
                          <div className="space-y-3">
                            {showRecipeModal.ingredients.map((ing, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div>
                                  <p className="font-medium">{ing.ingredient?.name || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500">
                                    Available: {ing.ingredient?.stock || 0} {ing.ingredient?.unit || 'units'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{ing.quantity} {ing.unit}</p>
                                  {ing.ingredient?.unit_price && (
                                    <p className="text-sm text-gray-500">
                                      ₹{(ing.quantity * ing.ingredient.unit_price).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No ingredients added to this dish</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5">
                        <h3 className="font-bold text-lg mb-4">Cost Breakdown</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Ingredient Cost:</span>
                            <span className="font-bold">
                              ₹{calculateDishCost(showRecipeModal).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Selling Price:</span>
                            <span className="font-bold">₹{showRecipeModal.base_price}</span>
                          </div>
                          <div className="pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Profit Margin:</span>
                              <span className={`font-bold ${
                                ((showRecipeModal.base_price - calculateDishCost(showRecipeModal)) / showRecipeModal.base_price * 100) > 30 
                                  ? 'text-green-600' 
                                  : ((showRecipeModal.base_price - calculateDishCost(showRecipeModal)) / showRecipeModal.base_price * 100) > 20 
                                  ? 'text-amber-600' 
                                  : 'text-red-600'
                              }`}>
                                {((showRecipeModal.base_price - calculateDishCost(showRecipeModal)) / showRecipeModal.base_price * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                        <h3 className="font-bold text-lg mb-4">Recipe Actions</h3>
                        <div className="space-y-3">
                          <Button className="w-full" onClick={() => setShowEditModal(showRecipeModal)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Dish
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Export Recipe
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}