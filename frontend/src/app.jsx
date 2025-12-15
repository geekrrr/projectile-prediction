// App.jsx - Complete Redesign with Authentication & All Features
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Home,
  BarChart3,
  Settings,
  Info,
  Play,
  RotateCcw,
  Target,
  Zap,
  Activity,
  CheckCircle2,
  Database,
  Menu,
  X,
} from "lucide-react";
import "./styles.css";
import Analytics from './analytics'
import Ballistic from './Ballistic'
import SettingsPage from './Settings'
import About from './About'
import Auth, { UserProfile } from './Auth'

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Available projectile objects
const PROJECTILE_OBJECTS = {
  missile: { name: 'Rocket', emoji: '🚀', size: 24, rotation: true },
  ball: { name: 'Ball', emoji: '⚽', size: 20, rotation: false },
  plane: { name: 'Plane', emoji: '✈️', size: 28, rotation: true },
  bomb: { name: 'Bomb', emoji: '💣', size: 20, rotation: false },
  star: { name: 'Star', emoji: '⭐', size: 22, rotation: false },
  stone: { name: 'Rock', emoji: '🪨', size: 20, rotation: false }
};

// Animation speed settings
const ANIMATION_SPEEDS = {
  slow: { label: 'Slow', delay: 25 },
  normal: { label: 'Normal', delay: 15 },
  fast: { label: 'Fast', delay: 5 }
};

