import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DashboardData } from '../types';
import { CircularScoreRing } from '../components/CircularScoreRing';
import { 
  Scan, 
  TrendingUp, 
  Sparkles, 
  Activity, 
  ChevronRight, 
  Camera, 
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldCheck,
  ShieldAlert,
  Target,
  SlidersHorizontal,
  Flame,
  X,
  Check,
  HeartPulse,
  Utensils,
  Save
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend } from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: string, data?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, updateProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick Edit Goals modal state
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickGoals, setQuickGoals] = useState<string[]>([]);
  const [quickDietary, setQuickDietary] = useState<string[]>([]);
  const [quickSaving, setQuickSaving] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await dashboardService.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#5A6561]">
          <div className="w-12 h-12 border-4 border-[#164B3A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-extrabold text-[#164B3A]">Loading your real FoodLens Analytics...</p>
        </div>
      </div>
    );
  }

  const userName = data?.user_name || 'FoodLens Explorer';
  const todayCount = data?.today_scans_count || 0;
  const todayScore = data?.average_today_score || 0;
  const profileNeeds = data?.profile_needs;

  // Check if weekly trend has any actual recorded scans
  const hasWeeklyScans = data?.weekly_score_trends?.some(t => (t.scans_count || 0) > 0 || t.personalized_score !== null);
  const hasNutrientScans = data?.nutrient_trends?.some(t => (t.scans_count || 0) > 0 || t.sugar > 0 || t.protein > 0);

  // Score suitability status
  let scoreSublabel = 'No Scans Today';
  if (todayCount > 0) {
    if (todayScore >= 75) scoreSublabel = 'Optimal Match';
    else if (todayScore >= 50) scoreSublabel = 'Moderate Fit';
    else scoreSublabel = 'Caution Advised';
  }

  const openQuickEditModal = () => {
    const goals = user?.health_goals && user.health_goals.length > 0
      ? user.health_goals
      : user?.dietary_goal
      ? user.dietary_goal.split(',').map(g => g.trim()).filter(Boolean)
      : profileNeeds?.active_goals && profileNeeds.active_goals.length > 0
      ? profileNeeds.active_goals
      : ['general_healthy_eating'];
    const dietary = user?.dietary_preferences && user.dietary_preferences.length > 0
      ? user.dietary_preferences
      : user?.preferences && user.preferences.length > 0
      ? user.preferences
      : profileNeeds?.dietary_preferences || [];
    setQuickGoals(goals);
    setQuickDietary(dietary);
    setShowQuickEdit(true);
  };

  const handleQuickSave = async () => {
    setQuickSaving(true);
    try {
      await updateProfile({
        health_goals: quickGoals,
        dietary_goal: quickGoals.join(','),
        dietary_preferences: quickDietary,
        preferences: quickDietary
      });
      await loadDashboard();
      setShowQuickEdit(false);
    } catch (err) {
      console.error('Failed to quick-save goals:', err);
    } finally {
      setQuickSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      
      {/* 1. HERO GREETING & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-sm text-[#64748B] font-semibold flex items-center gap-2 flex-wrap">
            Real nutrition intelligence calibrated for:
            <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide">
              {profileNeeds?.goal_title || data?.dietary_goal || 'General Healthy'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={openQuickEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Edit Goals Anytime
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:border-slate-400 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Full Settings
          </button>
        </div>
      </div>

      {/* 2. PROFILE NEEDS & GOAL SUMMARY CARD */}
      {profileNeeds && (
        <div className="card-fresh p-5 sm:p-6 bg-white border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Active Goal & Target Guideline
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    profileNeeds.goal_key.includes('diabetes')
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                      : profileNeeds.goal_key.includes('protein')
                      ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                      : profileNeeds.goal_key.includes('sodium')
                      ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {profileNeeds.primary_metric} Monitored
                  </span>
                </div>
                <p className="text-sm font-extrabold text-[#18181B]">
                  {profileNeeds.target_guideline}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs font-bold text-[#64748B] shrink-0 border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-3 md:pt-0 md:pl-5">
              <div>
                <span className="block text-[10px] uppercase font-black text-[#94A3B8]">Week Scans</span>
                <span className="text-sm font-black text-[#18181B]">{profileNeeds.weekly_total_scans} items</span>
              </div>
              <div className="w-px h-8 bg-[#E2E8F0]"></div>
              <div>
                <span className="block text-[10px] uppercase font-black text-[#94A3B8]">Avg Fit Score</span>
                <span className={`text-sm font-black ${
                  (profileNeeds.weekly_avg_score || 0) >= 75 
                    ? 'text-[#10B981]' 
                    : (profileNeeds.weekly_avg_score || 0) >= 50 
                    ? 'text-[#F59E0B]' 
                    : 'text-[#EF4444]'
                }`}>
                  {profileNeeds.weekly_avg_score !== null && profileNeeds.weekly_avg_score !== undefined 
                    ? `${profileNeeds.weekly_avg_score}/100` 
                    : '--'}
                </span>
              </div>
              <div className="w-px h-8 bg-[#E2E8F0]"></div>
              <div>
                <span className="block text-[10px] uppercase font-black text-[#94A3B8]">All-Time Scans</span>
                <span className="text-sm font-black text-[#18181B]">{profileNeeds.total_scans_all_time}</span>
              </div>
            </div>
          </div>

          {/* Active Goals & Dietary Badges */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] text-xs flex-wrap">
            <span className="font-extrabold text-[#64748B]">Active Targets:</span>
            {(profileNeeds.active_goals && profileNeeds.active_goals.length > 0 
              ? profileNeeds.active_goals 
              : profileNeeds.goal_key.split(',').filter(Boolean)
            ).map(g => (
              <span key={g} className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 border border-emerald-300 text-emerald-800">
                🎯 {g.replace(/_/g, ' ')}
              </span>
            ))}
            {profileNeeds.dietary_preferences && profileNeeds.dietary_preferences.length > 0 && (
              profileNeeds.dietary_preferences.map(d => (
                <span key={d} className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 border border-amber-300 text-amber-800">
                  🥗 {d.replace(/_/g, ' ')}
                </span>
              ))
            )}
            <button
              onClick={openQuickEditModal}
              className="ml-auto text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Modify Anytime
            </button>
          </div>

          {/* Allergies and Exclusions strip (RED for alert, GREEN for safe) */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0] text-xs flex-wrap">
            <span className="font-extrabold text-[#64748B] flex items-center gap-1">
              {profileNeeds.allergies && profileNeeds.allergies.length > 0 ? (
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              )}
              Safety Alerts:
            </span>
            {profileNeeds.allergies && profileNeeds.allergies.length > 0 ? (
              profileNeeds.allergies.map(alg => (
                <span key={alg} className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFF1F2] border border-[#EF4444] text-[#EF4444] uppercase">
                  Avoids {alg}
                </span>
              ))
            ) : (
              <span className="text-[#10B981] font-semibold text-[11px] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#10B981]/20">
                ✓ No active allergen warnings configured
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. HERO SCORE & SCAN CTA CARDS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Today's Score Soft Card */}
        <div className="card-fresh p-6 sm:p-8 flex flex-col items-center justify-between space-y-4 text-center relative overflow-hidden bg-white">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-black uppercase tracking-wider text-[#64748B]">
              Today's FoodLens Score
            </span>
            <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {todayCount} scanned today
            </span>
          </div>

          <div className="py-2">
            <CircularScoreRing 
              score={todayCount > 0 ? todayScore : 0} 
              size="hero" 
              sublabel={scoreSublabel}
            />
          </div>

          {todayCount > 0 ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full">
              {data?.score_change_from_yesterday !== null && data?.score_change_from_yesterday !== undefined ? (
                data.score_change_from_yesterday > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#065F46] bg-[#ECFDF5] border border-[#10B981]/30 px-3 py-1 rounded-full">
                    <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
                    ↑ +{data.score_change_from_yesterday} pts vs yesterday
                  </span>
                ) : data.score_change_from_yesterday < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#EF4444] bg-[#FFF1F2] border border-[#EF4444]/30 px-3 py-1 rounded-full">
                    <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
                    ↓ {data.score_change_from_yesterday} pts vs yesterday
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#64748B] bg-slate-100 border border-[#E2E8F0] px-3 py-1 rounded-full">
                    <Minus className="w-4 h-4 text-[#64748B]" />
                    Equal to yesterday's average
                  </span>
                )
              ) : (
                <span className="text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-bold">
                  Today's active food score based on {todayCount} scans
                </span>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 text-xs font-bold text-[#64748B] bg-slate-100 border border-[#E2E8F0] px-3.5 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              Scan a product below to establish today's score
            </div>
          )}
        </div>

        {/* Scan Food CTA Card (VISUALLY DOMINANT - Dark Charcoal Soft Pop with Lime Accent) */}
        <div className="card-forest p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#B9F24A] flex items-center justify-center font-black">
              <Camera className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              📷 Scan Food Product
            </h2>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Scan barcode or nutrition label to instantly decode ingredients, sugar content, and real personalized suitability scores.
            </p>
          </div>

          <button
            onClick={() => onNavigate('scan')}
            className="w-full py-4 rounded-[18px] font-black bg-[#B9F24A] text-slate-950 hover:bg-[#a8df3f] transition-all shadow-md text-base flex items-center justify-center gap-2 group cursor-pointer active:scale-98"
          >
            <Scan className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
            Scan Barcode or Label
          </button>
        </div>

      </div>

      {/* 4. FOODLENS AI INSIGHT / HEALTHY NEXT-STEP PLANNER (Fresh Mint Card) */}
      <div className="card-mint p-5 sm:p-6 flex items-start gap-4 shadow-xs">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
            ✦ Real FoodLens Intelligence Insight
          </h3>
          <p className="text-sm text-[#18181B] leading-relaxed font-medium">
            {data?.healthy_next_step_insight || "Your scanned items are being analyzed in real-time. Scan foods throughout your shopping trip to receive tailored next-step dietary advice."}
          </p>
        </div>
      </div>

      {/* 5. ANALYTICS & REAL TREND CHARTS GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Weekly Score Trend Line Chart (Blue personalized vs Yellow general) */}
        <div className="card-fresh p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#17172B] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#635BFF]" /> Weekly Score Trend
            </h3>
            <span className="text-xs font-bold text-[#64748B] bg-[#F8F9FD] px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
              {data?.timeframe_label || 'Past 7 Days'}
            </span>
          </div>

          {hasWeeklyScans ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.weekly_score_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#17172B', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                    formatter={(val: any, name: any) => [
                      val !== null && val !== undefined ? `${val} / 100` : 'No scans', 
                      String(name ?? '')
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Line 
                    type="monotone" 
                    dataKey="personalized_score" 
                    stroke="#635BFF" 
                    strokeWidth={3} 
                    name="Personalized Score" 
                    connectNulls 
                    dot={{ r: 4, fill: '#635BFF' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="general_score" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    name="General Score" 
                    connectNulls 
                    dot={{ r: 3, fill: '#F59E0B' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-[#F8F9FD] rounded-2xl border border-dashed border-[#E2E8F0] space-y-2">
              <TrendingUp className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-xs font-extrabold text-[#17172B]">No scan score trends recorded yet</p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                Scan grocery products to generate your personalized health trajectory and daily suitability scores.
              </p>
            </div>
          )}
        </div>

        {/* Daily Nutrient Intake Bar Chart (Yellow Sugar vs Green Protein) */}
        <div className="card-fresh p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#17172B] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#635BFF]" /> Real Nutrient Intake
            </h3>
            <span className="text-xs font-bold text-[#64748B] bg-[#F8F9FD] px-2.5 py-0.5 rounded-md border border-[#E2E8F0]">
              Sugar vs. Protein (g)
            </span>
          </div>

          {hasNutrientScans ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.nutrient_trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#17172B', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                    formatter={(val: any, name: any) => [`${val} g`, String(name ?? '')]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Bar dataKey="sugar" fill="#F59E0B" name="Sugar (g)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="protein" fill="#10B981" name="Protein (g)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-[#F8F9FD] rounded-2xl border border-dashed border-[#E2E8F0] space-y-2">
              <Activity className="w-8 h-8 text-[#94A3B8]" />
              <p className="text-xs font-extrabold text-[#17172B]">No nutrient intake logged yet</p>
              <p className="text-[11px] text-[#64748B] max-w-xs">
                As you scan products, FoodLens extracts real sugar, protein, and sodium amounts from nutrition labels.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 6. RECENT SCANS LIST (Green for Healthy, Yellow for Moderate, Red for Alert) */}
      <div className="card-fresh p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[#18181B]">Recent Scanned Items</h3>
            <p className="text-xs text-[#64748B] font-semibold">Latest products logged in your nutrition history</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-extrabold text-slate-700 hover:text-[#18181B] flex items-center gap-1 cursor-pointer"
          >
            Full Scan History <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {data?.recent_scans && data.recent_scans.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recent_scans.map((scan) => {
              const scoreVal = scan.score.personalized_score;
              // Green for Healthy (>=75), Yellow for Moderate (50-74), Red for Alert (<50)
              let scoreBg = 'bg-[#10B981] text-white';
              if (scoreVal < 50) scoreBg = 'bg-[#EF4444] text-white';
              else if (scoreVal < 75) scoreBg = 'bg-[#F59E0B] text-white';

              return (
                <div
                  key={scan.scan_id}
                  onClick={() => onNavigate('product_details', scan)}
                  className="p-4 rounded-[18px] border border-[#E2E8F0] bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 overflow-hidden">
                      {scan.product.image_url ? (
                        <img src={scan.product.image_url} alt={scan.product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Scan className="w-6 h-6 text-[#64748B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase text-[#94A3B8]">
                        {scan.scan_method}
                      </span>
                      <h4 className="text-xs font-extrabold text-[#18181B] group-hover:text-emerald-700 transition-colors truncate">
                        {scan.product.name}
                      </h4>
                      <p className="text-[10px] text-[#64748B] truncate font-medium">{scan.product.brand}</p>
                    </div>
                  </div>

                  <div className={`w-10 h-10 rounded-xl ${scoreBg} flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                    {scoreVal}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-[#64748B] text-xs space-y-3">
            <Scan className="w-10 h-10 mx-auto text-slate-400" />
            <p className="font-bold">No food scans recorded yet.</p>
            <button
              onClick={() => onNavigate('scan')}
              className="px-5 py-2.5 rounded-[14px] text-xs font-extrabold bg-[#635BFF] text-white hover:bg-[#4E44E6] cursor-pointer shadow-md shadow-[#635BFF]/25"
            >
              Scan Your First Food Product
            </button>
          </div>
        )}
      </div>

      {/* Quick Edit Goals & Dietary Modal (Change Anytime) */}
      {showQuickEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#18181B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Customize Goals & Dietary Anytime
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select one or more health goals and dietary preferences.
                </p>
              </div>
              <button 
                onClick={() => setShowQuickEdit(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Health Goals Multi-Select */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                Health Goals (Multi-Select)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'general_healthy_eating', label: 'General Healthy' },
                  { id: 'diabetes_oriented', label: 'Diabetes-Oriented' },
                  { id: 'weight_management', label: 'Weight Management' },
                  { id: 'high_protein', label: 'High Protein / Fitness' },
                  { id: 'low_sodium', label: 'Low Sodium' },
                  { id: 'low_sugar', label: 'Low Sugar' },
                  { id: 'heart_conscious', label: 'Heart Conscious' },
                ].map(g => {
                  const isSel = quickGoals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          const rem = quickGoals.filter(x => x !== g.id);
                          setQuickGoals(rem.length > 0 ? rem : ['general_healthy_eating']);
                        } else {
                          setQuickGoals([...quickGoals, g.id]);
                        }
                      }}
                      className={`p-3 rounded-[14px] text-xs font-extrabold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{g.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Lifestyles Multi-Select */}
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                Primary Dietary (Multi-Select)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'vegetarian', label: 'Vegetarian' },
                  { id: 'vegan', label: 'Vegan' },
                  { id: 'eggetarian', label: 'Eggetarian' },
                  { id: 'non_vegetarian', label: 'Non-Veg' },
                  { id: 'pescatarian', label: 'Pescatarian' },
                  { id: 'keto', label: 'Keto' },
                  { id: 'dairy_free', label: 'Dairy-Free' },
                  { id: 'gluten_free', label: 'Gluten-Free' },
                  { id: 'jain', label: 'Jain Diet' },
                ].map(d => {
                  const isSel = quickDietary.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setQuickDietary(quickDietary.filter(x => x !== d.id));
                        } else {
                          setQuickDietary([...quickDietary, d.id]);
                        }
                      }}
                      className={`p-2.5 rounded-[14px] text-xs font-extrabold text-left transition-all border flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-amber-50 border-2 border-amber-600 text-amber-950 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{d.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuickEdit(false)}
                className="px-5 py-2.5 rounded-[14px] text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={quickSaving}
                className="px-6 py-2.5 rounded-[14px] text-xs font-extrabold bg-[#164B3A] text-white hover:bg-[#0F3629] flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {quickSaving ? 'Saving...' : 'Save & Recalculate Dashboard'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

