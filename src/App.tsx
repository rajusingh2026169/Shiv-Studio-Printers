import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Landing } from './pages/Landing';
import { Services } from './pages/Services';
import { Gallery } from './pages/Gallery';
import { Store } from './pages/Store';
import { Cart } from './pages/Cart';
import { BookingPage } from './pages/Booking';
import { TrackOrder } from './pages/TrackOrder';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import { WeddingCards } from './pages/WeddingCards';
import { WeddingCardDetail } from './pages/WeddingCardDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { PhotographerPanel } from './pages/dashboard/PhotographerPanel';
import { StaffPanel } from './pages/dashboard/StaffPanel';
import { CustomerPortal } from './pages/dashboard/CustomerPortal';
import { CartItem, ProductItem, ProductVariant } from './types';
import { seedDatabaseIfNeeded } from './firebase';

// Role-based route guardian
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center text-slate-400 font-mono text-xs">
        Verifying Authorized Security Token...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const MainAppContent: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<ProductItem[]>([]);

  // Local storage cache syncer for persistent shopping sessions and database seeding
  useEffect(() => {
    const cachedCart = localStorage.getItem('shivstudio_cart');
    const cachedWishlist = localStorage.getItem('shivstudio_wishlist');
    if (cachedCart) {
      try {
        const parsed = JSON.parse(cachedCart);
        // Normalize cart items with id and productId
        const normalized: CartItem[] = (Array.isArray(parsed) ? parsed : []).map(item => ({
          ...item,
          id: item.id || (item.selectedVariantId ? `${item.productId || item.product?.id}_${item.selectedVariantId}` : (item.productId || item.product?.id)),
          productId: item.productId || item.product?.id
        }));
        setCart(normalized);
      } catch (err) {
        console.error('Error parsing cached cart:', err);
      }
    }
    if (cachedWishlist) setWishlist(JSON.parse(cachedWishlist));
    seedDatabaseIfNeeded();
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('shivstudio_cart', JSON.stringify(newCart));
  };

  const saveWishlist = (newWishlist: ProductItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem('shivstudio_wishlist', JSON.stringify(newWishlist));
  };

  const handleAddToCart = (product: ProductItem, variant?: ProductVariant, quantity: number = 1) => {
    const variantId = variant?.id;
    const variantName = variant?.name;
    const variantPrice = variant ? (variant.discountPrice || variant.price) : undefined;
    const cartItemId = variantId ? `${product.id}_${variantId}` : product.id;

    // Check if exact product + variant combination is already in cart
    const existingIndex = cart.findIndex(item => 
      (item.id === cartItemId) || 
      (item.productId === product.id && (item.selectedVariantId || '') === (variantId || ''))
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + (quantity || 1)
      };
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product,
        selectedVariantId: variantId,
        selectedVariantName: variantName,
        selectedVariantPrice: variantPrice,
        quantity: quantity || 1
      };
      saveCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (cartItemId: string, quantity: number, variantId?: string) => {
    const updated = cart.map(item => {
      const matches = item.id === cartItemId || 
        (item.productId === cartItemId && (variantId === undefined || (item.selectedVariantId || '') === (variantId || '')));
      return matches ? { ...item, quantity: Math.max(1, quantity) } : item;
    });
    saveCart(updated);
  };

  const handleRemoveFromCart = (cartItemId: string, variantId?: string) => {
    const updated = cart.filter(item => {
      const matches = item.id === cartItemId || 
        (item.productId === cartItemId && (variantId === undefined || (item.selectedVariantId || '') === (variantId || '')));
      return !matches;
    });
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleToggleWishlist = (product: ProductItem) => {
    const isPresent = wishlist.some(item => item.id === product.id);
    if (isPresent) {
      const updated = wishlist.filter(item => item.id !== product.id);
      saveWishlist(updated);
    } else {
      const updated = [...wishlist, product];
      saveWishlist(updated);
    }
  };

  const handleRemoveFromWishlist = (product: ProductItem) => {
    const updated = wishlist.filter(item => item.id !== product.id);
    saveWishlist(updated);
  };

  const handleMoveToCart = (product: ProductItem, variant?: ProductVariant) => {
    handleAddToCart(product, variant);
    handleRemoveFromWishlist(product);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans selection:bg-amber-400 selection:text-slate-950">
      <Navbar 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        wishlistCount={wishlist.length} 
      />

      <main className="flex-grow">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/wedding-cards" element={<WeddingCards />} />
          <Route path="/wedding-cards/:id" element={<WeddingCardDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/gallery" element={<Gallery />} />
          
          <Route 
            path="/store" 
            element={
              <Store 
                onAddToCart={handleAddToCart} 
                onToggleWishlist={handleToggleWishlist} 
                wishlist={wishlist.map(w => w.id)} 
              />
            } 
          />

          <Route 
            path="/cart" 
            element={
              <Cart 
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                wishlist={wishlist}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                onMoveToCart={handleMoveToCart}
              />
            } 
          />

          <Route path="/booking" element={<BookingPage />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Role-based Portals */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'Super Admin', 'Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'Super Admin', 'Admin']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'Super Admin', 'Admin']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/customer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['customer', 'Customer']}>
                <CustomerPortal />
              </ProtectedRoute>
            } 
          />

          {/* Legacy compatibility fallbacks */}
          <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard/customer" element={<Navigate to="/customer/dashboard" replace />} />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </Router>
  );
}
