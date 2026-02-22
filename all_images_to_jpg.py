import os
from PIL import Image

SUPPORTED_EXTENSIONS = ('.png', '.webp', '.bmp', '.tiff', '.tif', '.gif', '.jpeg', '.jpg')
JPG_EXTENSIONS = ('.jpg', '.jpeg')


def safe_jpg_path(src_path: str) -> str:
    base, _ = os.path.splitext(src_path)
    candidate = base + ".jpg"
    if not os.path.exists(candidate):
        return candidate

    # Avoid overwriting existing .jpg by appending _1, _2, ...
    i = 1
    while True:
        candidate = f"{base}_{i}.jpg"
        if not os.path.exists(candidate):
            return candidate
        i += 1


def convert_to_jpg(image_path: str) -> str | None:
    out_path = safe_jpg_path(image_path)
    try:
        with Image.open(image_path) as img:
            # Handle transparency by compositing onto white
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                rgba = img.convert("RGBA")
                background = Image.new("RGB", rgba.size, (255, 255, 255))
                background.paste(rgba, mask=rgba.split()[-1])
                background.save(out_path, "JPEG", quality=95, optimize=True)
            else:
                img.convert("RGB").save(out_path, "JPEG", quality=95, optimize=True)
        return out_path
    except Exception as e:
        print(f"Failed to convert: {image_path}\n  -> {e}")
        return None


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    converted = 0
    deleted = 0
    failed = 0

    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            src_path = os.path.join(dirpath, filename)
            ext = os.path.splitext(filename)[1].lower()

            if ext not in SUPPORTED_EXTENSIONS:
                continue

            # Leave existing JPG/JPEG files as-is
            if ext in JPG_EXTENSIONS:
                continue

            print(f"Converting: {src_path}")
            out_path = convert_to_jpg(src_path)
            if out_path:
                converted += 1
                try:
                    os.remove(src_path)
                    deleted += 1
                    print(f"  Saved: {out_path}")
                    print(f"  Removed original: {src_path}")
                except Exception as e:
                    print(f"  Converted but failed to remove original: {src_path}\n  -> {e}")
            else:
                failed += 1

    print("\nDone.")
    print(f"Converted: {converted}")
    print(f"Deleted originals: {deleted}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()