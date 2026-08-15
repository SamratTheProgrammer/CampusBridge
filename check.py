import re
f=open('src/components/RealtimeChat.jsx', encoding='utf8').read()
def check(text):
    s = []
    i = 0
    line = 1
    in_str = False
    str_char = ''
    in_temp = False
    while i < len(text):
        if text[i] == '\n': line += 1
        
        if in_str:
            if text[i] == '\\': i+=1
            elif text[i] == str_char: in_str = False
        elif in_temp:
            if text[i] == '\\': i+=1
            elif text[i] == '`': in_temp = False
            elif text[i:i+2] == '${':
                s.append(('${', line))
                i+=1
        else:
            if text[i] == '/' and i+1 < len(text) and text[i+1] == '/':
                while i < len(text) and text[i] != '\n': i+=1
            elif text[i] == '/' and i+1 < len(text) and text[i+1] == '*':
                while i < len(text)-1 and not (text[i] == '*' and text[i+1] == '/'):
                    if text[i] == '\n': line += 1
                    i+=1
                i+=1
            elif text[i] in '\"\'':
                in_str = True
                str_char = text[i]
            elif text[i] == '`':
                in_temp = True
            elif text[i] in '{[(':
                s.append((text[i], line))
            elif text[i] in '}])':
                if not s: print(f'Unmatched {text[i]} at line {line}'); return
                last = s.pop()[0]
                if (text[i] == '}' and last not in ['{', '${']) or (text[i] == ']' and last != '[') or (text[i] == ')' and last != '('):
                    print(f'Mismatched {last} and {text[i]} at line {line}')
                    return
        i+=1
    for b, l in s:
        print(f'Unmatched {b} at line {l}')

check(f)
