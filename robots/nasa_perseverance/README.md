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
