import React from 'react';
import { Track, Referendum } from '@/services/governance';

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

interface GovernanceChartsProps {
  tracks: Track[];
  referenda: Referendum[];
  isLoading: boolean;
}

export function GovernanceCharts({
  tracks,
  referenda,
  isLoading
}: GovernanceChartsProps) {
  const prepareChartData = (): {
    votingTrends: ChartData;
    trackActivity: ChartData;
    turnoutRates: ChartData;
  } => {
    // Prepare data for voting trends (last 5 referenda)
    const recentReferenda = [...referenda]
      .sort((a, b) => parseInt(b.submittedAt) - parseInt(a.submittedAt))
      .slice(0, 5)
      .reverse();

    const votingTrends = {
      labels: recentReferenda.map(ref => `Ref #${ref.index}`),
      values: recentReferenda.map(ref => {
        const ayes = parseFloat(ref.tally.ayes) || 0;
        const nays = parseFloat(ref.tally.nays) || 0;
        const total = ayes + nays;
        return total > 0 ? (ayes / total * 100) : 0;
      }),
      colors: recentReferenda.map(() => '#EC4899')
    };

    // Create a map of track IDs to ensure uniqueness
    const trackMap = new Map(tracks.map(track => [track.id.toString(), track]));

    // Filter out referenda with invalid track IDs
    const validReferenda = referenda.filter(ref => trackMap.has(ref.track));

    // Prepare data for track activity
    const trackActivity = {
      labels: Array.from(trackMap.values()).map(track => `${track.name} (${track.id})`),
      values: Array.from(trackMap.values()).map(track => {
        const trackRefs = validReferenda.filter(ref => ref.track === track.id.toString());
        return trackRefs.length;
      }),
      colors: Array.from(trackMap.values()).map(() => '#EC4899')
    };

    // Prepare data for turnout rates
    const turnoutRates = {
      labels: Array.from(trackMap.values()).map(track => `${track.name} (${track.id})`),
      values: Array.from(trackMap.values()).map(track => {
        const trackRefs = validReferenda.filter(ref => ref.track === track.id.toString());
        if (trackRefs.length === 0) return 0;
        const totalSupport = trackRefs.reduce((acc, ref) => acc + (parseFloat(ref.tally.support) || 0), 0);
        return (totalSupport / trackRefs.length) * 100;
      }),
      colors: Array.from(trackMap.values()).map(() => '#EC4899')
    };

    return {
      votingTrends,
      trackActivity,
      turnoutRates
    };
  };

  const renderBarChart = (data: ChartData, height: number = 200) => {
    if (data.values.length === 0) {
      return (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.values, 0.1);
    
    return (
      <div className="relative h-[200px]">
        <div className="absolute inset-0 flex items-end justify-around">
          {data.values.map((value, index) => {
            const label = data.labels[index];
            const uniqueKey = `${label}-${value.toFixed(3)}-${index}`;
            return (
              <div key={uniqueKey} className="flex flex-col items-center w-full px-2">
                <div
                  className="w-full bg-pink-600 rounded-t"
                  style={{
                    height: `${(value / maxValue) * height}px`,
                    transition: 'height 0.3s ease-in-out'
                  }}
                />
                <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                  {label}
                </div>
                <div className="text-xs font-medium">{value.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = (data: ChartData) => {
    if (data.values.length <= 1) {
      return (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          Not enough data for trend visualization
        </div>
      );
    }

    const maxValue = Math.max(...data.values, 0.1);
    const points = data.values.map((value, index) => ({
      x: data.values.length > 1 ? (index / (data.values.length - 1)) * 100 : 0,
      y: (value / maxValue) * 100,
      label: data.labels[index],
      value: value.toFixed(3)
    }));

    const pathData = points
      .map((point, index) => 
        (index === 0 ? 'M' : 'L') + `${point.x} ${100 - point.y}`
      )
      .join(' ');

    return (
      <div className="relative h-[200px] mt-8">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <path
            d={pathData}
            fill="none"
            stroke="#EC4899"
            strokeWidth="2"
          />
          {points.map((point, index) => {
            const uniqueKey = `${point.label}-${point.value}-${index}`;
            return (
              <g key={uniqueKey}>
                <circle
                  cx={`${point.x}%`}
                  cy={`${100 - point.y}%`}
                  r="4"
                  fill="#EC4899"
                />
                <text
                  x={`${point.x}%`}
                  y="100%"
                  textAnchor="middle"
                  className="text-xs"
                  fill="#6B7280"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={`loading-${i}`} className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-[200px] bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Voting Trends</h3>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderLineChart(chartData.votingTrends)}
          <p className="text-sm text-gray-500 mt-4">
            Percentage of "Aye" votes in recent referenda
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Track Activity</h3>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderBarChart(chartData.trackActivity)}
          <p className="text-sm text-gray-500 mt-4">
            Number of referenda per track
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Turnout Rates by Track</h3>
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderBarChart(chartData.turnoutRates)}
          <p className="text-sm text-gray-500 mt-4">
            Average turnout percentage per track
          </p>
        </div>
      </div>
    </div>
  );
} 