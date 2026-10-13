import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Scan, 
  LayoutDashboard, 
  ShoppingBag, 
  History as HistoryIcon, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  GitCompare
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, data?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const mainNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, authRequired: true },
    { id: 'smart_basket', label: 'Smart Basket', icon: ShoppingBag, authRequired: false },
    { id: 'scan', label: 'Scan Food', icon: Scan, authRequired: false },
    { id: 'my_lists', label: 'My Lists', icon: Sparkles, authRequired: false },
    { id: 'compare', label: 'Compare', icon: GitCompare, authRequired: true },
    { id: 'history', label: 'History', icon: HistoryIcon, authRequired: true },
  ];

  const secondaryNavItems = [
    { id: 'profile', label: 'Profile', icon: UserIcon, authRequired: true },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP LEFT SIDEBAR NAVIGATION (Section 12 spec)                         */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#E2E8F0] p-6 z-40 justify-between">
        
        <div className="space-y-8">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 cursor-pointer group px-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-extrabold shadow-md shadow-[#635BFF]/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black text-[#17172B] tracking-tight block">FOODLENS</span>
              <span className="text-[10px] font-extrabold tracking-wider text-[#64748B] uppercase block -mt-1">
                Nutrition Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] px-3 block mb-2">
              Menu
            </span>
            {mainNavItems.map((item) => {
              if (item.authRequired && !user) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-all text-left ${
                    isActive
                      ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/25'
                      : 'text-[#64748B] hover:text-[#17172B] hover:bg-[#F1F3FE]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                  {item.label}
                </button>
              );
            })}

            <div className="pt-4 border-t border-[#E2E8F0] my-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] px-3 block mb-2">
                Account
              </span>
              {secondaryNavItems.map((item) => {
                if (item.authRequired && !user) return null;
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/25'
                        : 'text-[#64748B] hover:text-[#17172B] hover:bg-[#F1F3FE]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* User Card at Bottom of Sidebar */}
        {user ? (
          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 p-2.5 rounded-[16px] hover:bg-[#F1F3FE] cursor-pointer transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#635BFF] text-white flex items-center justify-center font-black text-sm shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#17172B] truncate">{user.name}</p>
                <p className="text-[10px] font-semibold text-[#635BFF] bg-[#EEF2FF] px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wider">
                  {user.dietary_goal ? user.dietary_goal.replace('_', ' ') : 'Healthy Plan'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-xs font-bold text-[#EF4444] hover:bg-[#FFF1F2] transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('login')}
              className="w-full py-3 rounded-[16px] text-sm font-bold text-[#635BFF] bg-[#EEF2FF] hover:bg-[#E0E7FF] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="w-full py-3 rounded-[16px] text-sm font-extrabold text-white bg-[#635BFF] hover:bg-[#4E44E6] transition-colors shadow-md shadow-[#635BFF]/25"
            >
              Get Started
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE TOP HEADER BAR                                                      */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 bg-white border-b border-[#E2E8F0] px-4 py-3 z-40 flex items-center justify-between shadow-xs">
        <div 
          onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#635BFF] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black text-[#17172B] tracking-tight">FOODLENS</span>
        </div>

        {user ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full bg-[#635BFF] text-white flex items-center justify-center font-bold text-xs"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('login')}
            className="text-xs font-bold text-[#635BFF] bg-[#EEF2FF] px-3.5 py-1.5 rounded-full"
          >
            Sign In
          </button>
        )}
      </header>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-3 py-2 z-50 flex items-center justify-around shadow-lg">
        
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'dashboard' || activeTab === 'landing' ? 'text-[#635BFF]' : 'text-[#64748B]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        {/* 2. Smart Basket */}
        <button
          onClick={() => setActiveTab('smart_basket')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'smart_basket' ? 'text-[#635BFF]' : 'text-[#64748B]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Basket</span>
        </button>

        {/* 3. HERO SCAN CTA BUTTON (Center visually dominant button!) */}
        <button
          onClick={() => setActiveTab('scan')}
          className="flex flex-col items-center justify-center -mt-5"
        >
          <div className="w-14 h-14 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-lg shadow-[#635BFF]/30 ring-4 ring-[#F8F9FD] active:scale-95 transition-transform">
            <Scan className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-black text-[#635BFF] mt-1">Scan</span>
        </button>

        {/* 4. My Lists */}
        <button
          onClick={() => setActiveTab('my_lists')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'my_lists' ? 'text-[#635BFF]' : 'text-[#64748B]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Lists</span>
        </button>

        {/* 5. Me / Profile */}
        <button
          onClick={() => setActiveTab(user ? 'profile' : 'login')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'profile' || activeTab === 'login' ? 'text-[#635BFF]' : 'text-[#64748B]'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>{user ? 'Me' : 'Account'}</span>
        </button>

      </nav>
    </>
  );
};
