import tempfile
import unittest
from pathlib import Path

from validate_robot_assets import validate_xml


class ValidateIncludesTests(unittest.TestCase):
    def test_included_compiler_applies_to_scene_texture(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "assets").mkdir()
            texture = root / "assets" / "wood.png"
            texture.touch()
            (root / "robot.xml").write_text('<mujoco><compiler assetdir="assets"/></mujoco>')
            scene = root / "scene.xml"
            scene.write_text('<mujoco><include file="robot.xml"/><asset><texture file="wood.png"/></asset></mujoco>')
            self.assertEqual(validate_xml(scene), [])
            texture.unlink()
            self.assertIn("missing texture", validate_xml(scene)[0])

    def test_missing_and_cyclic_includes_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            scene = Path(directory) / "scene.xml"
            scene.write_text('<mujoco><include file="missing.xml"/></mujoco>')
            self.assertIn("invalid include", validate_xml(scene)[0])
            scene.write_text('<mujoco><include file="scene.xml"/></mujoco>')
            self.assertIn("cyclic include", validate_xml(scene)[0])


if __name__ == "__main__":
    unittest.main()
