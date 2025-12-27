"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Key, 
  LogIn, 
  Building2,
  BadgeCheck,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Loader2,
  Sparkles,
  Fingerprint
} from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeLoginPage() {
  const [loginId, setLoginId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get('from');

  // Check if already logged in
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/employee/auth/session');
      const data = await res.json();
      
      if (res.ok && data.session) {
        toast.info("Already logged in", {
          description: "Redirecting to leave portal...",
          icon: <BadgeCheck className="h-5 w-5 text-blue-500" />,
        });
        setTimeout(() => {
          router.push(redirectFrom || '/employee/leave');
        }, 1000);
      }
    } catch (error) {
      // Ignore errors, just proceed to login page
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginId.trim() || !pin.trim()) {
      toast.error("Please enter both Employee ID and PIN", {
        icon: <Lock className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits", {
        description: "Please enter a valid 4-digit PIN",
        icon: <Lock className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employee/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employee_login_id: loginId.toUpperCase().trim(), 
          employee_pin: pin.trim() 
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success("Login successful!", {
        description: `Welcome ${data.staff.name}`,
        icon: <BadgeCheck className="h-5 w-5 text-green-500" />,
      });

      // Redirect to leave portal or previous page
      setTimeout(() => {
        if (redirectFrom) {
          router.push(redirectFrom);
        } else {
          router.push('/employee/leave');
        }
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.message || "Login failed";
      
      if (errorMessage.includes("Invalid Employee ID") || errorMessage.includes("Invalid PIN")) {
        toast.error("Invalid Credentials", {
          description: "Please check your Employee ID and PIN",
          icon: <Lock className="h-5 w-5 text-red-500" />,
        });
      } else if (errorMessage.includes("account not active")) {
        toast.error("Account Disabled", {
          description: "Please contact HR department",
          icon: <Lock className="h-5 w-5 text-red-500" />,
        });
      } else {
        toast.error(errorMessage, {
          description: "Please try again or contact HR",
          icon: <Lock className="h-5 w-5 text-red-500" />,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
    toast.info("Random PIN generated", {
      description: "Use this PIN or set your own 4-digit PIN",
      icon: <Fingerprint className="h-5 w-5 text-blue-500" />,
    });
  };

  const handleDemoLogin = () => {
    // Set demo credentials for testing
    setLoginId("EMP000001");
    setPin("1234");
    toast.info("Demo credentials loaded", {
      description: "Click 'Sign In to Portal' to login",
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Checking your session</h3>
            <p className="text-gray-500 text-sm mt-1">Please wait while we verify your login status</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl"
            >
              <Building2 className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                Mountain Pass Resort
              </h1>
              <p className="text-gray-600 mt-2">Employee Portal</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure & Encrypted Connection</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl border-gray-200/50 backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                  <LogIn className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Employee Login</CardTitle>
                  <CardDescription className="text-gray-500">
                    Enter your credentials to access the leave portal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4" />
                    Employee ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="loginId"
                      type="text"
                      placeholder="EMP000001"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                      className="pl-10 text-lg font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                      autoFocus
                      required
                    />
                    <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Format: EMP followed by 6 digits (e.g., EMP000001)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pin" className="flex items-center gap-2 text-gray-700">
                      <Key className="h-4 w-4" />
                      PIN
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateRandomPin}
                        className="text-xs h-7"
                        disabled={loading}
                      >
                        Generate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDemoLogin}
                        className="text-xs h-7"
                        disabled={loading}
                      >
                        Demo
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPin(value);
                      }}
                      className="pl-10 pr-10 text-lg font-mono tracking-widest border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={loading}
                      required
                    />
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter your 4-digit PIN. Default PIN is <span className="font-mono">1234</span> for first login.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200/50"
                >
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      First time login?
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                        <span>Use your Employee ID (e.g., <span className="font-mono">EMP000001</span>)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                        <span>Default PIN is <span className="font-mono">1234</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                        <span>You can change PIN after first login</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                        <span>Contact HR for any login issues</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                {redirectFrom && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-700">
                      You were redirected here from a protected page. Please login to continue.
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to Portal
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">
                    <p>Need help logging in?</p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Private</span>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex flex-col items-center gap-2">
            <div className="text-xs text-gray-500">
              <p>Test credentials available</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="font-mono text-gray-700">EMP000001</div>
                <div className="text-gray-500">Munna</div>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="font-mono text-gray-700">EMP000002</div>
                <div className="text-gray-500">Najah</div>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="font-mono text-gray-700">EMP000032</div>
                <div className="text-gray-500">Shameer</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              All accounts use PIN: <span className="font-mono">1234</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}