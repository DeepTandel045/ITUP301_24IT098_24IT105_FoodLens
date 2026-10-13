import React from 'react';

interface CircularScoreRingProps {
  score: number;
  maxScore?: number;
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  goalBadge?: string;
}

export const CircularScoreRing: React.FC<CircularScoreRingProps> = ({
  score,
  maxScore = 100,
  label,
  sublabel,
  size = 'md',
  goalBadge,
}) => {
  const percentage = Math.min(Math.max((score / maxScore) * 100, 0), 100);
  
  // Semantic scale based on user spec:
  // >= 75 → Green (#10B981) for Healthy
  // 50–74 → Yellow/Amber (#F59E0B) for Moderate / Caution
  // < 50 → Red (#EF4444) for Alert / Concern
  let strokeColor = '#10B981';
  let badgeBg = 'bg-[#10B981] text-white';
  let statusText = 'HEALTHY FIT';

  if (score < 50) {
    strokeColor = '#EF4444'; // Red for Alert
    badgeBg = 'bg-[#EF4444] text-white';
    statusText = 'HIGH CONCERN';
  } else if (score < 75) {
    strokeColor = '#F59E0B'; // Yellow/Amber for Moderate
    badgeBg = 'bg-[#F59E0B] text-white';
    statusText = 'MODERATE FIT';
  }

  const dimensionMap = {
    sm: { svgSize: 64, strokeWidth: 5, radius: 26, fontSize: 'text-base font-bold', labelSize: 'text-[10px]' },
    md: { svgSize: 100, strokeWidth: 7, radius: 42, fontSize: 'text-2xl font-extrabold', labelSize: 'text-xs' },
    lg: { svgSize: 140, strokeWidth: 9, radius: 60, fontSize: 'text-3xl font-black', labelSize: 'text-xs' },
    hero: { svgSize: 180, strokeWidth: 11, radius: 78, fontSize: 'text-5xl font-black', labelSize: 'text-sm' },
  }[size];

  const { svgSize, strokeWidth, radius, fontSize, labelSize } = dimensionMap;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      
      {goalBadge && (
        <span className="mb-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BFF] border border-[#635BFF]/25">
          🎯 {goalBadge}
        </span>
      )}

      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
          {/* Outer soft pop ambient track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke="#EEF2EF"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Inner concentric ring (Soft Pop radar aesthetic) */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={Math.max(radius - strokeWidth - 2, 4)}
            stroke="#F0F4F1"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="transparent"
          />
          {/* Active score ring */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={`${fontSize} font-mono-code text-[#17201C] tracking-tight`}>{score}</span>
          <span className="text-[10px] font-mono-code font-bold text-[#5A6561] mt-0.5">/{maxScore}</span>
        </div>
      </div>

      {label && (
        <span className={`${labelSize} font-extrabold uppercase tracking-wider text-[#17201C] mt-3`}>
          {label}
        </span>
      )}

      {sublabel ? (
        <span className="text-xs text-[#5A6561] mt-0.5 font-medium">{sublabel}</span>
      ) : (
        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mt-2 ${badgeBg}`}>
          {statusText}
        </span>
      )}
    </div>
  );
};
