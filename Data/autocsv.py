import os
import re
import csv
import datetime

try:
    from PIL import Image
except ImportError:
    Image = None

# Location of this Python file (lives in the "Data" folder)
base_folder = os.path.dirname(os.path.abspath(__file__))

# Project root is one level up from "Data"
project_root = os.path.dirname(base_folder)

# Only these are treated as image files — everything else (.DS_Store,
# Thumbs.db, .txt notes, etc.) is skipped so junk files never end up as
# bogus rows in either CSV.
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}

# Formats that get auto-converted to .webp before anything else runs.
# GIF is left alone (animated GIFs need extra handling to stay animated as
# webp) and SVG/BMP are left alone too since this is just about shrinking
# the big photo-style assets.
CONVERTIBLE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
WEBP_QUALITY = 85  # 0-100. Lower = smaller files, more visible loss.


def convert_folder_images_to_webp(folder_path):
    """Converts every .png/.jpg/.jpeg directly inside folder_path to .webp,
    deleting the original once the conversion succeeds. Not recursive —
    call it once per leaf folder that actually holds images.
    Returns (converted_count, skipped_list)."""
    if Image is None or not os.path.isdir(folder_path):
        return 0, []

    converted = 0
    skipped = []

    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if not os.path.isfile(file_path) or filename.startswith("."):
            continue

        base, ext = os.path.splitext(filename)
        if ext.lower() not in CONVERTIBLE_EXTENSIONS:
            continue

        webp_path = os.path.join(folder_path, base + ".webp")
        if os.path.exists(webp_path):
            # Don't clobber an existing .webp with the same base name —
            # flag it so it can be sorted out by hand instead.
            skipped.append(f"{filename} (a .webp with that name already exists)")
            continue

        try:
            with Image.open(file_path) as img:
                # Keep transparency where the source has it; otherwise
                # normalize to RGB so save() doesn't choke on weird modes.
                if img.mode in ("RGBA", "LA") or (
                    img.mode == "P" and "transparency" in img.info
                ):
                    img = img.convert("RGBA")
                elif img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
            os.remove(file_path)
            converted += 1
        except Exception as e:
            skipped.append(f"{filename} ({e})")
            # Clean up a partial .webp so a failed conversion doesn't
            # silently take priority over the still-intact original.
            if os.path.exists(webp_path):
                try:
                    os.remove(webp_path)
                except OSError:
                    pass

    return converted, skipped


def natural_sort_key(name):
    # Splits a filename into text/number chunks so "Outro 2" sorts before
    # "Outro 10" (plain alphabetical sorting would put "Outro 10" first,
    # since "1" < "2" as characters).
    return [
        int(chunk) if chunk.isdigit() else chunk.lower()
        for chunk in re.split(r"(\d+)", name)
    ]


# ============================================================
# Birds.csv — rebuilt from scratch every run from Assets/Games
# ============================================================

