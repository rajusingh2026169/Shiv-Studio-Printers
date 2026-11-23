import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProductItem, ProductVariant, VideoItem } from '../types';
import { getProductImages } from '../utils/productService';
import { getVideosForCategory } from '../utils/videoService';
import { VideoPlayer } from '../components/VideoPlayer';
import { OfferBannerDisplay } from '../components/OfferBannerDisplay';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../context/AuthContext';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { StudioImage } from '../components/StudioMedia';
import { Star, Search, Filter, ShoppingCart, Heart, Eye, CheckCircle, Flame, Film, Image as ImageIcon, AlertCircle, Layers } from 'lucide-react';

interface StoreProps {
  onAddToCart: (product: ProductItem, variant?: ProductVariant, quantity?: number) => void;
  onToggleWishlist: (product: ProductItem) => void;
  wishlist: string[];
}

export const Store: React.FC<StoreProps> = ({ onAddToCart, onToggleWishlist, wishlist }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({ studioName: 'SHIV STUDIO' });

  const handleSelectProduct = async (product: ProductItem) => {
    setSelectedProduct(product);
    
    // Auto-select first active variant if variants exist
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const activeVars = product.variants.filter(v => v.status === 'Active');
      setSelectedVariant(activeVars.length > 0 ? activeVars[0] : product.variants[0]);
    } else {
      setSelectedVariant(null);
    }

    let galleryImgs = product.images || [];
    if (galleryImgs.length === 0) {
      galleryImgs = await getProductImages(product.id);
    }
    const productVideos = await getVideosForCategory('products', product.id);
    setSelectedProduct(prev => prev && prev.id === product.id ? { 
      ...prev, 
      images: galleryImgs,
      videos: productVideos
    } : prev);
  };

  useEffect(() => {
    setLoading(true);
    setStoreError(null);

    // 1. Subscribe to Firestore 'products' collection in real-time
    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(
      productsRef,
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          console.log('[Data Source: Local Cache] Products snapshot received:', snapshot.docs.length);
        } else {
          console.log('[Data Source: Firestore] Products snapshot received:', snapshot.docs.length);
        }

        const loadedProducts = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as ProductItem)
        );
        setProducts(loadedProducts);
        setStoreError(null);
        setLoading(false);
      },
      (err) => {
        console.error('[Data Source Error] Failed to fetch products from Firestore:', err);
        setStoreError('Products are temporarily unavailable.');
        setProducts([]);
        setLoading(false);
      }
    );

    // 2. Fetch website settings
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (err: any) {
        console.warn('Notice (Store): Settings load issue:', err?.message || err);
      }
    };
    fetchSettings();

    return () => unsubscribeProducts();
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
    <div className="bg-[#111111] min-h-screen text-white py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Photo Frames, Albums & Custom Gifts — SHIV STUDIO & Arvind Creation"
        description="Order custom photo frames, LED frames, wedding albums, canvas prints, and personalized gifts from SHIV STUDIO (Arvind Creation) in Khaga, Fatehpur."
      />
      <div className="max-w-7xl mx-auto space-y-12">
        
        <OfferBannerDisplay position="product_store" className="mb-6" />

        {/* Store Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
            Arvind Creation — Custom Print & Merchandise
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Photo Frames, Albums & Custom Gifts
          </h1>
          <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base leading-relaxed">
            Order custom photo frames with multiple size options, velvet wedding albums, thermo-sensitive mugs, LED frames, and canvas wraps crafted in Khaga.
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
        {storeError ? (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">{storeError}</h3>
              <p className="text-sm text-slate-400">Unable to load products from Firestore at this time. Please check your network connection or try again later.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#1A1A1A] h-96 rounded-2xl border border-white/10"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-3xl border border-white/10 p-8 space-y-6 max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">No Products Available</h3>
              <p className="text-sm text-neutral-400">Our custom photo frames, albums, and personalized gifts are being updated.</p>
            </div>
            {isAdmin() ? (
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#c5a028] text-[#111111] font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-colors"
              >
                <span>Add Product in Admin Panel</span>
              </Link>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center space-x-2 bg-[#D4AF37] hover:bg-[#c5a028] text-[#111111] font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-colors"
              >
                <span>Enquire About Custom Framing</span>
              </Link>
            )}
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
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 cursor-pointer" onClick={() => handleSelectProduct(product)}>
                    <StudioImage 
                      src={product.image || product.thumbnailUrl} 
                      fallback={STUDIO_IMAGES.luxuryAlbumFrame}
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
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
                      onClick={() => handleSelectProduct(product)}
                      className="text-sm font-bold text-white group-hover:text-amber-400 cursor-pointer transition-colors line-clamp-1"
                    >
                      {product.title || product.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1.5 text-xs text-amber-500 font-sans">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-slate-200">{product.rating}</span>
                      <span className="text-slate-500">({product.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/60">
                  {(() => {
                    const activeVariants = (product.variants || []).filter(v => v.status === 'Active');
                    const hasVars = activeVariants.length > 0;
                    const minPrice = hasVars ? Math.min(...activeVariants.map(v => v.discountPrice || v.price)) : (product.discountPrice || product.price);
                    const maxPrice = hasVars ? Math.max(...activeVariants.map(v => v.discountPrice || v.price)) : (product.discountPrice || product.price);

                    return (
                      <div className="space-y-1 mb-4">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-lg font-bold text-amber-400">
                            {hasVars && minPrice !== maxPrice
                              ? `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`
                              : `₹${minPrice.toLocaleString('en-IN')}`}
                          </span>
                          {!hasVars && product.discountPrice && (
                            <span className="text-xs text-slate-500 line-through">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {hasVars && (
                          <span className="inline-block text-xxs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {activeVariants.length} Sizes / Options
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSelectProduct(product)}
                      className="py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{product.variants && product.variants.filter(v => v.status === 'Active').length > 0 ? 'Options' : 'Specs'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const activeVars = (product.variants || []).filter(v => v.status === 'Active');
                        if (activeVars.length > 0) {
                          handleSelectProduct(product);
                        } else {
                          onAddToCart(product);
                        }
                      }}
                      className="py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/5 flex items-center justify-center space-x-1"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>{product.variants && product.variants.filter(v => v.status === 'Active').length > 0 ? 'Choose Size' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (() => {
        const activeVariants = (selectedProduct.variants || []).filter(v => v.status === 'Active');
        const hasVariants = activeVariants.length > 0;
        const currentPrice = selectedVariant 
          ? (selectedVariant.discountPrice || selectedVariant.price) 
          : (selectedProduct.discountPrice || selectedProduct.price);
        const originalPrice = selectedVariant 
          ? selectedVariant.price 
          : selectedProduct.price;
        const hasDiscount = selectedVariant 
          ? (selectedVariant.discountPrice !== undefined && selectedVariant.discountPrice < selectedVariant.price) 
          : (selectedProduct.discountPrice !== undefined && selectedProduct.discountPrice < selectedProduct.price);
        const currentStock = selectedVariant ? selectedVariant.stock : selectedProduct.stock;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Media side (Images & Videos) */}
                <div className="space-y-4">
                  {/* Main cover image */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <StudioImage 
                      src={selectedVariant?.image || selectedProduct.image || selectedProduct.thumbnailUrl} 
                      fallback={STUDIO_IMAGES.luxuryAlbumFrame}
                      alt={selectedProduct.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  </div>

                  {/* Multiple Images Gallery */}
                  {selectedProduct.images && selectedProduct.images.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xxs font-bold text-amber-400 font-mono flex items-center space-x-1">
                        <ImageIcon className="h-3 w-3" />
                        <span>Product Photos ({selectedProduct.images.length})</span>
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedProduct.images.map((img, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                            <StudioImage 
                              src={img} 
                              fallback={STUDIO_IMAGES.luxuryAlbumFrame}
                              alt={`Product view ${i + 1}`} 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multiple Videos Section */}
                  {selectedProduct.videos && selectedProduct.videos.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <p className="text-xxs font-bold text-amber-400 font-mono flex items-center space-x-1">
                        <Film className="h-3 w-3" />
                        <span>Product Demo Videos ({selectedProduct.videos.length})</span>
                      </p>
                      <div className="space-y-3">
                        {selectedProduct.videos.map((vid) => (
                          <div key={vid.id} className="space-y-1">
                            <VideoPlayer
                              src={vid.videoUrl}
                              poster={vid.thumbnailUrl}
                              title={vid.title}
                              description={vid.description}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Data side */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-xxs uppercase tracking-wider">
                      {selectedProduct.category} Catalog
                    </span>
                    {hasVariants && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xxs">
                        {activeVariants.length} Sizes
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold leading-tight">{selectedProduct.title}</h2>
                  
                  <div className="flex items-center space-x-2 text-sm text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-white">{selectedProduct.rating}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{selectedProduct.reviewsCount} customer ratings</span>
                  </div>

                  {/* Dynamic Pricing Box */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-amber-400">
                        ₹{currentPrice.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span className="ml-2 text-sm text-slate-500 line-through">
                          ₹{originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      {selectedVariant && (
                        <p className="text-xxs text-slate-400 mt-0.5 font-mono">
                          Price for size: <span className="text-amber-400 font-bold">{selectedVariant.name}</span>
                        </p>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="bg-rose-600/90 text-white font-extrabold text-xxs px-2 py-1 rounded">
                        SAVE ₹{(originalPrice - currentPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Variant Selector */}
                  {hasVariants && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-amber-400" />
                          <span>Select Size / Option:</span>
                        </label>
                        {selectedVariant && (
                          <span className="text-xxs font-mono text-amber-400 font-semibold">
                            {selectedVariant.name}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {activeVariants.map((variant) => {
                          const isSelected = selectedVariant?.id === variant.id;
                          const variantPrice = variant.discountPrice || variant.price;
                          const isOutOfStock = variant.stock <= 0;

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => setSelectedVariant(variant)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-400/10 text-white ring-1 ring-amber-400 shadow-md shadow-amber-500/10'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                              } ${isOutOfStock ? 'opacity-50' : ''}`}
                            >
                              <p className="text-xs font-bold truncate">{variant.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-extrabold text-amber-400">
                                  ₹{variantPrice.toLocaleString('en-IN')}
                                </span>
                                {isOutOfStock ? (
                                  <span className="text-xxs text-rose-400 font-medium">Out of Stock</span>
                                ) : variant.stock < 5 ? (
                                  <span className="text-xxs text-amber-500 font-mono">{variant.stock} left</span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                      <span className={`${currentStock > 10 ? 'text-emerald-400' : currentStock > 0 ? 'text-amber-400' : 'text-rose-400'} font-semibold`}>
                        {currentStock > 10 ? 'In Stock' : currentStock > 0 ? `Only ${currentStock} left!` : 'Out of Stock'}
                      </span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex space-x-3">
                    <button
                      disabled={currentStock <= 0}
                      onClick={() => { 
                        onAddToCart(selectedProduct, selectedVariant || undefined, 1); 
                        setSelectedProduct(null); 
                      }}
                      className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {currentStock <= 0 
                          ? 'Out of Stock' 
                          : selectedVariant 
                          ? `Add to Cart • ₹${currentPrice.toLocaleString('en-IN')}` 
                          : 'Add to Cart'}
                      </span>
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
        );
      })()}
    </div>
  );
};
