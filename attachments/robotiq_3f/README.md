# Robotiq 3F Gripper

MuJoCo MJCF port of the Robotiq three-finger adaptive gripper distributed with Webots R2025a.

The upstream Webots model is a VRML PROTO with six inline `IndexedFaceSet` meshes. The checked-in
OBJ files are deterministic extractions of those meshes. The MJCF hierarchy, attachment frame,
actuators, collision boxes, contact parameters, and tool-axis orientation were adapted for Critter.

- Source: https://github.com/cyberbotics/webots/blob/R2025a/projects/devices/robotiq/protos/Robotiq3fGripper.proto
- Upstream license: Apache License 2.0
- Critter attachment site: `attachment_site`
- Tool-center marker: `gripper_target`
- Preset poses: `open`, `closed`
- Degrees of freedom: 11 independently position-controlled hinge joints

The visual geometry follows the Webots model. The mass values and box/cylinder collision shapes are
ported from its `Physics` and `boundingObject` nodes. Actuator gains and contact parameters are
MuJoCo-specific starting values and are not manufacturer specifications.

Regenerate the OBJ files with:

```powershell
python scripts/convert_webots_robotiq3f.py Robotiq3fGripper.proto attachments/robotiq_3f/assets
```
