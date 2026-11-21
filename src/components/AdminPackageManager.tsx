import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PackageItem, PackageCategory } from '../types';
import { ImageField } from './ImageField';
import { getImageForSlugOrCategory } from '../assets/studioAssets';
import { uploadBase64ToStorage } from '../utils/imageUploader';
import { resolveMediaUrl, applyImageFallback, isEphemeralMediaUrl } from '../utils/mediaResolver';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Package
} from 'lucide-react';

const PACKAGE_CATEGORIES: PackageCategory[] = [
  'Pre-Wedding',
  'Wedding',
  'Birthday',
  'Engagement & Ring Ceremony',
  'Event Photography',
  'Maternity & Baby Photography'
];

interface AdminPackageManagerProps {
  onTriggerConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const AdminPackageManager: React.FC<AdminPackageManagerProps> = ({ onTriggerConfirm }) => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackageCategory>('Wedding');
  const [price, setPrice] = useState<number>(15000);
  const [image, setImage] = useState('');
  const [duration, setDuration] = useState('');
  const [editedPhotosCount, setEditedPhotosCount] = useState('');
  const [reelsCount, setReelsCount] = useState('');
  const [albumDetails, setAlbumDetails] = useState('');
  const [frameDetails, setFrameDetails] = useState('');
  const [description, setDescription] = useState('');
  const [includedServicesText, setIncludedServicesText] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState<number>(1);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'packages'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PackageItem));
      list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      setPackages(list);
    } catch (err) {
      console.error('Error loading packages:', err);
      setStatusNotice({ type: 'error', text: 'Failed to load packages from Firestore.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openModal = (pkg?: PackageItem) => {
    setModalError(null);
    if (pkg) {
      setEditingPkg(pkg);
      setName(pkg.name || '');
      setCategory((pkg.category as PackageCategory) || 'Wedding');
      setPrice(Number.isFinite(Number(pkg.price)) ? Number(pkg.price) : 0);
      setImage(pkg.image || '');
      setDuration(pkg.duration || '');
      setEditedPhotosCount(pkg.editedPhotosCount || '');
      setReelsCount(pkg.reelsCount || '');
      setAlbumDetails(pkg.albumDetails || '');
      setFrameDetails(pkg.frameDetails || '');
      setDescription(pkg.description || '');
      setIncludedServicesText(Array.isArray(pkg.includedServices) ? pkg.includedServices.join('\n') : '');
      setIsPublished(pkg.isPublished !== false);
      setIsFeatured(!!pkg.isFeatured);
      setOrder(Number.isFinite(Number(pkg.order)) ? Number(pkg.order) : packages.length + 1);
    } else {
      setEditingPkg(null);
      setName('');
      setCategory('Wedding');
      setPrice(15000);
      setImage(getImageForSlugOrCategory('Wedding'));
      setDuration('1 Full Day (8 Hours)');
      setEditedPhotosCount('250+ Edited Photos');
      setReelsCount('2 Cinematic Reels');
      setAlbumDetails('30-Sheet Flush Mount Velvet Album');
      setFrameDetails('1x 12x18 Matte Gold Couple Frame');
      setDescription('');
      setIncludedServicesText('Candid Photographer\n4K Highlight Video\nEdited Digital Gallery\nFlush Mount Album');
      setIsPublished(true);
      setIsFeatured(false);
      setOrder(packages.length + 1);
    }
    setShowModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setModalError(null);
    setStatusNotice(null);

    if (!auth.currentUser) {
      setModalError('Your admin session expired. Please sign in again before saving packages.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedCategory = (category || 'Wedding').trim();
    const numericPrice = Number(price);
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setModalError('Package Name is required.');
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setModalError('Package Price must be a valid number greater than or equal to 0.');
      return;
    }
    if (!trimmedDesc) {
      setModalError('Package Overview Description is required.');
      return;
    }

    // Prevent accidental duplicate record when creating a brand new package
    if (!editingPkg) {
      const duplicate = packages.find(
        (p) =>
          p.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
          (p.category || '').trim().toLowerCase() === trimmedCategory.toLowerCase()
      );
      if (duplicate) {
        setModalError(
          `A package named "${duplicate.name}" already exists in "${duplicate.category}". Edit the existing package instead or use a distinct name.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const rawId = editingPkg ? editingPkg.id : `pkg_${Date.now()}`;
      const pkgId = /^[a-zA-Z0-9_-]+$/.test(rawId)
        ? rawId.slice(0, 128)
        : `pkg_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}`;
      const now = new Date().toISOString();

      // Ensure cover image is never a huge base64 string or blob URL
      let resolvedImage = (image || '').trim();
      if (resolvedImage.startsWith('blob:') || resolvedImage.startsWith('file:')) {
        throw new Error('Selected image uses a temporary browser link. Please re-upload the image first.');
      }
      if (resolvedImage.startsWith('data:')) {
        resolvedImage = await uploadBase64ToStorage(resolvedImage, 'packages');
      }
      if (!resolvedImage) {
        resolvedImage = getImageForSlugOrCategory(trimmedCategory);
      }
      if (resolvedImage.length > 2048) {
        throw new Error('Package image URL exceeds the 2048-character limit. Please upload the image file cleanly.');
      }

      const includedList = includedServicesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 30);

      const safeCreatedAt =
        typeof editingPkg?.createdAt === 'string' && editingPkg.createdAt.trim()
          ? editingPkg.createdAt.trim().slice(0, 64)
          : now;

      const numericOrder = Number(order);
      const safeOrder = Number.isFinite(numericOrder) ? Math.max(1, Math.round(numericOrder)) : 1;

      const payload: PackageItem = {
        id: pkgId,
        name: trimmedName.slice(0, 200),
        category: trimmedCategory.slice(0, 100) as PackageCategory,
        price: numericPrice,
        image: resolvedImage,
        duration: duration.trim().slice(0, 160),
        editedPhotosCount: editedPhotosCount.trim().slice(0, 160),
        reelsCount: reelsCount.trim().slice(0, 160),
        albumDetails: albumDetails.trim().slice(0, 500),
        frameDetails: frameDetails.trim().slice(0, 500),
        description: trimmedDesc.slice(0, 5000),
        includedServices: includedList,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        order: safeOrder,
        createdAt: safeCreatedAt,
        updatedAt: now
      };

      await setDoc(doc(db, 'packages', pkgId), payload);
      setShowModal(false);
      setEditingPkg(null);
      setStatusNotice({ type: 'success', text: `Package "${payload.name}" saved successfully.` });
      await fetchPackages();
    } catch (err: any) {
      console.error('Error saving package:', err);
      const code = err?.code ? ` (${err.code})` : '';
      const detail =
        err?.code === 'permission-denied'
          ? 'Firestore permission denied. Verify you are signed in as an Admin and all package fields are valid.'
          : err?.message || 'Unexpected error while saving package.';
      setModalError(`Failed to save package${code}: ${detail}`);
      setStatusNotice({ type: 'error', text: `Failed to save package${code}: ${detail}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (pkg: PackageItem) => {
    try {
      await updateDoc(doc(db, 'packages', pkg.id), {
        isPublished: pkg.isPublished === false,
        updatedAt: new Date().toISOString()
      });
      setPackages((prev) =>
        prev.map((item) => (item.id === pkg.id ? { ...item, isPublished: pkg.isPublished === false } : item))
      );
    } catch (err: any) {
      console.error('Toggle publish error:', err);
      setStatusNotice({
        type: 'error',
        text: `Failed to update publish status: ${err?.message || 'Permission denied.'}`
      });
    }
  };

  const handleDeletePackage = (pkg: PackageItem) => {
    const performDelete = async () => {
      try {
        await deleteDoc(doc(db, 'packages', pkg.id));
        setStatusNotice({ type: 'success', text: `Deleted package "${pkg.name}".` });
        await fetchPackages();
      } catch (err) {
        console.error('Error deleting package:', err);
        setStatusNotice({ type: 'error', text: 'Failed to delete package.' });
      }
    };

    if (onTriggerConfirm) {
      onTriggerConfirm(
        'Delete Photography Package',
        `Are you sure you want to permanently remove "${pkg.name}"? It will no longer appear on Packages & Service pages.`,
        performDelete
      );
    } else {
      performDelete();
    }
  };

  const filtered = filterCategory === 'All' ? packages : packages.filter((p) => p.category === filterCategory);

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="h-5 w-5 text-[#D4AF37]" />
            <span>Dynamic Packages & Pricing Manager</span>
          </h3>
          <p className="text-xxs text-neutral-400 mt-1">
            Add, edit, publish, or organize photography & event pricing packages across all categories.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c5a028] text-[#111111] font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Package</span>
        </button>
      </div>

      {statusNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            statusNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{statusNotice.text}</span>
          </span>
          <button type="button" onClick={() => setStatusNotice(null)} className="text-neutral-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Category filter bar */}
      <div className="flex flex-wrap gap-2">
        {['All', ...PACKAGE_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xxs font-mono uppercase font-bold transition-colors whitespace-nowrap shrink-0 ${
              filterCategory === cat
                ? 'bg-[#D4AF37] text-[#111111]'
                : 'bg-[#111111] text-neutral-400 border border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-[#1A1A1A] rounded-2xl border border-white/10" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <Package className="h-8 w-8 text-[#D4AF37] mx-auto" />
          <p className="text-white font-bold">No Packages Found in "{filterCategory}"</p>
          <p className="text-neutral-400 text-xxs">Click "Add New Package" to configure photography tiers and pricing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-[#1A1A1A] border rounded-2xl overflow-hidden flex flex-col justify-between transition-colors ${
                pkg.isPublished === false ? 'border-white/5 opacity-75' : 'border-white/10 hover:border-[#D4AF37]/40'
              }`}
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#111111] overflow-hidden">
                  <img
                    src={resolveMediaUrl(pkg.image, getImageForSlugOrCategory(pkg.category))}
                    alt={pkg.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => applyImageFallback(e, getImageForSlugOrCategory(pkg.category))}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-[#111111]/85 backdrop-blur-sm border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-[10px] uppercase font-bold rounded">
                      {pkg.category}
                    </span>
                    {pkg.isFeatured && (
                      <span className="px-2 py-1 bg-[#D4AF37] text-[#111111] font-mono text-[10px] uppercase font-bold rounded flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" /> Featured
                      </span>
                    )}
                    {isEphemeralMediaUrl(pkg.image) && (
                      <span className="px-2 py-1 bg-amber-500/90 text-slate-950 font-mono text-[10px] uppercase font-bold rounded">
                        Re-upload image
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white text-sm leading-snug">{pkg.name}</h4>
                    <span className="text-[#D4AF37] font-mono font-extrabold text-sm shrink-0">
                      ₹{(Number(pkg.price) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-neutral-400 text-xxs line-clamp-2">{pkg.description}</p>

                  <div className="bg-[#111111] border border-white/10 rounded-xl p-2.5 space-y-1 text-[11px] font-mono text-neutral-300">
                    <p><span className="text-neutral-500">Duration:</span> {pkg.duration || 'Custom'}</p>
                    <p><span className="text-neutral-500">Photos:</span> {pkg.editedPhotosCount || 'Standard'}</p>
                    <p><span className="text-neutral-500">Reels:</span> {pkg.reelsCount || '—'}</p>
                    <p><span className="text-neutral-500">Album:</span> {pkg.albumDetails || '—'}</p>
                    <p><span className="text-neutral-500">Frames:</span> {pkg.frameDetails || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openModal(pkg)}
                  className="flex-1 py-2 bg-[#111111] hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-xxs flex items-center justify-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePublished(pkg)}
                  title={pkg.isPublished !== false ? 'Unpublish Package' : 'Publish Package'}
                  className={`px-3 py-2 rounded-xl border text-xxs font-bold flex items-center gap-1 ${
                    pkg.isPublished !== false
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-neutral-400'
                  }`}
                >
                  {pkg.isPublished !== false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{pkg.isPublished !== false ? 'Live' : 'Draft'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg)}
                  className="px-3 py-2 bg-[#111111] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-rose-400 rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1A1A1A] border border-white/15 rounded-3xl p-6 md:p-8 text-white max-h-[92vh] overflow-y-auto shadow-2xl">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white rounded-lg bg-[#111111]"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-[#D4AF37] uppercase tracking-wider font-mono mb-6">
              {editingPkg ? `Edit Package: ${editingPkg.name}` : 'Create New Photography Package'}
            </h3>

            {modalError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePackage} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Wedding Heritage Suite"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Package Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PackageCategory)}
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3 py-3 text-white outline-none focus:border-[#D4AF37]"
                    >
                      {PACKAGE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Package Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-4 py-3 text-white outline-none focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 2 Full Days Coverage"
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Edited Photos Count</label>
                    <input
                      type="text"
                      value={editedPhotosCount}
                      onChange={(e) => setEditedPhotosCount(e.target.value)}
                      placeholder="e.g. 500+ Graded Photos"
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-300 font-semibold">Reels / Cinema Count</label>
                    <input
                      type="text"
                      value={reelsCount}
                      onChange={(e) => setReelsCount(e.target.value)}
                      placeholder="e.g. 3 Reels + Highlight Film"
                      className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold">Album Details</label>
                  <input
                    type="text"
                    value={albumDetails}
                    onChange={(e) => setAlbumDetails(e.target.value)}
                    placeholder="e.g. 50-Sheet Flush Mount Velvet Album"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold">Frame Details</label>
                  <input
                    type="text"
                    value={frameDetails}
                    onChange={(e) => setFrameDetails(e.target.value)}
                    placeholder="e.g. 2x 16x20 Matte Gold Frames"
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImageField
                  value={image}
                  onChange={setImage}
                  storagePath="packages"
                  label="Package Cover Image"
                  recommendedSize="Landscape 1200x800 px"
                />

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold">Package Overview Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the coverage style, team size, and delivery experience..."
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold">
                    Included Deliverables <span className="text-neutral-500 font-normal">(one item per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={includedServicesText}
                    onChange={(e) => setIncludedServicesText(e.target.value)}
                    placeholder={'Candid & Traditional Photographers\n4K Cinema Filmmaker\nAerial Drone'}
                    className="w-full bg-[#111111] border border-white/15 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#D4AF37] font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="accent-[#D4AF37] h-4 w-4"
                    />
                    <span>Publish on Website</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="accent-[#D4AF37] h-4 w-4"
                    />
                    <span>Show on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 bg-[#111111] border border-white/15 text-neutral-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#D4AF37] hover:bg-[#c5a028] text-[#111111] font-extrabold rounded-xl flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
