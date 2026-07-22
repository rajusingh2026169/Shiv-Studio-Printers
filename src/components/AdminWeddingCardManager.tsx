import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { WeddingCardItem } from '../types';
import { ImageField } from './ImageField';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Star, 
  Sparkles, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Eye, 
  Layers, 
  Tag, 
  Hash, 
  DollarSign, 
  Check, 
  Copy,
  MessageCircle,
  PackageCheck,
  FileText
} from 'lucide-react';

export const AdminWeddingCardManager: React.FC = () => {
  const [cards, setCards] = useState<WeddingCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<WeddingCardItem | null>(null);

  // Form Fields
  const [designCode, setDesignCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Royal Laser Cut');
  const [price, setPrice] = useState<number | ''>(50);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number | ''>(100);
  const [paperType, setPaperType] = useState('Metallic Board');
  const [printingType, setPrintingType] = useState('Foil Stamping');
  const [size, setSize] = useState('7x10 Inches');
  const [color, setColor] = useState('Red');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('+917905256355');

  // Images
  const [frontImage, setFrontImage] = useState('');
  const [insideImage, setInsideImage] = useState('');
  const [backImage, setBackImage] = useState('');

  // Image Lightbox Preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const cardsRef = collection(db, 'wedding_cards');
    const unsub = onSnapshot(cardsRef, (snapshot) => {
      const list: WeddingCardItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as WeddingCardItem);
      });
      // Sort by designCode or createdAt
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCards(list);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to wedding_cards in Admin:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenModal = (cardToEdit?: WeddingCardItem) => {
    if (cardToEdit) {
      setEditingCard(cardToEdit);
      setDesignCode(cardToEdit.designCode || '');
      setName(cardToEdit.name || '');
      setCategory(cardToEdit.category || 'Royal Laser Cut');
      setPrice(cardToEdit.price || 0);
      setMinOrderQuantity(cardToEdit.minOrderQuantity || 100);
      setPaperType(cardToEdit.paperType || '');
      setPrintingType(cardToEdit.printingType || '');
      setSize(cardToEdit.size || '');
      setColor(cardToEdit.color || 'Red');
      setDescription(cardToEdit.description || '');
      setIsAvailable(cardToEdit.isAvailable ?? true);
      setIsFeatured(cardToEdit.isFeatured ?? false);
      setWhatsappNumber(cardToEdit.whatsappNumber || '+917905256355');

      setFrontImage(cardToEdit.images?.front || cardToEdit.mainImage || '');
      setInsideImage(cardToEdit.images?.inside || '');
      setBackImage(cardToEdit.images?.back || '');
    } else {
      setEditingCard(null);
      setDesignCode(`WC-${Math.floor(10000 + Math.random() * 90000)}`);
      setName('');
      setCategory('Royal Laser Cut');
      setPrice(50);
      setMinOrderQuantity(100);
      setPaperType('350 GSM Velvet Metallic Board');
      setPrintingType('Foil Stamping & Embossing');
      setSize('7.5 x 10.5 Inches');
      setColor('Red');
      setDescription('');
      setIsAvailable(true);
      setIsFeatured(false);
      setWhatsappNumber('+917905256355');

      setFrontImage('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800');
      setInsideImage('https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800');
      setBackImage('https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800');
    }
    setShowModal(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesignCode = designCode.trim();
    if (!cleanDesignCode) {
      alert('Design Code is required.');
      return;
    }

    if (!name.trim()) {
      alert('Card Name is required.');
      return;
    }

    // Check duplicate design code if adding new
    const duplicate = cards.find(c => c.designCode.toLowerCase() === cleanDesignCode.toLowerCase() && c.id !== editingCard?.id);
    if (duplicate) {
      alert(`A wedding card with Design Code "${cleanDesignCode}" already exists. Please use a unique design code.`);
      return;
    }

    try {
      const cardId = editingCard ? editingCard.id : `wc_${cleanDesignCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      const mainImg = frontImage.trim() || insideImage.trim() || backImage.trim() || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800';

      const payload: WeddingCardItem = {
        id: cardId,
        designCode: cleanDesignCode,
        name: name.trim(),
        category: category.trim(),
        price: Number(price) || 0,
        minOrderQuantity: Number(minOrderQuantity) || 100,
        paperType: paperType.trim(),
        printingType: printingType.trim(),
        size: size.trim(),
        color: color.trim(),
        description: description.trim(),
        isAvailable,
        isFeatured,
        whatsappNumber: whatsappNumber.trim() || '+917905256355',
        mainImage: mainImg,
        images: {
          front: frontImage.trim() || mainImg,
          inside: insideImage.trim(),
          back: backImage.trim()
        },
        createdAt: editingCard ? editingCard.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'wedding_cards', cardId), payload);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving wedding card:', err);
      alert('Failed to save wedding card. Please try again.');
    }
  };

  const handleToggleAvailable = async (card: WeddingCardItem) => {
    try {
      await updateDoc(doc(db, 'wedding_cards', card.id), {
        isAvailable: !card.isAvailable,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handleToggleFeatured = async (card: WeddingCardItem) => {
    try {
      await updateDoc(doc(db, 'wedding_cards', card.id), {
        isFeatured: !card.isFeatured,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling featured status:', err);
    }
  };

  const handleDeleteCard = async (card: WeddingCardItem) => {
    if (window.confirm(`Are you sure you want to delete Wedding Card design code "${card.designCode}" (${card.name})?`)) {
      try {
        await deleteDoc(doc(db, 'wedding_cards', card.id));
      } catch (err) {
        console.error('Error deleting wedding card:', err);
        alert('Failed to delete wedding card.');
      }
    }
  };

  // Filtered list
  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.designCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.paperType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.color?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || card.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalCards = cards.length;
  const availableCards = cards.filter(c => c.isAvailable).length;
  const outOfStockCards = totalCards - availableCards;
  const featuredCards = cards.filter(c => c.isFeatured).length;

  const categories = ['ALL', 'Royal Laser Cut', 'Box Invitation', 'Single Sheet', 'Acrylic', 'Floral', 'Traditional', 'Multi-fold'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Wedding Card Collection Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your catalog of laser-cut cards, box invitations, acrylic designs, and traditional wedding stationery in real-time.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all text-sm shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add New Wedding Card</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="text-xxs text-slate-400 uppercase font-mono">Total Design Codes</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCards}</p>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="text-xxs text-emerald-400 uppercase font-mono">Available Designs</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{availableCards}</p>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="text-xxs text-rose-400 uppercase font-mono">Out of Stock</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{outOfStockCards}</p>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="text-xxs text-amber-400 uppercase font-mono">Featured Cards</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{featuredCards}</p>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Design Code (e.g. 15602), Name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xxs text-slate-400 font-mono uppercase shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xxs font-medium transition-all shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-amber-500 text-slate-950 font-bold' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wedding Cards List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading Wedding Cards from Firestore...</div>
      ) : filteredCards.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
          <p className="text-slate-300 font-semibold text-sm">No Wedding Cards match your criteria</p>
          <p className="text-slate-500 text-xs">Try clearing search filter or click "Add New Wedding Card".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div 
              key={card.id}
              className={`group bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-300 hover:border-amber-500/50 flex flex-col justify-between ${
                !card.isAvailable ? 'border-rose-900/30 opacity-75' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Image Header */}
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img 
                    src={card.mainImage || card.images?.front || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'} 
                    alt={card.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold font-mono text-xxs tracking-wider shadow-md">
                      CODE: {card.designCode}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFeatured(card)}
                        className={`p-1.5 rounded-md backdrop-blur-md transition-colors ${
                          card.isFeatured 
                            ? 'bg-amber-500/90 text-slate-950 font-bold' 
                            : 'bg-slate-950/80 text-slate-400 hover:text-amber-400'
                        }`}
                        title={card.isFeatured ? 'Featured on Website' : 'Click to Feature'}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>

                      <button
                        onClick={() => handleToggleAvailable(card)}
                        className={`px-2 py-1 rounded-md text-xxs font-bold backdrop-blur-md transition-colors ${
                          card.isAvailable 
                            ? 'bg-emerald-500/80 text-white' 
                            : 'bg-rose-500/80 text-white'
                        }`}
                        title="Toggle Stock Availability"
                      >
                        {card.isAvailable ? 'Available' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>

                  {/* Image View Lightbox Trigger */}
                  <button
                    onClick={() => setPreviewImage(card.mainImage || card.images?.front || '')}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 backdrop-blur-sm transition-all"
                    title="Zoom Front Cover"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xxs text-amber-400 font-mono uppercase font-semibold">{card.category}</span>
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1">{card.name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold text-amber-400">₹{card.price}</span>
                      <p className="text-xxs text-slate-400 font-mono">/ piece</p>
                    </div>
                  </div>

                  {/* Specs Pill List */}
                  <div className="grid grid-cols-2 gap-2 text-xxs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Paper:</span>
                      <span className="text-slate-200 font-semibold truncate block">{card.paperType || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Print:</span>
                      <span className="text-slate-200 font-semibold truncate block">{card.printingType || 'Foil/Screen'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Size:</span>
                      <span className="text-slate-200 block">{card.size || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Min Order (MOQ):</span>
                      <span className="text-amber-400 font-bold block">{card.minOrderQuantity || 100} pcs</span>
                    </div>
                  </div>

                  {card.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{card.description}</p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-1 text-xxs text-slate-500 font-mono">
                  <span>Color:</span>
                  <span className="text-slate-300 font-medium">{card.color || 'Multi'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(card)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Card"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white">
                  {editingCard ? `Edit Wedding Card (${editingCard.designCode})` : 'Add New Wedding Card'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Design Code * (Unique)</label>
                  <input
                    type="text"
                    required
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value)}
                    placeholder="e.g. 15602 or 115002"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Regal Gold Foil Laser Cut Invitation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Royal Laser Cut">Royal Laser Cut</option>
                    <option value="Box Invitation">Box Invitation</option>
                    <option value="Single Sheet">Single Sheet</option>
                    <option value="Acrylic">Acrylic</option>
                    <option value="Floral">Floral</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Multi-fold">Multi-fold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Price (₹ per card)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Min Order Qty (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minOrderQuantity}
                    onChange={(e) => setMinOrderQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Paper Type</label>
                  <input
                    type="text"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value)}
                    placeholder="e.g. 350 GSM Velvet Metallic Board"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Printing Type</label>
                  <input
                    type="text"
                    value={printingType}
                    onChange={(e) => setPrintingType(e.target.value)}
                    placeholder="e.g. Foil Stamping & Embossing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Dimensions / Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 7.5 x 10.5 Inches"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Primary Color</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Red">Red / Crimson</option>
                    <option value="Gold">Gold / Brass</option>
                    <option value="Cream">Cream / Ivory</option>
                    <option value="Blue">Royal Blue / Navy</option>
                    <option value="Pink">Pastel Pink / Rose</option>
                    <option value="Maroon">Maroon / Wine</option>
                    <option value="Green">Emerald Green</option>
                    <option value="White">White / Silver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">WhatsApp Order Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+917905256355"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Card Images Uploads */}
              <div className="space-y-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-xxs font-mono uppercase text-amber-400 font-bold">Card Images (Upload File or Enter URL)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ImageField
                    label="Front Cover Image"
                    value={frontImage}
                    onChange={(url) => setFrontImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                  <ImageField
                    label="Inside View Image"
                    value={insideImage}
                    onChange={(url) => setInsideImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                  <ImageField
                    label="Back View Image"
                    value={backImage}
                    onChange={(url) => setBackImage(url)}
                    storagePath="wedding_cards"
                    recommendedSize="800x600 px"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-mono uppercase text-slate-400 mb-1">Card Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe craftsmanship, insert details, ribbon accents, or custom die-cut work..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-300 font-medium">Available (In Stock)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="text-xs text-amber-400 font-medium">Featured Card</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  {editingCard ? 'Update Wedding Card' : 'Save Wedding Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-2">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white transition-all"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Zoom Preview" 
              className="w-full max-h-[85vh] object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
