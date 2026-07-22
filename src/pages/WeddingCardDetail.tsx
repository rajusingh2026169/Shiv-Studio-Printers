import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { WeddingCardItem } from '../types';
import { 
  ArrowLeft, 
  Sparkles, 
  MessageCircle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ZoomIn, 
  X, 
  Layers, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  Info,
  ChevronRight
} from 'lucide-react';

export const WeddingCardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [card, setCard] = useState<WeddingCardItem | null>(null);
  const [relatedCards, setRelatedCards] = useState<WeddingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [selectedImageKey, setSelectedImageKey] = useState<'front' | 'inside' | 'back'>('front');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Quote Request Modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState<number>(100);
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Try direct doc ID
        const cardRef = doc(db, 'wedding_cards', id);
        const cardSnap = await getDoc(cardRef);

        let cardData: WeddingCardItem | null = null;
        if (cardSnap.exists()) {
          cardData = { id: cardSnap.id, ...cardSnap.data() } as WeddingCardItem;
        } else {
          // Fallback search by designCode
          const q = query(collection(db, 'wedding_cards'), where('designCode', '==', id), limit(1));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const first = qSnap.docs[0];
            cardData = { id: first.id, ...first.data() } as WeddingCardItem;
          }
        }

        if (cardData) {
          setCard(cardData);
          setQuoteQuantity(cardData.minOrderQuantity || 100);

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
      <div className="bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
          <p className="text-slate-400 font-mono text-xs">Loading Wedding Card Details...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <Info className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Wedding Card Design Not Found</h2>
          <p className="text-slate-400 text-xs">The design code or ID you requested does not exist in our collection.</p>
          <Link to="/wedding-cards" className="inline-block px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
            Back to Wedding Cards
          </Link>
        </div>
      </div>
    );
  }

  // Active image URL
  const activeImageUrl = 
    selectedImageKey === 'inside' && card.images?.inside
      ? card.images.inside
      : selectedImageKey === 'back' && card.images?.back
      ? card.images.back
      : (card.images?.front || card.mainImage);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(card.designCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleWhatsAppOrder = () => {
    const targetPhone = card.whatsappNumber || '+917905256355';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi Shiv Studio & Printers!\nI would like to order Wedding Card Design Code: *${card.designCode}*\nCard Name: *${card.name}*\nPrice: ₹${card.price}/card\nMinimum Quantity: ${card.minOrderQuantity} pcs\nPaper Type: ${card.paperType}\nPrinting Type: ${card.printingType}\n\nPlease share order booking details and draft printing timelines.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const totalEstimate = card.price * (quoteQuantity || card.minOrderQuantity || 100);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pb-20 font-sans">
      
      {/* Breadcrumb Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <Link to="/wedding-cards" className="flex items-center space-x-1.5 text-slate-400 hover:text-amber-400 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Collection</span>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 text-slate-500">
            <span>Wedding Cards</span>
            <ChevronRight className="h-3 w-3" />
            <span>{card.category}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-amber-400 font-bold">#{card.designCode}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* Main Product Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Active Image Box */}
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-[4/3] group shadow-2xl">
              <img
                src={activeImageUrl}
                alt={card.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />

              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold font-mono text-xs shadow-lg">
                  CODE: {card.designCode}
                </span>
                {card.isFeatured && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold font-mono text-xxs uppercase">
                    FEATURED
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsZoomModalOpen(true)}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-slate-900/80 text-amber-400 border border-slate-800 backdrop-blur-md text-xs font-mono font-bold flex items-center space-x-1.5 hover:bg-slate-800 transition-all shadow-xl"
              >
                <ZoomIn className="h-4 w-4" />
                <span>Zoom Image</span>
              </button>
            </div>

            {/* Thumbnail Switcher (Front, Inside, Back) */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedImageKey('front')}
                className={`relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all p-1 ${
                  selectedImageKey === 'front' ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img src={card.images?.front || card.mainImage} alt="Front View" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-300 font-mono text-xxs px-2 py-0.5 rounded">Front</span>
              </button>

              {card.images?.inside ? (
                <button
                  onClick={() => setSelectedImageKey('inside')}
                  className={`relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all p-1 ${
                    selectedImageKey === 'inside' ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={card.images.inside} alt="Inside View" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-300 font-mono text-xxs px-2 py-0.5 rounded">Inside</span>
                </button>
              ) : null}

              {card.images?.back ? (
                <button
                  onClick={() => setSelectedImageKey('back')}
                  className={`relative aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all p-1 ${
                    selectedImageKey === 'back' ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={card.images.back} alt="Back View" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-300 font-mono text-xxs px-2 py-0.5 rounded">Back</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Right Column: Product Details & Order Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xxs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 uppercase">
                  {card.category}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center space-x-1 text-xxs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md transition-all"
                >
                  <span>Code: #{card.designCode}</span>
                  {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                {card.name}
              </h1>

              <div className="flex items-center space-x-2 text-xs">
                {card.isAvailable ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold font-mono">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>In Stock & Ready for Printing</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold font-mono">
                    <XCircle className="h-4 w-4" />
                    <span>Currently Out of Stock</span>
                  </span>
                )}
              </div>
            </div>

            {/* Pricing Box & Quantity Estimator */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xxs font-mono uppercase text-slate-400 block">Unit Price</span>
                  <span className="text-3xl font-black text-amber-400">₹{card.price}</span>
                  <span className="text-xs text-slate-400 font-mono"> / card</span>
                </div>
                <div className="text-right">
                  <span className="text-xxs font-mono uppercase text-slate-400 block">Minimum Order (MOQ)</span>
                  <span className="text-base font-bold text-white font-mono">{card.minOrderQuantity || 100} pieces</span>
                </div>
              </div>

              {/* Live Calculator */}
              <div className="space-y-2">
                <label className="block text-xxs font-mono uppercase text-slate-400">Calculate Quantity Total:</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min={card.minOrderQuantity || 10}
                    step="10"
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">cards</span>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400">Estimated Job Total:</span>
                  <span className="text-lg font-bold text-emerald-400">₹{totalEstimate.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-emerald-600/15"
                >
                  <MessageCircle className="h-5 w-5 fill-current" />
                  <span>Order Directly via WhatsApp</span>
                </button>

                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Request Written Quote / Printing Proof</span>
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-3 text-xxs font-mono text-slate-300">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center space-x-2.5">
                <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
                <span>100% Certified Premium Paperboard</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center space-x-2.5">
                <Truck className="h-5 w-5 text-amber-400 shrink-0" />
                <span>Express Pan-India Safe Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications & Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4 border-t border-slate-900">
          
          {/* Specifications Table */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Technical Specifications</span>
            </h3>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
              <div className="grid grid-cols-2 p-3 bg-slate-950/80 border-b border-slate-800">
                <span className="text-slate-400">Design Code</span>
                <span className="text-amber-400 font-bold">#{card.designCode}</span>
              </div>
              <div className="grid grid-cols-2 p-3 border-b border-slate-800/80">
                <span className="text-slate-400">Category Style</span>
                <span className="text-white font-medium">{card.category}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-950/80 border-b border-slate-800/80">
                <span className="text-slate-400">Paper Type & Board</span>
                <span className="text-white font-medium">{card.paperType || 'Velvet Metallic Board'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 border-b border-slate-800/80">
                <span className="text-slate-400">Printing Technology</span>
                <span className="text-white font-medium">{card.printingType || 'Hot Foil Stamping & Screen Print'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-950/80 border-b border-slate-800/80">
                <span className="text-slate-400">Dimensions / Size</span>
                <span className="text-white font-medium">{card.size || '7 x 10 Inches'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 border-b border-slate-800/80">
                <span className="text-slate-400">Primary Color Tone</span>
                <span className="text-white font-medium">{card.color || 'Multi'}</span>
              </div>
              <div className="grid grid-cols-2 p-3 bg-slate-950/80">
                <span className="text-slate-400">Minimum Order Quantity</span>
                <span className="text-amber-400 font-bold">{card.minOrderQuantity || 100} pieces</span>
              </div>
            </div>
          </div>

          {/* Detailed Craftsmanship Description */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Craftsmanship & Design Notes</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 leading-relaxed space-y-3">
              <p>{card.description || 'Intricately designed wedding card featuring luxury finish, matching envelope sets, and high-definition typography for an unforgettable invitation experience.'}</p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xxs text-slate-400 space-y-1">
                <p className="text-amber-400 font-bold font-mono uppercase">Includes in standard package:</p>
                <p>• Main outer jacket / folder with die-cut lock</p>
                <p>• 2 or 3 function insert leaves (Tilak, Sangeet, Shaadi)</p>
                <p>• Premium envelope with matching return address foil</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Cards Grid */}
        {relatedCards.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-slate-900">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Similar Wedding Card Designs</h3>
              <Link to="/wedding-cards" className="text-xs font-mono text-amber-400 hover:underline">
                View All Collection →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedCards.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/wedding-cards/${rel.id}`}
                  className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all p-3"
                >
                  <img
                    src={rel.mainImage || rel.images?.front || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'}
                    alt={rel.name}
                    className="w-full aspect-[4/3] object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pt-3 space-y-1">
                    <span className="text-xxs font-mono text-amber-400 font-bold block">CODE: #{rel.designCode}</span>
                    <h4 className="text-xs font-bold text-white truncate">{rel.name}</h4>
                    <p className="text-xs text-amber-400 font-extrabold font-mono">₹{rel.price} / card</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activeImageUrl}
              alt={card.name}
              className="w-full max-h-[85vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-xxs">
                  CODE: {card.designCode}
                </span>
                <h3 className="text-base font-bold text-white mt-1">Request Quote / Custom Printing Proof</h3>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Inquiry Received!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thank you! Our master print estimator will contact you on <span className="text-amber-400">{quotePhone}</span> shortly.
                </p>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-600"
                >
                  Done
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuoteSubmitted(true);
                }} 
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Mobile / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={quotePhone}
                    onChange={(e) => setQuotePhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Quantity Needed</label>
                  <input
                    type="number"
                    min="10"
                    value={quoteQuantity}
                    onChange={(e) => setQuoteQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-600"
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
