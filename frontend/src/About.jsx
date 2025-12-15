// About.jsx - Enhanced About Page
import React from "react";
import {
  Info,
  Users,
  GraduationCap,
  Zap,
  Code,
  Globe,
  Cpu,
  Target,
  Rocket,
  Github,
  Mail,
  ExternalLink,
} from "lucide-react";

export default function About() {
  const teamMembers = [
    { name: "Shravan Kumar Pandey", id: "300012823045", role: "Team Lead" },
    { name: "Nukesh Verma", id: "300012823030", role: "Backend Developer" },
    { name: "P. Revanth Reddy", id: "300012823034", role: "ML Engineer" },
    { name: "Rohit Rana", id: "300012823039", role: "Frontend Developer" },
  ];

  const features = [
    { icon: Target, title: "Physics Simulation", desc: "Accurate trajectory calculations using Newtonian mechanics with drag coefficient" },
    { icon: Cpu, title: "ML Predictions", desc: "Random Forest model trained on physics simulation data for fast predictions" },
    { icon: Rocket, title: "Animated Visualization", desc: "Real-time 2D trajectory animation with multiple projectile options" },
    { icon: Globe, title: "3D Globe View", desc: "Interactive globe visualization for long-range ballistic trajectories" },
    { icon: Code, title: "RESTful API", desc: "FastAPI backend with comprehensive endpoints for simulation and ML inference" },
    { icon: Zap, title: "Real-time Analytics", desc: "Live performance metrics and accuracy comparisons between physics and ML" },
  ];

  const techStack = [
    { category: "Frontend", items: ["React 18", "Vite", "Recharts", "Lucide Icons", "CSS3"] },
    { category: "Backend", items: ["FastAPI", "Python 3.10+", "Uvicorn", "Pydantic"] },
    { category: "ML/Data", items: ["Scikit-learn", "NumPy", "Joblib", "Random Forest"] },
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="about-hero glass-card">
        <div className="hero-icon-wrapper">
          <Rocket size={64} className="hero-icon" />
        </div>
        <h1 className="hero-title">Ballistic Trajectory Prediction System</h1>
        <p className="hero-subtitle">
          A comprehensive web-based system combining physics simulation and machine learning
          for accurate ballistic trajectory prediction and visualization.
        </p>
        <div className="hero-badges">
          <span className="badge">🎯 Physics Engine</span>
          <span className="badge">🤖 Machine Learning</span>
          <span className="badge">📊 Real-time Analytics</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="about-section">
        <h2 className="section-heading">
          <Zap size={24} />
          Key Features
        </h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-icon-wrapper">
                <feature.icon size={28} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="about-section">
        <h2 className="section-heading">
          <Users size={24} />
          Team Members
        </h2>
        <div className="team-grid">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="team-card glass-card">
              <div className="team-avatar">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="team-name">{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-id">{member.id}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details */}
      <div className="about-section">
        <h2 className="section-heading">
          <GraduationCap size={24} />
          Project Details
        </h2>
        <div className="details-grid">
          <div className="detail-card glass-card">
            <h3 className="detail-title">🏛️ Institution</h3>
            <p className="detail-value">CSVTU, Bhilai</p>
            <p className="detail-sub">Chhattisgarh Swami Vivekanand Technical University</p>
          </div>
          <div className="detail-card glass-card">
            <h3 className="detail-title">📚 Department</h3>
            <p className="detail-value">Computer Science & Engineering</p>
            <p className="detail-sub">Data Science Specialization</p>
          </div>
          <div className="detail-card glass-card">
            <h3 className="detail-title">🎓 Course</h3>
            <p className="detail-value">B.Tech (Hons.) CSE(DS)</p>
            <p className="detail-sub">5th Semester</p>
          </div>
          <div className="detail-card glass-card">
            <h3 className="detail-title">👨‍🏫 Project Guide</h3>
            <p className="detail-value">Mr. Rishabh Shukla</p>
            <p className="detail-sub">Session: 2025-26</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="about-section">
        <h2 className="section-heading">
          <Code size={24} />
          Technology Stack
        </h2>
        <div className="tech-stack-grid">
          {techStack.map((stack, idx) => (
            <div key={idx} className="tech-card glass-card">
              <h3 className="tech-category">{stack.category}</h3>
              <div className="tech-items">
                {stack.items.map((item, i) => (
                  <span key={i} className="tech-badge">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="about-footer glass-card">
        <p>© 2025 Ballistic Studio | Built with ❤️ by CSVTU Students</p>
        <div className="footer-links">
          <a href="#" className="footer-link">
            <Github size={18} />
            Source Code
          </a>
          <a href="#" className="footer-link">
            <Mail size={18} />
            Contact
          </a>
          <a href="#" className="footer-link">
            <ExternalLink size={18} />
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
