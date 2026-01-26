import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag, Leaf, ArrowRight, CreditCard, Smartphone, Loader2 } from "lucide-react";

const COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "United Kingdom", "United States", 
  "Nigeria", "South Africa", "Ghana", "Ethiopia", "Other"
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image_url: string | null;
  carbon_offset_kg: number | null;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "mpesa">("stripe");

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("moenviron-cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (items: CartItem[]) => {
    localStorage.setItem("moenviron-cart", JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new CustomEvent("cart-updated"));
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
      .filter((item) => item.quantity > 0);
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    saveCart(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCarbon = cartItems.reduce((sum, item) => sum + (item.carbon_offset_kg || 0) * item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (paymentMethod === "stripe") {
      if (!customerEmail) {
        toast.error("Please enter your email address");
        return;
      }

        setIsLoading(true);
        try {
          const response = await fetch("/api/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              customerEmail,
              mode: "checkout_session",
            }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Checkout failed");

        if (data?.url) {
          window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*");
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Checkout failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
      } else {
        if (!customerPhone) {
          toast.error("Please enter your M-Pesa phone number");
          return;
        }

        if (!customerEmail) {
          toast.error("Please enter your email for order confirmation");
          return;
        }

        setIsLoading(true);
        try {
          const kesTotal = Math.round(subtotal * 155);
          
          const response = await fetch("/api/mpesa-stk-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: customerPhone.replace(/\s/g, ""),
              amount: kesTotal,
              customerEmail,
              items: cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price: Math.round(item.price * 155),
                quantity: item.quantity,
              })),
            }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "M-Pesa request failed");
          
          if (data?.ResponseCode === "0") {
            toast.success("Check your phone for the M-Pesa prompt!", {
              description: `An STK push has been sent to ${customerPhone}. Enter your M-Pesa PIN to complete payment.`,
              duration: 10000,
            });
            localStorage.removeItem("moenviron-cart");
            setCartItems([]);
            window.dispatchEvent(new CustomEvent("cart-updated"));
          } else {
            throw new Error(data?.errorMessage || data?.CustomerMessage || "M-Pesa request failed");
          }
} catch (error: unknown) {
            console.error("Checkout error:", error);
            toast.error(error instanceof Error ? error.message : "M-Pesa checkout failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="mb-8 text-3xl font-bold text-foreground">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">Your cart is empty</h2>
              <p className="mt-2 text-muted-foreground">Start shopping our sustainable collection</p>
              <Link to="/shop" className="mt-6 inline-block">
                <Button className="gap-2">
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    {/* Image */}
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{item.name}</h3>
                        {item.carbon_offset_kg && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                            <Leaf className="h-3 w-3" />
                            -{item.carbon_offset_kg}kg CO₂
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">
                            £{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-6 text-xl font-semibold text-foreground">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-foreground">Calculated at checkout</span>
                  </div>
                  {totalCarbon > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span className="flex items-center gap-1">
                        <Leaf className="h-4 w-4" />
                        Carbon Offset
                      </span>
                      <span className="font-medium">-{totalCarbon.toFixed(1)}kg CO₂</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-foreground">Total</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-foreground">£{subtotal.toFixed(2)}</span>
                          {paymentMethod === "mpesa" && (
                            <p className="text-sm text-muted-foreground">≈ KES {Math.round(subtotal * 155).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                </div>

                  <div className="mt-6 space-y-4">
                      {/* Email Input - Always visible */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Order confirmation will be sent here</p>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="space-y-3">
                        <Label>Payment Method</Label>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={(v) => setPaymentMethod(v as "stripe" | "mpesa")}
                          className="grid grid-cols-2 gap-3"
                        >
                          <Label
                            htmlFor="stripe-cart"
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                              paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            <RadioGroupItem value="stripe" id="stripe-cart" />
                            <CreditCard className="h-4 w-4" />
                            <span>Card (GBP)</span>
                          </Label>
                          <Label
                            htmlFor="mpesa-cart"
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                              paymentMethod === "mpesa" ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            <RadioGroupItem value="mpesa" id="mpesa-cart" />
                            <Smartphone className="h-4 w-4" />
                            <span>M-Pesa (KES)</span>
                          </Label>
                        </RadioGroup>
                      </div>

                      {paymentMethod === "mpesa" && (
                        <div>
                          <Label htmlFor="phone">M-Pesa Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="254700000000"
                            required
                          />
                        </div>
                      )}
                    </div>

                <Button
                  className="mt-6 w-full gap-2"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : paymentMethod === "mpesa" ? "Pay with M-Pesa" : "Proceed to Checkout"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {paymentMethod === "stripe" 
                    ? "Secure checkout powered by Stripe" 
                    : "Secure payment via M-Pesa STK Push"}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
