import argparse
import datetime
import hashlib
import json
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
THUMBS_DIR = ROOT / "Assets" / "Thumbs"        # 480px  - grid cards (1x)
THUMBS_2X_DIR = ROOT / "Assets" / "Thumbs2x"   # 960px  - grid cards on high-DPI screens (srcset 2x)
MID_DIR = ROOT / "Assets" / "Mid"              # 1600px - lightbox
BIRDS_JSON = DATA_DIR / "birds.json"
DEV_JSON = DATA_DIR / "dev.json"
CREDITS_JSON = DATA_DIR / "credits.json"
SITEMAP = ROOT / "sitemap.xml"
INDEX_HTML = ROOT / "index.html"
APP_JS = ROOT / "app.js"
STYLES_CSS = ROOT / "styles.css"

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

def text_of(value):
    return "" if value is None else str(value).strip()


def read_json(path):
    """Load a JSON array of objects ([] if the file doesn't exist yet).

    A file that exists but can't be parsed stops the script instead of being
    treated as empty - otherwise a typo could wipe saved credits and dates.
    """
    if not path.is_file():
        return []
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        sys.exit(f"Couldn't parse {path.name}: {exc}\nFix the JSON and run again - nothing was changed.")
    if not isinstance(data, list):
        sys.exit(f"{path.name} should be a JSON array at the top level - nothing was changed.")
    return [row for row in data if isinstance(row, dict)]


def write_json(path, rows, one_per_line=False):
    """Write a JSON array; returns True if the file's content actually changed."""
    if one_per_line and rows:
        body = ",\n".join("  " + json.dumps(r, ensure_ascii=False) for r in rows)
        text = "[\n" + body + "\n]\n"
    else:
        text = json.dumps(rows, ensure_ascii=False, indent=2) + "\n"
    if path.is_file():
        with open(path, "r", newline="", encoding="utf-8") as f:
            if f.read() == text:
                return False
    with open(path, "w", newline="\n", encoding="utf-8") as f:
        f.write(text)
    return True

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
                kwargs = {"quality": quality, "method": 4}
                if icc:
                    kwargs["icc_profile"] = icc
                im.save(dest, "WEBP", **kwargs)
            src.unlink()
            converted += 1
        except Exception as exc:
            skipped.append(f"{src.name} ({exc})")
            dest.unlink(missing_ok=True)
    return converted, skipped