def rebuild_birds_csv():
    games_folder = os.path.join(project_root, "Assets", "Games")
    csv_file = os.path.join(base_folder, "birds.csv")
    header = ["game", "id", "title", "image", "credit", "date"]

    def smart_capitalize(text):
        # Capitalizes just the first *letter* of each space-separated word,
        # leaving every other character exactly as it was in the filename.
        # str.title() does two things this project doesn't want: it lowercases
        # the rest of each word (so "CCC" becomes "Ccc"), and it treats any
        # non-letter as a word boundary, including apostrophes (so "Fiona's"
        # becomes "Fiona'S"). This only touches the first alphabetic character
        # of each word — everything after it, and everything in words that
        # start with a non-letter like "#3", is left untouched.
        words = text.split(" ")
        fixed_words = []
        for word in words:
            for i, ch in enumerate(word):
                if ch.isalpha():
                    word = word[:i] + ch.upper() + word[i + 1:]
                    break
            fixed_words.append(word)
        return " ".join(fixed_words)

    # --- Load any credits/dates that already exist in birds.csv, so a re-run doesn't wipe them ---
    # Keyed by image path (most stable identifier), with a "game|title" fallback key
    # in case a filename ever gets renamed slightly.
    existing_credits_by_image = {}
    existing_credits_by_game_title = {}
    existing_dates_by_image = {}
    existing_dates_by_game_title = {}

    if os.path.isfile(csv_file):
        with open(csv_file, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                image_key = (row.get("image") or "").strip()
                game_title_key = (
                    (row.get("game") or "").strip().lower(),
                    (row.get("title") or "").strip().lower(),
                )

                credit = (row.get("credit") or "").strip()
                if credit:
                    if image_key:
                        existing_credits_by_image[image_key] = credit
                    existing_credits_by_game_title[game_title_key] = credit

                # Older CSVs (from before this column existed) simply won't have
                # a "date" value here, which is fine — it just means every row
                # falls through to the file's own modified-on-disk date below.
                date_value = (row.get("date") or "").strip()
                if date_value:
                    if image_key:
                        existing_dates_by_image[image_key] = date_value
                    existing_dates_by_game_title[game_title_key] = date_value

    def find_existing_credit(bare_filename, full_image_path, game_name, title):
        if bare_filename in existing_credits_by_image:
            return existing_credits_by_image[bare_filename]
        if full_image_path in existing_credits_by_image:
            return existing_credits_by_image[full_image_path]
        key = (game_name.strip().lower(), title.strip().lower())
        return existing_credits_by_game_title.get(key, "")

    def find_existing_date(bare_filename, full_image_path, game_name, title):
        if bare_filename in existing_dates_by_image:
            return existing_dates_by_image[bare_filename]
        if full_image_path in existing_dates_by_image:
            return existing_dates_by_image[full_image_path]
        key = (game_name.strip().lower(), title.strip().lower())
        return existing_dates_by_game_title.get(key, "")

    if not os.path.isdir(games_folder):
        print(f"Heads up — couldn't find the folder: {games_folder}")
        print("Skipped rebuilding birds.csv.")
        return

    # Get all game folders, sorted alphabetically
    game_folders = [
        folder
        for folder in os.listdir(games_folder)
        if os.path.isdir(os.path.join(games_folder, folder))
    ]
    game_folders.sort(key=str.lower)

    if Image is None:
        print("  Note: Pillow isn't installed, so PNG/JPG files won't be")
        print("  auto-converted to .webp this run. Run: pip install Pillow")

    rows = []
    carried_over = 0
    dates_carried_over = 0
    dates_backfilled = 0
    empty_game_folders = []
    total_converted = 0
    all_skipped = []

    for game_name in game_folders:
        game_path = os.path.join(games_folder, game_name)

        converted, skipped = convert_folder_images_to_webp(game_path)
        total_converted += converted
        all_skipped.extend(f"{game_name}/{s}" for s in skipped)

        files = [
            filename
            for filename in os.listdir(game_path)
            if os.path.isfile(os.path.join(game_path, filename))
            and not filename.startswith(".")
            and os.path.splitext(filename)[1].lower() in IMAGE_EXTENSIONS
        ]
        files.sort(key=natural_sort_key)

        if not files:
            empty_game_folders.append(game_name)

        for file_id, filename in enumerate(files, start=1):
            title, extension = os.path.splitext(filename)
            title = title.replace("_", " ")
            title = smart_capitalize(title)

            full_image_path = f"Assets/Games/{game_name}/{filename}"

            credit = find_existing_credit(filename, full_image_path, game_name, title)
            if credit:
                carried_over += 1

            date_added = find_existing_date(filename, full_image_path, game_name, title)
            if date_added:
                dates_carried_over += 1
            else:
                file_path = os.path.join(game_path, filename)
                mtime = os.path.getmtime(file_path)
                date_added = datetime.date.fromtimestamp(mtime).isoformat()
                dates_backfilled += 1

            rows.append([game_name, file_id, title, filename, credit, date_added])

    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)

    print("birds.csv rebuilt!")
    print(f"  Games found: {len(game_folders)}")
    print(f"  Total images/files: {len(rows)}")
    if total_converted:
        print(f"  Images converted to .webp: {total_converted}")
    if all_skipped:
        print(f"  Images NOT converted ({len(all_skipped)}):")
        for s in all_skipped:
            print(f"    - {s}")

    if empty_game_folders:
        print()
        print("  Heads up — these game folders have no recognized image files, so")
        print("  they won't appear in the collection. If they're genuinely birdless,")
        print("  add them to NO_BIRDS_GAMES in app.js; if not, double check the files:")
        for name in empty_game_folders:
            print(f"    - {name}")


