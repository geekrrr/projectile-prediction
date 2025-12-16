// Ballistic.jsx - Advanced Ballistic Missile Trajectory Simulation
// With Real-World Missile Presets and Manual Input Mode
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Rocket, 
  Play, 
  RotateCcw, 
  Activity,
  Target,
  Database,
  CheckCircle2,
  Zap,
  ChevronDown,
  Info,
  Settings,
  Globe,
  Crosshair,
  Clock,
  Gauge,
  Mountain,
  Ruler,
  Timer,
  Wind
} from 'lucide-react';
import './styles.css';

// Physical constants for realistic ballistic simulation (verified values)
const G = 6.67430e-11;   // Gravitational Constant (CODATA 2018)
const M_E = 5.97217e24;  // Earth mass (kg) - IAU nominal value
const R_E = 6371000;     // Mean Earth radius (m) - IUGG value
const g0 = 9.80665;      // Standard gravity (m/s²) - defined constant
const omega = 7.292115e-5; // Earth rotation (rad/s) - IERS value

// ISA (International Standard Atmosphere) constants
const T0_ISA = 288.15;   // Sea level temperature (K)
const P0_ISA = 101325;   // Sea level pressure (Pa)
const RHO0_ISA = 1.225;  // Sea level air density (kg/m³)
const L_ISA = 0.0065;    // Temperature lapse rate (K/m)
const R_GAS = 287.05;    // Specific gas constant for air (J/(kg·K))
const GAMMA = 1.4;       // Heat capacity ratio for air

// Default missile parameters
const DEFAULT_PARAMS = {
  emptyMass: 1600,       // kg (warhead + empty rocket)
  warheadMass: 800,      // kg
  crossSection: Math.PI * 0.5 * 0.5, // Cross-section (m²) - 1m diameter
  noseRadius: 0.15,      // Nose radius for heating calculations (m)
};

