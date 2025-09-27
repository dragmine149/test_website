#!/usr/bin/env python3
# tree_to_json.py
# Created by T3 Chat (GPT-5 mini). Credit: T3 Chat.
# Generates one big JSON tree and one JSON per top-level subdir.
# Usage: python3 tree_to_json.py [output-dir]
# Default output dir: ./tree_json

from __future__ import annotations

from pathlib import Path
from typing import Any
import json

ROOT_DIR: Path = Path(".").resolve()
SAVE_DIR: Path = Path("/tmp/temp_save")

def build_tree(dirpath: Path, recursive: bool = True) -> dict[str, Any]:
    """
    Recursively build a tree representation for the directory.

    Structure example:
    { "files": ["fileA", "fileB"], "subdir": { "files": ["..."] }, ... }

    Args:
        dirpath: Path to a directory to scan.

    Returns:
        A dictionary representing the directory tree.
    """
    node: dict[str, Any] = {}
    files: list[str] = []

    try:
        entries = sorted(dirpath.iterdir())
    except PermissionError:
        return node

    node["dirs"] = {}
    node["files"] = []

    for p in entries:
        name: str = p.name
        is_file: bool = p.is_file()
        is_dir: bool = p.is_dir()

        if is_file:
            files.append(name)
            continue

        if is_dir and recursive:
            node["dirs"][name] = build_tree(p)
            continue

    if files:
        node["files"] = files

    return node


def write_json(path: Path, data: dict[str, Any]) -> None:
    """
    Write JSON to path, creating parent directories if needed.

    Args:
        path: Path where JSON will be written.
        data: Serializable data to dump.
    """

    SAVE_DIR.mkdir(exist_ok=True)
    save_path = SAVE_DIR.joinpath(path)

    text: str = json.dumps(data, indent=2, ensure_ascii=False)
    _ = save_path.write_text(text)


def main(_argv: list[str] | None = None) -> int:
    """
    Main entrypoint.

    Args:
        argv: Optional list of CLI args (defaults to sys.argv).

    Returns:
        Exit code (0 on success).
    """

    for entry in sorted(ROOT_DIR.iterdir()):
        if not entry.is_dir():
            continue
        if entry.name.startswith(".") or entry.name == "Scripts":
            continue
        subtree: dict[str, Any] = build_tree(entry)
        write_json(Path(f"{entry.name}.json"), subtree)


    write_json(Path("root.json"), build_tree(ROOT_DIR, False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
