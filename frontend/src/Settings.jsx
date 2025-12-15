// Settings.jsx - Functional Settings Component
import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Sliders,
  Palette,
  Zap,
  Globe,
  RotateCcw,
  Save,
  Check,
  AlertCircle,
  Server,
  Eye,
  Clock,
  Rocket,
} from "lucide-react";

// Default settings configuration
const DEFAULT_SETTINGS = {
  // Projectile Simulation defaults
  defaultVelocity: 300,
  defaultAngle: 45,
  defaultDrag: 0.01,
  defaultTimeStep: 0.01,
  
  // Ballistic Missile defaults
  ballisticElevation: 75,
  ballisticLaunchMass: 6200,
  ballisticThrustToWeight: 1.5,
  ballisticDragCoeff: 0.2,
  ballisticIsp: 237,
  defaultMissilePreset: 'minuteman3',
  ballisticMode: 'manual',
  
  // Animation settings
  defaultAnimationSpeed: 'normal',
  showTrajectoryPath: true,
  showGridLines: true,
  showAnnotations: true,
  
  // Display settings
  distanceUnit: 'meters',
  timeUnit: 'seconds',
  decimalPlaces: 2,
  
  // Advanced settings
  apiUrl: 'http://127.0.0.1:8000',
  autoReplay: false,
  soundEffects: false,
};

// Unit options
const DISTANCE_UNITS = [
  { value: 'meters', label: 'Meters (m)', factor: 1 },
  { value: 'kilometers', label: 'Kilometers (km)', factor: 0.001 },
  { value: 'feet', label: 'Feet (ft)', factor: 3.28084 },
  { value: 'miles', label: 'Miles (mi)', factor: 0.000621371 },
];

const TIME_UNITS = [
  { value: 'seconds', label: 'Seconds (s)' },
  { value: 'minutes', label: 'Minutes (min)' },
];

const ANIMATION_SPEEDS = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

