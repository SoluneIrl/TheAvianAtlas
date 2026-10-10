import argparse
import csv
import datetime
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = ImageOps = None

DATA_DIR = Path(__file__).resolve().parent
ROOT = DATA_DIR.parent
GAMES_DIR = ROOT / "Assets" / "Games"
DEV_DIR = ROOT / "Assets" / "Dev"
THUMBS_DIR = ROOT / "Assets" / "Thumbs"
BIRDS_CSV = DATA_DIR / "birds.csv"
DEV_CSV = DATA_DIR / "dev.csv"

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
CONVERTIBLE_EXTS = {".png", ".jpg", ".jpeg"}
THUMB_SRC_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
PLACEHOLDER_TEXT = "TODO: describe this update"
RESAMPLE = Image.Resampling.LANCZOS if Image and hasattr(Image, "Resampling") else getattr(Image, "LANCZOS", None)

def natural_key(name):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r"(\d+)", name)]

def list_images(folder):
    """Top-level image files in a folder, naturally sorted (empty if folder missing)."""
    if not folder.is_dir():
        return []
    files = [p for p in folder.iterdir()
             if p.is_file() and not p.name.startswith(".") and p.suffix.lower() in IMAGE_EXTS]
    return sorted(files, key=lambda p: natural_key(p.name))

def has_alpha(im):
    return im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)

def split_images(value):
    return [p.strip() for p in re.split(r"\s*\|\s*", value or "") if p.strip()]

def smart_capitalize(text):
    out = []
    for word in text.split(" "):
        for i, ch in enumerate(word):
            if ch.isalpha():
                word = word[:i] + ch.upper() + word[i + 1:]
                break
        out.append(word)
    return " ".join(out)


def iso_mtime(path):
    return datetime.date.fromtimestamp(path.stat().st_mtime).isoformat()

def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{int(n)} B" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024

def read_csv(path):
    if not path.is_file():
        return []
    with open(path, "r", newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_csv(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)

def convert_folder_to_webp(folder, quality):
    """Convert PNG/JPG in `folder` to .webp and delete the originals."""
    converted, skipped = 0, []
    if Image is None or not folder.is_dir():
        return converted, skipped

    for src in sorted(folder.iterdir()):
        if not src.is_file() or src.name.startswith(".") or src.suffix.lower() not in CONVERTIBLE_EXTS:
            continue
        dest = src.with_suffix(".webp")
        if dest.exists():
            skipped.append(f"{src.name} (a .webp with that name already exists)")
            continue
        try:
            with Image.open(src) as im:
                if getattr(im, "is_animated", False):
                    skipped.append(f"{src.name} (animated - kept as is)")
                    continue
                icc = im.info.get("icc_profile")
                im = ImageOps.exif_transpose(im)
                im = im.convert("RGBA" if has_alpha(im) else "RGB")
                kwargs = {"quality": quality, "method": 6}
                if icc:
                    kwargs["icc_profile"] = icc
                im.save(dest, "WEBP", **kwargs)
            src.unlink()
            converted += 1
        except Exception as exc:
            skipped.append(f"{src.name} ({exc})")
            dest.unlink(missing_ok=True)
    return converted, skipped

def rebuild_birds_csv():
    header = ["game", "id", "title", "image", "credit", "date"]
    if not GAMES_DIR.is_dir():
        print(f"Heads up - couldn't find {GAMES_DIR}\nSkipped rebuilding birds.csv.")
        return

    memory = {"credit": {}, "date": {}}
    for row in read_csv(BIRDS_CSV):
        game = (row.get("game") or "").strip().lower()
        image = os.path.basename((row.get("image") or "").strip())
        title = (row.get("title") or "").strip().lower()
        for field in memory:
            value = (row.get(field) or "").strip()
            if value:
                if image:
                    memory[field][("img", game, image)] = value
                memory[field][("title", game, title)] = value

    def recall(field, game, image, title):
        g = game.lower()
        return (memory[field].get(("img", g, image))
                or memory[field].get(("title", g, title.lower()), ""))

    games = sorted((p for p in GAMES_DIR.iterdir() if p.is_dir()), key=lambda p: p.name.lower())
    rows, empty = [], []
    credits_kept = dates_kept = 0

    for game in games:
        files = list_images(game)
        if not files:
            empty.append(game.name)
        for i, f in enumerate(files, start=1):
            title = smart_capitalize(f.stem.replace("_", " "))
            credit = recall("credit", game.name, f.name, title)
            date = recall("date", game.name, f.name, title)
            credits_kept += bool(credit)
            dates_kept += bool(date)
            rows.append([game.name, i, title, f.name, credit, date or iso_mtime(f)])

    write_csv(BIRDS_CSV, header, rows)
    print("birds.csv rebuilt!")
    print(f"  Games found: {len(games)}  |  Total entries: {len(rows)}")
    print(f"  Credits kept: {credits_kept}  |  Dates kept: {dates_kept}  |  Dates backfilled: {len(rows) - dates_kept}")
    if empty:
        print(f"  Game folders with no images: {', '.join(empty)}")

def update_dev_csv():
    header = ["date", "text", "img"]
    rows = [[(r.get("date") or "").strip(), (r.get("text") or "").strip(), (r.get("img") or "").strip()]
            for r in read_csv(DEV_CSV)]

    for row in rows:
        updated = []
        for img in split_images(row[2]):
            stem, ext = os.path.splitext(img)
            if ext.lower() in CONVERTIBLE_EXTS and not (DEV_DIR / img).is_file() and (DEV_DIR / (stem + ".webp")).is_file():
                img = stem + ".webp"
            updated.append(img)
        row[2] = " | ".join(updated)

    known = {os.path.basename(i) for row in rows for i in split_images(row[2])}
    new_rows = [[iso_mtime(f), PLACEHOLDER_TEXT, f.name] for f in list_images(DEV_DIR) if f.name not in known]

    write_csv(DEV_CSV, header, rows + new_rows)
    print("dev.csv updated!")
    print(f"  Existing entries kept: {len(rows)}  |  New image rows added: {len(new_rows)}")
    for date, _, name in new_rows:
        print(f"    - {date}  {name}   (edit its \"text\" in dev.csv)")
    if not DEV_DIR.is_dir():
        print(f"  Heads up, couldn't find {DEV_DIR}; existing rows were left as is.")

def make_thumb(job):
    src, dest, size, quality = job
    try:
        with Image.open(src) as im:
            if getattr(im, "is_animated", False):
                return src, "animated", 0, 0
            im = ImageOps.exif_transpose(im)
            im.thumbnail((size, size), RESAMPLE)  # only ever shrinks
            im = im.convert("RGBA" if has_alpha(im) else "RGB")
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, "WEBP", quality=quality, method=6)
        return src, "ok", src.stat().st_size, dest.stat().st_size
    except Exception as exc:
        return src, f"failed: {exc}", 0, 0