def read_credits():
    """Load credits.json as {game: {image filename: credit}} ({} if it doesn't exist yet).

    Like read_json, a file that can't be parsed stops the script instead of being
    treated as empty.
    """
    if not CREDITS_JSON.is_file():
        return {}
    try:
        with open(CREDITS_JSON, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except json.JSONDecodeError as exc:
        sys.exit(f"Couldn't parse {CREDITS_JSON.name}: {exc}\nFix the JSON and run again - nothing was changed.")
    if not isinstance(data, dict) or not all(isinstance(v, dict) for v in data.values()):
        sys.exit(f'{CREDITS_JSON.name} should look like {{"Game": {{"image.webp": "Credit"}}}} - nothing was changed.')
    return {text_of(g): {text_of(i): text_of(c) for i, c in imgs.items() if text_of(c)}
            for g, imgs in data.items()}


def legacy_credits(rows):
    """One-time migration: pull the old per-row "credit" fields out of birds.json."""
    credits = {}
    for row in rows:
        credit = text_of(row.get("credit"))
        image = os.path.basename(text_of(row.get("image")))
        if credit and image:
            credits.setdefault(text_of(row.get("game")), {})[image] = credit
    return credits


def rebuild_birds_json():
    if not GAMES_DIR.is_dir():
        print(f"Heads up - couldn't find {GAMES_DIR}\nSkipped rebuilding birds.json.")
        return False

    old_rows = read_json(BIRDS_JSON)

    # Credits live in credits.json (hand-edited). If it doesn't exist yet, seed it once
    # from any credits still sitting in birds.json.
    if CREDITS_JSON.is_file():
        credits = read_credits()
    else:
        credits = legacy_credits(old_rows)
        if credits:
            write_json(CREDITS_JSON, credits)
            print(f"Created {CREDITS_JSON.name} from the credits that were in birds.json.")

    # Dates are remembered from the previous birds.json so they survive rebuilds.
    dates = {}
    for row in old_rows:
        date = text_of(row.get("date"))
        if not date:
            continue
        game = text_of(row.get("game")).lower()
        image = os.path.basename(text_of(row.get("image")))
        title = text_of(row.get("title")).lower()
        if image:
            dates[("img", game, image)] = date
        dates[("title", game, title)] = date

    def recall_date(game, image, title):
        g = game.lower()
        return dates.get(("img", g, image)) or dates.get(("title", g, title.lower()), "")

    games = sorted((p for p in GAMES_DIR.iterdir() if p.is_dir()), key=lambda p: p.name.lower())
    rows, empty = [], []
    credits_used = dates_kept = 0
    seen = set()

    for game in games:
        files = list_images(game)
        if not files:
            empty.append(game.name)
        for i, f in enumerate(files, start=1):
            title = smart_capitalize(f.stem.replace("_", " ")).strip()
            date = recall_date(game.name, f.name, title)
            dates_kept += bool(date)
            credits_used += bool(credits.get(game.name, {}).get(f.name))
            seen.add((game.name, f.name))
            rows.append({
                "game": game.name,
                "id": i,
                "title": title,
                "image": f.name,
                "date": date or iso_mtime(f),
            })

    orphans = [(g, img, c) for g, imgs in credits.items() for img, c in imgs.items() if (g, img) not in seen]

    changed = write_json(BIRDS_JSON, rows, one_per_line=True)
    print("birds.json rebuilt!" + ("" if changed else " (no changes)"))
    print(f"  Games found: {len(games)}  |  Total entries: {len(rows)}")
    print(f"  Credits applied: {credits_used}  |  Dates kept: {dates_kept}  |  Dates backfilled: {len(rows) - dates_kept}")
    if empty:
        print(f"  Game folders with no images: {', '.join(empty)}")
    if orphans:
        print(f"  {len(orphans)} credit(s) in {CREDITS_JSON.name} match no image (renamed or deleted?):")
        for g, img, c in orphans:
            print(f"    - {g} / {img}  ({c})")
    return changed

def as_list(value):
    """An `img` value as a clean list (accepts a JSON list or an old 'a | b' string)."""
    if isinstance(value, list):
        return [text_of(v) for v in value if text_of(v)]
    return split_images(text_of(value))


def update_dev_json():
    rows = []
    for r in read_json(DEV_JSON):
        text = r.get("text")
        text = [text_of(t) for t in text] if isinstance(text, list) else text_of(text)
        rows.append({"date": text_of(r.get("date")), "text": text, "img": as_list(r.get("img"))})

    for row in rows:
        updated = []
        for img in row["img"]:
            stem, ext = os.path.splitext(img)
            if ext.lower() in CONVERTIBLE_EXTS and not (DEV_DIR / img).is_file() and (DEV_DIR / (stem + ".webp")).is_file():
                img = stem + ".webp"
            updated.append(img)
        row["img"] = updated

    known = {os.path.basename(i) for row in rows for i in row["img"]}
    new_rows = [{"date": iso_mtime(f), "text": [PLACEHOLDER_TEXT], "img": [f.name]}
                for f in list_images(DEV_DIR) if f.name not in known]

    changed = write_json(DEV_JSON, rows + new_rows)
    print("dev.json updated!" + ("" if changed else " (no changes)"))
    print(f"  Existing entries kept: {len(rows)}  |  New image rows added: {len(new_rows)}")
    for row in new_rows:
        print(f"    - {row['date']}  {row['img'][0]}   (edit its \"text\" in dev.json)")
    if not DEV_DIR.is_dir():
        print(f"  Heads up, couldn't find {DEV_DIR}; existing rows were left as is.")
    return changed

def make_thumbs(job):
    """Decode one source image once and write every missing size for it."""
    src, outputs = job  # outputs: [(label, dest, size, quality), ...]
    try:
        with Image.open(src) as im:
            if getattr(im, "is_animated", False):
                return src, "animated", 0, {}
            im = ImageOps.exif_transpose(im)
            im = im.convert("RGBA" if has_alpha(im) else "RGB")
            sizes = {}
            for label, dest, size, quality in outputs:
                variant = im.copy()
                variant.thumbnail((size, size), RESAMPLE)  # only ever shrinks
                dest.parent.mkdir(parents=True, exist_ok=True)
                variant.save(dest, "WEBP", quality=quality, method=4)
                sizes[label] = dest.stat().st_size
        return src, "ok", src.stat().st_size, sizes
    except Exception as exc:
        return src, f"failed: {exc}", 0, {}


def generate_thumbs(variants, force, prune, workers):
    """variants: [(label, folder, size, quality), ...]. Missing sizes are filled in without redoing the rest."""
    if not GAMES_DIR.is_dir():
        print(f"Can't find {GAMES_DIR} - skipped thumbnails.")
        return True, False

    jobs, expected, up_to_date = [], set(), 0
    for src in sorted(p for p in GAMES_DIR.rglob("*") if p.is_file() and p.suffix.lower() in THUMB_SRC_EXTS):
        outputs = []
        for label, folder, size, quality in variants:
            dest = Path(str(folder / src.relative_to(GAMES_DIR)) + ".webp")
            expected.add(dest)
            if not force and dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
                continue
            outputs.append((label, dest, size, quality))
        if outputs:
            jobs.append((src, outputs))
        else:
            up_to_date += 1

    made = animated = failed = 0
    src_bytes = 0
    out_bytes = {label: 0 for label, *_ in variants}
    if jobs:
        pool = ThreadPoolExecutor(max_workers=workers)
        try:
            for done, (src, status, sb, sizes) in enumerate(pool.map(make_thumbs, jobs), start=1):
                if status == "ok":
                    made += 1
                    src_bytes += sb
                    for label, nbytes in sizes.items():
                        out_bytes[label] += nbytes
                elif status == "animated":
                    animated += 1
                    print(f"\r  skipped  {src} (animated - the site will use the original)")
                else:
                    failed += 1
                    print(f"\r  {status.split(':')[0]}   {src}:{status.split(':', 1)[1]}")
                print(f"\r  thumbnails: {done}/{len(jobs)}", end="", flush=True)
            print()
        except KeyboardInterrupt:
            print("\nStopping...")
            pool.shutdown(wait=False, cancel_futures=True)
            os._exit(130)  # worker threads are joined at normal exit, so bail out hard
        else:
            pool.shutdown()

    orphans = []
    for folder in {f for _, f, _, _ in variants}:
        if folder.is_dir():
            orphans += [p for p in folder.rglob("*.webp") if p not in expected]
    if orphans and prune:
        for p in orphans:
            p.unlink()
        for folder in {f for _, f, _, _ in variants}:
            if folder.is_dir():
                for d in sorted((d for d in folder.rglob("*") if d.is_dir()), reverse=True):
                    if not any(d.iterdir()):
                        d.rmdir()

    labels = " / ".join(label for label, *_ in variants)
    print(f"Thumbnails ({labels}): {made} image(s) processed, up to date {up_to_date}, animated/skipped {animated}, failed {failed}.")
    if made:
        parts = ", ".join(f"{label} {human(n)}" for label, n in out_bytes.items())
        print(f"  {human(src_bytes)} of originals -> {parts}")
    if orphans:
        print(f"  {len(orphans)} orphaned thumbnail(s) " + ("removed." if prune else "found - kept because of --no-prune."))
    return failed == 0, bool(made or (orphans and prune))


def short_hash(paths):
    """Short content hash of some files (line endings normalised so Windows/Linux agree)."""
    h = hashlib.sha1()
    for path in sorted(paths, key=lambda p: p.name):
        if path.is_file():
            h.update(path.name.encode("utf-8"))
            h.update(path.read_bytes().replace(b"\r\n", b"\n"))
    return h.hexdigest()[:8]


def stamp_versions():
    """Stamp content hashes into index.html so browsers/CDN never mix old and new files.

    app.js and styles.css each get their own ?v= (so editing a bird doesn't re-download them),
    and the Data/*.json files share one version, stored in <meta name="data-version"> - app.js
    reads it and appends it to every JSON fetch. Because it all hangs off index.html, a visitor
    with a slightly stale index.html gets a consistent set of *old* files, never a mix.
    """
    if not INDEX_HTML.is_file():
        print(f"Can't find {INDEX_HTML} - skipped cache-busting.")
        return False

    versions = {
        "app.js": short_hash([APP_JS]),
        "styles.css": short_hash([STYLES_CSS]),
        "data": short_hash(list(DATA_DIR.glob("*.json"))),
    }
    with open(INDEX_HTML, "r", newline="", encoding="utf-8") as f:
        html = f.read()
    new_html = html

    def stamp_url(pattern, version):
        nonlocal new_html
        new_html, n = re.subn(pattern, lambda m: f"{m.group(1)}{m.group(2)}?v={version}{m.group(3)}", new_html)
        return n

    found = {
        "app.js": stamp_url(r'(<script\b[^>]*\bsrc=")(app\.js)(?:\?v=[^"]*)?(")', versions["app.js"]),
        "styles.css": stamp_url(r'(<link\b[^>]*\bhref=")(styles\.css)(?:\?v=[^"]*)?(")', versions["styles.css"]),
        "Data preloads": stamp_url(r'(<link\b[^>]*\bhref=")(Data/[\w.-]+\.json)(?:\?v=[^"]*)?(")', versions["data"]),
    }
    new_html, n_meta = re.subn(r'(<meta\s+name="data-version"\s+content=")[^"]*(")',
                               lambda m: f"{m.group(1)}{versions['data']}{m.group(2)}", new_html)
    found["data-version meta"] = n_meta

    missing = [name for name, n in found.items() if n == 0]
    changed = new_html != html
    if changed:
        with open(INDEX_HTML, "w", newline="", encoding="utf-8") as f:
            f.write(new_html)
    print("index.html versions " + ("stamped!" if changed else "already current."))
    print(f"  app.js: {versions['app.js']}  |  styles.css: {versions['styles.css']}  |  data: {versions['data']}")
    if missing:
        print(f"  Heads up - couldn't find in index.html: {', '.join(missing)}")
    return changed


def update_sitemap(changed, force=False):
    """Bump <lastmod> in sitemap.xml to today if the site's content changed."""
    if not SITEMAP.is_file():
        print(f"Can't find {SITEMAP} - skipped sitemap.")
        return
    if not (changed or force):
        print("sitemap.xml: nothing changed, left as is.")
        return

    today = datetime.date.today().isoformat()
    with open(SITEMAP, "r", newline="", encoding="utf-8") as f:
        xml = f.read()

    new_xml, n = re.subn(r"(<lastmod>)[^<]*(</lastmod>)", rf"\g<1>{today}\g<2>", xml)
    if n == 0:
        new_xml, n = re.subn(r"([ \t]*)<loc>[^<]*</loc>(\r?\n)",
                             lambda m: f"{m.group(0)}{m.group(1)}<lastmod>{today}</lastmod>{m.group(2)}", xml)

    if new_xml == xml:
        print(f"sitemap.xml: lastmod already {today}.")
        return
    with open(SITEMAP, "w", newline="", encoding="utf-8") as f:
        f.write(new_xml)
    print(f"sitemap.xml updated! lastmod set to {today} ({n} URL{'s' if n != 1 else ''}).")

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--size", type=int, default=480, help="grid thumbnail size (longest side, px)")
    ap.add_argument("--size-2x", type=int, default=960, help="high-DPI grid thumbnail size (px)")
    ap.add_argument("--mid-size", type=int, default=1600, help="lightbox image size (px)")
    ap.add_argument("--quality", type=int, default=80)
    ap.add_argument("--mid-quality", type=int, default=85, help="WebP quality for the lightbox size")
    ap.add_argument("--webp-quality", type=int, default=85)
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-prune", action="store_true", help="keep orphaned thumbnails instead of deleting them")
    ap.add_argument("--skip-convert", action="store_true")
    ap.add_argument("--skip-json", action="store_true")
    ap.add_argument("--skip-thumbs", action="store_true")
    ap.add_argument("--skip-sitemap", action="store_true")
    ap.add_argument("--skip-stamp", action="store_true", help="don't stamp cache-busting versions into index.html")
    ap.add_argument("--touch-sitemap", action="store_true", help="set sitemap lastmod to today even if nothing changed")
    args = ap.parse_args()

    needs_pillow = not (args.skip_convert and args.skip_thumbs)
    if Image is None and needs_pillow:
        print("Note: Pillow isn't installed, so conversion and thumbnails are skipped.  Run: pip install Pillow")
        args.skip_convert = args.skip_thumbs = True

    site_changed = False

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
        site_changed |= total > 0
        print(f"Converted to .webp: {total}")
        if skipped:
            print(f"Not converted ({len(skipped)}):")
            for s in skipped:
                print(f"  - {s}")
        print()

    if not args.skip_json:
        site_changed |= bool(rebuild_birds_json())
        print()
        site_changed |= bool(update_dev_json())
        print()

    ok = True
    if not args.skip_thumbs:
        variants = [
            (f"{args.size}px", THUMBS_DIR, args.size, args.quality),
            (f"{args.size_2x}px", THUMBS_2X_DIR, args.size_2x, args.quality),
            (f"{args.mid_size}px", MID_DIR, args.mid_size, args.mid_quality),
        ]
        ok, thumbs_changed = generate_thumbs(variants, args.force, not args.no_prune, args.workers)
        site_changed |= thumbs_changed
        print()

    if not args.skip_stamp:
        site_changed |= stamp_versions()
        print()

    if not args.skip_sitemap:
        update_sitemap(site_changed, args.touch_sitemap)
        print()
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())