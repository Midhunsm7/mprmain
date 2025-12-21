"use client";

import { useState } from "react";
import {
  Hotel,
  UtensilsCrossed,
  ChefHat,
  FileCheck,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface SidebarOption {
  name: string;
  link: string;
  shortcut: string;
}

interface SidebarSection {
  title: string;
  icon: any;
  options: SidebarOption[];
}

interface ResortSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  customSections?: SidebarSection[];
}

const defaultSections: SidebarSection[] = [
  {
    title: "Administrative Controls",
    icon: FileCheck,
    options: [
      { name: "Admin Panel", link: "/admin", shortcut: "⌘A" },
      { name: "HR Management", link: "/hr", shortcut: "⌘H" },
      { name: "Accounts", link: "/accounts", shortcut: "⌘P" },

    ],
  },
  {
    title: "Guest Management",
    icon: Hotel,
    options: [
      { name: "Bookings", link: "/bookings", shortcut: "⌘B" },
      { name: "Checkout", link: "/checkout", shortcut: "⌘C" },
    ],
  },
  {
    title: "Food & Kitchen",
    icon: ChefHat,
    options: [
      { name: "Cook Dashboard", link: "/cook", shortcut: "⌘K" },
      { name: "Kitchen Inventory", link: "/kitcheninv", shortcut: "⌘I" },
      { name: "KOT Management", link: "/kot", shortcut: "⌘T" },
      { name: "Restaurant Events", link: "/events", shortcut: "⌘E" },
    ],
  },
  {
    title: "Inventory & Supplies",
    icon: UtensilsCrossed,
    options: [
      { name: "Resort Inventory", link: "/inventory", shortcut: "⌘R" },
    ],
  },
];

export function ResortSidebar({ isOpen, onClose, customSections }: ResortSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const router = useRouter();
  const sections = customSections || defaultSections;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-full sm:w-96 z-50 transform transition-all duration-500 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "2px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "10px 0 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <h2 className="text-sm tracking-widest text-white font-light">
              MODULES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 hover:rotate-90 transition-all duration-300 rounded-lg group"
          >
            <X
              className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === index;

            return (
              <div key={index} className="border-b border-white/10">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-light text-white">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    strokeWidth={1.5}
                  />
                </button>

                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isExpanded ? `${section.options.length * 48}px` : "0px",
                    opacity: isExpanded ? 1 : 0,
                    background: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {section.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      className="w-full text-left py-3 px-5 pl-14 hover:bg-white/10 hover:pl-16 transition-all duration-200 group relative overflow-hidden"
                      onClick={() => {
                        router.push(option.link);
                        onClose();
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-xs font-light text-gray-300 group-hover:text-white transition-colors">
                          {option.name}
                        </span>
                        <span className="text-xs text-gray-500 font-mono group-hover:text-gray-300 transition-colors">
                          {option.shortcut}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-black/95">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 font-light tracking-wide shadow-lg hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-all duration-500"
          onClick={onClose}
        />
      )}
    </>
  );
}

// Menu Button Component
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 sm:top-8 left-4 sm:left-8 p-4 bg-black text-white hover:bg-red-600 hover:scale-110 transition-all duration-300 z-[100] shadow-2xl rounded-xl border-2 border-white"
    >
      <Menu className="w-6 h-6" strokeWidth={2} />
    </button>
  );
}