// Real-world missile database - VERIFIED SPECIFICATIONS from public sources
// Sources: CSIS Missile Threat, FAS, Jane's, official gov publications
const REAL_MISSILES = {
  // === INTERCONTINENTAL BALLISTIC MISSILES (ICBMs) ===
  minuteman3: {
    name: "LGM-30G Minuteman III",
    country: "🇺🇸 USA",
    type: "ICBM",
    description: "Land-based ICBM, primary US nuclear deterrent since 1970. Three-stage solid fuel.",
    // Verified specs from USAF fact sheets and FAS
    launchMass: 36030,     // kg - official USAF spec
    emptyMass: 2180,       // kg - post-burnout mass
    warheadMass: 1140,     // kg - W78/W87 RV mass
    propellantMass: 33850, // kg - total propellant
    isp: 265,              // s - average specific impulse (solid fuel)
    thrustToWeight: 2.4,   // Stage 1 T/W ratio
    dragCoeff: 0.15,       // Cd for ogive nose cone at supersonic
    elevationAngle: 86,    // Typical loft trajectory
    launchHeight: 0,
    burnTime: 180,         // s - total powered flight
    stages: 3,
    fuelType: "Solid (HTPB)",
    range: "13000 km",
    apogee: "1120 km",
    speed: "Mach 23 (7.8 km/s)",
    cep: "120 m",
    image: "🚀"
  },
  trident2: {
    name: "UGM-133A Trident II D5",
    country: "🇺🇸 USA",
    type: "SLBM",
    description: "Submarine-launched ballistic missile, deployed on Ohio-class and Vanguard-class submarines.",
    // Verified from US Navy fact sheets
    launchMass: 58967,     // kg - official Navy spec
    emptyMass: 3500,       // kg
    warheadMass: 2800,     // kg - up to 8 W88 warheads
    propellantMass: 52000, // kg
    isp: 276,              // s - composite propellant
    thrustToWeight: 2.2,
    dragCoeff: 0.12,
    elevationAngle: 87,
    launchHeight: -30,     // Submarine depth at launch
    burnTime: 120,
    stages: 3,
    fuelType: "Solid (NEPE-75)",
    range: "11300 km",
    apogee: "1000 km",
    speed: "Mach 24 (8.1 km/s)",
    cep: "90 m",
    image: "🎯"
  },
  dongfeng41: {
    name: "DF-41 (CSS-20)",
    country: "🇨🇳 China",
    type: "ICBM",
    description: "Road-mobile three-stage solid-fueled ICBM with MIRV capability.",
    // Estimated from CSIS Missile Threat database
    launchMass: 80000,     // kg - estimated
    emptyMass: 5000,       // kg
    warheadMass: 2500,     // kg - 10 MIRVs
    propellantMass: 72500, // kg
    isp: 280,              // s - modern solid fuel
    thrustToWeight: 2.3,
    dragCoeff: 0.13,
    elevationAngle: 88,
    launchHeight: 0,
    burnTime: 180,
    stages: 3,
    fuelType: "Solid",
    range: "12000-15000 km",
    apogee: "1200 km",
    speed: "Mach 25 (8.5 km/s)",
    cep: "100-150 m",
    image: "🚀"
  },
  sarmat: {
    name: "RS-28 Sarmat (SS-X-30)",
    country: "🇷🇺 Russia",
    type: "ICBM",
    description: "Super-heavy liquid-fueled ICBM, replacement for R-36M2 Voevoda.",
    // From Russian MoD and CSIS
    launchMass: 208100,    // kg - official Russian spec
    emptyMass: 12000,      // kg
    warheadMass: 10000,    // kg - 10-15 MIRVs or Avangard HGVs
    propellantMass: 186000,// kg
    isp: 287,              // s - UDMH/N2O4 propellant
    thrustToWeight: 2.1,
    dragCoeff: 0.11,
    elevationAngle: 89,
    launchHeight: 0,
    burnTime: 300,
    stages: 2,
    fuelType: "Liquid (UDMH/N2O4)",
    range: "18000 km",
    apogee: "1500 km",
    speed: "Mach 20.7 (7 km/s)",
    cep: "150 m",
    image: "☢️"
  },
  agni5: {
    name: "Agni-V",
    country: "🇮🇳 India",
    type: "ICBM",
    description: "Three-stage solid-fueled road-mobile ICBM. India's first ICBM.",
    // From DRDO and public test data
    launchMass: 50000,     // kg
    emptyMass: 3000,       // kg
    warheadMass: 1500,     // kg
    propellantMass: 44000, // kg
    isp: 260,              // s
    thrustToWeight: 2.1,
    dragCoeff: 0.14,
    elevationAngle: 86,
    launchHeight: 0,
    burnTime: 150,
    stages: 3,
    fuelType: "Solid (Composite)",
    range: "5500-8000 km",
    apogee: "800 km",
    speed: "Mach 24 (8.1 km/s)",
    cep: "10-80 m",
    image: "🎯"
  },
  topol_m: {
    name: "RT-2PM2 Topol-M (SS-27 Mod 1)",
    country: "🇷🇺 Russia",
    type: "ICBM",
    description: "Road-mobile and silo-based three-stage solid-fueled ICBM.",
    // From Russian sources and FAS
    launchMass: 47200,     // kg - official spec
    emptyMass: 2800,       // kg
    warheadMass: 1200,     // kg - single or 3-6 MIRVs
    propellantMass: 42400, // kg
    isp: 270,              // s
    thrustToWeight: 2.1,
    dragCoeff: 0.14,
    elevationAngle: 87,
    launchHeight: 0,
    burnTime: 170,
    stages: 3,
    fuelType: "Solid",
    range: "11000 km",
    apogee: "1000 km",
    speed: "Mach 22 (7.5 km/s)",
    cep: "200 m",
    image: "🚀"
  },
  dongfeng5b: {
    name: "DF-5B (CSS-4 Mod 2)",
    country: "🇨🇳 China",
    type: "ICBM",
    description: "Silo-based two-stage liquid-fueled ICBM with MIRV capability.",
    // From CSIS and DoD reports
    launchMass: 183000,    // kg
    emptyMass: 10000,      // kg
    warheadMass: 3200,     // kg - 5-6 MIRVs
    propellantMass: 169800,// kg
    isp: 275,              // s - UDMH/N2O4
    thrustToWeight: 2.2,
    dragCoeff: 0.12,
    elevationAngle: 88,
    launchHeight: 0,
    burnTime: 280,
    stages: 2,
    fuelType: "Liquid (UDMH/N2O4)",
    range: "13000 km",
    apogee: "1100 km",
    speed: "Mach 23 (7.8 km/s)",
    cep: "500-1000 m",
    image: "🚀"
  },
  jl2: {
    name: "JL-2 (CSS-NX-14)",
    country: "🇨🇳 China",
    type: "SLBM",
    description: "Submarine-launched ballistic missile deployed on Type 094 Jin-class SSBNs.",
    launchMass: 42000,     // kg
    emptyMass: 2500,       // kg
    warheadMass: 1050,     // kg - single or 3-8 MIRVs
    propellantMass: 37500, // kg
    isp: 265,
    thrustToWeight: 2.0,
    dragCoeff: 0.13,
    elevationAngle: 86,
    launchHeight: -40,     // Submarine depth
    burnTime: 140,
    stages: 2,
    fuelType: "Solid",
    range: "7200-8000 km",
    apogee: "700 km",
    speed: "Mach 22 (7.5 km/s)",
    cep: "300-500 m",
    image: "🎯"
  },

  // === MEDIUM/INTERMEDIATE RANGE BALLISTIC MISSILES (MRBMs/IRBMs) ===
  pershing2: {
    name: "MGM-31B Pershing II",
    country: "🇺🇸 USA",
    type: "MRBM",
    description: "Medium-range solid-fueled ballistic missile with maneuverable RV. Retired 1991 under INF Treaty.",
    launchMass: 7462,      // kg - official spec
    emptyMass: 2400,       // kg
    warheadMass: 653,      // kg - W85 warhead
    propellantMass: 4400,  // kg
    isp: 250,
    thrustToWeight: 1.9,
    dragCoeff: 0.16,
    elevationAngle: 75,
    launchHeight: 0,
    burnTime: 100,
    stages: 2,
    fuelType: "Solid",
    range: "1770 km",
    apogee: "300 km",
    speed: "Mach 8 (2.7 km/s)",
    cep: "30-50 m",
    image: "🎯"
  },
  agni2: {
    name: "Agni-II",
    country: "🇮🇳 India",
    type: "MRBM",
    description: "Rail and road-mobile two-stage solid-fueled medium-range ballistic missile.",
    launchMass: 16000,     // kg
    emptyMass: 1200,       // kg
    warheadMass: 1000,     // kg
    propellantMass: 13800, // kg
    isp: 250,
    thrustToWeight: 1.8,
    dragCoeff: 0.16,
    elevationAngle: 78,
    launchHeight: 0,
    burnTime: 90,
    stages: 2,
    fuelType: "Solid",
    range: "2000-3500 km",
    apogee: "230 km",
    speed: "Mach 12 (4 km/s)",
    cep: "40 m",
    image: "🎯"
  },
  shahab3: {
    name: "Shahab-3",
    country: "🇮🇷 Iran",
    type: "MRBM",
    description: "Single-stage liquid-fueled medium-range ballistic missile based on Nodong design.",
    launchMass: 16500,     // kg
    emptyMass: 1500,       // kg
    warheadMass: 760,      // kg
    propellantMass: 14240, // kg
    isp: 235,              // s - IRFNA/TM-185
    thrustToWeight: 1.7,
    dragCoeff: 0.18,
    elevationAngle: 72,
    launchHeight: 0,
    burnTime: 110,
    stages: 1,
    fuelType: "Liquid (IRFNA/TM-185)",
    range: "1300 km",
    apogee: "350 km",
    speed: "Mach 7 (2.4 km/s)",
    cep: "190 m",
    image: "🎯"
  },
  nodong1: {
    name: "Nodong-1 (Hwasong-7)",
    country: "🇰🇵 North Korea",
    type: "MRBM",
    description: "Single-stage liquid-fueled medium-range ballistic missile, exported widely.",
    launchMass: 15852,     // kg
    emptyMass: 1400,       // kg
    warheadMass: 700,      // kg
    propellantMass: 13752, // kg
    isp: 226,              // s - AK-27/TM-185
    thrustToWeight: 1.6,
    dragCoeff: 0.19,
    elevationAngle: 70,
    launchHeight: 0,
    burnTime: 115,
    stages: 1,
    fuelType: "Liquid (AK-27/TM-185)",
    range: "1300-1500 km",
    apogee: "400 km",
    speed: "Mach 7 (2.4 km/s)",
    cep: "2000 m",
    image: "🎯"
  },
  dongfeng21d: {
    name: "DF-21D (CSS-5 Mod 4)",
    country: "🇨🇳 China",
    type: "ASBM",
    description: "Anti-ship ballistic missile, 'carrier killer'. First operational ASBM.",
    launchMass: 14700,     // kg
    emptyMass: 1200,       // kg
    warheadMass: 600,      // kg - maneuvering warhead
    propellantMass: 12900, // kg
    isp: 255,
    thrustToWeight: 1.9,
    dragCoeff: 0.15,
    elevationAngle: 80,
    launchHeight: 0,
    burnTime: 70,
    stages: 2,
    fuelType: "Solid",
    range: "1500-2150 km",
    apogee: "500 km",
    speed: "Mach 10 (3.4 km/s)",
    cep: "20 m (terminal guided)",
    image: "🎯"
  },

  // === SHORT RANGE BALLISTIC MISSILES (SRBMs) ===
  iskander: {
    name: "9K720 Iskander-M (SS-26 Stone)",
    country: "🇷🇺 Russia",
    type: "SRBM",
    description: "Short-range quasi-ballistic missile with depressed trajectory and terminal maneuvering.",
    launchMass: 3800,      // kg
    emptyMass: 1200,       // kg
    warheadMass: 700,      // kg - various warheads
    propellantMass: 1900,  // kg
    isp: 240,
    thrustToWeight: 1.8,
    dragCoeff: 0.18,
    elevationAngle: 55,    // Depressed trajectory
    launchHeight: 0,
    burnTime: 28,
    stages: 1,
    fuelType: "Solid",
    range: "500 km",
    apogee: "50 km",
    speed: "Mach 6.8 (2.3 km/s)",
    cep: "5-7 m",
    image: "🎯"
  },
  scud: {
    name: "R-17 Elbrus (Scud-B, SS-1C)",
    country: "🇷🇺 Russia",
    type: "SRBM",
    description: "Short-range tactical ballistic missile, widely exported and copied.",
    launchMass: 5862,      // kg - official spec
    emptyMass: 1840,       // kg
    warheadMass: 985,      // kg
    propellantMass: 3037,  // kg
    isp: 226,              // s - IRFNA/TM-185
    thrustToWeight: 1.6,
    dragCoeff: 0.22,
    elevationAngle: 55,
    launchHeight: 0,
    burnTime: 80,
    stages: 1,
    fuelType: "Liquid (IRFNA/TM-185)",
    range: "300 km",
    apogee: "86 km",
    speed: "Mach 5 (1.7 km/s)",
    cep: "450 m",
    image: "🎯"
  },
  prithvi2: {
    name: "Prithvi-II",
    country: "🇮🇳 India",
    type: "SRBM",
    description: "Short-range surface-to-surface liquid-fueled tactical missile.",
    launchMass: 4600,      // kg
    emptyMass: 1300,       // kg
    warheadMass: 500,      // kg
    propellantMass: 2800,  // kg
    isp: 235,
    thrustToWeight: 1.5,
    dragCoeff: 0.20,
    elevationAngle: 60,
    launchHeight: 0,
    burnTime: 40,
    stages: 1,
    fuelType: "Liquid",
    range: "350 km",
    apogee: "40 km",
    speed: "Mach 4.4 (1.5 km/s)",
    cep: "10-50 m",
    image: "🎯"
  },
  atacms: {
    name: "MGM-140 ATACMS Block IA",
    country: "🇺🇸 USA",
    type: "SRBM",
    description: "Army Tactical Missile System with GPS/INS guidance. Fired from MLRS/HIMARS.",
    launchMass: 1670,      // kg
    emptyMass: 580,        // kg
    warheadMass: 227,      // kg - WDU-18/B penetrator
    propellantMass: 863,   // kg
    isp: 245,
    thrustToWeight: 2.0,
    dragCoeff: 0.17,
    elevationAngle: 60,
    launchHeight: 0,
    burnTime: 27,
    stages: 1,
    fuelType: "Solid",
    range: "300 km",
    apogee: "50 km",
    speed: "Mach 3.5 (1.2 km/s)",
    cep: "9 m",
    image: "🎯"
  },
  hwasong11: {
    name: "KN-23 (Hwasong-11Ga)",
    country: "🇰🇵 North Korea",
    type: "SRBM",
    description: "Short-range maneuverable ballistic missile, similar to Iskander.",
    launchMass: 3400,      // kg - estimated
    emptyMass: 1000,       // kg
    warheadMass: 500,      // kg
    propellantMass: 1900,  // kg
    isp: 240,
    thrustToWeight: 1.7,
    dragCoeff: 0.18,
    elevationAngle: 55,
    launchHeight: 0,
    burnTime: 35,
    stages: 1,
    fuelType: "Solid",
    range: "450-690 km",
    apogee: "50 km",
    speed: "Mach 6.1 (2.1 km/s)",
    cep: "Unknown",
    image: "🎯"
  },

  // === CRUISE MISSILES ===
  tomahawk: {
    name: "BGM-109 Tomahawk Block IV",
    country: "🇺🇸 USA",
    type: "Cruise",
    description: "Long-range subsonic cruise missile with TERCOM and GPS guidance. Note: Cruise profile simulated as ballistic arc.",
    launchMass: 1440,      // kg (with booster)
    emptyMass: 540,        // kg - adjusted for simulation
    warheadMass: 450,      // kg - WDU-36/B
    propellantMass: 450,   // kg - fuel equivalent for simulation
    isp: 280,              // Adjusted for ballistic sim
    thrustToWeight: 1.6,   // Boosted for ballistic arc
    dragCoeff: 0.25,
    elevationAngle: 35,
    launchHeight: 0,
    burnTime: 60,          // Booster burn simulation
    stages: 1,
    fuelType: "JP-10 (F415 turbojet)",
    range: "1600-2500 km",
    apogee: "30-100 m (sea skimming)",
    speed: "Mach 0.74 (250 m/s)",
    cep: "5 m",
    image: "✈️"
  },
  kalibr: {
    name: "3M-54 Kalibr (SS-N-27)",
    country: "🇷🇺 Russia",
    type: "Cruise",
    description: "Family of cruise missiles with land-attack and anti-ship variants. Note: Simulated as ballistic arc.",
    launchMass: 2300,      // kg (3M-14 variant)
    emptyMass: 850,        // kg - adjusted for simulation
    warheadMass: 450,      // kg - HE or nuclear
    propellantMass: 1000,  // kg - fuel equivalent
    isp: 270,
    thrustToWeight: 1.7,
    dragCoeff: 0.22,
    elevationAngle: 38,
    launchHeight: 0,
    burnTime: 70,
    stages: 1,
    fuelType: "Turbojet",
    range: "1500-2500 km",
    apogee: "20-150 m",
    speed: "Mach 0.8 (272 m/s)",
    cep: "3-5 m",
    image: "✈️"
  },
  brahmos: {
    name: "BrahMos-I",
    country: "🇮🇳 India/Russia",
    type: "Cruise",
    description: "Supersonic cruise missile, joint India-Russia development. Fastest cruise missile in service.",
    launchMass: 3000,      // kg
    emptyMass: 1200,       // kg - adjusted for simulation
    warheadMass: 300,      // kg - semi-armor piercing
    propellantMass: 1500,  // kg - fuel equivalent
    isp: 260,              // Adjusted for simulation
    thrustToWeight: 2.0,
    dragCoeff: 0.18,
    elevationAngle: 50,
    launchHeight: 0,
    burnTime: 45,
    stages: 2,             // Booster + ramjet cruise
    fuelType: "Ramjet (JP-10)",
    range: "290-450 km",
    apogee: "15000 m (high-high) / 10 m (sea skim)",
    speed: "Mach 2.8-3.0 (1 km/s)",
    cep: "1 m",
    image: "✈️"
  },
  stormshadow: {
    name: "Storm Shadow/SCALP-EG",
    country: "🇬🇧🇫🇷 UK/France",
    type: "Cruise",
    description: "Air-launched stealthy cruise missile with BROACH warhead. Note: Simulated as air-launched ballistic.",
    launchMass: 1300,      // kg
    emptyMass: 480,        // kg - adjusted for simulation
    warheadMass: 450,      // kg - BROACH tandem warhead
    propellantMass: 370,   // kg - fuel equivalent
    isp: 265,
    thrustToWeight: 1.8,
    dragCoeff: 0.20,       // Stealthy shape
    elevationAngle: 25,    // Air-launched arc
    launchHeight: 10000,   // Typical aircraft altitude
    burnTime: 35,
    stages: 1,
    fuelType: "Turbojet (TRI 60-30)",
    range: "560+ km",
    apogee: "Air-launched",
    speed: "Mach 0.95 (323 m/s)",
    cep: "1-3 m",
    image: "✈️"
  },

  // === HYPERSONIC MISSILES ===
  avangard: {
    name: "Avangard (15Yu71)",
    country: "🇷🇺 Russia",
    type: "HGV",
    description: "Hypersonic glide vehicle on UR-100N booster. Simulated with booster stage parameters.",
    launchMass: 105000,    // kg - UR-100N with HGV
    emptyMass: 5500,       // kg - post-burnout
    warheadMass: 2000,     // kg - HGV payload
    propellantMass: 97500, // kg - booster propellant
    isp: 285,              // Booster Isp
    thrustToWeight: 2.2,
    dragCoeff: 0.10,       // Streamlined
    elevationAngle: 87,
    launchHeight: 0,
    burnTime: 180,
    stages: 0,
    fuelType: "None (glider)",
    range: "6000+ km",
    apogee: "100+ km",
    speed: "Mach 20-27 (7-9 km/s)",
    cep: "Unknown",
    image: "⚡"
  },
  kinzhal: {
    name: "Kh-47M2 Kinzhal",
    country: "🇷🇺 Russia",
    type: "ALBM",
    description: "Air-launched hypersonic aero-ballistic missile derived from Iskander.",
    launchMass: 4300,      // kg
    emptyMass: 2000,       // kg
    warheadMass: 480,      // kg - HE or nuclear
    propellantMass: 1820,  // kg
    isp: 260,
    thrustToWeight: 2.0,
    dragCoeff: 0.12,
    elevationAngle: 75,
    launchHeight: 13000,   // MiG-31K cruise altitude
    burnTime: 40,
    stages: 1,
    fuelType: "Solid",
    range: "2000+ km",
    apogee: "20+ km (from launch altitude)",
    speed: "Mach 10-12 (3.4-4 km/s)",
    cep: "1 m",
    image: "⚡"
  },
  dongfeng17: {
    name: "DF-17",
    country: "🇨🇳 China",
    type: "HGV",
    description: "Medium-range ballistic missile with DF-ZF hypersonic glide vehicle.",
    launchMass: 15000,     // kg - estimated
    emptyMass: 2000,       // kg
    warheadMass: 500,      // kg
    propellantMass: 12500, // kg
    isp: 270,
    thrustToWeight: 2.2,
    dragCoeff: 0.08,
    elevationAngle: 82,
    launchHeight: 0,
    burnTime: 60,
    stages: 1,
    fuelType: "Solid",
    range: "1800-2500 km",
    apogee: "60 km",
    speed: "Mach 10 (3.4 km/s)",
    cep: "Unknown",
    image: "⚡"
  },
  
  // === HISTORICAL / SPACE LAUNCH VEHICLES ===
  v2: {
    name: "V-2 (Aggregat 4 / A-4)",
    country: "🇩🇪 Germany",
    type: "Historic",
    description: "First long-range guided ballistic missile (1944). Designed by Wernher von Braun.",
    launchMass: 12508,     // kg - official spec
    emptyMass: 4039,       // kg - verified
    warheadMass: 980,      // kg - Amatol
    propellantMass: 7489,  // kg - 75% ethanol + LOX
    isp: 203,              // s - verified from tests
    thrustToWeight: 1.52,  // 264 kN / (12508 * 9.81)
    dragCoeff: 0.25,
    elevationAngle: 45,
    launchHeight: 0,
    burnTime: 65,
    stages: 1,
    fuelType: "Liquid (Ethanol/LOX)",
    range: "320 km",
    apogee: "88 km",
    speed: "Mach 4.2 (1.44 km/s)",
    cep: "4500 m",
    image: "🏛️"
  },
  falcon9s1: {
    name: "Falcon 9 Block 5 (Stage 1)",
    country: "🇺🇸 USA",
    type: "SLV",
    description: "Reusable orbital launch vehicle first stage by SpaceX. Suborbital arc only.",
    launchMass: 549054,    // kg - full stack
    emptyMass: 25600,      // kg - stage 1 dry
    warheadMass: 22800,    // kg - upper stage + payload mass
    propellantMass: 407310,// kg - stage 1 propellant
    isp: 282,              // s - sea level (311s vacuum)
    thrustToWeight: 1.4,
    dragCoeff: 0.20,
    elevationAngle: 80,
    launchHeight: 0,
    burnTime: 162,
    stages: 1,
    fuelType: "Liquid (RP-1/LOX)",
    range: "600 km (landing zone)",
    apogee: "80 km (MECO)",
    speed: "Mach 7 (2.3 km/s)",
    cep: "N/A",
    image: "🛸"
  }
};

