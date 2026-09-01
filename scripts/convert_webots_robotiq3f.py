#!/usr/bin/env python3
"""Extract the six inline Webots Robotiq 3F meshes as deterministic OBJ files."""

from __future__ import annotations

import argparse
from pathlib import Path
import re


MESH_NAMES = (
    "base_black",
    "base_metal",
    "finger_distal",
    "finger_middle",
    "finger_proximal",
    "finger_palm",
)
NUMBER_RE = re.compile(r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?")


def balanced_block(text: str, start: int) -> str:
    brace = text.index("{", start)
    depth = 0
    for index in range(brace, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[brace + 1 : index]
    raise ValueError("Unterminated IndexedFaceSet block")


def bracket_contents(block: str, label: str) -> str:
    match = re.search(rf"\b{re.escape(label)}\s*\[", block)
    if not match:
        raise ValueError(f"Missing {label} array")
    start = match.end()
    end = block.index("]", start)
    return block[start:end]


def parse_meshes(proto: str) -> list[tuple[list[tuple[float, float, float]], list[list[int]]]]:
    marker = "geometry IndexedFaceSet"
    starts = [match.start() for match in re.finditer(marker, proto)]
    if len(starts) != len(MESH_NAMES):
        raise ValueError(f"Expected {len(MESH_NAMES)} meshes, found {len(starts)}")

    meshes = []
    for start in starts:
        block = balanced_block(proto, start)
        point_match = re.search(r"\bpoint\s*\[", block)
        if not point_match:
            raise ValueError("Missing point array")
        point_start = point_match.end()
        point_end = block.index("]", point_start)
        coordinates = [float(value) for value in NUMBER_RE.findall(block[point_start:point_end])]
        if len(coordinates) % 3:
            raise ValueError("Point array length is not divisible by three")
        vertices = [tuple(coordinates[i : i + 3]) for i in range(0, len(coordinates), 3)]

        raw_indices = [int(value) for value in NUMBER_RE.findall(bracket_contents(block, "coordIndex"))]
        polygons: list[list[int]] = []
        polygon: list[int] = []
        for value in raw_indices:
            if value == -1:
                if len(polygon) >= 3:
                    polygons.append(polygon)
                polygon = []
            else:
                polygon.append(value)
        if polygon:
            polygons.append(polygon)
        if any(index < 0 or index >= len(vertices) for face in polygons for index in face):
            raise ValueError("Face index is outside the vertex array")
        meshes.append((vertices, polygons))
    return meshes


def write_obj(path: Path, vertices: list[tuple[float, float, float]], polygons: list[list[int]]) -> int:
    triangles = []
    for polygon in polygons:
        for index in range(1, len(polygon) - 1):
            triangles.append((polygon[0], polygon[index], polygon[index + 1]))

    lines = [
        "# Derived from Cyberbotics Webots R2025a Robotiq3fGripper.proto",
        "# Source: https://github.com/cyberbotics/webots/blob/R2025a/projects/devices/robotiq/protos/Robotiq3fGripper.proto",
        "# License: Apache License 2.0; see ../LICENSE and ../NOTICE",
        f"o {path.stem}",
    ]
    lines.extend(f"v {x:.9g} {y:.9g} {z:.9g}" for x, y, z in vertices)
    lines.extend(f"f {a + 1} {b + 1} {c + 1}" for a, b, c in triangles)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return len(triangles)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("proto", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    meshes = parse_meshes(args.proto.read_text(encoding="utf-8"))
    args.output.mkdir(parents=True, exist_ok=True)
    for name, (vertices, polygons) in zip(MESH_NAMES, meshes, strict=True):
        triangles = write_obj(args.output / f"{name}.obj", vertices, polygons)
        print(f"{name}: {len(vertices)} vertices, {triangles} triangles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
