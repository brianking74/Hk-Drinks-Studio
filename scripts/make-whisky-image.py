# Generate a whisky bottle test image
from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (1024, 1024), (15, 15, 18))
d = ImageDraw.Draw(img)

# Bottle silhouette - tall and slim
bottle_x, bottle_y = 400, 150
bottle_w, bottle_h = 224, 700
# body
d.rounded_rectangle([bottle_x, bottle_y + 130, bottle_x + bottle_w, bottle_y + bottle_h], radius=8, outline=(201, 168, 76), width=2, fill=(60, 35, 20))
# neck
d.rectangle([bottle_x + 60, bottle_y, bottle_x + 164, bottle_y + 150], outline=(201, 168, 76), width=2, fill=(50, 30, 18))
# cap
d.rectangle([bottle_x + 60, bottle_y - 30, bottle_x + 164, bottle_y + 10], fill=(120, 90, 40), outline=(201, 168, 76))

# Label
d.rectangle([bottle_x + 20, bottle_y + 280, bottle_x + bottle_w - 20, bottle_y + 460], fill=(245, 240, 230), outline=(201, 168, 76))
try:
    font_big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 38)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
except:
    font_big = ImageFont.load_default()
    font_small = ImageFont.load_default()
d.text((430, 410), "HIGHLAND", fill=(40, 30, 20), font=font_big)
d.text((455, 460), "SINGLE MALT", fill=(80, 60, 40), font=font_small)
d.text((445, 490), "12 YEARS", fill=(120, 90, 50), font=font_small)

# Glass next to bottle - whisky tumbler
glass_x = 700
d.ellipse([glass_x, 700, glass_x + 200, 760], fill=(180, 100, 40), outline=(201, 168, 76))
d.rectangle([glass_x + 5, 720, glass_x + 195, 880], fill=(180, 100, 40))
d.ellipse([glass_x + 5, 850, glass_x + 195, 910], fill=(120, 60, 20))

out_path = "/home/z/my-project/scripts/test-whisky.jpg"
img.save(out_path, "JPEG", quality=88)
print(f"saved: {out_path}")
