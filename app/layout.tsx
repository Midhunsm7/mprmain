import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MOUNTAIN PASS RESIDENCY",
  description: "MOUNTAIN PASS RESIDENCY PMS",

  // ✅ PWA / App icons
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/square-image.png", type: "image/png" },
      { url: "/square-image.jpg", type: "image/jpeg" },
    ],
    apple: "/square-image.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        {children}
        {/* ✅ Toast container for alerts and notifications */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
