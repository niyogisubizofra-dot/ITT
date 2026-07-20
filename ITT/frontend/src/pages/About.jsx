import { Clock, ShieldCheck, Wallet, Activity, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const About = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="w-full fade-in bg-slate-50 min-h-screen">
      {/* Header Showcase */}
      <section className="relative bg-white pt-10 pb-24 text-center overflow-hidden border-b border-slate-100">
        
        {/* Animated 3D Welcome Text */}
        <div className="w-full overflow-hidden mb-12 relative h-32 md:h-48 flex items-center bg-slate-900 shadow-inner">
           <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-brand-accent/20 to-brand-primary/20 bg-[length:200%_auto] animate-pulse"></div>
           <span className="animate-slide-rtl text-3d text-[5rem] md:text-[9rem] font-black text-white uppercase tracking-[0.2em] relative z-10 leading-none">
             Welcome to I T T
           </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent z-0"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">ICT Tools Trader</h1>
          <p className="text-xl text-slate-600 mx-auto max-w-3xl leading-relaxed">
            The world's premium automated profit-generation platform. Purchase high-performance ICT tools and earn exceptional, continuous returns on your investments globally.
          </p>
        </div>
      </section>

      {/* Extreme Profit Mechanism */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=90" 
                alt="ICT Profit Interface" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 to-transparent flex items-end p-10">
                 <div>
                    <h3 className="text-white text-2xl font-black mb-2">Automated Execution</h3>
                    <p className="text-slate-300 font-medium">Your purchased nodes work 24/7 without interruption.</p>
                 </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">Generate Extreme Profits on Your Watch</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                At I T T, we have revolutionized infrastructure investments. By purchasing our professional ICT tech products and computing nodes, you unlock a continuous stream of immense revenue. 
              </p>
              
              <div className="space-y-6">
                 {[
                   { period: 'Daily Payouts', desc: 'Secure your yield every 24 hours directly to your wallet.', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                   { period: 'Weekly & Monthly Epochs', desc: 'Lock in for 1-week or 1-month cycles for exponentially higher compound returns.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
                   { period: '2 & 3 Month Mega-Nodes', desc: 'The absolute pinnacle of extreme profitability. Commit to extended terms for life-changing wealth generation.', icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50' },
                 ].map((feature, i) => (
                   <div key={i} className="flex items-start space-x-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:shadow-md transition">
                      <div className={`${feature.bg} p-4 rounded-2xl`}>
                        <feature.icon className={`w-8 h-8 ${feature.color}`} />
                      </div>
                      <div>
                         <h4 className="text-xl font-bold text-slate-800 mb-1">{feature.period}</h4>
                         <p className="text-slate-500 font-medium leading-snug">{feature.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              
              <Link to={user ? "/invest" : "/register"} className="btn-primary mt-10 w-full text-center py-4 text-xl font-black shadow-2xl shadow-brand-primary/30 hover:scale-[1.02] active:scale-95 transition-all inline-block">
                Explore Investment Tiers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Binance Partnership */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center space-x-3 bg-yellow-100 border border-yellow-200 px-6 py-2 rounded-full mb-8">
             <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
             <span className="text-yellow-700 font-black uppercase tracking-widest text-sm">Official Alliance</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-8">Direct Binance Integration</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-16">
            We work synchronously with <strong>Binance</strong> mechanisms to ensure total liquidity. It doesn't matter where you are in the world—when you want your profit, it executes globally in seconds.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2rem] border border-slate-200 hover:border-brand-primary/50 transition duration-300 shadow-sm hover:shadow-xl">
              <ShieldCheck className="h-12 w-12 text-brand-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Unrestricted Access</h3>
              <p className="text-slate-600 font-medium">Withdraw your capital and profits anytime, absolutely anywhere. Geography does not dictate your financial success anymore.</p>
            </div>
            <div className="bg-white p-10 rounded-[2rem] border border-slate-200 hover:border-yellow-500/50 transition duration-300 shadow-sm hover:shadow-xl relative transform md:-translate-y-6">
              <div className="w-16 h-16 mx-auto mb-6 bg-yellow-100 rounded-2xl flex items-center justify-center transform rotate-12 shadow-xl shadow-yellow-500/10">
                 <Wallet className="h-8 w-8 text-yellow-600 -rotate-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Instant Liquidity</h3>
              <p className="text-slate-600 font-medium">Bypass traditional banking delays. Thanks to our Binance alliance, payouts are processed directly on-chain instantly.</p>
            </div>
            <div className="bg-white p-10 rounded-[2rem] border border-slate-200 hover:border-brand-accent/50 transition duration-300 shadow-sm hover:shadow-xl">
              <Globe className="h-12 w-12 text-brand-accent mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Global Network</h3>
              <p className="text-slate-600 font-medium">From remote islands to massive metropolitan hubs, our infrastructure operates perfectly without borders.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
