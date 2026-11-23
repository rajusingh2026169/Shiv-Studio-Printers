import React, { useState, useEffect } from 'react';
import { STUDIO_IMAGES } from '../assets/studioAssets';
import { StudioImage } from './StudioMedia';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  Tag, 
  Layers, 
  Search, 
  Filter, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Video, 
  X, 
  Gift,
  ArrowRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { OfferBanner, BannerDisplayPosition } from '../types';
import { 
  getAllOfferBanners, 
  saveOfferBanner, 
  deleteOfferBanner, 
  toggleBannerActive,
  isBannerCurrentlyValid 
} from '../utils/bannerService';
import { ImageField } from './ImageField';
import { VideoUploader } from './VideoUploader';

export const AdminOfferBannerManager: React.FC = () => {
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<OfferBanner> | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<OfferBanner | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllOfferBanners();
      setBanners(data);
    } catch (err) {
      console.error('Error loading offer banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Format to local ISO datetime-local string YYYY-MM-DDTHH:mm
    const formatForInput = (d: Date) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setEditingBanner({
      title: 'Monsoon Special Discount',
      subtitle: 'LIMITED TIME OFFER',
      description: 'Get up to 30% flat discount on all premium wedding photography and printing services!',
      desktopImageUrl: STUDIO_IMAGES.heroWedding,
      mobileImageUrl: STUDIO_IMAGES.heroWedding,
      backgroundVideoUrl: '',
      buttonText: 'Claim Discount',
      buttonLink: '/store',
      couponCode: 'MONSOON30',
      validFrom: formatForInput(now),
      validUntil: formatForInput(nextWeek),
      active: true,
      priority: 10,
      autoHideAfterExpiry: true,
      showCountdown: true,
      displayPosition: 'homepage_top'
    });
    setShowEditModal(true);
  };

  const handleOpenEdit = (banner: OfferBanner) => {
    const formatForInput = (isoStr: string) => {
      try {
        const d = new Date(isoStr);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      } catch {
        return isoStr;
      }
    };

    setEditingBanner({
      ...banner,
      validFrom: formatForInput(banner.validFrom),
      validUntil: formatForInput(banner.validUntil)
    });
    setShowEditModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title || !editingBanner.desktopImageUrl) {
      alert('Please fill out the required banner title and desktop image.');
      return;
    }

    setSaving(true);
    try {
      const validFromIso = editingBanner.validFrom && !isNaN(new Date(editingBanner.validFrom).getTime()) 
        ? new Date(editingBanner.validFrom).toISOString() 
        : new Date().toISOString();
      
      const validUntilIso = editingBanner.validUntil && !isNaN(new Date(editingBanner.validUntil).getTime()) 
        ? new Date(editingBanner.validUntil).toISOString() 
        : new Date(Date.now() + 7 * 86400000).toISOString();

      await saveOfferBanner({
        ...editingBanner,
        validFrom: validFromIso,
        validUntil: validUntilIso
      });
      setShowEditModal(false);
      setEditingBanner(null);
      await fetchBanners();
    } catch (err: any) {
      console.error('Error saving offer banner:', err);
      alert('Error saving offer banner: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer banner?')) return;
    try {
      await deleteOfferBanner(id);
      await fetchBanners();
    } catch (err: any) {
      alert('Failed to delete banner: ' + err.message);
    }
  };

  const handleToggleActive = async (banner: OfferBanner) => {
    try {
      await toggleBannerActive(banner.id, !banner.active);
      await fetchBanners();
    } catch (err: any) {
      alert('Failed to toggle status: ' + err.message);
    }
  };

  const handleOpenPreview = (banner: OfferBanner) => {
    setPreviewBanner(banner);
    setShowPreviewModal(true);
  };

  // Filter banners based on search and position selector
  const filteredBanners = banners.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.couponCode && b.couponCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPosition = filterPosition === 'all' || b.displayPosition === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const getStatusBadge = (banner: OfferBanner) => {
    if (!banner.active) {
      return (
        <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-xxs font-bold flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Inactive</span>
        </span>
      );
    }

    const now = new Date().getTime();
    const fromTime = new Date(banner.validFrom).getTime();
    const untilTime = new Date(banner.validUntil).getTime();

    if (now < fromTime) {
      return (
        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xxs font-bold flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Scheduled</span>
        </span>
      );
    }

    if (now > untilTime) {
      return (
        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xxs font-bold flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Expired</span>
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xxs font-bold flex items-center space-x-1">
        <CheckCircle2 className="h-3 w-3" />
        <span>Live & Active</span>
      </span>
    );
  };

  const getPositionLabel = (pos: BannerDisplayPosition) => {
    switch (pos) {
      case 'homepage_top': return 'Homepage Top Banner';
      case 'hero': return 'Hero Section';
      case 'sticky_announcement': return 'Sticky Announcement Bar';
      case 'product_store': return 'Product Store Page';
      case 'photography_services': return 'Photography Services';
      case 'printing_services': return 'Printing Services';
      default: return pos;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Gift className="h-5 w-5 text-amber-400" />
            <span>Offer Banners & Promotions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage dynamic promotional banners, discount countdown timers, and site announcements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Offer Banner</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search offer titles or coupon codes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-5 relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Display Positions</option>
            <option value="homepage_top">Homepage Top Banner</option>
            <option value="hero">Hero Section</option>
            <option value="sticky_announcement">Sticky Announcement Bar</option>
            <option value="product_store">Product Store</option>
            <option value="photography_services">Photography Services</option>
            <option value="printing_services">Printing Services</option>
          </select>
        </div>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
          <span>Loading offer banners...</span>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-850 rounded-3xl space-y-3">
          <Gift className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No Offer Banners Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first promotional offer banner to display discounts, countdown timers, and announcements.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20"
          >
            + Add First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((banner) => (
            <div 
              key={banner.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Card Banner Image Preview Header */}
              <div className="relative h-36 bg-slate-950 overflow-hidden group">
                <StudioImage
                  src={banner.desktopImageUrl}
                  fallback={STUDIO_IMAGES.heroWedding}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  {getStatusBadge(banner)}
                  <span className="px-2.5 py-1 bg-slate-950/80 text-amber-400 border border-slate-800 rounded-full text-xxs font-mono font-bold">
                    Priority: {banner.priority}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className="p-1.5 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full border border-slate-800 transition-colors"
                    title={banner.active ? 'Deactivate Banner' : 'Activate Banner'}
                  >
                    {banner.active ? (
                      <ToggleRight className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                </div>

                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xxs font-semibold text-slate-300">
                  <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-amber-400">
                    {getPositionLabel(banner.displayPosition)}
                  </span>
                  {banner.couponCode && (
                    <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                      CODE: {banner.couponCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-xxs font-bold text-amber-400 uppercase tracking-wider mt-0.5">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">
                      {banner.description}
                    </p>
                  )}
                </div>

                {/* Validity Dates Info */}
                <div className="pt-3 border-t border-slate-800 text-xxs text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Valid From:</span>
                    <strong className="text-slate-200">{new Date(banner.validFrom).toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Valid Until:</span>
                    <strong className="text-amber-400">{new Date(banner.validUntil).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(banner)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xxs font-bold flex items-center space-x-1"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="p-2 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-xl text-xs transition-colors"
                      title="Edit Offer Banner"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs transition-colors"
                      title="Delete Offer Banner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showEditModal && editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative max-w-3xl w-full max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Gift className="h-5 w-5 text-amber-400" />
                <span>{editingBanner.id ? 'Edit Offer Banner' : 'Create Offer Banner'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-750 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto max-h-[calc(88vh-130px)] space-y-5">
                
                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingBanner.title || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      placeholder="e.g. Monsoon Wedding Special"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Subtitle / Tag
                    </label>
                    <input
                      type="text"
                      value={editingBanner.subtitle || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      placeholder="e.g. LIMITED TIME OFFER"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingBanner.description || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    placeholder="Details about the promotion or deal..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Display Position & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Display Position *
                    </label>
                    <select
                      value={editingBanner.displayPosition || 'homepage_top'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, displayPosition: e.target.value as BannerDisplayPosition })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="homepage_top">Homepage Top Banner</option>
                      <option value="hero">Hero Section</option>
                      <option value="sticky_announcement">Sticky Announcement Bar</option>
                      <option value="product_store">Product Store</option>
                      <option value="photography_services">Photography Services</option>
                      <option value="printing_services">Printing Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Priority (Higher number = top order)
                    </label>
                    <input
                      type="number"
                      value={editingBanner.priority || 10}
                      onChange={(e) => setEditingBanner({ ...editingBanner, priority: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Desktop Image & Mobile Image Uploaders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ImageField
                      label="Desktop Banner Image *"
                      value={editingBanner.desktopImageUrl || ''}
                      onChange={(url) => setEditingBanner({ ...editingBanner, desktopImageUrl: url })}
                      storagePath="offer_banners"
                    />
                  </div>

                  <div>
                    <ImageField
                      label="Mobile Banner Image (Optional)"
                      value={editingBanner.mobileImageUrl || ''}
                      onChange={(url) => setEditingBanner({ ...editingBanner, mobileImageUrl: url })}
                      storagePath="offer_banners_mobile"
                    />
                  </div>
                </div>

                {/* Optional Background Video */}
                <div>
                  <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                    Background Video URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingBanner.backgroundVideoUrl || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, backgroundVideoUrl: e.target.value })}
                    placeholder="https://commondatastorage.googleapis.com/.../sample.mp4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Button Text & Button Link */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={editingBanner.buttonText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      placeholder="e.g. Claim Offer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={editingBanner.buttonLink || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonLink: e.target.value })}
                      placeholder="e.g. /store or /booking"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Coupon Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingBanner.couponCode || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, couponCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. SAVE20"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Validity Window (Valid From & Valid Until) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Valid From (Start Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={editingBanner.validFrom || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, validFrom: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-300 uppercase mb-1">
                      Valid Until (Expiry Date & Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={editingBanner.validUntil || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, validUntil: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Checkbox Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.active ?? true}
                      onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-200">Active</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.showCountdown ?? true}
                      onChange={(e) => setEditingBanner({ ...editingBanner, showCountdown: e.target.checked })}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-200">Show Countdown</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner.autoHideAfterExpiry ?? true}
                      onChange={(e) => setEditingBanner({ ...editingBanner, autoHideAfterExpiry: e.target.checked })}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-200">Auto Hide After Expiry</span>
                  </label>
                </div>

              </div>

              {/* Fixed Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
                >
                  {saving ? 'Saving...' : 'Save Offer Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && previewBanner && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl my-8">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <span>Banner Live Preview</span>
                </h3>
                
                {/* Device Frame Toggle */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-1 rounded text-xxs font-bold flex items-center space-x-1 ${
                      previewDevice === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-1 rounded text-xxs font-bold flex items-center space-x-1 ${
                      previewDevice === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Simulated Frame */}
            <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'}`}>
              <div className="relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl bg-slate-950 p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
                
                {/* Background image preview */}
                <StudioImage
                  src={
                    previewDevice === 'mobile' && previewBanner.mobileImageUrl
                      ? previewBanner.mobileImageUrl
                      : previewBanner.desktopImageUrl
                  }
                  fallback={STUDIO_IMAGES.heroWedding}
                  alt={previewBanner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-amber-500 text-slate-950 font-black text-xxs uppercase px-3 py-1 rounded-full">
                      {previewBanner.subtitle || 'SPECIAL OFFER'}
                    </span>
                    {previewBanner.couponCode && (
                      <span className="bg-slate-900 text-amber-400 px-3 py-1 rounded-full text-xs font-mono font-bold border border-amber-500/30">
                        {previewBanner.couponCode}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">{previewBanner.title}</h2>
                  <p className="text-slate-300 text-xs line-clamp-2">{previewBanner.description}</p>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xxs text-amber-400 font-mono">
                    Ends: {new Date(previewBanner.validUntil).toLocaleDateString()}
                  </div>
                  {previewBanner.buttonText && (
                    <span className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
                      {previewBanner.buttonText} →
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
