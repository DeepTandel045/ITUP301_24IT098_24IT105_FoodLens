import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Check, HeartPulse, Utensils, ShieldAlert } from 'lucide-react';

interface OnboardingPageProps {
  onNavigate: (tab: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { updateProfile } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['general_healthy_eating']);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const goalsList = [
    { id: 'general_healthy_eating', title: 'General Healthy Eating', desc: 'Standard balanced dietary guidelines & whole nourishment.' },
    { id: 'diabetes_oriented', title: 'Diabetes-Oriented', desc: 'Focus on low glycemic index, low sugar, & high fiber.' },
    { id: 'weight_management', title: 'Weight Management', desc: 'Calorie conscious with optimal protein density & satiety.' },
    { id: 'high_protein', title: 'High Protein / Fitness', desc: 'Maximizes protein intake per serving for muscle fitness.' },
    { id: 'low_sodium', title: 'Low Sodium', desc: 'Strictly penalizes high sodium content for heart health.' },
    { id: 'low_sugar', title: 'Low Sugar', desc: 'Minimizes added refined sugars and high-glycemic syrups.' },
    { id: 'heart_conscious', title: 'Heart Conscious', desc: 'Low saturated & trans fats for cardiac well-being.' },
  ];

  const dietaryList = [
    { id: 'vegetarian', title: 'Vegetarian', desc: 'Plant foods + dairy' },
    { id: 'vegan', title: 'Vegan', desc: '100% plant-based' },
    { id: 'eggetarian', title: 'Eggetarian', desc: 'Vegetarian + eggs' },
    { id: 'non_vegetarian', title: 'Non-Vegetarian', desc: 'Omnivorous' },
    { id: 'pescatarian', title: 'Pescatarian', desc: 'Fish + plants' },
    { id: 'keto', title: 'Keto / Low-Carb', desc: 'Low carb, healthy fats' },
    { id: 'dairy_free', title: 'Dairy-Free', desc: 'No milk or dairy' },
    { id: 'gluten_free', title: 'Gluten-Free', desc: 'No wheat or gluten' },
    { id: 'jain', title: 'Jain Diet', desc: 'No root vegetables' },
  ];

  const commonAllergies = ['Peanuts', 'Gluten', 'Milk', 'Soy', 'Eggs', 'Tree Nuts', 'Shellfish', 'Sesame', 'Fish'];

  const toggleGoal = (id: string) => {
    if (selectedGoals.includes(id)) {
      const remaining = selectedGoals.filter(g => g !== id);
      setSelectedGoals(remaining.length > 0 ? remaining : ['general_healthy_eating']);
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const toggleDietary = (id: string) => {
    if (selectedDietary.includes(id)) {
      setSelectedDietary(selectedDietary.filter(d => d !== id));
    } else {
      setSelectedDietary([...selectedDietary, id]);
    }
  };

  const toggleAllergy = (alg: string) => {
    const clean = alg.toLowerCase();
    if (allergies.includes(clean)) {
      setAllergies(allergies.filter(a => a !== clean));
    } else {
      setAllergies([...allergies, clean]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateProfile({
        health_goals: selectedGoals,
        dietary_goal: selectedGoals.join(','),
        dietary_preferences: selectedDietary,
        preferences: selectedDietary,
        allergies: allergies
      });
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#164B3A] text-white flex items-center justify-center font-black mx-auto">
          <Sparkles className="w-6 h-6 text-[#DDF3E7]" />
        </div>
        <h1 className="text-3xl font-black text-[#17201C] tracking-tight">Personalize Your FoodLens Engine</h1>
        <p className="text-xs text-[#5A6561] font-semibold">
          Select multiple health goals and primary dietary lifestyles. You can update these anytime from your profile or dashboard.
        </p>
      </div>

      {/* Health Goal Selection (Multi-select) */}
      <div className="card-fresh p-6 space-y-4 bg-white border border-[#E5E9E6]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#17201C] uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" /> Health Goals (Select Multiple)
          </h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {selectedGoals.length} selected
          </span>
        </div>
        <div className="space-y-2.5">
          {goalsList.map((g) => {
            const isSelected = selectedGoals.includes(g.id);
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => toggleGoal(g.id)}
                className={`w-full p-3.5 rounded-[16px] text-left transition-all border flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#164B3A] bg-[#DDF3E7]/40 text-[#17201C]'
                    : 'border-[#E5E9E6] bg-[#F8F8F4] text-[#5A6561] hover:text-[#17201C]'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-sm text-[#17201C]">{g.title}</h4>
                  <p className="text-xs text-[#5A6561] font-medium">{g.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#164B3A] text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Dietary Preferences (Multi-select) */}
      <div className="card-fresh p-6 space-y-4 bg-white border border-[#E5E9E6]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#17201C] uppercase tracking-wider flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-600" /> Primary Dietary Lifestyle (Optional)
          </h3>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            {selectedDietary.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {dietaryList.map((d) => {
            const isSelected = selectedDietary.includes(d.id);
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => toggleDietary(d.id)}
                className={`p-3 rounded-[14px] text-left transition-all border flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-2 border-amber-600 bg-amber-50/70 text-amber-950'
                    : 'border-[#E5E9E6] bg-[#F8F8F4] text-slate-600 hover:text-slate-900'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xs">{d.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{d.desc}</p>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergies Selection */}
      <div className="card-fresh p-6 space-y-4 bg-white border border-[#E5E9E6]">
        <h3 className="text-xs font-black text-[#17201C] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" /> Allergens to Exclude
        </h3>
        <div className="flex flex-wrap gap-2">
          {commonAllergies.map((alg) => {
            const clean = alg.toLowerCase();
            const isSelected = allergies.includes(clean);
            return (
              <button
                type="button"
                key={alg}
                onClick={() => toggleAllergy(alg)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FEF2F2] border border-[#E8785D] text-[#E8785D]'
                    : 'bg-[#F8F8F4] border border-[#E5E9E6] text-[#5A6561]'
                }`}
              >
                {alg}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={loading}
        className="w-full py-4 rounded-[18px] font-extrabold bg-[#164B3A] text-white hover:bg-[#0F3629] transition-all text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
      >
        {loading ? 'Setting up Profile...' : 'Complete & Launch Dashboard'} <ArrowRight className="w-4 h-4 text-[#DDF3E7]" />
      </button>

    </div>
  );
};
