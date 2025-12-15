# backend/app/sim.py
import numpy as np
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)

# Physical constants for improved accuracy
R_EARTH = 6371000  # Earth radius in meters
G_CONST = 6.67430e-11  # Gravitational constant
M_EARTH = 5.972e24  # Earth mass in kg

# ISA (International Standard Atmosphere) constants
T0_ISA = 288.15  # Sea level temperature (K)
P0_ISA = 101325  # Sea level pressure (Pa)
RHO0_ISA = 1.225  # Sea level air density (kg/m³)
L_ISA = 0.0065  # Temperature lapse rate (K/m) for troposphere
R_GAS = 287.05  # Specific gas constant for air (J/(kg·K))
M_AIR = 0.0289644  # Molar mass of air (kg/mol)

def get_air_density(altitude: float) -> float:
    """
    Calculate air density using ISA model with extended atmosphere.
    
    Args:
        altitude: Height above sea level in meters
        
    Returns:
        Air density in kg/m³
    """
    if altitude < 0:
        altitude = 0
    
    if altitude <= 11000:  # Troposphere
        T = T0_ISA - L_ISA * altitude
        P = P0_ISA * (T / T0_ISA) ** (9.80665 / (L_ISA * R_GAS))
    elif altitude <= 20000:  # Lower stratosphere (isothermal)
        T = 216.65
        P11 = P0_ISA * (216.65 / T0_ISA) ** (9.80665 / (L_ISA * R_GAS))
        P = P11 * np.exp(-9.80665 * (altitude - 11000) / (R_GAS * T))
    elif altitude <= 32000:  # Upper stratosphere
        T = 216.65 + 0.001 * (altitude - 20000)
        P20 = P0_ISA * (216.65 / T0_ISA) ** (9.80665 / (L_ISA * R_GAS)) * np.exp(-9.80665 * 9000 / (R_GAS * 216.65))
        P = P20 * (T / 216.65) ** (-9.80665 / (0.001 * R_GAS))
    elif altitude <= 84000:  # Mesosphere
        # Simplified exponential decay
        P = P0_ISA * np.exp(-altitude / 8500)
        T = 186.87
    else:  # Thermosphere and above - negligible density
        return 0.0
    
    rho = P / (R_GAS * T)
    return max(rho, 0.0)

def get_gravity(altitude: float) -> float:
    """
    Calculate gravitational acceleration at altitude using inverse-square law.
    
    Args:
        altitude: Height above sea level in meters
        
    Returns:
        Gravitational acceleration in m/s²
    """
    r = R_EARTH + altitude
    return G_CONST * M_EARTH / (r * r)