export default function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem("ballisticSession");
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData && userData.username) {
          // Load user's history
          const userHistory = JSON.parse(
            localStorage.getItem(`ballisticHistory_${userData.username.toLowerCase()}`) || "[]"
          );
          setUser({ ...userData, history: userHistory });
          setIsAuthenticated(true);
          setHistory(userHistory);
        }
      } catch (e) {
        localStorage.removeItem("ballisticSession");
      }
    }
    setAuthChecked(true);
  }, []);

  // Load saved settings from localStorage
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('ballisticSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return null;
  };

  const savedSettings = loadSavedSettings();

  // Input states - use saved settings or defaults
  const [v0, setV0] = useState(savedSettings?.defaultVelocity || 300);
  const [angle, setAngle] = useState(savedSettings?.defaultAngle || 45);
  const [drag, setDrag] = useState(savedSettings?.defaultDrag || 0.01);
  const [dt, setDt] = useState(savedSettings?.defaultTimeStep || 0.01);
  const [releaseHeight, setReleaseHeight] = useState(savedSettings?.defaultReleaseHeight || 0);

  // Results & UI states
  const [xs, setXs] = useState([]);
  const [ys, setYs] = useState([]);
  const [impactDistance, setImpactDistance] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("simulation");

  // view state
  const [currentView, setCurrentView] = useState('trajectory');

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedObject, setSelectedObject] = useState('missile');
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(savedSettings?.defaultAnimationSpeed || 'normal');

  const canvasRef = useRef(null);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (user && history.length > 0) {
      localStorage.setItem(
        `ballisticHistory_${user.username.toLowerCase()}`,
        JSON.stringify(history)
      );
    }
  }, [history, user]);

  // Handle login
  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    if (userData.history) {
      setHistory(userData.history);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setHistory([]);
    setXs([]);
    setYs([]);
    setStats(null);
    setImpactDistance(null);
  }, []);

  // Run simulation
  async function runSimulation() {
    setLoading(true);
    setError(null);
    setIsAnimating(false);
    setAnimationComplete(false);
    setCurrentAnimationIndex(0);

    try {
      const resp = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          v0: parseFloat(v0),
          angle: parseFloat(angle),
          drag: parseFloat(drag),
          dt: parseFloat(dt),
          release_height: parseFloat(releaseHeight) || 0
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || "Server error");
      }

      const data = await resp.json();

      setXs(data.xs || []);
      setYs(data.ys || []);
      setImpactDistance(data.impact_physics ?? null);

      setStats({
        maxHeight: data.max_height,
        maxRange: data.max_range,
        flightTime: data.flight_time,
        trajectoryPoints: data.trajectory_points
      });

      // Record history with sequential ID
      const newRun = {
        id: history.length + 1,
        timestamp: new Date().toISOString(),
        type: 'projectile', // Type for filtering in analytics
        v0: parseFloat(v0),
        angle: parseFloat(angle),
        drag: parseFloat(drag),
        dt: parseFloat(dt),
        releaseHeight: parseFloat(releaseHeight) || 0,
        xs: data.xs,
        ys: data.ys,
        stats: {
          maxHeight: data.max_height,
          maxRange: data.max_range,
          flightTime: data.flight_time,
          trajectoryPoints: data.trajectory_points
        },
        impact_physics: data.impact_physics,
        impact_ml: data.impact_ml,
        projectile: selectedObject
      };

      setHistory(prev => [...prev, newRun]);

      setTimeout(() => {
        setIsAnimating(true);
      }, 300);

    } catch (e) {
      setError(e.message || String(e));
      console.error("Simulation error:", e);
    } finally {
      setLoading(false);
    }
  }

  // Animation loop
  useEffect(() => {
    if (!isAnimating || xs.length === 0) return;

    const animate = () => {
      setCurrentAnimationIndex(prev => {
        if (prev >= xs.length - 1) {
          setIsAnimating(false);
          setAnimationComplete(true);
          return prev;
        }
        return prev + 1;
      });
    };

    const speedConfig = ANIMATION_SPEEDS[animationSpeed];
    const delay = speedConfig ? speedConfig.delay : 15;

    const timeoutId = setTimeout(animate, delay);
    return () => clearTimeout(timeoutId);
  }, [isAnimating, currentAnimationIndex, xs.length, animationSpeed]);

  // Draw trajectory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || xs.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const padding = 60;
    const scaleX = (rect.width - 2 * padding) / maxX;
    const scaleY = (rect.height - 2 * padding) / maxY;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';

    const xSteps = 5;
    const xInterval = maxX / xSteps;
    for (let i = 0; i <= xSteps; i++) {
      const x = padding + (i * xInterval * scaleX);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(`${(i * xInterval).toFixed(0)}m`, x, rect.height - padding + 20);
    }

    const ySteps = 5;
    const yInterval = maxY / ySteps;
    for (let i = 0; i <= ySteps; i++) {
      const y = rect.height - padding - (i * yInterval * scaleY);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(`${(i * yInterval).toFixed(0)}m`, padding - 10, y + 4);
    }

    // Axes labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Distance (m)', rect.width / 2, rect.height - 10);

    ctx.save();
    ctx.translate(15, rect.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Height (m)', 0, 0);
    ctx.restore();

    // Full trajectory path (faded)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    xs.forEach((x, i) => {
      const px = padding + x * scaleX;
      const py = rect.height - padding - ys[i] * scaleY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated trajectory
    if (currentAnimationIndex > 0) {
      const activeGradient = ctx.createLinearGradient(0, 0, rect.width, 0);
      activeGradient.addColorStop(0, '#d0a4ffff');
      activeGradient.addColorStop(0.5, '#d0a4ffff');
      activeGradient.addColorStop(1, '#d0a4ffff');

      ctx.strokeStyle = activeGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(123, 158, 255, 0.6)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      for (let i = 0; i <= currentAnimationIndex; i++) {
        const px = padding + xs[i] * scaleX;
        const py = rect.height - padding - ys[i] * scaleY;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Launch point
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(padding, rect.height - padding, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Target
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 1.5;
    const targetX = padding + xs[xs.length - 1] * scaleX;
    const targetY = rect.height - padding;

    for (let r = 5; r <= 15; r += 5) {
      ctx.beginPath();
      ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Moving projectile
    if (currentAnimationIndex < xs.length) {
      const px = padding + xs[currentAnimationIndex] * scaleX;
      const py = rect.height - padding - ys[currentAnimationIndex] * scaleY;

      const projectile = PROJECTILE_OBJECTS[selectedObject];

      let rotationAngle = 0;
      if (projectile.rotation && currentAnimationIndex > 0) {
        const dx = xs[currentAnimationIndex] - xs[currentAnimationIndex - 1];
        const dy = ys[currentAnimationIndex] - ys[currentAnimationIndex - 1];
        rotationAngle = Math.atan2(-dy, dx);
      }

      ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
      ctx.shadowBlur = 25;

      ctx.save();
      ctx.translate(px, py);
      if (projectile.rotation) ctx.rotate(rotationAngle);

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, projectile.size / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${projectile.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(projectile.emoji, 0, 0);

      ctx.restore();
      ctx.shadowBlur = 0;
    }

    // Annotations when complete
    if (animationComplete && stats) {
      const maxHeightIndex = ys.indexOf(maxY);
      const maxHeightX = padding + xs[maxHeightIndex] * scaleX;
      const maxHeightY = rect.height - padding - maxY * scaleY;

      ctx.strokeStyle = 'rgba(255, 220, 100, 1)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = 'rgba(255, 220, 100, 0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(maxHeightX, maxHeightY);
      ctx.lineTo(maxHeightX, rect.height - padding);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255, 200, 50, 0.95)';
      ctx.fillRect(maxHeightX - 55, maxHeightY - 40, 110, 32);
      ctx.strokeStyle = 'rgba(255, 220, 100, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(maxHeightX - 55, maxHeightY - 40, 110, 32);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Max Height', maxHeightX, maxHeightY - 24);
      ctx.fillText(`${stats.maxHeight.toFixed(1)} m`, maxHeightX, maxHeightY - 11);

      ctx.strokeStyle = 'rgba(100, 220, 255, 1)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = 'rgba(100, 220, 255, 0.6)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(padding, rect.height - padding - 15);
      ctx.lineTo(targetX, rect.height - padding - 15);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      const rangeLabelX = padding + (targetX - padding) / 2;
      ctx.fillStyle = 'rgba(100, 200, 255, 0.95)';
      ctx.fillRect(rangeLabelX - 45, rect.height - padding - 50, 90, 32);
      ctx.strokeStyle = 'rgba(100, 220, 255, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rangeLabelX - 45, rect.height - padding - 50, 90, 32);

      ctx.fillStyle = '#000';
      ctx.fillText('Range', rangeLabelX, rect.height - padding - 34);
      ctx.fillText(`${stats.maxRange.toFixed(1)} m`, rangeLabelX, rect.height - padding - 21);

      const impactX = targetX;
      const impactY = rect.height - padding;

      ctx.fillStyle = 'rgba(255, 220, 100, 0.7)';
      ctx.beginPath();
      ctx.arc(impactX, impactY, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 180, 80, 0.5)';
      ctx.beginPath();
      ctx.arc(impactX, impactY, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255, 150, 0, 0.8)';
      ctx.shadowBlur = 15;
      ctx.fillText('💥', impactX, impactY);
      ctx.shadowBlur = 0;
    }
  }, [xs, ys, currentAnimationIndex, isAnimating, selectedObject, animationComplete, stats]);

  // Clear simulation
  function clearSimulation() {
    setXs([]);
    setYs([]);
    setImpactDistance(null);
    setStats(null);
    setError(null);
    setIsAnimating(false);
    setAnimationComplete(false);
    setCurrentAnimationIndex(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Clear all saved runs for current user (with confirmation)
  function clearAllRuns() {
    if (!user) return;
    const ok = window.confirm('Delete ALL saved runs for your account? This cannot be undone.');
    if (!ok) return;

    // Clear in-memory state
    setHistory([]);
    setXs([]);
    setYs([]);
    setImpactDistance(null);
    setStats(null);
    setIsAnimating(false);
    setAnimationComplete(false);
    setCurrentAnimationIndex(0);

    // Remove from localStorage
    try {
      localStorage.removeItem(`ballisticHistory_${user.username.toLowerCase()}`);
    } catch (e) {
      console.error('Failed to remove history from localStorage', e);
    }
  }

  // Replay animation
  function replayAnimation() {
    if (xs.length > 0) {
      setCurrentAnimationIndex(0);
      setAnimationComplete(false);
      setIsAnimating(true);
    }
  }

  // Navigation handler with mobile menu close
  const handleNavigation = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <Target className="title-icon" />
            <span className="title-text">Ballistic Studio</span>
            <span className="title-subtitle">Trajectory Prediction System</span>
          </h1>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation */}
        <nav className={`nav-buttons ${mobileMenuOpen ? 'open' : ''}`}>
          <button
            className={`nav-btn ${currentView === 'trajectory' ? 'active' : ''}`}
            onClick={() => handleNavigation('trajectory')}
          >
            <Home size={18} />
            Home
          </button>

          <button
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavigation('analytics')}
          >
            <BarChart3 size={18} />
            Analytics
          </button>

          <button
            className={`nav-btn ${currentView === 'ballistic' ? 'active' : ''}`}
            onClick={() => handleNavigation('ballistic')}
          >
            <Zap size={18} />
            Ballistic
          </button>

          <button
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigation('settings')}
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            className={`nav-btn ${currentView === 'about' ? 'active' : ''}`}
            onClick={() => handleNavigation('about')}
          >
            <Info size={18} />
            About
          </button>

          {/* User Profile */}
          <UserProfile user={user} onLogout={handleLogout} />
        </nav>
      </header>

      {/* Main Content */}
      {currentView === 'trajectory' ? (
        <div className="main-grid">
          {/* Left Panel - Inputs */}
          <aside className="left-panel">
            <div className="glass-card">
              <h3 className="panel-title">
                <Zap size={20} />
                Simulation Parameters
              </h3>

              <div className="input-group">
                <label className="input-label">Initial Velocity (m/s)</label>
                <input
                  type="number"
                  className="input-field"
                  value={v0}
                  onChange={(e) => setV0(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Launch Angle (°) <span style={{fontSize: '0.75rem', opacity: 0.7}}>-90 to 90</span></label>
                <input
                  type="number"
                  className="input-field"
                  min="-90"
                  max="90"
                  value={angle}
                  onChange={(e) => setAngle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Drag Coefficient</label>
                <input
                  type="number"
                  step="0.001"
                  className="input-field"
                  value={drag}
                  onChange={(e) => setDrag(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Time Step dt (s)</label>
                <input
                  type="number"
                  step="0.001"
                  className="input-field"
                  value={dt}
                  onChange={(e) => setDt(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Release Height from Ground (m)</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  className="input-field"
                  value={releaseHeight}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(10000, parseFloat(e.target.value) || 0));
                    setReleaseHeight(val);
                  }}
                  placeholder="0"
                />
              </div>

              {/* Object Selector */}
              <div className="input-group">
                <label className="input-label">Projectile Object</label>
                <div className="object-selector-redesign">
                  {Object.entries(PROJECTILE_OBJECTS).map(([key, obj]) => (
                    <button
                      key={key}
                      className={`object-card ${selectedObject === key ? 'active' : ''}`}
                      onClick={() => setSelectedObject(key)}
                    >
                      <span className="object-card-emoji">{obj.emoji}</span>
                      <span className="object-card-name">{obj.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Speed */}
              <div className="input-group">
                <label className="input-label">Animation Speed</label>
                <div className="speed-control">
                  {Object.entries(ANIMATION_SPEEDS).map(([key, speed]) => (
                    <button
                      key={key}
                      className={`speed-btn-new ${animationSpeed === key ? 'active' : ''}`}
                      onClick={() => setAnimationSpeed(key)}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="button-group">
                <button
                  className="btn btn-primary"
                  onClick={runSimulation}
                  disabled={loading || isAnimating}
                >
                  <Play size={18} />
                  {loading ? "Running..." : isAnimating ? "Animating..." : "Launch"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={clearSimulation}
                  disabled={loading || isAnimating}
                >
                  Clear
                </button>
              </div>

              <div className="info-box">
                <CheckCircle2 size={16} />
                <div>
                  Welcome, <strong>{user?.username}</strong>! Your simulations are saved automatically.
                </div>
              </div>
            </div>
          </aside>

          {/* Right Panel - Visualization */}
          <main className="right-panel">
            <div className="glass-card visualization-card">
              <div className="card-header">
                <h2 className="card-title">
                  <Activity size={24} />
                  Trajectory Visualization
                </h2>
                <div className="card-actions">
                  <button
                    className="action-btn"
                    onClick={replayAnimation}
                    disabled={xs.length === 0 || isAnimating}
                  >
                    <RotateCcw size={18} />
                    Replay
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div className="canvas-container">
                {xs.length === 0 ? (
                  <div className="placeholder-content">
                    <Target size={48} className="placeholder-icon" />
                    <p className="placeholder-text">No trajectory data</p>
                    <p className="placeholder-subtext">Configure parameters and launch simulation</p>
                  </div>
                ) : (
                  <canvas ref={canvasRef} className="trajectory-canvas" />
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="error-message">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "simulation" ? "active" : ""}`}
                  onClick={() => setActiveTab("simulation")}
                >
                  Simulation
                </button>
                <button
                  className={`tab ${activeTab === "data" ? "active" : ""}`}
                  onClick={() => setActiveTab("data")}
                >
                  <Database size={16} />
                  Data
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "simulation" ? (
                <>
                  {/* Impact Result */}
                  {impactDistance !== null && (
                    <div className="impact-result-new">
                      <div className="impact-badge">🎯 PREDICTED IMPACT DISTANCE</div>
                      <div className="impact-value-large">{impactDistance.toFixed(2)} m</div>
                      <div className="impact-note">Physics-based calculation with ML validation</div>
                    </div>
                  )}

                  {/* Statistics Grid */}
                  {stats && (
                    <div className="stats-grid-new">
                      <div className="stat-box">
                        <div className="stat-icon-new">🔝</div>
                        <div className="stat-label-new">Max Height</div>
                        <div className="stat-value-new">{stats.maxHeight?.toFixed(1)} m</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-icon-new">📏</div>
                        <div className="stat-label-new">Max Range</div>
                        <div className="stat-value-new">{stats.maxRange?.toFixed(1)} m</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-icon-new">⏱️</div>
                        <div className="stat-label-new">Flight Time</div>
                        <div className="stat-value-new">{stats.flightTime?.toFixed(2)} s</div>
                      </div>
                      <div className="stat-box">
                        <div className="stat-icon-new">🎯</div>
                        <div className="stat-label-new">Data Points</div>
                        <div className="stat-value-new">{stats.trajectoryPoints}</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Data Tab Content */
                <div className="data-tab-content">
                  {xs.length === 0 ? (
                    <div className="data-empty">
                      <Database size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <p>No trajectory data available</p>
                      <p style={{ fontSize: '14px', opacity: 0.7 }}>Run a simulation to see data points</p>
                    </div>
                  ) : (
                    <>
                      <div className="data-header">
                        <h3>Trajectory Data Points</h3>
                        <span className="data-count">{xs.length} points</span>
                      </div>
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>X (m)</th>
                              <th>Y (m)</th>
                              <th>Time (s)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {xs.slice(0, 100).map((x, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{x.toFixed(2)}</td>
                                <td>{ys[i]?.toFixed(2)}</td>
                                <td>{(i * dt).toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {xs.length > 100 && (
                          <p className="data-note">Showing first 100 of {xs.length} data points</p>
                        )}
                      </div>
                      <div className="data-actions data-actions--spaced">
                        <button 
                          className="btn btn-secondary data-export-btn"
                          onClick={() => {
                            const csv = ['Index,X(m),Y(m),Time(s)', ...xs.map((x, i) => 
                              `${i + 1},${x.toFixed(4)},${ys[i].toFixed(4)},${(i * dt).toFixed(4)}`
                            )].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `trajectory_data_${Date.now()}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Export CSV
                        </button>
                        <button
                          className="btn btn-danger data-clear-btn"
                          onClick={clearAllRuns}
                          disabled={history.length === 0}
                        >
                          Clear All Runs
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      ) : currentView === 'analytics' ? (
        <Analytics
          currentRun={history.length > 0 ? history[history.length - 1] : null}
          history={history}
        />
      ) : currentView === 'ballistic' ? (
        <Ballistic 
          onSaveRun={(run) => setHistory(prev => [...prev, { ...run, id: prev.length + 1 }])}
          historyLength={history.length}
        />
      ) : currentView === 'settings' ? (
        <SettingsPage 
          onSettingsChange={(newSettings) => {
            if (newSettings.defaultVelocity) setV0(newSettings.defaultVelocity);
            if (newSettings.defaultAngle) setAngle(newSettings.defaultAngle);
            if (newSettings.defaultDrag) setDrag(newSettings.defaultDrag);
            if (newSettings.defaultTimeStep) setDt(newSettings.defaultTimeStep);
            if (newSettings.defaultAnimationSpeed) setAnimationSpeed(newSettings.defaultAnimationSpeed);
          }}
        />
      ) : currentView === 'about' ? (
        <About />
      ) : null}
    </div>
  );
}
