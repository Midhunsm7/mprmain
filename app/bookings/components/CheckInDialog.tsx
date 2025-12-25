"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    name: string;
    address: string;
    idProof: string;
    phone: string;
    days: number;
    manualPrice: string | null;
    passportImage: File | null;
    pax: number;
    mealPlan: string;
    mealPlanCharge: number;
    gstin: string;
    companyName: string;
    guestCategory: string;
    purposeOfVisit: string;
    advanceAmount: number;
    bookingType: string;
    hours: number;
    totalAmount: number; // Added total amount
  }) => void;
  calculatedTotal: number;
}

interface GuestData {
  id: string;
  name: string;
  phone: string;
  address: string;
  id_proof?: string;
  status?: string;
  room_pin?: string;
  gstin?: string;
  company_name?: string;
  guest_category?: string;
}

const MEAL_PLANS = [
  { value: "none", label: "No Meal Plan", price: 0 },
  { value: "cp", label: "Continental Plan (CP) - Breakfast", price: 300 },
  {
    value: "map",
    label: "Modified American Plan (MAP) - Breakfast + 1 Meal",
    price: 750,
  },
  { value: "ap", label: "American Plan (AP) - All Meals", price: 1500 },
];

const GUEST_CATEGORIES = [
  { value: "walk-in", label: "🚶 Walk-in" },
  { value: "corporate", label: "💼 Corporate" },
  { value: "complimentary", label: "🎁 Complimentary" },
  { value: "single-lady", label: "👩 Single Lady" },
  { value: "group", label: "👥 Group" },
  { value: "regular", label: "⭐ Regular" },
  { value: "vip", label: "👑 VIP" },
  { value: "freshen-up", label: "🚿 Freshen-up" },
  { value: "other", label: "📋 Other" },
];

const PURPOSE_OF_VISIT_OPTIONS = [
  { value: "leisure", label: "🏖️ Leisure/Vacation" },
  { value: "business", label: "💼 Business/Work" },
  { value: "family", label: "👨‍👩‍👧‍👦 Family Trip" },
  { value: "honeymoon", label: "💑 Honeymoon" },
  { value: "wedding", label: "💒 Wedding" },
  { value: "conference", label: "🎤 Conference/Seminar" },
  { value: "medical", label: "🏥 Medical Treatment" },
  { value: "pilgrimage", label: "🛐 Pilgrimage" },
  { value: "other", label: "📋 Other" },
];

