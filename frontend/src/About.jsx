// About.jsx - Modern Landing Page Design
import React from "react";
import {
  Zap,
  Code,
  Globe,
  Cpu,
  Target,
  Rocket,
  Github,
  Mail,
  Shield,
  Activity,
  Layers,
  Heart,
  Linkedin,
  Server,
  BarChart3,
  Award,
  Home,
  Settings,
  Crosshair,
  TrendingUp,
  Play,
  ChevronRight,
  Sparkles,
  LineChart,
  Database,
  Gauge,
  Box,
  Orbit,
} from "lucide-react";

export default function About({ onNavigate }) {
  const features = [
    { 
      icon: Target, 
      title: "Physics-Based Simulation", 
      desc: "Newtonian mechanics with air resistance, drag coefficients, and gravity modeling for accurate trajectory prediction" 
    },
    { 
      icon: Cpu, 
      title: "Machine Learning Model", 
      desc: "Random Forest algorithm trained on physics data delivers instant predictions with high accuracy" 
    },
    { 
      icon: Globe, 
      title: "3D Globe Visualization", 
      desc: "Interactive Earth view for visualizing long-range ballistic trajectories across continents" 
    },
    { 
      icon: BarChart3, 
      title: "Real-time Analytics", 
      desc: "Track prediction accuracy, compare physics vs ML models, analyze performance metrics" 
    },
    { 
      icon: Rocket, 
      title: "Missile Presets", 
      desc: "Pre-configured real-world missile specifications including ICBMs, SLBMs, and cruise missiles" 
    },
    { 
      icon: Zap, 
      title: "Live Animation", 
      desc: "Watch trajectories animate in real-time with customizable speed and projectile options" 
    },
  ];

  const capabilities = [
    { icon: LineChart, title: "Advanced Trajectory", desc: "Complex ballistic path computation with environmental factors" },
    { icon: Database, title: "Data Persistence", desc: "Save and compare simulation history across sessions" },
    { icon: Gauge, title: "Performance Metrics", desc: "Detailed flight statistics and impact analysis" },
    { icon: Orbit, title: "Multi-body Physics", desc: "Earth rotation and atmospheric density modeling" },
  ];

  const techStack = [
    { name: "React 18", category: "Frontend" },
    { name: "Vite", category: "Build" },
    { name: "FastAPI", category: "Backend" },
    { name: "Python", category: "Backend" },
    { name: "Scikit-learn", category: "ML" },
    { name: "NumPy", category: "Compute" },
    { name: "Recharts", category: "Viz" },
    { name: "Uvicorn", category: "Server" },
  ];

  const handleNavClick = (view) => {
    if (onNavigate) onNavigate(view);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        {/* Animated Projectiles */}
        <div className="hero-projectiles">
          <div className="projectile projectile-1"></div>
          <div className="projectile projectile-2"></div>
          <div className="projectile projectile-3"></div>
          <div className="projectile projectile-4"></div>
          <div className="projectile projectile-5"></div>
        </div>
        <div className="hero-glow-orb"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Physics + Machine Learning</span>
          </div>
          <h1 className="hero-main-title">
            High-Performance Ballistic<br />
            <span className="gradient-text">Trajectory Prediction</span>
          </h1>
          <p className="hero-main-desc">
            Combine advanced physics simulation with machine learning for accurate 
            projectile and missile trajectory analysis, visualization, and prediction.
          </p>
          <div className="hero-cta-buttons">
            <button className="cta-primary" onClick={() => handleNavClick('home')}>
              <Play size={18} />
              Start Simulation
            </button>
            <button className="cta-secondary" onClick={() => handleNavClick('ballistic')}>
              Explore Missiles
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-value">50+</span>
              <span className="stat-label">Missile Presets</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">99%</span>
              <span className="stat-label">ML Accuracy</span>
            </div>
            <div className="hero-stat">
              <span className="stat-value">Real-time</span>
              <span className="stat-label">Visualization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Light Background */}
      <section className="landing-features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title-dark">Physics Meets Machine Learning</h2>
            <p className="section-desc-dark">
              Our system combines rigorous physics simulation with trained ML models 
              to deliver fast, accurate trajectory predictions for any projectile type.
            </p>
          </div>
          <div className="features-grid-landing">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card-landing">
                <div className="feature-icon-landing">
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="landing-tech">
        <div className="tech-container">
          <div className="section-header">
            <span className="section-badge-dark">Technology</span>
            <h2 className="section-title-light">Built With Modern Stack</h2>
          </div>
          <div className="tech-badges-grid">
            {techStack.map((tech, idx) => (
              <div key={idx} className="tech-badge-landing">
                <span className="tech-name">{tech.name}</span>
                <span className="tech-category">{tech.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="landing-capabilities">
        <div className="capabilities-container">
          <div className="capabilities-header">
            <span className="section-badge">Capabilities</span>
            <h2 className="section-title-dark">Simulation In Action</h2>
            <p className="section-desc-dark">
              From basic projectile motion to complex ICBM trajectories, 
              our platform handles it all with precision.
            </p>
          </div>
          <div className="capabilities-grid">
            {capabilities.map((cap, idx) => (
              <div key={idx} className="capability-card">
                <div className="capability-icon">
                  <cap.icon size={28} />
                </div>
                <h4>{cap.title}</h4>
                <p>{cap.desc}</p>
              </div>
            ))}
          </div>
          <div className="capabilities-visual">
            <div className="visual-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="mockup-title">Trajectory Simulation</span>
              </div>
              <div className="mockup-content">
                <div className="trajectory-preview">
                  <svg viewBox="0 0 400 200" className="trajectory-svg">
                    <defs>
                      <linearGradient id="trajGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 20 180 Q 100 20, 200 80 Q 300 140, 380 180" 
                      stroke="url(#trajGrad)" 
                      strokeWidth="3" 
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="180" r="6" fill="#667eea" />
                    <circle cx="380" cy="180" r="6" fill="#a78bfa" />
                    <circle cx="200" cy="80" r="4" fill="#fff" opacity="0.5" />
                  </svg>
                </div>
                <div className="mockup-stats">
                  <div className="mockup-stat">
                    <span className="ms-label">Range</span>
                    <span className="ms-value">2,450 km</span>
                  </div>
                  <div className="mockup-stat">
                    <span className="ms-label">Apogee</span>
                    <span className="ms-value">485 km</span>
                  </div>
                  <div className="mockup-stat">
                    <span className="ms-label">Time</span>
                    <span className="ms-value">12.4 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-container">
          <div className="cta-glow"></div>
          <h2>Get Started For Free</h2>
          <p>Launch your first simulation in seconds. No setup required.</p>
          <div className="cta-buttons">
            <button className="cta-primary-large" onClick={() => handleNavClick('home')}>
              <Rocket size={20} />
              Launch Simulator
            </button>
            <button className="cta-ghost" onClick={() => handleNavClick('analytics')}>
              View Analytics
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <Rocket size={28} />
                <span>Ballistic Studio</span>
              </div>
              <p className="footer-desc">
                Advanced trajectory prediction combining physics simulation 
                and machine learning for accurate ballistic analysis.
              </p>
              <div className="footer-social">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github size={18} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <Linkedin size={18} />
                </a>
                <a href="mailto:contact@example.com">
                  <Mail size={18} />
                </a>
              </div>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <button onClick={() => handleNavClick('home')}>Home</button>
                <button onClick={() => handleNavClick('ballistic')}>Ballistic</button>
                <button onClick={() => handleNavClick('analytics')}>Analytics</button>
                <button onClick={() => handleNavClick('settings')}>Settings</button>
              </div>
              <div className="footer-column">
                <h4>Features</h4>
                <span>Physics Engine</span>
                <span>ML Predictions</span>
                <span>3D Visualization</span>
                <span>Real-time Animation</span>
              </div>
              <div className="footer-column">
                <h4>Technology</h4>
                <span>React + Vite</span>
                <span>FastAPI</span>
                <span>Scikit-learn</span>
                <span>Recharts</span>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Ballistic Studio. All rights reserved.</p>
            <div className="footer-made">
              <span>Made with</span>
              <Heart size={14} className="heart-icon" />
              <span>using React & FastAPI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
