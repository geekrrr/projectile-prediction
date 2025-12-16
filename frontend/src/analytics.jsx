// Analytics.jsx - Enhanced Analytics Dashboard with Run Selector
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Target,
  Cpu,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  Calendar,
  Clock,
  Rocket,
  Crosshair,
  Mountain,
  Timer,
  Hash,
  Compass,
} from "lucide-react";

/**
 * Props:
 * - currentRun: { id, timestamp, type, stats, impact_physics, impact_ml, performance, projectile, v0, angle, drag }
 * - history: [ same shape as currentRun ... ]
 */

const SAMPLE_HISTORY = [];

// Theme Colors - Improved for better visualization
const COLOR_PHYSICS = "#ff6b9d";
const COLOR_ML = "#4dabf7";
const COLOR_SUCCESS = "#eab308";
const COLOR_WARNING = "#51cf66";
const COLOR_ACCENT = "#b197fc";

// Format date for display
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Analytics({ currentRun = null, history = null }) {
  const allHistory = history && history.length ? history : SAMPLE_HISTORY;
  
  // Data type filter - 'all', 'projectile', 'ballistic'
  const [dataType, setDataType] = useState('all');
  
  // Filter history based on selected type
  const hist = useMemo(() => {
    if (dataType === 'all') return allHistory;
    return allHistory.filter(r => r.type === dataType);
  }, [allHistory, dataType]);
  
  // Count runs by type
  const projectileCount = useMemo(() => allHistory.filter(r => r.type === 'projectile').length, [allHistory]);
  const ballisticCount = useMemo(() => allHistory.filter(r => r.type === 'ballistic').length, [allHistory]);
  
  // Selected run state - default to latest
  const [selectedRunIndex, setSelectedRunIndex] = useState(0);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef(null);
  
  // Reset selected run index when filter changes
  useEffect(() => {
    setSelectedRunIndex(hist.length > 0 ? hist.length - 1 : 0);
  }, [dataType, hist.length]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setSelectorOpen(false);
      }
    };

    if (selectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectorOpen]);
  
  // Get the selected run
  const cur = hist[selectedRunIndex] || hist[hist.length - 1];
  const hasData = hist.length > 0;

  // Metrics calculations
  const impactPhys = cur?.impact_physics ?? cur?.stats?.maxRange ?? 0;
  const impactML = cur?.impact_ml ?? impactPhys;
  const errorDelta = impactML - impactPhys;
  const errorPct = impactPhys ? (errorDelta / impactPhys) * 100 : 0;
  const isAccurate = Math.abs(errorPct) < 2;

  // History data for charts - use sequential numbering for clean labels
  const historyData = useMemo(() => {
    return hist.map((r, idx) => {
      const physics = r.impact_physics ?? r.stats?.maxRange ?? 0;
      const ml = r.impact_ml ?? r.impact_physics ?? r.stats?.maxRange ?? 0;
      const error = ml - physics;
      const errorPctValue = physics ? (error / physics) * 100 : 0;
      
      return {
        id: idx + 1,
        name: `Run ${idx + 1}`,
        physics,
        ml,
        error,
        errorPct: errorPctValue,
        maxHeight: r.stats?.maxHeight ?? 0,
        flightTime: r.stats?.flightTime ?? 0,
        angle: r.angle ?? 45,
        v0: r.v0 ?? 300,
        // Normalized range (0-100 scale for comparison)
        rangeKm: physics / 1000,
      };
    });
  }, [hist]);
  
  // Parameter correlation data - shows how parameters affect range
  const parameterCorrelation = useMemo(() => {
    return hist.map((r, idx) => ({
      id: idx + 1,
      angle: r.angle ?? 45,
      v0: r.v0 ?? 300,
      range: (r.impact_physics ?? r.stats?.maxRange ?? 0) / 1000, // in km
      maxHeight: (r.stats?.maxHeight ?? 0) / 1000, // in km
      flightTime: r.stats?.flightTime ?? 0,
    }));
  }, [hist]);

  // Statistics summary
  const statsSummary = useMemo(() => {
    if (historyData.length === 0) return null;
    
    const errors = historyData.map(d => d.errorPct);
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const maxError = Math.max(...errors.map(Math.abs));
    const ranges = historyData.map(d => d.physics);
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    
    return { avgError, maxError, avgRange };
  }, [historyData]);

  // Angle vs Range scatter data
  const angleRangeData = useMemo(() => {
    return hist.map(r => ({
      angle: r.angle ?? 45,
      range: r.stats?.maxRange ?? r.impact_physics ?? 0,
      v0: r.v0 ?? 300,
    }));
  }, [hist]);

  // Insights generator
  const insights = useMemo(() => {
    const items = [];
    if (!cur) return items;
    
    if (Math.abs(errorDelta) <= 10) {
      items.push({ type: 'success', text: 'ML prediction is very accurate (< 10m deviation)' });
    } else if (Math.abs(errorDelta) <= 50) {
      items.push({ type: 'info', text: 'ML prediction is within acceptable range (< 50m)' });
    } else {
      items.push({ type: 'warning', text: 'ML prediction shows significant deviation - consider retraining' });
    }
    
    if (cur.stats?.maxRange > 10000) {
      items.push({ type: 'info', text: 'Long-range trajectory detected (> 10km)' });
    }
    
    if (cur.stats?.maxHeight > 5000) {
      items.push({ type: 'info', text: 'High altitude trajectory (> 5km apex)' });
    }

    if (hist.length >= 5) {
      const avgError = hist.slice(-5).reduce((sum, r) => sum + Math.abs((r.impact_ml ?? 0) - (r.impact_physics ?? 0)), 0) / 5;
      if (avgError < 20) {
        items.push({ type: 'success', text: 'Model performing consistently well over last 5 runs' });
      }
    }
    
    return items;
  }, [cur, hist, errorDelta]);

  // Export data function
  const exportData = () => {
    const headers = ['ID', 'Timestamp', 'V0', 'Angle', 'Drag', 'Physics Impact', 'ML Impact', 'Error', 'Max Height', 'Flight Time'];
    const rows = hist.map(r => [
      r.id,
      r.timestamp,
      r.v0,
      r.angle,
      r.drag,
      r.impact_physics,
      r.impact_ml,
      ((r.impact_ml ?? 0) - (r.impact_physics ?? 0)).toFixed(2),
      r.stats?.maxHeight,
      r.stats?.flightTime
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ballistic_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear all saved runs from localStorage (keys starting with 'ballisticHistory_')
  const clearAllRuns = () => {
    if (!window.confirm('Delete ALL saved runs? This will remove saved run history for all users.')) return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ballisticHistory_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      // Optionally refresh view
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear run history', e);
      alert('Failed to clear run history. See console for details.');
    }
  };

  if (!hasData && !currentRun) {
    return (
      <div className="analytics-container">
        <div className="glass-card analytics-empty">
          <div className="empty-icon">
            <BarChart3 size={40} />
          </div>
          <h2 className="empty-title">No Analytics Data</h2>
          <p className="empty-desc">Run some simulations to see analytics and comparisons here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="glass-card analytics-header-card" style={{ padding: '24px' }}>
        <div className="analytics-header">
          <div>
            <h1 className="analytics-title">
              <BarChart3 size={28} />
              Analytics Dashboard
            </h1>
            <p className="analytics-subtitle">
              Comparing Physics Simulation vs ML Predictions • {allHistory.length} total simulation{allHistory.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="analytics-actions">
            {/* Run Selector Dropdown */}
            {hist.length > 0 && (
              <div className="run-selector" ref={selectorRef}>
                <button 
                  className="run-selector-btn"
                  onClick={() => setSelectorOpen(!selectorOpen)}
                >
                  <div className="run-selector-info">
                    <span className="run-selector-label">Viewing Run</span>
                    <span className="run-selector-value">
                      Run {selectedRunIndex + 1}
                      {selectedRunIndex === hist.length - 1 && <span className="latest-badge">Latest</span>}
                    </span>
                  </div>
                  <ChevronDown size={20} className={`selector-chevron ${selectorOpen ? 'open' : ''}`} />
                </button>
                
                {selectorOpen && (
                  <div className="run-selector-dropdown">
                    <div className="dropdown-header">
                      <span>Select Run to Analyze</span>
                    </div>
                    <div className="dropdown-list">
                      {hist.map((run, idx) => (
                        <button
                          key={run.id || idx}
                          className={`dropdown-item ${idx === selectedRunIndex ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRunIndex(idx);
                            setSelectorOpen(false);
                          }}
                        >
                        <div className="dropdown-item-main">
                          <span className="dropdown-item-title">
                            Run {idx + 1}
                            {idx === hist.length - 1 && <span className="latest-badge small">Latest</span>}
                          </span>
                          <span className="dropdown-item-params">
                            v₀={run.v0}m/s • θ={run.angle}° • drag={run.drag}
                          </span>
                        </div>
                        <div className="dropdown-item-meta">
                          <Calendar size={12} />
                          <span>{formatDate(run.timestamp)}</span>
                        </div>
                        <div className="dropdown-item-range">
                          {run.type === 'ballistic' 
                            ? `${((run.stats?.maxRange ?? run.impact_physics ?? 0) / 1000).toFixed(0)} km`
                            : `${(run.stats?.maxRange ?? run.impact_physics ?? 0).toFixed(0)} m`
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}

            <button className="settings-btn secondary" onClick={exportData}>
              <Download size={16} />
              Export CSV
            </button>
            <button
              className="settings-btn danger clear-runs-btn"
              onClick={clearAllRuns}
              disabled={!allHistory || allHistory.length === 0}
              title="Clear all saved runs"
            >
              <Trash2 size={16} />
              Clear All Runs
            </button>
          </div>
        </div>
        
        {/* Data Type Filter Tabs - Pill Slider Design */}
        <div className="pill-slider-container">
          <div 
            className="pill-slider-indicator" 
            style={{ 
              transform: `translateX(${dataType === 'all' ? '0' : dataType === 'projectile' ? '100%' : '200%'})`,
              width: 'calc((100% / 3) - 8px)'
            }} 
          />
          <button 
            className={`pill-slider-btn ${dataType === 'all' ? 'active' : ''}`}
            onClick={() => setDataType('all')}
          >
            <BarChart3 size={16} />
            <span>All Runs</span>
            <span className="pill-count">{allHistory.length}</span>
          </button>
          <button 
            className={`pill-slider-btn ${dataType === 'projectile' ? 'active' : ''}`}
            onClick={() => setDataType('projectile')}
          >
            <Crosshair size={16} />
            <span>Projectile</span>
            <span className="pill-count">{projectileCount}</span>
          </button>
          <button 
            className={`pill-slider-btn ${dataType === 'ballistic' ? 'active' : ''}`}
            onClick={() => setDataType('ballistic')}
          >
            <Rocket size={16} />
            <span>Ballistic</span>
            <span className="pill-count">{ballisticCount}</span>
          </button>
        </div>
      </div>

      {/* Show empty state if filtered results are empty */}
      {hist.length === 0 ? (
        <div className="glass-card analytics-empty" style={{ marginTop: '20px' }}>
          <div className="empty-icon">
            {dataType === 'ballistic' ? <Rocket size={40} /> : <Crosshair size={40} />}
          </div>
          <h2 className="empty-title">No {dataType === 'ballistic' ? 'Ballistic' : 'Projectile'} Data</h2>
          <p className="empty-desc">
            {dataType === 'ballistic' 
              ? 'Run some ballistic missile simulations from the Ballistic page to see data here.'
              : 'Run some projectile simulations from the Home page to see data here.'
            }
          </p>
        </div>
      ) : (
      <>
      {/* Key Metrics Section */}
      <div className="analytics-section">
        <h4 className="analytics-section-title">Key Metrics</h4>
        <div className="metrics-grid">
          <div className="glass-card metric-card physics">
            <div className="metric-label">{cur?.type === 'ballistic' ? 'Range' : 'Physics Simulation'}</div>
            <div className="metric-value" color="white">
              {cur?.type === 'ballistic' 
                ? `${(impactPhys / 1000).toFixed(1)}` 
                : impactPhys.toFixed(1)
              } <span>{cur?.type === 'ballistic' ? 'km' : 'm'}</span>
            </div>
            <div className="metric-sub">{cur?.type === 'ballistic' ? 'Calculated Range' : 'Calculated Impact Distance'}</div>
          </div>

          <div className="glass-card metric-card ml">
            <div className="metric-label">{cur?.type === 'ballistic' ? 'Max Altitude' : 'ML Prediction'}</div>
            <div className="metric-value" color="white">
              {cur?.type === 'ballistic' 
                ? (cur?.stats?.maxHeight ?? 0).toFixed(1)
                : impactML.toFixed(1)
              } <span>{cur?.type === 'ballistic' ? 'km' : 'm'}</span>
            </div>
            <div className="metric-sub">{cur?.type === 'ballistic' ? 'Peak Height' : 'Random Forest Model'}</div>
          </div>

          <div className={`glass-card metric-card accuracy ${isAccurate ? '' : 'warning'}`}>
            <div className="metric-label">Model Deviation</div>
            <div className="metric-value" style={{ color: isAccurate ? COLOR_SUCCESS : COLOR_WARNING }}>
              {errorDelta > 0 ? '+' : ''}{errorDelta.toFixed(1)} <span>m</span>
            </div>
            <div className="metric-sub">
              {errorPct > 0 ? '+' : ''}{errorPct.toFixed(3)}% • {isAccurate ? 'Within tolerance' : 'High deviation'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Run Stats Section */}
      {cur?.stats && (
        <div className="analytics-section">
          <h4 className="analytics-section-title">Current Run Statistics</h4>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}><Mountain size={28} style={{color: '#8ddbffff'}} /></div>
              <div className="metric-label">Max Height</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {cur.stats.maxHeight?.toFixed(1)} m
              </div>
            </div>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}><Timer size={28} style={{color: '#fda05dff'}} /></div>
              <div className="metric-label">Flight Time</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {cur.stats.flightTime?.toFixed(2)} s
              </div>
            </div>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}><Hash size={28} style={{color: '#55ef8dff'}} /></div>
              <div className="metric-label">Data Points</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {cur.stats.trajectoryPoints?.toLocaleString()}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}><Compass size={28} style={{color: '#eab308'}} /></div>
              <div className="metric-label">Launch Angle</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {cur.angle ?? 45}°
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="analytics-section">
        <h4 className="analytics-section-title">Visual Analysis</h4>
        <div className="chart-grid">
        {/* ML Accuracy Over Time - Percentage Error */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">
            <TrendingUp size={20} />
            ML Accuracy (% Error Over Time)
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorErrorPct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR_WARNING} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLOR_WARNING} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 30, 50, 0.95)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(102, 126, 234, 0.3)', 
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}
                  formatter={(value, name) => {
                    if (name === 'errorPct') return [`${value.toFixed(4)}%`, 'Error'];
                    return [value.toFixed(2), name];
                  }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" strokeDasharray="5 5" label={{ value: 'Perfect', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <ReferenceLine y={2} stroke={COLOR_SUCCESS} strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={-2} stroke={COLOR_SUCCESS} strokeDasharray="3 3" strokeOpacity={0.5} />
                <Area 
                  type="monotone" 
                  dataKey="errorPct" 
                  stroke={COLOR_WARNING} 
                  fillOpacity={1} 
                  fill="url(#colorErrorPct)" 
                  name="errorPct" 
                  strokeWidth={2}
                  dot={{ fill: '#0ab30fff', r: 3 }}
                  activeDot={{ r: 5, fill: '#0ab30fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '12px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span>━━ ±2% tolerance zone</span>
            <span>┄┄ Perfect accuracy (0%)</span>
          </div>
        </div>

        {/* Error Trend */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">
            <Target size={20} />
            Prediction Error Trend (Absolute)
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorErrorOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="1%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="70%" stopColor="#eab308" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false}
                  label={{ value: 'Error (m)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 30, 50, 0.95)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(102, 126, 234, 0.3)', 
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 500 }}
                  itemStyle={{ color: '#fff', padding: '4px 0' }}
                  formatter={(value) => [`${value.toFixed(2)} m`, 'Error']}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                <ReferenceLine y={10} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <ReferenceLine y={-10} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="error"
                  stroke="#eab308"
                  fill="url(#colorErrorOrange)"
                  strokeWidth={2}
                  name="Error"
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6, fill: '#f97316' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '12px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span>━━ ±10m acceptable range</span>
          </div>
        </div>
      </div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="glass-card insights-panel">
          <h3 className="insights-title">
            <Cpu size={20} />
            AI Insights
          </h3>
          <div className="insights-list">
            {insights.map((insight, idx) => (
              <div key={idx} className={`insight-item ${insight.type}`}>
                {insight.type === 'success' && <CheckCircle size={18} color="white" />}
                {insight.type === 'warning' && <AlertCircle size={18} color="white" />}
                {insight.type === 'info' && <Info size={18} color="white" />}
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
