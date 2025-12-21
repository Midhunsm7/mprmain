  "use client"

  import Link from "next/link"
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
  import { useState, useEffect } from "react"
  import { motion, AnimatePresence, easeOut, easeInOut } from "framer-motion"
  import { 
    BarChart3, 
    Calculator, 
    Package, 
    Boxes, 
    FileText, 
    ArrowRight,
    TrendingUp,
    Shield,
    Zap
  } from "lucide-react"

  const modules = [
    {
      title: "Revenue Report",
      description: "View all booking revenue and earnings with detailed analytics",
      link: "/accounts/revenue",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      delay: 0.1
    },
    {
      title: "LEDGER",
      description: "breakdown and compliance overview",
      link: "/accounts/ledger",
      icon: Calculator,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      delay: 0.2
    },
    {
      title: "NIGHT-AUDIT ",
      description: "Perform end-of-day financial reconciliations",
      link: "/accounts/night-audit",
      icon: Package,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      delay: 0.3
    },
    {
      title: "NIGHT REPORT",
      description: "Track inventory items, value and movement analytics",
      link: "/accounts/night-report",
      icon: Boxes,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      delay: 0.4
    },
    {
      title: "Vendor Bills",
      description: "Upload, manage and generate vendor payment bills",
      link: "/accounts/vendors",
      icon: FileText,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      delay: 0.5
    },
        {
      title: "PURCHASE APPROVALS",
      description: "APPROVE PURCHASE REQUESTS FROM DEPARTMENTS",
      link: "/accounts/purchases",
      icon: FileText,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      delay: 0.5
    }
  ]

  export default function AccountsPage() {
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
      setIsVisible(true)
    }, [])

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }

    const itemVariants = {
      hidden: { 
        opacity: 0, 
        y: 20 
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: "easeOut"
        }
      }
    }

    const cardHoverVariants = {
      rest: {
        scale: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: "easeInOut"
        }
      },
      hover: {
        scale: 1.05,
        y: -8,
        transition: {
          duration: 0.3,
          ease: "easeInOut"
        }
      }
    }

    const iconHoverVariants = {
      rest: {
        scale: 1,
        rotate: 0,
      },
      hover: {
        scale: 1.1,
        rotate: 5,
        transition: {
          duration: 0.3,
          ease: "easeInOut"
        }
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-4 lg:p-8">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12 lg:mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-slate-200/50 mb-6">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Finance Dashboard</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              Accounts & Finance
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Comprehensive financial management system for revenue, taxes, inventory, and vendor payments
            </motion.p>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mt-8"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant Reports</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Secure & Compliant</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Modules Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {modules.map((module) => {
                const IconComponent = module.icon
                return (
                  <motion.div
                    key={module.link}
                    variants={itemVariants}
                    custom={module.delay}
                  >
                    <Link href={module.link}>
                      <motion.div
                        variants={cardHoverVariants}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                        onHoverStart={() => setHoveredCard(module.link)}
                        onHoverEnd={() => setHoveredCard(null)}
                        className="group relative h-full cursor-pointer"
                      >
                        {/* Animated Border */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${module.color} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
                        
                        <Card className="relative h-full bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                          
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <motion.div
                                variants={iconHoverVariants}
                                className={`p-3 rounded-2xl ${module.bgColor} backdrop-blur-sm`}
                              >
                                <IconComponent className={`w-6 h-6 ${module.iconColor}`} />
                              </motion.div>
                              
                              <motion.div
                                animate={{ 
                                  x: hoveredCard === module.link ? 4 : 0,
                                  opacity: hoveredCard === module.link ? 1 : 0.7
                                }}
                                transition={{ duration: 0.3 }}
                                className="p-2 rounded-full bg-slate-100/80 group-hover:bg-white shadow-sm"
                              >
                                <ArrowRight className="w-4 h-4 text-slate-600" />
                              </motion.div>
                            </div>
                            
                            <CardTitle className="text-xl font-bold text-slate-900 mt-4 group-hover:text-slate-800 transition-colors">
                              {module.title}
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent>
                            <p className="text-slate-600 leading-relaxed mb-4 group-hover:text-slate-700 transition-colors">
                              {module.description}
                            </p>
                            
                            {/* Progress/Status Bar */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: hoveredCard === module.link ? "100%" : "60%" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full bg-gradient-to-r ${module.color} rounded-full`}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-center mt-12 lg:mt-16"
          >
            <p className="text-slate-500 text-sm">
              Need help with financial reports?{" "}
              <Link href="/support" className="text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline">
                Contact support
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    )
  }