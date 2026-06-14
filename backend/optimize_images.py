import os
from PIL import Image

def optimize_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.png'):
                path = os.path.join(root, file)
                orig_size = os.path.getsize(path)
                try:
                    img = Image.open(path)
                    if 'marker' in file.lower() or 'food' in file.lower():
                        img.thumbnail((256, 256), Image.Resampling.LANCZOS)
                    elif 'splash' in file.lower() or 'bg' in file.lower():
                        img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                    img.save(path, 'PNG', optimize=True)
                    new_size = os.path.getsize(path)
                    print(f'Optimized {file} (saved {(orig_size-new_size)/1024:.1f} KB)')
                except Exception as e:
                    print(f'Error {path}: {e}')

optimize_directory('customer-app/assets')
optimize_directory('seller-app/assets')