class TrajectorySimulator:
    """
    Physics-based ballistic trajectory simulator with advanced air resistance model.
    Uses Runge-Kutta 4 (RK4) integration with:
    - Altitude-dependent gravity (inverse-square law)
    - ISA atmospheric model for realistic air density
    - Proper handling of negative launch angles
    """
    
    def __init__(self, g: float = 9.80665):
        """
        Initialize simulator with sea-level gravitational constant.
        
        Args:
            g: Sea-level gravitational acceleration in m/s² (default: 9.80665)
        """
        self.g0 = g  # Sea level gravity
    
    def simulate(
        self, 
        v0: float, 
        angle_deg: float, 
        drag_coeff: float = 0.01, 
        dt: float = 0.01, 
        max_steps: int = 200000,
        release_height: float = 0.0
    ) -> Tuple[List[float], List[float], float, dict]:
        """
        Simulate ballistic trajectory with linear drag.
        
        Args:
            v0: Initial velocity in m/s
            angle_deg: Launch angle in degrees (-90 to 90, negative for downward)
            drag_coeff: Drag coefficient (dimensionless)
            dt: Time step in seconds
            max_steps: Maximum simulation steps to prevent infinite loops
            release_height: Initial height above ground in meters (default: 0)
            
        Returns:
            Tuple of (xs, ys, impact_x, stats) where:
                - xs: List of x-coordinates
                - ys: List of y-coordinates
                - impact_x: X-coordinate at impact (y=0)
                - stats: Dictionary with trajectory statistics
        """
        # Validation
        if v0 <= 0:
            raise ValueError("Initial velocity must be positive")
        if not -90 <= angle_deg <= 90:
            raise ValueError("Launch angle must be between -90 and 90 degrees")
        if drag_coeff < 0:
            raise ValueError("Drag coefficient must be non-negative")
        if dt <= 0:
            raise ValueError("Time step must be positive")
        if release_height < 0:
            raise ValueError("Release height must be non-negative")
        
        # Initial conditions - start at release_height above ground
        angle = np.radians(angle_deg)
        vx = v0 * np.cos(angle)
        vy = v0 * np.sin(angle)  # Negative for downward angles (sin of negative is negative)
        x, y = 0.0, release_height
        
        # Storage for trajectory
        xs, ys = [x], [y]
        vxs, vys = [vx], [vy]
        times = [0.0]
        
        # Statistics tracking
        max_height = release_height  # Start with initial height
        max_height_x = 0.0
        
        steps = 0
        current_time = 0.0
        
        # Assumed projectile properties for realistic drag
        # Using ballistic coefficient approach: B = m / (Cd * A)
        # For a typical projectile (like a ball), Cd ≈ 0.47, A ≈ 0.01 m², m ≈ 0.5 kg
        # drag_coeff here is simplified as k in F_drag = k * v * |v|
        
        def get_derivatives(state, t):
            x, y, vx, vy = state
            speed = np.hypot(vx, vy)
            
            # Altitude-dependent gravity (more accurate for high altitudes)
            g_local = get_gravity(y) if y > 0 else self.g0
            
            # Altitude-dependent air density (ISA model)
            rho = get_air_density(y) if y > 0 else RHO0_ISA
            
            # Drag force: F_drag = 0.5 * rho * v² * Cd * A
            # Simplified as: a_drag = drag_coeff * rho/rho0 * v² in direction opposite to velocity
            # The drag_coeff absorbs Cd * A / (2 * m)
            rho_ratio = rho / RHO0_ISA if RHO0_ISA > 0 else 0
            drag_accel = drag_coeff * rho_ratio * speed if speed > 0 else 0
            
            # Velocity unit vector for drag direction (opposite to motion)
            if speed > 1e-10:
                vx_hat = vx / speed
                vy_hat = vy / speed
            else:
                vx_hat, vy_hat = 0, 0
            
            # Derivatives: dx/dt = vx, dy/dt = vy, dvx/dt = ax, dvy/dt = ay
            d_x = vx
            d_y = vy
            d_vx = -drag_accel * vx_hat * speed  # Drag opposes motion
            d_vy = -g_local - drag_accel * vy_hat * speed  # Gravity always down, drag opposes motion
            
            return np.array([d_x, d_y, d_vx, d_vy])

        # Simulation loop using Runge-Kutta 4 (RK4) integration
        while True:
            state = np.array([x, y, vx, vy])
            
            # RK4 steps
            k1 = get_derivatives(state, current_time)
            k2 = get_derivatives(state + 0.5 * dt * k1, current_time + 0.5 * dt)
            k3 = get_derivatives(state + 0.5 * dt * k2, current_time + 0.5 * dt)
            k4 = get_derivatives(state + dt * k3, current_time + dt)
            
            # Update state
            new_state = state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
            
            # Unpack new state
            x, y, vx, vy = new_state
            current_time += dt
            
            # Store values
            xs.append(x)
            ys.append(y)
            vxs.append(vx)
            vys.append(vy)
            times.append(current_time)
            
            # Track maximum height
            if y > max_height:
                max_height = y
                max_height_x = x
            
            steps += 1
            
            # Termination conditions
            if y <= 0 and steps > 1:  # Projectile hit ground
                break
            if steps >= max_steps:  # Safety limit
                logger.warning(f"Simulation reached max steps ({max_steps})")
                break
            # Note: Don't check for x < 0 since negative angles from height can go backwards initially
        
        # Calculate accurate impact point using linear interpolation
        impact_x = self._calculate_impact_point(xs, ys)
        
        # Calculate final statistics
        stats = self._calculate_statistics(
            xs, ys, vxs, vys, times, 
            max_height, max_height_x, 
            impact_x, v0, angle_deg, drag_coeff
        )
        
        logger.info(f"Simulation completed: {steps} steps, impact at x={impact_x:.2f}m")
        
        return xs, ys, impact_x, stats
    
    def _calculate_impact_point(self, xs: List[float], ys: List[float]) -> float:
        """
        Calculate accurate impact point using linear interpolation.
        
        Args:
            xs: List of x-coordinates
            ys: List of y-coordinates
            
        Returns:
            X-coordinate where trajectory crosses y=0
        """
        if len(ys) < 2:
            return xs[-1] if xs else 0.0
        
        # Get last two points
        x1, y1 = xs[-2], ys[-2]
        x2, y2 = xs[-1], ys[-1]
        
        # Linear interpolation to find where y = 0
        if y1 != y2:
            t = -y1 / (y2 - y1)
            impact_x = x1 + t * (x2 - x1)
        else:
            impact_x = x2
        
        return float(impact_x)
    
    def _calculate_statistics(
        self, 
        xs: List[float], 
        ys: List[float], 
        vxs: List[float], 
        vys: List[float],
        times: List[float],
        max_height: float,
        max_height_x: float,
        impact_x: float,
        v0: float,
        angle_deg: float,
        drag_coeff: float
    ) -> dict:
        """
        Calculate comprehensive trajectory statistics.
        
        Returns:
            Dictionary containing trajectory statistics
        """
        flight_time = times[-1]
        
        # Calculate impact velocity
        impact_vx = vxs[-1]
        impact_vy = vys[-1]
        impact_velocity = np.hypot(impact_vx, impact_vy)
        impact_angle = np.degrees(np.arctan2(abs(impact_vy), impact_vx))
        
        # Calculate average velocity
        avg_vx = np.mean(vxs)
        avg_vy = np.mean([v for v in vys if v > 0])  # Only upward velocities
        
        # Calculate kinetic energy (assuming unit mass)
        initial_ke = 0.5 * v0**2
        final_ke = 0.5 * impact_velocity**2
        energy_loss = initial_ke - final_ke
        energy_loss_pct = (energy_loss / initial_ke * 100) if initial_ke > 0 else 0
        
        stats = {
            "max_height": round(max_height, 2),
            "max_height_x": round(max_height_x, 2),
            "max_range": round(impact_x, 2),
            "flight_time": round(flight_time, 3),
            "trajectory_points": len(xs),
            "impact_velocity": round(impact_velocity, 2),
            "impact_angle": round(impact_angle, 2),
            "initial_velocity": round(v0, 2),
            "launch_angle": round(angle_deg, 2),
            "drag_coefficient": drag_coeff,
            "energy_loss": round(energy_loss, 2),
            "energy_loss_percent": round(energy_loss_pct, 2),
            "avg_horizontal_velocity": round(avg_vx, 2),
        }
        
        return stats


