import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProductItem } from '../types';
import { Star, Search, Filter, ShoppingCart, Heart, Eye, CheckCircle, Flame } from 'lucide-react';

interface StoreProps {
  onAddToCart: (product: ProductItem) => void;
  onToggleWishlist: (product: ProductItem) => void;
  wishlist: string[];
}

export const Store: React.FC<StoreProps> = ({ onAddToCart, onToggleWishlist, wishlist }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({ studioName: 'Shiv Studio & Printers' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductItem)));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error('Error fetching settings in Store:', err);
      }
    };
    fetchProducts();
    fetchSettings();
  }, []);

  const categories = [
    'All', 
    'Photo Frame', 
    'Canvas', 
    'LED Frame', 
    'Photo Album', 
    'Wedding Album', 
    'Mug Printing', 
    'T Shirt Printing'
  ];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                        p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const isProductInWishlist = (id: string) => wishlist.includes(id);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Store Header */}
        <div className="text-center space-y-4">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Premium Handcrafted Merchandise
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold text-white tracking-tight">
            E-Store & Personalized Gift Items
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Order custom photo albums, thermo-sensitive magic mugs, LED frames, or canvas wraps. Add designs and get premium-quality deliverables dispatched.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white focus:border-amber-500 outline-none placeholder:text-slate-500"
              placeholder="Search custom frames, albums, cushions..."
            />
          </div>

          {/* Categories select fallback/tab */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-amber-500 text-slate-950 font-bold' 
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* E-commerce grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-slate-900 h-96 rounded-2xl animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/25 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No Products Available</h3>
              <p className="text-sm text-slate-400">Our custom photo frames, albums, and personalized merchandise are currently being prepared.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all animate-bounce"
            >
              <span>Add New Product (Admin)</span>
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs sm:text-sm">
            <p>No customized merchandise matches your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-lg relative"
              >
                {/* Wishlist toggle */}
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`absolute top-6 right-6 z-10 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-850 hover:scale-105 transition-transform ${
                    isProductInWishlist(product.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${isProductInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>

                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {product.discountPrice && (
                      <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white font-extrabold text-xxs px-2.5 py-1 rounded-md">
                        SALE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <span className="text-xxs text-slate-500 font-mono uppercase tracking-wide">{product.category}</span>
                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="text-sm font-bold text-white group-hover:text-amber-400 cursor-pointer transition-colors line-clamp-1"
                    >
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center space-x-1.5 text-xs text-amber-500 font-sans">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-slate-200">{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/60">
                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-lg font-bold text-amber-400">
                      ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                    </span>
                    {product.discountPrice && (
                      <span className="text-xs text-slate-500 line-through">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Specs</span>
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/5 flex items-center justify-center space-x-1"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Image side */}
              <div className="space-y-3">
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.images && selectedProduct.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-800">
                      <img 
                        src={img} 
                        alt="product alternate look" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Data side */}
              <div className="space-y-4">
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-xxs uppercase tracking-wider">
                  {selectedProduct.category} Catalog
                </span>

                <h2 className="text-lg sm:text-xl font-bold leading-tight">{selectedProduct.title}</h2>
                
                <div className="flex items-center space-x-2 text-sm text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold text-white">{selectedProduct.rating}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{selectedProduct.reviewsCount} customer ratings</span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-extrabold text-amber-400">
                    ₹{(selectedProduct.discountPrice || selectedProduct.price).toLocaleString('en-IN')}
                  </span>
                  {selectedProduct.discountPrice && (
                    <span className="text-sm text-slate-500 line-through">
                      ₹{selectedProduct.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{selectedProduct.description}</p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850/50 text-xxs space-y-1.5 font-sans">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Dispatched Location:</span>
                    <span className="text-slate-300">{settings.studioName || 'Shiv Studio'} / All India</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Customization File Required:</span>
                    <span className="text-amber-500 font-semibold">Yes (during checkout)</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Stock Availability:</span>
                    <span className={`${selectedProduct.stock > 10 ? 'text-emerald-400' : 'text-rose-400'} font-semibold`}>
                      {selectedProduct.stock > 10 ? 'In Stock' : `Only ${selectedProduct.stock} left!`}
                    </span>
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex space-x-3">
                  <button
                    onClick={() => { onAddToCart(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => { onToggleWishlist(selectedProduct); }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700"
                  >
                    <Heart className={`h-4.5 w-4.5 ${isProductInWishlist(selectedProduct.id) ? 'text-rose-500 fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
