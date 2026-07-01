import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import useAuthStore from '../store/authStore';
import { ThemeContext } from '../context/ThemeContext';
import { Menu, X, Sun, Moon } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleInviteClick = (e) => {
    if (user && user.referralCode) {
      e.preventDefault();
      try {
        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`);
        alert('Referral link automatically copied to clipboard! Share it to start earning.');
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
    setIsOpen(false);
  };

  const NavLinksLeft = () => (
    <>
      <Link to={user ? "/invest" : "/register"} className="block md:inline-block text-brand-text hover:text-brand-primary transition px-3 py-2 font-medium" onClick={() => setIsOpen(false)}>Invest</Link>
      <Link to="/about" className="block md:inline-block text-brand-text hover:text-brand-primary transition px-3 py-2 font-medium" onClick={() => setIsOpen(false)}>About Us</Link>
      <Link to={user ? "/dashboard?tab=referrals" : "/login"} className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-bold transition px-3 py-2" onClick={handleInviteClick}>
        Invite & Earn <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 rounded-full text-xs animate-pulse whitespace-nowrap">Bonus</span>
      </Link>
    </>
  );

  const NavLinksRight = () => (
    <>
      {user ? (
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border">
          <Link to="/dashboard" className="block text-brand-text hover:text-brand-primary transition px-3 py-2 font-medium" onClick={() => setIsOpen(false)}>Dashboard</Link>
          <button onClick={handleLogout} className="text-left md:text-center text-brand-text hover:text-red-400 transition px-3 py-2 font-medium w-full md:w-auto">Logout</button>
          <Link to="/dashboard?tab=referrals" className="btn-primary inline-block text-center px-4 py-2 w-full md:w-auto" onClick={() => setIsOpen(false)}>Invite Friends</Link>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border">
          <Link to="/login" className="block text-center md:text-left text-brand-text hover:text-brand-primary transition px-3 py-2 font-bold" onClick={() => setIsOpen(false)}>Login</Link>
          <Link to="/register" className="btn-primary inline-block text-center px-6 py-2 w-full md:w-auto" onClick={() => setIsOpen(false)}>Create Account</Link>
        </div>
      )}
    </>
  );

  return (
    <nav className="fixed w-full z-50 bg-brand-dark/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <Logo size={40} />
              <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-brand-primary">I T T</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center flex-grow justify-between ml-10">
            <div className="flex items-center space-x-2">
               <NavLinksLeft />
            </div>
            <div className="flex items-center space-x-4">
               <NavLinksRight />
               <button
                 onClick={toggleTheme}
                 className="p-2 rounded-full text-brand-text hover:bg-brand-secondary transition-colors"
               >
                 {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
               </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-brand-muted hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-muted hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-dark flex flex-col max-h-[85vh] overflow-y-auto">
          <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col shadow-xl">
            <NavLinksLeft />
            <NavLinksRight />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
