import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Filter, Search, Store, ShoppingCart, Minus, Plus, X, User, Zap, Menu, ChevronRight } from 'lucide-react';
import PointDescriptionEngine from '../components/PointDescriptionEngine';

interface CartItem {
  product: any;
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stores, setStores] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [flyingItems, setFlyingItems] = useState<{id: number, url: string, x: number, y: number}[]>([]);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        const uniqueCategories = Array.from(new Set(data.map((p: any) => p.category))) as string[];
        setCategories(uniqueCategories);
        const uniqueStores = Array.from(new Set(data.map((p: any) => p.store_name))) as string[];
        setStores(uniqueStores);
      });
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchStore = selectedStore ? p.store_name === selectedStore : true;
    const matchSearch = searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchCategory && matchStore && matchSearch;
  });

  const addToCart = (product: any, e?: React.MouseEvent) => {
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newFlyingItem = { 
        id: Date.now(), 
        url: product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', 
        x: rect.left + rect.width / 2 - 20, 
        y: rect.top - 20
      };
      setFlyingItems(prev => [...prev, newFlyingItem]);
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== newFlyingItem.id));
      }, 700);
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  let finalTotal = cartTotal;
  let discountAmount = 0;

  if (appliedDiscount) {
    let eligibleSubtotal = 0;
    if (appliedDiscount.applicability === 'SITE_WIDE') {
      eligibleSubtotal = cartTotal;
    } else if (appliedDiscount.applicability === 'SPECIFIC_VENDOR') {
      eligibleSubtotal = cart.filter(item => item.product.vendor_id === appliedDiscount.vendor_id)
                             .reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    }

    if (eligibleSubtotal > 0) {
      if (appliedDiscount.discount_type === 'PERCENTAGE') {
        discountAmount = eligibleSubtotal * (appliedDiscount.value / 100);
      } else if (appliedDiscount.discount_type === 'FIXED') {
        discountAmount = Math.min(appliedDiscount.value, eligibleSubtotal);
      }
      finalTotal = cartTotal - discountAmount;
    }
  }

  const handleApplyDiscount = async () => {
    setDiscountError(null);
    if (!discountCodeInput.trim()) return;

    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCodeInput.trim() })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setDiscountError(data.error || 'Invalid discount code');
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount(data);
      setDiscountCodeInput('');
      
      // Auto check if it's applicable right now
      let eligibleSubtotal = 0;
      if (data.applicability === 'SITE_WIDE') {
        eligibleSubtotal = cartTotal;
      } else if (data.applicability === 'SPECIFIC_VENDOR') {
        eligibleSubtotal = cart.filter(item => item.product.vendor_id === data.vendor_id)
                               .reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      }
      
      if (eligibleSubtotal === 0) {
        setDiscountError("This code isn't applicable to your current items.");
      }
    } catch (err) {
      setDiscountError("Failed to apply discount");
      setAppliedDiscount(null);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };


  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-stone-900">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full bg-[#feee00] z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-2 shrink-0">
            <Store className="w-8 h-8 text-black" />
            <span className="font-black text-2xl tracking-tighter hidden md:block">ELDOKAN</span>
          </div>
          
          <div className="flex-1 max-w-4xl flex items-center bg-white rounded overflow-hidden border border-transparent focus-within:border-stone-300 shadow-sm">
            <input 
              type="text" 
              placeholder="What are you looking for?"
              className="w-full py-2.5 px-4 outline-none text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="bg-stone-100 hover:bg-stone-200 px-4 py-3 border-l border-stone-200 transition-colors flex items-center justify-center">
               <Search className="w-5 h-5 text-stone-600" />
            </button>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <a href="/login" className="flex flex-col items-center gap-0.5 group">
              <User className="w-5 h-5 text-stone-700 group-hover:text-black" />
              <span className="text-[10px] font-bold text-stone-700 hidden md:block">Log In</span>
            </a>
            <div className="w-[1px] h-8 bg-stone-300/60 hidden md:block" />
            <button id="nav-cart-icon" onClick={() => setShowCart(true)} className="relative flex flex-col items-center justify-center group outline-none">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-stone-700 group-hover:text-black" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#feee00]">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-stone-700 hidden md:block mt-0.5">Cart</span>
            </button>
          </div>
        </div>
        
        {/* Categories Secondary Navbar */}
        <div className="bg-white border-b border-stone-200 hidden md:block">
           <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-10 overflow-x-auto text-sm font-semibold">
             <div className="flex items-center gap-2 text-blue-600 border-r border-stone-200 pr-6 uppercase tracking-wider text-xs">
               <Menu className="w-4 h-4" />
               All Categories
             </div>
             <button onClick={() => setSelectedCategory(null)} className={`whitespace-nowrap hover:text-blue-600 ${!selectedCategory ? 'text-blue-600' : 'text-stone-600'}`}>
               Home
             </button>
             {categories.map(c => (
               <button key={c} onClick={() => setSelectedCategory(c)} className={`whitespace-nowrap hover:text-blue-600 ${selectedCategory === c ? 'text-blue-600' : 'text-stone-600'}`}>
                 {c}
               </button>
             ))}
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="pt-20 md:pt-32 pb-24 max-w-7xl mx-auto px-4">
        
        {/* Promotional Hero Carousel Banner */}
        <div className="w-full bg-[#fceb00] rounded-xl overflow-hidden shadow-sm mb-8 flex items-center justify-between px-8 py-10 border border-yellow-300">
           <div className="max-w-md">
             <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-widest mb-4 inline-block">Mega Sale</span>
             <h1 className="text-4xl md:text-5xl font-black text-black leading-tight mb-4">
               Big Deals <br/> Up to 70% Off
             </h1>
             <p className="text-black/80 font-medium mb-6">Discover the most exclusive products from the best verified vendors today.</p>
             <button className="bg-black text-white px-6 py-3 rounded text-sm font-bold shadow hover:bg-stone-800 transition-colors">
               Shop Now
             </button>
           </div>
           <div className="hidden md:flex gap-4">
               {/* Faux featured images floating right */}
               <div className="w-32 h-40 bg-white p-2 shadow rounded transform -rotate-6 transition-transform hover:scale-105">
                  <div className="w-full h-full bg-stone-100 rounded-sm flex items-center justify-center border border-stone-200">
                    <ShoppingBag className="w-8 h-8 text-stone-300" />
                  </div>
               </div>
               <div className="w-32 h-40 bg-white p-2 shadow rounded transform rotate-3 transition-transform hover:scale-105 mt-8">
                  <div className="w-full h-full bg-stone-100 rounded-sm flex items-center justify-center border border-stone-200">
                    <ShoppingBag className="w-8 h-8 text-stone-300" />
                  </div>
               </div>
           </div>
        </div>

        {/* Vendors Filter Strip */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-8 flex items-center overflow-x-auto gap-4 scrollbar-hide border border-stone-100">
           <span className="text-xs font-bold uppercase text-stone-400 tracking-wider shrink-0 flex items-center gap-2">
             <Store className="w-4 h-4"/>
             Stores
           </span>
           <div className="w-[1px] h-6 bg-stone-200 shrink-0 mx-2" />
           <button 
             onClick={() => setSelectedStore(null)}
             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${!selectedStore ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}
           >
             All Stores
           </button>
           {stores.map(s => (
             <button 
               key={s}
               onClick={() => setSelectedStore(s)}
             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${selectedStore === s ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}
             >
               {s}
             </button>
           ))}
        </div>

        {/* Product Grid Header */}
        <div className="mb-6 flex items-center justify-between">
           <h2 className="text-xl font-bold">Recommended for you</h2>
           <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center">View all <ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-4">
          {filteredProducts.map((product, index) => (
             <motion.div 
               key={product.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3, delay: index * 0.05 }}
               className="bg-white rounded-md shadow-sm hover:shadow-lg transition-shadow border border-stone-100 flex flex-col group overflow-hidden"
             >
                <div className="relative aspect-square p-4 bg-white flex items-center justify-center border-b border-stone-100">
                    <img 
                      src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'} 
                      alt={product.name}
                      className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-yellow-600" /> Best Seller
                    </div>
                </div>
                
                <div className="p-3 flex flex-col flex-1">
                   <p className="text-xs text-stone-500 mb-1 line-clamp-1">{product.store_name} • {product.category}</p>
                   <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors h-10">
                     {product.name}
                   </h3>
                   <div className="mt-auto">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-stone-900">${product.price.toFixed(2)}</span>
                     </div>
                     <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mb-3 bg-emerald-50 w-max px-1.5 py-0.5 rounded">
                        <Zap className="w-3 h-3 fill-emerald-600"/> EXPRESS
                     </div>
                     
                     {/* Preview Point description */}
                     {product.description_points && product.description_points.length > 0 && (
                        <div className="text-xs mb-3 text-stone-600 bg-stone-50 p-2 rounded line-clamp-2 border border-stone-100 min-h-[50px]">
                           <strong>{product.description_points[0]?.title}: </strong>
                           {product.description_points[0]?.desc}
                        </div>
                     )}

                     <button
                       onClick={(e) => { e.stopPropagation(); addToCart(product, e); }}
                       className="w-full bg-white border border-blue-600 text-blue-600 rounded font-bold py-2 text-sm hover:bg-blue-50 transition-colors shadow-sm"
                     >
                       Add to cart
                     </button>
                   </div>
                </div>
             </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-stone-500">
               <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="text-lg font-medium">No products found.</p>
               <p className="text-sm">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {flyingItems.map(item => {
          const cartIcon = document.getElementById('nav-cart-icon');
          const targetX = cartIcon ? cartIcon.getBoundingClientRect().left : window.innerWidth - 60;
          const targetY = cartIcon ? cartIcon.getBoundingClientRect().top : 20;
          return (
            <motion.img
              key={item.id}
              src={item.url}
              initial={{ x: item.x, y: item.y, scale: 1, opacity: 1 }}
              animate={{ x: targetX, y: targetY, scale: 0.1, opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-16 h-16 object-cover rounded-md pointer-events-none fixed z-[100] shadow-xl border-2 border-orange-400"
            />
          );
        })}
      </AnimatePresence>

      {/* Shopping Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5"/> Your Cart
                </h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-stone-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Your cart is empty.</p>
                    <p className="text-sm mt-1">Discover premium exclusive products.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img src={item.product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-semibold text-stone-900 leading-tight">{item.product.name}</h3>
                          <p className="text-xs text-stone-500 mt-1">{item.product.store_name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-orange-600">${item.product.price.toFixed(2)}</span>
                          <div className="flex items-center gap-3 bg-stone-50 rounded-lg px-2 py-1 border border-stone-200">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 text-stone-500 hover:text-stone-900 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 text-stone-500 hover:text-stone-900 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-stone-50">
                  <div className="mb-6">
                    {!appliedDiscount ? (
                      <div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Discount Code" 
                            className="flex-1 px-4 py-2 border border-stone-200 rounded-lg text-sm bg-white uppercase"
                            value={discountCodeInput}
                            onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                          />
                          <button 
                            onClick={handleApplyDiscount}
                            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-sm font-medium transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {discountError && <p className="text-red-500 text-xs mt-2">{discountError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <div>
                          <p className="text-sm font-bold text-emerald-700 uppercase flex items-center gap-1">
                            {appliedDiscount.code}
                            <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                              {appliedDiscount.discount_type === 'PERCENTAGE' ? `${appliedDiscount.value}% OFF` : `$${appliedDiscount.value} OFF`}
                            </span>
                          </p>
                          <p className="text-xs text-emerald-600 mt-0.5">Discount applied</p>
                        </div>
                        <button onClick={removeDiscount} className="text-stone-400 hover:text-stone-600 transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Subtotal</span>
                      <span className="font-medium">${cartTotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-bold text-lg pt-4 border-t border-stone-200">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button className="w-full py-4 rounded-xl bg-stone-900 text-white font-medium text-lg hover:bg-stone-800 transition-colors shadow-lg">
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
