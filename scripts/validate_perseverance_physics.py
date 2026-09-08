#!/usr/bin/env python3
"""Check Perseverance pose holding and wheel compliance in native MuJoCo.

Uses MuJoCo and NumPy from the active Python environment. A 12 cm rounded
obstacle is placed in one or both wheel tracks. The home pose settles for two
seconds, then wheel commands ramp to 3 rad/s over two seconds. Acceleration
metrics include the complete motion after settling, sampled every physics step.
Terrain solref is held at 0.015 1 for repeatability; other terrain settings and
editor exports need separate validation. All scenario edits are in memory.
"""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import mujoco as mj
import numpy as np
SOURCE = Path(__file__).resolve().parents[1] / 'robots/nasa_perseverance/perseverance.xml'
ASSET_DIR = None

def run(contact=None, terrain='both', speed=3, duration=14):
    root = ET.parse(SOURCE).getroot()
    for attr in ('meshdir', 'texturedir'):
        root.find('compiler').set(attr, str(ASSET_DIR or SOURCE.parent / 'assets'))
    if contact is not None:
        root.find(".//default[@class='wheel']/geom").set('solref', f'{contact} 1')
    world = root.find('worldbody')
    ET.SubElement(world, 'geom', name='ground', type='plane', size='0 0 .1', solref='.015 1')
    if terrain != 'flat':
        for side, y in [('left', 1.08), ('right', -1.08)]:
            if terrain == 'left' and side == 'right':
                continue
            ET.SubElement(world, 'geom', name='bump_' + side, type='cylinder', size='.12 .25', pos=f'2.5 {y} 0', euler='1.57079632679 0 0', solref='.015 1')
    model = mj.MjModel.from_xml_string(ET.tostring(root, encoding='unicode'))
    data = mj.MjData(model)
    mj.mj_resetDataKeyframe(model, data, 0)
    sus = [model.joint(n).qposadr[0] for n in ['left_rocker', 'right_rocker', 'left_bogie', 'right_bogie']]
    arm = [model.joint('arm_joint' + str(i)).qposadr[0] for i in range(1, 6)]
    drive = [a for a in range(model.nu) if model.actuator(a).name.endswith('_drive')]
    wheels = {model.geom(n + '_collision').id for n in ['wheel_lf', 'wheel_lm', 'wheel_lr', 'wheel_rf', 'wheel_rm', 'wheel_rr']}
    stats = []
    bad = set()
    bump_contacts = set()
    penetration = 0
    arm_error = np.zeros(5)
    for tick in range(int(duration / model.opt.timestep)):
        time = data.time
        data.ctrl[drive] = speed * min(max((time - 2) / 2, 0), 1)
        mj.mj_step(model, data)
        if not (np.all(np.isfinite(data.qpos)) and np.all(np.isfinite(data.qvel))):
            raise RuntimeError('Non-finite state')
        if time < 2:
            continue
        touched = set()
        for c in data.contact:
            g1, g2 = map(int, c.geom)
            names = [model.geom(g1).name, model.geom(g2).name]
            terrain_contact = any((n == 'ground' or n.startswith('bump_') for n in names))
            if terrain_contact:
                touched.update(wheels.intersection((g1, g2)))
                penetration = max(penetration, -c.dist)
                if not wheels.intersection((g1, g2)):
                    bad.add(tuple(names))
            if any((n.startswith('bump_') for n in names)):
                bump_contacts.update(wheels.intersection((g1, g2)))
        arm_error = np.maximum(arm_error, np.abs(data.qpos[arm]))
        stats.append([data.time, data.qpos[0], data.qpos[2], data.qvel[2], len(touched), *data.qpos[sus]])
    x = np.array(stats)
    vertical_acc = np.diff(x[:, 3]) / model.opt.timestep
    report = dict(
        contact_override=contact,
        terrain=terrain,
        speed=speed,
        distance=round(float(x[-1, 1]), 3),
        vertical_acc_rms=round(float(np.sqrt(np.mean(vertical_acc ** 2))), 3),
        vertical_acc_peak=round(float(np.max(np.abs(vertical_acc))), 3),
        wheel_contact_mean=round(float(x[:, 4].mean()), 2),
        suspension_max_deg=np.rad2deg(np.max(np.abs(x[:, 5:]), axis=0)).round(2).tolist(),
        arm_max_error_deg=np.rad2deg(arm_error).round(2).tolist(),
        arm_final_error_deg=np.rad2deg(np.abs(data.qpos[arm])).round(3).tolist(),
        penetration_mm=round(penetration * 1000, 2),
        bump_wheels=len(bump_contacts),
        nonwheel_terrain_contacts=list(bad),
        warnings=[int(w.number) for w in data.warning],
    )
    if terrain == 'flat':
        holding_errors = {}
        for a in range(model.nu):
            if not model.actuator(a).name.endswith('_hold'):
                continue
            joint = model.actuator_trnid[a, 0]
            error = abs(float(data.qpos[model.jnt_qposadr[joint]] - data.ctrl[a]))
            is_slide = model.jnt_type[joint] == mj.mjtJoint.mjJNT_SLIDE
            holding_errors[model.actuator(a).name] = error
            assert error < (0.001 if is_slide else np.deg2rad(1)), holding_errors
        report['holding_errors_radians_or_meters'] = holding_errors
    assert not any(report['warnings']), report
    assert not report['nonwheel_terrain_contacts'], report
    assert report['penetration_mm'] < 15, report
    assert max(report['arm_max_error_deg']) < 4, report
    print(json.dumps(report), flush=True)
    return report
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model', type=Path, default=SOURCE)
    parser.add_argument('--asset-dir', type=Path)
    args = parser.parse_args()
    SOURCE = args.model.resolve()
    ASSET_DIR = args.asset_dir.resolve() if args.asset_dir else None
    run(terrain='flat', speed=0, duration=10)
    for terrain, count in [('both', 6), ('left', 3)]:
        # Isolate wheel compliance by using the shipped arm gains in both runs.
        baseline = run(contact=0.015, terrain=terrain)
        tuned = run(terrain=terrain)
        assert tuned['bump_wheels'] == count, tuned
        assert tuned['distance'] > 5, tuned
        assert tuned['vertical_acc_peak'] < 0.7 * baseline['vertical_acc_peak'], tuned
        assert tuned['vertical_acc_rms'] < 0.8 * baseline['vertical_acc_rms'], tuned
    print('Perseverance hold and bump regressions passed.')
