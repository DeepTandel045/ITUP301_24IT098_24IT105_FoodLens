import React, { useState, useEffect } from 'react';
import { smartBasketService } from '../services/api';
import type { 
  SmartBasketPlanRequest, 
  ProposedBasketItem, 
  IndianFoodItem 
} from '../types';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Minus, 
  Trash2, 
  Sparkles, 
  Info, 
  Save, 
  AlertCircle,
  Calendar,
  Users,
  Search,
  Check
} from 'lucide-react';

interface SmartBasketPageProps {
  onNavigate: (tab: string, data?: any) => void;
}

export const SmartBasketPage: React.FC<SmartBasketPageProps> = ({ onNavigate }) => {
  // Step 1: Configuration State
  const [budgetInr, setBudgetInr] = useState<number>(1000);
  const [primaryGoal, setPrimaryGoal] = useState<string>('high_protein');
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>(['high_fiber']);
  const [dietaryPreference, setDietaryPreference] = useState<string>('vegetarian');
  const [householdSize, setHouseholdSize] = useState<number>(2);
  const [shoppingDuration, setShoppingDuration] = useState<string>('weekly');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  
  // Step 2: Recommendations & Checklist State
  const [loading, setLoading] = useState<boolean>(false);
  const [checklistItems, setChecklistItems] = useState<ProposedBasketItem[]>([]);
  const [catalogue, setCatalogue] = useState<IndianFoodItem[]>([]);
  const [showCataloguePicker, setShowCataloguePicker] = useState<boolean>(false);
  const [catalogueSearch, setCatalogueSearch] = useState<string>('');
  
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const budgetPresets = [500, 1000, 1500, 2500];

  const primaryGoals = [
    { id: 'high_protein', label: 'Higher Protein', desc: 'Pulses, soya chunks, paneer & high-protein staples' },
    { id: 'high_fiber', label: 'Higher Fibre', desc: 'Millets, whole grains, seeds & slow-digesting carbs' },
    { id: 'low_sugar', label: 'Lower Added Sugar', desc: 'Minimal glycemic spikes for diabetes management' },
    { id: 'low_sodium', label: 'Lower Sodium', desc: 'Naturally low-salt items for blood pressure care' },
    { id: 'whole_grains', label: 'Whole Grains & Millets', desc: 'Ragi, Jowar, Bajra & unpolished staples' },
    { id: 'budget_value', label: 'Maximum Value per ₹', desc: 'Highest nutritional yield for minimal cost' },
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: '100% Vegan' },
    { id: 'non_vegetarian', label: 'Non-Vegetarian' },
    { id: 'jain', label: 'Jain Diet' },
  ];

  const commonAllergies = ['Peanuts', 'Gluten', 'Milk', 'Soy', 'Eggs'];

  // Load catalogue for quick item additions
  useEffect(() => {
    smartBasketService.getCatalogue()
      .then(setCatalogue)
      .catch(console.error);
  }, []);

  const handleGenerateBasket = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const plan: SmartBasketPlanRequest = {
        budget_inr: budgetInr,
        primary_goal: primaryGoal,
        secondary_goals: secondaryGoals,
        dietary_preference: dietaryPreference,
        allergies: selectedAllergies,
        household_size: householdSize,
        shopping_duration: shoppingDuration
      };

      const res = await smartBasketService.getRecommendations(plan);
      setChecklistItems(res.proposed_items);
      
      // Cache locally for offline access
      localStorage.setItem('foodlens_active_basket', JSON.stringify({
        plan,
        items: res.proposed_items,
        updated_at: new Date().toISOString()
      }));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Live budget math
  const currentTotalCost = checklistItems.reduce(
    (sum, item) => sum + (item.estimated_price_inr * item.quantity), 
    0
  );
  const remainingBudget = budgetInr - currentTotalCost;
  const isOverBudget = remainingBudget < 0;
  const purchasedCount = checklistItems.filter(i => i.is_purchased).length;
  const purchasedTotalCost = checklistItems
    .filter(i => i.is_purchased)
    .reduce((sum, item) => sum + (item.estimated_price_inr * item.quantity), 0);

  // Checklist interactions
  const togglePurchased = (index: number) => {
    setChecklistItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, is_purchased: !item.is_purchased } : item
    ));
  };

  const updateQuantity = (index: number, delta: number) => {
    setChecklistItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const removeItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const addCatalogueItemToChecklist = (foodItem: IndianFoodItem) => {
    const existingIndex = checklistItems.findIndex(i => i.name === foodItem.name);
    if (existingIndex >= 0) {
      updateQuantity(existingIndex, 1);
    } else {
      const newItem: ProposedBasketItem = {
        food_item_id: foodItem.id,
        name: foodItem.name,
        hindi_name: foodItem.hindi_name,
        category: foodItem.category,
        pack_size: foodItem.pack_size,
        quantity: 1,
        estimated_price_inr: foodItem.estimated_price_inr,
        price_provenance: foodItem.price_provenance,
        is_purchased: false,
        rationale: foodItem.key_benefit || "Staple nutrition item from verified Indian catalogue",
        nutrition_snapshot: {
          energy_kcal: foodItem.energy_kcal,
          protein_g: foodItem.protein_g,
          fiber_g: foodItem.fiber_g,
          sugars_g: foodItem.sugars_g,
          sodium_mg: foodItem.sodium_mg
        }
      };
      setChecklistItems(prev => [...prev, newItem]);
    }
    setShowCataloguePicker(false);
  };

  const handleSaveShoppingList = async () => {
    if (checklistItems.length === 0) return;
    try {
      const payload = {
        title: `${primaryGoal.replace('_', ' ').toUpperCase()} Basket (${shoppingDuration})`,
        budget_inr: budgetInr,
        shopping_duration: shoppingDuration,
        household_size: householdSize,
        primary_nutrition_goal: primaryGoal,
        secondary_nutrition_goals: secondaryGoals,
        dietary_preference: dietaryPreference,
        allergies: selectedAllergies,
        items: checklistItems.map(item => ({
          food_item_id: item.food_item_id,
          name: item.name,
          hindi_name: item.hindi_name,
          category: item.category,
          pack_size: item.pack_size,
          quantity: item.quantity,
          estimated_price_inr: item.estimated_price_inr,
          price_provenance: item.price_provenance,
          is_purchased: item.is_purchased,
          notes: item.notes,
          rationale: item.rationale,
          nutrition_snapshot: item.nutrition_snapshot
        }))
      };

      await smartBasketService.createShoppingList(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      // In guest mode or offline, fallback to saving in localStorage
      localStorage.setItem('foodlens_saved_list_guest', JSON.stringify({
        ...checklistItems,
        saved_at: new Date().toISOString()
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
      
      {/* 1. Header & Vision Statement */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF3E7] text-[#164B3A] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Decision-Support System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17201C] tracking-tight">
            Smart Basket Grocery Planner
          </h1>
          <p className="text-xs text-[#5A6561] font-semibold max-w-xl">
            Input your budget and health goals. FoodLens recommends nutritious Indian staples and packaged foods with a practical, interactive shopping checklist.
          </p>
        </div>

        <button
          onClick={() => onNavigate('my_lists')}
          className="px-4 py-2.5 rounded-[16px] text-xs font-extrabold bg-white border border-[#E5E9E6] text-[#164B3A] hover:bg-[#F8F8F4] flex items-center gap-2 shadow-xs shrink-0"
        >
          <Calendar className="w-4 h-4 text-[#164B3A]" />
          My Saved Lists
        </button>
      </div>

      {errorMsg && (
        <div className="card-coral p-4 flex items-center gap-3 text-xs font-bold text-[#E8785D]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Configuration & Personalisation Form (Collapsible when checklist is active) */}
      <div className="card-fresh p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E9E6] pb-4">
          <div>
            <h2 className="text-base font-black text-[#17201C]">1. Set Budget & Nutritional Requirements</h2>
            <p className="text-xs text-[#5A6561] font-medium">Configure Indian Rupee budget and preferences</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#DDF3E7] text-[#164B3A]">
            Kirana Benchmark (INR)
          </span>
        </div>

        {/* Budget Input & Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
            Shopping Budget (₹ Indian Rupees)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#164B3A]">₹</span>
              <input
                type="number"
                min="100"
                step="50"
                value={budgetInr}
                onChange={(e) => setBudgetInr(Math.max(100, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 rounded-[16px] bg-[#F8F8F4] border border-[#E5E9E6] font-mono font-bold text-base text-[#17201C] focus:outline-none focus:border-[#164B3A]"
              />
            </div>
            <div className="flex gap-2">
              {budgetPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetInr(preset)}
                  className={`px-3.5 py-3 rounded-[14px] text-xs font-extrabold transition-all ${
                    budgetInr === preset 
                      ? 'bg-[#164B3A] text-white shadow-xs' 
                      : 'bg-[#F8F8F4] border border-[#E5E9E6] text-[#5A6561] hover:text-[#17201C]'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Nutrition Goal */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
            Primary Nutrition Goal
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {primaryGoals.map(goal => {
              const isSelected = primaryGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setPrimaryGoal(goal.id)}
                  className={`p-3.5 rounded-[16px] text-left transition-all border flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-[#164B3A] bg-[#DDF3E7]/40 text-[#17201C]'
                      : 'border-[#E5E9E6] bg-[#F8F8F4] text-[#5A6561] hover:text-[#17201C]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-xs text-[#17201C]">{goal.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#164B3A]" />}
                  </div>
                  <p className="text-[10px] text-[#5A6561] mt-1 line-clamp-2">{goal.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Nutrition Goals (Bonus Preferences) */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
            Secondary Goals (Optional Bonus Factors)
          </label>
          <div className="flex flex-wrap gap-2">
            {primaryGoals.filter(g => g.id !== primaryGoal).map(g => {
              const isSelected = secondaryGoals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSecondaryGoals(prev => 
                      isSelected ? prev.filter(id => id !== g.id) : [...prev, g.id]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                    isSelected
                      ? 'bg-[#164B3A] text-white shadow-xs'
                      : 'bg-[#F8F8F4] border border-[#E5E9E6] text-[#5A6561] hover:text-[#17201C]'
                  }`}
                >
                  + {g.label} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Preference & Household Parameters */}
        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
              Dietary Preference
            </label>
            <select
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F8F4] border border-[#E5E9E6] text-xs font-bold text-[#17201C] focus:outline-none focus:border-[#164B3A]"
            >
              {dietaryOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
              Household Servings
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-[16px] bg-[#F8F8F4] border border-[#E5E9E6]">
              <Users className="w-4 h-4 text-[#5A6561]" />
              <input
                type="number"
                min="1"
                max="10"
                value={householdSize}
                onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value)))}
                className="w-full bg-transparent text-xs font-bold text-[#17201C] focus:outline-none"
              />
              <span className="text-[10px] text-[#5A6561] font-bold">people</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
              Shopping Duration
            </label>
            <select
              value={shoppingDuration}
              onChange={(e) => setShoppingDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F8F4] border border-[#E5E9E6] text-xs font-bold text-[#17201C] focus:outline-none focus:border-[#164B3A]"
            >
              <option value="weekly">Weekly Plan (7 Days)</option>
              <option value="monthly">Monthly Kirana Stock (30 Days)</option>
              <option value="daily">Daily Essentials</option>
            </select>
          </div>

        </div>

        {/* Excluded Allergens (Hard Constraints) */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#17201C]">
            Allergies to Exclude (Strict Filter)
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map(alg => {
              const clean = alg.toLowerCase();
              const isSelected = selectedAllergies.includes(clean);
              return (
                <button
                  key={alg}
                  type="button"
                  onClick={() => {
                    setSelectedAllergies(prev => 
                      isSelected ? prev.filter(a => a !== clean) : [...prev, clean]
                    );
                  }}
                  className={`pill-soft-pop cursor-pointer ${
                    isSelected
                      ? 'pill-pop-pink shadow-xs'
                      : 'bg-[#F8F8F4] border-[#E5E9E6] text-[#5A6561] hover:text-[#17201C] hover:border-[#17201C]'
                  }`}
                >
                  {alg} {isSelected ? '✕' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate CTA Button */}
        <button
          onClick={handleGenerateBasket}
          disabled={loading}
          className="w-full py-4 rounded-[18px] font-black text-sm bg-[#164B3A] text-white hover:bg-[#0F3629] transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing Indian Staples & Nutritional Yields...</span>
            </div>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#DDF3E7]" />
              Generate Smart Basket for ₹{budgetInr}
            </>
          )}
        </button>

      </div>

      {/* 3. Live Budget Bar & Proposed Checklist */}
      {checklistItems.length > 0 && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top Live Budget Metric Strip */}
          <div className="card-fresh p-5 sticky top-2 z-30 shadow-md bg-white border-2 border-[#164B3A]/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#5A6561] block">Budget</span>
                  <span className="text-lg font-black text-[#17201C]">₹{budgetInr}</span>
                </div>

                <div className="border-l border-[#E5E9E6] pl-6">
                  <span className="text-[10px] font-black uppercase text-[#5A6561] block">Estimated Cost</span>
                  <span className={`text-lg font-black ${isOverBudget ? 'text-[#E8785D]' : 'text-[#164B3A]'}`}>
                    ₹{currentTotalCost}
                  </span>
                </div>

                <div className="border-l border-[#E5E9E6] pl-6">
                  <span className="text-[10px] font-black uppercase text-[#5A6561] block">Remaining</span>
                  <span className={`text-lg font-black ${isOverBudget ? 'text-[#E8785D]' : 'text-[#164B3A]'}`}>
                    {isOverBudget ? `-₹${Math.abs(remainingBudget)} (Over)` : `₹${remainingBudget}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-[#5A6561] block">Checklist Progress</span>
                  <span className="text-xs font-black text-[#164B3A]">
                    {purchasedCount} of {checklistItems.length} purchased (₹{purchasedTotalCost})
                  </span>
                </div>

                <button
                  onClick={handleSaveShoppingList}
                  className="px-4 py-2.5 rounded-[14px] font-black text-xs bg-[#164B3A] text-white hover:bg-[#0F3629] flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4 text-[#DDF3E7]" />
                  {saveSuccess ? 'Saved to List!' : 'Save Checklist'}
                </button>
              </div>

            </div>

            {/* Over-budget warning banner */}
            {isOverBudget && (
              <div className="mt-3 p-2.5 rounded-[12px] bg-[#FEF2F2] border border-[#E8785D]/30 flex items-center justify-between text-xs text-[#E8785D] font-bold">
                <span>⚠ Basket exceeds allocated budget by ₹{Math.abs(remainingBudget)}. Adjust quantities or remove items below.</span>
              </div>
            )}
          </div>

          {/* Action Bar: Add Items & Methodology Disclaimer */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#5A6561]">
              Showing {checklistItems.length} recommended items based on {primaryGoal.replace('_', ' ')}:
            </span>
            <button
              onClick={() => setShowCataloguePicker(true)}
              className="text-xs font-black text-[#164B3A] hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Item from Catalogue
            </button>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-3">
            {checklistItems.map((item, idx) => (
              <div
                key={idx}
                className={`card-fresh p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  item.is_purchased ? 'bg-[#F8F8F4] opacity-75 border-dashed' : 'bg-white'
                }`}
              >
                {/* Left: Checkbox & Name Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => togglePurchased(idx)}
                    className="mt-1 text-[#164B3A] hover:scale-110 transition-transform"
                    title={item.is_purchased ? "Mark pending" : "Mark purchased"}
                  >
                    {item.is_purchased ? (
                      <CheckSquare className="w-5 h-5 text-[#164B3A]" />
                    ) : (
                      <Square className="w-5 h-5 text-[#5A6561]" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-black text-sm sm:text-base ${item.is_purchased ? 'line-through text-[#5A6561]' : 'text-[#17201C]'}`}>
                        {item.name}
                      </h3>
                      {item.hindi_name && (
                        <span className="text-xs font-semibold text-[#5A6561] bg-[#F8F8F4] px-2 py-0.5 rounded-full border border-[#E5E9E6]">
                          {item.hindi_name}
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#DDF3E7] text-[#164B3A]">
                        {item.pack_size}
                      </span>
                    </div>

                    {/* Transparent Rationale Badge */}
                    <p className="text-xs text-[#164B3A] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#164B3A]" />
                      {item.rationale}
                    </p>

                    {/* Nutrition pills snapshot */}
                    {item.nutrition_snapshot && (
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[#5A6561] pt-1">
                        <span>Protein: <strong className="text-[#17201C]">{item.nutrition_snapshot.protein_g ?? 0}g</strong></span>
                        <span>•</span>
                        <span>Fiber: <strong className="text-[#17201C]">{item.nutrition_snapshot.fiber_g ?? 0}g</strong></span>
                        <span>•</span>
                        <span>Sugar: <strong className="text-[#17201C]">{item.nutrition_snapshot.sugars_g ?? 0}g</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quantity, Price & Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-[#E5E9E6]">
                  
                  {/* Quantity Modifier */}
                  <div className="flex items-center border border-[#E5E9E6] rounded-[14px] bg-[#F8F8F4] p-1">
                    <button
                      onClick={() => updateQuantity(idx, -1)}
                      className="p-1 rounded-[10px] hover:bg-white text-[#5A6561] hover:text-[#17201C]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-[#17201C]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(idx, 1)}
                      className="p-1 rounded-[10px] hover:bg-white text-[#5A6561] hover:text-[#17201C]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Price */}
                  <div className="text-right min-w-[70px]">
                    <span className="text-sm font-black text-[#17201C] block">
                      ₹{item.estimated_price_inr * item.quantity}
                    </span>
                    <span className="text-[9px] font-bold text-[#5A6561] block">
                      @ ₹{item.estimated_price_inr} ea
                    </span>
                  </div>

                  {/* Remove action */}
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-2 rounded-xl text-[#5A6561] hover:text-[#E8785D] hover:bg-[#FEF2F2] transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}
          </div>

          {/* 4. Methodology & Disclaimer Footer */}
          <div className="card-fresh p-5 text-xs text-[#5A6561] space-y-1.5 border border-[#E5E9E6]">
            <div className="flex items-center gap-1.5 font-black text-[#164B3A]">
              <Info className="w-4 h-4" /> Data Provenance & Methodology Notice
            </div>
            <p className="leading-relaxed">
              FoodLens is a decision-support platform, not a medical or dietetic prescriber. Nutritional compositions are referenced from the Indian Food Composition Tables (IFCT 2017, National Institute of Nutrition, ICMR). Prices are estimated benchmarks from Indian kirana and retail store indices. The user retains final decision authority on all purchasing selections.
            </p>
          </div>

        </div>
      )}

      {/* 5. Add from Catalogue Modal / Bottom Sheet */}
      {showCataloguePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-[24px] border border-[#E5E9E6] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#E5E9E6] pb-3">
              <h3 className="font-black text-base text-[#17201C]">Add Item from Indian Catalogue</h3>
              <button
                onClick={() => setShowCataloguePicker(false)}
                className="text-xs font-black text-[#5A6561] hover:text-[#17201C]"
              >
                Close ✕
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#5A6561] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dal, millets, dahi, seeds..."
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-[14px] bg-[#F8F8F4] border border-[#E5E9E6] text-xs font-bold text-[#17201C] focus:outline-none focus:border-[#164B3A]"
              />
            </div>

            {/* Items scroll area */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {catalogue
                .filter(i => 
                  i.name.toLowerCase().includes(catalogueSearch.toLowerCase()) || 
                  (i.hindi_name && i.hindi_name.includes(catalogueSearch))
                )
                .map(food => (
                  <div
                    key={food.id}
                    onClick={() => addCatalogueItemToChecklist(food)}
                    className="p-3 rounded-[16px] border border-[#E5E9E6] hover:border-[#164B3A] hover:bg-[#F8F8F4] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <h4 className="font-black text-xs text-[#17201C] group-hover:text-[#164B3A]">
                        {food.name} {food.hindi_name && <span className="text-[#5A6561] font-normal">({food.hindi_name})</span>}
                      </h4>
                      <p className="text-[10px] text-[#5A6561] font-medium">
                        {food.pack_size} • {food.protein_g}g Protein • {food.fiber_g}g Fiber
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-[#164B3A]">₹{food.estimated_price_inr}</span>
                      <span className="text-xs font-black p-1.5 rounded-full bg-[#DDF3E7] text-[#164B3A] group-hover:bg-[#164B3A] group-hover:text-white transition-colors">
                        +
                      </span>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
