import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, ArrowLeft, Plus, Minus, ShoppingBag, MapPin, Recycle, Loader2, Heart } from "lucide-react";
import { trackProductInteraction } from "@/lib/analytics";
import { SEO } from "@/components/SEO";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string;
  image_url: string | null;
  carbon_offset_kg: number | null;
  source_location: string | null;
  stock_quantity: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
          setProduct(data);
          trackProductInteraction(data.id, 'view', data.name);
        }
      setIsLoading(false);
    }

    fetchProduct();
  }, [id]);

  const addToCart = () => {
      if (!product) return;

      trackProductInteraction(product.id, 'add_to_cart', product.name);

      const savedCart = localStorage.getItem("moenviron-cart");
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    const existingIndex = cart.findIndex((item: { id: string }) => item.id === product.id);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity,
        image_url: product.image_url,
        carbon_offset_kg: product.carbon_offset_kg,
      });
    }

    localStorage.setItem("moenviron-cart", JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart-updated"));
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Leaf className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h2 className="mt-4 text-xl font-semibold">Product not found</h2>
            <p className="mt-2 text-muted-foreground">This product may no longer be available.</p>
            <Link to="/shop" className="mt-6 inline-block">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title={product.name}
        description={product.description || `${product.name} - Sustainable fashion made from 100% recycled UK textiles`}
        image={product.image_url || undefined}
        type="product"
        product={{
          name: product.name,
          description: product.description || `${product.name} - Sustainable fashion made from 100% recycled UK textiles`,
          price: product.price,
          currency: product.currency,
          image: product.image_url || undefined,
          sku: product.id,
          availability: product.stock_quantity > 0 ? "InStock" : "OutOfStock",
          category: product.category,
        }}
      />
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container">
          {/* Breadcrumb */}
          <Link
            to="/shop"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Leaf className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
              <Badge className="absolute left-4 top-4">{product.category}</Badge>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-center gap-4">
                <span className="text-3xl font-bold text-foreground">
                  £{product.price.toFixed(2)}
                </span>
                {product.carbon_offset_kg && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Leaf className="mr-1 h-3 w-3" />
                    -{product.carbon_offset_kg}kg CO₂
                  </Badge>
                )}
              </div>

              {product.description && (
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Product Details */}
              <div className="mt-6 space-y-3">
                {product.source_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Crafted in {product.source_location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Recycle className="h-4 w-4 text-primary" />
                  <span>Made from 100% recycled UK textiles</span>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity} in stock
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button size="lg" className="flex-1 gap-2" onClick={addToCart}>
                    <ShoppingBag className="h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant={isInWishlist(product.id) ? "default" : "outline"}
                    onClick={handleWishlistToggle}
                    className="gap-2"
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Impact Badge */}
              {product.carbon_offset_kg && (
                <div className="mt-8 rounded-xl bg-primary/5 p-6 border border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Leaf className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Environmental Impact</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        By purchasing this product, you're preventing approximately{" "}
                        <span className="font-semibold text-primary">
                          {product.carbon_offset_kg}kg of CO₂
                        </span>{" "}
                        from entering the atmosphere and supporting circular fashion.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
