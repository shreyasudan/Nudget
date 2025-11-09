'use client';

import Navbar from '@/components/Navbar';
import DashboardPreview from '@/components/DashboardPreview';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-[#FFFAFA]" style={{ paddingTop: '120px' }}>
        <div className="mx-auto max-w-7xl px-8 lg:px-12 py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side: Text content */}
            <div style={{ paddingLeft: 'clamp(2rem, 5vw, 6rem)' }}>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                <span className="text-[#000000]">Spend </span>
                <span className="text-[#E97451] italic" style={{ fontFamily: "'Playfair Display', serif" }}>freely.</span>
                <br />
                <span className="text-[#E97451] italic" style={{ fontFamily: "'Playfair Display', serif" }}>Save </span>
                <span className="text-[#000000]">confidently.</span>
              </h1>
              <p className="text-xl text-[#2C1810] leading-relaxed">
                No matter how your money comes in, Nudget helps you stay ahead instead of catching up.
              </p>
            </div>

            {/* Right side: Dashboard preview */}
            <div className="flex justify-center lg:justify-end">
              <DashboardPreview />
            </div>
          </div>
        </div>

        {/* Generous spacing between sections */}
        <div className="h-32 lg:h-40"></div>

        {/* Features / Benefits Section */}
        <section id="features" className="bg-white scroll-mt-20" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
          <div className="mx-auto max-w-7xl" style={{ paddingLeft: 'clamp(4rem, 8vw, 8rem)', paddingRight: 'clamp(2rem, 5vw, 5rem)' }}>
            <div className="flex flex-col items-center" style={{ marginBottom: '80px' }}>
              <h2 className="text-3xl font-bold text-[#2C1810] mb-8 text-center">
                Built For Your Financial Reality
              </h2>
              <p className="text-xl text-[#E97451] max-w-4xl text-center leading-relaxed italic">
                Whether your income is steady or varies month to month, Nudget adapts to help you stay in control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {/* Variable Income Handling */}
              <div className="bg-white rounded-lg pt-20 px-12 pb-20 shadow-sm hover:shadow-lg hover:bg-[#E97451]/5 hover:border-[#E97451]/30 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#E97451]/10 rounded-lg flex items-center justify-center mb-12">
                  <svg className="w-10 h-10 text-[#E97451]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2C1810] mb-6 leading-tight">
                  Variable Income Handling
                </h3>
                <p className="text-[#2C1810]/70 leading-relaxed text-lg">
                  Your budget adapts when your income changes. No more guessing—Nudget adjusts automatically.
                </p>
              </div>

              {/* Automatic Savings */}
              <div className="bg-white rounded-lg pt-20 px-12 pb-20 shadow-sm hover:shadow-lg hover:bg-[#E97451]/5 hover:border-[#E97451]/30 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#E97451]/10 rounded-lg flex items-center justify-center mb-12">
                  <svg className="w-10 h-10 text-[#E97451]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2C1810] mb-6 leading-tight">
                  Automatic Savings
                </h3>
                <p className="text-[#2C1810]/70 leading-relaxed text-lg">
                  Set it and forget it. Nudget saves for you automatically, so you don't have to think about it.
                </p>
              </div>

              {/* Goal Tracking */}
              <div className="bg-white rounded-lg pt-20 px-12 pb-20 shadow-sm hover:shadow-lg hover:bg-[#E97451]/5 hover:border-[#E97451]/30 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#E97451]/10 rounded-lg flex items-center justify-center mb-12">
                  <svg className="w-10 h-10 text-[#E97451]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#2C1810] mb-6 leading-tight">
                  Goal Tracking
                </h3>
                <p className="text-[#2C1810]/70 leading-relaxed text-lg">
                  See your progress in real-time. Track savings goals and watch your money grow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing between sections */}
        <div className="h-20 lg:h-24"></div>

        {/* FAQ Section */}
        <section id="faq" className="bg-white">
          <div className="py-32" style={{ paddingLeft: 'clamp(4rem, 10vw, 10rem)', paddingRight: 'clamp(4rem, 10vw, 10rem)' }}>
            <h2 className="text-3xl font-semibold text-[#2C1810]">Frequently Asked Questions</h2>
            <p className="mt-8 text-lg text-[#2C1810]/70 leading-relaxed">
              If you don't find your question below, feel free to <Link href="/contact" className="text-[#E97451] font-bold italic hover:underline">get in touch</Link>.
            </p>
            <div className="mt-16 space-y-8">
              {[
                {
                  question: "How does Nudget work with variable income?",
                  answer: "Nudget analyses your income and spending patterns, then sets micro-savings rules that adapt to your income fluctuations so you can save without thinking about it."
                },
                {
                  question: "Is there a free trial or cost to start?",
                  answer: "Yes — you can start for free with full features for your first 30 days. After that, you can choose a paid plan or continue with a limited free version."
                },
                {
                  question: "What happens if my income drops one month?",
                  answer: "Nudget automatically recalculates your savings and adjusts your budget surfaces so you only save what you can afford — you won't be locked into a fixed amount when income dips."
                },
                {
                  question: "How secure is my financial data?",
                  answer: "Your data is encrypted in transit and at rest. We don't sell your information; we only use it to help you save smarter."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes — you can cancel your subscription at any time without penalty. Your free version stays active so you can still access basic savings & tracking tools."
                }
              ].map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-8 py-8 text-left hover:opacity-80 transition-colors"
                  >
                    <h3 className={`text-xl font-normal pr-8 ${index % 2 === 0 ? 'text-[#E97451]' : 'text-[#000000]'}`}>
                      {faq.question}
                    </h3>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                        index % 2 === 0 ? 'text-[#E97451]' : 'text-[#000000]'
                      } ${openFaq === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-8 pb-8 text-md text-[#2C1810]/70 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Generous spacing before footer */}
        <div className="h-32 lg:h-40"></div>
      </main>
      <footer className="bg-[#2C1810] text-[#FFFAFA]">
        <div className="flex flex-col items-center gap-6 py-12 md:flex-row md:justify-between" style={{ paddingLeft: '40px', paddingRight: '40px' }}>
          <div className="text-sm text-[#FFFAFA]/80">&copy; {new Date().getFullYear()} Nudget. All rights reserved.</div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors">Terms of Service</Link>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[#FFFAFA]/80 hover:text-[#FFFAFA] transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}