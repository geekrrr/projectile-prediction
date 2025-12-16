from app.model_store import ModelStore
import numpy as np
from app.sim import simulate_trajectory

ms = ModelStore()

v0 = 300
rag = 0.01
angles = np.linspace(-5,5,21)

print('angle,physics,ml,ml-physics')
for a in angles:
    xs, ys, impact = simulate_trajectory(v0, a, 0.01, dt=0.01)
    physics = float(impact)
    X = np.array([[v0, a, 0.01]])
    if ms.scaler is not None:
        Xs = ms.scaler.transform(X)
    else:
        Xs = X
    pred = float(ms.model.predict(Xs)[0])
    print(f"{a:.3f},{physics:.6f},{pred:.6f},{pred-physics:.6f}")