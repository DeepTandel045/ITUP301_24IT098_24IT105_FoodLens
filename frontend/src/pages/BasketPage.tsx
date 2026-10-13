import React, { useEffect, useState } from 'react';
import { basketService } from '../services/api';
import type { BasketAnalysis } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { ShoppingBag, Trash2, ShieldAlert, Sparkles } from 'lucide-react';

interface BasketPageProps {
  onNavigate: (tab: string, data?: any) => void;
}

export const BasketPage: React.FC<BasketPageProps> = ({ onNavigate }) => {
  const [basket, setBasket] = useState<BasketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBasket = () => {
    basketService.getBasket()
      .then(setBasket)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBasket();
  }, []);

  const handleRemove = async (itemId: number) => {
    try {
      await basketService.removeItem(itemId);
      fetchBasket();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#635BFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      <div className="text-center space-y-1 max-w-xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider text-[#635BFF] bg-[#EEF2FF] border border-[#635BFF]/20 px-3 py-1 rounded-full inline-block mb-1">
          Virtual Grocery Aggregator
        </span>
        <h1 className="text-3xl font-black text-[#17172B] tracking-tight">Shopping Basket Analysis</h1>
        <p className="text-[#64748B] text-xs font-semibold">
          Evaluate aggregate nutritional load and average suitability scores across your grocery items.
        </p>
      </div>

      {basket && basket.items.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Basket Items List */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-black text-[#17172B] uppercase tracking-wider">Basket Products ({basket.item_count})</h3>
            
            {basket.items.map((item) => (
              <div
                key={item.id}
                className="card-fresh p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#17172B] text-base">{item.product.name}</h4>
                  <p className="text-xs text-[#64748B] font-medium">{item.product.brand}</p>
                  <p className="text-xs text-[#635BFF] font-mono font-bold">
                    Sugar: {item.product.nutrition?.sugars_g ?? 0}g | Sodium: {item.product.nutrition?.sodium_mg ?? 0}mg
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#F8F9FD] text-[#17172B] border border-[#E2E8F0]">
                    Qty: {item.quantity}
                  </span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate Nutrition & Score Panel */}
          <div className="space-y-6">
            
            <div className="card-fresh p-6 text-center space-y-3 flex flex-col items-center">
              <span className="text-xs font-black text-[#64748B] uppercase tracking-wider">Average Basket Score</span>
              <ScoreBadge score={basket.average_personalized_score} label="Suitability Score" size="lg" />
            </div>

            {/* Warnings */}
            {basket.basket_warnings.length > 0 && (
              <div className="card-amber p-4 space-y-2 text-xs font-semibold text-[#17172B]">
                <div className="flex items-center gap-2 font-black text-[#F59E0B]">
                  <ShieldAlert className="w-4 h-4" /> Basket Alerts
                </div>
                {basket.basket_warnings.map((w, idx) => (
                  <p key={idx}>• {w}</p>
                ))}
              </div>
            )}

            {/* AI Basket Recommendation */}
            <div className="card-fresh p-5 space-y-2 border border-[#635BFF]/20 bg-[#EEF2FF]/40">
              <div className="flex items-center gap-2 text-[#635BFF] font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#635BFF]" /> FoodLens Recommendation
              </div>
              <p className="text-xs text-[#17172B] leading-relaxed font-semibold">
                {basket.ai_basket_recommendation}
              </p>
            </div>

          </div>

        </div>
      ) : (
        <div className="card-fresh p-12 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#635BFF]/30" />
          <h3 className="text-lg font-black text-[#17172B]">Your Shopping Basket is Empty</h3>
          <p className="text-xs text-[#64748B] font-semibold max-w-sm mx-auto">
            Scan food products and click "Add to Basket" on product detail pages to aggregate your nutritional intake!
          </p>
          <button
            onClick={() => onNavigate('scan')}
            className="px-6 py-3 rounded-[16px] font-extrabold bg-[#635BFF] text-white hover:bg-[#4E44E6] text-xs shadow-md transition-all"
          >
            Scan Food Products Now
          </button>
        </div>
      )}

    </div>
  );
};
