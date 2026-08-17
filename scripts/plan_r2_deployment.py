#!/usr/bin/env python3
"""Build stable and immutable R2 upload plans for changed robot assets."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess


def read_lines(path: Path) -> list[str]:
    if not path.is_file():
        return []
    return [
        line.strip().replace("\\", "/")
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def tracked_files(directory: str) -> list[Path]:
    output = subprocess.check_output(
        ["git", "ls-files", "-z", "--", directory], text=False
    )
    return sorted(
        Path(path)
        for path in output.decode().split("\0")
        if path and Path(path).is_file()
    )


def content_release(files: list[Path], directory: Path) -> str:
    digest = hashlib.sha256()
    for file_path in files:
        relative_path = file_path.relative_to(directory).as_posix().encode()
        digest.update(relative_path)
        digest.update(b"\0")
        digest.update(file_path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def write_uploads(path: Path, uploads: list[tuple[str, str]]) -> None:
    path.write_text(
        "".join(f"{source}\t{key}\n" for source, key in uploads),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--changed-files", type=Path, required=True)
    parser.add_argument("--robot-directories", type=Path, required=True)
    parser.add_argument("--config", type=Path, default=Path("immutable_assets.json"))
    parser.add_argument("--output-directory", type=Path, default=Path(".r2-deployment"))
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    immutable_robots = {
        str(robot_id).strip() for robot_id in config.get("robots", []) if str(robot_id).strip()
    }
    changed_files = read_lines(args.changed_files)
    robot_directories = read_lines(args.robot_directories)
    output_directory = args.output_directory
    manifest_directory = output_directory / "manifests"
    manifest_directory.mkdir(parents=True, exist_ok=True)

    stable_uploads: list[tuple[str, str]] = []
    immutable_uploads: list[tuple[str, str]] = []
    manifest_uploads: list[tuple[str, str]] = []

    for changed_file in changed_files:
        parts = PurePosixPath(changed_file).parts
        robot_id = parts[1] if len(parts) > 2 and parts[0] == "robots" else None
        if robot_id not in immutable_robots:
            stable_uploads.append((changed_file, changed_file))

    for directory_name in robot_directories:
        directory = Path(directory_name)
        parts = PurePosixPath(directory_name).parts
        if len(parts) != 2 or parts[0] != "robots" or parts[1] not in immutable_robots:
            continue
        files = tracked_files(directory_name)
        if not files:
            continue
        release = content_release(files, directory)
        release_prefix = f"releases/{directory.as_posix()}/{release}"
        for file_path in files:
            relative_path = file_path.relative_to(directory).as_posix()
            immutable_uploads.append((file_path.as_posix(), f"{release_prefix}/{relative_path}"))

        manifest = {
            "schemaVersion": 1,
            "release": release,
            "basePath": f"/{release_prefix}/",
        }
        manifest_path = manifest_directory / f"{parts[1]}.json"
        manifest_path.write_text(
            json.dumps(manifest, separators=(",", ":")) + "\n", encoding="utf-8"
        )
        manifest_uploads.append(
            (manifest_path.as_posix(), f"manifests/robots/{parts[1]}.json")
        )

    write_uploads(output_directory / "stable-uploads.tsv", stable_uploads)
    write_uploads(output_directory / "immutable-uploads.tsv", immutable_uploads)
    write_uploads(output_directory / "manifest-uploads.tsv", manifest_uploads)
    print(
        f"Planned {len(stable_uploads)} stable files, "
        f"{len(immutable_uploads)} immutable files, and {len(manifest_uploads)} manifests."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
