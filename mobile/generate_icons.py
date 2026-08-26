#!/usr/bin/env python3
"""Generate all Android mipmap icons from a source image."""

from PIL import Image, ImageDraw
import os
import shutil

SOURCE = "C:/rn/Nexora/new icon.png"
RES_DIR = "C:/rn/Nexora/mobile/android/app/src/main/res"

# Standard mipmap sizes (launcher icon)
MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Adaptive icon foreground sizes (108dp * density)
ADAPTIVE_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def resize_center_crop(img, target_size):
    """Resize and center-crop to a square."""
    img = img.convert("RGBA")
    w, h = img.size
    # Make square by cropping to the smaller dimension
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    img = img.crop((left, top, left + size, top + size))
    # Resize
    img = img.resize((target_size, target_size), Image.LANCZOS)
    return img


def create_round_icon(img):
    """Create a circular version of the icon."""
    size = img.size[0]
    # Create mask for circle
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    
    # Apply mask
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result


def create_adaptive_foreground(img, target_size):
    """Create adaptive icon foreground (icon centered in 108dp canvas with padding)."""
    # Android adaptive icon: the visible area is 66dp centered in a 108dp canvas
    # So the icon should occupy ~66/108 = ~61% of the canvas
    canvas_size = target_size
    icon_size = int(canvas_size * 0.66)
    
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Resize icon to fit within the safe zone
    icon = img.copy()
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)
    
    # Center on canvas
    offset = (canvas_size - icon_size) // 2
    canvas.paste(icon, (offset, offset), icon if icon.mode == "RGBA" else None)
    return canvas


def create_adaptive_background(target_size):
    """Create a solid dark background for adaptive icon."""
    bg = Image.new("RGBA", (target_size, target_size), (18, 18, 24, 255))  # Dark background
    return bg


def main():
    print(f"Loading source image: {SOURCE}")
    src = Image.open(SOURCE)
    print(f"Source size: {src.size}, mode: {src.mode}")
    
    # Backup current icons first
    print("\nBacking up current icons...")
    backup_dir = os.path.join(RES_DIR, "_icon_backup")
    os.makedirs(backup_dir, exist_ok=True)
    for folder in MIPMAP_SIZES:
        src_folder = os.path.join(RES_DIR, folder)
        dst_folder = os.path.join(backup_dir, folder)
        if os.path.exists(src_folder):
            if os.path.exists(dst_folder):
                shutil.rmtree(dst_folder)
            shutil.copytree(src_folder, dst_folder)
    print(f"Backup saved to: {backup_dir}")
    
    for folder, size in MIPMAP_SIZES.items():
        folder_path = os.path.join(RES_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        print(f"\n[{folder}] Generating icons at {size}x{size}...")
        
        # Standard launcher icon (ic_launcher.png)
        icon = resize_center_crop(src, size)
        icon_path = os.path.join(folder_path, "ic_launcher.png")
        icon.save(icon_path, "PNG")
        print(f"  [OK] ic_launcher.png ({size}x{size})")
        
        # Round launcher icon (ic_launcher_round.png)
        round_icon = create_round_icon(icon.copy())
        round_path = os.path.join(folder_path, "ic_launcher_round.png")
        round_icon.save(round_path, "PNG")
        print(f"  [OK] ic_launcher_round.png ({size}x{size})")
        
        # Adaptive icon foreground
        adaptive_size = ADAPTIVE_SIZES[folder]
        foreground = create_adaptive_foreground(src, adaptive_size)
        fg_path = os.path.join(folder_path, "ic_launcher_foreground.png")
        foreground.save(fg_path, "PNG")
        print(f"  [OK] ic_launcher_foreground.png ({adaptive_size}x{adaptive_size})")
        
        # Adaptive icon background
        background = create_adaptive_background(adaptive_size)
        bg_path = os.path.join(folder_path, "ic_launcher_background.png")
        background.save(bg_path, "PNG")
        print(f"  [OK] ic_launcher_background.png ({adaptive_size}x{adaptive_size})")
        
        # Monochrome icon (grayscale version for Android 13+)
        mono = icon.copy().convert("L").convert("RGBA")
        mono_path = os.path.join(folder_path, "ic_launcher_monochrome.png")
        mono.save(mono_path, "PNG")
        print(f"  [OK] ic_launcher_monochrome.png ({size}x{size})")
    
    # Update adaptive icon XML (ic_launcher_round.xml)
    anydpi_dir = os.path.join(RES_DIR, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)
    
    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>"""
    
    xml_path = os.path.join(anydpi_dir, "ic_launcher_round.xml")
    with open(xml_path, "w") as f:
        f.write(adaptive_xml)
    print(f"\n  [OK] mipmap-anydpi-v26/ic_launcher_round.xml (adaptive icon XML)")
    
    # Also create ic_launcher.xml
    xml_path2 = os.path.join(anydpi_dir, "ic_launcher.xml")
    with open(xml_path2, "w") as f:
        f.write(adaptive_xml)
    print(f"  [OK] mipmap-anydpi-v26/ic_launcher.xml (adaptive icon XML)")
    
    print("\nAll icons generated successfully!")
    print(f"Backup of old icons: {backup_dir}")


if __name__ == "__main__":
    main()