# ============================================================
# dev.csv — existing rows kept as-is, new images just appended
# ============================================================

def update_dev_csv():
    dev_folder = os.path.join(project_root, "Assets", "Dev")
    csv_file = os.path.join(base_folder, "dev.csv")
    header = ["date", "text", "img"]

    # Placeholder text dropped into new rows — dev.csv is meant to be hand-
    # written (unlike birds.csv, there's no filename to derive a caption
    # from), so this is just a flag to remind you to go fill it in.
    PLACEHOLDER_TEXT = "TODO: describe this update"

    # dev.csv is hand-maintained: some rows have no image at all (text-only
    # updates), and every existing row's text is something you wrote on
    # purpose. This never rewrites or reorders those — it only ever
    # *appends* a new row for an image it hasn't seen before.
    existing_rows = []
    known_images = set()

    if os.path.isfile(csv_file):
        with open(csv_file, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_rows.append([
                    (row.get("date") or "").strip(),
                    (row.get("text") or "").strip(),
                    (row.get("img") or "").strip(),
                ])
                img = (row.get("img") or "").strip()
                if img:
                    known_images.add(os.path.basename(img))

    converted, skipped = convert_folder_images_to_webp(dev_folder)

    # If an existing hand-written row pointed at a PNG/JPG that just got
    # converted, update that row's img to the new .webp filename instead of
    # leaving it dangling (and instead of the file below being treated as
    # "new" and getting its own duplicate placeholder row).
    if converted:
        for row in existing_rows:
            img_val = row[2]
            if not img_val:
                continue
            base, ext = os.path.splitext(img_val)
            if ext.lower() not in CONVERTIBLE_EXTENSIONS:
                continue
            webp_name = base + ".webp"
            original_still_there = os.path.isfile(os.path.join(dev_folder, img_val))
            webp_now_there = os.path.isfile(os.path.join(dev_folder, webp_name))
            if webp_now_there and not original_still_there:
                row[2] = webp_name
                known_images.discard(os.path.basename(img_val))
                known_images.add(webp_name)

    if os.path.isdir(dev_folder):
        files = [
            filename
            for filename in os.listdir(dev_folder)
            if os.path.isfile(os.path.join(dev_folder, filename))
            and not filename.startswith(".")
            and os.path.splitext(filename)[1].lower() in IMAGE_EXTENSIONS
        ]
    else:
        files = []
    files.sort(key=natural_sort_key)

    new_rows = []
    for filename in files:
        if filename in known_images:
            continue
        file_path = os.path.join(dev_folder, filename)
        mtime = os.path.getmtime(file_path)
        date_added = datetime.date.fromtimestamp(mtime).isoformat()
        new_rows.append([date_added, PLACEHOLDER_TEXT, filename])

    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(existing_rows)
        writer.writerows(new_rows)

    print("dev.csv updated!")
    print(f"  Existing entries kept: {len(existing_rows)}")
    print(f"  New image rows added: {len(new_rows)}")
    if converted:
        print(f"  Images converted to .webp: {converted}")
    if skipped:
        print(f"  Images NOT converted ({len(skipped)}):")
        for s in skipped:
            print(f"    - {s}")

    if new_rows:
        print()
        print("  New rows added (go edit their \"text\" in dev.csv):")
        for date_added, _, filename in new_rows:
            print(f"    - {date_added}  {filename}")

    if not os.path.isdir(dev_folder):
        print()
        print(f"  Heads up — couldn't find the folder: {dev_folder}")
        print("  No image rows were added this run; existing rows were left as-is.")


if __name__ == "__main__":
    print()
    rebuild_birds_csv()
    print()
    update_dev_csv()
    print()