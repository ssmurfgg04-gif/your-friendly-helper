import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, ShoppingBag, Leaf, Recycle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { SEO } from "@/components/SEO";

import { trackProductInteraction } from "@/lib/analytics";

const categories = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Accessories", "Footwear", "Swimwear"];

const Shop = () => {
  const { data: products = [] } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: { id: string; name: string }) => {
    trackProductInteraction(product.id, 'view', product.name);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SEO 
        title="Shop Sustainable Fashion"
        description="Discover ethically crafted pieces that give waste a second life. Beautifully designed, radically circular fashion from Moenviron Loop."
      />
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden min-h-[40vh] md:min-h-[50vh] flex items-center">
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2070"
              className="h-full w-full object-cover"
            >
              <source src="https://cdn.coverr.co/videos/coverr-moving-fabrics-9556/1080p.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white" />
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-2xl mx-auto text-center space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-white/90 animate-fade-in">
                <Recycle className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
                <span>Circular Fashion Collection</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-display leading-tight text-white animate-fade-in" style={{ animationDelay: "0.1s" }}>
                The <span className="italic text-[#7CC38A]">Marketplace</span>
              </h1>
              <p className="text-base md:text-lg text-white/80 font-light max-w-lg mx-auto leading-relaxed animate-fade-in px-4" style={{ animationDelay: "0.2s" }}>
                Discover ethically crafted pieces that give waste a second life.
              </p>
            </div>
          </div>
        </section>

        <section className="sticky top-16 z-40 border-y border-black/5 bg-white/80 backdrop-blur-md py-3 md:py-4">
          <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all whitespace-nowrap ${
                    selectedCategory === category ? "text-black border-b-2 border-black pb-1" : "text-black/30 hover:text-black/60 pb-1"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/20" />
                <input
                  type="text"
                  placeholder="Find upcycled styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F9F7F2] border-none rounded-full py-2 md:py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-black/5 transition-all"
                />
            </div>
          </div>
        </section>

        <section className="py-8 md:py-16">
          <div className="container px-4 md:px-6">
              {filteredProducts.length === 0 ? (
              <div className="py-16 md:py-24 text-center">
                <h3 className="text-xl md:text-2xl font-display mb-4">No products found</h3>
                <p className="text-muted-foreground font-light mb-6 md:mb-8 text-sm md:text-base">Try adjusting your filters or search.</p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  variant="outline"
                  className="rounded-full px-8"
                >
                  Clear Filters
                </Button>
              </div>
              ) : (
                  <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {filteredProducts.map((product) => (
                        <Link
                          key={product.id}
                          to={`/shop/${product.id}`}
                          className="group"
                          onClick={() => handleProductClick(product)}
                        >
                        <div className="space-y-2 md:space-y-3">
                          <div className="relative aspect-[3/4] overflow-hidden rounded-lg md:rounded-xl bg-[#F9F7F2]">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Leaf className="h-6 w-6 md:h-8 md:w-8 text-black/10" />
                              </div>
                            )}
                            
                            <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
                              <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg">
                                <ShoppingBag className="h-4 w-4 text-black" />
                              </div>
                            </div>

                            {product.carbon_offset_kg && (
                              <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
                                <span className="text-[8px] md:text-[9px] font-bold text-white bg-[#2D5A43] px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                                  -{product.carbon_offset_kg}kg CO₂
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-left space-y-0.5 md:space-y-1">
                            <span className="text-[8px] md:text-[9px] font-semibold uppercase tracking-widest text-black/40">
                              {product.category}
                            </span>
                            <h3 className="text-xs md:text-sm font-medium leading-tight group-hover:text-[#2D5A43] transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <span className="text-xs md:text-sm font-semibold text-[#1A1A1A]">
                              {product.currency === "GBP" ? "£" : product.currency}
                              {product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-24 bg-white border-t border-black/5">
          <div className="container px-4 md:px-6">
            <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-[#1A1A1A] text-white p-6 md:p-12 lg:p-20">
              <div className="absolute inset-0 opacity-20">
                <img 
                  src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop" 
                  alt="Background" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="space-y-4 md:space-y-6 text-center md:text-left">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-display leading-tight">
                    Stay in the <span className="italic text-[#7CC38A]">Loop</span>
                  </h2>
                  <p className="text-sm md:text-lg text-white/60 font-light max-w-sm mx-auto md:mx-0">
                    Be the first to know about new collection drops and artisan stories.
                  </p>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col gap-3 md:gap-4">
                    <input 
                      type="email" 
                      placeholder="Your email address"
                      className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-3 md:px-6 md:py-4 text-white text-sm md:text-base placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#2D5A43] transition-all"
                    />
                    <Button className="w-full md:w-auto bg-white text-black hover:bg-[#F9F7F2] rounded-full h-12 md:h-14 px-6 md:px-8 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                      Subscribe
                      <ArrowRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-white/30 uppercase tracking-widest text-center md:text-left">
                    By joining, you agree to receive circular updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