# Module-level convenience function for backwards compatibility
def simulate_trajectory(
    v0: float, 
    angle_deg: float, 
    drag_coeff: float = 0.01, 
    dt: float = 0.01, 
    max_steps: int = 200000,
    release_height: float = 0.0
) -> Tuple[List[float], List[float], float]:
    """
    Simple Euler integrator for projectile motion with linear drag proportional to speed.
    
    Args:
        v0: Initial velocity in m/s
        angle_deg: Launch angle in degrees
        drag_coeff: Drag coefficient (default: 0.01)
        dt: Time step in seconds (default: 0.01)
        max_steps: Maximum simulation steps (default: 200000)
        release_height: Initial height above ground in meters (default: 0)
        
    Returns:
        Tuple of (xs, ys, impact_x) where:
            - xs: List of x-coordinates
            - ys: List of y-coordinates  
            - impact_x: X-coordinate at impact
    """
    simulator = TrajectorySimulator()
    xs, ys, impact_x, stats = simulator.simulate(v0, angle_deg, drag_coeff, dt, max_steps, release_height)
    return xs, ys, impact_x


def simulate_trajectory_with_stats(
    v0: float, 
    angle_deg: float, 
    drag_coeff: float = 0.01, 
    dt: float = 0.01, 
    max_steps: int = 200000
) -> Tuple[List[float], List[float], float, dict]:
    """
    Simulate trajectory and return detailed statistics.
    
    Args:
        v0: Initial velocity in m/s
        angle_deg: Launch angle in degrees
        drag_coeff: Drag coefficient (default: 0.01)
        dt: Time step in seconds (default: 0.01)
        max_steps: Maximum simulation steps (default: 200000)
        
    Returns:
        Tuple of (xs, ys, impact_x, stats)
    """
    simulator = TrajectorySimulator()
    return simulator.simulate(v0, angle_deg, drag_coeff, dt, max_steps)


def calculate_ideal_trajectory(v0: float, angle_deg: float) -> dict:
    """
    Calculate ideal trajectory (no drag) for comparison.
    
    Args:
        v0: Initial velocity in m/s
        angle_deg: Launch angle in degrees
        
    Returns:
        Dictionary with ideal trajectory parameters
    """
    g = 9.81
    angle = np.radians(angle_deg)
    
    # Ideal trajectory equations (no drag)
    flight_time = 2 * v0 * np.sin(angle) / g
    max_height = (v0 * np.sin(angle))**2 / (2 * g)
    max_range = v0**2 * np.sin(2 * angle) / g
    
    return {
        "ideal_flight_time": round(flight_time, 3),
        "ideal_max_height": round(max_height, 2),
        "ideal_max_range": round(max_range, 2),
        "optimal_angle": 45.0,  # For maximum range (no drag)
    }


# Example usage
if __name__ == "__main__":
    # Test simulation
    v0 = 300  # m/s
    angle = 45  # degrees
    drag = 0.01
    
    print("Running trajectory simulation...")
    xs, ys, impact, stats = simulate_trajectory_with_stats(v0, angle, drag)
    
    print(f"\nSimulation Results:")
    print(f"Impact point: {impact:.2f} m")
    print(f"Max height: {stats['max_height']:.2f} m")
    print(f"Flight time: {stats['flight_time']:.2f} s")
    print(f"Impact velocity: {stats['impact_velocity']:.2f} m/s")
    print(f"Energy loss: {stats['energy_loss_percent']:.1f}%")
    
    # Compare with ideal
    ideal = calculate_ideal_trajectory(v0, angle)
    print(f"\nIdeal (no drag) comparison:")
    print(f"Ideal range: {ideal['ideal_max_range']:.2f} m")
    print(f"Ideal height: {ideal['ideal_max_height']:.2f} m")
    print(f"Range difference: {ideal['ideal_max_range'] - impact:.2f} m")