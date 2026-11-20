"""A motion type made for one character from an existing type by changing a line or two of its source (a guard pose, a
weapon size), so that everything built from that line (every clip starts and ends in the guard) follows.

    exec(variant('sword', [(old text, new text), ...]), globals())      in clips/<new type>.py

Each old text must occur exactly once in the base file; if the base changes so that it does not, the import fails loudly.
"""
import os
def variant(base, edits):
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), base + '.py'); src = open(path, encoding='utf-8').read()
    for old, new in edits:
        assert src.count(old) == 1, ('variant of %s: text not found exactly once' % base, old)
        src = src.replace(old, new)
    return compile(src, path + ' (variant)', 'exec')
