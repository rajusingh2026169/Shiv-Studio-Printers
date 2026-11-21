import React from 'react';
import { SEOHead } from '../components/SEOHead';

export const TermsConditions: React.FC = () => {
  return (
    <div className="bg-[#111111] text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Terms & Conditions — SHIV STUDIO"
        description="Terms and Conditions governing photography bookings, album design proofing, custom printing orders, and pricing at SHIV STUDIO, Khaga, Fatehpur."
        canonicalPath="/terms-conditions"
      />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
            Service Terms
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-neutral-400">
            SHIV STUDIO (Creative Brand: Arvind Creation) • Khaga, Fatehpur, Uttar Pradesh – 212655
          </p>
        </div>

        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">1. Booking &amp; Date Reservation</h2>
            <p>
              Photography, videography, and drone coverage dates are confirmed once booking terms are agreed upon and any applicable slot reservation advance is recorded. Outstation travel, accommodation, and special location permits (if applicable outside Fatehpur district) are coordinated transparently in advance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">2. Album Designing &amp; Custom Print Approvals</h2>
            <p>
              For wedding albums, graphic designs, invitations, photo frames, and customized gifts, final printing begins after client confirmation of the digital layout proof. Please carefully review names, dates, and photo resolution prior to final production approval.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">3. Delivery Timelines</h2>
            <p>
              Edited event highlights and full photo sets follow the schedule specified in your chosen package. Custom framed prints and physical albums require standard finishing time for color proofing, lamination, and binding quality checks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">4. Pricing, Variants &amp; Taxes</h2>
            <p>
              Product pricing reflects the exact selected size or variant saved in our studio catalog at order verification time. Optional GST applies strictly where configured for specific products or invoices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">5. Jurisdiction</h2>
            <p>
              All service agreements, custom print transactions, and legal matters are governed by the laws of India and subject to Khaga / Fatehpur, Uttar Pradesh jurisdiction.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
