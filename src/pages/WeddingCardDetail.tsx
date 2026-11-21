import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  CartItem,
  UploadedFileRecord,
  WeddingCardCustomization,
  WeddingCardItem
} from '../types';
import {
  buildWeddingCardCartItem,
  calculateWeddingCardPriceBreakdown,
  DEFAULT_CARD_COLORS,
  DEFAULT_CARD_FINISHES,
  getAllCardSampleImages,
  getCardPrimaryImage,
  getCardUnitPrice,
  getEffectiveCardMinQty,
  isDigitalWeddingCard
} from '../utils/weddingCardPricing';
import { uploadOriginalClientPhoto, formatBytes } from '../utils/clientPhotoUploader';
import { SEOHead } from '../components/SEOHead';
import {
  ArrowLeft,
  Sparkles,
  MessageCircle,
  FileText,
  CheckCircle2,
  XCircle,
  ZoomIn,
  X,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  Info,
  ChevronRight,
  ShoppingBag,
  Upload,
  Clock,
  Film,
  Languages,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface WeddingCardDetailProps {
  onAddWeddingCardToCart?: (cartItem: CartItem) => void;
}

export const WeddingCardDetail: React.FC<WeddingCardDetailProps> = ({
  onAddWeddingCardToCart
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<WeddingCardItem | null>(null);
  const [relatedCards, setRelatedCards] = useState<WeddingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Variant / Finish & Quantity state
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const [quantity, setQuantity] = useState<number>(100);

  // Customization Form Fields
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomFatherName, setGroomFatherName] = useState('');
  const [brideFatherName, setBrideFatherName] = useState('');
  const [groomMotherName, setGroomMotherName] = useState('');
  const [brideMotherName, setBrideMotherName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingTime, setWeddingTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [rsvpDetails, setRsvpDetails] = useState('');
  const [additionalFunctions, setAdditionalFunctions] = useState('');
  const [language, setLanguage] = useState<'Hindi' | 'English' | 'Both'>('Both');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Reference design/photo uploads
  const [referenceFiles, setReferenceFiles] = useState<UploadedFileRecord[]>([]);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  // Quote Request Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState<number>(100);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;
      setLoading(true);
      setAddedToCartSuccess(false);
      setSelectedImageIndex(0);
      try {
        const cardRef = doc(db, 'wedding_cards', id);
        const cardSnap = await getDoc(cardRef);

        let cardData: WeddingCardItem | null = null;
        if (cardSnap.exists()) {
          cardData = { id: cardSnap.id, ...cardSnap.data() } as WeddingCardItem;
        } else {
          const q = query(collection(db, 'wedding_cards'), where('designCode', '==', id), limit(1));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const first = qSnap.docs[0];
            cardData = { id: first.id, ...first.data() } as WeddingCardItem;
          }
        }

        if (cardData) {
          setCard(cardData);
          const moq = getEffectiveCardMinQty(cardData);
          setQuantity(moq);
          setQuoteQuantity(moq);

          const colors = cardData.availableColors?.length
            ? cardData.availableColors
            : cardData.color
              ? [cardData.color]
              : DEFAULT_CARD_COLORS.slice(0, 3);
          setSelectedColor(colors[0] || '');

          const finishes = cardData.availableFinishes?.length
            ? cardData.availableFinishes
            : cardData.printingType
              ? [cardData.printingType]
              : DEFAULT_CARD_FINISHES.slice(0, 3);
          setSelectedFinish(finishes[0] || '');

          // Fetch related cards
          const relQ = query(collection(db, 'wedding_cards'), limit(8));
          const relSnap = await getDocs(relQ);
          const relList: WeddingCardItem[] = [];
          relSnap.forEach((docSnap) => {
            if (docSnap.id !== cardData?.id) {
              relList.push({ id: docSnap.id, ...docSnap.data() } as WeddingCardItem);
            }
          });
          setRelatedCards(relList.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching wedding card detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent" />
          <p className="text-neutral-400 font-mono text-xs">Loading Wedding Card Atelier...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md bg-[#1A1A1A] border border-white/10 p-8 rounded-3xl">
          <Info className="h-10 w-10 text-[#D4AF37] mx-auto" />
          <h2 className="font-serif text-xl font-semibold text-white">Invitation Design Not Found</h2>
          <p className="text-neutral-400 text-xs">
            The design code or ID you requested is not available in our collection.
          </p>
          <Link
            to="/wedding-cards"
            className="inline-block px-5 py-2.5 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider"
          >
            Back to Wedding Cards
          </Link>
        </div>
      </div>
    );
  }

  const cardTitle = card.name || card.title || `Design #${card.designCode}`;
  const isDigital = isDigitalWeddingCard(card);
  const moq = getEffectiveCardMinQty(card);
  const gallerySlides = getAllCardSampleImages(card);
  const activeSlide = gallerySlides[selectedImageIndex] || gallerySlides[0];
  const breakdown = calculateWeddingCardPriceBreakdown(card, quantity);

  const colorList = card.availableColors?.length
    ? card.availableColors
    : card.color
      ? [card.color, 'Royal Gold', 'Ivory Cream'].filter((v, i, a) => a.indexOf(v) === i)
      : DEFAULT_CARD_COLORS.slice(0, 4);

  const finishList = card.availableFinishes?.length
    ? card.availableFinishes
    : card.printingType
      ? [card.printingType, 'Gold Foil Stamping', 'Matte Velvet Lamination'].filter((v, i, a) => a.indexOf(v) === i)
      : DEFAULT_CARD_FINISHES.slice(0, 3);

  const quickQuantities = isDigital
    ? [1]
    : Array.from<number>(
        new Set<number>(
          (card.quantityOptions && card.quantityOptions.length > 0
            ? card.quantityOptions
            : [moq, Math.max(moq, 100), Math.max(moq, 200), Math.max(moq, 300), Math.max(moq, 500), Math.max(moq, 1000)]
          ).filter((q) => q >= moq)
        )
      ).sort((a, b) => a - b);

  const handleCopyCode = () => {
    if (!card.designCode) return;
    navigator.clipboard.writeText(card.designCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleReferenceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingRef(true);
    setUploadProgress(5);
    setFormError('');

    try {
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        const record = await uploadOriginalClientPhoto(
          file,
          groomName || brideName || 'Wedding Client',
          (details) => setUploadProgress(details.progress)
        );
        setReferenceFiles((prev) => [...prev, record]);
      }
    } catch (err: any) {
      console.error('Reference upload error:', err);
      setFormError('Failed to upload reference file. Please try again.');
    } finally {
      setIsUploadingRef(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleAddCustomizedCardToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (card.isAvailable === false) {
      setFormError('This design is currently out of stock.');
      return;
    }

    if (!isDigital && quantity < moq) {
      setFormError(`Minimum order quantity for this design is ${moq} cards.`);
      setQuantity(moq);
      return;
    }

    if (isUploadingRef) {
      setFormError('Please wait for your reference file upload to complete.');
      return;
    }

    if (!groomName.trim() || !brideName.trim() || !weddingDate || !venueName.trim() || !venueAddress.trim()) {
      setFormError('Please fill Groom Name, Bride Name, Wedding Date, Venue Name, and Complete Venue Address.');
      return;
    }

    const customization: WeddingCardCustomization = {
      groomName: groomName.trim(),
      brideName: brideName.trim(),
      groomFatherName: groomFatherName.trim(),
      brideFatherName: brideFatherName.trim(),
      groomMotherName: groomMotherName.trim(),
      brideMotherName: brideMotherName.trim(),
      weddingDate,
      weddingTime: weddingTime.trim(),
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      rsvpDetails: rsvpDetails.trim(),
      additionalFunctions: additionalFunctions.trim(),
      language,
      specialInstructions: specialInstructions.trim(),
      selectedColor,
      selectedFinish,
      referenceFiles
    };

    const cartItem = buildWeddingCardCartItem(card, quantity, customization);
    if (onAddWeddingCardToCart) {
      onAddWeddingCardToCart(cartItem);
      setAddedToCartSuccess(true);
    } else {
      navigate('/cart');
    }
  };

  const handleWhatsAppOrder = () => {
    const targetPhone = card.whatsappNumber || '+917905256355';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi Shiv Studio & Printers!\nI want to order Wedding Card Code: *${card.designCode}*\nDesign: *${cardTitle}*\nColor: ${selectedColor}\nFinish: ${selectedFinish}\nQuantity: ${breakdown.quantity}${isDigital ? ' (Digital)' : ' pcs'}\nEstimated Total: ₹${breakdown.totalAmount.toLocaleString('en-IN')}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#111111] text-white min-h-screen pb-24 font-sans">
      <SEOHead
        title={`${cardTitle} (#${card.designCode}) — Wedding Cards | SHIV STUDIO`}
        description={`${cardTitle} (${card.category}) customized wedding invitation at ₹${getCardUnitPrice(card)}${isDigital ? '' : '/card'}. Order online with digital proof approval at SHIV STUDIO Khaga.`}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-[#161616] border-b border-white/10 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <Link
            to="/wedding-cards"
            className="flex items-center space-x-1.5 text-neutral-400 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Collection</span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 text-neutral-500">
            <span>Wedding Cards</span>
            <ChevronRight className="h-3 w-3" />
            <span>{card.category}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#D4AF37] font-bold">#{card.designCode}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Top Two-Column Product Overview + Live Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Multi-Sample Image & Video Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden aspect-[4/3] group shadow-2xl">
              {card.videoUrl && selectedImageIndex === 0 ? (
                <video
                  src={card.videoUrl}
                  poster={activeSlide?.url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeSlide?.url || getCardPrimaryImage(card)}
                  alt={cardTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                <span className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#111111] font-extrabold font-mono text-xs shadow-lg">
                  CODE: #{card.designCode}
                </span>
                {isDigital && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/80 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-[11px] uppercase flex items-center gap-1">
                    <Film className="h-3.5 w-3.5" />
                    <span>{card.digitalType || 'Digital Invite'}</span>
                  </span>
                )}
              </div>

              {(!card.videoUrl || selectedImageIndex !== 0) && (
                <button
                  type="button"
                  onClick={() => setIsZoomModalOpen(true)}
                  className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-[#111111]/85 text-[#D4AF37] border border-white/15 backdrop-blur-md text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-black transition-all"
                >
                  <ZoomIn className="h-4 w-4" />
                  <span>Zoom</span>
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3">
              {gallerySlides.map((slide, idx) => (
                <button
                  key={slide.url + idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[4/3] bg-[#1A1A1A] rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                    selectedImageIndex === idx
                      ? 'border-[#D4AF37]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.label}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/85 text-neutral-200 font-mono text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                    {slide.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Technical Specification Sheet */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl overflow-hidden text-xs font-mono">
              <div className="px-5 py-3.5 bg-[#141414] border-b border-white/10 flex items-center gap-2 text-[#D4AF37] font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Invitation Specifications</span>
              </div>
              <div className="divide-y divide-white/10">
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Product Code</span>
                  <span className="text-[#D4AF37] font-bold">#{card.designCode}</span>
                </div>
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Card Size</span>
                  <span className="text-white">{card.size || (isDigital ? 'Full HD 1080×1920' : '7.5 × 10.5 Inches')}</span>
                </div>
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Paper Quality</span>
                  <span className="text-white">{card.paperQuality || card.paperType || (isDigital ? 'High-Resolution Digital' : '350 GSM Velvet Metallic')}</span>
                </div>
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Printing Type</span>
                  <span className="text-white">{card.printingType || (isDigital ? 'Digital Render & Typography' : 'Gold Foil & Offset')}</span>
                </div>
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Customization</span>
                  <span className="text-emerald-400 font-semibold">
                    {card.customizationAvailable !== false ? 'Available (Full Text & Photo)' : 'Standard Format Only'}
                  </span>
                </div>
                <div className="grid grid-cols-2 px-5 py-3">
                  <span className="text-neutral-400">Est. Production Time</span>
                  <span className="text-white">{card.estimatedProductionTime || (isDigital ? '24–48 Hours After Approval' : '5–7 Days After Proof Approval')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Configuration, Live Price Breakdown & Purchase Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/25 uppercase">
                  {card.category}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-300 hover:text-white bg-[#1A1A1A] border border-white/10 px-2.5 py-1 rounded-md"
                >
                  <span>Code: #{card.designCode}</span>
                  {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
                {card.isAvailable !== false ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Available</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-xs">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Out of Stock</span>
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-snug">
                {cardTitle}
              </h1>

              <p className="text-sm text-neutral-300 leading-relaxed">
                {card.description ||
                  'Handcrafted luxury invitation design tailored with personalized family details, custom ceremony inserts, and digital proof approval prior to final print.'}
              </p>
            </div>

            {/* Color & Finish Variant Selectors */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Select Color Theme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorList.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedColor === col
                            ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37] font-bold'
                            : 'bg-[#111111] text-neutral-300 border-white/10 hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Select Finish / Print Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {finishList.map((fin) => (
                      <button
                        key={fin}
                        type="button"
                        onClick={() => setSelectedFinish(fin)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          selectedFinish === fin
                            ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37] font-bold'
                            : 'bg-[#111111] text-neutral-300 border-white/10 hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {fin}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantity Selection */}
              {!isDigital && (
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                      Select Number of Cards (Min: {moq} pcs)
                    </label>
                    <span className="text-xs font-mono text-[#D4AF37]">₹{breakdown.unitPrice} / card</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickQuantities.map((qVal) => (
                      <button
                        key={qVal}
                        type="button"
                        onClick={() => setQuantity(qVal)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all tabular-nums ${
                          quantity === qVal
                            ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37]'
                            : 'bg-[#111111] text-neutral-300 border-white/10 hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {qVal} pcs
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs text-neutral-400">Custom Qty:</label>
                    <input
                      type="number"
                      min={moq}
                      step={10}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(moq, Number(e.target.value) || moq))}
                      className="w-32 bg-[#111111] border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-[#D4AF37] tabular-nums"
                    />
                    <span className="text-xs text-neutral-400 font-mono">cards</span>
                  </div>
                </div>
              )}

              {/* Itemized Live Pricing Summary */}
              <div className="bg-[#111111] border border-[#D4AF37]/25 rounded-2xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-neutral-300">
                  <span>{isDigital ? 'Digital Package Price' : `Price Per Card (₹${breakdown.unitPrice} × ${breakdown.quantity})`}</span>
                  <span className="font-bold text-white tabular-nums">₹{breakdown.cardsSubtotal.toLocaleString('en-IN')}</span>
                </div>
                {!isDigital && (
                  <div className="flex justify-between text-neutral-300">
                    <span>Printing Charges</span>
                    <span className="text-white tabular-nums">
                      {breakdown.printingCharge > 0 ? `₹${breakdown.printingCharge.toLocaleString('en-IN')}` : 'Included'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-300">
                  <span>Customization &amp; Proofing Charges</span>
                  <span className="text-white tabular-nums">
                    {breakdown.customizationCharge > 0 ? `₹${breakdown.customizationCharge.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Shipping Charges</span>
                  <span className="text-emerald-400 tabular-nums">
                    {isDigital
                      ? 'FREE (Instant Digital Delivery)'
                      : breakdown.shippingCharge > 0
                        ? `₹${breakdown.shippingCharge.toLocaleString('en-IN')}`
                        : 'Calculated at Checkout'}
                  </span>
                </div>
                <div className="pt-2.5 mt-1 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#D4AF37]">Estimated Total Amount</span>
                  <span className="text-2xl font-extrabold text-[#D4AF37] tabular-nums">
                    ₹{breakdown.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Scroll CTA + Secondary Options */}
              <div className="space-y-2.5">
                <a
                  href="#customization-form"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Fill Wedding Details &amp; Add to Cart Below</span>
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#111111] hover:bg-white/10 border border-white/15 text-neutral-200 font-semibold text-xs transition-colors"
                  >
                    <FileText className="h-4 w-4 text-[#D4AF37]" />
                    <span>Request Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Help</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Highlights */}
            <div className="grid grid-cols-3 gap-3 text-[11px] font-mono text-neutral-300">
              <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>Proof Approved Before Print</span>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>{card.estimatedProductionTime || (isDigital ? '24-48h Delivery' : '5-7 Days')}</span>
              </div>
              <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>{isDigital ? 'HD File Download' : 'Pan-India Shipping'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Custom Wedding Card Form */}
        <section
          id="customization-form"
          className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6"
        >
          <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
                Step 2 • Personalization &amp; Family Wording
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white mt-1">
                Customize Your Invitation Details
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Submit accurate names, parents&apos; details, ceremony dates, and optional reference images. Our designer will prepare a digital proof for your approval before printing.
              </p>
            </div>
            <div className="bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono shrink-0">
              <span className="text-neutral-400 block text-[10px]">Selected Package Total</span>
              <span className="text-lg font-bold text-[#D4AF37] tabular-nums">
                ₹{breakdown.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {addedToCartSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Customized Invitation Added to Cart!
                  </h4>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {cardTitle} ({breakdown.quantity} {isDigital ? 'Digital Package' : 'pcs'}) for {groomName} &amp; {brideName} is ready for checkout.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  to="/cart"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-bold text-xs uppercase tracking-wider"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Proceed to Cart</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddCustomizedCardToCart} className="space-y-6">
            {/* Couple Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5">
                  Groom Name *
                </label>
                <input
                  type="text"
                  required
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="e.g. Chiranjivi Rohit Sharma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5">
                  Bride Name *
                </label>
                <input
                  type="text"
                  required
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="e.g. Ayushmati Anjali Verma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Parents' Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Groom Father&apos;s Name
                </label>
                <input
                  type="text"
                  value={groomFatherName}
                  onChange={(e) => setGroomFatherName(e.target.value)}
                  placeholder="Shri Ramesh Sharma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Groom Mother&apos;s Name
                </label>
                <input
                  type="text"
                  value={groomMotherName}
                  onChange={(e) => setGroomMotherName(e.target.value)}
                  placeholder="Smt. Sunita Sharma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Bride Father&apos;s Name
                </label>
                <input
                  type="text"
                  value={brideFatherName}
                  onChange={(e) => setBrideFatherName(e.target.value)}
                  placeholder="Shri Suresh Verma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Bride Mother&apos;s Name
                </label>
                <input
                  type="text"
                  value={brideMotherName}
                  onChange={(e) => setBrideMotherName(e.target.value)}
                  placeholder="Smt. Rekha Verma"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Event Timing & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5">
                  Wedding / Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Wedding Time / Muhurat
                </label>
                <input
                  type="text"
                  value={weddingTime}
                  onChange={(e) => setWeddingTime(e.target.value)}
                  placeholder="e.g. Barat 7:30 PM, Panigrahan 10:00 PM"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Card Language *</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'Hindi' | 'English' | 'Both')}
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-[#D4AF37] font-semibold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="English">English</option>
                  <option value="Both">Both (Hindi + English)</option>
                </select>
              </div>
            </div>

            {/* Venue & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Royal Heritage Lawn & Banquet"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-300 mb-1.5">
                  Complete Venue Address *
                </label>
                <input
                  type="text"
                  required
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="Full street, landmark, city, PIN code"
                  className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* RSVP, Additional Functions & Special Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                  Additional Functions (Haldi, Mehndi, Sangeet, Tilak, Reception)
                </label>
                <textarea
                  rows={3}
                  value={additionalFunctions}
                  onChange={(e) => setAdditionalFunctions(e.target.value)}
                  placeholder="List each ceremony name, date, time, and venue if different..."
                  className="w-full bg-[#111111] border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                    RSVP Details (Darshanabhilashi / Contact Numbers)
                  </label>
                  <input
                    type="text"
                    value={rsvpDetails}
                    onChange={(e) => setRsvpDetails(e.target.value)}
                    placeholder="e.g. Sharma Family, Khaga • +91 9876543210"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1.5">
                    Special Instructions / Religious Symbol Preference
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Ganesh ji emblem, Baal Manohar names, font preference..."
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Customer Reference Design / Couple Photo Uploader */}
            <div className="bg-[#111111] border border-dashed border-white/20 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <Upload className="h-4 w-4 text-[#D4AF37]" />
                    <span>Upload Reference Design, Monogram, or Couple Photos (Optional)</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Accepted formats: JPG, PNG, PDF, PSD, CDR — used directly by our designer while crafting your card proof.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs cursor-pointer transition-colors shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingRef ? `Uploading ${uploadProgress}%...` : 'Choose Files'}</span>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.psd,.ai,.cdr,.zip"
                    onChange={handleReferenceFileUpload}
                    disabled={isUploadingRef}
                    className="hidden"
                  />
                </label>
              </div>

              {referenceFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {referenceFiles.map((rf, rIdx) => (
                    <div
                      key={rf.originalFileName + rIdx}
                      className="flex items-center justify-between gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{rf.originalFileName}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {formatBytes(rf.originalFileSize)} • Ready
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReferenceFiles((prev) => prev.filter((_, i) => i !== rIdx))}
                        className="p-1 text-neutral-400 hover:text-rose-400"
                        title="Remove file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Customization to Cart */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="text-xs text-neutral-400 font-mono">
                <span>Color: <strong className="text-white">{selectedColor || 'Default'}</strong></span>
                <span className="mx-2">•</span>
                <span>Finish: <strong className="text-white">{selectedFinish || 'Standard'}</strong></span>
                <span className="mx-2">•</span>
                <span>Total: <strong className="text-[#D4AF37]">₹{breakdown.totalAmount.toLocaleString('en-IN')}</strong></span>
              </div>

              <button
                type="submit"
                disabled={isUploadingRef || card.isAvailable === false}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] disabled:opacity-50 text-[#111111] font-extrabold text-xs uppercase tracking-wider shadow-xl transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add Customized Invitation to Cart — ₹{breakdown.totalAmount.toLocaleString('en-IN')}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Related Cards */}
        {relatedCards.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-2xl font-semibold text-white">Similar Invitation Designs</h3>
              <Link to="/wedding-cards" className="text-xs font-mono text-[#D4AF37] hover:underline">
                View All Collection →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCards.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/wedding-cards/${rel.id}`}
                  className="group bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-lg transition-all p-3"
                >
                  <img
                    src={getCardPrimaryImage(rel)}
                    alt={rel.name || rel.title}
                    className="w-full aspect-[4/3] object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pt-3 space-y-1">
                    <span className="text-[11px] font-mono text-[#D4AF37] font-bold block">
                      #{rel.designCode}
                    </span>
                    <h4 className="font-serif text-sm font-semibold text-white truncate">
                      {rel.name || rel.title}
                    </h4>
                    <p className="text-xs text-[#D4AF37] font-bold font-mono tabular-nums">
                      ₹{getCardUnitPrice(rel)}{isDigitalWeddingCard(rel) ? ' Package' : ' / card'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-[#1A1A1A] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-3">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/80 text-neutral-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activeSlide?.url || getCardPrimaryImage(card)}
              alt={cardTitle}
              className="w-full max-h-[85vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-[#111111] border-b border-white/10 flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-[#111111] font-mono font-bold text-[11px]">
                  CODE: #{card.designCode}
                </span>
                <h3 className="font-serif text-lg font-semibold text-white mt-1">
                  Request Quote / Sample Consultation
                </h3>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="font-serif text-lg font-semibold text-white">Inquiry Received</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Our print coordinator will call you on <span className="text-[#D4AF37]">{quotePhone}</span> shortly.
                </p>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="px-6 py-2.5 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await addDoc(collection(db, 'inquiries'), {
                      type: 'Wedding Card Quote',
                      fullName: quoteName.trim(),
                      customerName: quoteName.trim(),
                      phone: quotePhone.trim(),
                      customerPhone: quotePhone.trim(),
                      designCode: card.designCode || '',
                      cardName: cardTitle,
                      cardPrice: getCardUnitPrice(card),
                      quantity: quoteQuantity,
                      message: `Quote Request for Card #${card.designCode} (${cardTitle}) — Qty: ${quoteQuantity}`,
                      status: 'New',
                      createdAt: new Date().toISOString()
                    });
                    setQuoteSubmitted(true);
                  } catch (err) {
                    console.error('Error submitting card quote:', err);
                  }
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={quotePhone}
                    onChange={(e) => setQuotePhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Card Quantity Needed
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="px-4 py-2 bg-white/10 text-neutral-200 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#E5C158]"
                  >
                    Submit Quote Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
