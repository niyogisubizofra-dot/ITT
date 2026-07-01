import { ShieldCheck, Zap, Globe, Lock, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DepositModal from '../components/DepositModal';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import axios from 'axios';

const Invest = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [loadingCode, setLoadingCode] = useState(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shortfall, setShortfall] = useState(null);

  const handleInvest = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const cleanAmount = product.price.replace('$', '').replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    const balance = parseFloat(user.balance || 0);

    setSelectedProduct(product);

    if (balance < amount) {
      setShortfall((amount - balance).toFixed(2));
      setInsufficientBalanceOpen(true);
      return;
    }

    setPaymentOpen(true);
  };

  const handleRecharge = () => {
    setInsufficientBalanceOpen(false);
    setDepositOpen(true);
  };

  const handleDepositSuccess = () => {
    // Close deposit modal
    setDepositOpen(false);
    
    // After a brief delay to allow state update, check balance again and proceed to payment
    setTimeout(() => {
      if (!selectedProduct) return;
      
      const cleanAmount = selectedProduct.price.replace('$', '').replace(/,/g, '');
      const amount = parseFloat(cleanAmount);
      const currentBalance = parseFloat(user?.balance || 0);

      // If balance is now sufficient, proceed to payment
      if (currentBalance >= amount) {
        setPaymentOpen(true);
      } else {
        // If still insufficient, show insufficient balance again
        const stillShortfall = (amount - currentBalance).toFixed(2);
        setShortfall(stillShortfall);
        setInsufficientBalanceOpen(true);
      }
    }, 500);
  };

  const handleConfirmPayment = () => {
    if (!selectedProduct) return;

    const cleanAmount = selectedProduct.price.replace('$', '').replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    const newBalance = Math.max(0, parseFloat(user.balance || 0) - amount);

    // Update user balance
    useAuthStore.setState({ user: { ...user, balance: newBalance } });

    // Add investment to active investments
    const addInvestment = useAuthStore.getState().addInvestment;
    addInvestment({
      name: selectedProduct.name,
      price: selectedProduct.price,
      dailyProfit: selectedProduct.profit,
      type: selectedProduct.type,
      amount: amount,
    });

    setPaymentOpen(false);
    setSelectedProduct(null);
    alert(`Successfully invested in ${selectedProduct.name}! Your profit will be added at the end of the day.`);
    navigate('/dashboard?tab=investments');
  };
  const products = [
    { 
      name: 'VIP 1', 
      type: 'Entry Level Node', 
      price: '$5.00', 
      profit: '$0.20', 
      img: '/vip1_node.png',
      badge: 'Starter',
      color: 'border-blue-200'
    },
    { 
      name: 'VIP 2', 
      type: 'Core Cloud Instance', 
      price: '$15.00', 
      profit: '$0.65', 
      img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
      badge: 'Popular',
      color: 'border-blue-400'
    },
    { 
      name: 'VIP 3', 
      type: 'Neural Compute Unit', 
      price: '$50.00', 
      profit: '$2.50', 
      img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
      badge: 'Advanced',
      color: 'border-blue-600'
    },
    { 
      name: 'VVP 1', 
      type: 'Quantum Core', 
      price: '$150.00', 
      profit: '$8.50', 
      img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80',
      badge: 'Professional',
      color: 'border-purple-400'
    },
    { 
      name: 'VVP 2', 
      type: 'Global Sync Node', 
      price: '$500.00', 
      profit: '$32.00', 
      img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
      badge: 'Elite',
      color: 'border-purple-600'
    },
    { 
      name: 'VVP 3', 
      type: 'Tera Data Center', 
      price: '$1,500.00', 
      profit: '$105.00', 
      img: 'https://images.unsplash.com/photo-1516383274235-5f42d6c6426d?auto=format&fit=crop&w=400&q=80',
      badge: 'Prestige',
      color: 'border-purple-800'
    },
    { 
      name: 'VVVP 1', 
      type: 'Infinite ICT Hub', 
      price: '$5,000.00', 
      profit: '$420.00', 
      img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
      badge: 'Legendary',
      color: 'border-brand-primary'
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-16 fade-in">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-3 sm:mb-6 tracking-tight">ICT Investment Products</h1>
          <p className="text-sm sm:text-base lg:text-xl text-slate-500 font-medium px-2">Choose a professional ICT infrastructure tier and start earning daily profits from global tech performance.</p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
           {[
             { icon: ShieldCheck, title: 'Secure', text: 'Blockchain Verified', color: 'text-emerald-500' },
             { icon: Zap, title: 'Instant', text: 'Daily Payouts', color: 'text-yellow-500' },
             { icon: Globe, title: 'Global', text: 'Cloud Scale', color: 'text-blue-500' },
             { icon: Lock, title: 'Fixed', text: 'Guaranteed Returns', color: 'text-purple-500' },
           ].map((f, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="bg-slate-50 p-3 rounded-xl"><f.icon className={`w-6 h-6 ${f.color}`} /></div>
                <div>
                   <p className="font-black text-slate-800">{f.title}</p>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{f.text}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {products.map((p, i) => (
            <div key={i} className={`bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition duration-500 border-2 ${p.color} flex flex-col group`}>
              <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                <div className="absolute top-4 right-4">
                   <span className="bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">{p.badge}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-2 sm:bottom-4 left-3 sm:left-6">
                   <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-black italic">{p.name}</h2>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex-grow flex flex-col">
                <p className="text-[10px] sm:text-xs font-black text-brand-primary uppercase tracking-widest mb-2">{p.type}</p>
                <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-6 md:mb-8">
                   <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-xs sm:text-sm">Product Price</span>
                      <span className="text-slate-800 font-black text-lg sm:text-xl md:text-2xl">{p.price}</span>
                   </div>
                   <div className="flex justify-between items-center p-2 sm:p-3 md:p-4 bg-emerald-50 rounded-lg sm:rounded-2xl border border-emerald-100">
                      <span className="text-emerald-600 font-bold text-xs sm:text-sm">Daily Profit</span>
                      <span className="text-emerald-700 font-black text-base sm:text-lg md:text-xl">{p.profit}</span>
                   </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
                   <div className="flex items-center text-slate-500 font-bold">
                      <Zap className="w-3 h-3 mr-1.5 text-yellow-500 shrink-0" /> Auto-mining starts immediately
                   </div>
                   <div className="flex items-center text-slate-500 font-bold">
                      <Zap className="w-3 h-3 mr-1.5 text-yellow-500 shrink-0" /> 24/7 technical monitoring
                   </div>
                </div>
              </div>

              <div className="p-2 sm:p-4 md:p-6 pt-0 mt-auto">
                <button 
                  onClick={() => handleInvest(p)}
                  disabled={loadingCode === p.name}
                  className="w-full btn-primary py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base flex items-center justify-center group-hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
                  >
                   {loadingCode === p.name ? 'Processing...' : <>Invest Now <ArrowRight className="ml-1 sm:ml-2 w-4 sm:w-5 h-4 sm:h-5" /></>}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-20 p-4 sm:p-8 md:p-12 bg-white rounded-2xl sm:rounded-[3rem] shadow-xl border border-slate-100 text-center relative overflow-hidden">
           <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 mb-2 sm:mb-4">Enterprise Grade Infrastructure</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-500 max-w-2xl mx-auto font-medium px-2">Our VVP and VVVP nodes are connected to Tier-4 data centers worldwide, ensuring the highest stability and maximum profit yield for high-volume investors.</p>
           </div>
           <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 sm:opacity-100"></div>
        </div>
      </div>

      {paymentOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
          <div className="absolute inset-0 bg-slate-900/70" onClick={() => setPaymentOpen(false)} />
          <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl z-10 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Confirm payment</h2>
                <p className="mt-2 text-sm text-slate-500">Use wallet balance to complete your investment in {selectedProduct.name}.</p>
              </div>
              <button onClick={() => setPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-500">Product cost</span>
                <span className="text-lg font-black text-slate-900">{selectedProduct.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Available balance</span>
                <span className="text-lg font-black text-emerald-600">${parseFloat(user.balance || 0).toFixed(2)}</span>
              </div>
              <div className="mt-4 rounded-3xl bg-white p-4 border border-emerald-100 text-sm text-slate-600">
                You have enough balance to pay for this product. Click confirm to complete your investment.
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="mt-6 w-full rounded-3xl bg-emerald-500 py-4 text-base font-black text-white transition hover:bg-emerald-600"
            >
              Pay {selectedProduct.price}
            </button>
          </div>
        </div>
      )}

      <DepositModal
        open={depositOpen}
        onClose={() => {
          setDepositOpen(false);
          setShortfall(null);
          setSelectedProduct(null);
        }}
        onDeposit={handleDepositSuccess}
        requiredAmount={shortfall}
        requiredFor={selectedProduct?.name}
      />

      <InsufficientBalanceModal
        open={insufficientBalanceOpen}
        onClose={() => {
          setInsufficientBalanceOpen(false);
          setShortfall(null);
          setSelectedProduct(null);
        }}
        onRecharge={handleRecharge}
        requiredAmount={shortfall}
        productName={selectedProduct?.name}
      />
    </div>
  );
};

export default Invest;
