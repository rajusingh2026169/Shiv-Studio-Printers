import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WeddingCardItem } from '../types';
import {
  ALL_WEDDING_CARD_CATEGORIES,
  getAllCardSampleImages,
  getCardPrimaryImage,
  getCardUnitPrice,
  getEffectiveCardMinQty,
  isDigitalWeddingCard
} from '../utils/weddingCardPricing';
import { SEOHead } from '../components/SEOHead';
import {
  Search,
  MessageCircle,
  FileText,
  X,
  ZoomIn,
  Layers,
  CheckCircle2,
  Sparkles,
  Clock,
  Film,
  ArrowRight
} from 'lucide-react';

export const WeddingCards: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [cards, setCards] = useState<WeddingCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const initialSearch = searchParams.get('code') || searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedFormat, setSelectedFormat] = useState<'ALL' | 'PRINT' | 'DIGITAL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedColor, setSelectedColor] = useState<string>('ALL');
  const [priceRange, setPriceRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'code'>('latest');

  // Lightbox & Zoom Modal
  const [activeLightboxCard, setActiveLightboxCard] = useState<WeddingCardItem | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(0);
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

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'wedding_cards'),
      (snapshot) => {
        const list: WeddingCardItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WeddingCardItem);
        });
        setCards(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching wedding cards:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) setSearchQuery(codeParam);
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
  }, [searchParams]);

  // Dynamic category list combining canonical 11 categories + any existing Firestore categories
  const existingExtraCategories = Array.from(
    new Set(
      cards
        .map((c) => c.category)
        .filter((cat): cat is string => Boolean(cat && !ALL_WEDDING_CARD_CATEGORIES.includes(cat as any)))
    )
  );
  const filterCategories = ['ALL', ...ALL_WEDDING_CARD_CATEGORIES, ...existingExtraCategories];

  const colorOptions = [
    'ALL',
    ...Array.from(
      new Set([
        'Red',
        'Maroon',
        'Gold',
        'Cream',
        'Ivory',
        'Blue',
        'Pink',
        'Green',
        ...cards.flatMap((c) => [c.color, ...(c.availableColors || [])]).filter((v): v is string => Boolean(v))
      ])
    ).slice(0, 12)
  ];

  const matchesCanonicalOrLegacyCategory = (cardCategory: string, filterCat: string) => {
    if (filterCat === 'ALL') return true;
    if (cardCategory === filterCat) return true;
    const c = (cardCategory || '').toLowerCase();
    const f = filterCat.toLowerCase();
    if (f === 'traditional wedding cards' && c === 'traditional') return true;
    if (f === 'royal wedding cards' && c.includes('royal')) return true;
    if (f === 'luxury box invitations' && c.includes('box')) return true;
    if (f === 'designer wedding cards' && (c.includes('acrylic') || c.includes('multi-fold'))) return true;
    if (f === 'minimalist wedding cards' && c.includes('single sheet')) return true;
    if (f === 'premium wedding cards' && c.includes('floral')) return true;
    return false;
  };

  // Filtering Logic
  const filteredCards = cards.filter((card) => {
    const queryLower = searchQuery.trim().toLowerCase();
    const cardName = card.name || card.title || '';
    const matchesSearch =
      !queryLower ||
      (card.designCode || '').toLowerCase().includes(queryLower) ||
      cardName.toLowerCase().includes(queryLower) ||
      (card.category || '').toLowerCase().includes(queryLower) ||
      (card.paperQuality || card.paperType || '').toLowerCase().includes(queryLower) ||
      (card.printingType || '').toLowerCase().includes(queryLower);

    const digital = isDigitalWeddingCard(card);
    const matchesFormat =
      selectedFormat === 'ALL' ||
      (selectedFormat === 'DIGITAL' && digital) ||
      (selectedFormat === 'PRINT' && !digital);

    const matchesCategory = matchesCanonicalOrLegacyCategory(card.category || '', selectedCategory);

    const cardColors = [card.color || '', ...(card.availableColors || [])]
      .join(' ')
      .toLowerCase();
    const matchesColor =
      selectedColor === 'ALL' || cardColors.includes(selectedColor.toLowerCase());

    const unitPrice = getCardUnitPrice(card);
    let matchesPrice = true;
    if (priceRange === 'under_40') matchesPrice = unitPrice < 40;
    else if (priceRange === '40_100') matchesPrice = unitPrice >= 40 && unitPrice <= 100;
    else if (priceRange === '100_300') matchesPrice = unitPrice > 100 && unitPrice <= 300;
    else if (priceRange === 'above_300') matchesPrice = unitPrice > 300;

    return matchesSearch && matchesFormat && matchesCategory && matchesColor && matchesPrice;
  });

  // Sorting
  const sortedCards = [...filteredCards].sort((a, b) => {
    const priceA = getCardUnitPrice(a);
    const priceB = getCardUnitPrice(b);
    if (sortBy === 'price_low') return priceA - priceB;
    if (sortBy === 'price_high') return priceB - priceA;
    if (sortBy === 'code')
      return (a.designCode || '').localeCompare(b.designCode || '', undefined, { numeric: true });
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const handleWhatsAppInquiry = (card: WeddingCardItem) => {
    const targetPhone = card.whatsappNumber || '+917905256355';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const digital = isDigitalWeddingCard(card);
    const unitPrice = getCardUnitPrice(card);
    const moq = getEffectiveCardMinQty(card);
    const text = encodeURIComponent(
      `Hi Shiv Studio & Printers!\nI am interested in Invitation Code: *${card.designCode}*\nDesign: *${card.name || card.title}*\nCategory: ${card.category}\nPrice: ₹${unitPrice}${digital ? ' (Digital Package)' : `/card (MOQ: ${moq} pcs)`}\n\nPlease share customization timeline and details.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleOpenQuoteModal = (card: WeddingCardItem) => {
    setQuoteCard(card);
    setQuoteQuantity(getEffectiveCardMinQty(card));
    setQuoteName('');
    setQuotePhone('');
    setQuoteDate('');
    setQuoteNotes('');
    setQuoteSubmitted(false);
  };

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
        designCode: quoteCard.designCode || '',
        cardName: quoteCard.name || quoteCard.title || '',
        cardPrice: getCardUnitPrice(quoteCard),
        customerName: quoteName.trim(),
        customerPhone: quotePhone.trim(),
        phone: quotePhone.trim(),
        quantity: quoteQuantity,
        eventDate: quoteDate,
        notes: quoteNotes.trim(),
        message: `Quote Request for Design #${quoteCard.designCode} (${quoteCard.name || quoteCard.title}) — Qty: ${quoteQuantity}`,
        status: 'New',
        createdAt: new Date().toISOString()
      });

      setQuoteSubmitted(true);
    } catch (err) {
      console.error('Error submitting quote:', err);
      alert('Failed to send quote request. Please try again.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const popularCodes = cards
    .slice(0, 8)
    .map((c) => c.designCode)
    .filter((code): code is string => Boolean(code));

  return (
    <div className="bg-[#111111] text-white min-h-screen pb-24 font-sans">
      <SEOHead
        title="Wedding Cards & Digital Invitations — SHIV STUDIO & Arvind Creation"
        description="Explore luxury box invitations, royal gold-foil wedding cards, engagement & anniversary invites, and bespoke wedding invitation videos by SHIV STUDIO Khaga."
      />

      {/* Editorial Hero Header */}
      <section className="relative bg-gradient-to-b from-[#1A1A1A] via-[#141414] to-[#111111] border-b border-white/10 pt-14 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-5">
          <p className="text-[11px] font-mono uppercase tracking-[0.26em] text-[#D4AF37]">
            Arvind Creation &amp; SHIV STUDIO • Bespoke Invitation Atelier
          </p>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight leading-tight">
            Wedding Cards &amp; Invitation Design
          </h1>

          <p className="max-w-2xl mx-auto text-neutral-400 text-sm sm:text-base leading-relaxed">
            Customize printed royal box invitations, traditional gold-foil cards, and animated digital invitations online with live pricing and digital proof approval before final print.
          </p>

          {/* Format Switcher: All / Printed Invitations / Digital Invitations */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: 'ALL', label: 'All Invitations' },
              { id: 'PRINT', label: 'Printed Stationery Cards' },
              { id: 'DIGITAL', label: 'Digital Invites & Videos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFormat(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                  selectedFormat === tab.id
                    ? 'bg-[#D4AF37] text-[#111111] border-[#D4AF37]'
                    : 'bg-[#1A1A1A] text-neutral-300 border-white/10 hover:border-[#D4AF37]/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input by Design Code or Card Name */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 focus-within:border-[#D4AF37] transition-all p-1.5 shadow-2xl">
              <Search className="h-5 w-5 text-[#D4AF37] ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Design Code (e.g. WC-15602), Card Name, Paper or Print Type..."
                className="w-full bg-transparent border-0 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-neutral-400 hover:text-white mr-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider shrink-0 transition-colors"
              >
                Search
              </button>
            </div>

            {popularCodes.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] font-mono">
                <span className="text-neutral-500 uppercase">Design Codes:</span>
                {popularCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => setSearchQuery(code)}
                    className={`px-2.5 py-1 rounded-md border transition-all ${
                      searchQuery === code
                        ? 'bg-[#D4AF37] text-[#111111] font-bold border-[#D4AF37]'
                        : 'bg-[#1A1A1A] text-[#D4AF37] border-white/10 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    #{code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Category & Facet Filter Panel */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 lg:pb-0">
              <span className="text-[11px] font-mono text-neutral-400 uppercase shrink-0 flex items-center gap-1.5 mr-1">
                <Layers className="h-3.5 w-3.5 text-[#D4AF37]" />
                Category:
              </span>
              {filterCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#D4AF37] text-[#111111] font-semibold border-[#D4AF37]'
                      : 'bg-[#111111] text-neutral-300 hover:text-white border-white/10 hover:border-[#D4AF37]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <span className="text-[11px] font-mono text-neutral-400 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#111111] border border-white/15 text-xs text-[#D4AF37] font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="code">Design Code</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-mono text-neutral-400 uppercase shrink-0">Color Tone:</span>
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase transition-all border ${
                    selectedColor === c
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50 font-bold'
                      : 'bg-[#111111] text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400 uppercase">Price Range:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-[#111111] border border-white/15 text-xs text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="ALL">All Prices</option>
                <option value="under_40">Under ₹40 / card</option>
                <option value="40_100">₹40 - ₹100 / card</option>
                <option value="100_300">₹100 - ₹300</option>
                <option value="above_300">Above ₹300 (Box / Digital)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Meta */}
        <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
          <div>
            Showing <span className="text-[#D4AF37] font-bold tabular-nums">{sortedCards.length}</span> invitation designs
            {searchQuery && (
              <span>
                {' '}matching "<span className="text-white">{searchQuery}</span>"
              </span>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'ALL' || selectedColor !== 'ALL' || priceRange !== 'ALL' || selectedFormat !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFormat('ALL');
                setSelectedCategory('ALL');
                setSelectedColor('ALL');
                setPriceRange('ALL');
              }}
              className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Product Gallery Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent" />
            <p className="text-neutral-400 text-xs font-mono">Loading Invitation Collection...</p>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="py-20 text-center bg-[#1A1A1A] rounded-3xl border border-white/10 p-8 space-y-4 max-w-lg mx-auto">
            <Search className="h-10 w-10 text-[#D4AF37] mx-auto" />
            <h3 className="text-lg font-serif font-semibold text-white">No Matching Designs Found</h3>
            <p className="text-neutral-400 text-xs leading-relaxed">
              No cards matched your current search or filter selection. Reset filters to view all printed cards and digital wedding invitations.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFormat('ALL');
                setSelectedCategory('ALL');
                setSelectedColor('ALL');
                setPriceRange('ALL');
              }}
              className="px-5 py-2.5 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#E5C158] transition-colors"
            >
              Show All Invitations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {sortedCards.map((card) => {
              const cardTitle = card.name || card.title || `Design #${card.designCode}`;
              const unitPrice = getCardUnitPrice(card);
              const digital = isDigitalWeddingCard(card);
              const moq = getEffectiveCardMinQty(card);
              const primaryImage = getCardPrimaryImage(card);
              const productionTime = card.estimatedProductionTime || (digital ? '24-48 Hours' : '5-7 Business Days');

              return (
                <div
                  key={card.id}
                  className="group bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Preview Imagery */}
                    <div className="relative aspect-[4/3] bg-[#111111] overflow-hidden">
                      <Link to={`/wedding-cards/${card.id}`} className="block w-full h-full">
                        <img
                          src={primaryImage}
                          alt={cardTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </Link>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/30" />

                      {/* Top Metadata */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-md bg-[#D4AF37] text-[#111111] font-extrabold font-mono text-[11px] tracking-wider shadow">
                          #{card.designCode || card.id.slice(0, 6).toUpperCase()}
                        </span>

                        {digital ? (
                          <span className="px-2.5 py-1 rounded-md bg-black/80 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                            {card.videoUrl ? <Film className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            <span>Digital Invite</span>
                          </span>
                        ) : card.isFeatured ? (
                          <span className="px-2.5 py-1 rounded-md bg-black/80 border border-white/20 text-white font-mono text-[10px] uppercase tracking-wider">
                            Signature Design
                          </span>
                        ) : null}
                      </div>

                      {/* Zoom Preview Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLightboxCard(card);
                          setActiveLightboxIndex(0);
                          setIsZoomed(false);
                        }}
                        className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-[#111111]/85 text-neutral-200 hover:text-[#D4AF37] border border-white/15 backdrop-blur-md transition-all flex items-center gap-1 text-[11px] font-mono"
                      >
                        <ZoomIn className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Gallery</span>
                      </button>
                    </div>

                    {/* Details Section */}
                    <div className="p-5 space-y-3.5">
                      <div>
                        <p className="text-[11px] text-[#D4AF37] font-mono uppercase tracking-wider">
                          {card.category}
                        </p>
                        <Link to={`/wedding-cards/${card.id}`}>
                          <h3 className="font-serif text-lg font-semibold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1 mt-0.5">
                            {cardTitle}
                          </h3>
                        </Link>
                      </div>

                      {/* Pricing & MOQ Panel */}
                      <div className="flex justify-between items-baseline bg-[#111111] px-3.5 py-3 rounded-xl border border-white/10">
                        <div>
                          <span className="text-[10px] text-neutral-400 font-mono uppercase block">
                            {digital ? 'Complete Package' : 'Price Per Card'}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-[#D4AF37] tabular-nums">
                              ₹{unitPrice.toLocaleString('en-IN')}
                            </span>
                            {!digital && <span className="text-xs text-neutral-400">/ card</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-mono uppercase block">
                            {digital ? 'Format' : 'Min Order (MOQ)'}
                          </span>
                          <span className="text-xs text-white font-semibold font-mono tabular-nums">
                            {digital ? (card.digitalType || 'HD Digital') : `${moq} pcs`}
                          </span>
                        </div>
                      </div>

                      {/* Specs List */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-neutral-400 font-mono">
                        <p className="truncate">
                          <span className="text-neutral-500">Size:</span>{' '}
                          <span className="text-neutral-200">{card.size || (digital ? '1080x1920 Portrait' : '7x10 Inches')}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-neutral-500">Paper:</span>{' '}
                          <span className="text-neutral-200">{card.paperQuality || card.paperType || (digital ? 'Digital Asset' : '350 GSM Ivory')}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-neutral-500">Print:</span>{' '}
                          <span className="text-neutral-200">{card.printingType || (digital ? 'Full HD / MP4' : 'Gold Foil')}</span>
                        </p>
                        <p className="truncate flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#D4AF37] shrink-0" />
                          <span className="text-neutral-200 truncate">{productionTime}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary E-Commerce Actions */}
                  <div className="p-4 bg-[#141414] border-t border-white/10 space-y-2.5">
                    <Link
                      to={`/wedding-cards/${card.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      <span>Customize &amp; Order</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenQuoteModal(card)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1A1A1A] hover:bg-white/10 border border-white/10 text-neutral-200 font-semibold text-xs transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Get Quote</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(card)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multi-Angle Lightbox Modal */}
      {activeLightboxCard && (() => {
        const gallery = getAllCardSampleImages(activeLightboxCard);
        const currentSlide = gallery[activeLightboxIndex] || gallery[0];
        const lightboxTitle = activeLightboxCard.name || activeLightboxCard.title || 'Invitation Preview';

        return (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-[#1A1A1A] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              <div className="p-4 sm:p-5 bg-[#111111] border-b border-white/10 flex justify-between items-center">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-[#D4AF37] text-[#111111] font-mono font-bold text-[11px]">
                    CODE: #{activeLightboxCard.designCode}
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-white mt-1">{lightboxTitle}</h3>
                </div>
                <button
                  onClick={() => {
                    setActiveLightboxCard(null);
                    setIsZoomed(false);
                  }}
                  className="p-2 rounded-xl bg-white/5 text-neutral-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sample Angles Switcher */}
              <div className="bg-[#141414] px-5 py-2.5 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs font-mono">
                <span className="text-neutral-500 shrink-0">Samples:</span>
                {gallery.map((g, idx) => (
                  <button
                    key={g.url + idx}
                    onClick={() => {
                      setActiveLightboxIndex(idx);
                      setIsZoomed(false);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
                      activeLightboxIndex === idx
                        ? 'bg-[#D4AF37] text-[#111111] font-bold'
                        : 'bg-[#111111] text-neutral-300 border border-white/10 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {/* Main Preview */}
              <div className="relative flex-grow bg-[#111111] flex items-center justify-center p-4 overflow-hidden min-h-[340px]">
                {activeLightboxCard.videoUrl && activeLightboxIndex === 0 ? (
                  <video
                    src={activeLightboxCard.videoUrl}
                    poster={currentSlide?.url}
                    controls
                    className="max-h-[58vh] w-full max-w-2xl rounded-xl border border-white/10"
                  />
                ) : (
                  <img
                    src={currentSlide?.url}
                    alt={lightboxTitle}
                    onClick={() => setIsZoomed(!isZoomed)}
                    className={`max-h-[58vh] object-contain rounded-xl transition-transform duration-300 cursor-zoom-in ${
                      isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div className="p-4 bg-[#111111] border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs font-mono text-neutral-300">
                  <span className="text-[#D4AF37] font-bold">
                    ₹{getCardUnitPrice(activeLightboxCard).toLocaleString('en-IN')}
                    {isDigitalWeddingCard(activeLightboxCard) ? ' Package' : ' / card'}
                  </span>
                  {!isDigitalWeddingCard(activeLightboxCard) && (
                    <span className="ml-3 text-neutral-400">
                      MOQ: {getEffectiveCardMinQty(activeLightboxCard)} pcs
                    </span>
                  )}
                </div>

                <Link
                  to={`/wedding-cards/${activeLightboxCard.id}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] font-bold text-xs uppercase tracking-wider"
                >
                  <span>Customize &amp; Order</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Request Written Quote Modal */}
      {quoteCard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 bg-[#111111] border-b border-white/10 flex justify-between items-center">
              <div>
                <span className="px-2 py-0.5 rounded bg-[#D4AF37] text-[#111111] font-mono font-bold text-[11px]">
                  CODE: #{quoteCard.designCode}
                </span>
                <h3 className="font-serif text-lg font-semibold text-white mt-1">
                  Request Quote / Custom Printing
                </h3>
              </div>
              <button
                onClick={() => setQuoteCard(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h4 className="font-serif text-xl font-semibold text-white">Quote Request Submitted</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Our design &amp; print specialist will reach out to you shortly regarding Design Code{' '}
                  <span className="text-[#D4AF37] font-mono">#{quoteCard.designCode}</span>.
                </p>
                <button
                  onClick={() => setQuoteCard(null)}
                  className="px-6 py-2.5 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#E5C158]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
                <div className="p-3 bg-[#111111] rounded-xl border border-white/10 flex items-center gap-3 text-xs">
                  <img
                    src={getCardPrimaryImage(quoteCard)}
                    alt={quoteCard.name || quoteCard.title}
                    className="h-12 w-12 object-cover rounded-lg shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-semibold text-white leading-tight">{quoteCard.name || quoteCard.title}</p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      ₹{getCardUnitPrice(quoteCard)} {isDigitalWeddingCard(quoteCard) ? 'Package' : `/ piece • MOQ: ${getEffectiveCardMinQty(quoteCard)} pcs`}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="Enter your full name"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quoteQuantity}
                      onChange={(e) => setQuoteQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Custom Requirements / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="E.g. Need 3 inserts for Tilak, Haldi, Barat & Reception..."
                    className="w-full bg-[#111111] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setQuoteCard(null)}
                    className="px-4 py-2 bg-white/10 text-neutral-200 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingQuote}
                    className="px-6 py-2 bg-[#D4AF37] text-[#111111] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#E5C158] disabled:opacity-50"
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
