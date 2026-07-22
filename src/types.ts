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

export interface ServiceItem {
  id: string;
  title: string;
  category: 'Photography' | 'Printing';
  description: string;
  price: number;
  image: string;
  gallery: string[];
  enableGst?: boolean;
  gstPercent?: number;
  gstIncludedInPrice?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Wedding' | 'Pre Wedding' | 'Baby' | 'Events' | 'Birthday' | 'Drone' | 'Albums' | 'Videos';
  imageUrl: string;
  isFeatured?: boolean;
}

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  discountPrice?: number;
  image: string;
  images: string[];
  stock: number;
  description: string;
  rating: number;
  reviewsCount: number;

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
  uploadedFiles?: { name: string; url: string }[];
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

export interface WeddingCardItem {
  id: string;
  designCode: string; // Unique design code e.g. 15602, 115002
  name: string;
  category: string; // e.g. Royal Laser Cut, Box Invitation, Single Sheet, Acrylic, Floral, Traditional
  price: number;
  minOrderQuantity: number; // e.g. 100
  paperType: string; // e.g. Metallic Board, Velvet Board, Handmade Paper, Acrylic, Glossy, Matt
  printingType: string; // e.g. Foil Printing, Screen Printing, UV Emboss, Digital
  size: string; // e.g. 7x10 inch
  description: string;
  isAvailable: boolean; // Available / Out of Stock
  isFeatured?: boolean;
  color?: string; // e.g. Red, Gold, Cream, Blue, Pink, Maroon, Green
  images: {
    front?: string;
    inside?: string;
    back?: string;
    additional?: string[];
  };
  mainImage: string; // Quick cover image URL
  whatsappNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

