#!/usr/bin/env python3
"""Build manifest.json by scanning every plan folder in the repo root.

A "plan folder" is any top-level directory containing a `plan.md` file.
For each one we extract YAML front matter (title/status/owner/created/
last_updated/mockup) and list every sibling `*.html` file as a mockup
variant. Last-changed-by/at come from the most recent commit touching
the folder.
"""

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML not installed; run `pip install pyyaml`.", file=sys.stderr)
    sys.exit(1)

ROOT = Path(".")
SKIP_DIRS = {".git", ".github", "node_modules"}


def parse_front_matter(text: str) -> dict:
    """Return YAML front matter as a dict, or {} if missing/invalid."""
    if not text.startswith("---\n"):
        return {}
    try:
        # Split on the closing --- marker.
        _, fm, _ = text.split("---\n", 2)
        data = yaml.safe_load(fm)
        return data if isinstance(data, dict) else {}
    except (ValueError, yaml.YAMLError):
        return {}


def last_changed(folder: Path) -> tuple[str, str]:
    """Return (author_name, ISO date) of the most recent commit touching folder."""
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--pretty=format:%an|%aI", "--", str(folder)],
            text=True,
        ).strip()
        if "|" in out:
            name, iso = out.split("|", 1)
            return name, iso
    except subprocess.CalledProcessError:
        pass
    return "", ""


def normalize_home_name(home_value, mockup_names):
    """Resolve the front-matter `home` value against the actual mockup file
    stems. Accepts the value with or without `.html`. Case-insensitive match.
    Returns the matching stem, or None if no match."""
    if not home_value or not mockup_names:
        return None
    target = str(home_value).strip().lower()
    if target.endswith(".html"):
        target = target[:-5]
    for name in mockup_names:
        if name.lower() == target:
            return name
    return None


def build():
    plans = []
    for folder in sorted(ROOT.iterdir()):
        if not folder.is_dir() or folder.name in SKIP_DIRS:
            continue
        plan_path = folder / "plan.md"
        if not plan_path.exists():
            continue

        meta = parse_front_matter(plan_path.read_text())
        mockups = sorted(
            [
                {"name": p.stem, "path": str(p).replace("\\", "/")}
                for p in folder.glob("*.html")
            ],
            key=lambda m: m["name"],
        )

        # Determine the "home" mockup — the one a viewer should open first.
        # Priority:
        #   1. Front matter `home:` field (with or without .html extension)
        #   2. If only one mockup exists, use it
        #   3. First alphabetically
        mockup_names = [m["name"] for m in mockups]
        home_name = normalize_home_name(meta.get("home"), mockup_names)
        if not home_name and mockup_names:
            home_name = mockup_names[0]
        for m in mockups:
            m["is_home"] = (m["name"] == home_name)

        author, when = last_changed(folder)

        plans.append({
            "slug": folder.name,
            "title": meta.get("title", folder.name),
            "status": meta.get("status", "unknown"),
            "owner": meta.get("owner", ""),
            "created": str(meta.get("created", "")),
            "last_updated": str(meta.get("last_updated", "")),
            "last_changed_by": author,
            "last_changed_at": when,
            "has_plan": True,
            "has_changelog": (folder / "CHANGELOG.md").exists(),
            "mockups": mockups,
        })

    manifest = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "plans": plans,
    }
    Path("manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote manifest.json with {len(plans)} plan folder(s).")


if __name__ == "__main__":
    build()
