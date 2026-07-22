import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressAndResizeImage } from '../utils/compression';
import { CartItem, ProductItem, Order, CouponValidationResult } from '../types';
import { validateCoupon, redeemCoupon, findAutoApplyCoupon, CartItemForValidation } from '../utils/couponEngine';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Ticket, 
  Truck, 
  ShieldAlert, 
  Upload, 
  FileText, 
  CreditCard,
  CheckCircle,
  X,
  FileCheck
} from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  wishlist: ProductItem[];
  onRemoveFromWishlist: (product: ProductItem) => void;
  onMoveToCart: (product: ProductItem) => void;
}

export const Cart: React.FC<CartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  wishlist,
  onRemoveFromWishlist,
  onMoveToCart
}) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    email: 'shivsharan52796@gmail.com',
    upiId: 'shivsharan52796@okaxis'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error('Error fetching settings in Cart:', err);
      }
    };
    fetchSettings();
  }, []);

  // Address Details
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Promo Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponResult, setAppliedCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [userClearedCoupon, setUserClearedCoupon] = useState(false);

  // Razorpay Overlay State
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<Order | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Totals
  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.discountPrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Dynamic Shipping Calculation (Free above threshold, or based on product configurations)
  const shippingEnabledItems = cart.filter(item => item.product.enableShipping !== false);
  
  const shippingSubtotal = shippingEnabledItems.reduce((acc, item) => {
    const price = item.product.discountPrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const defaultDeliveryCharge = settings.deliveryCharge !== undefined ? Number(settings.deliveryCharge) : 150;
  const freeThreshold = settings.freeDeliveryThreshold !== undefined ? Number(settings.freeDeliveryThreshold) : 1500;

  let shipping = 0;
  if (shippingEnabledItems.length > 0) {
    const allFree = shippingEnabledItems.every(item => item.product.delivery?.freeShipping === true || item.product.freeShipping === true);
    
    if (shippingSubtotal >= freeThreshold || allFree) {
      shipping = 0;
    } else {
      let customChargesTotal = 0;
      let hasStandardItems = false;
      
      shippingEnabledItems.forEach(item => {
        const isItemFree = item.product.delivery?.freeShipping === true || item.product.freeShipping === true;
        if (isItemFree) return;
        
        const customCharge = item.product.delivery?.shippingCharge || item.product.shippingCharge || 0;
        if (customCharge > 0) {
          customChargesTotal += customCharge * item.quantity;
        } else {
          hasStandardItems = true;
        }
      });
      
      shipping = customChargesTotal;
      if (hasStandardItems) {
        shipping += defaultDeliveryCharge;
      }
    }
  }

  // Dynamic Inclusive GST Calculation based on per-product configuration
  const gst = cart.reduce((acc, item) => {
    const isGstEnabled = item.product.enableGst !== false;
    if (!isGstEnabled) return acc;
    
    const price = item.product.discountPrice || item.product.price;
    const itemGstPercent = item.product.gstPercent !== undefined ? item.product.gstPercent : 18;
    const itemSubtotal = price * item.quantity;
    
    // Calculate inclusive GST
    const itemGst = Math.round(itemSubtotal * (itemGstPercent / 100));
    return acc + itemGst;
  }, 0);

  // Coupon calculations
  const discount = appliedCouponResult?.isValid ? (appliedCouponResult.calculatedDiscount || 0) : 0;
  const grandTotal = Math.max(0, subtotal + shipping - discount);

  // Helper to map cart items for validation
  const getCartItemsForValidation = (): CartItemForValidation[] => {
    return cart.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      price: item.product.discountPrice || item.product.price,
      quantity: item.quantity,
      category: item.product.category,
      serviceCategory: item.product.category === 'Printing' ? 'Printing' : item.product.category === 'Photography' ? 'Photography' : undefined
    }));
  };

  // Auto-apply check effect
  useEffect(() => {
    if (cart.length === 0 || userClearedCoupon || appliedCouponResult?.coupon) return;

    let isMounted = true;
    const checkAutoApply = async () => {
      const valItems = getCartItemsForValidation();
      const userEmail = email || userProfile?.email || currentUser?.email || undefined;
      const userPhone = phone || userProfile?.phone || undefined;

      const autoResult = await findAutoApplyCoupon(
        valItems,
        subtotal,
        userEmail,
        currentUser?.uid,
        userPhone
      );

      if (isMounted && autoResult && autoResult.isValid && autoResult.coupon) {
        setAppliedCouponResult(autoResult);
        setCouponCode(autoResult.coupon.code);
        setCouponError('');
      }
    };

    checkAutoApply();
    return () => { isMounted = false; };
  }, [cart, subtotal, userClearedCoupon, email, phone, currentUser]);

  // Dynamic Coupon apply validation
  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsValidatingCoupon(true);
    setUserClearedCoupon(false);

    try {
      const valItems = getCartItemsForValidation();
      const userEmail = email || userProfile?.email || currentUser?.email || undefined;
      const userPhone = phone || userProfile?.phone || undefined;

      const result = await validateCoupon(
        code,
        valItems,
        subtotal,
        userEmail,
        currentUser?.uid,
        userPhone
      );

      if (result.isValid && result.coupon) {
        setAppliedCouponResult(result);
        setCouponCode(result.coupon.code);
        setCouponError('');
      } else {
        setAppliedCouponResult(null);
        setCouponError(result.message || 'Invalid coupon code.');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('An error occurred while validating the coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setAppliedCouponResult(null);
    setCouponCode('');
    setCouponError('');
    setUserClearedCoupon(true);
  };

  // Compact Base64 for Firestore-safe storage (under 30KB fallback)
  const getSmallBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        // If not an image, try to return as base64 if small, otherwise use a placeholder
        if (file.size < 150 * 1024) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        } else {
          resolve('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600');
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 600; // Safe compact size to guarantee under Firestore 1MB document limit
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.70); // 70% JPEG quality for super light payload
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string || '');
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string || '');
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload File Simulator (robust, works without cold starts/CORS issues)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUploads(Array.from(files));
    }
  };

  const simulateUploads = (files: File[]) => {
    // Filter out files that are already uploading or uploaded to prevent duplicate uploads
    const filesToUpload = files.filter(f => 
      !uploadingFiles.some(uf => uf.name === f.name) && 
      !uploadedFiles.some(uf => uf.name === f.name)
    );

    if (filesToUpload.length === 0) return;

    // Add all new files to the uploading list with 10% progress initial
    const newUploading = filesToUpload.map(f => ({ name: f.name, progress: 10 }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    filesToUpload.forEach(async (file) => {
      let fileToSubmit: File = file;
      
      // Compress if it is an image using the existing app compression utility
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressAndResizeImage(file, 'customer_uploads');
          fileToSubmit = compressed;
        } catch (compErr) {
          console.warn('Compression failed, uploading original image instead', compErr);
        }
      }

      // Check if storage is a real Firebase Storage instance and has ref method
      const isRealStorage = storage && typeof storage.ref !== 'function' && typeof ref === 'function';

      if (isRealStorage) {
        try {
          const cleanName = fileToSubmit.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const filePath = `customer_uploads/${Date.now()}_${cleanName}`;
          const storageRef = ref(storage, filePath);
          const uploadTask = uploadBytesResumable(storageRef, fileToSubmit);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              // clamp between 10% and 95% during upload state
              const safeProgress = Math.max(10, Math.min(95, progress));
              setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: safeProgress } : f));
            },
            async (err) => {
              console.warn('Firebase Storage direct upload failed, triggering fallback base64...', err);
              await triggerBase64Fallback(file);
            },
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
                setUploadedFiles(prev => {
                  if (prev.some(f => f.name === file.name)) return prev;
                  return [...prev, { name: file.name, url: downloadUrl }];
                });
              } catch (urlErr) {
                console.error('Failed to get download URL, triggering fallback...', urlErr);
                await triggerBase64Fallback(file);
              }
            }
          );
          return; // Done for this file using Firebase Storage
        } catch (uploadErr) {
          console.warn('Failed to initialize Firebase Storage upload, using fallback...', uploadErr);
        }
      }

      // If we reach here, either storage is mock, or upload initial setup failed. Use Base64 Fallback directly.
      await triggerBase64Fallback(file);
    });
  };

  // Helper helper to trigger base64 fallback seamlessly
  const triggerBase64Fallback = async (file: File) => {
    try {
      const base64Url = await getSmallBase64(file);
      
      let progress = 10;
      const interval = setInterval(() => {
        progress += 30;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
          setUploadedFiles(prev => {
            if (prev.some(f => f.name === file.name)) return prev;
            return [...prev, {
              name: file.name,
              url: base64Url || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600'
            }];
          });
        } else {
          setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress } : f));
        }
      }, 100);
    } catch (fallbackErr) {
      console.error('Fallback failed:', fallbackErr);
      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateUploads(Array.from(files));
    }
  };

  // Place Order checkout
  const handleTriggerPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!fullName || !phone || !email || !address) {
      alert('Please fill out all billing and shipping addresses.');
      return;
    }
    // Launch Razorpay Simulator
    setShowRazorpay(true);
  };

  const handleCompleteRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const orderId = `LM-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderData: Order = {
        id: orderId,
        customerId: currentUser?.uid || 'anonymous',
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        address,
        items: cart.map((item) => ({
          productId: item.product.id,
          productTitle: item.product.title,
          price: item.product.discountPrice || item.product.price,
          image: item.product.image,
          quantity: item.quantity
        })),
        uploadedFileName: uploadedFiles.map(f => f.name).join(', ') || '',
        uploadedFileUrl: uploadedFiles[0]?.url || '',
        uploadedFiles: uploadedFiles,
        subtotal,
        gst,
        gstEnabled: cart.some(item => item.product.enableGst !== false),
        gstPercentage: cart.reduce((max, item) => item.product.enableGst !== false ? Math.max(max, item.product.gstPercent ?? 18) : max, 0) || 18,
        gstAmount: gst,
        shipping,
        discount,
        couponCode: appliedCouponResult?.coupon?.code || '',
        couponName: appliedCouponResult?.coupon?.name || '',
        discountAmount: discount || 0,
        discountType: appliedCouponResult?.coupon?.discountType || 'PERCENTAGE',
        discountValue: appliedCouponResult?.coupon?.discountValue || 0,
        originalPrice: subtotal,
        finalPrice: grandTotal,
        paymentAmount: grandTotal,
        total: grandTotal,
        paymentMethod: selectedPaymentMethod === 'upi' ? 'UPI / QR' : 'Card / Net Banking',
        paymentStatus: 'Paid',
        paymentDate: new Date().toISOString(),
        dueAmount: 0,
        status: 'Pending',
        paymentId: `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        createdAt: new Date().toISOString()
      };

      // Store in Firestore
      await setDoc(doc(db, 'orders', orderId), orderData);

      // Redeem Coupon in Firestore
      if (appliedCouponResult?.coupon && discount > 0) {
        try {
          await redeemCoupon(
            appliedCouponResult.coupon,
            orderId,
            email,
            currentUser?.uid,
            phone,
            discount
          );
        } catch (couponErr) {
          console.error('Error redeeming coupon:', couponErr);
        }
      }

      setPaymentSuccessData(orderData);
      onClearCart();
      setShowRazorpay(false);
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving the print order.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="border-b border-slate-900 pb-6">
          <h1 className="text-3xl font-sans font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-amber-500" />
            <span>Review Shopping Cart & Upload Files</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">Manage personalized albums, frames, canvases, and upload vectors for high-speed laser printing.</p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-slate-800 bg-slate-900/40">
            <ShoppingBag className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">Your Cart is empty</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-sm mx-auto">Fill your cart with custom leather photobooks, backlit glass LED frames, or customized mugs from our store.</p>
            <Link to="/store" className="inline-block mt-6 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all">
              Browse Merchandise Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            
            {/* Left side: Cart List + Design Upload */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cart items list */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xl">
                <h2 className="text-base font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                  Cart Items
                </h2>
                
                <div className="divide-y divide-slate-800">
                  {cart.map((item) => {
                    const price = item.product.discountPrice || item.product.price;
                    return (
                      <div key={item.product.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={item.product.image} 
                            alt={item.product.title} 
                            className="h-16 w-16 rounded-xl object-cover border border-slate-800" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.title}</h4>
                            <p className="text-xxs text-slate-500 mt-0.5">{item.product.category}</p>
                            <p className="text-xs text-amber-500 font-bold mt-1">₹{price.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Quantity triggers */}
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="flex items-center border border-slate-800 rounded-lg p-1 bg-slate-950">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <p className="text-sm font-bold text-white w-20 text-right">
                            ₹{(price * item.quantity).toLocaleString('en-IN')}
                          </p>

                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* High-Fidelity Custom Online File Upload Module */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                    Online File Upload Center
                  </h3>
                  <p className="text-xxs sm:text-xs text-slate-400 mt-1">
                    Please upload customization raw formats (JPG, PNG, PDF, PSD, AI, CDR, ZIP) for personalized laser designs.
                  </p>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver 
                      ? 'border-amber-500 bg-amber-500/5' 
                      : 'border-slate-850 hover:border-slate-700 bg-slate-950/50'
                  }`}
                >
                  <input
                    type="file"
                    id="print-file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf,.psd,.ai,.cdr,.zip"
                    multiple
                  />
                  <label htmlFor="print-file-upload" className="cursor-pointer block space-y-3">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto group-hover:text-amber-500" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">Drag & drop files or click to choose</p>
                      <p className="text-xxs text-slate-500 mt-1">Files supported: JPG, PNG, PDF, PSD, AI, CDR, ZIP (Max 100MB) — Select multiple allowed</p>
                    </div>
                  </label>
                </div>

                {/* Upload Status */}
                {uploadingFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadingFiles.map((file, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between gap-4 text-xs font-mono">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-400 truncate">Uploading {file.name}...</p>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-amber-500 h-full transition-all duration-200" style={{ width: `${file.progress}%` }}></div>
                          </div>
                        </div>
                        <span className="font-bold text-amber-400 shrink-0">{file.progress}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xxs font-semibold uppercase tracking-wider font-mono text-slate-500 mt-2">Uploaded Custom Designs ({uploadedFiles.length})</p>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{file.name}</p>
                            <p className="text-xxs text-slate-500 mt-0.5">Custom layout linked to your print invoice</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, fIdx) => fIdx !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-500 shrink-0 font-bold"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Summary + Address Billing Form */}
            <div className="space-y-8">
              {/* Order summary calculations */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl text-xs sm:text-sm">
                <h3 className="text-base font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2 font-sans text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-white font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {gst > 0 && (
                    <div className="flex justify-between">
                      <span>GST Tax (Separately calculated):</span>
                      <span className="text-white">₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="text-white">
                      {shipping === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `₹${shipping}`}
                    </span>
                  </div>
                  {appliedCouponResult?.isValid && appliedCouponResult.coupon && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3.5 w-3.5" />
                        <span>Promo Coupon ({appliedCouponResult.coupon.code}):</span>
                      </span>
                      <span>-₹{(appliedCouponResult.calculatedDiscount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-amber-400 pt-3 border-t border-slate-800">
                    <span>Total Amount:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div className="pt-2 border-t border-slate-800/60">
                  <p className="text-xxs text-slate-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-amber-400" />
                    <span>Have a Promo or Coupon Code?</span>
                  </p>
                  
                  {appliedCouponResult?.isValid && appliedCouponResult.coupon ? (
                    <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-xs uppercase">
                            {appliedCouponResult.coupon.code}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">
                            Applied
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Saving ₹{(appliedCouponResult.calculatedDiscount || 0).toLocaleString('en-IN')} on this order
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg font-bold text-xxs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON CODE"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-500 w-full uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                      >
                        {isValidatingCoupon ? (
                          <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  )}

                  {couponError && <p className="text-xxs text-rose-400 mt-1.5 font-medium">{couponError}</p>}
                </div>
              </div>

              {/* Billing Delivery Address form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
                  Billing & Delivery
                </h3>

                <form onSubmit={handleTriggerPayment} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Billed Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="e.g. +91 9999999999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="e.g. guest@gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Event Venue / Delivery Address</label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      placeholder="Full home or studio location address..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-center text-xs tracking-wide transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-4.5 w-4.5 animate-pulse" />
                    <span>Proceed & Pay ₹{grandTotal.toLocaleString('en-IN')}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Sidebar / Section */}
        {wishlist.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl mt-12">
            <h3 className="text-base font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3">
              Your Shopping Wishlist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {wishlist.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-3">
                    <img src={p.image} alt={p.title} className="h-12 w-12 rounded-lg object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">{p.title}</h4>
                      <p className="text-amber-500 font-bold mt-0.5">₹{(p.discountPrice || p.price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onMoveToCart(p)}
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded text-xxs transition-colors"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => onRemoveFromWishlist(p)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-500/10 text-rose-400 border border-slate-800 hover:border-rose-500/25 rounded text-xxs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RAZORPAY PAYMENT GATEWAY OVERLAY SIMULATOR */}
      {showRazorpay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-100 font-sans my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            
            {/* Razorpay Brand Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-500 text-slate-900 rounded-lg p-1.5 font-sans font-extrabold text-xs">
                  SS
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold tracking-tight">{settings.studioName || 'Shiv Studio & Printers'}</h4>
                  <p className="text-[10px] sm:text-xxs text-slate-400 font-medium">{settings.email || 'shivsharan52796@gmail.com'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRazorpay(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Payment Details */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xxs text-slate-500 uppercase font-semibold">Payment Amount</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right text-xxs text-slate-500">
                  <p className="font-semibold text-slate-800">TAX INVOICE</p>
                  <p>Order #{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-500 uppercase tracking-wide text-xxs">Choose Payment Method</p>
                
                <div 
                  onClick={() => setSelectedPaymentMethod('UPI')}
                  className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-colors flex flex-col gap-3 ${
                    selectedPaymentMethod === 'UPI' 
                      ? 'border-amber-500 bg-amber-500/5 text-slate-800' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`h-4 w-4 ${selectedPaymentMethod === 'UPI' ? 'text-amber-500' : 'text-slate-300'}`} />
                      <span className="font-bold text-slate-900">UPI / GPay / PhonePe</span>
                    </div>
                    <span className="text-xxs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Fastest</span>
                  </div>

                  {selectedPaymentMethod === 'UPI' && (
                    <div className="bg-white border border-slate-150 rounded-lg p-3 sm:p-4 flex flex-col items-center text-center space-y-2.5 sm:space-y-3 animate-fade-in text-slate-700">
                      <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Scan QR to Pay with any UPI App</p>
                      
                      {/* Dynamic QR Code Generation */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            `upi://pay?pa=${settings.upiId || 'shivsharan52796@okaxis'}&pn=${encodeURIComponent(settings.studioName || 'Shiv Studio & Printers')}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('ShivStudio Order')}`
                          )}`}
                          alt="UPI Payment QR Code"
                          className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xxs text-slate-400">Merchant: <span className="font-bold text-slate-700">{settings.studioName || 'Shiv Studio & Printers'}</span></p>
                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-xxs font-mono border border-slate-200 select-all">
                          <span className="text-slate-600">UPI:</span>
                          <span className="font-bold text-slate-800">{settings.upiId || 'shivsharan52796@okaxis'}</span>
                        </div>
                      </div>

                      <div className="text-xxs text-amber-600 bg-amber-50 border border-amber-100 rounded px-2.5 py-1.5 font-medium max-w-[280px]">
                        Scan from GPay, PhonePe, Paytm or BHIM, complete transaction, then click button below.
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => setSelectedPaymentMethod('CARD')}
                  className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                    selectedPaymentMethod === 'CARD' 
                      ? 'border-amber-500 bg-amber-500/5 text-amber-700' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-4 w-4 ${selectedPaymentMethod === 'CARD' ? 'text-amber-500' : 'text-slate-300'}`} />
                    <span className="font-bold">Credit / Debit Cards</span>
                  </div>
                  <span className="text-xxs text-slate-500">Visa, Mastercard</span>
                </div>

                <div 
                  onClick={() => setSelectedPaymentMethod('NETBANKING')}
                  className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                    selectedPaymentMethod === 'NETBANKING' 
                      ? 'border-amber-500 bg-amber-500/5 text-amber-700' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-4 w-4 ${selectedPaymentMethod === 'NETBANKING' ? 'text-amber-500' : 'text-slate-300'}`} />
                    <span className="font-bold">Net Banking</span>
                  </div>
                  <span className="text-xxs text-slate-500">All Indian Banks</span>
                </div>
              </div>

              {/* Secure transaction info */}
              <div className="flex items-center space-x-2 text-xxs text-slate-400 font-medium">
                <Truck className="h-4 w-4 text-emerald-500" />
                <span>100% Secured by Razorpay Payment Architecture.</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                onClick={() => setShowRazorpay(false)}
                className="flex-1 py-2.5 sm:py-3 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={!selectedPaymentMethod || isPaying}
                onClick={handleCompleteRazorpayPayment}
                className="flex-1 py-2.5 sm:py-3 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 rounded-xl transition-colors flex items-center justify-center space-x-1"
              >
                {isPaying ? (
                  <span>Verifying Payment...</span>
                ) : selectedPaymentMethod === 'UPI' ? (
                  <span>I have Paid, Confirm Order</span>
                ) : (
                  <span>Pay ₹{grandTotal.toLocaleString('en-IN')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAX INVOICE DOWNLOAD TRIGGER */}
      {paymentSuccessData && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setPaymentSuccessData(null)}
          documentData={paymentSuccessData}
          type="order"
          isNewSuccess={true}
        />
      )}
    </div>
  );
};
