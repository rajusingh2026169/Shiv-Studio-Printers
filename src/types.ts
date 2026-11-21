export type UserRole =
  | 'admin'
  | 'customer'
  | 'Super Admin'
  | 'Admin'
  | 'Photographer'
  | 'Designer'
  | 'Printing Staff'
  | 'Customer';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  name?: string;
  phone: string;
  mobile?: string;
  role: UserRole;
  address?: string;
  avatarUrl?: string;
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
  entityId?: string;
  order?: number;
  uploadedBy?: string;
  status?: string;
  views?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  slug?: string;
  title: string;
  category: 'Photography' | 'Printing' | 'Videography' | 'Design' | string;
  description: string;
  shortDescription?: string;
  price: number;
  startingPrice?: number;
  image: string;
  coverImage?: string;
  gallery: string[];
  deliverables?: string[];
  videos?: VideoItem[];
  isPublished?: boolean;
  order?: number;
  enableGst?: boolean;
  gstPercent?: number;
  gstIncludedInPrice?: boolean;
}

export type PackageCategory =
  | 'Pre-Wedding'
  | 'Wedding'
  | 'Birthday'
  | 'Engagement & Ring Ceremony'
  | 'Event Photography'
  | 'Maternity & Baby Photography';

export interface PackageItem {
  id: string;
  name: string;
  category: PackageCategory | string;
  price: number;
  image: string;
  duration: string;
  editedPhotosCount: string;
  reelsCount: string;
  albumDetails: string;
  frameDetails: string;
  description: string;
  includedServices: string[];
  isPublished: boolean;
  isFeatured?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type GalleryCategory =
  | 'Wedding'
  | 'Pre-Wedding'
  | 'Pre Wedding'
  | 'Engagement'
  | 'Birthday'
  | 'Maternity'
  | 'Baby'
  | 'Events'
  | 'Cinematic Films'
  | 'Album Designs'
  | 'Drone'
  | 'Albums'
  | 'Videos';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory | string;
  imageUrl: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaType?: 'photo' | 'video';
  isFeatured?: boolean;
  altText?: string;
  createdAt?: string;
}

