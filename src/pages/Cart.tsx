import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

import { CartItem, ProductItem, Order, CouponValidationResult, UploadedFileRecord, WeddingCardItem, WeddingCardCustomization } from '../types';
import { validateCoupon, redeemCoupon, findAutoApplyCoupon, CartItemForValidation } from '../utils/couponEngine';
import { calculateWeddingCardPriceBreakdown } from '../utils/weddingCardPricing';
import { uploadOriginalClientPhoto, formatBytes, cleanFileName, UploadProgressDetails } from '../utils/clientPhotoUploader';
import { sendOrderMessage } from '../utils/messageService';
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
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';
import { StudioImage } from '../components/StudioMedia';
import { STUDIO_IMAGES } from '../assets/studioAssets';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemoveFromCart: (productId: string, variantId?: string) => void;
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
      } catch (err: any) {
        console.warn('Notice (Cart): Offline mode or network issue, using default settings.');
      }
    };
    fetchSettings();
  }, []);

  // Helper to get unit price respecting variant selection
  const getItemUnitPrice = (item: CartItem): number => {
    if (item.selectedVariantPrice !== undefined) {
      return item.selectedVariantPrice;
    }
    return item.product.discountPrice || item.product.price;
  };

  // Helper to get full line subtotal (includes printing & customization charges for wedding cards)
  const getItemLineSubtotal = (item: CartItem): number => {
    const unitPrice = getItemUnitPrice(item);
    return unitPrice * item.quantity + (item.printingCharge || 0) + (item.customizationCharge || 0);
  };

  // Helper to recursively omit undefined keys for Firestore safety
  const stripUndefined = <T,>(val: T): T => {
    if (Array.isArray(val)) {
      return val.map((v) => stripUndefined(v)) as unknown as T;
    }
    if (val && typeof val === 'object') {
      const out: Record<string, any> = {};
      Object.entries(val as Record<string, any>).forEach(([k, v]) => {
        if (v !== undefined) {
          out[k] = stripUndefined(v);
        }
      });
      return out as T;
    }
    return val;
  };

  // Address Details
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [address, setAddress] = useState(userProfile?.address || '');

  // File Upload State & Optional Remark
  interface UploadingItem {
    id: string;
    file: File;
    name: string;
    progress: number;
    bytesTransferred?: number;
    totalBytes?: number;
    speedFormatted?: string;
    transferredFormatted?: string;
    etaFormatted?: string;
    size: number;
    type: string;
    status: 'queued' | 'uploading' | 'error';
    errorMessage?: string;
  }

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRecord[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingItem[]>([]);
  const [customerRemark, setCustomerRemark] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Sync ref to track items actively being initialized to prevent duplicate execution
  const processingIdsRef = React.useRef<Set<string>>(new Set());

  // Queue processor effect to handle parallel uploads cleanly without race conditions
  useEffect(() => {
    const activeCount = uploadingFiles.filter(item => item.status === 'uploading').length;
    if (activeCount >= 2) return;

    const nextQueuedItem = uploadingFiles.find(
      item => item.status === 'queued' && !processingIdsRef.current.has(item.id)
    );
    if (!nextQueuedItem) return;

    // Mark item as being processed immediately in synchronous ref
    processingIdsRef.current.add(nextQueuedItem.id);

    setUploadingFiles(prev => prev.map(u => u.id === nextQueuedItem.id ? { ...u, status: 'uploading' } : u));
    executeSingleFileUpload(nextQueuedItem);
  }, [uploadingFiles]);

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

  // Totals calculated dynamically with variant unit prices & wedding card charges
  const subtotal = cart.reduce((acc, item) => acc + getItemLineSubtotal(item), 0);
  const totalPrintingCharges = cart.reduce((acc, item) => acc + (item.printingCharge || 0), 0);
  const totalCustomizationCharges = cart.reduce((acc, item) => acc + (item.customizationCharge || 0), 0);

  // Dynamic Shipping Calculation (Free above threshold, or based on product/card configurations)
  const shippingEnabledItems = cart.filter(item => item.product.enableShipping !== false && !item.isDigital);

  const shippingSubtotal = shippingEnabledItems.reduce((acc, item) => acc + getItemLineSubtotal(item), 0);

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

        if (item.itemType === 'wedding_card') {
          const cardShip = item.cardShippingCharge ?? item.product.shippingCharge ?? 0;
          if (cardShip > 0) {
            customChargesTotal += cardShip;
          } else {
            hasStandardItems = true;
          }
          return;
        }

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

  // Dynamic Inclusive GST Calculation based on per-product configuration and variant/card prices
  const gst = cart.reduce((acc, item) => {
    const isGstEnabled = item.product.enableGst !== false;
    if (!isGstEnabled) return acc;

    const itemGstPercent = item.product.gstPercent !== undefined ? item.product.gstPercent : 18;
    const itemSubtotal = getItemLineSubtotal(item);

    // Calculate inclusive GST
    const itemGst = Math.round(itemSubtotal * (itemGstPercent / 100));
    return acc + itemGst;
  }, 0);

  // Coupon calculations
  const discount = appliedCouponResult?.isValid ? (appliedCouponResult.calculatedDiscount || 0) : 0;
  const grandTotal = Math.max(0, subtotal + shipping - discount);

  // Helper to map cart items for validation with variant names, wedding cards and prices
  const getCartItemsForValidation = (): CartItemForValidation[] => {
    return cart.map(item => {
      if (item.itemType === 'wedding_card') {
        return {
          productId: item.weddingCardId || item.productId || item.product.id,
          productTitle: item.product.title,
          price: getItemLineSubtotal(item),
          quantity: 1,
          category: item.isDigital ? 'Digital Invitations' : 'Wedding Cards',
          serviceCategory: 'Printing'
        };
      }
      return {
        productId: item.productId || item.product.id,
        productTitle: item.selectedVariantName ? `${item.product.title} (${item.selectedVariantName})` : item.product.title,
        price: getItemUnitPrice(item),
        quantity: item.quantity,
        category: item.product.category,
        serviceCategory: item.product.category === 'Printing' ? 'Printing' : item.product.category === 'Photography' ? 'Photography' : undefined
      };
    });
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

  // Upload original customer file directly to Firebase Storage without compression/resizing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFiles(Array.from(files));
      e.target.value = '';
    }
  };

  const processSelectedFiles = (files: File[]) => {
    const filesToUpload = files.filter(f => {
      const cName = cleanFileName(f.name);
      return !uploadingFiles.some(uf => uf.name === cName || uf.name === f.name) && 
             !uploadedFiles.some(uf => (uf.originalFileName || uf.name) === cName || (uf.originalFileName || uf.name) === f.name);
    });

    if (filesToUpload.length === 0) return;

    const newItems: UploadingItem[] = filesToUpload.map((file, idx) => ({
      id: `up_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: cleanFileName(file.name),
      progress: 0,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'queued'
    }));

    setUploadingFiles(prev => [...prev, ...newItems]);
  };

  const executeSingleFileUpload = async (item: UploadingItem) => {
    setUploadingFiles(prev => prev.map(u => u.id === item.id ? { ...u, status: 'uploading', errorMessage: undefined } : u));

    try {
      const record = await uploadOriginalClientPhoto(
        item.file,
        fullName || 'Customer',
        (details: UploadProgressDetails) => {
          setUploadingFiles(prev => prev.map(u => u.id === item.id ? {
            ...u,
            status: 'uploading',
            progress: details.progress,
            bytesTransferred: details.bytesTransferred,
            totalBytes: details.totalBytes,
            speedFormatted: details.speedFormatted,
            transferredFormatted: details.transferredFormatted,
            etaFormatted: details.etaFormatted
          } : u));
        }
      );

      // Upload completed & verified successfully!
      processingIdsRef.current.delete(item.id);
      setUploadingFiles(prev => prev.filter(u => u.id !== item.id));
      setUploadedFiles(prev => {
        if (prev.some(f => (f.originalFileName || f.name) === item.name)) return prev;
        return [...prev, record];
      });
    } catch (uploadErr: any) {
      console.warn(`Upload notice for ${item.name}:`, uploadErr?.message || uploadErr);
      processingIdsRef.current.delete(item.id);
      const errorMsg = uploadErr?.message || uploadErr?.code || String(uploadErr);
      setUploadingFiles(prev => prev.map(u => u.id === item.id ? { ...u, status: 'error', errorMessage: errorMsg } : u));
    }
  };

  const handleRetryUpload = (item: UploadingItem) => {
    processingIdsRef.current.delete(item.id);
    setUploadingFiles(prev => prev.map(u => u.id === item.id ? { ...u, status: 'queued', progress: 0, errorMessage: undefined } : u));
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
      processSelectedFiles(Array.from(files));
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
    if (uploadingFiles.some(u => u.status === 'uploading')) {
      alert('Please wait until photo upload reaches 100% before placing the order.');
      return;
    }
    if (uploadingFiles.some(u => u.status === 'error')) {
      alert('One or more photo uploads failed. Please retry or remove failed uploads before placing the order.');
      return;
    }
    // Launch Razorpay Simulator
    setShowRazorpay(true);
  };

  const handleCompleteRazorpayPayment = async () => {
    if (uploadingFiles.some(u => u.status === 'uploading')) {
      alert('Please wait until photo upload reaches 100% before placing the order.');
      return;
    }
    if (uploadingFiles.some(u => u.status === 'error')) {
      alert('One or more photo uploads failed. Please retry or remove failed uploads before placing the order.');
      return;
    }
    setIsPaying(true);
    try {
      const orderId = `LM-${Math.floor(100000 + Math.random() * 900000)}`;

      // Gather cart uploaded files + any wedding card customization reference files
      const combinedFiles: UploadedFileRecord[] = [...uploadedFiles];
      cart.forEach((item) => {
        (item.weddingCardCustomization?.referenceFiles || []).forEach((refFile) => {
          const refUrl = refFile.originalFileUrl || refFile.url || '';
          const refName = refFile.originalFileName || refFile.name || '';
          const alreadyExists = combinedFiles.some(
            (existing) => (existing.originalFileUrl || existing.url) === refUrl && (existing.originalFileName || existing.name) === refName
          );
          if (!alreadyExists && refUrl) {
            combinedFiles.push(refFile);
          }
        });
      });

      const sanitizedUploadedFiles: UploadedFileRecord[] = combinedFiles.map(f => ({
        originalFileUrl: (f.originalFileUrl && !f.originalFileUrl.startsWith('data:')) ? f.originalFileUrl : (f.url && !f.url.startsWith('data:') ? f.url : ''),
        originalFileName: f.originalFileName || f.name || 'photo.jpg',
        originalFileType: f.originalFileType || 'image/jpeg',
        originalFileSize: f.originalFileSize || 0,
        originalWidth: f.originalWidth || 0,
        originalHeight: f.originalHeight || 0,
        uploadedAt: f.uploadedAt || new Date().toISOString(),
        uploadedBy: f.uploadedBy || fullName || 'Customer',
        thumbnailUrl: (f.thumbnailUrl && !f.thumbnailUrl.startsWith('data:')) ? f.thumbnailUrl : (f.originalFileUrl && !f.originalFileUrl.startsWith('data:') ? f.originalFileUrl : ''),
        previewUrl: (f.previewUrl && !f.previewUrl.startsWith('data:')) ? f.previewUrl : (f.originalFileUrl && !f.originalFileUrl.startsWith('data:') ? f.originalFileUrl : ''),
        name: f.name || f.originalFileName || 'photo.jpg',
        url: (f.url && !f.url.startsWith('data:')) ? f.url : (f.originalFileUrl && !f.originalFileUrl.startsWith('data:') ? f.originalFileUrl : ''),
      }));

      const primaryFileUrl = sanitizedUploadedFiles[0]?.originalFileUrl || sanitizedUploadedFiles[0]?.url || '';

      // Secure Server-side Firestore Price Verification for Products, Variants & Wedding Cards
      const verifiedOrderItems: Order['items'] = [];

      let verifiedSubtotal = 0;
      let verifiedPrintingTotal = 0;
      let verifiedCustomizationTotal = 0;
      let hasWeddingCards = false;
      let hasRegularProducts = false;
      let firstCardCustomization: WeddingCardCustomization | undefined;

      const verifiedShippingLines: { item: CartItem; verifiedShippingCharge: number; verifiedLineSubtotal: number; verifiedGstPercent: number }[] = [];

      for (const item of cart) {
        if (item.itemType === 'wedding_card') {
          hasWeddingCards = true;
          const cardId = item.weddingCardId || item.productId || item.product.id;
          let breakdown = calculateWeddingCardPriceBreakdown(
            {
              id: cardId,
              price: getItemUnitPrice(item),
              minOrderQuantity: item.minOrderQuantity,
              printingCharge: item.printingCharge,
              customizationCharge: item.customizationCharge,
              shippingCharge: item.cardShippingCharge,
              isDigital: item.isDigital,
              digitalType: item.digitalType,
              customizationAvailable: true
            },
            item.quantity
          );
          let verifiedGstPercent = item.product.gstPercent ?? 12;
          let verifiedEnableGst = item.product.enableGst !== false;
          let verifiedIsDigital = Boolean(item.isDigital);

          try {
            const cardSnap = await getDoc(doc(db, 'wedding_cards', cardId));
            if (cardSnap.exists()) {
              const cardData = { id: cardSnap.id, ...cardSnap.data() } as WeddingCardItem;
              breakdown = calculateWeddingCardPriceBreakdown(cardData, item.quantity);
              verifiedGstPercent = cardData.gstPercent ?? 12;
              verifiedEnableGst = cardData.enableGst ?? true;
              verifiedIsDigital = Boolean(cardData.isDigital || item.isDigital);
            }
          } catch (verErr) {
            console.warn('Notice: Firestore wedding card price verification fallback to client item', verErr);
          }

          const lineSubtotal = breakdown.cardsSubtotal + breakdown.printingCharge + breakdown.customizationCharge;
          verifiedSubtotal += lineSubtotal;
          verifiedPrintingTotal += breakdown.printingCharge;
          verifiedCustomizationTotal += breakdown.customizationCharge;

          if (!firstCardCustomization && item.weddingCardCustomization) {
            firstCardCustomization = stripUndefined(item.weddingCardCustomization);
          }

          verifiedOrderItems.push(
            stripUndefined({
              productId: cardId,
              productTitle: item.product.title,
              variantId: item.selectedVariantId || undefined,
              variantName: item.selectedVariantName || undefined,
              variantPrice: breakdown.unitPrice,
              price: breakdown.unitPrice,
              quantity: breakdown.quantity,
              image: item.product.image?.startsWith('data:') ? '' : item.product.image,
              itemType: 'wedding_card',
              designCode: item.designCode || '',
              selectedColor: item.selectedColor || item.weddingCardCustomization?.selectedColor || '',
              selectedFinish: item.selectedFinish || item.weddingCardCustomization?.selectedFinish || '',
              printingCharge: breakdown.printingCharge,
              customizationCharge: breakdown.customizationCharge,
              isDigital: verifiedIsDigital,
              digitalType: item.digitalType || undefined,
              weddingCardCustomization: item.weddingCardCustomization ? stripUndefined(item.weddingCardCustomization) : undefined
            })
          );

          verifiedShippingLines.push({
            item: { ...item, isDigital: verifiedIsDigital, product: { ...item.product, enableGst: verifiedEnableGst, freeShipping: verifiedIsDigital || breakdown.shippingCharge === 0 } },
            verifiedShippingCharge: breakdown.shippingCharge,
            verifiedLineSubtotal: lineSubtotal,
            verifiedGstPercent: verifiedEnableGst ? verifiedGstPercent : 0
          });
          continue;
        }

        hasRegularProducts = true;
        const prodId = item.productId || item.product.id;
        let verifiedUnitPrice = getItemUnitPrice(item);
        let verifiedVariantName = item.selectedVariantName;
        let verifiedGstPercent = item.product.gstPercent !== undefined ? item.product.gstPercent : 18;
        let verifiedEnableGst = item.product.enableGst !== false;
        let verifiedShippingCharge = item.product.delivery?.shippingCharge || item.product.shippingCharge || 0;

        try {
          const prodSnap = await getDoc(doc(db, 'products', prodId));
          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as ProductItem;
            if (item.selectedVariantId && prodData.variants && prodData.variants.length > 0) {
              const matchedVariant = prodData.variants.find(v => v.id === item.selectedVariantId);
              if (matchedVariant) {
                verifiedUnitPrice = matchedVariant.discountPrice || matchedVariant.price;
                verifiedVariantName = matchedVariant.name;
              }
            } else if (prodData.discountPrice || prodData.price) {
              verifiedUnitPrice = prodData.discountPrice || prodData.price;
            }
            verifiedGstPercent = prodData.gstPercent !== undefined ? prodData.gstPercent : verifiedGstPercent;
            verifiedEnableGst = prodData.enableGst !== false;
            verifiedShippingCharge = prodData.delivery?.shippingCharge || prodData.shippingCharge || verifiedShippingCharge;
          }
        } catch (verErr) {
          console.warn('Notice: Firestore price verification fallback to client item price', verErr);
        }

        const lineSubtotal = verifiedUnitPrice * item.quantity;
        verifiedSubtotal += lineSubtotal;
        verifiedOrderItems.push(
          stripUndefined({
            productId: prodId,
            productTitle: item.product.title,
            variantId: item.selectedVariantId || undefined,
            variantName: verifiedVariantName || undefined,
            variantPrice: item.selectedVariantId ? verifiedUnitPrice : undefined,
            price: verifiedUnitPrice,
            quantity: item.quantity,
            image: item.product.image?.startsWith('data:') ? '' : item.product.image,
            itemType: 'product'
          })
        );

        verifiedShippingLines.push({
          item: { ...item, product: { ...item.product, enableGst: verifiedEnableGst } },
          verifiedShippingCharge,
          verifiedLineSubtotal: lineSubtotal,
          verifiedGstPercent: verifiedEnableGst ? verifiedGstPercent : 0
        });
      }

      // Re-verify Shipping with Firestore-verified subtotals
      const verifiedShipEligible = verifiedShippingLines.filter(l => l.item.product.enableShipping !== false && !l.item.isDigital);
      let verifiedShipping = 0;
      if (verifiedShipEligible.length > 0) {
        const verifiedShipSubtotal = verifiedShipEligible.reduce((acc, l) => acc + l.verifiedLineSubtotal, 0);
        const allVerifiedFree = verifiedShipEligible.every(l => l.item.product.delivery?.freeShipping === true || l.item.product.freeShipping === true);
        if (verifiedShipSubtotal >= freeThreshold || allVerifiedFree) {
          verifiedShipping = 0;
        } else {
          let customShip = 0;
          let needsDefault = false;
          verifiedShipEligible.forEach(l => {
            const isFree = l.item.product.delivery?.freeShipping === true || l.item.product.freeShipping === true;
            if (isFree) return;
            if (l.item.itemType === 'wedding_card') {
              if (l.verifiedShippingCharge > 0) customShip += l.verifiedShippingCharge;
              else needsDefault = true;
            } else if (l.verifiedShippingCharge > 0) {
              customShip += l.verifiedShippingCharge * l.item.quantity;
            } else {
              needsDefault = true;
            }
          });
          verifiedShipping = customShip + (needsDefault ? defaultDeliveryCharge : 0);
        }
      }

      // Re-verify GST with verified subtotal
      const verifiedGst = verifiedShippingLines.reduce((acc, line) => {
        if (!line.verifiedGstPercent) return acc;
        return acc + Math.round(line.verifiedLineSubtotal * (line.verifiedGstPercent / 100));
      }, 0);

      const verifiedGrandTotal = Math.max(0, verifiedSubtotal + verifiedShipping - discount);
      const computedOrderType: Order['orderType'] =
        hasWeddingCards && hasRegularProducts ? 'mixed' : hasWeddingCards ? 'wedding_card' : 'store';

      const rawOrderData: Order = {
        id: orderId,
        customerId: currentUser?.uid || 'anonymous',
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        address,
        items: verifiedOrderItems,
        uploadedFileName: sanitizedUploadedFiles.map(f => f.originalFileName || f.name).join(', ') || '',
        uploadedFileUrl: primaryFileUrl,
        uploadedFiles: sanitizedUploadedFiles,
        customerRemark: customerRemark.trim(),
        subtotal: verifiedSubtotal,
        gst: verifiedGst,
        gstEnabled: verifiedShippingLines.some(l => l.verifiedGstPercent > 0),
        gstPercentage: verifiedShippingLines.reduce((max, l) => Math.max(max, l.verifiedGstPercent), 0) || 18,
        gstAmount: verifiedGst,
        shipping: verifiedShipping,
        discount,
        couponCode: appliedCouponResult?.coupon?.code || '',
        couponName: appliedCouponResult?.coupon?.name || '',
        discountAmount: discount || 0,
        discountType: appliedCouponResult?.coupon?.discountType || 'PERCENTAGE',
        discountValue: appliedCouponResult?.coupon?.discountValue || 0,
        originalPrice: verifiedSubtotal,
        finalPrice: verifiedGrandTotal,
        paymentAmount: verifiedGrandTotal,
        total: verifiedGrandTotal,
        paymentMethod: selectedPaymentMethod === 'upi' ? 'UPI / QR' : 'Card / Net Banking',
        paymentStatus: 'Paid',
        paymentDate: new Date().toISOString(),
        dueAmount: 0,
        status: 'Pending',
        paymentId: `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        orderType: computedOrderType,
        hasWeddingCards,
        ...(hasWeddingCards
          ? {
              printingCharge: verifiedPrintingTotal,
              customizationCharge: verifiedCustomizationTotal,
              proofStatus: 'Awaiting Proof' as const,
              proofVersions: [],
              ...(firstCardCustomization ? { weddingCardCustomization: firstCardCustomization } : {})
            }
          : {})
      };

      const orderData = stripUndefined(rawOrderData);

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
                  Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                
                <div className="divide-y divide-slate-800">
                  {cart.map((item) => {
                    const price = getItemUnitPrice(item);
                    const lineTotal = getItemLineSubtotal(item);
                    const itemKey = item.id || `${item.productId || item.product.id}_${item.selectedVariantId || ''}`;
                    const targetId = item.id || item.productId || item.product.id;
                    const isWeddingCard = item.itemType === 'wedding_card';
                    const stepSize = isWeddingCard && !item.isDigital ? 25 : 1;
                    const minQty = item.minOrderQuantity || 1;

                    return (
                      <div key={itemKey} className="py-4 flex flex-col gap-3 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <StudioImage 
                              src={item.product.image} 
                              fallback={STUDIO_IMAGES.luxuryAlbumFrame}
                              alt={item.product.title} 
                              className="h-16 w-16 rounded-xl object-cover border border-slate-800 shrink-0" 
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="text-xxs text-slate-500">{item.product.category}</span>
                                {item.designCode && (
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 font-mono text-xxs">
                                    Code: #{item.designCode}
                                  </span>
                                )}
                                {item.selectedVariantName && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xxs font-semibold">
                                    {isWeddingCard ? item.selectedVariantName : `Size: ${item.selectedVariantName}`}
                                  </span>
                                )}
                                {item.isDigital && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xxs font-semibold">
                                    {item.digitalType || 'Digital Invitation'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-amber-500 font-bold mt-1">
                                ₹{price.toLocaleString('en-IN')} {isWeddingCard && !item.isDigital ? '/ card' : ''}
                                {isWeddingCard && ((item.printingCharge || 0) > 0 || (item.customizationCharge || 0) > 0) && (
                                  <span className="text-slate-400 font-normal ml-2">
                                    (+ ₹{(item.printingCharge || 0).toLocaleString('en-IN')} Print, + ₹{(item.customizationCharge || 0).toLocaleString('en-IN')} Custom)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Quantity triggers */}
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            {item.isDigital ? (
                              <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xxs font-mono text-emerald-400 font-semibold">
                                Digital (Qty: 1)
                              </span>
                            ) : (
                              <div className="flex items-center border border-slate-800 rounded-lg p-1 bg-slate-950">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(targetId, Math.max(minQty, item.quantity - stepSize), item.selectedVariantId)}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title={isWeddingCard ? `Decrease by ${stepSize} (Min: ${minQty})` : 'Decrease quantity'}
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQuantity(targetId, item.quantity + stepSize, item.selectedVariantId)}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title={isWeddingCard ? `Increase by ${stepSize}` : 'Increase quantity'}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                            <p className="text-sm font-bold text-white w-24 text-right">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </p>

                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(targetId, item.selectedVariantId)}
                              className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>

                        {/* Wedding Card Customization Snapshot */}
                        {isWeddingCard && item.weddingCardCustomization && (
                          <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">Couple</span>
                              <span className="font-semibold text-white">
                                {item.weddingCardCustomization.groomName} &amp; {item.weddingCardCustomization.brideName}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">Event Date</span>
                              <span>
                                {item.weddingCardCustomization.weddingDate}
                                {item.weddingCardCustomization.weddingTime ? ` • ${item.weddingCardCustomization.weddingTime}` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">Venue</span>
                              <span className="line-clamp-1">{item.weddingCardCustomization.venueName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-mono uppercase text-amber-400 block">Print Language &amp; Refs</span>
                              <span>
                                {item.weddingCardCustomization.language}
                                {item.weddingCardCustomization.referenceFiles?.length
                                  ? ` • ${item.weddingCardCustomization.referenceFiles.length} file(s)`
                                  : ''}
                              </span>
                            </div>
                          </div>
                        )}
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
                    <p className="text-xxs font-semibold uppercase tracking-wider font-mono text-amber-400 mt-2 flex items-center gap-1.5">
                      <span className="animate-pulse">●</span> Active Photo Uploads ({uploadingFiles.length})
                    </p>
                    {uploadingFiles.map((fileItem) => {
                      const isError = fileItem.status === 'error';
                      const isQueued = fileItem.status === 'queued';
                      return (
                        <div
                          key={fileItem.id}
                          className={`p-3 rounded-xl border flex flex-col gap-2 text-xs font-mono transition-all ${
                            isError
                              ? 'bg-rose-950/30 border-rose-800/80'
                              : isQueued
                              ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold truncate">{fileItem.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xxs">
                                <span className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Original Quality
                                </span>
                                {isQueued ? (
                                  <span className="text-slate-400 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                                    In Queue (Waiting...)
                                  </span>
                                ) : !isError && (
                                  <>
                                    <span className="text-slate-300 font-medium">
                                      {fileItem.transferredFormatted || formatBytes(fileItem.size)}
                                    </span>
                                    {fileItem.speedFormatted && (
                                      <span className="text-amber-300 font-semibold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                        ⚡ {fileItem.speedFormatted}
                                      </span>
                                    )}
                                    {fileItem.etaFormatted && (
                                      <span className="text-slate-400">
                                        ⏱️ ETA: {fileItem.etaFormatted}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isError ? (
                                <button
                                  type="button"
                                  onClick={() => handleRetryUpload(fileItem)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xxs font-bold transition-all shadow"
                                >
                                  ↻ Retry
                                </button>
                              ) : isQueued ? (
                                <span className="text-slate-500 text-xxs font-semibold uppercase">Queued</span>
                              ) : (
                                <span className="font-bold text-amber-400 text-sm">{fileItem.progress}%</span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  processingIdsRef.current.delete(fileItem.id);
                                  setUploadingFiles(prev => prev.filter(u => u.id !== fileItem.id));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-all font-bold"
                                title="Cancel / Remove"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {!isError ? (
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-150 ${isQueued ? 'bg-slate-600' : 'bg-amber-500'}`}
                                style={{ width: `${isQueued ? 0 : fileItem.progress}%` }}
                              />
                            </div>
                          ) : (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xxs space-y-1">
                              <span className="font-bold uppercase text-rose-400 block font-mono flex items-center gap-1">
                                ⚠ Upload Notice:
                              </span>
                              <p className="break-words font-sans">{fileItem.errorMessage || 'Upload failed. Please check network connection or retry.'}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xxs font-semibold uppercase tracking-wider font-mono text-emerald-400 mt-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Uploaded Custom Assets ({uploadedFiles.length})
                    </p>
                    {uploadedFiles.map((file, idx) => {
                      const fName = file.originalFileName || file.name || `File_${idx + 1}`;
                      const fSize = file.originalFileSize ? formatBytes(file.originalFileSize) : 'Raw File';
                      const fType = file.originalFileType ? file.originalFileType.split('/')[1]?.toUpperCase() : 'FILE';
                      return (
                        <div key={idx} className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{fName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xxs font-mono">
                                <span className="text-emerald-400 font-bold">{fType} • {fSize}</span>
                                <span className="text-slate-400">• Original Quality ✓</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, fIdx) => fIdx !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all shrink-0 font-bold"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Optional Customer Remark Section */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4 text-amber-500" />
                    <span>OPTIONAL REMARK / REQUIREMENT</span>
                  </label>
                  <textarea
                    rows={2}
                    value={customerRemark}
                    onChange={(e) => setCustomerRemark(e.target.value)}
                    placeholder="Please mention any special requirement for your order (e.g. Please crop the photo from the center, or print in matte finish)..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 outline-none transition-all resize-none font-sans"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">Optional special instructions for studio printing team. Can be left empty.</p>
                </div>
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
                  {totalPrintingCharges > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">• Includes Printing Charges:</span>
                      <span className="text-slate-300">₹{totalPrintingCharges.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {totalCustomizationCharges > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">• Includes Customization Charges:</span>
                      <span className="text-slate-300">₹{totalCustomizationCharges.toLocaleString('en-IN')}</span>
                    </div>
                  )}
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
                    <StudioImage src={p.image} fallback={STUDIO_IMAGES.luxuryAlbumFrame} alt={p.title} className="h-12 w-12 rounded-lg object-cover border border-slate-800" />
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
