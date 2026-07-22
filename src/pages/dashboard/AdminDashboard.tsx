import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, Booking, ProductItem, Expense, ServiceItem, GalleryItem, OfferItem, ReviewItem, UserProfile, BlogItem } from '../../types';
import { 
  TrendingUp, 
  ShoppingBag, 
  CalendarDays, 
  IndianRupee, 
  Layers, 
  Trash2, 
  Plus, 
  Edit3, 
  CheckCircle, 
  AlertTriangle,
  X,
  FileText,
  Camera,
  Globe,
  Tag,
  MessageSquare,
  Users,
  HelpCircle,
  Inbox,
  Image as ImageIcon,
  Check,
  UserCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Sliders,
  DollarSign,
  Download,
  FolderArchive
} from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceModal';
import { ImageField } from '../../components/ImageField';
import { MultiImageField } from '../../components/MultiImageField';
import { AdminCouponManager } from '../../components/AdminCouponManager';
import { AdminWeddingCardManager } from '../../components/AdminWeddingCardManager';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Extended Product Fields State
  const [pSku, setPSku] = useState('');
  const [pBarcode, setPBarcode] = useState('');
  const [pQrCode, setPQrCode] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pStatus, setPStatus] = useState<'Active' | 'Inactive'>('Active');
  const [pCostPrice, setPCostPrice] = useState<number>(0);
  const [pGstPercent, setPGstPercent] = useState<number>(18);
  const [pEnableGst, setPEnableGst] = useState<boolean>(true);
  const [pGstIncludedInPrice, setPGstIncludedInPrice] = useState<boolean>(true);
  const [pHsnCode, setPHsnCode] = useState('');
  const [pMinStock, setPMinStock] = useState<number>(5);
  const [pUnit, setPUnit] = useState<'Piece' | 'Pack' | 'Box' | 'Set'>('Piece');
  const [pTrackInventory, setPTrackInventory] = useState<boolean>(true);
  const [pShortDescription, setPShortDescription] = useState('');
  
  // Specifications
  const [pSpecMaterial, setPSpecMaterial] = useState('');
  const [pSpecSize, setPSpecSize] = useState('');
  const [pSpecWeight, setPSpecWeight] = useState('');
  const [pSpecColor, setPSicolor] = useState('');
  const [pSpecFinish, setPSpecFinish] = useState('');
  const [pSpecWarranty, setPSpecWarranty] = useState('');
  const [pSpecPowerSource, setPSpecPowerSource] = useState('');
  const [pCustomSpecs, setPCustomSpecs] = useState<{ key: string; value: string }[]>([]);

  // Variants
  const [pVariants, setPVariants] = useState<ProductItem['variants']>([]);

  // Customization
  const [pCustPhotoRequired, setPCustPhotoRequired] = useState<boolean>(false);
  const [pCustNamePrinting, setPCustNamePrinting] = useState<boolean>(false);
  const [pCustText, setPCustText] = useState<boolean>(false);
  const [pCustDatePrinting, setPCustDatePrinting] = useState<boolean>(false);
  const [pCustUploadDesign, setPCustUploadDesign] = useState<boolean>(false);

  // Delivery
  const [pDeliveryTime, setPDeliveryTime] = useState<'1 Day' | '2 Days' | '3 Days' | '5 Days' | 'Custom'>('1 Day');
  const [pShippingWeight, setPShippingWeight] = useState<number>(0);
  const [pShippingCharge, setPShippingCharge] = useState<number>(0);
  const [pFreeShipping, setPFreeShipping] = useState<boolean>(true);
  const [pEnableShipping, setPEnableShipping] = useState<boolean>(true);

  // SEO
  const [pMetaTitle, setPMetaTitle] = useState('');
  const [pMetaDescription, setPMetaDescription] = useState('');
  const [pSlug, setPSlug] = useState('');

  // Labels
  const [pLabelFeatured, setPLabelFeatured] = useState(false);
  const [pLabelBestSeller, setPLabelBestSeller] = useState(false);
  const [pLabelTrending, setPLabelTrending] = useState(false);
  const [pLabelNewArrival, setPLabelNewArrival] = useState(false);
  const [pLabelHotDeal, setPLabelHotDeal] = useState(false);
  const [pLabelLimitedStock, setPLabelLimitedStock] = useState(false);

  // Search keyword & modal state
  const [productSearch, setProductSearch] = useState('');
  const [pDrawerTab, setPDrawerTab] = useState<'basic' | 'pricing' | 'customization' | 'variants' | 'delivery' | 'seo' | 'preview'>('basic');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'website' | 'services' | 'products' | 'wedding-cards' | 'bookings' | 'orders' | 'expenses' | 'gallery' | 'offers' | 'reviews' | 'customers' | 'inquiries' | 'blogs'
  >('analytics');

  // Website Settings State
  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
    officeHours: 'Monday - Sunday: 09:00 AM - 09:00 PM',
    gstNumber: '09AAAAA1111A1Z1',
    bankName: 'State Bank of India',
    bankAccount: '123456789012',
    bankIfsc: 'SBIN0001234',
    upiId: 'shivsharan52796@okaxis',
    whatsappNumber: '+917905256355',
    googleMapUrl: 'https://maps.google.com/maps?q=Kishanpur%20Road,%20Khaga,%20Fatehpur,%20Uttar%20Pradesh&t=&z=15&ie=UTF8&iwloc=&output=embed',
    heroTitle: 'Capturing Memories, Printing Excellence.',
    heroSubtitle: 'Khaga\'s premier industrial-scale commercial photo studio and fine-art luxury printing press.',
    welcomeText: 'Welcome to Shiv Studio & Printers. We deliver top-tier photography and print deliverables with certified materials and state-of-the-art equipment.',
    aboutTitle: 'Our Heritage in Fatehpur',
    aboutDescription: 'Established over a decade ago in the commercial heart of Khaga, Fatehpur, Shiv Studio & Printers has been the absolute benchmark for bespoke pre-wedding masterworks, official event coverage, and premium wedding album creations.',
    footerText: 'Copyright © Shiv Studio & Printers. All Rights Reserved.'
  });

  // Invoice Receipt Modal
  const [selectedDoc, setSelectedDoc] = useState<Order | Booking | null>(null);
  const [selectedType, setSelectedType] = useState<'order' | 'booking'>('order');

  // Modal Controls
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamMemberIndex, setEditingTeamMemberIndex] = useState<number | null>(null);
  const [teamMemberName, setTeamMemberName] = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('');

  // Custom Confirm Dialog Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Bulk download tracking state
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  // Product CRUD fields
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [pTitle, setPTitle] = useState('');
  const [pCategory, setPCategory] = useState('Photo Frame');
  const [pPrice, setPPrice] = useState(0);
  const [pDiscountPrice, setPDiscountPrice] = useState(0);
  const [pStock, setPStock] = useState(10);
  const [pDescription, setPDescription] = useState('');
  const [pImage, setPImage] = useState('');
  const [pImages, setPImages] = useState<string[]>([]);

  // Service CRUD fields
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [sTitle, setSTitle] = useState('');
  const [sCategory, setSCategory] = useState<'Photography' | 'Printing'>('Photography');
  const [sDescription, setSDescription] = useState('');
  const [sPrice, setSPrice] = useState(0);
  const [sImage, setSImage] = useState('');
  const [sEnableGst, setSEnableGst] = useState<boolean>(true);
  const [sGstPercent, setSGstPercent] = useState<number>(18);
  const [sGstIncludedInPrice, setSGstIncludedInPrice] = useState<boolean>(true);

  // Gallery CRUD fields
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [gTitle, setGTitle] = useState('');
  const [gCategory, setGCategory] = useState<'Wedding' | 'Pre Wedding' | 'Baby' | 'Events' | 'Birthday' | 'Drone' | 'Albums' | 'Videos'>('Wedding');
  const [gImageUrl, setGImageUrl] = useState('');
  const [gIsFeatured, setGIsFeatured] = useState(false);

  // Offer CRUD fields
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [oTitle, setOTitle] = useState('');
  const [oDescription, setODescription] = useState('');
  const [oCode, setOCode] = useState('');
  const [oDiscountPercent, setODiscountPercent] = useState(10);
  const [oImage, setOImage] = useState('');

  // Review CRUD fields
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [rCustomerName, setRCustomerName] = useState('');
  const [rRating, setRRating] = useState(5);
  const [rComment, setRComment] = useState('');
  const [rReply, setRReply] = useState('');

  // Blog CRUD fields
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [bTitle, setBTitle] = useState('');
  const [bExcerpt, setBExcerpt] = useState('');
  const [bContent, setBContent] = useState('');
  const [bCategory, setBCategory] = useState<'Photography' | 'Printing' | 'News'>('Photography');
  const [bImage, setBImage] = useState('');
  const [bAuthor, setBAuthor] = useState('');

  // Expense Fields
  const [expCategory, setExpCategory] = useState<'Rent' | 'Salary' | 'Electricity' | 'Equipment' | 'Printing Material' | 'Travel' | 'Maintenance' | 'Other'>('Printing Material');
  const [expAmount, setExpAmount] = useState(0);
  const [expDesc, setExpDesc] = useState('');

  // Selected Customer Details Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));

      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      setBookings(bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));

      const productsSnap = await getDocs(collection(db, 'products'));
      const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductItem));
      setProducts(allProducts);

      const expensesSnap = await getDocs(collection(db, 'expenses'));
      setExpenses(expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));

      const servicesSnap = await getDocs(collection(db, 'services'));
      setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem)));

      const gallerySnap = await getDocs(collection(db, 'gallery'));
      setGallery(gallerySnap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));

      const offersSnap = await getDocs(collection(db, 'offers'));
      setOffers(offersSnap.docs.map(d => ({ id: d.id, ...d.data() } as OfferItem)));

      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewItem)));

      const blogsSnap = await getDocs(collection(db, 'blogs'));
      setBlogs(blogsSnap.docs.map(d => ({ id: d.id, ...d.data() } as BlogItem)));

      const inquiriesSnap = await getDocs(collection(db, 'inquiries'));
      setInquiries(inquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));

      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));

      const settingsDoc = await getDoc(doc(db, 'website_settings', 'studio'));
      if (settingsDoc.exists()) {
        setSettings((prev: any) => ({ ...prev, ...settingsDoc.data() }));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  // Calculations
  const totalSales = orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'website_settings', 'studio'), settings);
      await setDoc(doc(db, 'settings', 'studio'), settings);
      alert('Website Settings updated successfully! Refresh the page to see live updates.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error updating settings.');
    }
  };

  // Booking Approve / Complete
  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { status });
      alert(`Booking ${status.toLowerCase()} successfully!`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignPhotographer = async (bookingId: string, photographerId: string) => {
    try {
      const staff = users.find(u => u.uid === photographerId);
      if (!staff) return;
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        photographerId,
        photographerName: staff.fullName
      });
      alert(`Assigned ${staff.fullName} to this shoot booking.`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Pipeline State Dropdown
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      alert(`Order updated to pipeline stage: ${status}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Download photos as a single ZIP archive
  const handleBulkDownload = async (orderId: string, customerName: string, files: any) => {
    try {
      setDownloadingOrderId(orderId);
      setDownloadProgress('Starting...');

      const fileList: { url: string; name: string }[] = [];
      if (Array.isArray(files)) {
        files.forEach((f) => {
          if (f && typeof f === 'object' && f.url) {
            fileList.push({ url: f.url, name: f.name || 'custom_image.jpg' });
          } else if (typeof f === 'string') {
            fileList.push({ url: f, name: f.split('/').pop()?.split('?')[0] || 'custom_image.jpg' });
          }
        });
      } else if (typeof files === 'string' && files.trim() !== '') {
        fileList.push({ url: files, name: files.split('/').pop()?.split('?')[0] || 'custom_image.jpg' });
      }

      if (fileList.length === 0) {
        alert('No downloadable files associated with this order.');
        setDownloadingOrderId(null);
        return;
      }

      const zip = new JSZip();
      let succeededCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        const fileInfo = fileList[i];
        setDownloadProgress(`Fetching ${i + 1}/${fileList.length}...`);
        
        try {
          const response = await fetch(fileInfo.url);
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          const blob = await response.blob();
          
          let cleanName = fileInfo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
          if (!cleanName.includes('.')) {
            cleanName += '.jpg';
          }
          zip.file(cleanName, blob);
          succeededCount++;
        } catch (err) {
          console.error(`Failed to fetch file: ${fileInfo.url}`, err);
          // If fetch fails (maybe CORS), download via window.open
          window.open(fileInfo.url, '_blank');
        }
      }

      if (succeededCount > 0) {
        setDownloadProgress('Creating ZIP...');
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
        const zipName = `${cleanCustomerName}_Order_${orderId.slice(0, 8).toUpperCase()}_Photos.zip`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadProgress('Completed!');
      } else {
        alert('Could not download any files in a ZIP. Opening them in separate browser tabs.');
        fileList.forEach(f => window.open(f.url, '_blank'));
      }
      
      setTimeout(() => {
        setDownloadingOrderId(null);
      }, 1000);
    } catch (err) {
      console.error('Error in bulk download:', err);
      alert('An error occurred during bulk zip generation. Opening files individually.');
      setDownloadingOrderId(null);
    }
  };

  // Product Auto Generation & Dynamic Calculations
  const handleTitleChange = (val: string) => {
    setPTitle(val);
    
    // Auto Generate Slug
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setPSlug(generatedSlug);

    // Auto Generate SKU & SEO if not editing existing
    if (!editingProduct) {
      const acronym = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
      const rand = Math.floor(100 + Math.random() * 900);
      setPSku(acronym ? `SKU-${acronym}-${rand}` : `SKU-PROD-${rand}`);
      setPMetaTitle(`${val} | Shiv Studio Store`);
      setPMetaDescription(`Buy high quality ${val} at Shiv Studio & Printers. Custom sizes, custom frames, and doorstep delivery available.`);
    }

    // Auto QR Code
    if (generatedSlug) {
      setPQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/store/' + generatedSlug)}`);
    }
  };

  // Validation
  const validateProductForm = (): boolean => {
    if (!pTitle.trim()) {
      alert('Error: Product Name is required. We have switched to the Basic Info tab.');
      setPDrawerTab('basic');
      return false;
    }
    if (!pCategory) {
      alert('Error: Product Category is required. We have switched to the Basic Info tab.');
      setPDrawerTab('basic');
      return false;
    }
    if (pPrice === undefined || pPrice === null || Number(pPrice) <= 0) {
      alert('Error: Selling Price is required and must be greater than zero. We have switched to the Pricing & Inventory tab.');
      setPDrawerTab('pricing');
      return false;
    }
    if (pStock === undefined || pStock === null || Number(pStock) < 0) {
      alert('Error: Stock quantity must be 0 or more. We have switched to the Pricing & Inventory tab.');
      setPDrawerTab('pricing');
      return false;
    }
    // Automatically fallback to a professional cover image if left empty instead of blocking the user
    if (!pImage) {
      const fallbackUrl = pImages && pImages.length > 0 
        ? pImages[0] 
        : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400';
      setPImage(fallbackUrl);
    }
    return true;
  };

  // Main Save Action
  const saveProductAction = async (andAddAnother: boolean) => {
    if (!validateProductForm()) return;

    try {
      const prodId = editingProduct ? editingProduct.id : `prod_${Math.floor(Math.random() * 100000)}`;
      const defaultImg = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400';
      
      const calcDiscountPercent = Number(pPrice) > 0 ? Math.round((Number(pDiscountPrice) / Number(pPrice)) * 100) : 0;
      const calcFinalPrice = Number(pPrice) - Number(pDiscountPrice);

      const prodData: ProductItem = {
        id: prodId,
        title: pTitle,
        category: pCategory,
        price: Number(pPrice),
        discountPrice: pDiscountPrice ? Number(pDiscountPrice) : undefined,
        image: pImage || defaultImg,
        images: pImages.length > 0 ? pImages : [pImage || defaultImg],
        stock: Number(pStock),
        description: pDescription,
        rating: editingProduct ? editingProduct.rating : 5.0,
        reviewsCount: editingProduct ? editingProduct.reviewsCount : 1,

        // New e-commerce fields
        userId: currentUser?.uid || '', // User isolation!
        sku: pSku || `SKU-PROD-${prodId}`,
        barcode: pBarcode || '',
        qrCode: pQrCode || '',
        brand: pBrand || '',
        status: pStatus,
        costPrice: Number(pCostPrice),
        discountPercent: calcDiscountPercent,
        gstPercent: Number(pGstPercent),
        enableGst: pEnableGst,
        gstIncludedInPrice: pGstIncludedInPrice,
        enableShipping: pEnableShipping,
        hsnCode: pHsnCode,
        finalPrice: calcFinalPrice,
        minStockAlert: Number(pMinStock),
        unit: pUnit,
        trackInventory: pTrackInventory,
        shortDescription: pShortDescription,
        specifications: {
          material: pSpecMaterial,
          size: pSpecSize,
          weight: pSpecWeight,
          color: pSpecColor,
          finish: pSpecFinish,
          warranty: pSpecWarranty,
          powerSource: pSpecPowerSource,
          customFields: pCustomSpecs
        },
        variants: pVariants,
        customization: {
          customerPhotoRequired: pCustPhotoRequired,
          customerNamePrinting: pCustNamePrinting,
          customText: pCustText,
          datePrinting: pCustDatePrinting,
          uploadDesignFile: pCustUploadDesign
        },
        delivery: {
          deliveryTime: pDeliveryTime,
          shippingWeight: Number(pShippingWeight),
          shippingCharge: Number(pShippingCharge),
          freeShipping: pFreeShipping
        },
        seo: {
          metaTitle: pMetaTitle,
          metaDescription: pMetaDescription,
          urlSlug: pSlug
        },
        labels: {
          featured: pLabelFeatured,
          bestSeller: pLabelBestSeller,
          trending: pLabelTrending,
          newArrival: pLabelNewArrival,
          hotDeal: pLabelHotDeal,
          limitedStock: pLabelLimitedStock
        }
      };

      await setDoc(doc(db, 'products', prodId), prodData);
      
      if (andAddAnother) {
        alert(`Product "${pTitle}" saved successfully!`);
        openAddProductModal(); // Resets for another add
      } else {
        setShowProductModal(false);
        setEditingProduct(null);
        alert('Product saved successfully.');
      }
      
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error saving product: ' + (err as any).message);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProductAction(false);
  };

  const handleSaveProductAndAddAnother = async () => {
    await saveProductAction(true);
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setPTitle('');
    setPCategory('Photo Frame');
    setPPrice(0);
    setPDiscountPrice(0);
    setPStock(10);
    setPDescription('');
    setPImage('');
    setPImages([]);

    // Reset extended fields
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setPSku(`SKU-PROD-${randomId}`);
    setPBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setPQrCode('');
    setPBrand('');
    setPStatus('Active');
    setPCostPrice(0);
    setPGstPercent(18);
    setPEnableGst(true);
    setPEnableShipping(true);
    setPHsnCode('');
    setPMinStock(5);
    setPUnit('Piece');
    setPTrackInventory(true);
    setPShortDescription('');
    
    setPSpecMaterial('');
    setPSpecSize('');
    setPSpecWeight('');
    setPSicolor('');
    setPSpecFinish('');
    setPSpecWarranty('');
    setPSpecPowerSource('');
    setPCustomSpecs([]);
    setPVariants([]);

    setPCustPhotoRequired(false);
    setPCustNamePrinting(false);
    setPCustText(false);
    setPCustDatePrinting(false);
    setPCustUploadDesign(false);

    setPDrawerTab('basic'); // Modal active tab
    setPDeliveryTime('1 Day');
    setPShippingWeight(0);
    setPShippingCharge(0);
    setPFreeShipping(true);

    setPMetaTitle('');
    setPMetaDescription('');
    setPSlug('');

    setPLabelFeatured(false);
    setPLabelBestSeller(false);
    setPLabelTrending(false);
    setPLabelNewArrival(false);
    setPLabelHotDeal(false);
    setPLabelLimitedStock(false);

    setShowProductModal(true);
  };

  const handleDuplicateProduct = (p: ProductItem) => {
    setEditingProduct(null); // Save as a new copy
    setPTitle(`${p.title} (Copy)`);
    setPCategory(p.category);
    setPPrice(p.price);
    setPDiscountPrice(p.discountPrice || 0);
    setPStock(p.stock);
    setPDescription(p.description);
    setPImage(p.image);
    setPImages(p.images || (p.image ? [p.image] : []));

    // Populate copy
    const acronym = p.title.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const rand = Math.floor(100 + Math.random() * 900);
    setPSku(`SKU-${acronym}-${rand}-COPY`);
    setPBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    
    const slugCopy = (p.seo?.urlSlug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-copy';
    setPSlug(slugCopy);
    setPQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/store/' + slugCopy)}`);
    
    setPBrand(p.brand || '');
    setPStatus(p.status || 'Active');
    setPCostPrice(p.costPrice || 0);
    setPGstPercent(p.gstPercent || 18);
    setPEnableGst(p.enableGst !== false);
    setPEnableShipping(p.enableShipping !== false);
    setPHsnCode(p.hsnCode || '');
    setPMinStock(p.minStockAlert || 5);
    setPUnit(p.unit || 'Piece');
    setPTrackInventory(p.trackInventory !== false);
    setPShortDescription(p.shortDescription || '');

    // Specifications
    setPSpecMaterial(p.specifications?.material || '');
    setPSpecSize(p.specifications?.size || '');
    setPSpecWeight(p.specifications?.weight || '');
    setPSicolor(p.specifications?.color || '');
    setPSpecFinish(p.specifications?.finish || '');
    setPSpecWarranty(p.specifications?.warranty || '');
    setPSpecPowerSource(p.specifications?.powerSource || '');
    setPCustomSpecs(p.specifications?.customFields || []);

    // Variants
    setPVariants(p.variants || []);

    // Customization
    setPCustPhotoRequired(p.customization?.customerPhotoRequired || false);
    setPCustNamePrinting(p.customization?.customerNamePrinting || false);
    setPCustText(p.customization?.customText || false);
    setPCustDatePrinting(p.customization?.datePrinting || false);
    setPCustUploadDesign(p.customization?.uploadDesignFile || false);

    // Delivery
    setPDeliveryTime(p.delivery?.deliveryTime || '1 Day');
    setPShippingWeight(p.delivery?.shippingWeight || 0);
    setPShippingCharge(p.delivery?.shippingCharge || 0);
    setPFreeShipping(p.delivery?.freeShipping !== false);

    // SEO
    setPMetaTitle(`${p.title} (Copy) | Shiv Studio Store`);
    setPMetaDescription(p.seo?.metaDescription || '');

    // Labels
    setPLabelFeatured(p.labels?.featured || false);
    setPLabelBestSeller(p.labels?.bestSeller || false);
    setPLabelTrending(p.labels?.trending || false);
    setPLabelNewArrival(p.labels?.newArrival || false);
    setPLabelHotDeal(p.labels?.hotDeal || false);
    setPLabelLimitedStock(p.labels?.limitedStock || false);

    setPDrawerTab('basic');
    setShowProductModal(true);
    alert(`Cloned product settings from "${p.title}". Please review details and save.`);
  };

  const handleDeleteProduct = async (prodId: string) => {
    triggerConfirm(
      'Confirm Product Deletion',
      'Are you sure you want to permanently delete this product from your store catalog?',
      async () => {
        try {
          await deleteDoc(doc(db, 'products', prodId));
          alert('Product deleted successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Service CRUD Save
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const servId = editingService ? editingService.id : `serv_${Math.floor(Math.random() * 100000)}`;
      const servData: ServiceItem = {
        id: servId,
        title: sTitle,
        category: sCategory,
        description: sDescription,
        price: Number(sPrice),
        image: sImage || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400',
        gallery: editingService ? editingService.gallery : [],
        enableGst: sEnableGst,
        gstPercent: Number(sGstPercent),
        gstIncludedInPrice: sGstIncludedInPrice
      };

      await setDoc(doc(db, 'services', servId), servData);
      setShowServiceModal(false);
      setEditingService(null);
      alert('Service category saved successfully.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (servId: string) => {
    triggerConfirm(
      'Remove Service Category',
      'Are you sure you want to permanently remove this service from the listings?',
      async () => {
        try {
          await deleteDoc(doc(db, 'services', servId));
          alert('Service removed successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Gallery CRUD Save
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gId = editingGallery ? editingGallery.id : `gal_${Math.floor(Math.random() * 100000)}`;
      const gData: GalleryItem = {
        id: gId,
        title: gTitle,
        category: gCategory,
        imageUrl: gImageUrl || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400',
        isFeatured: gIsFeatured
      };

      await setDoc(doc(db, 'gallery', gId), gData);
      setShowGalleryModal(false);
      setEditingGallery(null);
      alert('Gallery item published.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGallery = async (gId: string) => {
    triggerConfirm(
      'Remove Showcase Image',
      'Are you sure you want to permanently remove this photo from the showcase gallery?',
      async () => {
        try {
          await deleteDoc(doc(db, 'gallery', gId));
          alert('Showcase image removed successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Offer CRUD Save
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const offerId = editingOffer ? editingOffer.id : `off_${Math.floor(Math.random() * 100000)}`;
      const offerData: OfferItem = {
        id: offerId,
        title: oTitle,
        description: oDescription,
        code: oCode.toUpperCase().replace(/\s+/g, ''),
        discountPercent: Number(oDiscountPercent),
        image: oImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400'
      };

      await setDoc(doc(db, 'offers', offerId), offerData);
      setShowOfferModal(false);
      setEditingOffer(null);
      alert('Coupon code & campaign details saved.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (offId: string) => {
    triggerConfirm(
      'Delete Promotional Coupon',
      'Are you sure you want to permanently delete this discount coupon and campaign?',
      async () => {
        try {
          await deleteDoc(doc(db, 'offers', offId));
          alert('Promotional coupon removed successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Review CRUD / Response Save
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const revId = editingReview ? editingReview.id : `rev_${Math.floor(Math.random() * 100000)}`;
      const revData: ReviewItem = {
        id: revId,
        customerId: editingReview ? editingReview.customerId : 'admin_direct',
        customerName: rCustomerName || 'Anonymous Client',
        rating: Number(rRating),
        comment: rComment,
        reply: rReply || undefined,
        date: editingReview ? editingReview.date : new Date().toISOString().split('T')[0]
      };

      await setDoc(doc(db, 'reviews', revId), revData);
      setShowReviewModal(false);
      setEditingReview(null);
      alert('Client response and feedback updated.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (revId: string) => {
    triggerConfirm(
      'Delete Client Review',
      'Are you sure you want to permanently delete this customer feedback and testimonial from the website?',
      async () => {
        try {
          await deleteDoc(doc(db, 'reviews', revId));
          alert('Review testimonial removed successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Blog CRUD Handlers
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const blogId = editingBlog ? editingBlog.id : `blog_${Date.now()}`;
      const blogData = {
        id: blogId,
        title: bTitle,
        excerpt: bExcerpt,
        content: bContent,
        category: bCategory,
        image: bImage || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600',
        author: bAuthor || 'Shiv Studio Team',
        date: editingBlog ? editingBlog.date : new Date().toISOString().split('T')[0]
      };
      await setDoc(doc(db, 'blogs', blogId), blogData);
      setShowBlogModal(false);
      setEditingBlog(null);
      alert('Blog article saved successfully!');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to save blog article.');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    triggerConfirm(
      'Delete Blog Post',
      'Are you sure you want to permanently delete this blog article?',
      async () => {
        try {
          await deleteDoc(doc(db, 'blogs', blogId));
          alert('Blog article deleted successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
          alert('Failed to delete blog.');
        }
      }
    );
  };

  const handleOpenBlogModal = (b?: BlogItem) => {
    if (b) {
      setEditingBlog(b);
      setBTitle(b.title);
      setBCategory(b.category);
      setBExcerpt(b.excerpt);
      setBContent(b.content);
      setBImage(b.image);
      setBAuthor(b.author);
    } else {
      setEditingBlog(null);
      setBTitle('');
      setBCategory('Photography');
      setBExcerpt('');
      setBContent('');
      setBImage('');
      setBAuthor('Shiv Studio Team');
    }
    setShowBlogModal(true);
  };

  // Expense Submit
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expId = `exp_${Math.floor(Math.random() * 100000)}`;
      const newExp: Expense = {
        id: expId,
        category: expCategory,
        amount: Number(expAmount),
        description: expDesc,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'expenses', expId), newExp);
      setExpAmount(0);
      setExpDesc('');
      alert('Expense recorded.');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Customer Management - Change Roles
  const handleUpdateUserRole = async (uid: string, role: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      alert(`User role successfully changed to: ${role}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Inquiry management
  const handleDeleteInquiry = async (inqId: string) => {
    triggerConfirm(
      'Delete Customer Inquiry',
      'Are you sure you want to permanently delete this customer inquiry from the inbox?',
      async () => {
        try {
          await deleteDoc(doc(db, 'inquiries', inqId));
          alert('Inquiry deleted from inbox successfully.');
          fetchDashboardData();
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Quick actions to fill form variables for edit
  const startEditProduct = (p: ProductItem) => {
    setEditingProduct(p);
    setPTitle(p.title);
    setPCategory(p.category);
    setPPrice(p.price);
    setPDiscountPrice(p.discountPrice || 0);
    setPStock(p.stock);
    setPDescription(p.description);
    setPImage(p.image);
    setPImages(p.images || (p.image ? [p.image] : []));

    // Populate extended fields
    setPSku(p.sku || '');
    setPBarcode(p.barcode || '');
    setPQrCode(p.qrCode || '');
    setPBrand(p.brand || '');
    setPStatus(p.status || 'Active');
    setPCostPrice(p.costPrice || 0);
    setPGstPercent(p.gstPercent || 18);
    setPEnableGst(p.enableGst !== false);
    setPGstIncludedInPrice(p.gstIncludedInPrice !== false);
    setPEnableShipping(p.enableShipping !== false);
    setPHsnCode(p.hsnCode || '');
    setPMinStock(p.minStockAlert || 5);
    setPUnit(p.unit || 'Piece');
    setPTrackInventory(p.trackInventory !== false);
    setPShortDescription(p.shortDescription || '');

    // Specifications
    setPSpecMaterial(p.specifications?.material || '');
    setPSpecSize(p.specifications?.size || '');
    setPSpecWeight(p.specifications?.weight || '');
    setPSicolor(p.specifications?.color || '');
    setPSpecFinish(p.specifications?.finish || '');
    setPSpecWarranty(p.specifications?.warranty || '');
    setPSpecPowerSource(p.specifications?.powerSource || '');
    setPCustomSpecs(p.specifications?.customFields || []);

    // Variants
    setPVariants(p.variants || []);

    // Customization
    setPCustPhotoRequired(p.customization?.customerPhotoRequired || false);
    setPCustNamePrinting(p.customization?.customerNamePrinting || false);
    setPCustText(p.customization?.customText || false);
    setPCustDatePrinting(p.customization?.datePrinting || false);
    setPCustUploadDesign(p.customization?.uploadDesignFile || false);

    // Delivery
    setPDeliveryTime(p.delivery?.deliveryTime || '1 Day');
    setPShippingWeight(p.delivery?.shippingWeight || 0);
    setPShippingCharge(p.delivery?.shippingCharge || 0);
    setPFreeShipping(p.delivery?.freeShipping !== false);

    // SEO
    setPMetaTitle(p.seo?.metaTitle || '');
    setPMetaDescription(p.seo?.metaDescription || '');
    setPSlug(p.seo?.urlSlug || '');

    // Labels
    setPLabelFeatured(p.labels?.featured || false);
    setPLabelBestSeller(p.labels?.bestSeller || false);
    setPLabelTrending(p.labels?.trending || false);
    setPLabelNewArrival(p.labels?.newArrival || false);
    setPLabelHotDeal(p.labels?.hotDeal || false);
    setPLabelLimitedStock(p.labels?.limitedStock || false);

    setPDrawerTab('basic'); // Reset active tab in modal
    setShowProductModal(true);
  };

  const startEditService = (s: ServiceItem) => {
    setEditingService(s);
    setSTitle(s.title);
    setSCategory(s.category);
    setSPrice(s.price);
    setSDescription(s.description);
    setSImage(s.image);
    setSEnableGst(s.enableGst !== false);
    setSGstPercent(s.gstPercent !== undefined ? s.gstPercent : 18);
    setSGstIncludedInPrice(s.gstIncludedInPrice !== false);
    setShowServiceModal(true);
  };

  const startEditGallery = (g: GalleryItem) => {
    setEditingGallery(g);
    setGTitle(g.title);
    setGCategory(g.category);
    setGImageUrl(g.imageUrl);
    setGIsFeatured(!!g.isFeatured);
    setShowGalleryModal(true);
  };

  const startEditOffer = (o: OfferItem) => {
    setEditingOffer(o);
    setOTitle(o.title);
    setODescription(o.description);
    setOCode(o.code);
    setODiscountPercent(o.discountPercent);
    setOImage(o.image);
    setShowOfferModal(true);
  };

  const startEditReview = (r: ReviewItem) => {
    setEditingReview(r);
    setRCustomerName(r.customerName);
    setRRating(r.rating);
    setRComment(r.comment);
    setRReply(r.reply || '');
    setShowReviewModal(true);
  };

  // Sidebar dynamic menu definition
  const menuItems = [
    { key: 'analytics', label: 'Analytics Panel', icon: TrendingUp },
    { key: 'website', label: 'Website Home Settings', icon: Globe },
    { key: 'services', label: 'Services Catalog', icon: Camera },
    { key: 'products', label: 'Product Store', icon: ShoppingBag },
    { key: 'wedding-cards', label: 'Wedding Cards', icon: Layers },
    { key: 'bookings', label: 'Shoot Bookings', icon: CalendarDays },
    { key: 'orders', label: 'Print Job Pipeline', icon: Sliders },
    { key: 'expenses', label: 'Expense Ledger', icon: DollarSign },
    { key: 'gallery', label: 'Gallery Showcase', icon: ImageIcon },
    { key: 'blogs', label: 'Blog Articles', icon: FileText },
    { key: 'offers', label: 'Coupons & Deals', icon: Tag },
    { key: 'reviews', label: 'Reviews Reply', icon: MessageSquare },
    { key: 'customers', label: 'Customer Database', icon: Users },
    { key: 'inquiries', label: 'Client Inboxes', icon: Inbox }
  ];

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Title Header */}
        <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-amber-500" />
              <span>{settings.studioName} Studio Hub</span>
            </h1>
            <p className="text-xxs sm:text-xs text-slate-400 mt-1">
              Fully dynamic role-based control panel to manage every content item, orders, appointments, expenses, and settings.
            </p>
          </div>
          
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all rounded-xl text-xxs font-mono font-bold uppercase tracking-wider"
          >
            🔄 Sync Fresh Data
          </button>
        </div>

        {/* Layout Grid: Sidebar Navigation + Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Dashboard Left Sidebar */}
          <div className="lg:col-span-1 space-y-2 bg-slate-900 border border-slate-850 p-4 rounded-3xl h-fit">
            <h3 className="text-xxs uppercase tracking-wider font-mono font-bold text-slate-500 px-3 mb-3">Control Modules</h3>
            <div className="flex flex-row overflow-x-auto lg:flex-col gap-1.5 pb-2 lg:pb-0 scrollbar-none">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xxs sm:text-xs font-semibold whitespace-nowrap tracking-wide uppercase font-mono transition-all duration-150 ${
                      isSelected 
                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-400/10' 
                        : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dashboard Workspace Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. ANALYTICS & RECENT ACTIVITIES TAB */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Highlights Card Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-400">
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-2">
                    <p className="text-xxs uppercase font-mono font-semibold tracking-wider text-slate-500">Gross Sales Revenue</p>
                    <h4 className="text-lg sm:text-2xl font-bold text-white">₹{totalSales.toLocaleString('en-IN')}</h4>
                    <span className="text-emerald-500 text-xxs font-mono font-bold">100% Secure Flow</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-2">
                    <p className="text-xxs uppercase font-mono font-semibold tracking-wider text-slate-500">Total Studio Expenses</p>
                    <h4 className="text-lg sm:text-2xl font-bold text-rose-400">₹{totalExpenses.toLocaleString('en-IN')}</h4>
                    <span className="text-rose-500/80 text-xxs font-mono font-bold">Outflow Checked</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-2">
                    <p className="text-xxs uppercase font-mono font-semibold tracking-wider text-slate-500">Net Operating Profits</p>
                    <h4 className="text-lg sm:text-2xl font-bold text-emerald-400">₹{netProfit.toLocaleString('en-IN')}</h4>
                    <span className="text-emerald-500 text-xxs font-mono font-bold">In Ledger</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-2">
                    <p className="text-xxs uppercase font-mono font-semibold tracking-wider text-slate-500">Shoot Appointments</p>
                    <h4 className="text-lg sm:text-2xl font-bold text-amber-400">{bookings.length} Registered</h4>
                    <span className="text-amber-500 text-xxs font-mono font-bold">{bookings.filter(b => b.status === 'Pending').length} Pending Approve</span>
                  </div>
                </div>

                {/* Sub row - Additional bento boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-slate-400">Pending Orders</span>
                    <h5 className="text-2xl font-bold text-white">{pendingOrders}</h5>
                  </div>
                  <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-slate-400">Completed Orders</span>
                    <h5 className="text-2xl font-bold text-white">{completedOrders}</h5>
                  </div>
                  <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-slate-400">E-Store Catalog items</span>
                    <h5 className="text-2xl font-bold text-white">{products.length} Products</h5>
                  </div>
                </div>

                {/* Recent Activities Panel */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs uppercase font-mono font-bold text-white tracking-wider border-b border-slate-850 pb-3">Recent Activities Stream</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto text-xxs sm:text-xs">
                    {bookings.slice(0, 3).map((bk, i) => (
                      <div key={i} className="flex gap-3 items-start border-b border-slate-850 pb-3">
                        <CalendarDays className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold">New session reservation: {bk.serviceTitle}</p>
                          <p className="text-slate-500">Booked by {bk.customerName} for {bk.date} at {bk.time}. Advance paid: ₹{bk.advancePaid}</p>
                        </div>
                      </div>
                    ))}
                    {orders.slice(0, 3).map((or, i) => (
                      <div key={i} className="flex gap-3 items-start border-b border-slate-850 pb-3">
                        <ShoppingBag className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                          <p className="text-white font-semibold">New shopping cart checkout order placed</p>
                          <p className="text-slate-500">Client {or.customerName} placed order #{or.id.slice(0,6)} for total sum of ₹{or.total.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. WEBSITE SETTINGS MANAGEMENT */}
            {activeTab === 'website' && (
              <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in">
                <div className="border-b border-slate-850 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Shiv Studio Dynamic Web Configurator</h3>
                  <p className="text-xxs text-slate-400 mt-1">Changes made here are persisted in Firebase Firestore settings collection and reflect instantly on live site.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
                  
                  {/* General settings */}
                  <div className="space-y-4">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Basic Info</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Studio Brand Name</label>
                        <input 
                          type="text"
                          required
                          value={settings.studioName}
                          onChange={e => setSettings({...settings, studioName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Primary WhatsApp / Mobile Link</label>
                        <input 
                          type="text"
                          required
                          value={settings.whatsappNumber}
                          onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Helpline Contact Line Numbers</label>
                        <input 
                          type="text"
                          required
                          value={settings.phone}
                          onChange={e => setSettings({...settings, phone: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Official Business Mail Address</label>
                        <input 
                          type="email"
                          required
                          value={settings.email}
                          onChange={e => setSettings({...settings, email: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Physical Showroom / Workshop Address</label>
                      <input 
                        type="text"
                        required
                        value={settings.address}
                        onChange={e => setSettings({...settings, address: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">GSTIN Registration Certificate Number</label>
                        <input 
                          type="text"
                          required
                          value={settings.gstNumber}
                          onChange={e => setSettings({...settings, gstNumber: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Business Standard Office Hours</label>
                        <input 
                          type="text"
                          required
                          value={settings.officeHours}
                          onChange={e => setSettings({...settings, officeHours: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Receipt Billing Bank Details & UPI Configuration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Bank Name</label>
                        <input 
                          type="text"
                          value={settings.bankName}
                          onChange={e => setSettings({...settings, bankName: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Account Number</label>
                        <input 
                          type="text"
                          value={settings.bankAccount}
                          onChange={e => setSettings({...settings, bankAccount: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">IFSC Code</label>
                        <input 
                          type="text"
                          value={settings.bankIfsc}
                          onChange={e => setSettings({...settings, bankIfsc: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">UPI ID (for QR Generation)</label>
                        <input 
                          type="text"
                          placeholder="e.g. shivsharan52796@okaxis"
                          value={settings.upiId || ''}
                          onChange={e => setSettings({...settings, upiId: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery / Shipping Settings */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Shipping & Delivery Configurations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Default Delivery Charge (₹)</label>
                        <input 
                          type="number"
                          value={settings.deliveryCharge !== undefined ? settings.deliveryCharge : 150}
                          onChange={e => setSettings({...settings, deliveryCharge: Number(e.target.value)})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                          min={0}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Free Delivery Threshold (₹) [Orders above this get Free Shipping]</label>
                        <input 
                          type="number"
                          value={settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1500}
                          onChange={e => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* UI Copy Sections */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Homepage Text Elements</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Hero Title Banner</label>
                        <input 
                          type="text"
                          required
                          value={settings.heroTitle}
                          onChange={e => setSettings({...settings, heroTitle: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Hero Subtitle Text</label>
                        <input 
                          type="text"
                          required
                          value={settings.heroSubtitle}
                          onChange={e => setSettings({...settings, heroSubtitle: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">About Heritage Title</label>
                      <input 
                        type="text"
                        required
                        value={settings.aboutTitle || "Our Heritage in Fatehpur"}
                        onChange={e => setSettings({...settings, aboutTitle: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">About Section Full Description</label>
                      <textarea 
                        rows={4}
                        required
                        value={settings.aboutDescription}
                        onChange={e => setSettings({...settings, aboutDescription: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                      ></textarea>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Interactive Google Map URL</label>
                      <input 
                        type="text"
                        required
                        value={settings.googleMapUrl}
                        onChange={e => setSettings({...settings, googleMapUrl: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Website Brand Images & Assets */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Website Brand Images & Graphic Assets</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageField 
                        value={settings.logoUrl || ''} 
                        onChange={(url) => setSettings({ ...settings, logoUrl: url })} 
                        storagePath="logo" 
                        label="Website Logo (Dynamic Header & Footer Logo)" 
                        recommendedSize="Square or circular icon (e.g., 512x512)" 
                        firestoreDoc="website_settings/studio"
                        firestoreField="logoUrl"
                      />
                      <ImageField 
                        value={settings.faviconUrl || ''} 
                        onChange={(url) => setSettings({ ...settings, faviconUrl: url })} 
                        storagePath="logo" 
                        label="Website Favicon Icon" 
                        recommendedSize="Small square (e.g., 32x32)" 
                        firestoreDoc="website_settings/studio"
                        firestoreField="faviconUrl"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageField 
                        value={settings.heroImageUrl || ''} 
                        onChange={(url) => setSettings({ ...settings, heroImageUrl: url })} 
                        storagePath="banners" 
                        label="Hero Section Banner Background" 
                        recommendedSize="Ultra-wide high-res landscape (e.g., 1920x1080)" 
                        firestoreDoc="website_settings/studio"
                        firestoreField="heroImageUrl"
                      />
                      <ImageField 
                        value={settings.aboutImageUrl || ''} 
                        onChange={(url) => setSettings({ ...settings, aboutImageUrl: url })} 
                        storagePath="banners" 
                        label="About Heritage Image Showcase" 
                        recommendedSize="Portrait/Square (e.g., 800x800)" 
                        firestoreDoc="website_settings/studio"
                        firestoreField="aboutImageUrl"
                      />
                    </div>
                  </div>

                  {/* Team Members Management */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Our Studio Team Members</h4>
                    <p className="text-slate-400 text-xxs">Add or modify team members shown on the about details or contact sections.</p>
                    <div className="space-y-4">
                      {(settings.team || []).map((member: any, index: number) => (
                        <div key={member.id || index} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                          <div className="flex items-center gap-4">
                            {member.image ? (
                              <img src={member.image} alt={member.name} className="h-10 w-10 rounded-full object-cover border border-amber-500/30" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold uppercase">{member.name ? member.name[0] : '?'}</div>
                            )}
                            <div>
                              <p className="font-bold text-white text-xs">{member.name || 'Unnamed Member'}</p>
                              <p className="text-xxs text-slate-400 font-mono uppercase tracking-wide">{member.role || 'No Role Set'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeamMemberIndex(index);
                                setTeamMemberName(member.name || '');
                                setTeamMemberRole(member.role || '');
                                setShowTeamModal(true);
                              }}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-xxs font-semibold"
                            >
                              ✏️ Edit Info
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedTeam = (settings.team || []).filter((_: any, i: number) => i !== index);
                                setSettings({ ...settings, team: updatedTeam });
                              }}
                              className="px-3 py-1.5 bg-rose-950/40 border border-rose-900/30 hover:bg-rose-900/40 text-rose-300 rounded-lg text-xxs font-semibold"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <div className="w-full sm:w-1/2">
                            <ImageField
                              value={member.image || ''}
                              onChange={(url) => {
                                const updatedTeam = [...(settings.team || [])];
                                updatedTeam[index] = { ...member, image: url };
                                setSettings({ ...settings, team: updatedTeam });
                              }}
                              storagePath="team"
                              label={`Photo for ${member.name || 'Member'}`}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeamMemberIndex(null);
                          setTeamMemberName('');
                          setTeamMemberRole('');
                          setShowTeamModal(true);
                        }}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-amber-500/20 hover:text-amber-400 text-slate-400 font-extrabold text-xxs font-mono rounded-xl flex items-center gap-1.5 transition-all w-fit"
                      >
                        ➕ Add New Team Member
                      </button>
                    </div>
                  </div>

                  {/* Category Images Management */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h4 className="text-xxs uppercase tracking-wider font-mono font-bold text-amber-500">Portfolio & Store Category Banner Images</h4>
                    <p className="text-slate-400 text-xxs">Configure the cover/background images for portfolio and merchandise product categories.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['Wedding', 'Pre Wedding', 'Baby', 'Events', 'Birthday', 'Drone', 'Albums'].map((cat) => (
                        <div key={cat} className="p-3 bg-slate-950 border border-slate-850 rounded-2xl space-y-2">
                          <p className="font-bold text-amber-400 text-[10px] font-mono uppercase tracking-wider">{cat} Category</p>
                          <ImageField
                            value={(settings.categoryImages || {})[cat] || ''}
                            onChange={(url) => {
                              const updatedCatImages = { ...(settings.categoryImages || {}), [cat]: url };
                              setSettings({ ...settings, categoryImages: updatedCatImages });
                            }}
                            storagePath="categories"
                            label="Category Background Cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl uppercase font-mono tracking-wider transition-all"
                  >
                    💾 Save and Deploy Settings Live
                  </button>
                </form>
              </div>
            )}

            {/* 3. SERVICES CATALOG MANAGEMENT */}
            {activeTab === 'services' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Dynamic Studio Services Catalog</h3>
                    <p className="text-xxs text-slate-400">Configure photography packages and digital industrial printing services.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setSTitle('');
                      setSCategory('Photography');
                      setSPrice(5000);
                      setSDescription('');
                      setSImage('');
                      setSEnableGst(true);
                      setSGstPercent(18);
                      setSGstIncludedInPrice(true);
                      setShowServiceModal(true);
                    }}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Service Package</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((s) => (
                    <div key={s.id} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-col justify-between">
                      <div>
                        <img 
                          src={s.image || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=400'} 
                          alt={s.title} 
                          className="aspect-video rounded-2xl object-cover w-full bg-slate-950" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="mt-4 space-y-1">
                          <span className="text-xxs font-mono font-bold uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded bg-amber-500/10">
                            {s.category}
                          </span>
                          <h4 className="font-bold text-white text-sm line-clamp-1 mt-2">{s.title}</h4>
                          <p className="text-xxs text-slate-400 line-clamp-2 mt-1">{s.description}</p>
                          <p className="text-xs text-white font-extrabold font-mono mt-1">₹{s.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-850 flex gap-2">
                        <button
                          onClick={() => startEditService(s)}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xxs font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="py-2 px-3 bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/35 text-rose-400 rounded-xl transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PRODUCT STORE CATALOG */}
            {activeTab === 'products' && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">E-Store Merchandise Products</h3>
                    <p className="text-xxs text-slate-400">Manage albums, canvases, frames, custom printing variants, and track inventory.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openAddProductModal}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Store Product</span>
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Search catalog by Product Name, SKU, Barcode, or Category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none placeholder-slate-500"
                    />
                    <span className="absolute left-3.5 top-3.5 text-slate-500">
                      <Sliders className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  {productSearch && (
                    <button 
                      onClick={() => setProductSearch('')}
                      className="text-xxs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-400 px-3 py-2 rounded-xl transition-all"
                    >
                      Clear Search
                    </button>
                  )}
                  <div className="text-xxs font-mono text-slate-400 self-center">
                    Found {
                      products.filter(p => {
                        const keyword = productSearch.toLowerCase().trim();
                        if (!keyword) return true;
                        return (
                          p.title?.toLowerCase().includes(keyword) ||
                          p.sku?.toLowerCase().includes(keyword) ||
                          p.barcode?.toLowerCase().includes(keyword) ||
                          p.category?.toLowerCase().includes(keyword)
                        );
                      }).length
                    } products
                  </div>
                </div>

                {/* Low Stock Overview Panel */}
                {products.filter(p => p.trackInventory !== false && p.stock < (p.minStockAlert !== undefined ? p.minStockAlert : 5)).length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-400 text-xs">⚠️ Stock Alerts: Low Inventory Detected</h4>
                      <p className="text-slate-300 text-xxs">
                        The following items have dipped below their defined minimum stock threshold: {' '}
                        {products
                          .filter(p => p.trackInventory !== false && p.stock < (p.minStockAlert !== undefined ? p.minStockAlert : 5))
                          .map(p => `"${p.title}" (${p.stock} units)`).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Grid */}
                {products.filter(p => {
                  const keyword = productSearch.toLowerCase().trim();
                  if (!keyword) return true;
                  return (
                    p.title?.toLowerCase().includes(keyword) ||
                    p.sku?.toLowerCase().includes(keyword) ||
                    p.barcode?.toLowerCase().includes(keyword) ||
                    p.category?.toLowerCase().includes(keyword)
                  );
                }).length === 0 ? (
                  <div className="bg-slate-900 border border-slate-850 p-12 text-center rounded-3xl">
                    <ShoppingBag className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <h4 className="font-bold text-white text-sm">No Store Products Found</h4>
                    <p className="text-slate-500 text-xs mt-1">Get started by creating your first e-store product catalog item or adjust your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products
                      .filter(p => {
                        const keyword = productSearch.toLowerCase().trim();
                        if (!keyword) return true;
                        return (
                          p.title?.toLowerCase().includes(keyword) ||
                          p.sku?.toLowerCase().includes(keyword) ||
                          p.barcode?.toLowerCase().includes(keyword) ||
                          p.category?.toLowerCase().includes(keyword)
                        );
                      })
                      .map((p) => {
                        const isLow = p.trackInventory !== false && p.stock < (p.minStockAlert !== undefined ? p.minStockAlert : 5);
                        const displayFinalPrice = p.finalPrice || (p.price - (p.discountPrice || 0));
                        return (
                          <div key={p.id} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-all">
                            <div>
                              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950">
                                <img 
                                  src={p.image} 
                                  alt={p.title} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Overlay Badges */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                  {isLow && (
                                    <span className="px-2 py-0.5 bg-rose-500 text-white font-extrabold text-[9px] rounded uppercase tracking-wider">
                                      Low Stock
                                    </span>
                                  )}
                                  {p.labels?.featured && (
                                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[9px] rounded uppercase tracking-wider">
                                      ★ Featured
                                    </span>
                                  )}
                                  {p.labels?.bestSeller && (
                                    <span className="px-2 py-0.5 bg-indigo-500 text-white font-extrabold text-[9px] rounded uppercase tracking-wider">
                                      Best Seller
                                    </span>
                                  )}
                                  {p.labels?.hotDeal && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white font-extrabold text-[9px] rounded uppercase tracking-wider">
                                      Hot Deal
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                                  {p.unit || 'Piece'}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xxs font-mono font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10">
                                    {p.category}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${p.status === 'Inactive' ? 'text-slate-500' : 'text-emerald-400'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'Inactive' ? 'bg-slate-600' : 'bg-emerald-500'}`}></span>
                                    {p.status || 'Active'}
                                  </span>
                                </div>

                                <h4 className="font-bold text-white text-sm line-clamp-1">{p.title}</h4>
                                
                                {p.shortDescription && (
                                  <p className="text-slate-400 text-xxs line-clamp-2">{p.shortDescription}</p>
                                )}

                                <div className="bg-slate-950/40 p-2.5 rounded-xl space-y-1 text-xxs font-mono">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">SKU:</span>
                                    <span className="text-slate-300 select-all font-bold">{p.sku || 'N/A'}</span>
                                  </div>
                                  {p.barcode && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Barcode:</span>
                                      <span className="text-slate-300">{p.barcode}</span>
                                    </div>
                                  )}
                                  {p.brand && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Brand:</span>
                                      <span className="text-slate-300">{p.brand}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex justify-between items-baseline pt-1">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Store Price</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm text-white font-extrabold font-mono">₹{displayFinalPrice.toLocaleString('en-IN')}</span>
                                      {p.discountPrice && p.discountPrice > 0 && (
                                        <span className="text-slate-500 line-through text-xxs">₹{p.price}</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Inventory</span>
                                    <p className={`font-mono text-xxs font-bold ${isLow ? 'text-rose-400' : 'text-slate-300'}`}>
                                      {p.trackInventory !== false ? `${p.stock} left` : 'Unlim. Stock'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-850 flex gap-2">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xxs font-bold rounded-xl flex items-center justify-center gap-1 transition-all"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Edit Specs</span>
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                title="Duplicate product"
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-800 text-slate-300 rounded-xl transition-all"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="py-2 px-3 bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/35 text-rose-400 rounded-xl transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 5. BOOKINGS MANAGEMENT */}
            {activeTab === 'bookings' && (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 space-y-6 shadow-xl animate-fade-in text-xs">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">
                    Appointments & Event Shoot Bookings
                  </h3>
                  <p className="text-xxs text-slate-400 mt-1">Approve reservations, update payment tracking, and assign staff photographers for coverage.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xxs sm:text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-white font-semibold uppercase tracking-wide text-xxs font-mono">
                        <th className="py-2.5">Customer & ID</th>
                        <th className="py-2.5">Shoot details</th>
                        <th className="py-2.5">Financial Summary</th>
                        <th className="py-2.5">Staff Assigned</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {bookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-slate-850/30">
                          <td className="py-3.5">
                            <p className="font-bold text-white">{bk.customerName}</p>
                            <p className="text-slate-500 text-xxs font-mono">#{bk.id.slice(0, 8).toUpperCase()}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-slate-300">{bk.serviceTitle}</p>
                            <p className="text-slate-400 text-xxs">{bk.date} at {bk.time}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="text-slate-300">Total: ₹{bk.totalPrice}</p>
                            <p className="text-emerald-400 font-bold">Paid Adv: ₹{bk.advancePaid}</p>
                          </td>
                          <td className="py-3.5">
                            <select
                              value={bk.photographerId || ''}
                              onChange={(e) => handleAssignPhotographer(bk.id, e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded text-xxs text-slate-300 px-2 py-1 outline-none"
                            >
                              <option value="">-- Assign Staff --</option>
                              {users
                                .filter(u => u.role === 'Photographer' || u.role === 'Admin' || u.role === 'Super Admin')
                                .map(u => <option key={u.uid} value={u.uid}>{u.fullName}</option>)
                              }
                            </select>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                              bk.status === 'Approved' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : bk.status === 'Completed'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : bk.status === 'Cancelled'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {bk.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => { setSelectedDoc(bk); setSelectedType('booking'); }}
                              className="p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 rounded-xl transition-all"
                              title="Tax Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {bk.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'Approved')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xxs uppercase transition-all"
                              >
                                Approve
                              </button>
                            )}
                            {bk.status === 'Approved' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'Completed')}
                                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xxs uppercase transition-all"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. ORDERS MANUFACTURING PIPELINE */}
            {activeTab === 'orders' && (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 space-y-6 shadow-xl animate-fade-in text-xs">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">
                    Store Print Job Orders & Customization Pipeline
                  </h3>
                  <p className="text-xxs text-slate-400 mt-1">Track payments, download client-provided design coordinates, and manage manufacturing status steps.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xxs sm:text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-white font-semibold uppercase tracking-wide text-xxs font-mono">
                        <th className="py-2.5">Order ID & Client</th>
                        <th className="py-2.5">Deliverables</th>
                        <th className="py-2.5">Customer Asset File</th>
                        <th className="py-2.5">Grand Total</th>
                        <th className="py-2.5">Manufacturing Step</th>
                        <th className="py-2.5 text-right">Receipt / Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-850/30">
                          <td className="py-3.5">
                            <p className="font-bold text-white">{ord.customerName}</p>
                            <p className="text-slate-500 text-xxs font-mono">#{ord.id.slice(0, 8).toUpperCase()}</p>
                          </td>
                          <td className="py-3.5 text-slate-300">
                            <ul className="list-disc pl-3 text-xxs space-y-0.5 text-slate-400">
                              {ord.items.map((it, k) => <li key={k} className="line-clamp-1">{it.productTitle} (x{it.quantity})</li>)}
                            </ul>
                          </td>
                          <td className="py-3.5 text-slate-300">
                            {((ord.uploadedFiles && ord.uploadedFiles.length > 0) || ord.uploadedFileUrl) && (
                              <button
                                type="button"
                                onClick={() => handleBulkDownload(ord.id, ord.customerName, ord.uploadedFiles || ord.uploadedFileUrl)}
                                disabled={downloadingOrderId === ord.id}
                                className="mb-2.5 w-full max-w-[150px] py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-400 disabled:text-slate-500 disabled:bg-slate-800/30 border border-amber-500/15 disabled:border-slate-800 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer"
                              >
                                {downloadingOrderId === ord.id ? (
                                  <>
                                    <span className="animate-spin inline-block h-3 w-3 border-2 border-amber-400 border-t-transparent rounded-full shrink-0" />
                                    <span className="truncate">{downloadProgress}</span>
                                  </>
                                ) : (
                                  <>
                                    <FolderArchive className="h-3 w-3 shrink-0" />
                                    <span>Bulk Download ZIP</span>
                                  </>
                                )}
                              </button>
                            )}

                            {ord.uploadedFiles && ord.uploadedFiles.length > 0 ? (
                              <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto">
                                {ord.uploadedFiles.map((f, fIdx) => (
                                  <a 
                                    key={fIdx}
                                    href={f.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-slate-400 hover:text-amber-400 hover:underline font-medium font-mono text-[10px] flex items-center gap-1 truncate max-w-[150px]"
                                    title={f.name}
                                  >
                                    📄 {f.name}
                                  </a>
                                ))}
                              </div>
                            ) : ord.uploadedFileUrl ? (
                              <a 
                                href={ord.uploadedFileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-amber-400 hover:underline font-bold font-mono text-xxs flex items-center gap-1"
                              >
                                Download Link 📄
                              </a>
                            ) : (
                              <span className="text-slate-600 font-mono text-xxs">No upload provided</span>
                            )}
                          </td>
                          <td className="py-3.5 text-white font-bold">₹{ord.total.toLocaleString('en-IN')}</td>
                          <td className="py-3.5">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                              className="bg-slate-950 border border-slate-850 rounded text-xxs text-amber-500 font-extrabold px-2 py-1 outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Designing">Designing</option>
                              <option value="Printing">Printing</option>
                              <option value="Ready">Ready</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => { setSelectedDoc(ord); setSelectedType('order'); }}
                              className="p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 rounded-xl transition-all"
                              title="Invoice Certificate"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. EXPENSES LEDGER */}
            {activeTab === 'expenses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in text-xs font-sans">
                {/* Log expense form */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">Log Capital Expense</h3>
                  <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Expense Category</label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                      >
                        <option value="Rent">Rent</option>
                        <option value="Salary">Salary</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Printing Material">Printing Material</option>
                        <option value="Travel">Travel</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Log Amount (INR)</label>
                      <input
                        type="number"
                        required
                        value={expAmount}
                        onChange={(e) => setExpAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Payment Narration Description</label>
                      <input
                        type="text"
                        required
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        placeholder="Velvet papers / printing cartridges restock"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl uppercase font-mono text-xxs tracking-wider transition-all"
                    >
                      Confirm Debit Flow
                    </button>
                  </form>
                </div>

                {/* historical logs list */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">Historical Expense Statements</h3>
                  <div className="divide-y divide-slate-850 max-h-[400px] overflow-y-auto">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{exp.category}</p>
                          <p className="text-xxs text-slate-500 mt-0.5">{exp.description} | {exp.date}</p>
                        </div>
                        <span className="font-bold text-rose-400 font-mono">-₹{exp.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. GALLERY SHOWCASE MANAGEMENT */}
            {activeTab === 'gallery' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Showcase Gallery Portfolio</h3>
                    <p className="text-xxs text-slate-400">Configure client-facing photo album showcase category sliders.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingGallery(null);
                      setGTitle('');
                      setGCategory('Wedding');
                      setGImageUrl('');
                      setGIsFeatured(false);
                      setShowGalleryModal(true);
                    }}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Upload Portfolio Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-xs">
                  {gallery.map((g) => (
                    <div key={g.id} className="bg-slate-900 border border-slate-850 p-3 rounded-2xl relative group">
                      <img src={g.imageUrl} alt={g.title} className="aspect-video w-full object-cover rounded-xl bg-slate-950" referrerPolicy="no-referrer" />
                      <div className="mt-2.5">
                        <p className="font-semibold text-white truncate">{g.title || 'Portfolio Work'}</p>
                        <p className="text-xxs text-slate-500 font-mono uppercase">{g.category}</p>
                        {g.isFeatured && (
                          <span className="inline-block mt-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Featured ⭐</span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-1 pt-2 border-t border-slate-850">
                        <button 
                          onClick={() => startEditGallery(g)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xxs font-bold"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteGallery(g.id)}
                          className="px-2 py-1.5 bg-slate-950 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-850 rounded text-slate-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WEDDING CARDS TAB */}
            {activeTab === 'wedding-cards' && (
              <AdminWeddingCardManager />
            )}

            {/* 9. OFFERS AND COUPONS TAB */}
            {activeTab === 'offers' && (
              <AdminCouponManager 
                products={products} 
                services={services} 
                onTriggerConfirm={triggerConfirm} 
              />
            )}

            {/* 10. REVIEWS & OWNER REPLY */}
            {activeTab === 'reviews' && (
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 animate-fade-in text-xs font-sans">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">
                    Customer Testimonials & Reviews
                  </h3>
                  <p className="text-xxs text-slate-400 mt-1">Read reviews posted on website, write official replies to thank clients, or moderate items.</p>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-xs">{rev.customerName}</p>
                          <p className="text-slate-500 text-xxs font-mono">{rev.date} | Rated: {rev.rating}⭐</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startEditReview(rev)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xxs font-bold transition-all"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1 text-slate-500 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-300 italic text-xxs sm:text-xs">"{rev.comment}"</p>

                      {rev.reply && (
                        <div className="pl-4 border-l-2 border-amber-500 bg-slate-900 p-2.5 rounded-r-xl">
                          <p className="text-xxs text-amber-500 font-bold uppercase tracking-wider">Owner Response</p>
                          <p className="text-slate-400 text-xxs mt-0.5 leading-normal">{rev.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. CUSTOMER DATABASE */}
            {activeTab === 'customers' && (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 space-y-6 shadow-xl animate-fade-in text-xs font-sans">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">Registered Customer Base</h3>
                  <p className="text-xxs text-slate-400 mt-1">Configure security system accounts, view histories, or promote/demote employee roles.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xxs sm:text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-white font-semibold uppercase tracking-wide text-xxs font-mono">
                        <th className="py-2.5">UID / Registered Profile</th>
                        <th className="py-2.5">Mobile Contact</th>
                        <th className="py-2.5">Email Inbox</th>
                        <th className="py-2.5">System Access Role</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {users.map((us) => (
                        <tr key={us.uid} className="hover:bg-slate-850/30">
                          <td className="py-3.5">
                            <p className="font-bold text-white">{us.fullName}</p>
                            <p className="text-slate-500 text-xxs font-mono">#{us.uid.slice(0, 8).toUpperCase()}</p>
                          </td>
                          <td className="py-3.5 text-slate-300">{us.phone || 'N/A'}</td>
                          <td className="py-3.5 text-slate-400 font-mono">{us.email}</td>
                          <td className="py-3.5">
                            <select
                              value={us.role}
                              onChange={(e) => handleUpdateUserRole(us.uid, e.target.value as any)}
                              className="bg-slate-950 border border-slate-850 rounded text-xxs text-amber-500 font-bold px-2 py-1 outline-none"
                            >
                              <option value="Super Admin">Super Admin</option>
                              <option value="Admin">Admin</option>
                              <option value="Photographer">Photographer</option>
                              <option value="Designer">Designer</option>
                              <option value="Printing Staff">Printing Staff</option>
                              <option value="Customer">Customer</option>
                            </select>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => { setSelectedUser(us); setShowCustomerModal(true); }}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-xxs text-slate-300 font-bold transition-all"
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 12. CLIENT CONTACT INBOXES */}
            {activeTab === 'inquiries' && (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden p-6 space-y-6 shadow-xl animate-fade-in text-xs font-sans">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-3">Inquiries Inbox</h3>
                  <p className="text-xxs text-slate-400 mt-1">Direct inquiries dropped by local guests on the contact form page.</p>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {inquiries.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 font-mono">No customer inquiries received yet.</p>
                  ) : (
                    inquiries.map((inq) => (
                      <div key={inq.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl relative space-y-2">
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div>
                          <h4 className="font-bold text-white text-xs">{inq.fullName}</h4>
                          <p className="text-slate-500 text-xxs font-mono">{inq.email} | {inq.phone} | Received: {inq.createdAt?.split('T')[0]}</p>
                        </div>
                        
                        <p className="text-slate-300 leading-normal text-xxs sm:text-xs">"{inq.message}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 13. BLOG ARTICLES MANAGEMENT */}
            {activeTab === 'blogs' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Dynamic Blog Articles</h3>
                    <p className="text-xxs text-slate-400">Configure photography, printing press news, and studio insights blogs.</p>
                  </div>
                  <button
                    onClick={() => handleOpenBlogModal()}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Blog Post</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                  {blogs.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-850 rounded-3xl">
                      <p className="text-slate-500 font-mono">No blog articles published yet.</p>
                    </div>
                  ) : (
                    blogs.map((b) => (
                      <div key={b.id} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-col justify-between">
                        <div className="space-y-3">
                          {b.image && (
                            <img src={b.image} alt={b.title} className="w-full h-40 object-cover rounded-2xl border border-slate-800" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono text-[10px] uppercase font-bold rounded">{b.category}</span>
                            <h4 className="font-bold text-white text-sm mt-1">{b.title}</h4>
                            <p className="text-xxs text-slate-500 font-mono mt-0.5">By {b.author || 'Shiv Studio Team'} | {b.date?.split('T')[0]}</p>
                          </div>
                          <p className="text-slate-400 text-xxs sm:text-xs leading-relaxed line-clamp-2">{b.excerpt}</p>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-850/60">
                          <button
                            onClick={() => handleOpenBlogModal(b)}
                            className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-white rounded-lg text-xxs font-semibold"
                          >
                            ✏️ Edit Article
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(b.id)}
                            className="px-3.5 py-1.5 bg-rose-950/40 border border-rose-900/30 hover:bg-rose-900/40 text-rose-300 rounded-lg text-xxs font-semibold"
                          >
                            ✕ Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL WINDOWS */}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[92vh] overflow-y-auto shadow-2xl">
            <button 
              onClick={() => setShowProductModal(false)} 
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white transition-colors bg-slate-950/50 hover:bg-slate-950/80 rounded-full"
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold uppercase tracking-wider text-xs">
              <span>⚡ e-Commerce Control Engine</span>
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight mb-4">
              {editingProduct ? `Edit product specifications: ${pTitle}` : 'Configure New Professional Product Listing'}
            </h3>

            {/* Sub-tab Selectors */}
            <div className="flex flex-row overflow-x-auto lg:flex-wrap gap-2 pb-3 mb-6 border-b border-slate-800 font-mono text-xxs tracking-wider uppercase font-bold scrollbar-none">
              {[
                { id: 'basic', label: '1. Basic Info & Media' },
                { id: 'pricing', label: '2. Pricing & Inventory' },
                { id: 'customization', label: '3. Personalization & Printing' },
                { id: 'variants', label: '4. Product Variants' },
                { id: 'delivery', label: '5. Fulfillment & Logistics' },
                { id: 'seo', label: '6. SEO & Metadata' },
                { id: 'preview', label: '👁 Live Card Preview' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPDrawerTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap ${
                    pDrawerTab === tab.id
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Container */}
            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              {/* TAB 1: BASIC INFO */}
              {pDrawerTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold flex justify-between items-center">
                        <span>Product Title <span className="text-amber-500">*</span></span>
                        <span className="text-xxs font-normal text-slate-500">Auto generates SKU & Slug</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={pTitle} 
                        onChange={(e) => handleTitleChange(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" 
                        placeholder="e.g. Premium Teakwood LED Acrylic Frame" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Store Category <span className="text-amber-500">*</span></label>
                        <select 
                          value={pCategory} 
                          onChange={(e) => setPCategory(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50"
                        >
                          <option value="Photo Frame">Photo Frame</option>
                          <option value="Canvas">Canvas</option>
                          <option value="LED Frame">LED Frame</option>
                          <option value="Photo Album">Photo Album</option>
                          <option value="Wedding Album">Wedding Album</option>
                          <option value="Mug Printing">Mug Printing</option>
                          <option value="T Shirt Printing">T Shirt Printing</option>
                          <option value="Keychains">Keychains</option>
                          <option value="Custom Gift">Custom Gift</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Catalog Status</label>
                        <select 
                          value={pStatus} 
                          onChange={(e) => setPStatus(e.target.value as any)} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                        >
                          <option value="Active">Active (Publicly Visible)</option>
                          <option value="Inactive">Inactive (Hidden/Draft)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Manufacturer Brand</label>
                        <input 
                          type="text" 
                          value={pBrand} 
                          onChange={(e) => setPBrand(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="e.g. Shiv Studio Original" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold flex justify-between items-center">
                          <span>Unique SKU / Code</span>
                          <span className="text-[10px] text-amber-500/80 hover:underline cursor-pointer" onClick={() => setPSku(`SKU-PROD-${Math.floor(1000 + Math.random()*9000)}`)}>Gen SKU</span>
                        </label>
                        <input 
                          type="text" 
                          value={pSku} 
                          onChange={(e) => setPSku(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="e.g. SKU-LED-109" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Short Blurb (Catalog Excerpt)</label>
                      <input 
                        type="text" 
                        value={pShortDescription} 
                        onChange={(e) => setPShortDescription(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                        placeholder="Brief 1-sentence sales pitch for catalog grid..." 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Product Specifications (Detailed Specs)</label>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                        <input 
                          type="text" 
                          placeholder="Material (e.g. Teakwood)" 
                          value={pSpecMaterial} 
                          onChange={(e) => setPSpecMaterial(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                        <input 
                          type="text" 
                          placeholder="Size (e.g. 12x18 inches)" 
                          value={pSpecSize} 
                          onChange={(e) => setPSpecSize(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                        <input 
                          type="text" 
                          placeholder="Weight (e.g. 1.2 kg)" 
                          value={pSpecWeight} 
                          onChange={(e) => setPSpecWeight(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                        <input 
                          type="text" 
                          placeholder="Color (e.g. Warm White)" 
                          value={pSpecColor} 
                          onChange={(e) => setPSicolor(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                        <input 
                          type="text" 
                          placeholder="Finish (e.g. Matte Polish)" 
                          value={pSpecFinish} 
                          onChange={(e) => setPSpecFinish(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                        <input 
                          type="text" 
                          placeholder="Warranty (e.g. 1 Year Brand)" 
                          value={pSpecWarranty} 
                          onChange={(e) => setPSpecWarranty(e.target.value)} 
                          className="bg-slate-950 border border-slate-850 text-xxs p-2 rounded outline-none text-slate-200" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ImageField
                      value={pImage}
                      onChange={setPImage}
                      storagePath="products"
                      label="Primary Product Image (Cover) *"
                      recommendedSize="800x800 px (1:1 Ratio)"
                    />
                    
                    <MultiImageField
                      value={pImages}
                      onChange={setPImages}
                      storagePath="products"
                      label="Product Catalog Slideshow Images (Max 10MB)"
                    />

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Product Description</label>
                      <textarea 
                        rows={3} 
                        value={pDescription} 
                        onChange={(e) => setPDescription(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" 
                        placeholder="Full specs, customer instructions, package contents, power source..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & INVENTORY */}
              {pDrawerTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-slate-300">
                  <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850/80">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-850 pb-2 mb-3 text-amber-400">📊 Pricing Book</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Cost Price (INR)</label>
                        <input 
                          type="number" 
                          value={pCostPrice} 
                          onChange={(e) => setPCostPrice(Number(e.target.value))} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="Purchase price/Material cost"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Selling Price (INR) <span className="text-amber-500">*</span></label>
                        <input 
                          type="number" 
                          required 
                          value={pPrice} 
                          onChange={(e) => setPPrice(Number(e.target.value))} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Discount Deduction (INR)</label>
                        <input 
                          type="number" 
                          value={pDiscountPrice} 
                          onChange={(e) => setPDiscountPrice(Number(e.target.value))} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="Subtracts from selling price"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Auto Discount %</label>
                        <div className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-400 font-mono font-bold">
                          {pPrice > 0 ? Math.round((pDiscountPrice / pPrice) * 100) : 0}% Off
                        </div>
                      </div>
                    </div>

                     <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-bold text-xxs uppercase tracking-wider">GST Status for Product</span>
                          <div className="flex items-center gap-3 font-mono text-xxs">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="pEnableGstRadio" 
                                checked={pEnableGst === true} 
                                onChange={() => setPEnableGst(true)} 
                                className="accent-amber-400" 
                              />
                              <span className="text-emerald-400 font-bold">☑ Enable GST</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="pEnableGstRadio" 
                                checked={pEnableGst === false} 
                                onChange={() => setPEnableGst(false)} 
                                className="accent-amber-400" 
                              />
                              <span className="text-slate-400 font-bold">☐ Disable GST</span>
                            </label>
                          </div>
                        </div>

                        {pEnableGst && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-850 animate-fade-in">
                            <div className="space-y-1">
                              <label className="text-slate-400 font-semibold text-xxs">GST Percentage</label>
                              <select 
                                value={pGstPercent} 
                                onChange={(e) => setPGstPercent(Number(e.target.value))} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none text-xs"
                              >
                                <option value="0">0% (Exempt)</option>
                                <option value="5">5% (Utility)</option>
                                <option value="12">12% (Standard)</option>
                                <option value="18">18% (Services/Design)</option>
                                <option value="28">28% (Luxury)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-slate-400 font-semibold text-xxs">GST Included in Price?</label>
                              <select 
                                value={pGstIncludedInPrice ? 'yes' : 'no'} 
                                onChange={(e) => setPGstIncludedInPrice(e.target.value === 'yes')} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none text-xs"
                              >
                                <option value="yes">Yes (Tax Inclusive)</option>
                                <option value="no">No (Tax Extra)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-slate-400 font-semibold text-xxs">HSN / SAC Code</label>
                              <input 
                                type="text" 
                                value={pHsnCode} 
                                onChange={(e) => setPHsnCode(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none text-xs font-mono" 
                                placeholder="e.g. 49119100" 
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 mt-4 space-y-1.5 font-mono text-xxs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Auto Generated Final Price:</span>
                        <span className="text-amber-400 font-bold">₹{(pPrice - pDiscountPrice).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estimated Gross Margin:</span>
                        <span className={pPrice - pDiscountPrice - pCostPrice > 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>
                          ₹{(pPrice - pDiscountPrice - pCostPrice).toLocaleString('en-IN')} ({
                            pPrice - pDiscountPrice > 0 
                              ? Math.round(((pPrice - pDiscountPrice - pCostPrice) / (pPrice - pDiscountPrice)) * 100) 
                              : 0
                          }%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-950/30 p-5 rounded-2xl border border-slate-850/80">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-850 pb-2 mb-3 text-indigo-400">📦 Inventory Controller</h4>

                    <div className="flex items-center gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-850">
                      <input 
                        type="checkbox" 
                        id="trackInventory" 
                        checked={pTrackInventory} 
                        onChange={(e) => setPTrackInventory(e.target.checked)} 
                        className="h-4 w-4 rounded bg-slate-950 accent-amber-400 cursor-pointer" 
                      />
                      <label htmlFor="trackInventory" className="text-slate-300 font-bold cursor-pointer text-xxs select-none">
                        Track Stock levels for this product in Firestore
                      </label>
                    </div>

                    {pTrackInventory && (
                      <div className="space-y-4 animate-fade-in pt-2">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-slate-400 font-semibold">Stock Level (Units) <span className="text-amber-500">*</span></label>
                            <input 
                              type="number" 
                              required 
                              value={pStock} 
                              onChange={(e) => setPStock(Number(e.target.value))} 
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-slate-400 font-semibold">Unit Type</label>
                            <select 
                              value={pUnit} 
                              onChange={(e) => setPUnit(e.target.value as any)} 
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none text-xs"
                            >
                              <option value="Piece">Piece</option>
                              <option value="Pack">Pack</option>
                              <option value="Box">Box</option>
                              <option value="Set">Set</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-semibold">Minimum Stock Alert Threshold</label>
                          <input 
                            type="number" 
                            value={pMinStock} 
                            onChange={(e) => setPMinStock(Number(e.target.value))} 
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                            placeholder="Defaults to 5 units"
                          />
                          <p className="text-xxs text-slate-500">Triggers 'Low Stock' warnings inside the shop dashboard once stock drops below this value.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-850">
                      <span className="text-xxs text-slate-500 uppercase font-mono tracking-wider">Store Badges & Promotional Labels</span>
                      <div className="grid grid-cols-2 gap-2 text-xxs font-mono text-slate-400">
                        {[
                          { id: 'featured', label: '★ Featured', val: pLabelFeatured, set: setPLabelFeatured },
                          { id: 'bestSeller', label: 'Best Seller', val: pLabelBestSeller, set: setPLabelBestSeller },
                          { id: 'trending', label: '🔥 Trending', val: pLabelTrending, set: setPLabelTrending },
                          { id: 'newArrival', label: '✨ New Arrival', val: pLabelNewArrival, set: setPLabelNewArrival },
                          { id: 'hotDeal', label: '⚡ Hot Deal', val: pLabelHotDeal, set: setPLabelHotDeal },
                          { id: 'limitedStock', label: '⏳ Limited Stock', val: pLabelLimitedStock, set: setPLabelLimitedStock },
                        ].map(badge => (
                          <label key={badge.id} className="flex items-center gap-2 p-2 bg-slate-950/40 rounded-xl border border-slate-850/60 cursor-pointer select-none hover:bg-slate-950 transition-all">
                            <input 
                              type="checkbox" 
                              checked={badge.val} 
                              onChange={(e) => badge.set(e.target.checked)} 
                              className="accent-amber-400" 
                            />
                            <span>{badge.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMIZATION */}
              {pDrawerTab === 'customization' && (
                <div className="space-y-6 animate-fade-in text-slate-300 bg-slate-950/30 p-6 rounded-2xl border border-slate-850">
                  <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1 text-emerald-400">🎨 Printing Press Customization Options</h4>
                    <p className="text-xxs text-slate-500">Configure personalization fields required from clients before checkout (e.g. customized names, photos, date printing).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xxs">Customer Photo Upload</span>
                          <p className="text-slate-500 text-[10px]">Require customer to supply a JPEG/PNG photo.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pCustPhotoRequired} 
                          onChange={(e) => setPCustPhotoRequired(e.target.checked)} 
                          className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xxs">Customer Name Printing</span>
                          <p className="text-slate-500 text-[10px]">Provide input textbox for dedicated name printing.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pCustNamePrinting} 
                          onChange={(e) => setPCustNamePrinting(e.target.checked)} 
                          className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xxs">Custom Message Box</span>
                          <p className="text-slate-500 text-[10px]">Provide rich text input for wishes or custom quotes.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pCustText} 
                          onChange={(e) => setPCustText(e.target.checked)} 
                          className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xxs">Special Anniversary Date</span>
                          <p className="text-slate-500 text-[10px]">Allow choosing date (e.g. birthday/anniversary calendars).</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pCustDatePrinting} 
                          onChange={(e) => setPCustDatePrinting(e.target.checked)} 
                          className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xxs">Design File Upload option</span>
                          <p className="text-slate-500 text-[10px]">Allow graphic designers to upload .AI, .PSD, .CDR, .PDF print files.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={pCustUploadDesign} 
                          onChange={(e) => setPCustUploadDesign(e.target.checked)} 
                          className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                        />
                      </div>

                      <div className="p-3 bg-amber-400/5 border border-amber-400/10 rounded-xl">
                        <p className="text-xxs text-amber-500 font-mono">
                          ℹ️ Personalization fields are rendered dynamically on the Customer Store Portal. Submitted design assets are safely cataloged into the checkout order package.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: VARIANTS */}
              {pDrawerTab === 'variants' && (
                <div className="space-y-6 animate-fade-in bg-slate-950/30 p-6 rounded-2xl border border-slate-850">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-500">👥 Product Variants Registry</h4>
                      <p className="text-xxs text-slate-500">Configure unlimited variants of this product. Each variant has its own custom SKU, Price, Stock, and active status.</p>
                    </div>
                  </div>

                  {/* Add Variant Form Row */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 space-y-3">
                    <span className="text-xxs font-bold text-slate-300 font-mono block">Add New Custom Variant</span>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <input 
                        type="text" 
                        id="var_name" 
                        placeholder="Variant (e.g. Size: 8x10)" 
                        className="bg-slate-900 border border-slate-800 text-xxs p-2 rounded outline-none text-slate-100" 
                      />
                      <input 
                        type="text" 
                        id="var_sku" 
                        placeholder="Variant SKU (Optional)" 
                        className="bg-slate-900 border border-slate-800 text-xxs p-2 rounded outline-none text-slate-100" 
                      />
                      <input 
                        type="number" 
                        id="var_price" 
                        placeholder="Price (INR) e.g. 500" 
                        className="bg-slate-900 border border-slate-800 text-xxs p-2 rounded outline-none text-slate-100" 
                      />
                      <input 
                        type="number" 
                        id="var_stock" 
                        placeholder="Stock qty e.g. 10" 
                        className="bg-slate-900 border border-slate-800 text-xxs p-2 rounded outline-none text-slate-100" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nameEl = document.getElementById('var_name') as HTMLInputElement;
                          const skuEl = document.getElementById('var_sku') as HTMLInputElement;
                          const priceEl = document.getElementById('var_price') as HTMLInputElement;
                          const stockEl = document.getElementById('var_stock') as HTMLInputElement;

                          if (!nameEl.value || !priceEl.value || !stockEl.value) {
                            alert('Please fill in Variant Name, Price, and Stock level to add.');
                            return;
                          }

                          const newVar = {
                            id: `var_${Date.now()}`,
                            name: nameEl.value,
                            sku: skuEl.value || `SKU-VAR-${Math.floor(1000 + Math.random() * 9000)}`,
                            price: Number(priceEl.value),
                            stock: Number(stockEl.value),
                            image: pImage || '',
                            status: 'Active' as const
                          };

                          setPVariants([...(pVariants || []), newVar]);
                          nameEl.value = '';
                          skuEl.value = '';
                          priceEl.value = '';
                          stockEl.value = '';
                        }}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xxs rounded py-2 transition-colors uppercase font-mono tracking-wider"
                      >
                        + Add Row
                      </button>
                    </div>
                  </div>

                  {/* Variants List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xxs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2">Variant Title / Name</th>
                          <th className="py-2">Variant SKU</th>
                          <th className="py-2">Price (INR)</th>
                          <th className="py-2">Available Stock</th>
                          <th className="py-2">Status</th>
                          <th className="py-2 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {!pVariants || pVariants.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-600 italic">No custom variants created. This product will sell as a single baseline item.</td>
                          </tr>
                        ) : (
                          pVariants.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-950/40 text-slate-300">
                              <td className="py-2.5 font-bold text-slate-200">{v.name}</td>
                              <td className="py-2.5 text-slate-400">{v.sku}</td>
                              <td className="py-2.5 text-emerald-400 font-bold">₹{v.price}</td>
                              <td className="py-2.5">{v.stock} units</td>
                              <td className="py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setPVariants(pVariants.filter(x => x.id !== v.id))}
                                  className="p-1 hover:bg-rose-500/10 rounded text-rose-400"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: LOGISTICS */}
              {pDrawerTab === 'delivery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in bg-slate-950/30 p-6 rounded-2xl border border-slate-850 text-slate-300">
                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-850 pb-2 text-amber-500">🚚 Fulfillment Details</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">Standard Shipping Time</label>
                      <select 
                        value={pDeliveryTime} 
                        onChange={(e) => setPDeliveryTime(e.target.value as any)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"
                      >
                        <option value="1 Day">1 Day Express Dispatch</option>
                        <option value="2 Days">2 Days Normal Dispatch</option>
                        <option value="3 Days">3 Days Standard Dispatch</option>
                        <option value="5 Days">5 Days Custom Print Timeline</option>
                        <option value="Custom">Custom Order Queue</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Weight (Grams / Kg)</label>
                        <input 
                          type="number" 
                          value={pShippingWeight} 
                          onChange={(e) => setPShippingWeight(Number(e.target.value))} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="e.g. 500" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-semibold">Barcode Value</label>
                        <input 
                          type="text" 
                          value={pBarcode} 
                          onChange={(e) => setPBarcode(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                          placeholder="e.g. 89012345678" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-850 pb-2 text-indigo-400">💰 Delivery Fees</h4>

                    <div className="flex items-center gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-850">
                      <input 
                        type="checkbox" 
                        id="enableShipping" 
                        checked={pEnableShipping} 
                        onChange={(e) => setPEnableShipping(e.target.checked)} 
                        className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer rounded" 
                      />
                      <label htmlFor="enableShipping" className="text-slate-300 font-bold cursor-pointer text-xxs select-none">
                        Enable Shipping / Delivery Charges for this product
                      </label>
                    </div>

                    {pEnableShipping && (
                      <div className="space-y-4 animate-fade-in pl-2 border-l border-slate-800">
                        <div className="flex items-center gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-850">
                          <input 
                            type="checkbox" 
                            id="freeShipping" 
                            checked={pFreeShipping} 
                            onChange={(e) => setPFreeShipping(e.target.checked)} 
                            className="h-4 w-4 bg-slate-950 accent-amber-400 cursor-pointer" 
                          />
                          <label htmlFor="freeShipping" className="text-slate-300 font-bold cursor-pointer text-xxs select-none">
                            Offer Free Shipping on this product
                          </label>
                        </div>

                        {!pFreeShipping && (
                          <div className="space-y-1.5 animate-fade-in">
                            <label className="text-slate-400 font-semibold">Custom Shipping Charge (INR) [If 0, uses global delivery charge]</label>
                            <input 
                              type="number" 
                              value={pShippingCharge} 
                              onChange={(e) => setPShippingCharge(Number(e.target.value))} 
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                              placeholder="e.g. 150" 
                            />
                            <p className="text-xxs text-slate-500">This flat rate will be added directly at checkout to the client's cart total. If 0, it falls back to the global/default delivery charge.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850/60 font-mono text-[10px] text-slate-400">
                      <p>🔹 Barcode generated automatically on save if left blank.</p>
                      <p>🔹 Barcode and shipping weights assist with automated logistics plugins (e.g. Shiprocket, Delhivery).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SEO */}
              {pDrawerTab === 'seo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in bg-slate-950/30 p-6 rounded-2xl border border-slate-850 text-slate-300">
                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-850 pb-2 text-amber-500">🔍 Google Search Snippet (SEO)</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold flex justify-between">
                        <span>Meta Title</span>
                        <span className="text-xxs text-slate-500">{pMetaTitle.length}/60 chars</span>
                      </label>
                      <input 
                        type="text" 
                        value={pMetaTitle} 
                        onChange={(e) => setPMetaTitle(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" 
                        placeholder="Google Search Heading..." 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold flex justify-between">
                        <span>Meta Description</span>
                        <span className="text-xxs text-slate-500">{pMetaDescription.length}/160 chars</span>
                      </label>
                      <textarea 
                        rows={3} 
                        value={pMetaDescription} 
                        onChange={(e) => setPMetaDescription(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none text-xxs" 
                        placeholder="Search snippet description that appears below search engines..."
                      ></textarea>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold">URL Slug (Permalinks)</label>
                      <input 
                        type="text" 
                        value={pSlug} 
                        onChange={(e) => setPSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))} 
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none font-mono" 
                        placeholder="e.g. custom-led-frame" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-850">
                    <span className="text-xxs text-slate-500 uppercase font-mono tracking-wider">Meta Preview Simulation</span>
                    <div className="space-y-1">
                      <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer block truncate font-sans">
                        {window.location.origin}/store/{pSlug || 'product-slug'}
                      </span>
                      <h4 className="text-sm text-sky-400 font-medium font-sans hover:underline cursor-pointer leading-tight">
                        {pMetaTitle || `${pTitle || 'Product Name'} | Shiv Studio`}
                      </h4>
                      <p className="text-slate-400 text-xxs leading-snug font-sans">
                        {pMetaDescription || 'Configure dynamic meta tags to make this printing press merchandise product highly discoverable on search engines.'}
                      </p>
                    </div>

                    {pQrCode && (
                      <div className="pt-4 border-t border-slate-850 flex items-center gap-3">
                        <img 
                          src={pQrCode} 
                          alt="Dynamic QR Code" 
                          className="h-16 w-16 bg-white p-1 rounded-lg" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] text-slate-300 block font-bold">Dynamic QR Code</span>
                          <p className="text-slate-500 text-[9px] leading-tight">Automatically generated scan-to-order QR code that points to this product page.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: LIVE INTERACTIVE PREVIEW */}
              {pDrawerTab === 'preview' && (
                <div className="animate-fade-in bg-slate-950/40 p-6 rounded-2xl border border-slate-850 space-y-6">
                  <span className="text-xxs text-slate-500 uppercase font-mono tracking-wider block">Live Interactive Layout Previews</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card grid preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-400">1. Shop Grid Card View</span>
                      <div className="max-w-xs bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between shadow-xl">
                        <div>
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950">
                            <img 
                              src={pImage || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400'} 
                              alt="Cover Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                              {pLabelFeatured && <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-extrabold text-[8px] rounded uppercase">★ Featured</span>}
                              {pLabelBestSeller && <span className="px-1.5 py-0.5 bg-indigo-500 text-white font-extrabold text-[8px] rounded uppercase">Best Seller</span>}
                              {pLabelTrending && <span className="px-1.5 py-0.5 bg-rose-500 text-white font-extrabold text-[8px] rounded uppercase">Trending</span>}
                            </div>
                            <span className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] text-slate-300 font-mono">
                              {pUnit || 'Piece'}
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10">
                              {pCategory}
                            </span>
                            <h4 className="font-bold text-white text-xs truncate mt-1">{pTitle || 'Awesome Product Spec'}</h4>
                            <p className="text-slate-400 text-[10px] line-clamp-1">{pShortDescription || 'No short description provided.'}</p>
                            
                            <div className="flex items-baseline gap-1.5 pt-1">
                              <span className="text-xs text-white font-extrabold font-mono">₹{(pPrice - pDiscountPrice).toLocaleString('en-IN')}</span>
                              {pDiscountPrice > 0 && <span className="text-slate-500 line-through text-[10px]">₹{pPrice}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specifications List Preview */}
                    <div className="space-y-4 text-slate-300">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">2. Customer Detail specifications</span>
                        <h4 className="text-sm font-extrabold text-white mt-1">{pTitle || 'Awesome Product Title'}</h4>
                        <p className="text-xxs text-slate-400 mt-1">{pDescription || 'No description provided.'}</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                        <span className="text-xxs font-bold text-slate-300 block font-mono uppercase tracking-wider">Specifications Checklist</span>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xxs font-mono text-slate-400">
                          {pSpecMaterial && <div><span className="text-slate-600">Material:</span> <span className="text-slate-300">{pSpecMaterial}</span></div>}
                          {pSpecSize && <div><span className="text-slate-600">Size:</span> <span className="text-slate-300">{pSpecSize}</span></div>}
                          {pSpecWeight && <div><span className="text-slate-600">Weight:</span> <span className="text-slate-300">{pSpecWeight}</span></div>}
                          {pSpecColor && <div><span className="text-slate-600">Color:</span> <span className="text-slate-300">{pSpecColor}</span></div>}
                          {pSpecFinish && <div><span className="text-slate-600">Finish:</span> <span className="text-slate-300">{pSpecFinish}</span></div>}
                          {pSpecWarranty && <div><span className="text-slate-600">Warranty:</span> <span className="text-slate-300">{pSpecWarranty}</span></div>}
                        </div>
                      </div>

                      {pVariants && pVariants.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xxs text-slate-500 font-mono">Available Custom Variants:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {pVariants.map(v => (
                              <span key={v.id} className="text-xxs bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-mono">
                                {v.name} (₹{v.price})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Spans full width */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-800 font-mono text-xxs uppercase tracking-wider font-extrabold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Auto Generated Final Price:</span>
                  <span className="text-sm font-bold text-amber-400">₹{(pPrice - pDiscountPrice).toLocaleString('en-IN')}</span>
                  {pDiscountPrice > 0 && (
                    <span className="text-xxs font-semibold text-emerald-400">({Math.round((pDiscountPrice / pPrice)*100)}% Discount)</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    type="button" 
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 sm:flex-none px-4 py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveProductAndAddAnother}
                    className="flex-1 sm:flex-none px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
                  >
                    Save & Add Another
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 sm:flex-none px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl transition-all shadow-lg"
                  >
                    Save Specifications
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full md:max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowServiceModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-500">
              {editingService ? 'Edit Catalog Service' : 'Add Studio Service'}
            </h3>
            <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Service Title</label>
                  <input type="text" required value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Wedding Photography Pack" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Service Type / Category</label>
                    <select value={sCategory} onChange={(e) => setSCategory(e.target.value as any)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="Photography">Photography</option>
                      <option value="Printing">Printing Press</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Standard Booking Advance Fee (INR)</label>
                    <input type="number" required value={sPrice} onChange={(e) => setSPrice(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Package Detailed Inclusions</label>
                  <textarea rows={5} required value={sDescription} onChange={(e) => setSDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Full-day drone, 3 cinematographers, luxury album included..."></textarea>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <ImageField
                  value={sImage}
                  onChange={setSImage}
                  storagePath="services"
                  label="Cover Image"
                  recommendedSize="Landscape (800x600)"
                />

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold text-xxs uppercase tracking-wider">GST Status for Service</span>
                    <div className="flex items-center gap-3 font-mono text-xxs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="sEnableGstRadio" 
                          checked={sEnableGst === true} 
                          onChange={() => setSEnableGst(true)} 
                          className="accent-amber-400" 
                        />
                        <span className="text-emerald-400 font-bold">☑ Enable GST</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="sEnableGstRadio" 
                          checked={sEnableGst === false} 
                          onChange={() => setSEnableGst(false)} 
                          className="accent-amber-400" 
                        />
                        <span className="text-slate-400 font-bold">☐ Disable GST</span>
                      </label>
                    </div>
                  </div>

                  {sEnableGst && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-semibold text-xxs">GST Slab %</label>
                        <select 
                          value={sGstPercent} 
                          onChange={(e) => setSGstPercent(Number(e.target.value))} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none text-xs"
                        >
                          <option value="0">0% (Exempt)</option>
                          <option value="5">5% (Utility)</option>
                          <option value="12">12% (Standard)</option>
                          <option value="18">18% (Services/Design)</option>
                          <option value="28">28% (Luxury)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-semibold text-xxs">GST Included in Price?</label>
                        <select 
                          value={sGstIncludedInPrice ? 'yes' : 'no'} 
                          onChange={(e) => setSGstIncludedInPrice(e.target.value === 'yes')} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none text-xs"
                        >
                          <option value="yes">Yes (Tax Inclusive)</option>
                          <option value="no">No (Tax Extra)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono">
                  Save Service Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full md:max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowGalleryModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-500">
              {editingGallery ? 'Modify Gallery Asset' : 'Upload Gallery Work'}
            </h3>
            <form onSubmit={handleSaveGallery} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Photo Label Title</label>
                  <input type="text" value={gTitle} onChange={(e) => setGTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Priyesh & Shreya Pre-wedding" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Album Category</label>
                    <select value={gCategory} onChange={(e) => setGCategory(e.target.value as any)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="Wedding">Wedding</option>
                      <option value="Pre Wedding">Pre Wedding</option>
                      <option value="Baby">Baby Portfolio</option>
                      <option value="Events">Official Events</option>
                      <option value="Birthday">Birthday shoots</option>
                      <option value="Drone">Drone cinematics</option>
                      <option value="Albums">Albums prints</option>
                      <option value="Videos">Cinematics teaser</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer py-3 text-slate-300">
                      <input type="checkbox" checked={gIsFeatured} onChange={(e) => setGIsFeatured(e.target.checked)} className="accent-amber-500 h-4 w-4" />
                      <span>Featured on Home Slider</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <ImageField
                  value={gImageUrl}
                  onChange={setGImageUrl}
                  storagePath="gallery"
                  label="Photo Image"
                  recommendedSize="1200x800 or portrait equivalents"
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono">
                  Publish Portfolio item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full md:max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowOfferModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-500">
              {editingOffer ? 'Edit Promotion Coupon' : 'Create Campaign Coupon'}
            </h3>
            <form onSubmit={handleSaveOffer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Coupon Title</label>
                    <input type="text" required value={oTitle} onChange={(e) => setOTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Diwali Offer" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Promo Code</label>
                    <input type="text" required value={oCode} onChange={(e) => setOCode(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="DIWALI50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Percentage Off</label>
                  <input type="number" required value={oDiscountPercent} onChange={(e) => setODiscountPercent(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Description / T&C</label>
                  <textarea rows={4} required value={oDescription} onChange={(e) => setODescription(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Valid on pre-wedding photo frames orders above 10,000"></textarea>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <ImageField
                  value={oImage}
                  onChange={setOImage}
                  storagePath="offers"
                  label="Illustration / Campaign Cover"
                  recommendedSize="Landscape (800x400)"
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono">
                  Save Coupon specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-500">
              {editingReview ? 'Respond to Testimonial' : 'Publish Direct Review testimonial'}
            </h3>
            <form onSubmit={handleSaveReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Client Name</label>
                  <input type="text" required value={rCustomerName} onChange={(e) => setRCustomerName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Vineet Kumar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Rating (1 to 5 Stars)</label>
                  <input type="number" min={1} max={5} required value={rRating} onChange={(e) => setRRating(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Client Feedback comment</label>
                <textarea rows={3} required value={rComment} onChange={(e) => setRComment(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none"></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Owner Response Reply (Persisted to Live Website)</label>
                <textarea rows={3} value={rReply} onChange={(e) => setRReply(e.target.value)} className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. Thank you Vineet for trusting Shiv Studio. We are happy you loved the wedding albums!"></textarea>
              </div>

              <button type="submit" className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono">
                Save Review and Response
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full md:max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowBlogModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-amber-500">
              {editingBlog ? 'Edit Blog Article' : 'Compose Blog Article'}
            </h3>
            <form onSubmit={handleSaveBlog} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Article Title</label>
                  <input type="text" required value={bTitle} onChange={(e) => setBTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="e.g. 10 Secrets of Outdoor Portraits" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Author Name</label>
                    <input type="text" required value={bAuthor} onChange={(e) => setBAuthor(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Category/Topic</label>
                    <select value={bCategory} onChange={(e) => setBCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="Photography Guide">Photography Guide</option>
                      <option value="Industrial Printing">Industrial Printing</option>
                      <option value="Studio News">Studio News</option>
                      <option value="Creative Techniques">Creative Techniques</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Short Summary / Excerpt</label>
                  <textarea rows={2.5} required value={bExcerpt} onChange={(e) => setBExcerpt(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="Write a short summary..."></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Detailed Article Content (Markdown Supported)</label>
                  <textarea rows={8} required value={bContent} onChange={(e) => setBContent(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none" placeholder="Write the complete article body here..."></textarea>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <ImageField
                  value={bImage}
                  onChange={setBImage}
                  storagePath="blog"
                  label="Article Hero Image"
                  recommendedSize="Landscape (1200x800)"
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono">
                  Publish Blog Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* Team Member Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white text-xs font-sans shadow-2xl">
            <button 
              type="button" 
              onClick={() => setShowTeamModal(false)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider font-mono mb-4">
              {editingTeamMemberIndex !== null ? '✏️ Edit Studio Team Member' : '➕ Add New Team Member'}
            </h3>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!teamMemberName.trim()) {
                  alert("Name is required");
                  return;
                }
                if (!teamMemberRole.trim()) {
                  alert("Role/Designation is required");
                  return;
                }
                const updatedTeam = [...(settings.team || [])];
                if (editingTeamMemberIndex !== null) {
                  // editing existing member
                  const existingMember = updatedTeam[editingTeamMemberIndex];
                  updatedTeam[editingTeamMemberIndex] = { 
                    ...existingMember, 
                    name: teamMemberName, 
                    role: teamMemberRole 
                  };
                } else {
                  // adding new member
                  const newMember = { 
                    id: `member_${Date.now()}`, 
                    name: teamMemberName, 
                    role: teamMemberRole, 
                    image: '' 
                  };
                  updatedTeam.push(newMember);
                }
                setSettings({ ...settings, team: updatedTeam });
                setShowTeamModal(false);
              }} 
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold font-mono text-xxs">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={teamMemberName} 
                  onChange={(e) => setTeamMemberName(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" 
                  placeholder="e.g. Ramesh Kumar" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold font-mono text-xxs">Role / Designation</label>
                <input 
                  type="text" 
                  required 
                  value={teamMemberRole} 
                  onChange={(e) => setTeamMemberRole(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-400/50" 
                  placeholder="e.g. Lead Cinematographer" 
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowTeamModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-center text-xs tracking-wider uppercase font-mono"
                >
                  {editingTeamMemberIndex !== null ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal (Detailed History Viewer) */}
      {showCustomerModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white text-xs font-sans max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowCustomerModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">✕</button>
            
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-amber-500 border-b border-slate-850 pb-2">
              Customer activity history: {selectedUser.fullName}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Client Email</p>
                <p className="text-white text-xs font-mono">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold uppercase text-[10px]">Contact Mobile</p>
                <p className="text-white text-xs">{selectedUser.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Order history */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white uppercase text-xxs tracking-wider font-mono">Store Product Orders</h4>
                <div className="border border-slate-850 rounded-2xl overflow-x-auto scrollbar-none">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-850">
                        <th className="p-2">Order ID</th>
                        <th className="p-2">Items</th>
                        <th className="p-2">Paid</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/50">
                      {orders.filter(o => o.customerId === selectedUser.uid).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-600 font-mono text-[10px]">No orders logged.</td>
                        </tr>
                      ) : (
                        orders
                          .filter(o => o.customerId === selectedUser.uid)
                          .map(o => (
                            <tr key={o.id} className="text-slate-300">
                              <td className="p-2 font-mono">#{o.id.slice(0, 6).toUpperCase()}</td>
                              <td className="p-2 max-w-[200px] truncate">{o.items.map(it => `${it.productTitle} (x${it.quantity})`).join(', ')}</td>
                              <td className="p-2 font-bold">₹{o.total}</td>
                              <td className="p-2 text-amber-500">{o.status}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Booking history */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white uppercase text-xxs tracking-wider font-mono">Shoot reservation sessions</h4>
                <div className="border border-slate-850 rounded-2xl overflow-x-auto scrollbar-none">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-850">
                        <th className="p-2">Booking ID</th>
                        <th className="p-2">Service Booked</th>
                        <th className="p-2">Date/Time</th>
                        <th className="p-2">Paid Adv</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/50">
                      {bookings.filter(b => b.customerId === selectedUser.uid).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-600 font-mono text-[10px]">No reservations booked.</td>
                        </tr>
                      ) : (
                        bookings
                          .filter(b => b.customerId === selectedUser.uid)
                          .map(b => (
                            <tr key={b.id} className="text-slate-300">
                              <td className="p-2 font-mono">#{b.id.slice(0, 6).toUpperCase()}</td>
                              <td className="p-2">{b.serviceTitle}</td>
                              <td className="p-2">{b.date} {b.time}</td>
                              <td className="p-2 font-bold">₹{b.advancePaid}</td>
                              <td className="p-2 text-indigo-400">{b.status}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAX INVOICE PREVIEW */}
      {selectedDoc && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentData={selectedDoc}
          type={selectedType}
        />
      )}

      {/* CUSTOM CONFIRMATION DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl relative">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500 mb-2">
              ⚠️ {confirmDialog.title || 'Are you sure?'}
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3 font-mono text-xxs font-bold">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
