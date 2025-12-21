import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Search, Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Dish = {
  id: string;
  name: string;
  category: string;
  base_price: number;
  gst_percentage: number;
  active: boolean;
  price_type: string;
};

type CartItem = {
  dish: Dish;
  quantity: number;
  finalPrice: number; // Price including GST
};

export default function AddItemModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: (added: boolean) => void;
}) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load dishes from database
  useEffect(() => {
    loadDishes();
  }, []);

  // Filter dishes based on search and category
  useEffect(() => {
    let filtered = dishes;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (dish) => dish.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((dish) =>
        dish.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDishes(filtered);
  }, [dishes, searchQuery, selectedCategory]);

  const loadDishes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dishes")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Error loading dishes:", error);
      toast.error("Failed to load dishes");
      setLoading(false);
      return;
    }

    setDishes(data || []);
    setFilteredDishes(data || []);
    setLoading(false);
  };

  // Calculate price including GST
  const calculateFinalPrice = (dish: Dish): number => {
    const gstAmount = (dish.base_price * dish.gst_percentage) / 100;
    return dish.base_price + gstAmount;
  };

  // Get unique categories
  const categories = ["all", ...new Set(dishes.map((d) => d.category).filter(Boolean))];

  // Add item to cart
  const addToCart = (dish: Dish) => {
    const finalPrice = calculateFinalPrice(dish);
    const existingItem = cart.find((item) => item.dish.id === dish.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { dish, quantity: 1, finalPrice }]);
    }
  };

  // Update quantity in cart
  const updateQuantity = (dishId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.dish.id !== dishId));
    } else {
      setCart(
        cart.map((item) =>
          item.dish.id === dishId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Submit cart items to order
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    setSubmitting(true);

    try {
      // Add each cart item to the order
      for (const cartItem of cart) {
        const response = await fetch("/api/kot/add-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            dish_id: cartItem.dish.id,
            item_name: cartItem.dish.name,
            quantity: cartItem.quantity,
            price: cartItem.finalPrice, // Price including GST
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to add item");
        }
      }

      toast.success(`Added ${cart.length} item(s) to order`);
      onClose(true);
    } catch (error) {
      console.error("Error adding items:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add Items to Order</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select dishes and add to cart
              </p>
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Dishes */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-500">No dishes found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDishes.map((dish) => {
                    const finalPrice = calculateFinalPrice(dish);
                    const inCart = cart.find((item) => item.dish.id === dish.id);

                    return (
                      <div
                        key={dish.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => addToCart(dish)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-800 text-sm">
                              {dish.name}
                            </h3>
                            {inCart && (
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                                {inCart.quantity}
                              </span>
                            )}
                          </div>

                          {dish.category && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {dish.category}
                            </span>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-gray-900">
                                ₹{finalPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ₹{dish.base_price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Incl. GST ({dish.gst_percentage}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="w-96 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-gray-800">Cart ({cart.length})</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-3" />
                  <p className="text-gray-500">Cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click on dishes to add them
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.dish.id}
                    className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {item.dish.name}
                      </h4>
                      <button
                        onClick={() => updateQuantity(item.dish.id, 0)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.dish.id, item.quantity - 1)
                          }
                          className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.dish.id, item.quantity + 1)
                          }
                          className="p-1 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{(item.finalPrice * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{item.finalPrice.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-3">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding Items...
                    </div>
                  ) : (
                    `Add ${cart.length} Item(s) to Order`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}