import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches className="... max-w-... w-full ... p-6 ..." or similar modal classes
    # More generally, look for instances of ixed inset-0 parent and the child w-full max-w-...
    # Let's just do a blanket replacement for things that look like modal content boxes
    pattern = r'(className="[^"]*max-w-[a-z0-9]+[^"]*w-full[^"]*p-[0-9]+[^"]*)(")'
    
    def replacer(match):
        classes = match.group(1)
        if 'overflow-y-auto' not in classes:
            classes = classes + ' max-h-[90vh] overflow-y-auto'
        return classes + match.group(2)
    
    new_content, count = re.subn(pattern, replacer, content)
    
    if count > 0 and new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated modal classes in {filepath}")

for root, _, files in os.walk('c:/Users/VICTUS/Desktop/CampusBridge/src'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
