import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Coupon, CouponUsage, ProductItem, ServiceItem, DiscountType, ApplicableOnType } from '../types';
import { 
  Ticket, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Percent, 
  DollarSign, 
  Tag, 
  Calendar, 
  BarChart3, 
  History, 
  Sparkles, 
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  ShoppingBag
} from 'lucide-react';

interface AdminCouponManagerProps {
  products: ProductItem[];
  services: ServiceItem[];
  onTriggerConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const AdminCouponManager: React.FC<AdminCouponManagerProps> = ({
  products = [],
  services = [],
  onTriggerConfirm
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(0);
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState<number>(0);
  const [formApplicableOn, setFormApplicableOn] = useState<ApplicableOnType>('ALL');
  const [formApplicableCategoryIds, setFormApplicableCategoryIds] = useState<string[]>([]);
  const [formApplicableProductIds, setFormApplicableProductIds] = useState<string[]>([]);
  const [formValidFrom, setFormValidFrom] = useState<string>('');
  const [formValidUntil, setFormValidUntil] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<number>(100);
  const [formUsageLimitPerCustomer, setFormUsageLimitPerCustomer] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formFirstOrderOnly, setFormFirstOrderOnly] = useState<boolean>(false);
  const [formCustomerSpecificEmail, setFormCustomerSpecificEmail] = useState<string>('');
  const [formAutoApply, setFormAutoApply] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique categories from products & services for category selection
  const availableCategories = Array.from(
    new Set([
      ...products.map(p => p.category).filter(Boolean),
      ...services.map(s => s.category).filter(Boolean)
    ])
  );

  // Fetch Coupons and Usage History from Firestore with realtime listeners
  useEffect(() => {
    setLoading(true);
    const couponsRef = collection(db, 'coupons');
    const usagesRef = collection(db, 'coupon_usages');

    const unsubCoupons = onSnapshot(couponsRef, (snapshot) => {
      const list: Coupon[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
      });
      // Sort by createdAt desc
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      console.log('Total coupons in Firestore:', snapshot.size);
      console.log('Coupons loaded in Admin Panel:', list.length);

      setCoupons(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching coupons:', err);
      setLoading(false);
    });

    const unsubUsages = onSnapshot(usagesRef, (snapshot) => {
      const list: CouponUsage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CouponUsage);
      });
      list.sort((a, b) => new Date(b.usedAt || 0).getTime() - new Date(a.usedAt || 0).getTime());
      setUsages(list);
    }, (err) => {
      console.error('Error fetching coupon usages:', err);
    });