export default function Settings({ onSettingsChange, initialSettings }) {
  const [settings, setSettings] = useState(() => {
    // Try to load from localStorage or use defaults
    const saved = localStorage.getItem('ballisticSettings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return initialSettings || DEFAULT_SETTINGS;
  });

  const [saveStatus, setSaveStatus] = useState(null);
  const [activeSection, setActiveSection] = useState('simulation');

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ballisticSettings', JSON.stringify(settings));
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('changed');
  };

  const saveSettings = () => {
    localStorage.setItem('ballisticSettings', JSON.stringify(settings));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('ballisticSettings', JSON.stringify(DEFAULT_SETTINGS));
    setSaveStatus('reset');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const sections = [
    { id: 'simulation', label: 'Projectile', icon: Zap },
    { id: 'ballistic', label: 'Ballistic', icon: Rocket },
    { id: 'animation', label: 'Animation', icon: Eye },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Server },
  ];

  return (
    <div className="settings-container">
      {/* Settings Header */}
      <div className="settings-header glass-card">
        <div className="settings-title-section">
          <SettingsIcon size={32} className="settings-icon" />
          <div>
            <h2 className="settings-title">Settings</h2>
            <p className="settings-subtitle">Configure your simulation preferences</p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="settings-btn secondary" onClick={resetToDefaults}>
            <RotateCcw size={16} />
            Reset Defaults
          </button>
          <button className="settings-btn primary" onClick={saveSettings}>
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>

      {/* Save Status Notification */}
      {saveStatus && (
        <div className={`save-notification ${saveStatus}`}>
          {saveStatus === 'saved' && <><Check size={18} /> Settings saved successfully!</>}
          {saveStatus === 'reset' && <><RotateCcw size={18} /> Settings reset to defaults!</>}
          {saveStatus === 'changed' && <><AlertCircle size={18} /> Unsaved changes</>}
        </div>
      )}

      <div className="settings-layout">
        {/* Section Navigation */}
        <nav className="settings-nav glass-card">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={20} />
              {section.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="settings-content glass-card">
          
          {/* Simulation Settings */}
          {activeSection === 'simulation' && (
            <div className="settings-section">
              <h3 className="section-title">
                <Zap size={22} />
                Default Simulation Parameters
              </h3>
              <p className="section-description">
                Set default values for simulation parameters. These will be pre-filled when starting a new simulation.
              </p>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Default Initial Velocity (m/s)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.defaultVelocity}
                    onChange={(e) => updateSetting('defaultVelocity', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="1000"
                  />
                  <span className="setting-hint">Range: 0 - 1000 m/s</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Default Launch Angle (°)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.defaultAngle}
                    onChange={(e) => updateSetting('defaultAngle', parseFloat(e.target.value) || 0)}
                    min="-90"
                    max="90"
                  />
                  <span className="setting-hint">Range: -90° to 90° (negative for downward)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Default Drag Coefficient</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.defaultDrag}
                    onChange={(e) => updateSetting('defaultDrag', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="1"
                    step="0.001"
                  />
                  <span className="setting-hint">Range: 0 - 1 (typical: 0.01)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Default Time Step (s)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.defaultTimeStep}
                    onChange={(e) => updateSetting('defaultTimeStep', parseFloat(e.target.value) || 0.01)}
                    min="0.001"
                    max="0.1"
                    step="0.001"
                  />
                  <span className="setting-hint">Range: 0.001 - 0.1s (smaller = more accurate)</span>
                </div>
              </div>
            </div>
          )}

          {/* Ballistic Missile Settings */}
          {activeSection === 'ballistic' && (
            <div className="settings-section">
              <h3 className="section-title">
                <Rocket size={22} />
                Ballistic Missile Defaults
              </h3>
              <p className="section-description">
                Configure default parameters for ballistic missile simulations. These apply when using Manual Input mode.
              </p>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Default Elevation Angle (°)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.ballisticElevation}
                    onChange={(e) => updateSetting('ballisticElevation', parseFloat(e.target.value) || 75)}
                    min="10"
                    max="90"
                  />
                  <span className="setting-hint">Range: 10° - 90° (ICBM typical: 80-89°)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Default Launch Mass (kg)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.ballisticLaunchMass}
                    onChange={(e) => updateSetting('ballisticLaunchMass', parseFloat(e.target.value) || 6200)}
                    min="1000"
                    max="250000"
                  />
                  <span className="setting-hint">Range: 1,000 - 250,000 kg</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Thrust-to-Weight Ratio</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.ballisticThrustToWeight}
                    onChange={(e) => updateSetting('ballisticThrustToWeight', parseFloat(e.target.value) || 1.5)}
                    min="0.5"
                    max="5"
                    step="0.1"
                  />
                  <span className="setting-hint">Range: 0.5 - 5 (typical: 1.5 - 2.5)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Drag Coefficient</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.ballisticDragCoeff}
                    onChange={(e) => updateSetting('ballisticDragCoeff', parseFloat(e.target.value) || 0.2)}
                    min="0.05"
                    max="1"
                    step="0.01"
                  />
                  <span className="setting-hint">Range: 0.05 - 1 (missiles: 0.1 - 0.3)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Specific Impulse (s)</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.ballisticIsp}
                    onChange={(e) => updateSetting('ballisticIsp', parseFloat(e.target.value) || 237)}
                    min="100"
                    max="500"
                  />
                  <span className="setting-hint">Range: 100 - 500s (solid fuel: 220-280s)</span>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Default Mode</label>
                  <div className="setting-select-group">
                    <button
                      className={`select-btn ${settings.ballisticMode === 'manual' ? 'active' : ''}`}
                      onClick={() => updateSetting('ballisticMode', 'manual')}
                    >
                      Manual
                    </button>
                    <button
                      className={`select-btn ${settings.ballisticMode === 'preset' ? 'active' : ''}`}
                      onClick={() => updateSetting('ballisticMode', 'preset')}
                    >
                      Real Missiles
                    </button>
                  </div>
                  <span className="setting-hint">Choose default mode when opening Ballistic page</span>
                </div>
              </div>
            </div>
          )}

          {/* Animation Settings */}
          {activeSection === 'animation' && (
            <div className="settings-section">
              <h3 className="section-title">
                <Eye size={22} />
                Animation & Visualization
              </h3>
              <p className="section-description">
                Customize how the trajectory animation is displayed.
              </p>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Default Animation Speed</label>
                  <div className="setting-select-group">
                    {ANIMATION_SPEEDS.map(speed => (
                      <button
                        key={speed.value}
                        className={`select-btn ${settings.defaultAnimationSpeed === speed.value ? 'active' : ''}`}
                        onClick={() => updateSetting('defaultAnimationSpeed', speed.value)}
                      >
                        {speed.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting-item full-width">
                  <label className="setting-label">Visualization Options</label>
                  <div className="toggle-group">
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={settings.showTrajectoryPath}
                        onChange={(e) => updateSetting('showTrajectoryPath', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">Show trajectory path preview</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={settings.showGridLines}
                        onChange={(e) => updateSetting('showGridLines', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">Show grid lines</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={settings.showAnnotations}
                        onChange={(e) => updateSetting('showAnnotations', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">Show annotations (max height, range)</span>
                    </label>

                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={settings.autoReplay}
                        onChange={(e) => updateSetting('autoReplay', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">Auto-replay animation on completion</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeSection === 'display' && (
            <div className="settings-section">
              <h3 className="section-title">
                <Palette size={22} />
                Display & Units
              </h3>
              <p className="section-description">
                Configure measurement units and number formatting.
              </p>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">Distance Unit</label>
                  <select
                    className="setting-select"
                    value={settings.distanceUnit}
                    onChange={(e) => updateSetting('distanceUnit', e.target.value)}
                  >
                    {DISTANCE_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Time Unit</label>
                  <select
                    className="setting-select"
                    value={settings.timeUnit}
                    onChange={(e) => updateSetting('timeUnit', e.target.value)}
                  >
                    {TIME_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Decimal Places</label>
                  <input
                    type="number"
                    className="setting-input"
                    value={settings.decimalPlaces}
                    onChange={(e) => updateSetting('decimalPlaces', parseInt(e.target.value) || 2)}
                    min="0"
                    max="6"
                  />
                  <span className="setting-hint">Number of decimal places for displayed values</span>
                </div>
              </div>

              {/* Preview */}
              <div className="preview-box">
                <h4 className="preview-title">Preview</h4>
                <div className="preview-values">
                  <span>Distance: {(1234.5678).toFixed(settings.decimalPlaces)} {settings.distanceUnit === 'meters' ? 'm' : settings.distanceUnit === 'kilometers' ? 'km' : settings.distanceUnit === 'feet' ? 'ft' : 'mi'}</span>
                  <span>Time: {(45.678).toFixed(settings.decimalPlaces)} {settings.timeUnit === 'seconds' ? 's' : 'min'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeSection === 'advanced' && (
            <div className="settings-section">
              <h3 className="section-title">
                <Server size={22} />
                Advanced Configuration
              </h3>
              <p className="section-description">
                Configure API connections and advanced options.
              </p>

              <div className="settings-grid">
                <div className="setting-item full-width">
                  <label className="setting-label">API Server URL</label>
                  <input
                    type="text"
                    className="setting-input"
                    value={settings.apiUrl}
                    onChange={(e) => updateSetting('apiUrl', e.target.value)}
                    placeholder="http://127.0.0.1:8000"
                  />
                  <span className="setting-hint">
                    The URL of the backend API server. Default: http://127.0.0.1:8000
                  </span>
                </div>

                <div className="setting-item full-width">
                  <label className="setting-label">Experimental Features</label>
                  <div className="toggle-group">
                    <label className="toggle-item">
                      <input
                        type="checkbox"
                        checked={settings.soundEffects}
                        onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">Enable sound effects (coming soon)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* API Status */}
              <div className="api-status-box">
                <h4 className="api-status-title">
                  <Globe size={18} />
                  API Connection Status
                </h4>
                <ApiStatusChecker apiUrl={settings.apiUrl} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// API Status Checker Component
function ApiStatusChecker({ apiUrl }) {
  const [status, setStatus] = useState('checking');
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    const checkApi = async () => {
      setStatus('checking');
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus('connected');
          
          // Also fetch model info
          try {
            const modelResponse = await fetch(`${apiUrl}/model/info`);
            if (modelResponse.ok) {
              const modelData = await modelResponse.json();
              setModelInfo(modelData);
            }
          } catch {
            // Model info fetch failed, but API is still up
          }
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('disconnected');
      }
    };

    checkApi();
    const interval = setInterval(checkApi, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="api-status-content">
      <div className={`status-indicator ${status}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {status === 'checking' && 'Checking connection...'}
          {status === 'connected' && 'Connected to API'}
          {status === 'disconnected' && 'API not reachable'}
          {status === 'error' && 'API error'}
        </span>
      </div>
      
      {modelInfo && status === 'connected' && (
        <div className="model-info-grid">
          <div className="model-info-item">
            <span className="info-label">ML Model:</span>
            <span className="info-value">{modelInfo.is_trained ? 'Loaded' : 'Not loaded'}</span>
          </div>
          {modelInfo.model_type && (
            <div className="model-info-item">
              <span className="info-label">Model Type:</span>
              <span className="info-value">{modelInfo.model_type}</span>
            </div>
          )}
          {modelInfo.r2_score !== null && (
            <div className="model-info-item">
              <span className="info-label">R² Score:</span>
              <span className="info-value">{(modelInfo.r2_score * 100).toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
