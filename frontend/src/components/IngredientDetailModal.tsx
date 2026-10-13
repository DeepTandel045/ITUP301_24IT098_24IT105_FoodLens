import React from 'react';
import { X, Info, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface IngredientDetail {
  name: string;
  code?: string;
  category: string;
  description: string;
  purpose: string;
  profileImpact: string;
  isConcern?: boolean;
}

interface IngredientDetailModalProps {
  ingredient: IngredientDetail | null;
  onClose: () => void;
}

export const IngredientDetailModal: React.FC<IngredientDetailModalProps> = ({ ingredient, onClose }) => {
  if (!ingredient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-[24px] border border-[#E5E9E6] p-6 shadow-2xl space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#5A6561] hover:bg-[#F8F8F4] hover:text-[#17201C] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BFF] border border-[#635BFF]/20">
              {ingredient.code || 'INGREDIENT'}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">{ingredient.category}</span>
          </div>
          <h2 className="text-2xl font-black text-[#17172B] tracking-tight">{ingredient.name}</h2>
        </div>

        {/* Structured Intelligence Cards */}
        <div className="space-y-4">
          
          {/* What is it? */}
          <div className="p-4 rounded-[18px] bg-[#F8F9FD] border border-[#E2E8F0] space-y-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#635BFF] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#635BFF]" /> What is it?
            </h4>
            <p className="text-sm text-[#17172B] leading-relaxed font-medium">
              {ingredient.description}
            </p>
          </div>

          {/* Why is it here? */}
          <div className="p-4 rounded-[18px] bg-[#F8F9FD] border border-[#E2E8F0] space-y-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#635BFF]">
              Why is it here?
            </h4>
            <p className="text-sm text-[#17172B] leading-relaxed font-medium">
              {ingredient.purpose}
            </p>
          </div>

          {/* For your profile (RED for alert concern, GREEN for healthy safe) */}
          <div className={`p-4 rounded-[18px] border space-y-1 ${
            ingredient.isConcern 
              ? 'bg-[#FFF1F2] border-[#EF4444]/30 text-[#17172B]' 
              : 'bg-[#ECFDF5] border-[#10B981]/30 text-[#17172B]'
          }`}>
            <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              {ingredient.isConcern ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  <span className="text-[#EF4444]">For Your Goal Profile (Alert)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981]">For Your Goal Profile (Safe)</span>
                </>
              )}
            </h4>
            <p className="text-sm leading-relaxed font-medium">
              {ingredient.profileImpact}
            </p>
          </div>

        </div>

        {/* Bottom CTA */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-[18px] font-extrabold bg-[#635BFF] text-white hover:bg-[#4E44E6] transition-all shadow-md shadow-[#635BFF]/30 text-sm cursor-pointer"
        >
          Got it
        </button>

      </div>
    </div>
  );
};
