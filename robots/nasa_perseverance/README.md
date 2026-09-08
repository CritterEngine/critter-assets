# NASA Perseverance (simulation-ready approximation)

This MuJoCo model is derived from JPL's operations-visualization URDF. It is **not**
a flight-accurate dynamics model.

- Source: https://github.com/nasa-jpl/m2020-urdf-models
- Credit: NASA/JPL-Caltech
- Rover modeling and texturing by Zareh Gorjian
- Release ids: URS307049, URS309682

Approximate additions for Critter: JPL visual meshes and albedo atlas, simplified
collisions, estimated mass/inertia, six wheel-drive velocity actuators, four
steering actuators, a rocker equality constraint, and holding actuators so the
arm/mast stay poseable without collapsing.

## Physics tuning

The model uses Earth gravity (9.81 m/s²), approximately 1025 kg total mass,
and estimated link inertias. NASA's source URDF contains zero arm masses/inertias
and placeholder effort limits; it does not supply flight motor gains.

- The five arm position servos use `kp=60000`, `kv=60000` to hold the heavy,
  extended arm. Static shoulder/elbow error is about 0.84°/0.31° at home.
  The damping gives an approximately one-second response scale (`kv/kp`)
  instead of snapping to pointer targets. A 20° step peaks at approximately
  20–21°/s across the five joints (previously 255–803°/s with `kv=1200`).
  This is simulation tuning, not flight speed control or a hard speed limit.
- Wheel contacts use `solref="0.04 1"` to approximate some wheel/spoke compliance.
  This reduces sharp impacts without adding suspension springs. Contact softness
  combines with the terrain's solver settings, so results depend on the scene.
- Rocker/bogie joints remain passive with damping 80 and the existing differential
  coupling. Lower damping did not consistently improve the bump tests. The
  ±0.35 rad rocker and ±0.4 rad bogie travel limits are simulation approximations.

Native MuJoCo 3.5.0 regression tests cover holding, individual arm target steps,
and 12 cm rounded bumps at 3 rad/s wheel commands. Wheel-compliance comparisons
keep the current arm gains in both baseline and tuned runs.
All six wheels crossed the two-track obstacle, with no non-wheel terrain contacts
or solver warnings. The softer contacts permit under 15 mm transient collision
penetration in this test; these are numerical contacts, not modeled tire deformation.
Mast, antenna, and tool holders also remain stable at rest. At a low 1.2 rad/s
command, the existing wheel velocity servos can stall against the two-track bump;
this tuning does not change drive torque or speed limits.

Run the focused regression with an environment containing MuJoCo and NumPy:

```sh
python scripts/validate_perseverance_physics.py
```

These checks cover the source asset in native MuJoCo, not every editor scene.
Existing saved projects retain their imported settings; publishing the asset and
inserting a fresh library instance is needed to receive the new defaults.
