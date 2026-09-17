#!/usr/bin/env python3
"""Validate local file references in MuJoCo XML robot assets."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


def validate_xml(xml_path: Path) -> list[str]:
    """Return missing local references for one XML file."""
    try:
        root = ET.parse(xml_path).getroot()
    except ET.ParseError as error:
        return [f"{xml_path}: invalid XML: {error}"]

    def expand_includes(element: ET.Element, source: Path, ancestors: set[Path]) -> None:
        for child in list(element):
            if child.tag != "include":
                expand_includes(child, source, ancestors)
                continue
            reference = child.get("file", "")
            included_path = (source.parent / reference).resolve()
            if included_path in ancestors:
                raise ValueError(f"cyclic include {reference!r}")
            included = ET.parse(included_path).getroot()
            expand_includes(included, included_path, ancestors | {included_path})
            index = list(element).index(child)
            element.remove(child)
            for offset, included_child in enumerate(included):
                element.insert(index + offset, included_child)

    try:
        expand_includes(root, xml_path, {xml_path.resolve()})
    except (OSError, ET.ParseError, ValueError) as error:
        return [f"{xml_path}: invalid include: {error}"]

    compiler = root.find("compiler")
    asset_dir = compiler.get("assetdir", "") if compiler is not None else ""
    mesh_dir = compiler.get("meshdir", asset_dir) if compiler is not None else ""
    texture_dir = compiler.get("texturedir", asset_dir) if compiler is not None else ""
    missing: list[str] = []

    for element in root.iter():
        reference = element.get("file")
        if not reference or "://" in reference:
            continue

        base_dir = xml_path.parent
        if element.tag == "mesh":
            base_dir /= mesh_dir
        elif element.tag == "texture":
            base_dir /= texture_dir

        referenced_path = (base_dir / reference).resolve()
        if not referenced_path.is_file():
            missing.append(f"{xml_path}: missing {element.tag} file {reference!r}")

    return missing


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("directories", nargs="+", type=Path)
    args = parser.parse_args()

    xml_files = sorted(
        path
        for directory in args.directories
        for path in directory.rglob("*.xml")
        if directory.is_dir()
    )
    errors = [error for xml_file in xml_files for error in validate_xml(xml_file)]

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print(f"Validated {len(xml_files)} XML files in {len(args.directories)} robot directories.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
