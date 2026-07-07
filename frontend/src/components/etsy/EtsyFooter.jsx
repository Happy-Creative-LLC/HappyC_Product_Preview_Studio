import React from 'react';
import { Camera, AtSign, Globe } from 'lucide-react';

const COLUMNS = [
  { title: 'Shop', links: ['Gift cards', 'Etsy Registry', 'Sitemap', 'Etsy blog', 'Etsy United Kingdom', 'Etsy Germany', 'Etsy Canada'] },
  { title: 'Sell', links: ['Sell on Etsy', 'Teams', 'Forums', 'Affiliates & Creators'] },
  { title: 'About', links: ['Etsy, Inc.', 'Policies', 'Investors', 'Careers', 'Press', 'Impact'] },
  { title: 'Help', links: ['Help Center', 'Privacy settings'] },
];

const EtsyFooter = () => {
  return (
    <>
      {/* Newsletter */}
      <div className="bg-[#e6f0fb] mt-16">
        <div className="max-w-[1000px] mx-auto px-4 py-10 text-center">
          <p className="text-base font-semibold text-gray-900 mb-4">
            Yes! Send me exclusive offers, unique gift ideas, and personalized tips for shopping and selling on Etsy.
          </p>
          <div className="flex justify-center gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow border border-gray-400 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900"
            />
            <button className="bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-black whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2f466c] text-white">
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Download app cell */}
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#f1641e] flex items-center justify-center font-black text-2xl mb-3">E</div>
              <button className="bg-white/10 hover:bg-white/20 text-sm font-medium px-4 py-2 rounded-full transition-colors">
                Download the Etsy App
              </button>
            </div>
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-[13px] text-white/80 hover:text-white hover:underline">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/15">
            <Camera size={18} className="text-white/80 hover:text-white cursor-pointer" />
            <AtSign size={18} className="text-white/80 hover:text-white cursor-pointer" />
            <Globe size={18} className="text-white/80 hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#26385a]">
          <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-wrap items-center gap-4 text-[12px] text-white/70">
            <span>United States | English (US) | $ (USD)</span>
            <span className="ml-auto">© 2026 Etsy, Inc.</span>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Interest-based ads</a>
            <a href="#" className="hover:underline">Local Shops</a>
            <a href="#" className="hover:underline">Regions</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default EtsyFooter;