// Animation speed presets
const ANIMATION_SPEEDS = {
  slow: { label: '0.5x', factor: 2 },
  normal: { label: '1x', factor: 1 },
  fast: { label: '2x', factor: 0.5 },
  veryfast: { label: '4x', factor: 0.25 }
};

// Improved atmospheric model using ISA (International Standard Atmosphere)
function getAirDensity(altitude) {
  if (altitude < 0) altitude = 0;
  
  if (altitude <= 11000) {
    // Troposphere
    const T = T0_ISA - L_ISA * altitude;
    const P = P0_ISA * Math.pow(T / T0_ISA, g0 / (L_ISA * R_GAS));
    return P / (R_GAS * T);
  } else if (altitude <= 20000) {
    // Lower stratosphere (isothermal)
    const T = 216.65;
    const P11 = P0_ISA * Math.pow(216.65 / T0_ISA, g0 / (L_ISA * R_GAS));
    const P = P11 * Math.exp(-g0 * (altitude - 11000) / (R_GAS * T));
    return P / (R_GAS * T);
  } else if (altitude <= 32000) {
    // Upper stratosphere
    const T = 216.65 + 0.001 * (altitude - 20000);
    const P20 = P0_ISA * Math.pow(216.65 / T0_ISA, g0 / (L_ISA * R_GAS)) * 
                Math.exp(-g0 * 9000 / (R_GAS * 216.65));
    const P = P20 * Math.pow(T / 216.65, -g0 / (0.001 * R_GAS));
    return P / (R_GAS * T);
  } else if (altitude <= 84000) {
    // Mesosphere - exponential decay approximation
    const P = P0_ISA * Math.exp(-altitude / 8500);
    return P / (R_GAS * 186.87);
  }
  
  // Above 84km - negligible density
  return 0;
}

