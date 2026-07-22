import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WeddingCardItem } from '../types';
import { 
  Search, 
  Filter, 
  Sparkles, 
  MessageCircle, 
  Eye, 
  FileText, 
  X, 
  Check, 
  Copy, 
  ArrowRight, 
  ChevronRight, 
  Share2, 
  SlidersHorizontal,
  ZoomIn,
  Tag,
  Layers,
  Phone,
  Calendar,
  User,
  ShoppingBag,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const WeddingCards: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cards, setCards] = useState<WeddingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const initialSearch = searchParams.get('code') || searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedColor, setSelectedColor] = useState<string>('ALL');
  const [priceRange, setPriceRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'code'>('latest');

  // Quick Design Code Shortcuts
  const sampleCodes = ['15602', '115002', '112402', '18002', '114002', '113002', '17002', '117002', '122002', '110002', '19002'];

  // Lightbox & Zoom Modal
  const [activeLightboxCard, setActiveLightboxCard] = useState<WeddingCardItem | null>(null);
  const [selectedImageTab, setSelectedImageTab] = useState<'front' | 'inside' | 'back'>('front');
  const [isZoomed, setIsZoomed] = useState(false);

  // Request Quote Modal
  const [quoteCard, setQuoteCard] = useState<WeddingCardItem | null>(null);
  const [quoteName, setQuoteName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState<number>(100);
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Studio Settings for WhatsApp
  const [studioPhone, setStudioPhone] = useState('+917905256355');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wedding_cards'), (snapshot) => {
      const list: WeddingCardItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as WeddingCardItem);
      });
      setCards(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching wedding cards:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Sync URL search params
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setSearchQuery(codeParam);
    }
  }, [searchParams]);

  // Categories & Colors
  const categories = ['ALL', 'Royal Laser Cut', 'Box Invitation', 'Single Sheet', 'Acrylic', 'Floral', 'Traditional', 'Multi-fold'];
  const colors = ['ALL', 'Red', 'Gold', 'Cream', 'Blue', 'Pink', 'Maroon', 'Green'];

  // Filtering Logic
  const filteredCards = cards.filter((card) => {
    // Search query matches Design Code (exact or partial) or Card Name or Paper Type
    const queryLower = searchQuery.trim().toLowerCase();
    const matchesSearch = !queryLower || 
      card.designCode?.toLowerCase().includes(queryLower) ||
      card.name?.toLowerCase().includes(queryLower) ||
      card.paperType?.toLowerCase().includes(queryLower) ||
      card.printingType?.toLowerCase().includes(queryLower);

    const matchesCategory = selectedCategory === 'ALL' || card.category === selectedCategory;
    const matchesColor = selectedColor === 'ALL' || card.color?.toLowerCase() === selectedColor.toLowerCase();

    let matchesPrice = true;
    if (priceRange === 'under_30') matchesPrice = card.price < 30;
    else if (priceRange === '30_60') matchesPrice = card.price >= 30 && card.price <= 60;
    else if (priceRange === '60_120') matchesPrice = card.price > 60 && card.price <= 120;
    else if (priceRange === 'above_120') matchesPrice = card.price > 120;

    return matchesSearch && matchesCategory && matchesColor && matchesPrice;
  });

  // Sorting
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'code') return a.designCode.localeCompare(b.designCode, undefined, { numeric: true });
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Open WhatsApp Order / Inquiry
  const handleWhatsAppInquiry = (card: WeddingCardItem) => {
    const targetPhone = card.whatsappNumber || studioPhone || '+917905256355';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi Shiv Studio & Printers!\nI am interested in Wedding Card Design Code: *${card.designCode}*\nCard Name: *${card.name}*\nPrice: ₹${card.price}/card\nMinimum Quantity: ${card.minOrderQuantity} pcs\nCategory: ${card.category}\n\nPlease share availability, print sample details, and total quotation.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Submit Request Quote
  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteCard) return;

    if (!quoteName.trim() || !quotePhone.trim()) {
      alert('Please enter your Name and Mobile Number.');
      return;
    }

    setSubmittingQuote(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        type: 'Wedding Card Quote',
        designCode: quoteCard.designCode,
        cardName: quoteCard.name,
        cardPrice: quoteCard.price,
        customerName: quoteName.trim(),
        customerPhone: quotePhone.trim(),
        quantity: quoteQuantity,
        eventDate: quoteDate,
        notes: quoteNotes.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      setQuoteSubmitted(true);
      setSubmittingQuote(false);
    } catch (err) {
      console.error('Error submitting quote:', err);
      setSubmittingQuote(false);
      alert('Failed to send quote request. Please try again.');
    }
  };

  const handleOpenQuoteModal = (card: WeddingCardItem) => {
    setQuoteCard(card);
    setQuoteQuantity(card.minOrderQuantity || 100);
    setQuoteName('');
    setQuotePhone('');
    setQuoteDate('');
    setQuoteNotes('');
    setQuoteSubmitted(false);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pb-20 font-sans">
      
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Exquisite Wedding Invitations & Cards</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Wedding Card Collection
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Discover royal laser-cut cards, velvet box invitations, acrylic designs, and classic gold foil invitation sets. Direct order or inquire using design codes.
          </p>

          {/* Direct Search Bar by Design Code */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-900 border-2 border-amber-500/30 focus-within:border-amber-500 transition-all p-1.5">
              <Search className="h-5 w-5 text-amber-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Design Code (e.g. 15602, 115002) or Card Style..."
                className="w-full bg-transparent border-0 px-3 py-2 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-white mr-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {}}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shrink-0 transition-colors shadow-lg"
              >
                Search Card
              </button>
            </div>

            {/* Design Code Quick Shortcut Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xxs font-mono">
              <span className="text-slate-500 uppercase">Popular Design Codes:</span>
              {sampleCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => setSearchQuery(code)}
                  className={`px-2.5 py-1 rounded-md border transition-all ${
                    searchQuery === code
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                      : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  #{code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Filters and Controls Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4">
            
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
              <span className="text-xxs font-mono text-slate-400 uppercase shrink-0 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <span className="text-xxs font-mono text-slate-400 uppercase">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-amber-400 font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="code">Design Code</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters: Color & Price */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            
            {/* Color Filter */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xxs font-mono text-slate-400 uppercase shrink-0">Color Tone:</span>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`px-2.5 py-1 rounded-md text-xxs font-mono uppercase transition-all ${
                    selectedColor === c
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xxs font-mono text-slate-400 uppercase">Price Range:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Prices</option>
                <option value="under_30">Under ₹30 / card</option>
                <option value="30_60">₹30 - ₹60 / card</option>
                <option value="60_120">₹60 - ₹120 / card</option>
                <option value="above_120">Above ₹120 / card</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter & Active Filters Tag */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <div>
            Showing <span className="text-amber-400 font-bold">{sortedCards.length}</span> wedding card designs
            {searchQuery && <span> matching "<span className="text-white">{searchQuery}</span>"</span>}
          </div>

          {(searchQuery || selectedCategory !== 'ALL' || selectedColor !== 'ALL' || priceRange !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedColor('ALL');
                setPriceRange('ALL');
              }}
              className="text-xxs text-amber-400 hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Wedding Cards Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
            <p className="text-slate-400 text-xs font-mono">Loading Wedding Card Collection...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-4 max-w-lg mx-auto">
            <Search className="h-10 w-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Wedding Cards Found</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              We couldn't find any design matching your search or filters. Try searching for code <span className="text-amber-400 font-mono">#15602</span> or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedColor('ALL');
                setPriceRange('ALL');
              }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-600 transition-colors"
            >
              Show All Designs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCards.map((card) => (
              <div 
                key={card.id}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Display */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={card.mainImage || card.images?.front || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Top Design Code Tag & Status */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-extrabold font-mono text-xxs tracking-wider shadow-lg">
                        CODE: {card.designCode}
                      </span>

                      {card.isFeatured && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/90 text-white font-bold text-xxs tracking-wider uppercase font-mono">
                          FEATURED
                        </span>
                      )}
                    </div>

                    {/* Quick Lightbox / Preview Trigger */}
                    <button
                      onClick={() => {
                        setActiveLightboxCard(card);
                        setSelectedImageTab('front');
                      }}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-md transition-all shadow-lg flex items-center space-x-1 text-xxs font-mono"
                    >
                      <ZoomIn className="h-3.5 w-3.5 text-amber-400" />
                      <span>Zoom</span>
                    </button>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xxs text-amber-400 font-mono font-semibold uppercase">{card.category}</span>
                        <Link to={`/wedding-cards/${card.id}`}>
                          <h3 className="font-bold text-white text-base leading-snug hover:text-amber-400 transition-colors line-clamp-1">
                            {card.name}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    {/* Price and MOQ */}
                    <div className="flex justify-between items-baseline bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-xxs text-slate-500 font-mono block">Price per piece:</span>
                        <span className="text-xl font-extrabold text-amber-400">₹{card.price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xxs text-slate-500 font-mono block">Min Order (MOQ):</span>
                        <span className="text-xs text-slate-200 font-bold font-mono">{card.minOrderQuantity || 100} pcs</span>
                      </div>
                    </div>

                    {/* Specifications List */}
                    <div className="space-y-1 text-xxs text-slate-400 font-mono">
                      <p className="truncate"><span className="text-slate-500">Paper:</span> {card.paperType || 'Velvet Metallic'}</p>
                      <p className="truncate"><span className="text-slate-500">Print:</span> {card.printingType || 'Foil Stamping'}</p>
                      <p className="truncate"><span className="text-slate-500">Size:</span> {card.size || '7x10 Inches'}</p>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/wedding-cards/${card.id}`}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>Details</span>
                    </Link>

                    <button
                      onClick={() => handleOpenQuoteModal(card)}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Get Quote</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleWhatsAppInquiry(card)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/10"
                  >
                    <MessageCircle className="h-4 w-4 fill-current" />
                    <span>WhatsApp Inquiry (#{card.designCode})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal with Zoom Capabilities */}
      {activeLightboxCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-mono font-bold text-xxs">
                  CODE: {activeLightboxCard.designCode}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{activeLightboxCard.name}</h3>
              </div>
              <button
                onClick={() => {
                  setActiveLightboxCard(null);
                  setIsZoomed(false);
                }}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* View Tabs: Front, Inside, Back */}
            <div className="bg-slate-950/60 px-6 py-2 border-b border-slate-800 flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500 mr-2">Angles:</span>
              <button
                onClick={() => setSelectedImageTab('front')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedImageTab === 'front' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Front Cover
              </button>
              {activeLightboxCard.images?.inside && (
                <button
                  onClick={() => setSelectedImageTab('inside')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    selectedImageTab === 'inside' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Inside View
                </button>
              )}
              {activeLightboxCard.images?.back && (
                <button
                  onClick={() => setSelectedImageTab('back')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    selectedImageTab === 'back' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Back Cover
                </button>
              )}
            </div>

            {/* Image Preview Canvas with Zoom Toggle */}
            <div className="relative flex-grow bg-slate-950 flex items-center justify-center p-4 overflow-hidden min-h-[350px]">
              <img
                src={
                  selectedImageTab === 'inside' 
                    ? (activeLightboxCard.images?.inside || activeLightboxCard.mainImage)
                    : selectedImageTab === 'back'
                    ? (activeLightboxCard.images?.back || activeLightboxCard.mainImage)
                    : (activeLightboxCard.images?.front || activeLightboxCard.mainImage)
                }
                alt={activeLightboxCard.name}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`max-h-[60vh] object-contain rounded-xl transition-all duration-300 cursor-zoom-in ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />

              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-slate-900/80 text-amber-400 border border-slate-800 text-xs font-mono flex items-center space-x-1 backdrop-blur-md"
              >
                <ZoomIn className="h-4 w-4" />
                <span>{isZoomed ? 'Reset Zoom' : 'Click to Zoom'}</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs text-slate-400 font-mono">
                <span className="text-amber-400 font-bold">₹{activeLightboxCard.price}/piece</span>
                <span className="mx-2">|</span>
                <span>MOQ: {activeLightboxCard.minOrderQuantity} pcs</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => handleWhatsAppInquiry(activeLightboxCard)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>Order on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Quote Modal */}
      {quoteCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-bold text-xxs">
                  CODE: {quoteCard.designCode}
                </span>
                <h3 className="text-base font-bold text-white mt-1">Request Quote / Custom Printing</h3>
              </div>
              <button
                onClick={() => setQuoteCard(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Quote Request Submitted!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thank you! Our design printing manager will call you back within 2 hours with customized rate charts and sample proofs for Design Code <span className="text-amber-400 font-mono">#{quoteCard.designCode}</span>.
                </p>
                <button
                  onClick={() => setQuoteCard(null)}
                  className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-600"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
                  <img src={quoteCard.mainImage} alt={quoteCard.name} className="h-12 w-12 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-white leading-tight">{quoteCard.name}</p>
                    <p className="text-xxs font-mono text-slate-400 mt-0.5">₹{quoteCard.price} / piece | Min MOQ: {quoteCard.minOrderQuantity} pcs</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Enter your name"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Estimated Quantity (Cards)</label>
                    <input
                      type="number"
                      min="10"
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Ceremony / Wedding Date</label>
                    <input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Custom Notes / Insert Requirements</label>
                  <textarea
                    rows={2}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="E.g. Need 3 insert pages for Tilak, Sangeet, Shaadi..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuoteCard(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuote}
                    className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-600 disabled:opacity-50"
                  >
                    {submittingQuote ? 'Submitting...' : 'Send Quote Request'}
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
