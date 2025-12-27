"use client";

import React, { useState, useRef } from 'react';
import { Search, Printer } from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  pin_code?: string;
  nationality?: string;
  passport_number?: string;
  passport_place_of_issue?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  visa_type?: string;
  visa_number?: string;
  visa_issue_place?: string;
  visa_issue_date?: string;
  visa_expiry_date?: string;
  date_of_arrival_in_india?: string;
  duration_of_stay?: number;
  purpose_of_visit?: string;
  company_name?: string;
  room_ids?: string[];
  check_in?: string;
  check_out?: string;
  base_amount?: number;
  advance_payment?: number;
  pax?: number;
  status?: string;
}

interface Booking {
  id: string;
  room_id?: string;
  check_in?: string;
  check_out?: string;
  base_amount?: number;
  advance_amount?: number;
}

const GuestRegistrationForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch guests based on search
  const searchGuests = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Always use the phone lookup for now since /api/guests doesn't support GET
      // Clean the search query to extract just numbers
      const cleanQuery = searchQuery.trim().replace(/[\s\-()]/g, '');
      
      const response = await fetch(`/api/guests/lookup?phone=${encodeURIComponent(cleanQuery)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('No guest found with this phone number. Please search using the guest\'s phone number.');
          setGuests([]);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Phone lookup response:', data);
      
      // The phone lookup returns a single guest object, not an array
      if (data && data.id) {
        setGuests([data]);
      } else {
        setGuests([]);
        alert('No guest found');
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      alert(`Failed to search guests. Please search using the guest's phone number.`);
      setGuests([]);
    }
    setLoading(false);
  };

  // When clicking a guest from search, just use that data directly
  const selectGuest = async (guest: Guest) => {
    setLoading(true);
    setSelectedGuest(guest);
    
    // Try to fetch additional booking details if available
    try {
      const bookingResponse = await fetch(`/api/guest/dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guest_id: guest.id }),
      });
      
      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        console.log('Booking data:', bookingData);
        
        // Handle different possible response structures
        if (bookingData.booking) {
          setBookingDetails(bookingData.booking);
        } else if (bookingData.data) {
          setBookingDetails(bookingData.data);
        } else if (bookingData.id) {
          setBookingDetails(bookingData);
        }
      } else {
        console.log('No booking details available, using guest data only');
        setBookingDetails(null);
      }
    } catch (error) {
      console.log('Could not fetch booking details:', error);
      setBookingDetails(null);
    }
    
    setLoading(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const windowPrint = window.open('', '', 'width=800,height=600');
    if (!windowPrint) return;
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Guest Registration Card</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 10pt;
              margin: 0;
              padding: 20px;
            }
            .form-container {
              border: 2px solid #000;
              padding: 15px;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
            }
            .logo {
              width: 80px;
              height: auto;
              margin-bottom: 5px;
            }
            .resort-name {
              font-size: 18pt;
              font-weight: bold;
              margin: 5px 0;
            }
            .resort-details {
              font-size: 9pt;
              line-height: 1.4;
            }
            .form-title {
              font-size: 14pt;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            td {
              border: 1px solid #000;
              padding: 4px 6px;
              font-size: 9pt;
            }
            .label {
              font-weight: bold;
              width: 25%;
            }
            .value {
              width: 25%;
            }
            .section-header {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
              padding: 6px;
            }
            .terms {
              font-size: 7pt;
              line-height: 1.3;
              margin-top: 10px;
              page-break-inside: avoid;
            }
            .terms-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .signature-box {
              width: 45%;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 40px;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const isForeignNational = selectedGuest?.nationality && selectedGuest.nationality !== 'Indian';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Guest Registration Card</h1>
          
                      <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by phone number (e.g., 9876543210)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchGuests()}
                />
              </div>
            </div>
            <button
              onClick={searchGuests}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Guest Search Results */}
          {guests.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => selectGuest(guest)}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{guest.name}</h3>
                      <p className="text-sm text-gray-600">Phone: {guest.phone}</p>
                      {guest.email && <p className="text-sm text-gray-600">Email: {guest.email}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      guest.status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guest.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration Form Preview & Print */}
        {selectedGuest && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Registration Card Preview</h2>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Printer size={20} />
                Print Card
              </button>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="bg-white">
              <div className="form-container">
                {/* Header */}
                <div className="header">
                  <div className="resort-name">MOUNTAINPASS RESIDENCY</div>
                  <div className="resort-details">
                    Anamari, Vazhikkadavu Kerala Nilambur, Malappuram 679333<br />
                    Phone: 8086781333<br />
                    email: Mountainpassresidency@gmail.com Web: www.mountainpass.in<br />
                    GSTIN: 32ALIPV1222B1ZN State: KERALA
                  </div>
                </div>

                <div className="form-title">GUEST REGISTRATION CARD</div>

                {/* Guest Information Section */}
                <table>
                  <tbody>
                  <tr>
                    <td className="section-header" colSpan={4}>Guest Information</td>
                  </tr>
                  <tr>
                    <td className="label">Guest:</td>
                    <td className="value" colSpan={1}>{selectedGuest.name}</td>
                    <td className="label">Reg No:</td>
                    <td className="value">{bookingDetails?.id?.slice(0, 8).toUpperCase() || ''}</td>
                  </tr>
                  <tr>
                    <td className="label">Company:</td>
                    <td className="value">{selectedGuest.company_name || ':'}</td>
                    <td className="label">Room No:</td>
                    <td className="value">{bookingDetails?.room_id || selectedGuest.room_ids?.[0] || ''}</td>
                  </tr>
                  <tr>
                    <td className="label">Address 1:</td>
                    <td className="value" colSpan={3}>{selectedGuest.address || ':'}</td>
                  </tr>
                  <tr>
                    <td className="label">City:</td>
                    <td className="value">{selectedGuest.address?.split(',').pop()?.trim() || ':'}</td>
                    <td className="label">Pincode:</td>
                    <td className="value">{selectedGuest.pin_code || ':'}</td>
                  </tr>
                  <tr>
                    <td className="label">Nationality:</td>
                    <td className="value">{selectedGuest.nationality || 'Indian'}</td>
                    <td className="label">Date of Birth:</td>
                    <td className="value">:</td>
                  </tr>
                  <tr>
                    <td className="label">Mobile No:</td>
                    <td className="value">{selectedGuest.phone}</td>
                    <td className="label">Email Id:</td>
                    <td className="value">{selectedGuest.email || ':'}</td>
                  </tr>
                  <tr>
                    <td className="label">Arrival From:</td>
                    <td className="value">:</td>
                    <td className="label">Proceeding To:</td>
                    <td className="value">:</td>
                  </tr>
                  <tr>
                    <td className="label">Mode of Payment:</td>
                    <td className="value">:</td>
                    <td className="label">Credit Card:</td>
                    <td className="value">:</td>
                  </tr>
                  </tbody>
                </table>

                {/* Passport Details - Only for Foreign Nationals */}
                {isForeignNational && (
                  <table>
                    <tbody>
                    <tr>
                      <td className="section-header" colSpan={4}>Passport Details</td>
                    </tr>
                    <tr>
                      <td className="label">Passport No:</td>
                      <td className="value">{selectedGuest.passport_number || ':'}</td>
                      <td className="label">Place of Issue:</td>
                      <td className="value">{selectedGuest.passport_place_of_issue || ':'}</td>
                    </tr>
                    <tr>
                      <td className="label">Date of Issue:</td>
                      <td className="value">{selectedGuest.passport_issue_date || ':'}</td>
                      <td className="label">Date of Expiry:</td>
                      <td className="value">{selectedGuest.passport_expiry_date || ':'}</td>
                    </tr>
                    <tr>
                      <td className="label">Visa Type / Visa No:</td>
                      <td className="value">{selectedGuest.visa_type || ':'} / {selectedGuest.visa_number || ':'}</td>
                      <td className="label">Place of Issue:</td>
                      <td className="value">{selectedGuest.visa_issue_place || ':'}</td>
                    </tr>
                    <tr>
                      <td className="label">Date of Issue:</td>
                      <td className="value">{selectedGuest.visa_issue_date || ':'}</td>
                      <td className="label">Date of Expiry:</td>
                      <td className="value">{selectedGuest.visa_expiry_date || ':'}</td>
                    </tr>
                    <tr>
                      <td className="label">Date of Arrival in India:</td>
                      <td className="value">{selectedGuest.date_of_arrival_in_india || ':'}</td>
                      <td className="label">Duration of Stay in India:</td>
                      <td className="value">{selectedGuest.duration_of_stay || ':'} days</td>
                    </tr>
                    <tr>
                      <td className="label">Purpose of Visit:</td>
                      <td className="value" colSpan={3}>{selectedGuest.purpose_of_visit || ':'}</td>
                    </tr>
                    </tbody>
                  </table>
                )}

                {/* Visa/Residential Permit - Only for Foreign Nationals */}
                {isForeignNational && (
                  <table>
                    <tbody>
                    <tr>
                      <td className="section-header" colSpan={4}>Visa / Residential Permit</td>
                    </tr>
                    <tr>
                      <td className="label">No:</td>
                      <td className="value">:</td>
                      <td className="label">Expiry Dt:</td>
                      <td className="value">:</td>
                    </tr>
                    </tbody>
                  </table>
                )}

                {/* Reservation / Check In Information */}
                <table>
                  <tbody>
                  <tr>
                    <td className="section-header" colSpan={4}>Reservation / Check In Information</td>
                  </tr>
                  <tr>
                    <td className="label">Arrival Date & Time:</td>
                    <td className="value">{bookingDetails?.check_in ? new Date(bookingDetails.check_in).toLocaleString() : selectedGuest.check_in ? new Date(selectedGuest.check_in).toLocaleString() : ':'}</td>
                    <td className="label">Departure Date & Time:</td>
                    <td className="value">{bookingDetails?.check_out ? new Date(bookingDetails.check_out).toLocaleString() : selectedGuest.check_out ? new Date(selectedGuest.check_out).toLocaleString() : ':'}</td>
                  </tr>
                  <tr>
                    <td className="label">Arr Flight No & Dt:</td>
                    <td className="value">:</td>
                    <td className="label">Departure Flight No & Time:</td>
                    <td className="value">:</td>
                  </tr>
                  <tr>
                    <td className="label">Room Type:</td>
                    <td className="value">:</td>
                    <td className="label">Room No:</td>
                    <td className="value">{bookingDetails?.room_id || selectedGuest.room_ids?.[0] || ''}</td>
                  </tr>
                  <tr>
                    <td className="label">Tariff:</td>
                    <td className="value">{selectedGuest.base_amount || bookingDetails?.base_amount || ':'}</td>
                    <td className="label">Res Advance:</td>
                    <td className="value">{selectedGuest.advance_payment || bookingDetails?.advance_amount || 0}</td>
                  </tr>
                  <tr>
                    <td className="label">Pax:</td>
                    <td className="value">Adult: {selectedGuest.pax || 1} Child: {':'}</td>
                    <td className="label">Bill Instruction:</td>
                    <td className="value">:</td>
                  </tr>
                  <tr>
                    <td className="label">Plan:</td>
                    <td className="value">Extra Person: :</td>
                    <td className="label">Special Instructions:</td>
                    <td className="value">:</td>
                  </tr>
                  </tbody>
                </table>

                {/* Terms & Conditions */}
                <div className="terms">
                  <div className="terms-title">Terms & condition :-</div>
                  <ol style={{ margin: '5px 0', paddingLeft: '15px' }}>
                    <li>Length of occupancy: The room is booked for occupation by the above named guest only for the stay dates mentioned on the reservation or registration.</li>
                    <li>The guest must conduct themselves in a responsible manner and must not cause any disturbance within the premises of Mountain Pass Residency.</li>
                    <li>The guest must not sub-let or allow accommodation for any illegal occupation or permit any other person to occupy the room. For convenience, parties before are available in each room.</li>
                    <li>Responsibility for property: The management accepts no responsibility for loss of money, jewellery or other valuables not deposited with the hotel office for safe custody.</li>
                    <li>Early & late check out: An additional charge will be levied for any late checkout which includes the room tariff calculation.</li>
                    <li>Food & beverages: Outside eatables are not permitted within the premises. In the event guests bring and consume such items, Mountain Pass Residency reserves the right to levy additional charges.</li>
                    <li>Late charges: Any outstanding balance are due & payable at the time of check out. The hotel reserves the right to be reimbursed and entertained in the hotel lounge.</li>
                    <li>Cancellation of room: Cancellation money presentation either by cash or credit/debit card. Cheques are not accepted under any circumstances.</li>
                    <li>Cancellation policy: A standard 1 night room tariff deposit is required at the time of booking. If cancellation are made less than 48hrs in advance or totally prohibited.</li>
                    <li>Check-Out Time: 11.00 AM The checkout time is 11 AM. If late checkout, there will be additional charges as mentioned above.</li>
                    <li>Check-in time: 1.00 PM Guests who arrive before 1.00 PM on the day of check in. Failure to do so will entitle the management to vacate the guest and hold belongings as mentioned.</li>
                    <li>Damage & loss: Any damage or loss caused by the guest to the property. Guests are expected to treat all items to follow all instructions stipulated or issued by the management.</li>
                    <li>Damage to Property: The guest shall be responsible for any loss, damage, or harm caused to hotel property by themselves or their visitors. The damages will not be liable for any consequences resulting from violation of this.</li>
                    <li>Right of entry: The management reserves the right to enter guest rooms at any time for routine maintenance, cleaning, inspection or in case of emergency including from violation of the bill.</li>
                    <li>Smoking & Illegal substances: The hotel is no-smoking zone. However, restricted smoking areas are available. The management will not be liable for any consequences resulting from violation.</li>
                    <li>Respect & Water Conservation: Please be responsible in your use of lights, fans, air conditioning units, and fans when not in use. This is to conserve energy and water and to ensure utility and environment.</li>
                    <li>Firearms & Explosive: Guest are not permitted to carry or store firearms and comply with all applicable local laws and government regulations during their stay.</li>
                    <li>Amendment of Rules: Mountain Pass Residency reserves the right to add or amend or contain any of the above rules and notice without any notice.</li>
                  </ol>
                </div>

                {/* Signature Section */}
                <div className="signature-section">
                  <div className="signature-box">
                    <div>Guest Signature</div>
                  </div>
                  <div className="signature-box">
                    <div>FOA's Signature</div>
                  </div>
                  <div className="signature-box">
                    <div>Duty Manager</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestRegistrationForm;