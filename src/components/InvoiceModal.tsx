import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { X, Download, Printer, CheckCircle, ShieldCheck, Check, Clock, AlertTriangle, RotateCcw, Camera } from 'lucide-react';
import { Order, Booking } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: Order | Booking | null;
  type: 'order' | 'booking';
  isNewSuccess?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, documentData, type, isNewSuccess }) => {
  const [showFullInvoice, setShowFullInvoice] = useState(false);
  const [settings, setSettings] = useState<any>({
    studioName: 'Shiv Studio & Printers',
    phone: '+91 7905256355, +91 8765706396',
    email: 'shivsharan52796@gmail.com',
    address: 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India',
    gstNumber: '09AAAAA1111A1Z1',
    upiId: 'shivsharan52796@okaxis'
  });

  useEffect(() => {
    if (isOpen) {
      setShowFullInvoice(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'website_settings', 'studio'));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error('Error fetching settings in InvoiceModal:', err);
      }
    };
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen || !documentData) return null;

  const order = type === 'order' ? (documentData as Order) : null;
  const booking = type === 'booking' ? (documentData as Booking) : null;

  // Determine GST Enabled status
  const isGstEnabled = order 
    ? (order.gstEnabled !== false && (order.gst > 0 || order.gstEnabled === true))
    : (booking ? (booking.gstEnabled === true || (booking.gstAmount !== undefined && booking.gstAmount > 0)) : false);

  const gstPercentage = order?.gstPercentage || booking?.gstPercentage || 18;
  const gstAmount = order ? order.gst : (booking?.gstAmount || 0);

  // Determine Payment Status
  const paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' = 
    documentData.paymentStatus || 
    (documentData.status === 'Cancelled' 
      ? 'Failed' 
      : (order ? (order.paymentId ? 'Paid' : 'Pending') : (booking ? (booking.advancePaid > 0 ? 'Paid' : 'Pending') : 'Pending')));

  const paymentMethod = documentData.paymentMethod || 'UPI / Online';
  const transactionId = order?.paymentId || (documentData as any).paymentId || `TXN_${documentData.id.slice(0, 10).toUpperCase()}`;
  const paymentDate = documentData.paymentDate 
    ? new Date(documentData.paymentDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date(documentData.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const amountPaid = order ? (order.paymentAmount || order.total) : (booking ? booking.advancePaid : 0);
  const advanceAmount = booking ? booking.advancePaid : (order?.advancePaid || 0);
  const dueAmount = booking ? (booking.totalPrice - booking.advancePaid) : (order?.dueAmount || 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 48, 'F');

    // Studio Header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text((settings.studioName || 'SHIV STUDIO & PRINTERS').toUpperCase(), 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(settings.address || 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India', 15, 25);
    doc.text(`Mobile: ${settings.phone || '+91 7905256355, +91 8765706396'} | Email: ${settings.email || 'shivsharan52796@gmail.com'}`, 15, 31);
    
    if (isGstEnabled) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${settings.gstNumber || '09AAAAA1111A1Z1'}`, 15, 37);
    }

    // Document Type & Number
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(type === 'order' ? 'TAX INVOICE' : 'BOOKING RECEIPT', 140, 20);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: #${documentData.id.slice(0, 10).toUpperCase()}`, 140, 27);
    doc.text(`Date: ${new Date(documentData.createdAt).toLocaleDateString('en-IN')}`, 140, 33);
    doc.text(`Status: ${paymentStatus.toUpperCase()}`, 140, 39);

    // Billed To Section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CUSTOMER / BILLED TO:', 15, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Name: ${documentData.customerName}`, 15, 65);
    doc.text(`Mobile: ${documentData.customerPhone}`, 15, 71);
    doc.text(`Email: ${documentData.customerEmail}`, 15, 77);
    doc.text(`Address: ${documentData.address || 'Studio Self-Pickup'}`, 15, 83);

    // Visual divider
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 89, 195, 89);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 95, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description / Item Details', 18, 100);
    doc.text('Qty', 125, 100);
    doc.text('Price (INR)', 145, 100);
    doc.text('Total (INR)', 175, 100);

    let startY = 110;
    doc.setFont('helvetica', 'normal');

    if (type === 'order' && order) {
      order.items.forEach((item) => {
        doc.text(item.productTitle, 18, startY);
        doc.text(item.quantity.toString(), 125, startY);
        doc.text(`Rs. ${item.price.toFixed(2)}`, 145, startY);
        doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 175, startY);
        startY += 8;
      });

      doc.line(15, startY + 2, 195, startY + 2);
      startY += 10;

      // Price Breakdown
      doc.text('Subtotal:', 130, startY);
      doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 170, startY);
      startY += 6;

      if (isGstEnabled) {
        doc.text(`GST (${gstPercentage}%):`, 130, startY);
        doc.text(`Rs. ${gstAmount.toFixed(2)}`, 170, startY);
        startY += 6;
      }

      doc.text('Shipping:', 130, startY);
      doc.text(`Rs. ${order.shipping.toFixed(2)}`, 170, startY);
      startY += 6;

      if (order.discount > 0) {
        doc.text(`Discount (${order.couponCode || 'PROMO'}):`, 130, startY);
        doc.text(`-Rs. ${order.discount.toFixed(2)}`, 170, startY);
        startY += 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text('Grand Total:', 130, startY);
      doc.text(`Rs. ${order.total.toFixed(2)}`, 170, startY);

    } else if (booking) {
      doc.text(booking.serviceTitle, 18, startY);
      doc.text('1', 125, startY);
      doc.text(`Rs. ${booking.totalPrice.toFixed(2)}`, 145, startY);
      doc.text(`Rs. ${booking.totalPrice.toFixed(2)}`, 175, startY);
      
      startY += 12;
      doc.line(15, startY, 195, startY);
      startY += 10;

      doc.text('Total Service Fee:', 130, startY);
      doc.text(`Rs. ${booking.totalPrice.toFixed(2)}`, 170, startY);
      startY += 6;

      if (isGstEnabled && gstAmount > 0) {
        doc.text(`GST (${gstPercentage}%):`, 130, startY);
        doc.text(`Rs. ${gstAmount.toFixed(2)}`, 170, startY);
        startY += 6;
      }

      doc.text('Advance Paid:', 130, startY);
      doc.text(`Rs. ${booking.advancePaid.toFixed(2)}`, 170, startY);
      startY += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Balance Due:', 130, startY);
      doc.text(`Rs. ${(booking.totalPrice - booking.advancePaid).toFixed(2)}`, 170, startY);
    }

    // PAYMENT INFORMATION SECTION (NO QR CODE!)
    startY += 18;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(15, startY, 180, 42, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PAYMENT INFORMATION', 20, startY + 8);

    // Status Badge
    if (paymentStatus === 'Paid') {
      doc.setFillColor(16, 185, 129); // green-500
      doc.setTextColor(255, 255, 255);
      doc.rect(130, startY + 4, 60, 6, 'F');
      doc.setFontSize(8);
      doc.text('PAYMENT SUCCESSFUL', 135, startY + 8.5);
    } else {
      doc.setFillColor(245, 158, 11); // amber-500
      doc.setTextColor(255, 255, 255);
      doc.rect(130, startY + 4, 60, 6, 'F');
      doc.setFontSize(8);
      doc.text('PAYMENT PENDING', 138, startY + 8.5);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    
    doc.text(`Payment Status: ${paymentStatus === 'Paid' ? 'Paid (Successful)' : paymentStatus}`, 20, startY + 16);
    doc.text(`Payment Method: ${paymentMethod}`, 20, startY + 22);
    doc.text(`Transaction ID / UTR: ${transactionId}`, 20, startY + 28);
    doc.text(`Payment Date & Time: ${paymentDate}`, 20, startY + 34);

    doc.text(`Amount Paid: Rs. ${amountPaid.toFixed(2)}`, 110, startY + 16);
    if (booking) {
      doc.text(`Advance Amount: Rs. ${advanceAmount.toFixed(2)}`, 110, startY + 22);
      doc.text(`Due Amount: Rs. ${dueAmount.toFixed(2)}`, 110, startY + 28);
    } else {
      doc.text(`Due Amount: Rs. ${dueAmount.toFixed(2)}`, 110, startY + 22);
    }

    // Terms & Sign off
    startY += 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TERMS & CONDITIONS:', 15, startY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Goods & Services once delivered/completed are subject to Shiv Studio & Printers terms.', 15, startY + 5);
    doc.text('2. All disputes are subject to Khaga/Fatehpur jurisdiction only.', 15, startY + 9);
    doc.text('3. This is a computer generated digital Tax Invoice.', 15, startY + 13);

    // Authorized Signature
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('For SHIV STUDIO & PRINTERS', 140, startY + 8);
    doc.line(140, startY + 20, 190, startY + 20);
    doc.text('Authorized Signature', 145, startY + 24);

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Thank you for choosing Shiv Studio & Printers!', 105, 285, { align: 'center' });

    doc.save(`Invoice_${documentData.id.slice(0, 10).toUpperCase()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isNewSuccess && !showFullInvoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center text-white">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-emerald-500/15 rounded-full text-emerald-400 animate-bounce">
              <CheckCircle className="h-16 w-16" />
            </div>
          </div>
          
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Payment Successful! 🎉
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your payment has been received and order has been placed successfully. 
            हमारा डिज़ाइनर जल्द ही आपसे संपर्क करेगा।
          </p>

          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Order ID</span>
              <span className="font-mono font-bold text-slate-300">#{documentData.id.slice(0, 10).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-emerald-400">₹{amountPaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Payment Status</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[10px]">✓ PAYMENT SUCCESSFUL</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowFullInvoice(true)}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider"
            >
              📄 View Detailed Invoice (बिल देखें)
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs uppercase tracking-wider border border-slate-700"
            >
              ✕ Close & Continue (बंद करें)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Invoice Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span>{isGstEnabled ? 'GST Professional Invoice' : 'Tax & Booking Invoice'}</span>
            </h2>
            <p className="text-xs text-slate-400">Invoice ID: #{documentData.id.toUpperCase()}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

        {isNewSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-4 text-emerald-400">
            <div className="p-3 bg-emerald-500/15 rounded-full shrink-0 text-emerald-400 animate-pulse">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-white">Order Placed Successfully! 🎉</h3>
              <p className="text-xs text-slate-300 leading-normal">
                Thank you for your order! It has been successfully saved in our database. You can download your official Invoice below or view details of your order.
              </p>
              <div className="pt-1 flex flex-wrap justify-center sm:justify-start items-center gap-2 text-[10px] font-semibold tracking-wider font-mono uppercase">
                <span className="text-emerald-500">Invoice: #{documentData.id.toUpperCase()}</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400">Status: PAYMENT SUCCESSFUL</span>
              </div>
            </div>
          </div>
        )}

        {/* Printable Section */}
        <div id="printable-invoice" className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-300 font-sans text-sm leading-relaxed">
          
          {/* Header Layout */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <Camera className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
                  {settings.studioName || 'SHIV STUDIO & PRINTERS'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">{settings.address || 'Kishanpur Road, Over Bridge ke Niche, Khaga, Fatehpur, Uttar Pradesh, India'}</p>
                <p className="text-xs text-slate-400">
                  Mobile: {settings.phone || '+91 7905256355, +91 8765706396'} | Email: {settings.email || 'shivsharan52796@gmail.com'}
                </p>
                {isGstEnabled && (
                  <p className="text-xs font-semibold text-amber-400 mt-0.5">
                    GSTIN: {settings.gstNumber || '09AAAAA1111A1Z1'}
                  </p>
                )}
              </div>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-block px-3 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
                {type === 'order' ? 'Tax Invoice' : 'Booking Invoice'}
              </span>
              <p className="text-xs text-slate-400 mt-2">No: #{documentData.id.slice(0, 10).toUpperCase()}</p>
              <p className="text-xs text-slate-400">Date: {new Date(documentData.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Billed To / Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div>
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Customer Details (Billed To)</p>
              <p className="text-white font-semibold mt-1">{documentData.customerName}</p>
              <p className="text-xs text-slate-400">{documentData.customerEmail}</p>
              <p className="text-xs text-slate-400">Mobile: {documentData.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide">Billing & Delivery Address</p>
              <p className="text-xs text-slate-300 mt-1">{documentData.address || 'Studio Self-Pickup'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-white font-semibold uppercase tracking-wide">
                  <th className="py-2.5 px-4 rounded-l-lg">Item / Service Details</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {order ? (
                  order.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-900 hover:bg-slate-900/20">
                      <td className="py-3 px-4 font-semibold text-white">{item.productTitle}</td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : booking ? (
                  <tr className="border-b border-slate-900">
                    <td className="py-3 px-4 font-semibold text-white">
                      {booking.serviceTitle}
                      <p className="text-xxs text-slate-400 font-normal mt-0.5">Shoot Scheduled on {booking.date} at {booking.time}</p>
                    </td>
                    <td className="py-3 px-4 text-center">1</td>
                    <td className="py-3 px-4 text-right">₹{booking.totalPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-white">₹{booking.totalPrice.toLocaleString('en-IN')}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Price Calculations */}
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-800">
            <div className="w-full md:w-1/2 space-y-1.5 text-xs text-right">
              {order ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {isGstEnabled && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST ({gstPercentage}%):</span>
                      <span className="text-white font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping:</span>
                    <span className="text-white">₹{order.shipping.toLocaleString('en-IN')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Promo Discount ({order.couponCode || 'PROMO'}):</span>
                      <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-amber-400 border-t border-slate-800 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : booking ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Booking Fee:</span>
                    <span className="text-white font-medium">₹{booking.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {isGstEnabled && gstAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">GST ({gstPercentage}%):</span>
                      <span className="text-white font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Advance Paid:</span>
                    <span className="text-white">₹{booking.advancePaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-400 border-t border-slate-800 pt-2">
                    <span>Balance Due at Venue:</span>
                    <span>₹{(booking.totalPrice - booking.advancePaid).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* PAYMENT INFORMATION SECTION (NO QR CODE AT ALL) */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Payment Information</h4>
                </div>

                {/* Status Badges */}
                {paymentStatus === 'Paid' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold font-mono tracking-wide">
                    <Check className="h-3.5 w-3.5" />
                    <span>✓ PAYMENT SUCCESSFUL</span>
                  </span>
                )}

                {paymentStatus === 'Pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold font-mono tracking-wide">
                    <Clock className="h-3.5 w-3.5" />
                    <span>PAYMENT PENDING</span>
                  </span>
                )}

                {paymentStatus === 'Failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold font-mono tracking-wide">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>✗ PAYMENT FAILED</span>
                  </span>
                )}

                {paymentStatus === 'Refunded' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-extrabold font-mono tracking-wide">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>↺ REFUNDED</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Payment Method</span>
                  <span className="font-semibold text-slate-200">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Transaction ID / UTR</span>
                  <span className="font-mono font-bold text-amber-400">{transactionId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Payment Date & Time</span>
                  <span className="font-semibold text-slate-200">{paymentDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Amount Paid</span>
                  <span className="font-bold text-emerald-400">₹{amountPaid.toLocaleString('en-IN')}</span>
                </div>
                {booking && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Advance Amount</span>
                    <span className="font-bold text-slate-200">₹{advanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-[11px] block">Due Amount / Remaining Balance</span>
                  <span className={dueAmount > 0 ? "font-bold text-amber-400" : "font-bold text-emerald-400"}>
                    ₹{dueAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Authorized Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800 text-xxs text-slate-400">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-300 mb-1">Terms & Conditions</p>
              <ul className="list-disc pl-3 space-y-0.5">
                <li>Goods & services once delivered/completed are subject to Shiv Studio terms.</li>
                <li>All legal disputes are subject to Khaga/Fatehpur jurisdiction.</li>
                <li>Computer-generated digital Tax Invoice — no physical signature required.</li>
              </ul>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              <p className="font-bold text-slate-300 mb-6">For SHIV STUDIO & PRINTERS</p>
              <div className="w-40 border-b border-slate-700 mb-1"></div>
              <p className="text-amber-500 font-semibold font-mono uppercase">Authorized Signature</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
