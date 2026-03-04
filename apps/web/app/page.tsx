'use client';

import LandNavbar from "@/components/LandNavbar";
import ChatBubble from "@/components/ChatBubble";
import Footer from "@/components/Footer";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <main className={`relative min-h-screen w-full transition-colors duration-500 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>

      {/* Leaf background — sits behind everything */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/green_leaf_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: isDark ? 0.04 : 0.55,
        }}
      />

      {/* Fixed navbar */}
      <LandNavbar />

      {/* Hero Section — pt accounts for fixed navbar height (~72px) */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge */}
        <span className={`inline-flex items-center mb-6 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-widest uppercase border transition-colors duration-500 ${isDark
          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
          : 'border-emerald-600/30 text-emerald-700 bg-emerald-50'
          }`}>
          PS-CRM Platform
        </span>

        {/* Main heading */}
        <h1
          className={`font-[family-name:var(--font-playfair)] text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight max-w-4xl transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'
            }`}
        >
          Smart{' '}
          <span className="text-emerald-500">Public Service</span>
          <br className="hidden sm:block" />
          {' '}CRM
        </h1>

        {/* Divider */}
        <div className={`mt-6 sm:mt-8 mb-6 sm:mb-8 w-12 sm:w-16 h-px rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`} />

        {/* Subtitle */}
        <p className={`max-w-xl sm:max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed font-light transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
          Developing a centralized digital command center that{' '}
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            organizes citizen complaints
          </span>
          , automates workflows, assigns tasks, tracks progress in real time, and ensures{' '}
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            transparent and efficient grievance resolution
          </span>.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none">
          <a
            href="/login"
            className="w-full sm:w-auto rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
          >
            Get Started
          </a>
          <a
            href="#"
            className={`w-full sm:w-auto rounded-full px-8 py-3 text-sm font-semibold border transition-all duration-300 hover:-translate-y-0.5 text-center ${isDark
              ? 'border-white/20 text-white hover:bg-white/5'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            Learn More →
          </a>
        </div>
      </section>

      {/* Floating chat bubble */}
      <ChatBubble />

      {/* Footer */}
      <Footer />
    </main>
  );
}