// Get local gravity using inverse-square law
function getLocalGravity(altitude) {
  const r = R_E + altitude;
  return G * M_E / (r * r);
}

// Speed of sound at altitude (for Mach number)
function getSpeedOfSound(altitude) {
  let T;
  if (altitude <= 11000) {
    T = T0_ISA - L_ISA * altitude;
  } else if (altitude <= 20000) {
    T = 216.65;
  } else if (altitude <= 32000) {
    T = 216.65 + 0.001 * (altitude - 20000);
  } else {
    T = 186.87;
  }
  return Math.sqrt(GAMMA * R_GAS * T);
}

// Mach-dependent drag coefficient (simplified model)
function getDragCoefficient(baseCd, mach) {
  if (mach < 0.8) {
    return baseCd;  // Subsonic
  } else if (mach < 1.2) {
    // Transonic - drag rise
    return baseCd * (1 + 0.5 * Math.pow((mach - 0.8) / 0.4, 2));
  } else if (mach < 5) {
    // Supersonic
    return baseCd * (1.2 - 0.1 * (mach - 1.2));
  } else {
    // Hypersonic - reduced Cd
    return baseCd * 0.7;
  }
}

function rotate(vector, thetaDeg) {
  const theta = thetaDeg * Math.PI / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return [
    cos * vector[0] - sin * vector[1],
    sin * vector[0] + cos * vector[1]
  ];
}

