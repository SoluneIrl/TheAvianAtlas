import os

# Folder named demo, located beside main.py
folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demo")

if not os.path.isdir(folder):
    print("Folder 'demo' not found!")
    exit()

for root, dirs, files in os.walk(folder, topdown=False):
    for name in files + dirs:
        old_path = os.path.join(root, name)

        new_name = name.replace("_", " ").replace("Large", "")
        new_name = " ".join(new_name.split()).strip()

        if name != new_name:
            new_path = os.path.join(root, new_name)

            if os.path.exists(new_path):
                print(f"Skipped (already exists): {name}")
            else:
                try:
                    os.rename(old_path, new_path)
                    print(f"Renamed: {name} -> {new_name}")
                except OSError as e:
                    print(f"Error renaming {name}: {e}")

print("Done!")