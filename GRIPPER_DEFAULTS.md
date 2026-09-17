# Library gripper defaults

The source of truth is each actuator-bearing MJCF file. A standard MuJoCo custom numeric named
`critter_gripper:<actuator name>` stores exactly two values: **open, closed**, in actuator control
units. Position, affine tendon, and torque controls therefore use different units and directions.
Multi-actuator hands have one numeric per actuator. Independent hands have separate actuators;
the app selects only targets belonging to the chosen fixed hand frame.

```xml
<custom>
  <numeric name="critter_gripper:gripper_right_finger" data="0.5 0"/>
  <numeric name="critter_gripper:gripper_left_finger" data="0.5 0"/>
</custom>
```

The importer validates names, duplicates, finite values, control ranges, and owning objects before
binding actuator UUIDs. Defaults survive snapshot save/load and duplicate/import ID remapping.
Consumed name-based metadata is not copied into passthrough XML after import, because exported
actuators may have different names. Library/custom-object snapshots retain the UUID-based defaults.
Catalog-wide name guessing is no longer the source of defaults. Objects with no authored metadata
may still use the generic guesser. Changing a controller's grasp frame replaces its actuator targets
with that hand's saved defaults, or clears them if none exist.

New library imports require the updated asset release and app. Existing saved robots and controller
steps are not silently migrated; reimport the updated asset to obtain its defaults. App and asset deployment are separate from these source changes.

## Coverage and marker follow-up

40 XML files contain 175 actuator defaults (39 sister-repository assets and the app-bundled 2F85).
`Missing` below means no site named exactly `gripper_target` in the model. Some models already
have differently named tool/grasp sites. No marker was invented or moved in this change.
For ALOHA, each hand needs its own selectable marker; a single marker cannot represent both hands.

