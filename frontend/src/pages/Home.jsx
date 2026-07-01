import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center md:text-left md:flex items-center justify-between">
            <div className="md:w-1/2 fade-in">
              <h1 className="text-5xl md:text-6xl font-extrabold text-brand-text leading-tight mb-6 tracking-tight">
                Invest in your <span className="text-brand-primary">Future</span> Today
              </h1>
              <p className="text-xl text-brand-text/80 mb-8 max-w-2xl mx-auto md:mx-0">
                Trade cryptocurrencies, stocks, and forex with our next-generation trading platform. Experience lightning-fast execution and bank-grade security.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <Link to="/register" className="btn-primary flex items-center justify-center text-lg px-8 py-4">
                  Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/about" className="btn-secondary flex items-center justify-center text-lg px-8 py-4">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 mt-12 md:mt-0 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-primary/30 rounded-3xl blur-3xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=90" 
                  alt="Professional Trading Dashboard" 
                  className="rounded-3xl shadow-2xl relative z-10 border-8 border-white w-full object-cover h-[350px] md:h-[550px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ICT Tools Animation Section */}
      <section className="py-20 bg-brand-secondary overflow-hidden border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-brand-text mb-4">World-Class ICT Infrastructure</h2>
          <p className="text-xl text-brand-muted">Precision tools engineered for institutional trading performance.</p>
          <div className="w-24 h-1.5 bg-brand-primary mx-auto mt-6 rounded-full shadow-lg"></div>
        </div>
        
        <div className="relative flex overflow-hidden group">
          <div className="animate-marquee flex whitespace-nowrap py-4">
            {[
              { name: 'Neural Networks', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80' },
              { name: 'Quantum Servers', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80' },
              { name: 'Professional Charger', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80' },
              { name: 'Cloud Infrastructure', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80' },
              { name: 'Global Data Sync', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80' },
              { name: 'Edge Computing', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80' },
              { name: 'Secure Blockchains', img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80' }
            ].map((tool, i) => (
              <div key={i} className="flex flex-col items-center mx-10">
                <div className="w-96 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transition-all duration-700 hover:scale-110 hover:rotate-2">
                  <img src={tool.img} alt={tool.name} className="w-full h-full object-cover" />
                </div>
                <span className="mt-6 text-2xl font-bold text-brand-text bg-white px-6 py-2 rounded-full shadow-sm">{tool.name}</span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              { name: 'Neural Networks', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80' },
              { name: 'Quantum Servers', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80' },
              { name: 'Professional Charger', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80' },
              { name: 'Cloud Infrastructure', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80' },
              { name: 'Global Data Sync', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80' },
              { name: 'Edge Computing', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80' },
              { name: 'Secure Blockchains', img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=600&q=80' }
            ].map((tool, i) => (
              <div key={`dup-${i}`} className="flex flex-col items-center mx-10">
                <div className="w-96 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transition-all duration-700 hover:scale-110 hover:rotate-2">
                  <img src={tool.img} alt={tool.name} className="w-full h-full object-cover" />
                </div>
                <span className="mt-6 text-2xl font-bold text-brand-text bg-white px-6 py-2 rounded-full shadow-sm">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessories Marketplace */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-brand-text mb-4">Trading Accessories</h2>
              <p className="text-xl text-brand-muted">Premium gear to enhance your professional trading experience.</p>
            </div>
            <button onClick={() => navigate(user ? '/invest' : '/register')} className="mt-6 md:mt-0 text-brand-primary font-bold flex items-center hover:underline">
              View All Shop <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Anti-Static Strap', price: '$2.00', img: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?auto=format&fit=crop&w=400&q=80' },
              { name: 'Professional Charger', price: '$25.00', img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80' },
              { name: 'USB Secure Drive', price: '$15.00', img: 'https://images.unsplash.com/photo-1588127333419-b9d7de223dcf?auto=format&fit=crop&w=400&q=80' },
              { name: 'Trading Mouse', price: '$45.00', img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80' },
              { name: 'Hardware Wallet', price: '$95.00', img: 'https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?auto=format&fit=crop&w=400&q=80' },
              { name: 'Mechanical Key', price: '$125.00', img: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=400&q=80' },
              { name: 'Triple Monitor', price: '$499.00', img: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=400&q=80' },
              { name: 'Workstation Pro', price: '$850.00', img: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=400&q=80' }
            ].map((item, i) => (
              <div key={i} className="group card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-brand-border">
                <div className="relative h-48 mb-6 rounded-xl overflow-hidden shadow-inner bg-gray-50">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-brand-primary font-bold shadow-md">
                    {item.price}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-brand-text mb-2">{item.name}</h3>
                <p className="text-brand-muted text-sm mb-4">Official I T T approved gear for professional performance.</p>
                <button onClick={() => navigate(user ? '/invest' : '/register')} className="w-full py-3 bg-brand-primary/10 text-brand-primary font-bold rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-all">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-brand-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-brand-text mb-4">Why Choose I T T?</h2>
            <p className="text-brand-muted max-w-2xl mx-auto">We provide the tools and resources you need to succeed in the dynamic world of trading.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card hover:-translate-y-2 transition duration-300">
              <div className="bg-brand-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Advanced Tools</h3>
              <p className="text-brand-muted">Access professional-grade charting, technical indicators, and real-time market data to make informed decisions.</p>
            </div>
            
            <div className="card hover:-translate-y-2 transition duration-300">
              <div className="bg-brand-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-brand-accent" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Secure Platform</h3>
              <p className="text-brand-muted">Your assets are protected by industry-leading security protocols, including cold storage and two-factor authentication.</p>
            </div>
            
            <div className="card hover:-translate-y-2 transition duration-300">
              <div className="bg-blue-400/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-brand-text mb-3">Portfolio Analytics</h3>
              <p className="text-brand-muted">Track your performance with comprehensive analytics and detailed reporting on your investment portfolio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-brand-dark border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">$50B+</div>
              <div className="text-brand-muted">Quarterly Volume</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-accent mb-2">2M+</div>
              <div className="text-brand-muted">Verified Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">150+</div>
              <div className="text-brand-muted">Countries Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-brand-muted">Customer Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