export default function CheckInDialog({
  open,
  onClose,
  onConfirm,
  calculatedTotal,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    idProof: "",
    phone: "",
    days: 1,
    manualPrice: "",
    pax: 1,
    mealPlan: "none",
    gstin: "",
    companyName: "",
    guestCategory: "walk-in",
    purposeOfVisit: "leisure",
    advanceAmount: 0,
    hours: 0,
  });

  const [passportImage, setPassportImage] = useState<File | null>(null);
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [existingGuest, setExistingGuest] = useState<GuestData | null>(null);

  // Calculate meal plan charge based on pax, days, and selected plan
  const calculateMealPlanCharge = () => {
    if (form.guestCategory === "complimentary") return 0;
    const selectedPlan = MEAL_PLANS.find(
      (plan) => plan.value === form.mealPlan
    );
    if (!selectedPlan) return 0;
    return selectedPlan.price * form.pax * form.days;
  };

  const mealPlanCharge = calculateMealPlanCharge();
  
  // Calculate total amount
  const calculateTotalAmount = () => {
    // If complimentary, total should be 0
    if (form.guestCategory === "complimentary") {
      return 0;
    }
    
    // Use manual price if provided and valid
    if (form.manualPrice && form.manualPrice.trim() !== "") {
      const manualPriceNum = Number(form.manualPrice);
      if (!isNaN(manualPriceNum) && manualPriceNum >= 0) {
        return manualPriceNum + mealPlanCharge;
      }
    }
    
    // Otherwise use calculated room total + meal plan
    return calculatedTotal + mealPlanCharge;
  };

  const totalAmount = calculateTotalAmount();

  // Dropzone for ID upload
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => setPassportImage(acceptedFiles[0]),
  });

  // Effect to handle complimentary category
  useEffect(() => {
    if (form.guestCategory === "complimentary") {
      setForm((prev) => ({
        ...prev,
        manualPrice: "0",
        mealPlan: "none",
      }));
    }
    
    // For freshen-up bookings, calculate hours from days
    if (form.guestCategory === "freshen-up") {
      setForm((prev) => ({
        ...prev,
        hours: prev.days * 24,
      }));
    }
  }, [form.guestCategory]);

  // Function to lookup guest by phone
  const lookupGuestByPhone = async (phone: string) => {
    if (!phone || phone.length < 10) return;

    setPhoneLookupLoading(true);
    try {
      const response = await fetch(
        `/api/guests/lookup?phone=${encodeURIComponent(phone)}`
      );

      if (response.ok) {
        const data: GuestData | null = await response.json();

        if (data) {
          setExistingGuest(data);
          setForm((prev) => ({
            ...prev,
            name: data.name || "",
            address: data.address || "",
            idProof: data.id_proof || "",
            phone: data.phone || phone,
            gstin: data.gstin || "",
            companyName: data.company_name || "",
            guestCategory: data.guest_category || "walk-in",
            purposeOfVisit: "leisure",
          }));

          if (data.status === "checked-in") {
            alert(
              `⚠️ Guest "${data.name}" is already checked-in!\nRoom PIN: ${
                data.room_pin || "Not assigned"
              }`
            );
          }
        } else {
          setExistingGuest(null);
          setForm((prev) => ({
            ...prev,
            name: "",
            address: "",
            idProof: "",
            phone: phone,
            gstin: "",
            companyName: "",
            guestCategory: "walk-in",
            purposeOfVisit: "leisure",
          }));
        }
      } else {
        const errorData = await response.json();
        console.error("Lookup error:", errorData);
        setExistingGuest(null);
      }
    } catch (error) {
      console.error("Error looking up guest:", error);
      setExistingGuest(null);
    } finally {
      setPhoneLookupLoading(false);
    }
  };

  // Handle phone input change with debounce
  useEffect(() => {
    if (phoneTouched && form.phone && form.phone.length >= 10) {
      const timeoutId = setTimeout(() => {
        lookupGuestByPhone(form.phone);
      }, 800);

      return () => clearTimeout(timeoutId);
    }
  }, [form.phone, phoneTouched]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhoneTouched(true);
    setForm({ ...form, phone: value });

    if (existingGuest && existingGuest.phone !== value) {
      setExistingGuest(null);
      if (value.length < 10) {
        setForm((prev) => ({
          ...prev,
          name: "",
          address: "",
          idProof: "",
          phone: value,
          gstin: "",
          companyName: "",
          guestCategory: "walk-in",
          purposeOfVisit: "leisure",
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("Guest name required");
      return;
    }

    if (!form.phone.trim() || form.phone.length < 10) {
      alert("Valid phone number required (10 digits)");
      return;
    }

    if (form.pax < 1) {
      alert("Number of persons (PAX) must be at least 1");
      return;
    }

    if (existingGuest && existingGuest.status === "checked-in") {
      alert(
        `Cannot check-in: Guest "${existingGuest.name}" is already checked-in.\nPlease check them out first or use a different phone number.`
      );
      return;
    }

    // Validate GSTIN format if provided
    if (form.gstin && form.gstin.length > 0 && form.gstin.length !== 15) {
      alert("GSTIN should be 15 characters long if provided");
      return;
    }

    // Validate manual price for complimentary guests
    if (form.guestCategory === "complimentary" && form.manualPrice !== "0") {
      setForm((prev) => ({ ...prev, manualPrice: "0" }));
    }

    // Determine booking type based on guest category
    const bookingType = form.guestCategory === 'freshen-up' ? 'hourly' : 'daily';
    
    // Check if this is a freshen-up booking
    const isFreshenUp = form.guestCategory === 'freshen-up';
    
    // For freshen-up, calculate hours from days
    const hours = isFreshenUp ? form.days * 24 : 0;

    // Pass all data to parent - parent will call the merged check-in API
    onConfirm({
      name: form.name,
      address: form.address,
      idProof: form.idProof,
      phone: form.phone,
      days: form.days,
      manualPrice: form.manualPrice || null,
      passportImage,
      pax: form.pax,
      mealPlan: form.mealPlan,
      mealPlanCharge,
      gstin: form.gstin,
      companyName: form.companyName,
      guestCategory: form.guestCategory,
      purposeOfVisit: form.purposeOfVisit,
      advanceAmount: form.advanceAmount,
      bookingType: bookingType,
      hours: hours,
      totalAmount: totalAmount, // Pass the calculated total amount
    });

    // Reset form
    resetForm();
  };

  // Reset form function
  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      idProof: "",
      phone: "",
      days: 1,
      manualPrice: "",
      pax: 1,
      mealPlan: "none",
      gstin: "",
      companyName: "",
      guestCategory: "walk-in",
      purposeOfVisit: "leisure",
      advanceAmount: 0,
      hours: 0,
    });
    setPassportImage(null);
    setPhoneTouched(false);
    setExistingGuest(null);
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle pax input change - fully editable
  const handlePaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty input
    if (value === '') {
      setForm({ ...form, pax: '' as any });
    } else {
      // Remove all non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      
      // If there's a value, convert to number
      if (numericValue) {
        const numValue = parseInt(numericValue, 10);
        // Limit to reasonable number (max 20)
        const finalValue = Math.min(Math.max(numValue, 1), 20);
        setForm({ ...form, pax: finalValue });
      }
    }
  };

  // Handle manual price change - lock to 0 for complimentary
  const handleManualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (form.guestCategory === "complimentary") {
      setForm({ ...form, manualPrice: "0" });
    } else {
      // Allow only numbers
      const numValue = value.replace(/\D/g, "");
      setForm({ ...form, manualPrice: numValue });
    }
  };

  // Handle days change - also update hours for freshen-up
  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = Math.max(1, Number(e.target.value));
    setForm({
      ...form,
      days: days,
      hours: form.guestCategory === "freshen-up" ? days * 24 : 0,
    });
  };

  // Handle guest category change
  const handleGuestCategoryChange = (value: string) => {
    setForm((prev) => {
      const newForm = { ...prev, guestCategory: value };
      
      // Reset manual price for complimentary
      if (value === "complimentary") {
        newForm.manualPrice = "0";
        newForm.mealPlan = "none";
      }
      
      // Update hours for freshen-up
      if (value === "freshen-up") {
        newForm.hours = newForm.days * 24;
      }
      
      return newForm;
    });
  };

  // Calculate balance due
  const balanceDue = Math.max(0, totalAmount - form.advanceAmount);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black border border-black rounded-xl max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Check-In Guest
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone Number - First Field */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                className="border border-black pl-10"
                placeholder="Enter 10-digit phone number"
                maxLength={10}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                📱
              </div>
              {phoneLookupLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {existingGuest ? (
                  <span
                    className={
                      existingGuest.status === "checked-in"
                        ? "text-red-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                    {existingGuest.status === "checked-in"
                      ? "⚠️ Already checked-in"
                      : "✓ Returning guest found"}
                  </span>
                ) : form.phone.length >= 10 ? (
                  <span className="text-blue-600">
                    New guest - will be created
                  </span>
                ) : (
                  "Enter phone number to check previous records"
                )}
              </p>
              {form.phone.length > 0 && (
                <span className="text-xs text-gray-500">
                  {form.phone.length}/10 digits
                </span>
              )}
            </div>
          </div>

          {/* Two Column Layout for Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-black"
                placeholder="Guest name"
                required
                disabled={phoneLookupLoading}
              />
            </div>

            <div>
              <Label htmlFor="guestCategory">Guest Category *</Label>
              <Select
                value={form.guestCategory}
                onValueChange={handleGuestCategoryChange}
                disabled={phoneLookupLoading}
              >
                <SelectTrigger className="border border-black">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {GUEST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border border-black"
              placeholder="Guest address"
              disabled={phoneLookupLoading}
            />
          </div>

          {/* Purpose of Visit */}
          <div>
            <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
            <Select
              value={form.purposeOfVisit}
              onValueChange={(value) =>
                setForm({ ...form, purposeOfVisit: value })
              }
              disabled={phoneLookupLoading}
            >
              <SelectTrigger className="border border-black">
                <SelectValue placeholder="Select purpose of visit" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OF_VISIT_OPTIONS.map((purpose) => (
                  <SelectItem key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Corporate Details - Show only if corporate category */}
          {form.guestCategory === "corporate" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="col-span-2">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  💼 Corporate Guest Details
                </p>
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  className="border border-black bg-white"
                  placeholder="Company name"
                  disabled={phoneLookupLoading}
                />
              </div>
              <div>
                <Label htmlFor="gstin">GSTIN (15 digits)</Label>
                <Input
                  id="gstin"
                  value={form.gstin}
                  onChange={(e) =>
                    setForm({ ...form, gstin: e.target.value.toUpperCase() })
                  }
                  className="border border-black bg-white"
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  disabled={phoneLookupLoading}
                />
                {form.gstin &&
                  form.gstin.length > 0 &&
                  form.gstin.length !== 15 && (
                    <p className="text-xs text-red-600 mt-1">
                      GSTIN must be exactly 15 characters
                    </p>
                  )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idProof">ID / Passport No</Label>
              <Input
                id="idProof"
                value={form.idProof}
                onChange={(e) => setForm({ ...form, idProof: e.target.value })}
                className="border border-black"
                placeholder="ID / Passport"
                disabled={phoneLookupLoading}
              />
            </div>

            <div>
              <Label htmlFor="pax">Number of Persons (PAX) *</Label>
              <Input
                id="pax"
                type="text"
                value={form.pax === "" ? "" : form.pax}
                onChange={handlePaxChange}
                onBlur={() => {
                  if (form.pax === "" || form.pax < 1) {
                    setForm((prev) => ({ ...prev, pax: 1 }));
                  }
                }}
                className="border border-black"
                placeholder="Enter number of persons"
                disabled={phoneLookupLoading}
              />
              {form.pax < 1 && (
                <p className="text-xs text-red-600 mt-1">
                  Must be at least 1 person
                </p>
              )}
            </div>
          </div>

          {/* Advance Amount */}
          <div>
            <Label htmlFor="advanceAmount">Advance Amount (₹)</Label>
            <Input
              id="advanceAmount"
              type="number"
              value={form.advanceAmount}
              onChange={(e) => 
                setForm({ ...form, advanceAmount: Number(e.target.value) || 0 })
              }
              className="border border-black"
              placeholder="Advance amount paid"
              min="0"
              disabled={phoneLookupLoading}
            />
          </div>

          {/* Meal Plan Selection - Disabled for complimentary */}
          <div
            className={`p-4 rounded-lg border ${
              form.guestCategory === "complimentary"
                ? "bg-gray-100 border-gray-300"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <Label
              htmlFor="mealPlan"
              className="text-base font-semibold mb-2 block"
            >
              🍽️ Meal Plan Selection{" "}
              {form.guestCategory === "complimentary" && (
                <span className="text-gray-500 text-sm">
                  (Disabled for complimentary)
                </span>
              )}
            </Label>
            <Select
              value={form.mealPlan}
              onValueChange={(value) => setForm({ ...form, mealPlan: value })}
              disabled={
                phoneLookupLoading || form.guestCategory === "complimentary"
              }
            >
              <SelectTrigger
                className={`border ${
                  form.guestCategory === "complimentary"
                    ? "border-gray-300 bg-gray-100"
                    : "border-black bg-white"
                }`}
              >
                <SelectValue placeholder="Select meal plan" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_PLANS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}{" "}
                    {plan.price > 0 && `- ₹${plan.price}/person/day`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.mealPlan !== "none" &&
              form.guestCategory !== "complimentary" && (
                <div className="mt-2 p-2 bg-white rounded border border-amber-300">
                  <p className="text-sm text-gray-700">
                    <strong>Calculation:</strong> ₹
                    {MEAL_PLANS.find((p) => p.value === form.mealPlan)?.price} ×{" "}
                    {form.pax} person(s) × {form.days} day(s) ={" "}
                    <strong className="text-amber-700">
                      ₹{mealPlanCharge.toLocaleString("en-IN")}
                    </strong>
                  </p>
                </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="days">Number of Days *</Label>
              <Input
                id="days"
                type="number"
                min={1}
                value={form.days}
                onChange={handleDaysChange}
                className="border border-black"
                disabled={phoneLookupLoading}
              />
              {form.guestCategory === "freshen-up" && (
                <p className="text-xs text-gray-500 mt-1">
                  {form.days} day(s) = {form.days * 24} hours
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="manualPrice">
                Manual Price Override (optional)
              </Label>
              <div className="relative">
                <Input
                  id="manualPrice"
                  type="text"
                  value={form.manualPrice}
                  onChange={handleManualPriceChange}
                  className={`border ${
                    form.guestCategory === "complimentary"
                      ? "border-gray-400 bg-gray-100"
                      : "border-black"
                  }`}
                  placeholder={
                    form.guestCategory === "complimentary"
                      ? "0 (Complimentary)"
                      : "Override total"
                  }
                  disabled={
                    phoneLookupLoading || form.guestCategory === "complimentary"
                  }
                  readOnly={form.guestCategory === "complimentary"}
                />
                {form.guestCategory === "complimentary" && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    🎁
                  </div>
                )}
              </div>
              {form.guestCategory === "complimentary" && (
                <p className="text-xs text-gray-500 mt-1">
                  Complimentary stay - price locked to ₹0
                </p>
              )}
            </div>
          </div>

          {/* Total Summary */}
          <div
            className={`p-4 rounded-lg border ${
              form.guestCategory === "complimentary"
                ? "bg-green-50 border-green-300"
                : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            }`}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Room Charges:</span>
                <span className="font-medium">
                  {form.guestCategory === "complimentary"
                    ? "₹0 (Complimentary)"
                    : `₹${calculatedTotal.toLocaleString("en-IN")}`}
                </span>
              </div>
              {form.mealPlan !== "none" &&
                form.guestCategory !== "complimentary" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      Meal Plan ({form.mealPlan.toUpperCase()}):
                    </span>
                    <span className="font-medium text-amber-700">
                      ₹{mealPlanCharge.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              {form.advanceAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Advance Paid:</span>
                  <span className="font-medium text-blue-700">
                    -₹{form.advanceAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-lg text-gray-900">
                  Total Amount:
                </span>
                <span
                  className={`font-bold text-xl ${
                    form.guestCategory === "complimentary"
                      ? "text-green-700"
                      : "text-green-700"
                  }`}
                >
                  {form.guestCategory === "complimentary"
                    ? "🎁 Complimentary (₹0)"
                    : `₹${totalAmount.toLocaleString("en-IN")}`}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-lg text-gray-900">
                  Balance Due:
                </span>
                <span className="font-bold text-xl text-blue-700">
                  ₹{balanceDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Freshen-up Notice */}
          {form.guestCategory === "freshen-up" && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <p className="text-sm text-cyan-800 font-medium flex items-center gap-2">
                <span>🚿</span>
                <span>Freshen-up Booking</span>
              </p>
              <p className="text-xs text-cyan-700 mt-1">
                This is an hourly booking for {form.days * 24} hours. Charges will be calculated based on hourly rates.
              </p>
            </div>
          )}

          {/* Complimentary Notice */}
          {form.guestCategory === "complimentary" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                <span>🎁</span>
                <span>Complimentary Stay Notice</span>
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                This guest is marked as complimentary. All charges will be set to ₹0.
              </p>
            </div>
          )}

          {/* Passport / ID Upload */}
          <div
            {...getRootProps()}
            className={`border border-dashed border-black p-4 rounded-lg text-center cursor-pointer ${
              phoneLookupLoading || form.guestCategory === "complimentary"
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={(e) =>
              (phoneLookupLoading || form.guestCategory === "complimentary") &&
              e.preventDefault()
            }
          >
            <input
              {...getInputProps()}
              disabled={
                phoneLookupLoading || form.guestCategory === "complimentary"
              }
            />
            {isDragActive ? (
              <p>Drop the ID image here...</p>
            ) : passportImage ? (
              <div className="flex flex-col items-center">
                <Image
                  src={URL.createObjectURL(passportImage)}
                  alt="id"
                  width={130}
                  height={130}
                  className="rounded-md"
                />
                <p className="text-xs mt-2">{passportImage.name}</p>
              </div>
            ) : (
              <p className="text-sm opacity-70">
                Drag or click to upload ID (optional)
              </p>
            )}
            {form.guestCategory === "complimentary" && (
              <p className="text-xs text-gray-500 mt-2">
                ID upload disabled for complimentary stays
              </p>
            )}
          </div>

          {/* Existing Guest Warning */}
          {existingGuest && existingGuest.status === "checked-in" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Warning: This guest is already checked-in!
              </p>
              <p className="text-xs text-red-600 mt-1">
                Room PIN: {existingGuest.room_pin || "Not assigned"}
              </p>
              <p className="text-xs text-red-600">
                Please check them out first before checking in again.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border border-black bg-white text-black hover:bg-black hover:text-white"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              className={`border ${
                form.guestCategory === "complimentary"
                  ? "border-yellow-600 bg-yellow-600 text-white hover:bg-yellow-700"
                  : form.guestCategory === "freshen-up"
                  ? "border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700"
                  : "border-black bg-black text-white hover:bg-white hover:text-black"
              }`}
              disabled={
                !form.name.trim() ||
                !form.phone ||
                form.phone.length < 10 ||
                form.pax < 1 ||
                phoneLookupLoading ||
                (existingGuest && existingGuest.status === "checked-in") ||
                (form.gstin &&
                  form.gstin.length > 0 &&
                  form.gstin.length !== 15)
              }
            >
              {phoneLookupLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking...
                </>
              ) : form.guestCategory === "complimentary" ? (
                "🎁 Check-In (Complimentary)"
              ) : form.guestCategory === "freshen-up" ? (
                "🚿 Check-In (Freshen-up)"
              ) : (
                "Check-In Guest"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}