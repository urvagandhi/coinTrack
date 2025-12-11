'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Globe, Shield, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      title: "Real-time Tracking",
      description: "Monitor your crypto portfolio performance in real-time with live market data updates."
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      title: "Bank-Grade Security",
      description: "Your data is encrypted using advanced security protocols. We prioritize your privacy and safety."
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-600" />,
      title: "Smart Analytics",
      description: "Get deep insights into your investing habits and discover new opportunities for growth."
    }
  ];

  const pricing = [
    {
      title: "Starter",
      price: "Free",
      features: ["Real-time tracking", "Basic analytics", "Up to 3 portfolios", "Email support"],
      recommended: false
    },
    {
      title: "Pro",
      price: "$12/mo",
      features: ["Unlimited portfolios", "Advanced AI insights", "Priority support", "Tax reports", "API Access"],
      recommended: true
    },
    {
      title: "Enterprise",
      price: "Custom",
      features: ["Dedicated account manager", "Custom integration", "White-label reports", "SLA support"],
      recommended: false
    }
  ];

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] // Smooth custom bezier
      }
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0 } }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50"
      >
        <div className="w-full py-4 px-4 sm:px-8 flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative transition-transform group-hover:scale-110 duration-300">
              <Image
                src="/coinTrack.png"
                alt="coinTrack Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              coinTrack
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md">
            {['Features', 'Pricing', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex gap-4">
            {loading ? (
              <div className="w-24 h-10 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
            ) : user ? (
              <Link
                href="/main/dashboard"
                className="px-6 py-2.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-600/25 ring-2 ring-purple-600 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex px-6 py-2.5 rounded-full text-gray-600 dark:text-gray-300 font-medium hover:text-purple-600 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 rounded-full bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-600/25 active:scale-95"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-grow pt-24">
        <section className="relative px-4 sm:px-8 py-20 lg:py-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]"
              >
                Track your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                  crypto wealth
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                The most advanced crypto portfolio tracker. Real-time updates, deep analytics, and secure data encryption.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  href={user ? "/main/dashboard" : "/register"}
                  className="px-8 py-4 rounded-full bg-purple-600 text-white text-lg font-bold hover:bg-purple-700 transition-all shadow-xl hover:shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#demo"
                  className="px-8 py-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex justify-center"
                >
                  Watch Demo
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-sm text-gray-500 font-medium"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-500" />
                  <span>Global Coverage</span>
                </div>
              </motion.div>
            </div>

            <div className="relative hidden lg:block">
              {/* Abstract UI Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="bg-gray-900/5 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl relative z-20"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
                    <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center">
                    <div className="w-16 h-16 relative">
                      <Image
                        src="/coinTrack.png"
                        alt="coinTrack Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm cursor-default border border-transparent hover:border-purple-200 dark:hover:border-purple-900 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${i === 1 ? 'bg-orange-100 text-orange-600' : i === 2 ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-600'} flex items-center justify-center font-bold`}>
                          {i === 1 ? 'B' : i === 2 ? 'E' : 'S'}
                        </div>
                        <div>
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-1"></div>
                          <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-1 ml-auto"></div>
                        <div className="h-2 w-10 bg-green-100 text-green-600 rounded-full ml-auto"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 w-full h-full bg-gradient-to-b from-white/0 via-purple-500/5 to-white/0 dark:from-black/0 dark:via-purple-500/10 dark:to-black/0 -translate-x-1/2 pointer-events-none"></div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10"
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why coinTrack?</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything you need to manage your crypto investments in one place.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                >
                  <div className="bg-purple-50 dark:bg-purple-900/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-7xl mx-auto px-4 sm:px-8"
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-gray-600 dark:text-gray-400"> Start for free, upgrade as you grow.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {pricing.map((tier, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className={`p-8 rounded-3xl border flex flex-col transition-all duration-300 ${tier.recommended
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-900/10 shadow-xl scale-105 z-10'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg'
                    }`}
                >
                  {tier.recommended && (
                    <span className="self-start px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full mb-4">
                      Recommended
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{tier.title}</h3>
                  <div className="text-4xl font-extrabold my-4 text-purple-600">{tier.price}</div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-5 h-5 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${tier.recommended
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-purple-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                    Choose {tier.title}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* About / CTA Section */}
        <section id="about" className="py-20 bg-gray-900 text-white overflow-hidden relative">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto px-4 text-center relative z-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start your journey?</h2>
            <p className="text-xl text-gray-400 mb-10">
              Join thousands of investors who trust coinTrack for their portfolio management.
            </p>
            <Link
              href="/register"
              className="inline-flex px-8 py-4 rounded-full bg-purple-600 text-white text-lg font-bold hover:bg-purple-500 transition-all shadow-xl hover:shadow-purple-600/30 items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-black py-20 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/coinTrack.png"
                    alt="coinTrack Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">coinTrack</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                Empowering investors with real-time analytics, bank-grade security, and comprehensive portfolio tracking tools.
              </p>
              <div className="flex gap-4">
                {/* Social placeholders */}
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-600 transition-all cursor-pointer">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-600 transition-all cursor-pointer">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-7">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#about" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} coinTrack Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