    return () => {
      unsubCoupons();
      unsubUsages();
    };
  }, []);

  // Helper date formatter for datetime-local inputs
  const toDatetimeLocal = (isoStr?: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Helper date formatter for display
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open modal to add or edit
  const handleOpenModal = (couponToEdit?: Coupon) => {
    if (couponToEdit) {
      setEditingCoupon(couponToEdit);
      setFormName(couponToEdit.name || '');
      setFormCode(couponToEdit.code || '');
      setFormDescription(couponToEdit.description || '');
      setFormDiscountType(couponToEdit.discountType || 'PERCENTAGE');
      setFormDiscountValue(couponToEdit.discountValue || 0);
      setFormMinOrderAmount(couponToEdit.minOrderAmount || 0);
      setFormMaxDiscountAmount(couponToEdit.maxDiscountAmount || 0);
      setFormApplicableOn(couponToEdit.applicableOn || 'ALL');
      setFormApplicableCategoryIds(couponToEdit.applicableCategoryIds || []);
      setFormApplicableProductIds(couponToEdit.applicableProductIds || []);
      setFormValidFrom(toDatetimeLocal(couponToEdit.validFrom));
      setFormValidUntil(toDatetimeLocal(couponToEdit.validUntil));
      setFormUsageLimit(couponToEdit.usageLimit || 0);
      setFormUsageLimitPerCustomer(couponToEdit.usageLimitPerCustomer || 0);
      setFormIsActive(couponToEdit.isActive ?? true);
      setFormFirstOrderOnly(couponToEdit.firstOrderOnly ?? false);
      setFormCustomerSpecificEmail(couponToEdit.customerSpecificEmail || '');
      setFormAutoApply(couponToEdit.autoApply ?? false);
    } else {
      setEditingCoupon(null);
      setFormName('');
      setFormCode('');
      setFormDescription('');
      setFormDiscountType('PERCENTAGE');
      setFormDiscountValue(10);
      setFormMinOrderAmount(0);
      setFormMaxDiscountAmount(0);
      setFormApplicableOn('ALL');
      setFormApplicableCategoryIds([]);
      setFormApplicableProductIds([]);
      
      const now = new Date();
      const defaultValidFrom = now.toISOString();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      const defaultValidUntil = future.toISOString();

      setFormValidFrom(toDatetimeLocal(defaultValidFrom));
      setFormValidUntil(toDatetimeLocal(defaultValidUntil));
      setFormUsageLimit(100);
      setFormUsageLimitPerCustomer(1);
      setFormIsActive(true);
      setFormFirstOrderOnly(false);
      setFormCustomerSpecificEmail('');
      setFormAutoApply(false);
    }
    setShowModal(true);
  };

  // Save Coupon (Create or Update)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Please fill in required fields: Coupon Name and Coupon Code.');
      return;
    }

    const uppercaseCode = formCode.trim().toUpperCase();

    // Check code uniqueness if creating new or changing existing code
    const duplicate = coupons.find(c => c.code === uppercaseCode && c.id !== editingCoupon?.id);
    if (duplicate) {
      alert(`A coupon with code "${uppercaseCode}" already exists. Please use a unique coupon code.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const couponId = editingCoupon ? editingCoupon.id : `cp_${Date.now()}`;
      
      const couponPayload: Coupon = {
        id: couponId,
        name: formName.trim(),
        code: uppercaseCode,
        description: formDescription.trim(),
        discountType: formDiscountType,
        discountValue: Number(formDiscountValue) || 0,
        minOrderAmount: Number(formMinOrderAmount) || 0,
        maxDiscountAmount: Number(formMaxDiscountAmount) || 0,
        applicableOn: formApplicableOn,
        applicableCategoryIds: formApplicableOn === 'CATEGORIES' ? formApplicableCategoryIds : [],
        applicableProductIds: formApplicableOn === 'PRODUCTS' ? formApplicableProductIds : [],
        validFrom: formValidFrom ? new Date(formValidFrom).toISOString() : new Date().toISOString(),
        validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : new Date(Date.now() + 30*24*3600*1000).toISOString(),
        usageLimit: Number(formUsageLimit) || 0,
        usageLimitPerCustomer: Number(formUsageLimitPerCustomer) || 0,
        timesUsed: editingCoupon ? (editingCoupon.timesUsed || 0) : 0,
        isActive: formIsActive,
        active: formIsActive,
        firstOrderOnly: formFirstOrderOnly,
        customerSpecificEmail: formCustomerSpecificEmail.trim().toLowerCase(),
        autoApply: formAutoApply,
        createdAt: editingCoupon?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'coupons', couponId), couponPayload);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving coupon:', err);
      alert('Failed to save coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Active/Inactive
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const currentStatus = coupon.isActive ?? (coupon as any).active ?? true;
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: newStatus,
        active: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      alert('Failed to update status.');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = (coupon: Coupon) => {
    const doDelete = async () => {
      try {
        await deleteDoc(doc(db, 'coupons', coupon.id));
      } catch (err) {
        console.error('Error deleting coupon:', err);
        alert('Failed to delete coupon.');
      }
    };

    if (onTriggerConfirm) {
      onTriggerConfirm(
        'Delete Dynamic Coupon',
        `Are you sure you want to permanently delete coupon "${coupon.name}" (${coupon.code})?`,
        doDelete
      );
    } else {
      if (window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
        doDelete();
      }
    }
  };

  // Copy code to clipboard helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Check if coupon is expired based on current time
  const isCouponExpired = (coupon: Coupon) => {
    if (!coupon.validUntil) return false;
    const until = new Date(coupon.validUntil).getTime();
    return !isNaN(until) && Date.now() > until;
  };

  // Analytics Metrics
  const totalCoupons = coupons.length;
  const activeCouponsCount = coupons.filter(c => c.isActive && !isCouponExpired(c) && (c.usageLimit === 0 || c.timesUsed < c.usageLimit)).length;
  const expiredCouponsCount = coupons.filter(c => isCouponExpired(c)).length;
  const totalRevenueImpact = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);

  const sortedByUsage = [...coupons].sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0));
  const mostUsedCoupon = sortedByUsage.length > 0 && (sortedByUsage[0].timesUsed || 0) > 0 ? sortedByUsage[0] : null;

  // Filtered coupons list
  const filteredCoupons = coupons.filter(c => {
    const matchSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const expired = isCouponExpired(c);
    
    let matchStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchStatus = c.isActive && !expired;
    } else if (statusFilter === 'EXPIRED') {
      matchStatus = expired;
    } else if (statusFilter === 'INACTIVE') {
      matchStatus = !c.isActive;
    }

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in text-xs font-sans">
      
      {/* Header & Main Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-amber-500" />
            <h3 className="text-lg font-bold text-white tracking-wide">Dynamic Coupon & Offer Engine</h3>
          </div>
          <p className="text-slate-400 text-xxs mt-1">
            Create, manage, and track real-time promotional codes with custom usage limits, customer constraints, and automated checkout validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setSelectedCouponForHistory(null);
              setShowHistoryModal(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-slate-800"
          >
            <History className="h-4 w-4 text-amber-400" />
            <span>Usage History ({usages.length})</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add New Coupon</span>
          </button>
        </div>
      </div>

      {/* Admin Reports & Analytics Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xxs font-bold uppercase tracking-wider">Total Coupons</span>
            <Ticket className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">{totalCoupons}</p>
          <span className="text-[10px] text-slate-500 mt-1">Configured in store</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xxs font-bold uppercase tracking-wider">Active Coupons</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{activeCouponsCount}</p>
          <span className="text-[10px] text-emerald-500/80 mt-1">Ready for checkout use</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xxs font-bold uppercase tracking-wider">Expired Coupons</span>
            <Clock className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono mt-2">{expiredCouponsCount}</p>
          <span className="text-[10px] text-rose-500/80 mt-1">Past valid until date</span>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xxs font-bold uppercase tracking-wider">Most Used</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          {mostUsedCoupon ? (
            <div>
              <p className="text-base font-black text-amber-400 font-mono mt-1 truncate">{mostUsedCoupon.code}</p>
              <span className="text-[10px] text-slate-400">{mostUsedCoupon.timesUsed} redemptions</span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-500 mt-2">None yet</p>
          )}
        </div>

        <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xxs font-bold uppercase tracking-wider">Revenue Impact</span>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-xl font-black text-blue-400 font-mono mt-2">₹{totalRevenueImpact.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-1">Total discounts granted</span>
        </div>

      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coupon name or code..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-amber-500/50 transition-all text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACTIVE', 'EXPIRED', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all capitalize ${
                statusFilter === st
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Coupons' : st.toLowerCase()}
            </button>
          ))}
        </div>

      </div>

      {/* Coupons List Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin inline-block h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full mb-3" />
          <p className="text-slate-500 text-xs">Loading coupons from Firestore...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-12 text-center">
          <Ticket className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-300">No coupons found</h4>
          <p className="text-slate-500 text-xxs mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Click "Add New Coupon" above to create your first dynamic discount offer.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const expired = isCouponExpired(coupon);
            const usageFull = coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit;
            const remainingUsage = coupon.usageLimit > 0 ? Math.max(0, coupon.usageLimit - coupon.timesUsed) : 'Unlimited';

            return (
              <div 
                key={coupon.id} 
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between relative group transition-all hover:border-slate-700 shadow-xl ${
                  expired
                    ? 'border-rose-500/20 bg-rose-950/5'
                    : !coupon.isActive
                    ? 'border-slate-800 opacity-75'
                    : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                {/* Coupon Header Info */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 font-mono font-black rounded-lg text-xs tracking-wider flex items-center gap-1.5 select-all">
                        <span>{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === coupon.code ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </span>

                      {/* Status Badges */}
                      {expired ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Expired
                        </span>
                      ) : !coupon.isActive ? (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md">
                          Inactive
                        </span>
                      ) : usageFull ? (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold rounded-md">
                          Limit Reached
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      )}
                    </div>

                    {/* Quick Active Toggle */}
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        coupon.isActive ? 'bg-amber-400' : 'bg-slate-800'
                      }`}
                      title={coupon.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                          coupon.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <h4 className="font-bold text-white text-base leading-snug">{coupon.name}</h4>
                  {coupon.description && (
                    <p className="text-slate-400 text-xxs mt-1 line-clamp-2">{coupon.description}</p>
                  )}

                  {/* Highlight Discount Box */}
                  <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Discount</span>
                      <p className="text-sm font-extrabold text-amber-400 font-mono">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue.toLocaleString('en-IN')} FIXED OFF`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scope</span>
                      <p className="text-xxs font-bold text-slate-300 capitalize">
                        {coupon.applicableOn === 'ALL'
                          ? 'All Items'
                          : coupon.applicableOn.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Conditions & Rules */}
                  <div className="mt-4 space-y-2 text-xxs text-slate-400">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-500">Min Purchase:</span>
                      <span className="font-semibold text-slate-200">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount.toLocaleString('en-IN')}` : 'No Minimum'}
                      </span>
                    </div>

                    {coupon.discountType === 'PERCENTAGE' && coupon.maxDiscountAmount > 0 && (
                      <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                        <span className="text-slate-500">Max Discount Cap:</span>
                        <span className="font-semibold text-amber-400">₹{coupon.maxDiscountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-500">Total Usages:</span>
                      <span className="font-semibold text-slate-200">
                        {coupon.timesUsed || 0} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-500">Remaining Usage:</span>
                      <span className={`font-semibold ${typeof remainingUsage === 'number' && remainingUsage < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {remainingUsage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                      <span className="text-slate-500">Valid Window:</span>
                      <span className="font-mono text-[10px] text-slate-300">
                        {formatDateDisplay(coupon.validUntil)}
                      </span>
                    </div>

                    {/* Rule Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {coupon.firstOrderOnly && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold rounded">
                          First Order Only
                        </span>
                      )}
                      {coupon.autoApply && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold rounded">
                          Auto-Apply
                        </span>
                      )}
                      {coupon.customerSpecificEmail && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold rounded truncate max-w-[180px]">
                          Target: {coupon.customerSpecificEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCouponForHistory(coupon);
                      setShowHistoryModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xxs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <History className="h-3 w-3 text-amber-400" />
                    <span>Logs</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(coupon)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xxs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="h-3 w-3 text-blue-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCoupon(coupon)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[92vh] overflow-y-auto shadow-2xl">
            
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <Ticket className="h-6 w-6 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {editingCoupon ? 'Edit Dynamic Coupon Spec' : 'Create New Dynamic Coupon'}
                </h3>
                <p className="text-xxs text-slate-400">Configure discount logic, eligibility criteria, and usage thresholds.</p>
              </div>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-6">
              
              {/* Section 1: Basic Identity */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  <span>1. Coupon Details & Code</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Coupon Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Festival Special Discount"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Coupon Code * (Auto Uppercase)</label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FESTIVE20"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-amber-400 font-mono font-bold outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Description / Terms</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Get 20% off on all wedding album prints and photobooks above ₹2,000."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Section 2: Discount & Pricing Limits */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>2. Discount Type & Value Rules</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Discount Type</label>
                    <select
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value as DiscountType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">
                      Discount Value {formDiscountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formMinOrderAmount}
                      onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                      placeholder="0 for no minimum"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {formDiscountType === 'PERCENTAGE' && (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Max Discount Cap Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formMaxDiscountAmount}
                      onChange={(e) => setFormMaxDiscountAmount(Number(e.target.value))}
                      placeholder="0 for unlimited discount"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-amber-500/50"
                    />
                    <p className="text-[10px] text-slate-500">Maximum cap for percentage discounts (e.g. 20% off up to max ₹500).</p>
                  </div>
                )}
              </div>

              {/* Section 3: Target Applicability */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>3. Applicable On Scope</span>
                </h4>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Applicable Scope</label>
                  <select
                    value={formApplicableOn}
                    onChange={(e) => setFormApplicableOn(e.target.value as ApplicableOnType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                  >
                    <option value="ALL">All Store Products & Services</option>
                    <option value="CATEGORIES">Selected Categories</option>
                    <option value="PRODUCTS">Selected Specific Products</option>
                    <option value="PRINTING">Printing Services Only</option>
                    <option value="PHOTOGRAPHY">Photography Shoots Only</option>
                  </select>
                </div>

                {/* Categories Multi-Select */}
                {formApplicableOn === 'CATEGORIES' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-slate-400 font-semibold">Select Eligible Categories:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 bg-slate-900 rounded-xl border border-slate-800">
                      {availableCategories.map((cat) => {
                        const checked = formApplicableCategoryIds.includes(cat);
                        return (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer text-xxs text-slate-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormApplicableCategoryIds([...formApplicableCategoryIds, cat]);
                                } else {
                                  setFormApplicableCategoryIds(formApplicableCategoryIds.filter(c => c !== cat));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0"
                            />
                            <span className="truncate">{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Products Multi-Select */}
                {formApplicableOn === 'PRODUCTS' && (
                  <div className="space-y-2 pt-2">
                    <label className="text-slate-400 font-semibold">Select Eligible Specific Products:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-3 bg-slate-900 rounded-xl border border-slate-800">
                      {products.map((prod) => {
                        const checked = formApplicableProductIds.includes(prod.id);
                        return (
                          <label key={prod.id} className="flex items-center gap-2 cursor-pointer text-xxs text-slate-300 hover:text-white">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormApplicableProductIds([...formApplicableProductIds, prod.id]);
                                } else {
                                  setFormApplicableProductIds(formApplicableProductIds.filter(id => id !== prod.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0"
                            />
                            <span className="truncate">{prod.title} (₹{prod.price})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Validity & Usage Limits */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>4. Validity Period & Limits</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Valid From (Date & Time)</label>
                    <input
                      type="datetime-local"
                      required
                      value={formValidFrom}
                      onChange={(e) => setFormValidFrom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Valid Until (Date & Time)</label>
                    <input
                      type="datetime-local"
                      required
                      value={formValidUntil}
                      onChange={(e) => setFormValidUntil(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Total System Usage Limit</label>
                    <input
                      type="number"
                      min={0}
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                      placeholder="0 for unlimited"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold">Usage Limit Per Customer</label>
                    <input
                      type="number"
                      min={0}
                      value={formUsageLimitPerCustomer}
                      onChange={(e) => setFormUsageLimitPerCustomer(Number(e.target.value))}
                      placeholder="0 for unlimited"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Smart Constraints & Advanced Toggles */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                <h4 className="text-xxs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>5. Advanced Customer Constraints</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-white block">Active Status</span>
                      <span className="text-[10px] text-slate-400">Coupon enabled</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFirstOrderOnly}
                      onChange={(e) => setFormFirstOrderOnly(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-white block">First Order Only</span>
                      <span className="text-[10px] text-slate-400">New customers only</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAutoApply}
                      onChange={(e) => setFormAutoApply(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-white block">Auto Apply</span>
                      <span className="text-[10px] text-slate-400">Apply if eligible</span>
                    </div>
                  </label>

                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Target Specific Customer Email (Optional)</label>
                  <input
                    type="email"
                    value={formCustomerSpecificEmail}
                    onChange={(e) => setFormCustomerSpecificEmail(e.target.value)}
                    placeholder="e.g. client@example.com (leave empty for all customers)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl uppercase tracking-wider flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCoupon ? 'Update Coupon Spec' : 'Publish Dynamic Coupon'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* USAGE HISTORY LOG MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white text-xs font-sans max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <button 
              onClick={() => setShowHistoryModal(false)} 
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <History className="h-6 w-6 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {selectedCouponForHistory 
                    ? `Redemption History for ${selectedCouponForHistory.code}` 
                    : 'System-Wide Coupon Usage History'}
                </h3>
                <p className="text-xxs text-slate-400">Detailed audit log of customer coupon redemptions recorded in Firestore.</p>
              </div>
            </div>

            {/* Usages Table */}
            {(() => {
              const filteredUsages = selectedCouponForHistory
                ? usages.filter(u => u.couponCode === selectedCouponForHistory.code || u.couponId === selectedCouponForHistory.id)
                : usages;

              if (filteredUsages.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-500">
                    <Clock className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                    <p className="font-semibold">No redemption records logged yet.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Coupon Code</th>
                        <th className="py-3 px-3">Customer Email</th>
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3 text-right">Discount Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredUsages.map((usage) => (
                        <tr key={usage.id || Math.random()} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                            {formatDateDisplay(usage.usedAt)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 font-mono font-bold rounded text-xxs border border-amber-400/20">
                              {usage.couponCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-white">
                            {usage.customerEmail || 'Anonymous'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">
                            #{usage.orderId?.slice(0, 10).toUpperCase()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                            ₹{usage.discountAmount?.toLocaleString('en-IN') || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};
