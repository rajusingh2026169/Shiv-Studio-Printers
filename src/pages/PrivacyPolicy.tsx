import React from 'react';
import { SEOHead } from '../components/SEOHead';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-[#111111] text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Privacy Policy — SHIV STUDIO"
        description="Privacy Policy for SHIV STUDIO (Arvind Creation), Khaga, Fatehpur — how we protect client photographs, booking details, and print orders."
        canonicalPath="/privacy-policy"
      />
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold">
            Legal Information
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-400">
            SHIV STUDIO (Creative Brand: Arvind Creation) • Kishanpur Road Over Bridge, Khaga, Fatehpur, UP – 212655
          </p>
        </div>

        <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">1. Information We Collect</h2>
            <p>
              When you submit a photography booking, enquiry, or custom print order with SHIV STUDIO, we collect your name, mobile/WhatsApp number, optional email address, event date/venue details, delivery address, and customization photographs/files uploaded specifically for your order.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">2. Client Photograph &amp; Media Confidentiality</h2>
            <p>
              Files uploaded through our Online File Upload Center and original wedding/portrait RAW/JPG deliverables remain strictly dedicated to fulfilling your printing, album designing, or photography order. We never sell or distribute private family media to third parties. Portfolio publication occurs only for curated promotional showcases when authorized by the client.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">3. Data Storage &amp; Security</h2>
            <p>
              Booking enquiries, print orders, and invoices are securely stored using Google Firebase Authentication and Cloud Firestore with access controls restricting private customer records to the account owner and authorized studio administrators.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">4. Communication &amp; WhatsApp Updates</h2>
            <p>
              Contact information is used solely to coordinate shoot timings, design proofs, order delivery status updates, and digital invoice generation via phone, email, or WhatsApp.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-white font-semibold">5. Contact for Privacy Requests</h2>
            <p>
              To request updates or deletion of stored client records or uploaded print files, please email <span className="text-[#D4AF37]">shivsharan52796@gmail.com</span> or call <span className="text-[#D4AF37]">+91 7905256355</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