def generate_thumbs(size, quality, force, prune, workers):
    if not GAMES_DIR.is_dir():
        print(f"Can't find {GAMES_DIR} - skipped thumbnails.")
        return True

    jobs, expected, up_to_date = [], set(), 0
    for src in sorted(p for p in GAMES_DIR.rglob("*") if p.is_file() and p.suffix.lower() in THUMB_SRC_EXTS):
        dest = Path(str(THUMBS_DIR / src.relative_to(GAMES_DIR)) + ".webp")
        expected.add(dest)
        if not force and dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            up_to_date += 1
        else:
            jobs.append((src, dest, size, quality))

    made = animated = failed = 0
    src_bytes = thumb_bytes = 0
    if jobs:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            for src, status, sb, tb in pool.map(make_thumb, jobs):
                if status == "ok":
                    made += 1
                    src_bytes += sb
                    thumb_bytes += tb
                elif status == "animated":
                    animated += 1
                    print(f"  skipped  {src} (animated - the site will use the original)")
                else:
                    failed += 1
                    print(f"  {status.split(':')[0]}   {src}:{status.split(':', 1)[1]}")

    orphans = [p for p in THUMBS_DIR.rglob("*.webp") if p not in expected] if THUMBS_DIR.is_dir() else []
    if orphans and prune:
        for p in orphans:
            p.unlink()
        for d in sorted((d for d in THUMBS_DIR.rglob("*") if d.is_dir()), reverse=True):
            if not any(d.iterdir()):
                d.rmdir()

    print(f"Thumbnails: created {made}, up to date {up_to_date}, animated/skipped {animated}, failed {failed}.")
    if made:
        saved = 100 * (1 - thumb_bytes / max(src_bytes, 1))
        print(f"  {human(src_bytes)} of originals -> {human(thumb_bytes)} ({saved:.0f}% smaller)")
    if orphans:
        print(f"  {len(orphans)} orphaned thumbnail(s) " + ("removed." if prune else "found - kept because of --no-prune."))
    return failed == 0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--size", type=int, default=480)
    ap.add_argument("--quality", type=int, default=80)
    ap.add_argument("--webp-quality", type=int, default=85)
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-prune", action="store_true", help="keep orphaned thumbnails instead of deleting them")
    ap.add_argument("--skip-convert", action="store_true")
    ap.add_argument("--skip-csv", action="store_true")
    ap.add_argument("--skip-thumbs", action="store_true")
    args = ap.parse_args()

    needs_pillow = not (args.skip_convert and args.skip_thumbs)
    if Image is None and needs_pillow:
        print("Note: Pillow isn't installed, so conversion and thumbnails are skipped.  Run: pip install Pillow")
        args.skip_convert = args.skip_thumbs = True

    print()
    if not args.skip_convert:
        total, skipped = 0, []
        folders = [DEV_DIR]
        if GAMES_DIR.is_dir():
            folders += sorted(p for p in GAMES_DIR.iterdir() if p.is_dir())
        for folder in folders:
            n, s = convert_folder_to_webp(folder, args.webp_quality)
            total += n
            skipped += [f"{folder.name}/{x}" for x in s]
        print(f"Converted to .webp: {total}")
        if skipped:
            print(f"Not converted ({len(skipped)}):")
            for s in skipped:
                print(f"  - {s}")
        print()

    if not args.skip_csv:
        rebuild_birds_csv()
        print()
        update_dev_csv()
        print()

    ok = True
    if not args.skip_thumbs:
        ok = generate_thumbs(args.size, args.quality, args.force, not args.no_prune, args.workers)
        print()
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())