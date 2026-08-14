export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  name?: string;
  phone: string;
  mobile?: string;
  role: UserRole;
  address?: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  duration?: number | string;
  fileSize?: number | string;
  category: 'products' | 'services' | 'gallery' | 'portfolio' | string;
  entityId?: string; // productId, serviceId, galleryId
  order?: number;
  uploadedBy?: string;
  status?: string;
  views?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: 'Photography' | 'Printing';
  description: string;
  price: number;
  image: string;
  gallery: string[];
  videos?: VideoItem[];
  enableGst?: boolean;
  gstPercent?: number;
  gstIncludedInPrice?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Wedding' | 'Pre Wedding' | 'Baby' | 'Events' | 'Birthday' | 'Drone' | 'Albums' | 'Videos';
  imageUrl: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaType?: 'photo' | 'video';
  isFeatured?: boolean;
}

export interface ProductImageItem {
  id?: string;
  productId: string;
  imageUrl: string;
  order: number;
  alt: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  category: string;
  price: number;
  discountPrice?: number;
  discount?: number;
  image: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  images?: string[];
  videos?: VideoItem[];
  stock: number;
  description: string;
  rating: number;
  reviewsCount: number;
  GST?: number;
  tags?: string[];

  // Professional E-commerce Fields
  userId?: string;
  sku?: string;
  barcode?: string;
  qrCode?: string;
  brand?: string;
  status?: 'Active' | 'Inactive';
  costPrice?: number;
  discountPercent?: number;
  gstPercent?: number;
  hsnCode?: string;
  finalPrice?: number;
  minStockAlert?: number;
  enableGst?: boolean;
  gstIncludedInPrice?: boolean;
  enableShipping?: boolean;
  unit?: 'Piece' | 'Pack' | 'Box' | 'Set';
  trackInventory?: boolean;
  shortDescription?: string;
  specifications?: {
    material?: string;
    size?: string;
    weight?: string;
    color?: string;
    finish?: string;
    warranty?: string;
    powerSource?: string;
    customFields?: { key: string; value: string }[];
  };
  variants?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    image: string;
    status: 'Active' | 'Inactive';
  }[];
  customization?: {
    customerPhotoRequired?: boolean;
    customerNamePrinting?: boolean;
    customText?: boolean;
    datePrinting?: boolean;
    uploadDesignFile?: boolean;
  };
  delivery?: {
    deliveryTime?: '1 Day' | '2 Days' | '3 Days' | '5 Days' | 'Custom';
    shippingWeight?: number;
    shippingCharge?: number;
    freeShipping?: boolean;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    urlSlug?: string;
  };
  labels?: {
    featured?: boolean;
    bestSeller?: boolean;
    trending?: boolean;
    newArrival?: boolean;
    hotDeal?: boolean;
    limitedStock?: boolean;
  };
}

export interface WeddingCardItem {
  id: string;
  title?: string;
  name?: string;
  category: string;
  price: number;
  discountPrice?: number;
  image?: string;
  mainImage?: string;
  images?: any;
  cardImages?: any;
  description: string;
  designCode?: string;
  minOrderQuantity?: number;
  paperType?: string;
  printingType?: string;
  size?: string;
  color?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  whatsappNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface CartItem {
  id: string;
  product: ProductItem;
  quantity: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  serviceId: string;
  serviceTitle: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  advancePaid: number;
  totalPrice: number;
  status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  photographerId?: string;
  photographerName?: string;
  createdAt: string;
  gstEnabled?: boolean;
  gstPercentage?: number;
  gstAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  paymentDate?: string;
  dueAmount?: number;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type ApplicableOnType = 'ALL' | 'CATEGORIES' | 'PRODUCTS' | 'PRINTING' | 'PHOTOGRAPHY';

export interface Coupon {
  id: string;
  name: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  applicableOn: ApplicableOnType;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  validFrom: string;
  validUntil: string;
  usageLimit: number; // Total limit, 0 = unlimited
  usageLimitPerCustomer: number; // Limit per customer, 0 = unlimited
  timesUsed: number;
  isActive: boolean;
  active?: boolean;
  firstOrderOnly: boolean;
  customerSpecificEmail?: string;
  autoApply?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  couponName: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  discountAmount: number;
  usedAt: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
  calculatedDiscount: number;
  applicableSubtotal: number;
}

export interface UploadedFileRecord {
  originalFileUrl: string;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  originalWidth?: number;
  originalHeight?: number;
  uploadedAt: string;
  uploadedBy?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  name?: string;
  url?: string;
}

export interface OrderMessage {
  id?: string;
  conversationId: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'customer';
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: {
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  uploadedFiles?: UploadedFileRecord[];
  customerRemark?: string;
  address: string;
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  discount: number;
  couponCode?: string;
  couponName?: string;
  discountAmount?: number;
  discountType?: DiscountType;
  discountValue?: number;
  originalPrice?: number;
  finalPrice?: number;
  paymentAmount?: number;
  status: 'Pending' | 'Accepted' | 'Designing' | 'Printing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentId?: string;
  createdAt: string;
  gstEnabled?: boolean;
  gstPercentage?: number;
  gstAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  paymentDate?: string;
  advancePaid?: number;
  dueAmount?: number;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Salary' | 'Electricity' | 'Equipment' | 'Printing Material' | 'Travel' | 'Maintenance' | 'Other';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Income {
  id: string;
  source: 'Booking' | 'Order' | 'Other';
  referenceId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  code: string;
  discountPercent: number;
  image: string;
}

export interface BlogItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Photography' | 'Printing' | 'News';
  image: string;
  author: string;
  date: string;
}

export interface ReviewItem {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  reply?: string;
  date: string;
}

export interface StudioSettings {
  studioName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  logoUrl?: string;
}

export type BannerDisplayPosition = 
  | 'homepage_top'
  | 'hero'
  | 'sticky_announcement'
  | 'product_store'
  | 'photography_services'
  | 'printing_services';

export interface OfferBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  backgroundVideoUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  couponCode?: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
  priority: number;
  autoHideAfterExpiry: boolean;
  showCountdown: boolean;
  displayPosition: BannerDisplayPosition;
  createdAt: string;
  updatedAt?: string;
}


