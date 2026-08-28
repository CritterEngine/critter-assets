# Changelog – Hello Robot Stretch 4 Description

All notable changes to this model will be documented in this file.

## [2026-08-28]
- Marked the base rangefinder with a scene-only geom-group mask so Critter's filtered raycasting excludes the robot, matching the PR runtime instead of terminating rays inside the base.
- Renamed the collision-free startup keyframe to `spawn` and added the upstream control-only `home` and `stow` actuator targets for Critter's Controller.
- Kept floor-bound contact pairs in `scene.xml` and the Critter catalog floor profile instead of the robot-only variants, preventing unresolved-floor warnings during library insertion.

## [2026-08-27]
- Regenerated both MJCF variants and their referenced meshes from hello-robot/stretch4_mujoco PR 29 at commit `fad1406`, using the PR's locked Stretch 4 URDF 2026.7.31 package.
- Adopted the URDF-derived wheel placement and inertials, velocity-controlled wheel actuators, updated anisotropic wheel contact settings, and the docking-contact body and exclusions.
- Preserved the Critter materials, lidar/no-lidar variants, non-colliding gripper target, standard-floor integration, and collision-free authored home pose. The lidar variant retains explicit left and right HemiLidar cameras plus the base 360-degree rangefinder; the no-lidar variant removes all three.

## [2026-08-26]
- Replaced the colliding `grasp_center_link` marker with a non-colliding `gripper_target` site in both robot variants.
- Removed unused detailed wheel collision meshes; wheel physics continues to use the existing capsule geoms.
- Removed redundant OBJ material groups from the base and head visual meshes without changing their geometry.
- Restored the upstream physics configuration after resolving the rendering bottleneck.
- Consolidated startup keyframes into one user-authored `home` pose with a raised lift, slight arm extension, and open gripper.

## [2026-08-24]
- Initial library package from hello-robot/stretch4_mujoco, using the Critter project edits: robot-only scene and assigned visual materials.
- Added a lidar variant: `stretch.xml` has no lidar, `stretch_lidar.xml` includes the head HemiLidar bodies/cameras and the base 360° rangefinder sampled at 10 Hz.
