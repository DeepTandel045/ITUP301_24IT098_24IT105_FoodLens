import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  HeartPulse, 
  Check, 
  Save, 
  Utensils, 
  Sparkles, 
  SlidersHorizontal,
  Info
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Initialize health goals (supporting array or comma-separated string)
  const initialGoals = user?.health_goals && user.health_goals.length > 0
    ? user.health_goals
    : user?.dietary_goal
    ? user.dietary_goal.split(',').map(g => g.trim()).filter(Boolean)
    : ['general_healthy_eating'];

  const initialDietary = user?.dietary_preferences && user.dietary_preferences.length > 0
    ? user.dietary_preferences
    : user?.preferences && user.preferences.length > 0
    ? user.preferences
    : [];

  const [selectedHealthGoals, setSelectedHealthGoals] = useState<string[]>(initialGoals);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(initialDietary);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(user?.allergies || []);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const g = user.health_goals && user.health_goals.length > 0
        ? user.health_goals
        : user.dietary_goal
        ? user.dietary_goal.split(',').map(x => x.trim()).filter(Boolean)
        : ['general_healthy_eating'];
      setSelectedHealthGoals(g);

      const d = user.dietary_preferences && user.dietary_preferences.length > 0
        ? user.dietary_preferences
        : user.preferences && user.preferences.length > 0
        ? user.preferences
        : [];
      setSelectedDietary(d);

      setSelectedAllergies(user.allergies || []);
    }
  }, [user]);

  const healthGoalsList = [
    { 
      id: 'general_healthy_eating', 
      title: 'General Healthy Eating', 
      desc: 'Balanced whole-food nutrition, low additives & optimal nourishment' 
    },
    { 
      id: 'diabetes_oriented', 
      title: 'Diabetes-Oriented', 
      desc: 'Strict low-sugar & glycemic control with blood-sugar stabilizing fiber' 
    },
    { 
      id: 'weight_management', 
      title: 'Weight Management', 
      desc: 'Calorie-conscious limits, reduced excess sugar & enhanced satiety' 
    },
    { 
      id: 'high_protein', 
      title: 'High Protein / Fitness', 
      desc: 'Maximizes protein density for muscle repair, strength & active lifestyle' 
    },
    { 
      id: 'low_sodium', 
      title: 'Low Sodium', 
      desc: 'Hypertension support: strictly limits salt & sodium density' 
    },
    { 
      id: 'low_sugar', 
      title: 'Low Sugar', 
      desc: 'Focus on minimal refined sugars, avoiding spikes and artificial sweeteners' 
    },
    { 
      id: 'heart_conscious', 
      title: 'Heart Conscious', 
      desc: 'Low saturated & zero trans fats combined with healthy cardiac limits' 
    },
  ];

  const primaryDietaryList = [
    { id: 'vegetarian', title: 'Vegetarian', desc: 'No meat, poultry, or fish (dairy included)' },
    { id: 'vegan', title: 'Vegan', desc: '100% plant-based: no animal flesh, eggs, dairy, or honey' },
    { id: 'eggetarian', title: 'Eggetarian', desc: 'Vegetarian plus eggs' },
    { id: 'non_vegetarian', title: 'Non-Vegetarian / Flexitarian', desc: 'All poultry, fish, and meat allowed' },
    { id: 'pescatarian', title: 'Pescatarian', desc: 'Plant-based diet including fish and seafood' },
    { id: 'keto', title: 'Keto / Low-Carb', desc: 'High healthy fats, moderate protein, very low carbohydrates' },
    { id: 'dairy_free', title: 'Dairy-Free', desc: 'Avoids milk, butter, whey, cheese, paneer, and lactose' },
    { id: 'gluten_free', title: 'Gluten-Free', desc: 'Avoids wheat, barley, rye, maida, and gluten derivatives' },
    { id: 'halal', title: 'Halal', desc: 'Follows Halal dietary compliance guidelines' },
    { id: 'jain', title: 'Jain Diet', desc: 'Vegetarian excluding root vegetables (onion, garlic, potato)' },
  ];

  const commonAllergies = ['Peanuts', 'Gluten', 'Milk', 'Soy', 'Eggs', 'Tree Nuts', 'Shellfish', 'Sesame', 'Fish'];

  const toggleHealthGoal = (goalId: string) => {
    if (selectedHealthGoals.includes(goalId)) {
      // Don't leave completely empty, fall back to general_healthy_eating if last removed
      const remaining = selectedHealthGoals.filter(g => g !== goalId);
      setSelectedHealthGoals(remaining.length > 0 ? remaining : ['general_healthy_eating']);
    } else {
      setSelectedHealthGoals([...selectedHealthGoals, goalId]);
    }
  };

  const toggleDietary = (dietId: string) => {
    if (selectedDietary.includes(dietId)) {
      setSelectedDietary(selectedDietary.filter(d => d !== dietId));
    } else {
      setSelectedDietary([...selectedDietary, dietId]);
    }
  };

  const toggleAllergy = (alg: string) => {
    const clean = alg.toLowerCase();
    if (selectedAllergies.includes(clean)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== clean));
    } else {
      setSelectedAllergies([...selectedAllergies, clean]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        health_goals: selectedHealthGoals,
        dietary_goal: selectedHealthGoals.join(','),
        dietary_preferences: selectedDietary,
        preferences: selectedDietary,
        allergies: selectedAllergies
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header Profile Summary */}
      <div className="card-fresh p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-[#E2E8F0]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#18181B] tracking-tight">{user?.name || 'User Profile'}</h1>
            <p className="text-xs text-[#64748B] font-semibold">{user?.email}</p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Anytime Profile Settings
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Multi-Goal Engine Active
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Profile Badges */}
        <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 min-w-[240px]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-slate-600" /> Currently Active:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedHealthGoals.map(g => (
              <span key={g} className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                🎯 {g.replace(/_/g, ' ')}
              </span>
            ))}
            {selectedDietary.map(d => (
              <span key={d} className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                🥗 {d.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Info notice about multi-goal anytime customization */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold">Personalize Anytime with Multi-Selection</p>
          <p className="font-medium text-emerald-800 text-[11px] mt-0.5">
            You can select <strong>more than one health goal</strong> (e.g. Diabetes-Oriented + Low Sodium) and <strong>multiple dietary lifestyles</strong> (e.g. Vegetarian + Gluten-Free). FoodLens will dynamically adjust nutritional penalties, score thresholds, and recommendations across all your selections.
          </p>
        </div>
      </div>

      {/* 1. Health Goals Setting (Multi-select) */}
      <div className="card-fresh p-6 sm:p-7 space-y-4 bg-white border border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#18181B] uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" /> Health & Wellness Goals
            </h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Select one or more targets. The scoring engine evaluates your selections together.
            </p>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 shrink-0 w-fit">
            {selectedHealthGoals.length} Selected
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {healthGoalsList.map((g) => {
            const isSelected = selectedHealthGoals.includes(g.id);
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => toggleHealthGoal(g.id)}
                className={`p-4 rounded-[18px] text-left transition-all flex items-start justify-between gap-3 cursor-pointer active:scale-98 border ${
                  isSelected
                    ? 'bg-emerald-50/90 border-2 border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-[#E2E8F0] hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${isSelected ? 'text-emerald-950' : 'text-[#18181B]'}`}>
                      {g.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {g.desc}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Dietary Lifestyle Setting (Multi-select) */}
      <div className="card-fresh p-6 sm:p-7 space-y-4 bg-white border border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#18181B] uppercase tracking-wider flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" /> Primary Dietary Preferences & Lifestyle
            </h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Select any dietary patterns you follow (e.g. Vegetarian, Dairy-Free, Vegan, Jain).
            </p>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0 w-fit">
            {selectedDietary.length} Selected
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {primaryDietaryList.map((d) => {
            const isSelected = selectedDietary.includes(d.id);
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => toggleDietary(d.id)}
                className={`p-3.5 rounded-[18px] text-left transition-all flex items-start justify-between gap-3 cursor-pointer active:scale-98 border ${
                  isSelected
                    ? 'bg-amber-50/90 border-2 border-amber-600 shadow-xs'
                    : 'bg-slate-50 border-[#E2E8F0] hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-black ${isSelected ? 'text-amber-950' : 'text-[#18181B]'}`}>
                    {d.title}
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {d.desc}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected ? 'bg-amber-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Allergens Setting (Red Alert exclusions) */}
      <div className="card-fresh p-6 sm:p-7 space-y-4 bg-white border border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-black text-[#18181B] uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> Flagged Allergens (Immediate Safety Collisions)
          </h3>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">
            Products containing these items trigger strict red allergen warnings and score penalties.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {commonAllergies.map((alg) => {
            const clean = alg.toLowerCase();
            const isSelected = selectedAllergies.includes(clean);
            return (
              <button
                type="button"
                key={alg}
                onClick={() => toggleAllergy(alg)}
                className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#FFF1F2] border-2 border-[#EF4444] text-[#EF4444] shadow-xs'
                    : 'bg-slate-100 border border-slate-200 text-slate-700 hover:border-slate-400'
                }`}
              >
                {isSelected ? `⚠ Exclude ${alg}` : alg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save CTA Bar */}
      <div className="card-fresh p-4 sm:p-5 bg-white border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-4 shadow-lg">
        <div className="text-xs font-semibold text-slate-600">
          Ready to save your custom health goals & dietary choices?
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`px-8 py-3.5 rounded-[18px] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95 ${
            saved
              ? 'bg-[#10B981] text-white shadow-[#10B981]/25 ring-2 ring-emerald-300'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-white" />}
          {saved ? 'Goals & Preferences Saved!' : loading ? 'Saving Profile...' : 'Save Profile Changes'}
        </button>
      </div>

    </div>
  );
};
