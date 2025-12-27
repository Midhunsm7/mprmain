"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    // Skip auth check for login page
    if (pathname === '/employee/login') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employee/auth/session');
      const data = await res.json();
      
      if (res.ok && data.session) {
        setIsAuthenticated(true);
      } else {
        toast.error("Please login to access this page");
        router.push(`/employee/login?from=${encodeURIComponent(pathname)}`);
      }
    } catch (error) {
      toast.error("Session expired. Please login again.");
      router.push(`/employee/login?from=${encodeURIComponent(pathname)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && pathname !== '/employee/login') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For login page, show content immediately
  if (pathname === '/employee/login') {
    return <>{children}</>;
  }

  // For protected pages, only show if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}