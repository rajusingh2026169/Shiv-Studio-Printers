import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { Order, Booking, ProofVersion } from '../../types';
import { downloadOriginalFile } from '../../utils/clientPhotoUploader';
import { StudioImage, StudioVideo } from '../../components/StudioMedia';
import { isFsMediaUrl } from '../../utils/firestoreMediaStore';
import {
  User,
  ShoppingBag,
  Calendar,
  Eye,
  Mail,
  Phone,
  MapPin,
  LogOut,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  Sparkles,
  RotateCcw,
  FileText
} from 'lucide-react';
import { InvoiceModal } from '../../components/InvoiceModal';
import { SEOHead } from '../../components/SEOHead';

export const CustomerPortal: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Proof review & revision UI states
  const [revisionOrderId, setRevisionOrderId] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState('');
  const [submittingProofAction, setSubmittingProofAction] = useState<string | null>(null);
  const [proofFeedbackBanner, setProofFeedbackBanner] = useState<{ orderId: string; type: 'success' | 'error'; text: string } | null>(null);

  // Selected document to view Tax Invoice
  const [selectedDoc, setSelectedDoc] = useState<Order | Booking | null>(null);
  const [selectedType, setSelectedType] = useState<'order' | 'booking'>('order');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchCustomerData();
    }
  }, [currentUser]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      // Query orders where customerId === currentUser.uid
      const ordersRef = collection(db, 'orders');
      const ordersQ = query(ordersRef, where('customerId', '==', currentUser?.uid));
      const ordersSnap = await getDocs(ordersQ);
      const fetchedOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(fetchedOrders);

      // Query bookings where customerId === currentUser.uid
      const bookingsRef = collection(db, 'bookings');
      const bookingsQ = query(bookingsRef, where('customerId', '==', currentUser?.uid));
      const bookingsSnap = await getDocs(bookingsQ);
      const fetchedBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      fetchedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error('Error fetching customer records:', err);
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('Missing or insufficient permissions')) {
        try {
          handleFirestoreError(err, OperationType.LIST, 'orders|bookings');
        } catch {
          // Structured error logged
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (order: Order) => {
    const versions = order.proofVersions || [];
    const latestProof = versions[versions.length - 1];
    if (!latestProof) return;

    const nowIso = new Date().toISOString();
    const updatedVersions: ProofVersion[] = versions.map((v, idx) =>
      idx === versions.length - 1
        ? { ...v, status: 'Approved', respondedAt: nowIso }
        : v
    );

    setSubmittingProofAction(order.id);
    setProofFeedbackBanner(null);

    try {
      const payload = {
        proofStatus: 'Approved' as const,
        proofVersions: updatedVersions,
        approvedProofUrl: latestProof.proofUrl,
        approvedAt: nowIso,
        revisionNotes: '',
        updatedAt: nowIso
      };

      await updateDoc(doc(db, 'orders', order.id), payload);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...payload } : o))
      );
      setRevisionOrderId(null);
      setRevisionText('');
      setProofFeedbackBanner({
        orderId: order.id,
        type: 'success',
        text: 'Design proof approved! Our production studio has been notified to proceed with final printing/delivery.'
      });
    } catch (err: any) {
      console.error('Error approving proof:', err);
      setProofFeedbackBanner({
        orderId: order.id,
        type: 'error',
        text: err?.message || 'Unable to submit proof approval. Please contact studio support.'
      });
      if (err?.code === 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
        } catch {
          // logged
        }
      }
    } finally {
      setSubmittingProofAction(null);
    }
  };

  const handleSubmitRevision = async (order: Order) => {
    const cleanNote = revisionText.trim();
    if (!cleanNote) {
      setProofFeedbackBanner({
        orderId: order.id,
        type: 'error',
        text: 'Please describe what changes you need in the revision notes box.'
      });
      return;
    }

    const versions = order.proofVersions || [];
    const nowIso = new Date().toISOString();
    const updatedVersions: ProofVersion[] = versions.map((v, idx) =>
      idx === versions.length - 1
        ? { ...v, status: 'Revision Requested', customerFeedback: cleanNote, respondedAt: nowIso }
        : v
    );

    setSubmittingProofAction(order.id);
    setProofFeedbackBanner(null);

    try {
      const payload = {
        proofStatus: 'Revision Requested' as const,
        proofVersions: updatedVersions,
        revisionNotes: cleanNote,
        updatedAt: nowIso
      };

      await updateDoc(doc(db, 'orders', order.id), payload);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...payload } : o))
      );
      setRevisionOrderId(null);
      setRevisionText('');
      setProofFeedbackBanner({
        orderId: order.id,
        type: 'success',
        text: 'Revision request sent to our designer! We will upload the updated proof shortly.'
      });
    } catch (err: any) {
      console.error('Error requesting proof revision:', err);
      setProofFeedbackBanner({
        orderId: order.id,
        type: 'error',
        text: err?.message || 'Unable to submit revision request.'
      });
      if (err?.code === 'permission-denied') {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
        } catch {
          // logged
        }
      }
    } finally {
      setSubmittingProofAction(null);
    }
  };

  const getProofBadgeClass = (status?: Order['proofStatus']) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Proof Uploaded':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'Revision Requested':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#111111] min-h-screen text-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <SEOHead
        title="My Account — SHIV STUDIO"
        description="View your SHIV STUDIO print orders, wedding invitation proofs, photography bookings, and invoices."
      />
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Portal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2">
              <User className="h-7 w-7 text-[#D4AF37]" />
              <span>Welcome Back, {userProfile?.fullName || 'Client'}</span>
            </h1>
            <p className="text-xxs sm:text-xs text-neutral-400">
              Track print orders, review &amp; approve wedding card proofs, download digital invitations, and view bookings.
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/25 text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Secure Log Out</span>
          </button>
        </div>

        {/* Customer Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800/60">
            <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-2xl font-black mb-3 font-mono">
              {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="font-bold text-white text-base">{userProfile?.fullName}</h3>
            <span className="px-2.5 py-0.5 mt-1 rounded bg-amber-500/15 text-amber-400 font-bold uppercase font-mono text-xxs tracking-wider">
              {userProfile?.role} Account
            </span>
          </div>

          <div className="md:col-span-2 space-y-3 text-xs text-slate-400 font-sans justify-center flex flex-col">
            <p className="flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Email: {userProfile?.email}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Phone: {userProfile?.phone}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>Billing Address: {userProfile?.address || 'Not specified'}</span>
            </p>
          </div>
        </div>

        {/* Active bookings & historic order lists */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => <div key={n} className="bg-[#1A1A1A] h-32 rounded-3xl border border-white/10"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs sm:text-sm items-start">

            {/* Shoot Bookings List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <Calendar className="h-4.5 w-4.5 text-amber-500" />
                <span>Shoot Appointment History</span>
              </h3>

              {bookings.length === 0 ? (
                <p className="text-slate-500 text-xs py-4">You have no active or historical portrait session bookings.</p>
              ) : (
                <div className="space-y-4 max-h-[34rem] overflow-y-auto pr-1">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-xxs text-slate-500 font-mono">#{booking.id}</span>
                        <h4 className="font-bold text-white mt-0.5">{booking.serviceTitle}</h4>
                        <p className="text-xxs text-slate-400 mt-1">{booking.date} at {booking.time}</p>
                        <p className="text-emerald-400 font-bold text-xxs mt-0.5">Advance paid: ₹{booking.advancePaid.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                          booking.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {booking.status}
                        </span>
                        <button
                          onClick={() => { setSelectedDoc(booking); setSelectedType('booking'); }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Print Orders & Wedding Invitation Proof Workflow List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-3">
                <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
                <span>Orders, Proofs &amp; Invitations</span>
              </h3>

              {orders.length === 0 ? (
                <p className="text-slate-500 text-xs py-4">You have no active or historical product print or invitation orders.</p>
              ) : (
                <div className="space-y-4 max-h-[42rem] overflow-y-auto pr-1">
                  {orders.map((order) => {
                    const isWeddingCardOrder = Boolean(
                      order.hasWeddingCards || order.items.some((i) => i.itemType === 'wedding_card')
                    );
                    const proofVersions = order.proofVersions || [];
                    const latestProof = proofVersions[proofVersions.length - 1];
                    const canReviewProof =
                      isWeddingCardOrder &&
                      order.status !== 'Delivered' &&
                      order.status !== 'Cancelled' &&
                      (order.proofStatus === 'Proof Uploaded' || order.proofStatus === 'Revision Requested') &&
                      Boolean(latestProof);

                    return (
                      <div key={order.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 space-y-3 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 pr-2 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xxs text-slate-500 font-mono">#{order.id}</span>
                              {isWeddingCardOrder && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                                  INVITATION ORDER
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-white truncate max-w-[260px]">
                              {order.items.map(i => i.productTitle).join(', ')}
                            </h4>
                            <p className="text-xxs text-slate-400">Paid: ₹{order.total.toLocaleString('en-IN')}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="text-amber-500 font-semibold text-xxs font-mono uppercase">
                                Order: {order.status}
                              </span>
                              {isWeddingCardOrder && (
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono uppercase ${getProofBadgeClass(order.proofStatus)}`}>
                                  Proof: {order.proofStatus || 'Awaiting Proof'}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => { setSelectedDoc(order); setSelectedType('order'); }}
                            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl flex items-center gap-1 font-bold text-xxs transition-all shrink-0"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Invoice</span>
                          </button>
                        </div>

                        {order.customerRemark && (
                          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 font-sans">
                            <span className="font-bold uppercase text-[9px] text-amber-400 block font-mono">Remark:</span>
                            "{order.customerRemark}"
                          </div>
                        )}

                        {/* Wedding Card Customization Overview */}
                        {isWeddingCardOrder && order.weddingCardCustomization && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1 text-[11px] text-slate-300">
                            <p className="font-bold text-[#D4AF37] flex items-center gap-1.5 uppercase font-mono text-[10px]">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Invitation Details ({order.weddingCardCustomization.language})</span>
                            </p>
                            <p className="font-semibold text-white">
                              {order.weddingCardCustomization.groomName} weds {order.weddingCardCustomization.brideName}
                            </p>
                            <p className="text-slate-400">
                              {order.weddingCardCustomization.weddingDate}
                              {order.weddingCardCustomization.weddingTime ? ` at ${order.weddingCardCustomization.weddingTime}` : ''} — {order.weddingCardCustomization.venueName}
                            </p>
                          </div>
                        )}

                        {/* Feedback Banner */}
                        {proofFeedbackBanner?.orderId === order.id && (
                          <div className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                            proofFeedbackBanner.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}>
                            {proofFeedbackBanner.type === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            )}
                            <span>{proofFeedbackBanner.text}</span>
                          </div>
                        )}

                        {/* Design Proof Preview & Approval Controls */}
                        {isWeddingCardOrder && latestProof && (
                          <div className="bg-[#161616] border border-[#D4AF37]/30 rounded-xl p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-bold uppercase text-[#D4AF37] flex items-center gap-1.5">
                                <FileCheck2 className="h-3.5 w-3.5" />
                                <span>Design Proof v{latestProof.version}</span>
                              </span>
                              <a
                                href={isFsMediaUrl(latestProof.proofUrl) ? '#download-proof' : latestProof.proofUrl}
                                target={isFsMediaUrl(latestProof.proofUrl) ? undefined : '_blank'}
                                rel={isFsMediaUrl(latestProof.proofUrl) ? undefined : 'noopener noreferrer'}
                                onClick={(e) => {
                                  if (isFsMediaUrl(latestProof.proofUrl)) {
                                    e.preventDefault();
                                    downloadOriginalFile(
                                      latestProof.proofUrl,
                                      latestProof.fileName || `Proof_v${latestProof.version}`
                                    );
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>{isFsMediaUrl(latestProof.proofUrl) ? 'Download Full Proof' : 'Open Full Proof'}</span>
                              </a>
                            </div>

                            {latestProof.fileType === 'video' ? (
                              <StudioVideo
                                src={latestProof.proofUrl}
                                controls
                                className="w-full max-h-56 rounded-lg border border-slate-800 bg-black"
                              />
                            ) : latestProof.fileType === 'pdf' ? (
                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-5 w-5 text-amber-400 shrink-0" />
                                  <span className="truncate text-slate-200 font-medium">{latestProof.fileName || `Proof_v${latestProof.version}.pdf`}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => downloadOriginalFile(latestProof.proofUrl, latestProof.fileName || `Proof_v${latestProof.version}.pdf`)}
                                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[10px] shrink-0"
                                >
                                  Download PDF
                                </button>
                              </div>
                            ) : (
                              <StudioImage
                                src={latestProof.proofUrl}
                                alt={`Proof v${latestProof.version}`}
                                className="w-full max-h-60 object-contain rounded-lg border border-slate-800 bg-black"
                              />
                            )}

                            {latestProof.notes && (
                              <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                <span className="text-slate-500 font-semibold">Studio Designer Note: </span>
                                {latestProof.notes}
                              </p>
                            )}

                            {/* Proof Versions Trail */}
                            {proofVersions.length > 1 && (
                              <div className="pt-1 border-t border-slate-800 flex flex-wrap gap-1.5">
                                {proofVersions.map((pv) => (
                                  <a
                                    key={pv.version}
                                    href={isFsMediaUrl(pv.proofUrl) ? '#download-proof' : pv.proofUrl}
                                    target={isFsMediaUrl(pv.proofUrl) ? undefined : '_blank'}
                                    rel={isFsMediaUrl(pv.proofUrl) ? undefined : 'noopener noreferrer'}
                                    onClick={(e) => {
                                      if (isFsMediaUrl(pv.proofUrl)) {
                                        e.preventDefault();
                                        downloadOriginalFile(
                                          pv.proofUrl,
                                          pv.fileName || `Proof_v${pv.version}`
                                        );
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                      pv.status === 'Approved'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : pv.status === 'Revision Requested'
                                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                          : 'bg-slate-900 border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    v{pv.version}: {pv.status}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Approval / Revision Controls */}
                            {canReviewProof && (
                              <div className="space-y-2 pt-1">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={submittingProofAction === order.id}
                                    onClick={() => handleApproveProof(order)}
                                    className="flex-1 min-w-[140px] py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>{submittingProofAction === order.id ? 'Saving...' : 'Approve Proof for Print'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingProofAction === order.id}
                                    onClick={() => {
                                      if (revisionOrderId === order.id) {
                                        setRevisionOrderId(null);
                                      } else {
                                        setRevisionOrderId(order.id);
                                        setRevisionText(order.revisionNotes || '');
                                      }
                                    }}
                                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-rose-300 font-bold rounded-lg text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Request Revision</span>
                                  </button>
                                </div>

                                {revisionOrderId === order.id && (
                                  <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-rose-500/20">
                                    <textarea
                                      rows={2}
                                      value={revisionText}
                                      onChange={(e) => setRevisionText(e.target.value)}
                                      placeholder="Mention exact corrections (spelling, date, venue, font color, photo crop)..."
                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setRevisionOrderId(null)}
                                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-[11px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={submittingProofAction === order.id}
                                        onClick={() => handleSubmitRevision(order)}
                                        className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded text-[11px]"
                                      >
                                        Send Revision Notes
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {order.proofStatus === 'Approved' && order.approvedAt && (
                              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approved on {new Date(order.approvedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {isWeddingCardOrder && !latestProof && (
                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400">
                            Our designer is preparing your digital proof. You will be able to preview and approve it right here before final printing.
                          </div>
                        )}

                        {/* Final Digital Invitation Deliverable Download */}
                        {order.digitalDeliverableUrl && (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                                Digital Invitation Ready
                              </span>
                              <p className="text-xs font-semibold text-white truncate max-w-[220px]">
                                {order.digitalDeliverableName || 'Final Approved Digital Invitation'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadOriginalFile(order.digitalDeliverableUrl!, order.digitalDeliverableName || `SHIV_STUDIO_${order.id}`)}
                              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download Digital Invite</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INVOICE MODAL VIEW */}
      {selectedDoc && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentData={selectedDoc}
          type={selectedType}
        />
      )}
    </div>
  );
};