export interface ProductImageItem {
  id?: string;
  productId: string;
  imageUrl: string;
  order: number;
  alt: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  image?: string;
  status: 'Active' | 'Inactive';
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
  freeShipping?: boolean;
  shippingCharge?: number;
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
  enableVariants?: boolean;
  variants?: ProductVariant[];
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

export const WEDDING_CARD_CATEGORIES = [
  'Traditional Wedding Cards',
  'Royal Wedding Cards',
  'Premium Wedding Cards',
  'Luxury Box Invitations',
  'Designer Wedding Cards',
  'Minimalist Wedding Cards',
  'Engagement Invitation Cards',
  'Birthday Invitation Cards',
  'Anniversary Invitation Cards',
  'Digital Wedding Invitations',
  'Wedding Invitation Videos'
] as const;

export type WeddingCardCategory = (typeof WEDDING_CARD_CATEGORIES)[number];

export type DigitalInvitationType =
  | 'Static Wedding Invitation Images'
  | 'WhatsApp Wedding Invitation'
  | 'Animated Wedding Invitation'
  | 'Wedding Invitation Videos';

export type ProofStatus =
  | 'Awaiting Proof'
  | 'Proof Uploaded'
  | 'Revision Requested'
  | 'Approved';

export interface ProofVersion {
  version: number;
  proofUrl: string;
  fileType: 'image' | 'pdf' | 'video';
  fileName?: string;
  notes?: string;
  uploadedAt: string;
  status: 'Pending Review' | 'Revision Requested' | 'Approved';
  customerFeedback?: string;
  respondedAt?: string;
}

export interface WeddingCardCustomization {
  groomName: string;
  brideName: string;
  groomFatherName?: string;
  brideFatherName?: string;
  groomMotherName?: string;
  brideMotherName?: string;
  weddingDate: string;
  weddingTime?: string;
  venueName: string;
  venueAddress: string;
  rsvpDetails?: string;
  additionalFunctions?: string;
  language: 'Hindi' | 'English' | 'Both';
  specialInstructions?: string;
  selectedColor?: string;
  selectedFinish?: string;
  referenceFiles?: UploadedFileRecord[];
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
  images?: {
    front?: string;
    inside?: string;
    back?: string;
    [key: string]: any;
  };
  sampleImages?: string[];
  videoUrl?: string;
  cardImages?: any;
  description: string;
  designCode?: string;
  minOrderQuantity?: number;
  paperType?: string;
  paperQuality?: string;
  printingType?: string;
  size?: string;
  color?: string;
  availableColors?: string[];
  availableFinishes?: string[];
  customizationAvailable?: boolean;
  estimatedProductionTime?: string;
  printingCharge?: number;
  customizationCharge?: number;
  shippingCharge?: number;
  quantityOptions?: number[];
  isDigital?: boolean;
  digitalType?: DigitalInvitationType | string;
  enableGst?: boolean;
  gstPercent?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  whatsappNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: ProductItem;
  selectedVariantId?: string;
  selectedVariantName?: string;
  selectedVariantPrice?: number;
  quantity: number;
  itemType?: 'product' | 'wedding_card';
  weddingCardId?: string;
  designCode?: string;
  selectedColor?: string;
  selectedFinish?: string;
  printingCharge?: number;
  customizationCharge?: number;
  cardShippingCharge?: number;
  minOrderQuantity?: number;
  isDigital?: boolean;
  digitalType?: string;
  estimatedProductionTime?: string;
  weddingCardCustomization?: WeddingCardCustomization;
}

export type BookingStatus =
  | 'Pending'
  | 'Approved'
  | 'Completed'
  | 'Cancelled'
  | 'New'
  | 'Contacted'
  | 'Discussion'
  | 'Confirmed';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  whatsappNumber?: string;
  customerEmail: string;
  address: string;
  serviceId: string;
  serviceTitle: string;
  packageId?: string;
  packageName?: string;
  eventType?: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  advancePaid: number;
  totalPrice: number;
  status: BookingStatus;
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

export interface EnquiryItem {
  id: string;
  enquiryNumber?: string;
  fullName: string;
  name?: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  service?: string;
  packageName?: string;
  eventDate?: string;
  eventLocation?: string;
  subject?: string;
  message: string;
  status: 'New' | 'Contacted' | 'Discussion' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
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
  usageLimit: number;
  usageLimitPerCustomer: number;
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
    variantId?: string;
    variantName?: string;
    variantPrice?: number;
    price: number;
    quantity: number;
    image: string;
    itemType?: 'product' | 'wedding_card';
    designCode?: string;
    selectedColor?: string;
    selectedFinish?: string;
    printingCharge?: number;
    customizationCharge?: number;
    isDigital?: boolean;
    digitalType?: string;
    weddingCardCustomization?: WeddingCardCustomization;
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
  updatedAt?: string;
  gstEnabled?: boolean;
  gstPercentage?: number;
  gstAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  paymentDate?: string;
  advancePaid?: number;
  dueAmount?: number;
  orderType?: 'store' | 'wedding_card' | 'mixed';
  hasWeddingCards?: boolean;
  printingCharge?: number;
  customizationCharge?: number;
  weddingCardCustomization?: WeddingCardCustomization;
  proofStatus?: ProofStatus;
  proofVersions?: ProofVersion[];
  approvedProofUrl?: string;
  approvedAt?: string;
  revisionNotes?: string;
  digitalDeliverableUrl?: string;
  digitalDeliverableName?: string;
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
  serviceCategory?: string;
  reply?: string;
  isPublished?: boolean;
  date: string;
}

export interface InstagramPostItem {
  id: string;
  imageUrl: string;
  caption: string;
  postUrl?: string;
}

export interface StudioSettings {
  studioName: string;
  tagline?: string;
  creativeBrand?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  upiId?: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappNumber?: string;
  googleMapUrl?: string;
  googleBusinessUrl?: string;
  officeHours?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutEst?: string;
  aboutImageUrl?: string;
  footerText?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalDomain?: string;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  instagramGallery?: InstagramPostItem[];
  team?: { id?: string; name: string; role: string; image?: string }[];
  categoryImages?: Record<string, string>;
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