| Asset file | Actuators | gripper_target | Notes |
|---|---:|---|---|
| [franka_emika_panda/panda.xml](robots/franka_emika_panda/panda.xml) | 1 | Present | Affine tendon servo: 255 opens the fingers; 0 closes them. |
| [hello_robot_stretch_4/stretch.xml](robots/hello_robot_stretch_4/stretch.xml) | 2 | Present | Authored control endpoints; live grasp success not verified. |
| [hello_robot_stretch_4/stretch_lidar.xml](robots/hello_robot_stretch_4/stretch_lidar.xml) | 2 | Present | Authored control endpoints; live grasp success not verified. |
| [hello_robot_stretch_3/stretch.xml](robots/hello_robot_stretch_3/stretch.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [hello_robot_stretch/stretch.xml](robots/hello_robot_stretch/stretch.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [agilex_piper/piper.xml](robots/agilex_piper/piper.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [arx_l5/arx_l5.xml](robots/arx_l5/arx_l5.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [i2rt_yam/yam.xml](robots/i2rt_yam/yam.xml) | 1 | **Missing** | Positive slide moves the two jaws inward; use the physical joint limit for closing. |
| [trossen_vx300s/vx300s.xml](robots/trossen_vx300s/vx300s.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [trossen_wx250s/wx250s.xml](robots/trossen_wx250s/wx250s.xml) | 1 | Present | Authored control endpoints; live grasp success not verified. |
| [low_cost_robot_arm/low_cost_robot_arm.xml](robots/low_cost_robot_arm/low_cost_robot_arm.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [trs_so_arm100/so_arm100.xml](robots/trs_so_arm100/so_arm100.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [unitree_z1/z1_gripper.xml](robots/unitree_z1/z1_gripper.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [ufactory_xarm7/xarm7.xml](robots/ufactory_xarm7/xarm7.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [ufactory_xarm7/hand.xml](robots/ufactory_xarm7/hand.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [stanford_tidybot/tidybot.xml](robots/stanford_tidybot/tidybot.xml) | 1 | **Missing** | Authored control endpoints; live grasp success not verified. |
| [ufactory_lite6/lite6_gripper_wide.xml](robots/ufactory_lite6/lite6_gripper_wide.xml) | 1 | **Missing** | Force commands: negative opens the negative-axis jaw, positive closes; not position values. |
| [ufactory_lite6/lite6_gripper_narrow.xml](robots/ufactory_lite6/lite6_gripper_narrow.xml) | 1 | **Missing** | Force commands: negative opens the negative-axis jaw, positive closes; not position values. |
| [aloha/joint_position_actuators.xml](robots/aloha/joint_position_actuators.xml) | 2 | **Missing** | Independent left/right hands; actuator include fragment. |
| [aloha/filtered_cartesian_actuators.xml](robots/aloha/filtered_cartesian_actuators.xml) | 2 | **Missing** | Independent left/right hands; actuator include fragment. |
| [pal_tiago/tiago_position.xml](robots/pal_tiago/tiago_position.xml) | 2 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_tiago_dual/tiago_dual_position.xml](robots/pal_tiago_dual/tiago_dual_position.xml) | 4 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_tiago/tiago_velocity.xml](robots/pal_tiago/tiago_velocity.xml) | 2 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_tiago_dual/tiago_dual_velocity.xml](robots/pal_tiago_dual/tiago_dual_velocity.xml) | 4 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_tiago/tiago_motor.xml](robots/pal_tiago/tiago_motor.xml) | 2 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_tiago_dual/tiago_dual_motor.xml](robots/pal_tiago_dual/tiago_dual_motor.xml) | 4 | **Missing** | Position commands 0.04495 / 0.00003 stay inside the 0.999 inherited range. Independent hands are filtered by the selected frame. |
| [pal_talos/talos_position.xml](robots/pal_talos/talos_position.xml) | 2 | **Missing** | Two independent hands; negative angle curls the linkage. |
| [pal_talos/talos_motor.xml](robots/pal_talos/talos_motor.xml) | 2 | **Missing** | Two independent hands; torque commands, not position targets. |
| [google_robot/robot.xml](robots/google_robot/robot.xml) | 2 | **Missing** | Names added to previously unnamed finger actuators; gripper swivel excluded. |
| [umi_gripper/umi_gripper.xml](attachments/umi_gripper/umi_gripper.xml) | 1 | Present | Authored control endpoints; live grasp success not verified. |
| [robotiq_3f/model.xml](attachments/robotiq_3f/model.xml) | 11 | Present | Existing authored 11-actuator preset. Automatic two-finger planner does not support this hand. |
| [leap_hand/left_hand.xml](attachments/leap_hand/left_hand.xml) | 16 | **Missing** | Conservative curl preset; requires visual review. Dexterous hand, not supported by automatic two-finger planning. |
| [wonik_allegro/left_hand.xml](attachments/wonik_allegro/left_hand.xml) | 16 | **Missing** | Conservative curl/opposition preset; requires visual review. Dexterous hand. |
| [tetheria_aero_hand_open/left_hand.xml](attachments/tetheria_aero_hand_open/left_hand.xml) | 7 | **Missing** | Spatial tendon length commands: shorten flexor tendons to close. Requires visual review; automatic planner unsupported. |
| [shadow_hand/left_hand.xml](attachments/shadow_hand/left_hand.xml) | 18 | **Missing** | Derived from source open hand / close hand keyframes, including fixed tendon sums; wrist actuators excluded. Tendon close sums limited to authored control maximum 3.1415. |
| [leap_hand/right_hand.xml](attachments/leap_hand/right_hand.xml) | 16 | **Missing** | Conservative curl preset; requires visual review. Dexterous hand, not supported by automatic two-finger planning. |
| [wonik_allegro/right_hand.xml](attachments/wonik_allegro/right_hand.xml) | 16 | **Missing** | Conservative curl/opposition preset; requires visual review. Dexterous hand. |
| [tetheria_aero_hand_open/right_hand.xml](attachments/tetheria_aero_hand_open/right_hand.xml) | 7 | **Missing** | Spatial tendon length commands: shorten flexor tendons to close. Requires visual review; automatic planner unsupported. |
| [shadow_hand/right_hand.xml](attachments/shadow_hand/right_hand.xml) | 18 | **Missing** | Derived from source open hand / close hand keyframes, including fixed tendon sums; wrist actuators excluded. Tendon close sums limited to authored control maximum 3.1415. |
| [critterapp/public/robotiq_2f85/2f85.xml](../critterapp/public/attachments/robotiq_2f85/2f85.xml) | 1 | Present | Bundled app asset. |

## Validation and limitations

- The app parser audit passed for 64 complete models and scene/include variants and checks every authored
  actuator mapping and range. Run from critterapp: `pnpm exec tsx scripts/validate-gripper-defaults.ts ../critter-assets`.
- Regression tests cover multiple jaw actuators, filtering independent hands, duplicate identity
  remapping, metadata errors, and retaining defaults through the actual scene-load normalization.
- Native MuJoCo compile/range checks passed for 37 model entries; Shadow Hand's existing `ior`
  material attribute is unsupported by the installed native MuJoCo. The app parser supports these
  files; this material issue is separate from the gripper metadata.
- LEAP, Allegro and Aero Hand close commands are initial authored curl/opposition presets and need
  visual/contact review. Shadow Hand derives its preset from the existing open/close keyframes.
- Automatic grasp planning still supports two opposing driven fingers only. Three-finger and
  dexterous hands, single moving-jaw grippers, and spatial-tendon hands have defaults but are not
  thereby made compatible with automatic grasp planning. Torque controls are force commands and
  do not promise an exact aperture.
- Models without actuated fingers (including bare robot arms and humanoids with static hand meshes)
  are intentionally not assigned fictitious gripper controls. IIT SoftFoot is a foot, not a gripper.

## Authored values

These are open/close commands, not a guarantee of contact or force closure.

### franka_emika_panda/panda.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `actuator8` | 255 | 0 |

### hello_robot_stretch_4/stretch.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_right_finger` | 0.5 | 0 |
| `gripper_left_finger` | 0.5 | 0 |

### hello_robot_stretch_4/stretch_lidar.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_right_finger` | 0.5 | 0 |
| `gripper_left_finger` | 0.5 | 0 |

### hello_robot_stretch_3/stretch.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0.04 | -0.02 |

### hello_robot_stretch/stretch.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `grip` | 0.04 | -0.005 |

### agilex_piper/piper.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0.035 | 0 |

### arx_l5/arx_l5.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0.044 | 0 |

### i2rt_yam/yam.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0 | 0.037524 |

### trossen_vx300s/vx300s.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0.057 | 0.021 |

### trossen_wx250s/wx250s.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0.022 | 0 |

### low_cost_robot_arm/low_cost_robot_arm.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | -1.6 | 0.032 |

### trs_so_arm100/so_arm100.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `Jaw` | 1.75 | 0 |

### unitree_z1/z1_gripper.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `motorGripper` | -1.51844 | 0 |

### ufactory_xarm7/xarm7.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | 0 | 255 |

### ufactory_xarm7/hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `fingers_actuator` | 0 | 255 |

### stanford_tidybot/tidybot.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `fingers_actuator` | 0 | 255 |

### ufactory_lite6/lite6_gripper_wide.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | -10 | 10 |

### ufactory_lite6/lite6_gripper_narrow.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper` | -10 | 10 |

### aloha/joint_position_actuators.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `left/gripper` | 0.037 | 0.002 |
| `right/gripper` | 0.037 | 0.002 |

### aloha/filtered_cartesian_actuators.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `left/finger` | 0.037 | 0.002 |
| `right/finger` | 0.037 | 0.002 |

### pal_tiago/tiago_position.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_finger_position` | 0.04495 | 3e-05 |
| `gripper_right_finger_position` | 0.04495 | 3e-05 |

### pal_tiago_dual/tiago_dual_position.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_left_right_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_right_finger_joint_position` | 0.04495 | 3e-05 |

### pal_tiago/tiago_velocity.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_finger_position` | 0.04495 | 3e-05 |
| `gripper_right_finger_position` | 0.04495 | 3e-05 |

### pal_tiago_dual/tiago_dual_velocity.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_left_right_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_right_finger_joint_position` | 0.04495 | 3e-05 |

### pal_tiago/tiago_motor.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_finger_position` | 0.04495 | 3e-05 |
| `gripper_right_finger_position` | 0.04495 | 3e-05 |

### pal_tiago_dual/tiago_dual_motor.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_left_right_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_left_finger_joint_position` | 0.04495 | 3e-05 |
| `gripper_right_right_finger_joint_position` | 0.04495 | 3e-05 |

### pal_talos/talos_position.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_joint_position` | 0 | -0.959931 |
| `gripper_right_joint_position` | 0 | -0.959931 |

### pal_talos/talos_motor.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_left_joint_torque` | 1 | -1 |
| `gripper_right_joint_torque` | 1 | -1 |

### google_robot/robot.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `gripper_right_finger` | 0.01 | 1.3 |
| `gripper_left_finger` | 0.01 | 1.3 |

### umi_gripper/umi_gripper.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `fingers_actuator` | 0 | 0.05 |

### robotiq_3f/model.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `palm_finger_1` | 0 | 0 |
| `palm_finger_2` | 0 | 0 |
| `finger_1_proximal` | 0.0495 | 1.15 |
| `finger_1_middle` | 0 | 1.45 |
| `finger_1_distal` | -0.0523 | -1.15 |
| `finger_2_proximal` | 0.0495 | 1.15 |
| `finger_2_middle` | 0 | 1.45 |
| `finger_2_distal` | -0.0523 | -1.15 |
| `finger_middle_proximal` | 0.0495 | 1.15 |
| `finger_middle_middle` | 0 | 1.45 |
| `finger_middle_distal` | -0.0523 | -1.15 |

### leap_hand/left_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `if_mcp_act` | 0 | 1.2 |
| `if_rot_act` | 0 | 0 |
| `if_pip_act` | 0 | 1.2 |
| `if_dip_act` | 0 | 1.2 |
| `mf_mcp_act` | 0 | 1.2 |
| `mf_rot_act` | 0 | 0 |
| `mf_pip_act` | 0 | 1.2 |
| `mf_dip_act` | 0 | 1.2 |
| `rf_mcp_act` | 0 | 1.2 |
| `rf_rot_act` | 0 | 0 |
| `rf_pip_act` | 0 | 1.2 |
| `rf_dip_act` | 0 | 1.2 |
| `th_cmc_act` | 0 | 1 |
| `th_axl_act` | 0 | 0.5 |
| `th_mcp_act` | 0 | 1.2 |
| `th_ipl_act` | 0 | 1.2 |

### wonik_allegro/left_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `ffa0` | 0 | 0 |
| `ffa1` | 0 | 1.2 |
| `ffa2` | 0 | 1.2 |
| `ffa3` | 0 | 1.2 |
| `mfa0` | 0 | 0 |
| `mfa1` | 0 | 1.2 |
| `mfa2` | 0 | 1.2 |
| `mfa3` | 0 | 1.2 |
| `rfa0` | 0 | 0 |
| `rfa1` | 0 | 1.2 |
| `rfa2` | 0 | 1.2 |
| `rfa3` | 0 | 1.2 |
| `tha0` | 0.263 | 1.2 |
| `tha1` | 0 | 0.3 |
| `tha2` | 0 | 1.2 |
| `tha3` | 0 | 1.2 |

### tetheria_aero_hand_open/left_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `left_index_A_tendon` | 0.110387 | 0.05852 |
| `left_middle_A_tendon` | 0.110387 | 0.05852 |
| `left_ring_A_tendon` | 0.110387 | 0.05852 |
| `left_pinky_A_tendon` | 0.110387 | 0.05852 |
| `left_thumb_A_cmc_abd` | 0 | 0 |
| `left_th1_A_tendon` | 0.038389 | 0.026152 |
| `left_th2_A_tendon` | 0.112138 | 0.081568 |

### shadow_hand/left_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `lh_A_THJ5` | 0 | 0.17 |
| `lh_A_THJ4` | 0 | 1.2 |
| `lh_A_THJ3` | 0 | 0 |
| `lh_A_THJ2` | 0 | 0.61 |
| `lh_A_THJ1` | 0 | 0.52 |
| `lh_A_FFJ4` | 0 | 0 |
| `lh_A_FFJ3` | 0 | 1.5708 |
| `lh_A_FFJ0` | 0 | 3.1415 |
| `lh_A_MFJ4` | 0 | 0 |
| `lh_A_MFJ3` | 0 | 1.5708 |
| `lh_A_MFJ0` | 0 | 3.1415 |
| `lh_A_RFJ4` | 0 | 0 |
| `lh_A_RFJ3` | 0 | 1.5708 |
| `lh_A_RFJ0` | 0 | 3.1415 |
| `lh_A_LFJ5` | 0 | 0 |
| `lh_A_LFJ4` | 0 | 0 |
| `lh_A_LFJ3` | 0 | 1.5708 |
| `lh_A_LFJ0` | 0 | 3.1415 |

### leap_hand/right_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `if_mcp_act` | 0 | 1.2 |
| `if_rot_act` | 0 | 0 |
| `if_pip_act` | 0 | 1.2 |
| `if_dip_act` | 0 | 1.2 |
| `mf_mcp_act` | 0 | 1.2 |
| `mf_rot_act` | 0 | 0 |
| `mf_pip_act` | 0 | 1.2 |
| `mf_dip_act` | 0 | 1.2 |
| `rf_mcp_act` | 0 | 1.2 |
| `rf_rot_act` | 0 | 0 |
| `rf_pip_act` | 0 | 1.2 |
| `rf_dip_act` | 0 | 1.2 |
| `th_cmc_act` | 0 | 1 |
| `th_axl_act` | 0 | 0.5 |
| `th_mcp_act` | 0 | 1.2 |
| `th_ipl_act` | 0 | 1.2 |

### wonik_allegro/right_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `ffa0` | 0 | 0 |
| `ffa1` | 0 | 1.2 |
| `ffa2` | 0 | 1.2 |
| `ffa3` | 0 | 1.2 |
| `mfa0` | 0 | 0 |
| `mfa1` | 0 | 1.2 |
| `mfa2` | 0 | 1.2 |
| `mfa3` | 0 | 1.2 |
| `rfa0` | 0 | 0 |
| `rfa1` | 0 | 1.2 |
| `rfa2` | 0 | 1.2 |
| `rfa3` | 0 | 1.2 |
| `tha0` | 0.263 | 1.2 |
| `tha1` | 0 | 0.3 |
| `tha2` | 0 | 1.2 |
| `tha3` | 0 | 1.2 |

### tetheria_aero_hand_open/right_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `right_index_A_tendon` | 0.110387 | 0.05852 |
| `right_middle_A_tendon` | 0.110387 | 0.05852 |
| `right_ring_A_tendon` | 0.110387 | 0.05852 |
| `right_pinky_A_tendon` | 0.110387 | 0.05852 |
| `right_thumb_A_cmc_abd` | 0 | 0 |
| `right_th1_A_tendon` | 0.038389 | 0.026152 |
| `right_th2_A_tendon` | 0.112138 | 0.081568 |

### shadow_hand/right_hand.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `rh_A_THJ5` | 0 | 0.17 |
| `rh_A_THJ4` | 0 | 1.2 |
| `rh_A_THJ3` | 0 | 0 |
| `rh_A_THJ2` | 0 | 0.61 |
| `rh_A_THJ1` | 0 | 0.52 |
| `rh_A_FFJ4` | 0 | 0 |
| `rh_A_FFJ3` | 0 | 1.5708 |
| `rh_A_FFJ0` | 0 | 3.1415 |
| `rh_A_MFJ4` | 0 | 0 |
| `rh_A_MFJ3` | 0 | 1.5708 |
| `rh_A_MFJ0` | 0 | 3.1415 |
| `rh_A_RFJ4` | 0 | 0 |
| `rh_A_RFJ3` | 0 | 1.5708 |
| `rh_A_RFJ0` | 0 | 3.1415 |
| `rh_A_LFJ5` | 0 | 0 |
| `rh_A_LFJ4` | 0 | 0 |
| `rh_A_LFJ3` | 0 | 1.5708 |
| `rh_A_LFJ0` | 0 | 3.1415 |

### critterapp/public/robotiq_2f85/2f85.xml

| Actuator | Open | Closed |
|---|---:|---:|
| `fingers_actuator` | 0 | 255 |
