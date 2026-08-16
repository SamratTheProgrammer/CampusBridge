import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<table className="' in content:
        # Avoid duplicating whitespace-nowrap
        if 'whitespace-nowrap' not in content:
            new_content = content.replace('<table className="', '<table className="whitespace-nowrap ')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")

for root, _, files in os.walk('c:/Users/VICTUS/Desktop/CampusBridge/src/pages'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))
