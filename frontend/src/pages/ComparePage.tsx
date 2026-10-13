import React, { useEffect, useState } from 'react';
import { productService, historyService } from '../services/api';
import type { Product, ScanResult } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';
import { Trophy, Check } from 'lucide-react';

interface ComparePageProps {
  onNavigate?: (tab: string, data?: any) => void;
}

export const ComparePage: React.FC<ComparePageProps> = () => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any | null>(null);

  useEffect(() => {
    historyService.getHistory().then((data) => {
      setHistory(data);
      if (data.length >= 2) {
        setSelectedIds([data[0].product.id, data[1].product.id]);
      }
    });
  }, []);

  const handleRunComparison = async (ids: number[]) => {
    if (ids.length < 2) return;
    try {
      const res = await productService.compareProducts(ids);
      setComparisonData(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedIds.length >= 2) {
      handleRunComparison(selectedIds);
    }
  }, [selectedIds]);

  const toggleSelectProduct = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      
      <div className="space-y-1 text-center max-w-xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider text-[#635BFF] bg-[#EEF2FF] border border-[#635BFF]/20 px-3 py-1 rounded-full inline-block mb-1">
          Multi-Column Matrix
        </span>
        <h1 className="text-3xl font-black text-[#17172B] tracking-tight">Product Comparison Matrix</h1>
        <p className="text-[#64748B] text-xs font-semibold">
          Compare up to 4 food products side-by-side to evaluate calories, sugar, protein, sodium, and personalized suitability scores.
        </p>
      </div>

      {/* Product Selector Bar */}
      <div className="card-fresh p-6 space-y-4">
        <h3 className="text-xs font-black text-[#64748B] uppercase tracking-wider">Select Products to Compare</h3>
        
        {history.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {history.map((scan) => {
              const isSelected = selectedIds.includes(scan.product.id);
              return (
                <button
                  key={scan.scan_id}
                  onClick={() => toggleSelectProduct(scan.product.id)}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-extrabold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#635BFF] text-white shadow-xs'
                      : 'bg-[#F8F9FD] border border-[#E2E8F0] text-[#64748B] hover:text-[#17172B]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  {scan.product.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#64748B] font-medium">Scan at least 2 food products to compare them!</p>
        )}
      </div>

      {/* Winner Summary Banner */}
      {comparisonData && (
        <div className="card-fresh p-6 flex items-center gap-4 border border-[#10B981]/30 bg-[#F0FDF4]/50">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Trophy className="w-6 h-6 text-amber-300" />
          </div>
          <p className="text-sm font-extrabold text-[#17172B] leading-relaxed">
            {comparisonData.comparison_summary}
          </p>
        </div>
      )}

      {/* Comparison Grid */}
      {comparisonData && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {comparisonData.products.map((prod: Product, idx: number) => {
            const score = comparisonData.scores[idx];
            const isWinner = comparisonData.winner_product_id === prod.id;
            return (
              <div
                key={prod.id}
                className={`card-fresh p-6 space-y-4 relative ${
                  isWinner ? 'border-2 border-[#10B981] bg-[#F0FDF4]/30 shadow-md' : ''
                }`}
              >
                {isWinner && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#10B981] text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Trophy className="w-3 h-3 text-amber-300" /> Best Choice
                  </span>
                )}

                <div className="space-y-1 text-center pt-2">
                  <h4 className="font-extrabold text-[#17172B] text-base line-clamp-1">{prod.name}</h4>
                  <p className="text-xs text-[#64748B] font-medium">{prod.brand}</p>
                </div>

                <div className="flex justify-center">
                  <ScoreBadge score={score.personalized_score} size="md" />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E2E8F0] text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-semibold">Calories</span>
                    <span className="font-mono text-[#17172B] font-black">{prod.nutrition?.energy_kcal ?? 'N/A'} kcal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-semibold">Sugars</span>
                    <span className="font-mono text-[#F59E0B] font-black">{prod.nutrition?.sugars_g ?? 'N/A'} g</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B] font-semibold">Protein</span>
                    <span className="font-mono text-[#10B981] font-black">{prod.nutrition?.protein_g ?? 'N/A'} g</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B] font-semibold">Sodium</span>
                    <span className="font-mono text-[#17172B] font-black">{prod.nutrition?.sodium_mg ?? 'N/A'} mg</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
