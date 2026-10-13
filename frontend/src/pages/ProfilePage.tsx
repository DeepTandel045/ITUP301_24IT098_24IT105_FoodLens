import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, HeartPulse, Check, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [dietaryGoal, setDietaryGoal] = useState(user?.dietary_goal || 'general_healthy_eating');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(user?.allergies || []);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const goalsList = [
    { id: 'general_healthy_eating', title: 'General Healthy Eating' },
    { id: 'diabetes_oriented', title: 'Diabetes-Oriented' },
    { id: 'weight_management', title: 'Weight Management' },
    { id: 'high_protein', title: 'High Protein / Fitness' },
    { id: 'low_sodium', title: 'Low Sodium' },
    { id: 'heart_conscious', title: 'Heart Conscious' },
    { id: 'vegetarian', title: 'Vegetarian' },
    { id: 'vegan', title: 'Vegan' },
  ];

  const commonAllergies = ['Peanuts', 'Gluten', 'Milk', 'Soy', 'Eggs', 'Tree Nuts', 'Shellfish', 'Sesame'];

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
        dietary_goal: dietaryGoal,
        allergies: selectedAllergies
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header */}
      <div className="card-fresh p-6 sm:p-8 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[#635BFF] text-white font-black text-2xl flex items-center justify-center shadow-md shadow-[#635BFF]/25 shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#17172B] tracking-tight">{user?.name}</h1>
          <p className="text-xs text-[#64748B] font-semibold">{user?.email}</p>
          <span className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EEF2FF] text-[#635BFF] border border-[#635BFF]/20">
            Active Goal: {dietaryGoal.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Health Goal Setting */}
      <div className="card-fresh p-6 space-y-4">
        <h3 className="text-sm font-black text-[#17172B] uppercase tracking-wider flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-[#635BFF]" /> Primary Dietary / Health Goal
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {goalsList.map((g) => {
            const isSelected = dietaryGoal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setDietaryGoal(g.id)}
                className={`p-3.5 rounded-[16px] text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/25'
                    : 'bg-[#F8F9FD] border border-[#E2E8F0] text-[#64748B] hover:text-[#17172B]'
                }`}
              >
                {g.title}
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergies Setting (Red for alert) */}
      <div className="card-fresh p-6 space-y-4">
        <h3 className="text-sm font-black text-[#17172B] uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> Flagged Allergens (Alert Exclusions)
        </h3>
        <div className="flex flex-wrap gap-2">
          {commonAllergies.map((alg) => {
            const clean = alg.toLowerCase();
            const isSelected = selectedAllergies.includes(clean);
            return (
              <button
                key={alg}
                onClick={() => toggleAllergy(alg)}
                className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF1F2] border border-[#EF4444] text-[#EF4444] shadow-xs'
                    : 'bg-[#F8F9FD] border border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                {isSelected ? `⚠ ${alg}` : alg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save CTA */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`px-6 py-3.5 rounded-[18px] font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
            saved
              ? 'bg-[#10B981] text-white shadow-[#10B981]/25'
              : 'bg-[#635BFF] text-white hover:bg-[#4E44E6] shadow-[#635BFF]/25'
          }`}
        >
          <Save className="w-4 h-4 text-white" />
          {saved ? 'Settings Saved!' : loading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

    </div>
  );
};
