import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { ComparePage } from './pages/ComparePage';
import { BasketPage } from './pages/BasketPage';
import { SmartBasketPage } from './pages/SmartBasketPage';
import { MyListsPage } from './pages/MyListsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import type { ScanResult } from './types';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedScanResult, setSelectedScanResult] = useState<ScanResult | null>(null);

  const handleNavigate = (tab: string, data?: any) => {
    if (tab === 'product_details' && data) {
      setSelectedScanResult(data);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect logged-in users landing page access to dashboard automatically
  React.useEffect(() => {
    if (user && (activeTab === 'landing' || activeTab === 'login' || activeTab === 'register')) {
      setActiveTab('dashboard');
    } else if (!user && activeTab !== 'landing' && activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'scan' && activeTab !== 'smart_basket' && activeTab !== 'my_lists') {
      setActiveTab('landing');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center text-[#64748B]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#635BFF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#18181B]">Initializing FoodLens Intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#18181B] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={handleNavigate} />
      
      {/* Main Content View with Responsive Desktop Sidebar Margin & Mobile Bottom Nav Safe Clearance */}
      <main className="flex-1 md:pl-64 pb-28 sm:pb-32 md:pb-8">
        {activeTab === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {activeTab === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {activeTab === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {activeTab === 'onboarding' && <OnboardingPage onNavigate={handleNavigate} />}
        {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {activeTab === 'smart_basket' && <SmartBasketPage onNavigate={handleNavigate} />}
        {activeTab === 'my_lists' && <MyListsPage onNavigate={handleNavigate} />}
        {activeTab === 'scan' && <ScanPage onNavigate={handleNavigate} />}
        {activeTab === 'product_details' && selectedScanResult && (
          <ProductDetailsPage scanResult={selectedScanResult} onNavigate={handleNavigate} />
        )}
        {activeTab === 'compare' && <ComparePage onNavigate={handleNavigate} />}
        {activeTab === 'basket' && <BasketPage onNavigate={handleNavigate} />}
        {activeTab === 'history' && <HistoryPage onNavigate={handleNavigate} />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      <footer className="md:pl-64 border-t border-[#E2E8F0] py-6 text-center text-xs text-[#64748B] bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-[#18181B]">FoodLens — Nutrition Intelligence Decision-Support Platform</span>
          <span>Educational Purpose Only — Verify Allergen Labels Directly</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
