"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

// Separate component that uses useSearchParams
function GuestRegistrationContent() {
  const params = useSearchParams();
  const bookingId = params.get("booking_id");

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (bookingId) loadData();
  }, [bookingId]);

  async function loadData() {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        check_in,
        check_out,
        guests (*),
        rooms (room_number)
      `)
      .eq("id", bookingId)
      .single();

    if (!error) setData(data);
  }

  if (!data) return <div className="p-6">Loading GRC…</div>;

  const guest = data.guests;
  const isForeign = guest.nationality !== "Indian";

  return (
    <div className="print-container">
      {/* HEADER */}
      <div className="header">
        <Image src="/logo.png" alt="Logo" width={80} height={80} />
        <h1>MOUNTAINPASS RESIDENCY</h1>
        <p>
          Anamari, Vazhikkadavu, Kerala – 679333 <br />
          Phone: 8086781333 | GSTIN: 32ALJPV1228JZN
        </p>
        <h2>GUEST REGISTRATION CARD</h2>
      </div>

      {/* GUEST INFO */}
      <section className="section">
        <h3>Guest Information</h3>
        <div className="grid">
          <div><b>Name:</b> {guest.name}</div>
          <div><b>Room No:</b> {data.rooms?.room_number}</div>
          <div><b>Phone:</b> {guest.phone}</div>
          <div><b>Email:</b> {guest.email}</div>
          <div><b>Address:</b> {guest.address}</div>
          <div><b>Nationality:</b> {guest.nationality}</div>
          <div><b>Purpose of Visit:</b> {guest.purpose_of_visit}</div>
          <div><b>Pax:</b> {guest.pax}</div>
        </div>
      </section>

      {/* FOREIGN DETAILS */}
      {isForeign && (
        <section className="section">
          <h3>Passport / Visa Details</h3>
          <div className="grid">
            <div><b>Passport No:</b> {guest.passport_number}</div>
            <div><b>Place of Issue:</b> {guest.passport_place_of_issue}</div>
            <div><b>Date of Issue:</b> {guest.passport_issue_date}</div>
            <div><b>Date of Expiry:</b> {guest.passport_expiry_date}</div>
            <div><b>Visa Type:</b> {guest.visa_type}</div>
            <div><b>Visa No:</b> {guest.visa_number}</div>
            <div><b>Date of Arrival in India:</b> {guest.date_of_arrival_in_india}</div>
            <div><b>Duration of Stay:</b> {guest.duration_of_stay} days</div>
          </div>
        </section>
      )}

      {/* CHECKIN INFO */}
      <section className="section">
        <h3>Reservation / Check-In Information</h3>
        <div className="grid">
          <div><b>Arrival:</b> {data.check_in}</div>
          <div><b>Departure:</b> {data.check_out}</div>
          <div><b>Meal Plan:</b> {guest.meal_plan}</div>
        </div>
      </section>

      {/* SIGNATURES */}
      <div className="signatures">
        <div>Guest Signature</div>
        <div>FO / Duty Manager</div>
      </div>

      {/* PRINT */}
      <button className="print-btn" onClick={() => window.print()}>
        Print
      </button>

      {/* STYLES */}
      <style jsx>{`
        .print-container {
          width: 210mm;
          min-height: 297mm;
          padding: 16mm;
          font-family: Arial, sans-serif;
          color: #000;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 12px;
        }
        h1 { font-size: 20px; margin: 4px 0; }
        h2 { margin-top: 8px; }
        .section {
          margin-top: 14px;
          border: 1px solid #000;
          padding: 8px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          font-size: 13px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .print-btn {
          margin-top: 20px;
          padding: 8px 16px;
        }
        @media print {
          .print-btn { display: none; }
        }
      `}</style>
    </div>
  );
}

// Main page component with Suspense boundary
export default function GuestRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guest registration...</p>
        </div>
      </div>
    }>
      <GuestRegistrationContent />
    </Suspense>
  );
}