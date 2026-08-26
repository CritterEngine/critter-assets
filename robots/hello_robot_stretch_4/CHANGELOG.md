# Changelog – Hello Robot Stretch 4 Description

All notable changes to this model will be documented in this file.

## [2026-08-26]
- Replaced the colliding `grasp_center_link` marker with a non-colliding `gripper_target` site in both robot variants.
- Removed unused detailed wheel collision meshes; wheel physics continues to use the existing capsule geoms.
- Removed redundant OBJ material groups from the base and head visual meshes without changing their geometry.
- Restored the upstream physics configuration after resolving the rendering bottleneck.
- Replaced the control-only home key with the user-authored raised `qpos`, and use it as the startup `init` pose.

## [2026-08-24]
- Initial library package from hello-robot/stretch4_mujoco, using the Critter project edits: robot-only scene and assigned visual materials.
- Added a lidar variant: `stretch.xml` has no lidar, `stretch_lidar.xml` includes the head HemiLidar bodies/cameras and the base 360° rangefinder sampled at 10 Hz.
