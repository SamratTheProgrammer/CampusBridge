import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find modal containers: typically have max-w-[something] w-full and are children of fixed inset-0
    # Or just look for max-w-md, max-w-lg, max-w-xl, max-w-2xl, max-w-3xl, max-w-4xl that also have w-full
    # But only if it's in a modal context.
    
    # For a safer approach, I'll search for 'max-w-' and 'w-full' and 'bg-card'
    pattern = r'className="([^"]*max-w-[a-z0-9]+[^"]*w-full[^"]*bg-card[^"]*)"'
    
    def replacer(match):
        classes = match.group(1)
        if 'overflow-y-auto' not in classes:
            classes = classes + ' max-h-[90vh] overflow-y-auto'
        return f'className="{classes}"'
    
    new_content, count = re.subn(pattern, replacer, content)
    
    if count > 0 and new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Added overflow to modals in {filepath}")

for root, _, files in os.walk('c:/Users/VICTUS/Desktop/CampusBridge/src'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