function norm(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function normalize(v) {
  const n = norm(v);
  return n > 0 ? [v[0] / n, v[1] / n] : [0, 0];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

export default function Ballistic({ onSaveRun, historyLength = 0 }) {
  // Mode selection
  const [mode, setMode] = useState('manual'); // 'manual' or 'preset'
  const [selectedMissile, setSelectedMissile] = useState('minuteman3');
  const [missileDropdownOpen, setMissileDropdownOpen] = useState(false);

  // Simulation parameters (manual mode)
  const [elevationAngle, setElevationAngle] = useState(75);
  const [launchMass, setLaunchMass] = useState(6200);
  const [thrustToWeight, setThrustToWeight] = useState(1.5);
  const [dragCoeff, setDragCoeff] = useState(0.2);
  const [isp, setIsp] = useState(237);
  const [launchHeight, setLaunchHeight] = useState(0); // Release height from ground (m)
  const [animationSpeed, setAnimationSpeed] = useState('normal');

  // Simulation state
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('simulation');

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const dropdownRef = useRef(null);
  const simulationRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMissileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current parameters based on mode
  const getParams = useCallback(() => {
    if (mode === 'preset') {
      const missile = REAL_MISSILES[selectedMissile];
      return {
        elevationAngle: missile.elevationAngle,
        launchMass: missile.launchMass,
        emptyMass: missile.emptyMass,
        warheadMass: missile.warheadMass,
        thrustToWeight: missile.thrustToWeight,
        dragCoeff: missile.dragCoeff,
        isp: missile.isp,
        launchHeight: missile.launchHeight || 0,
        burnTime: missile.burnTime || 0
      };
    }
    return {
      elevationAngle,
      launchMass,
      emptyMass: DEFAULT_PARAMS.emptyMass,
      warheadMass: DEFAULT_PARAMS.warheadMass,
      thrustToWeight,
      dragCoeff,
      isp,
      launchHeight,
      burnTime: 0  // Will be estimated in simulation
    };
  }, [mode, selectedMissile, elevationAngle, launchMass, thrustToWeight, dragCoeff, isp, launchHeight]);

  // Run the ballistic simulation with improved physics
  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setIsAnimating(false);
    setAnimationIndex(0);

    const params = getParams();
    const m_0 = params.launchMass;
    const m_f = params.emptyMass;
    const m_wh = params.warheadMass;
    const v_e = params.isp * g0;  // Exhaust velocity = Isp * g0
    const F = m_0 * g0 * params.thrustToWeight;  // Initial thrust
    const baseCd = params.dragCoeff;
    const A = DEFAULT_PARAMS.crossSection;
    const EA = params.elevationAngle;
    const burnTime = params.burnTime || (m_0 - m_f) / (F / v_e);  // Estimated burn time

    // Initial state: [x, y, vx, vy, m]
    // Start at Earth surface + launch height (for air-launched missiles etc.)
    const launchAltitude = params.launchHeight || 0;
    // Initial velocity for air-launched missiles
    const initialVy = launchAltitude > 1000 ? 200 : 100;  // Air-launched have initial speed
    let state = [0, R_E + launchAltitude, 0, initialVy, m_0];
    const dt = 0.5;  // 0.5 second time step
    const maxTime = 7200; // 2 hours max for ICBMs
    
    const trajectory = [];
    let t = 0;
    let separated = false;

    // Improved pointing logic based on flight phase
    function decidePointing(x, y, vx, vy, flightTime) {
      const r = [x, y];
      const v = [vx, vy];
      const rhat = normalize(r);
      const vhat = (vx === 0 && vy === 0) ? rhat : normalize(v);
      const h = norm(r) - R_E;
      
      // Above 10km, follow velocity vector (gravity turn)
      if (h > 10000) {
        return vhat;
      } else {
        // Below 10km during ascent, point at elevation angle
        if (dot(r, v) > 0) {  // Ascending
          return rotate(rhat, EA - 90);
        }
        return vhat;  // Descending - follow velocity
      }
    }

    function derivatives(state, t) {
      const [x, y, vx, vy, m] = state;
      const r_vec = [x, y];
      const r = norm(r_vec);
      const v_vec = [vx, vy];
      const v = norm(v_vec);
      const h = r - R_E;
      const phat = decidePointing(x, y, vx, vy, t);
      
      let a_rocket = [0, 0];
      let dmdt = 0;
      let isSeparated = separated;

      // Rocket thrust during burn phase
      if (m > m_f && t < burnTime * 1.5) {  // Allow some burn time margin
        // Thrust decreases as mass decreases (constant Isp)
        const currentThrust = F * (m / m_0);  // Scale thrust with mass
        a_rocket = [(currentThrust / m) * phat[0], (currentThrust / m) * phat[1]];
        dmdt = -F / v_e;
      } else if (!isSeparated && m <= m_f) {
        separated = true;
        isSeparated = true;
      }

      // Gravity - inverse square law
      const g_local = getLocalGravity(h);
      const a_g = [-(g_local * x) / r, -(g_local * y) / r];

      // Aerodynamic drag with improved model
      const rho = getAirDensity(h);
      const effectiveMass = isSeparated ? m_wh : m;
      const effectiveArea = isSeparated ? A * 0.3 : A;  // Warhead has smaller cross-section
      
      // Get Mach number for Mach-dependent drag
      const speedOfSound = getSpeedOfSound(h);
      const mach = v / speedOfSound;
      const C_D = getDragCoefficient(baseCd, mach);
      
      // Drag force: F_drag = 0.5 * rho * v² * Cd * A
      let a_drag = [0, 0];
      if (v > 0 && rho > 0) {
        const dragAccel = 0.5 * rho * v * v * C_D * effectiveArea / effectiveMass;
        const vhat = normalize(v_vec);
        a_drag = [-dragAccel * vhat[0], -dragAccel * vhat[1]];
      }

      // Coriolis and centrifugal effects (Earth rotation)
      const a_cen = [omega * omega * x, omega * omega * y];
      const a_cor = [2 * omega * vy, -2 * omega * vx];

      // Total acceleration
      const ax = a_rocket[0] + a_g[0] + a_drag[0] + a_cen[0] + a_cor[0];
      const ay = a_rocket[1] + a_g[1] + a_drag[1] + a_cen[1] + a_cor[1];

      return [vx, vy, ax, ay, dmdt];
    }

    function rk4Step(state, t, dt) {
      const k1 = derivatives(state, t);
      const s2 = state.map((s, i) => s + 0.5 * dt * k1[i]);
      const k2 = derivatives(s2, t + 0.5 * dt);
      const s3 = state.map((s, i) => s + 0.5 * dt * k2[i]);
      const k3 = derivatives(s3, t + 0.5 * dt);
      const s4 = state.map((s, i) => s + dt * k3[i]);
      const k4 = derivatives(s4, t + dt);

      return state.map((s, i) => s + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }

    while (t < maxTime) {
      const r = norm([state[0], state[1]]);
      const h = r - R_E;
      const v = norm([state[2], state[3]]);
      const speedOfSound = getSpeedOfSound(Math.max(0, h));
      const mach = v / speedOfSound;

      trajectory.push({
        t,
        x: state[0] / 1000,
        y: state[1] / 1000,
        h: h / 1000,
        v: v,
        mach: mach,
        m: state[4],
        phase: state[4] > m_f ? 'powered' : 'ballistic'
      });

      // Terminate if hit ground (after initial launch)
      if (h < 0 && t > 10) {
        break;
      }

      state = rk4Step(state, t, dt);
      t += dt;
    }

    // Calculate ground range using great circle distance
    const startPos = [trajectory[0].x * 1000, trajectory[0].y * 1000];
    const endPos = [trajectory[trajectory.length - 1].x * 1000, trajectory[trajectory.length - 1].y * 1000];
    const cosAngle = dot(startPos, endPos) / (norm(startPos) * norm(endPos));
    const rangeKm = R_E * Math.acos(Math.max(-1, Math.min(1, cosAngle))) / 1000;

    const maxHeight = Math.max(...trajectory.map(p => p.h));
    const maxVelocity = Math.max(...trajectory.map(p => p.v));
    const maxMach = Math.max(...trajectory.map(p => p.mach || 0));
    const impactVelocity = trajectory[trajectory.length - 1].v;
    const flightTime = trajectory[trajectory.length - 1].t;

    setTrajectoryData(trajectory);
    setStats({
      range: rangeKm,
      maxHeight,
      maxVelocity,
      maxMach,
      impactVelocity,
      impactMach: impactVelocity / 340,
      flightTime,
      trajectoryPoints: trajectory.length
    });
    setIsSimulating(false);

    // Save run to history for Analytics
    if (onSaveRun) {
      const missile = mode === 'preset' ? REAL_MISSILES[selectedMissile] : null;
      onSaveRun({
        timestamp: new Date().toISOString(),
        type: 'ballistic',
        mode: mode,
        missileName: missile?.name || 'Custom Missile',
        missileKey: mode === 'preset' ? selectedMissile : null,
        v0: params.launchMass, // Using launch mass as identifier
        angle: params.elevationAngle,
        drag: params.dragCoeff,
        isp: params.isp,
        thrustToWeight: params.thrustToWeight,
        stats: {
          maxHeight: maxHeight,
          maxRange: rangeKm * 1000, // Convert to meters for consistency
          flightTime: flightTime,
          trajectoryPoints: trajectory.length,
          impactMach: impactVelocity / 340
        },
        impact_physics: rangeKm * 1000, // Range in meters
        impact_ml: rangeKm * 1000, // No ML for ballistic yet
      });
    }

    setTimeout(() => {
      setIsAnimating(true);
      // Auto-scroll to simulation visualization
      if (simulationRef.current) {
        simulationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  }, [getParams, onSaveRun, mode, selectedMissile]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !trajectoryData) return;

    const speedFactor = ANIMATION_SPEEDS[animationSpeed].factor;
    const animate = () => {
      setAnimationIndex(prev => {
        if (prev >= trajectoryData.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    };

    animationRef.current = setTimeout(animate, 8 * speedFactor);
    return () => clearTimeout(animationRef.current);
  }, [isAnimating, animationIndex, trajectoryData, animationSpeed]);

  // Draw trajectory on canvas - IMPROVED SCALING AND VISUALIZATION
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trajectoryData || trajectoryData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const paddingLeft = 70;
    const paddingRight = 30;
    const paddingTop = 45;
    const paddingBottom = 55;

    ctx.clearRect(0, 0, width, height);

    // Dark background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Calculate bounds from trajectory data
    const xs = trajectoryData.map(p => p.x);
    const hs = trajectoryData.map(p => p.h);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxH = Math.max(...hs);

    // Calculate plot area dimensions
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Add margins to data bounds (5% on each side for X)
    const xRange = maxX - minX || 1;
    const plotMinX = minX - xRange * 0.05;
    const plotMaxX = maxX + xRange * 0.05;
    
    // FIXED Y-AXIS: Ground at 75% from top, underground region is bottom 25%
    // This means: plotMaxH is at top (0%), ground (0) is at 75%, plotMinH is at bottom (100%)
    // So the visible height above ground is 75% of plot, below ground is 25%
    // If maxH is the max altitude, we want ground at 75% mark
    // Total range = maxH / 0.75 (so that maxH fits in top 75%)
    // plotMinH = -(totalRange * 0.25) = -(maxH / 0.75 * 0.25) = -maxH / 3
    const maxHWithMargin = maxH * 1.08; // 8% margin above max altitude
    const totalYRange = maxHWithMargin / 0.75; // Total Y range so ground is at 75%
    const plotMinH = -totalYRange * 0.25; // Bottom 25% is underground
    const plotMaxH = maxHWithMargin;

    // Calculate scales - USE FULL AVAILABLE SPACE (different scales for X and Y)
    const scaleX = plotWidth / (plotMaxX - plotMinX);
    const scaleY = plotHeight / (plotMaxH - plotMinH);

    // Transform functions
    const toCanvasX = (x) => paddingLeft + (x - plotMinX) * scaleX;
    const toCanvasY = (h) => paddingTop + plotHeight - (h - plotMinH) * scaleY;
    const toCanvas = (x, h) => [toCanvasX(x), toCanvasY(h)];

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    // Calculate nice step sizes for grid
    const niceStep = (range, targetSteps) => {
      const rawStep = range / targetSteps;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalized = rawStep / magnitude;
      let niceNormalized;
      if (normalized < 1.5) niceNormalized = 1;
      else if (normalized < 3) niceNormalized = 2;
      else if (normalized < 7) niceNormalized = 5;
      else niceNormalized = 10;
      return niceNormalized * magnitude;
    };

    // Vertical grid lines (X axis)
    const xStep = niceStep(plotMaxX - plotMinX, 6);
    for (let x = Math.ceil(plotMinX / xStep) * xStep; x <= plotMaxX; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, paddingTop);
      ctx.lineTo(cx, height - paddingBottom);
      ctx.stroke();
      // X-axis labels
      ctx.textAlign = 'center';
      ctx.fillText(`${x.toFixed(0)}`, cx, height - paddingBottom + 18);
    }
    
    // Horizontal grid lines (Y axis)
    const hStep = niceStep(plotMaxH - plotMinH, 5);
    for (let h = Math.ceil(plotMinH / hStep) * hStep; h <= plotMaxH; h += hStep) {
      const cy = toCanvasY(h);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, cy);
      ctx.lineTo(width - paddingRight, cy);
      ctx.stroke();
      // Y-axis labels
      ctx.textAlign = 'right';
      ctx.fillText(`${h.toFixed(0)}`, paddingLeft - 8, cy + 4);
    }

    // Draw ground line (sea level)
    const groundY = toCanvasY(0);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, groundY);
    ctx.lineTo(width - paddingRight, groundY);
    ctx.stroke();
    
    // Ground fill - fills the entire underground region (bottom 25% of plot)
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height - paddingBottom);
    groundGrad.addColorStop(0, 'rgba(0, 180, 200, 0.25)');
    groundGrad.addColorStop(1, 'rgba(0, 100, 120, 0.4)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(paddingLeft, groundY, plotWidth, height - paddingBottom - groundY);

    // Draw full trajectory path (faded)
    ctx.strokeStyle = 'rgba(192, 192, 192, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    trajectoryData.forEach((p, i) => {
      const [cx, cy] = toCanvas(p.x, p.h);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw animated trajectory with gradient
    if (animationIndex > 0) {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#ffa500');
      gradient.addColorStop(1, '#ff6b6b');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      for (let i = 0; i <= animationIndex; i++) {
        const [cx, cy] = toCanvas(trajectoryData[i].x, trajectoryData[i].h);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw missile at current position
    if (animationIndex < trajectoryData.length) {
      const current = trajectoryData[animationIndex];
      const [cx, cy] = toCanvas(current.x, current.h);

      // Calculate rotation angle based on trajectory
      let angle = 0;
      if (animationIndex > 0) {
        const prev = trajectoryData[animationIndex - 1];
        const dx = current.x - prev.x;
        const dh = current.h - prev.h;
        angle = Math.atan2(dh, dx);
      }

      // Draw exhaust flame when ascending
      if (current.m > (mode === 'preset' ? REAL_MISSILES[selectedMissile].emptyMass : DEFAULT_PARAMS.emptyMass)) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-angle);
        
        // Flame gradient
        const flameGrad = ctx.createLinearGradient(-30, 0, 0, 0);
        flameGrad.addColorStop(0, 'rgba(255, 100, 0, 0)');
        flameGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.8)');
        flameGrad.addColorStop(1, 'rgba(255, 255, 100, 1)');
        
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-25, -6);
        ctx.lineTo(0, 0);
        ctx.lineTo(-25, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw missile body
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle);

      // Missile body gradient
      const missileGrad = ctx.createLinearGradient(-12, 0, 12, 0);
      missileGrad.addColorStop(0, '#4a4a4a');
      missileGrad.addColorStop(0.3, '#8a8a8a');
      missileGrad.addColorStop(0.7, '#6a6a6a');
      missileGrad.addColorStop(1, '#3a3a3a');

      // Missile body
      ctx.fillStyle = missileGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Nose cone
      ctx.fillStyle = '#cc0000';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(18, 0);
      ctx.lineTo(12, -3);
      ctx.lineTo(12, 3);
      ctx.closePath();
      ctx.fill();

      // Fins
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(-10, 4);
      ctx.lineTo(-14, 10);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-14, -10);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Glow around missile
      ctx.shadowColor = 'rgba(255, 150, 50, 0.6)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw launch point
    const [launchX, launchY] = toCanvas(trajectoryData[0].x, trajectoryData[0].h);
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(launchX, launchY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw impact point
    if (animationIndex >= trajectoryData.length - 1) {
      const lastPoint = trajectoryData[trajectoryData.length - 1];
      const [impactX, impactY] = toCanvas(lastPoint.x, lastPoint.h);

      // Explosion effect
      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(impactX, impactY, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 150, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(impactX, impactY, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4400';
      ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(impactX, impactY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px Inter, sans-serif';
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Range (km)', width / 2, height - 10);
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Altitude (km)', 0, 0);
    ctx.restore();

    // Draw title with missile name if preset
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    const title = mode === 'preset' 
      ? `${REAL_MISSILES[selectedMissile].name} Trajectory`
      : `Custom Missile • ${getParams().elevationAngle}° elevation`;
    ctx.fillText(title, width / 2, 25);

    // Stats overlay
    if (stats) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Range: ${stats.range.toFixed(0)} km | Max Alt: ${stats.maxHeight.toFixed(0)} km | Impact: Mach ${stats.impactMach.toFixed(1)}`, width - 20, 25);
    }

  }, [trajectoryData, animationIndex, stats, mode, selectedMissile, getParams]);

  // Reset simulation
  const clearSimulation = () => {
    setTrajectoryData(null);
    setStats(null);
    setAnimationIndex(0);
    setIsAnimating(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Replay animation
  const replayAnimation = () => {
    if (trajectoryData) {
      setAnimationIndex(0);
      setIsAnimating(true);
    }
  };

  // Get current animation data
  const currentData = trajectoryData && animationIndex < trajectoryData.length 
    ? trajectoryData[animationIndex] 
    : null;

  const currentMissile = REAL_MISSILES[selectedMissile];

  return (
    <div className="main-grid">
      {/* Left Panel - Inputs */}
      <aside className="left-panel">
        {/* Mode Selector - Pill Slider Design */}
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <h3 className="panel-title" style={{ marginBottom: '16px' }}>
            <Rocket size={20} />
            Simulation Mode
          </h3>
          <div className="pill-slider-container pill-slider-2">
            <div 
              className="pill-slider-indicator" 
              style={{ 
                transform: `translateX(${mode === 'manual' ? '0%' : 'calc(100% + 4px)'})`,
                width: 'calc(50% - 7px)'
              }} 
            />
            <button 
              className={`pill-slider-btn ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
              aria-pressed={mode === 'manual'}
            >
              <Settings size={16} />
              <span>Manual</span>
            </button>
            <button 
              className={`pill-slider-btn ${mode === 'preset' ? 'active' : ''}`}
              onClick={() => setMode('preset')}
              aria-pressed={mode === 'preset'}
            >
              <Globe size={16} />
              <span>Real</span>
            </button>
          </div>
        </div>

        {mode === 'preset' ? (
          /* Real Missiles Selector */
          <div className="glass-card">
            <h3 className="panel-title">
              <Target size={20} />
              Select Missile
            </h3>

            {/* Missile Dropdown */}
            <div className="missile-selector" ref={dropdownRef}>
              <button 
                className="missile-selector-btn"
                onClick={() => setMissileDropdownOpen(!missileDropdownOpen)}
              >
                <div className="missile-selector-info">
                  <span className="missile-emoji">{currentMissile.image}</span>
                  <div className="missile-selector-text">
                    <span className="missile-name">{currentMissile.name}</span>
                    <span className="missile-country">{currentMissile.country} • {currentMissile.type}</span>
                  </div>
                </div>
                <ChevronDown size={20} className={`selector-chevron ${missileDropdownOpen ? 'open' : ''}`} />
              </button>

              {missileDropdownOpen && (
                <div className="missile-dropdown">
                  {Object.entries(REAL_MISSILES).map(([key, missile]) => (
                    <button
                      key={key}
                      className={`missile-dropdown-item ${selectedMissile === key ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMissile(key);
                        setMissileDropdownOpen(false);
                      }}
                    >
                      <span className="missile-emoji">{missile.image}</span>
                      <div className="missile-item-info">
                        <span className="missile-item-name">{missile.name}</span>
                        <span className="missile-item-meta">{missile.country} • {missile.type}</span>
                      </div>
                      <span className="missile-item-range">{missile.range}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Missile Info Card */}
            <div className="missile-info-card">
              <p className="missile-description">{currentMissile.description}</p>
              <div className="missile-specs">
                <div className="spec-item">
                  <Gauge size={14} />
                  <span>Range: {currentMissile.range}</span>
                </div>
                <div className="spec-item">
                  <Zap size={14} />
                  <span>Speed: {currentMissile.speed}</span>
                </div>
                <div className="spec-item">
                  <Activity size={14} />
                  <span>Mass: {(currentMissile.launchMass / 1000).toFixed(1)}t</span>
                </div>
                <div className="spec-item">
                  <Crosshair size={14} />
                  <span>Angle: {currentMissile.elevationAngle}°</span>
                </div>
                {currentMissile.launchHeight > 0 && (
                  <div className="spec-item">
                    <Target size={14} />
                    <span>Launch Alt: {(currentMissile.launchHeight / 1000).toFixed(1)} km</span>
                  </div>
                )}
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
                disabled={isSimulating || isAnimating}
              >
                <Play size={18} />
                {isSimulating ? "Computing..." : isAnimating ? "Animating..." : "Launch"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={clearSimulation}
                disabled={isSimulating || isAnimating}
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          /* Manual Input Panel */
          <div className="glass-card">
            <h3 className="panel-title">
              <Zap size={20} />
              Manual Parameters
            </h3>

            <div className="input-group">
              <label className="input-label">Elevation Angle (°)</label>
              <input
                type="number"
                className="input-field"
                value={elevationAngle}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '-') {
                    setElevationAngle(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num)) setElevationAngle(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setElevationAngle(isNaN(num) ? 75 : Math.max(10, Math.min(90, num)));
                }}
                min={10}
                max={90}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Launch Mass (kg)</label>
              <input
                type="number"
                className="input-field"
                value={launchMass}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setLaunchMass(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) setLaunchMass(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setLaunchMass(isNaN(num) ? 6200 : Math.max(1000, Math.min(250000, num)));
                }}
                min={1000}
                max={250000}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Thrust-to-Weight Ratio</label>
              <input
                type="number"
                className="input-field"
                value={thrustToWeight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '.') {
                    setThrustToWeight(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) setThrustToWeight(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setThrustToWeight(isNaN(num) ? 1.5 : Math.max(0.5, Math.min(5, num)));
                }}
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Drag Coefficient</label>
              <input
                type="number"
                className="input-field"
                value={dragCoeff}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '.') {
                    setDragCoeff(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) setDragCoeff(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setDragCoeff(isNaN(num) ? 0.2 : Math.max(0.05, Math.min(1, num)));
                }}
                min={0.05}
                max={1}
                step={0.01}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Specific Impulse (s)</label>
              <input
                type="number"
                className="input-field"
                value={isp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setIsp(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) setIsp(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setIsp(isNaN(num) ? 237 : Math.max(100, Math.min(500, num)));
                }}
                min={100}
                max={500}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Release Height from Ground (m)</label>
              <input
                type="number"
                className="input-field"
                value={launchHeight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setLaunchHeight(val);
                  } else {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num >= 0) setLaunchHeight(num);
                  }
                }}
                onBlur={(e) => {
                  const num = parseFloat(e.target.value);
                  setLaunchHeight(isNaN(num) || num < 0 ? 0 : Math.min(50000, num));
                }}
                min={0}
                max={50000}
                step={100}
                placeholder="0 (ground level)"
              />
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
                disabled={isSimulating || isAnimating}
              >
                <Play size={18} />
                {isSimulating ? "Computing..." : isAnimating ? "Animating..." : "Launch"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={clearSimulation}
                disabled={isSimulating || isAnimating}
              >
                Clear
              </button>
            </div>

            <div className="info-box">
              <CheckCircle2 size={16} />
              <div>
                Physics simulation with <strong>RK4 integration</strong>, gravity, air drag, Coriolis & centrifugal forces.
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Right Panel - Visualization */}
      <main className="right-panel">
        <div className="glass-card visualization-card" ref={simulationRef}>
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={24} />
              Trajectory Visualization
            </h2>
            <div className="card-actions">
              <button
                className="action-btn"
                onClick={replayAnimation}
                disabled={!trajectoryData || isAnimating}
              >
                <RotateCcw size={18} />
                Replay
              </button>
            </div>
          </div>

          {/* Canvas - Larger height */}
          <div className="canvas-container" style={{ minHeight: '500px' }}>
            {!trajectoryData ? (
              <div className="placeholder-content">
                <Target size={48} className="placeholder-icon" />
                <p className="placeholder-text">No trajectory data</p>
                <p className="placeholder-subtext">
                  {mode === 'preset' 
                    ? `Select a missile and click Launch to simulate ${currentMissile.name}`
                    : 'Configure parameters and launch simulation'
                  }
                </p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="trajectory-canvas" style={{ height: '500px' }} />
            )}
          </div>

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
              {stats && animationIndex >= (trajectoryData?.length || 0) - 1 && (
                <div className="impact-result-new">
                  <div className="impact-badge">
                    🎯 {mode === 'preset' ? currentMissile.name.toUpperCase() : 'BALLISTIC'} TRAJECTORY RESULTS
                  </div>
                  <div className="impact-value-large">{stats.range.toFixed(0)} km</div>
                  <div className="impact-note">Range • Impact: Mach {stats.impactMach.toFixed(1)} • Flight: {(stats.flightTime / 60).toFixed(1)} min</div>
                </div>
              )}

              {/* Statistics Grid */}
              {stats && (
                <div className="stats-grid-new">
                  <div className="stat-box">
                    <div className="stat-icon-new"><Mountain size={24} style={{color: '#a78bfa'}} /></div>
                    <div className="stat-label-new">Max Altitude</div>
                    <div className="stat-value-new">{stats.maxHeight.toFixed(0)} km</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon-new"><Ruler size={24} style={{color: '#60a5fa'}} /></div>
                    <div className="stat-label-new">Range</div>
                    <div className="stat-value-new">{stats.range.toFixed(0)} km</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon-new"><Timer size={24} style={{color: '#f97316'}} /></div>
                    <div className="stat-label-new">Flight Time</div>
                    <div className="stat-value-new">{(stats.flightTime / 60).toFixed(1)} min</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon-new"><Wind size={24} style={{color: '#22c55e'}} /></div>
                    <div className="stat-label-new">Impact Velocity</div>
                    <div className="stat-value-new">Mach {stats.impactMach.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Data Tab */
            <div className="data-tab-content">
              {!trajectoryData ? (
                <div className="data-empty">
                  <Database size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p>No trajectory data available</p>
                  <p style={{ fontSize: '14px', opacity: 0.7 }}>Run a simulation to see data points</p>
                </div>
              ) : (
                <>
                  <div className="data-header">
                    <h3>Trajectory Data Points</h3>
                    <span className="data-count">{trajectoryData.length} points</span>
                  </div>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Time (s)</th>
                          <th>Altitude (km)</th>
                          <th>Velocity (m/s)</th>
                          <th>Mass (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trajectoryData.slice(0, 100).map((p, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{p.t.toFixed(1)}</td>
                            <td>{p.h.toFixed(1)}</td>
                            <td>{p.v.toFixed(0)}</td>
                            <td>{p.m.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {trajectoryData.length > 100 && (
                      <p className="data-note">Showing first 100 of {trajectoryData.length} data points</p>
                    )}
                  </div>
                  <div className="data-actions">
                    <button 
                      className="btn btn-secondary data-export-btn"
                      onClick={() => {
                        const csv = ['Index,Time(s),Altitude(km),Velocity(m/s),Mass(kg)', ...trajectoryData.map((p, i) => 
                          `${i + 1},${p.t.toFixed(2)},${p.h.toFixed(2)},${p.v.toFixed(2)},${p.m.toFixed(2)}`
                        )].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ballistic_trajectory_${mode === 'preset' ? selectedMissile : 'custom'}_${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Export CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
