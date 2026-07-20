import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Send } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Logo from './Logo';

const Footer = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <footer className="relative bg-[#0b1120] border-t border-cyan-900/50 pt-12 lg:pt-16 pb-8 overflow-hidden mt-auto">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8 lg:gap-12 mb-10">
          {/* Brand Column */}
          <div className="col-span-1 lg:col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="flex items-center justify-center sm:justify-start space-x-3 mb-6">
              <Logo size={32} />
              <span className="font-bold text-2xl tracking-tight text-white">I T T</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Empowering your financial journey with modern trading solutions, advanced algorithms, and real-time market insights. Join the future of trading.
            </p>
            {/* Social Icons */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-bold text-xs">
                TW
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-bold text-xs">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-bold text-xs">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 font-bold text-xs">
                IN
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start w-full">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3 hidden sm:block"></span>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { name: 'Invest', path: user ? "/invest" : "/register" },
                { name: 'About Us', path: '/about' },
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Login', path: '/login' },
              ].map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-slate-400 hover:text-cyan-400 flex items-center justify-center sm:justify-start transition-colors group text-sm">
                    <ChevronRight className="w-4 h-4 mr-2 text-cyan-500/0 group-hover:text-cyan-500 transition-all transform -translate-x-2 group-hover:translate-x-0 hidden sm:block" />
                    <span className="transform sm:group-hover:translate-x-1 transition-transform">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start w-full">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3 hidden sm:block"></span>
              Contact Us
            </h3>
            <ul className="space-y-5 sm:space-y-4 text-sm text-slate-400">
              <li className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="mb-2 sm:mb-0 sm:mt-1 bg-slate-800/50 p-2 rounded-lg text-cyan-400 sm:mr-3">
                  <MapPin className="w-4 h-4"/>
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Headquarters</p>
                  <p className="mt-1">123 Trading Lane</p>
                  <p>New York, NY 10004</p>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row items-center justify-center sm:justify-start">
                <div className="mb-2 sm:mb-0 bg-slate-800/50 p-2 rounded-lg text-cyan-400 sm:mr-3">
                  <Mail className="w-4 h-4"/>
                </div>
                <span className="hover:text-white transition-colors cursor-pointer">support@itt.com</span>
              </li>
              <li className="flex flex-col sm:flex-row items-center justify-center sm:justify-start">
                <div className="mb-2 sm:mb-0 bg-slate-800/50 p-2 rounded-lg text-cyan-400 sm:mr-3">
                  <Phone className="w-4 h-4"/>
                </div>
                <span className="hover:text-white transition-colors cursor-pointer">+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center justify-center sm:justify-start w-full">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3 hidden sm:block"></span>
              Newsletter
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Subscribe to get the latest updates on market trends.
            </p>
            <form className="relative group w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-slate-900/80 border border-slate-700 text-white text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg px-3 flex items-center justify-center transition-colors"
                aria-label="Subscribe"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="mt-10 flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/60">
          <p className="text-sm text-slate-500 mb-6 md:mb-0 text-center">
            &copy; {new Date().getFullYear()} I T T. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors">Terms</a>
            <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
