# Generate a simple test drink image
from PIL import Image, ImageDraw, ImageFont
import os

img = Image.new('RGB', (1024, 1024), (245, 240, 230))
d = ImageDraw.Draw(img)

# Draw a "glass" with brownish liquid (milk tea)
# glass outline
d.rectangle([350, 250, 674, 880], outline=(40, 40, 40), width=4, fill=(220, 215, 200))
# liquid
d.rectangle([356, 380, 668, 870], fill=(140, 90, 50))
# foam on top
d.ellipse([345, 240, 685, 410], fill=(255, 245, 230))

# straw
d.rectangle([520, 150, 540, 380], fill=(220, 60, 60))

# caption text
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
except Exception:
    font = ImageFont.load_default()
d.text((300, 950), "HK Milk Tea", fill=(40, 40, 40), font=font)

out_path = "/home/z/my-project/scripts/test-drink.jpg"
img.save(out_path, "JPEG", quality=88)
print(f"saved: {out_path}")
