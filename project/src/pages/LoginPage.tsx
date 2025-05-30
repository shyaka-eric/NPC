import React from 'react';
import LoginForm from '../components/LoginForm';
import logisticsImage from '../images/logistics.jpg';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen text-white flex flex-col relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={logisticsImage} 
          alt="Logistics Operations" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center py-2 px-6">
          <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            NPC Logistics
          </div>
          <div></div>
        </header>

        {/* Main */}
        <main className="flex-grow flex flex-col md:flex-row items-center justify-center">
          {/* Left Section */}
          <section className="hidden md:block md:w-1/2 py-16 px-12">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent leading-tight mb-6">
                Streamlining Logistics for a Smarter Tomorrow
              </h1>
              <p className="text-lg text-slate-200 leading-relaxed mb-8">
                NPC Logistics is your trusted platform to manage, track, and optimize inventory and supply chains within national operations.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    title: 'Real-time Tracking',
                    description: 'Monitor your shipments and inventory in real-time',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    title: 'Smart Analytics',
                    description: 'Make data-driven decisions with advanced insights',
                    color: 'from-green-500 to-green-600'
                  },
                  {
                    title: 'Secure Platform',
                    description: 'Enterprise-grade security for your operations',
                    color: 'from-amber-500 to-amber-600'
                  },
                  {
                    title: '24/7 Support',
                    description: 'Round-the-clock assistance for your needs',
                    color: 'from-emerald-500 to-emerald-600'
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-slate-300">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right Section - Login */}
          <section className="w-full md:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center p-6 text-slate-300">
          <div>© 2025 NPC Logistics. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
