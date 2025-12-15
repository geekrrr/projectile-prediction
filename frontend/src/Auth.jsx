// Auth.jsx - Professional Authentication with Animated Background
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Lock,
  Mail,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Play,
  TrendingUp,
  Brain,
} from "lucide-react";

// Simple hash function for password (NOT for production - use proper hashing)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Animated Background Component with Projectiles
function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let projectiles = [];
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Projectile class
    class Projectile {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width * 0.3;
        this.y = canvas.height + 20;
        this.vx = 2 + Math.random() * 3;
        this.vy = -(4 + Math.random() * 4);
        this.gravity = 0.03 + Math.random() * 0.02;
        this.size = 8 + Math.random() * 8;
        this.opacity = 0.4 + Math.random() * 0.4;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.trail = [];
        this.type = Math.floor(Math.random() * 3); // 0: rocket, 1: star, 2: circle
        this.hue = 260 + Math.random() * 60; // Purple to pink range
      }

      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Store trail positions
        this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
        if (this.trail.length > 20) this.trail.shift();

        // Reset if off screen
        if (this.y > canvas.height + 50 || this.x > canvas.width + 50) {
          this.reset();
        }
      }

      draw() {
        // Draw trail
        this.trail.forEach((point, i) => {
          const trailOpacity = (i / this.trail.length) * point.opacity * 0.5;
          ctx.beginPath();
          ctx.arc(point.x, point.y, this.size * 0.3 * (i / this.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${trailOpacity})`;
          ctx.fill();
        });

        // Draw projectile
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 0) {
          // Rocket shape
          ctx.beginPath();
          ctx.moveTo(0, -this.size);
          ctx.lineTo(-this.size * 0.5, this.size * 0.5);
          ctx.lineTo(this.size * 0.5, this.size * 0.5);
          ctx.closePath();
          ctx.fillStyle = `hsla(${this.hue}, 70%, 65%, ${this.opacity})`;
          ctx.fill();
        } else if (this.type === 1) {
          // Star shape
          this.drawStar(0, 0, 5, this.size, this.size * 0.5);
          ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
          ctx.fill();
        } else {
          // Glowing circle
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
          gradient.addColorStop(0, `hsla(${this.hue}, 80%, 80%, ${this.opacity})`);
          gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.restore();
      }

      drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
          rot += step;
          ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
      }
    }

    // Floating particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 1 + Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.2 + Math.random() * 0.4;
        this.pulse = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.02;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        const pulseOpacity = this.opacity * (0.5 + Math.sin(this.pulse) * 0.5);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
        ctx.fill();
      }
    }

    // Initialize
    for (let i = 0; i < 8; i++) {
      const p = new Projectile();
      p.y = Math.random() * canvas.height;
      p.x = Math.random() * canvas.width;
      projectiles.push(p);
    }

    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      projectiles.forEach(p => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="auth-bg-canvas" />;
}

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem("ballisticSession");
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData && userData.username) {
          onLogin(userData);
        }
      } catch (e) {
        localStorage.removeItem("ballisticSession");
      }
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!isLogin && !email.trim()) {
      setError("Please enter your email");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      setLoading(false);
      return;
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = JSON.parse(localStorage.getItem("ballisticUsers") || "{}");
    const hashedPassword = simpleHash(password);

    if (isLogin) {
      // Login
      const user = users[username.toLowerCase()];
      if (!user) {
        setError("User not found. Please register first.");
        setLoading(false);
        return;
      }
      if (user.password !== hashedPassword) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }

      // Successful login
      const userData = {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: new Date().toISOString(),
      };
      localStorage.setItem("ballisticSession", JSON.stringify(userData));
      
      // Load user's simulation history
      const userHistory = JSON.parse(localStorage.getItem(`ballisticHistory_${username.toLowerCase()}`) || "[]");
      
      setSuccess("Login successful!");
      setTimeout(() => onLogin({ ...userData, history: userHistory }), 500);
    } else {
      // Register
      if (users[username.toLowerCase()]) {
        setError("Username already exists");
        setLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        username: username.trim(),
        email: email.trim(),
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };
      users[username.toLowerCase()] = newUser;
      localStorage.setItem("ballisticUsers", JSON.stringify(users));

      setSuccess("Account created! You can now log in.");
      setIsLogin(true);
      setPassword("");
    }

    setLoading(false);
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError("");
    setSuccess("");
  };

  return (
    <div className="auth-page">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Gradient Overlay */}
      <div className="auth-gradient-overlay" />

      <div className="auth-container">
        {/* Left Side - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-brand-icon">
              <Target size={48} />
            </div>
            <h1 className="auth-brand-title">Ballistic Studio</h1>
            <p className="auth-brand-desc">
              Advanced trajectory simulation platform powered by physics and machine learning
            </p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <Play size={24} />
                </div>
                <div className="auth-feature-text">
                  <strong>Real-time Simulation</strong>
                  <span>Watch trajectories animate in real-time</span>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <Brain size={24} />
                </div>
                <div className="auth-feature-text">
                  <strong>ML Predictions</strong>
                  <span>Compare physics with AI models</span>
                </div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="auth-feature-text">
                  <strong>Analytics Dashboard</strong>
                  <span>Detailed insights and data export</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-section">
          <div className="auth-card">
            {/* Tabs */}
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => switchMode(true)}
              >
                <LogIn size={18} />
                Sign In
              </button>
              <button 
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => switchMode(false)}
              >
                <UserPlus size={18} />
                Register
              </button>
            </div>

            {/* Header */}
            <div className="auth-form-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Enter your credentials to access your account' : 'Join us and start simulating trajectories'}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Username */}
              <div className={`auth-field ${focusedField === 'username' ? 'focused' : ''}`}>
                <label>Username</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email (Register only) */}
              {!isLogin && (
                <div className={`auth-field ${focusedField === 'email' ? 'focused' : ''}`}>
                  <label>Email</label>
                  <div className="auth-input-wrapper">
                    <Mail size={18} className="auth-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className={`auth-field ${focusedField === 'password' ? 'focused' : ''}`}>
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="auth-message error">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="auth-message success">
                  <CheckCircle size={18} />
                  <span>{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              <div className="auth-divider">
                <span>Demo Mode</span>
              </div>
              <p className="auth-hint">
                <Sparkles size={14} />
                Try with any username and password (min 4 characters)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User profile dropdown component
export function UserProfile({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = () => {
    localStorage.removeItem("ballisticSession");
    setShowMenu(false);
    onLogout();
  };

  return (
    <div className="user-profile" ref={menuRef}>
      <button 
        className="user-profile-btn"
        onClick={() => setShowMenu(!showMenu)}
        title={user.username}
      >
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
      </button>

      {showMenu && (
        <div className="user-menu">
          <div className="user-menu-header">
            <div className="user-avatar-large">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-menu-name">{user.username}</span>
              <span className="user-menu-email">{user.email}</span>
            </div>
          </div>
          <div className="user-menu-divider"></div>
          <button className="user-menu-item" onClick={handleLogout}>
            <LogIn size={16} style={{ transform: 'rotate(180deg)' }} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
