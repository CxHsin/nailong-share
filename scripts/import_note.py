"""Import the local video-note skill's LaTeX/PDF into the static website.

Only the local authoring step needs Python/Pandoc/LaTeX. Hosting builds use
the committed Markdown, PDF and referenced images, with no source dependency.
"""
import argparse
import html
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import pypandoc

ROOT = Path(__file__).resolve().parents[1]


def group(text, start):
    """Read a balanced TeX group, including nested inline formatting."""
    if text[start] != '{':
        raise ValueError('Expected a TeX group')
    depth = 1
    pos = start + 1
    while pos < len(text):
        if text[pos] == '\\':
            pos += 2
            continue
        if text[pos] == '{':
            depth += 1
        elif text[pos] == '}':
            depth -= 1
            if not depth:
                return text[start + 1:pos], pos + 1
        pos += 1
    raise ValueError('Unclosed TeX group')


def replace_command(text, command, transform):
    pattern = re.compile(r'\\' + re.escape(command) + r'\s*\{')
    position = 0
    result = ''
    while match := pattern.search(text, position):
        value, end = group(text, match.end() - 1)
        result += text[position:match.start()] + transform(value)
        position = end
    return result + text[position:]


def metadata(text, name):
    match = re.search(r'\\newcommand\{\\' + name + r'\}\s*\{', text)
    if not match:
        return ''
    return group(text, match.end() - 1)[0].replace('\\\\', '').strip()


def render_diagram(tikz, destination):
    import pymupdf
    engine = shutil.which('xelatex')
    if not engine:
        raise RuntimeError('TikZ diagrams require local xelatex. Install it or export diagrams as images first.')
    with tempfile.TemporaryDirectory(prefix='shiye-diagram-') as temporary:
        folder = Path(temporary)
        source = r'''\documentclass{article}
\usepackage[fontset=fandol]{ctex}
\usepackage[margin=20mm,paperwidth=210mm,paperheight=297mm]{geometry}
\usepackage{tikz}
\usetikzlibrary{positioning,arrows.meta}
\definecolor{kbTitle}{HTML}{52708F}
\definecolor{kbBack}{HTML}{F2F6FA}
\pagestyle{empty}
\begin{document}\noindent
''' + tikz + '\n\\end{document}'
        (folder / 'diagram.tex').write_text(source, encoding='utf-8')
        result = subprocess.run([engine, '--disable-installer', '-interaction=nonstopmode', '-halt-on-error', 'diagram.tex'], cwd=folder, capture_output=True)
        if result.returncode:
            raise RuntimeError(result.stdout.decode('utf-8', errors='replace')[-3000:])
        with pymupdf.open(folder / 'diagram.pdf') as document:
            page = document[0]
            bounds = [d['rect'] for d in page.get_drawings()]
            bounds += [pymupdf.Rect(b[:4]) for b in page.get_text('blocks')]
            clip = bounds[0]
            for bound in bounds[1:]:
                clip |= bound
            clip = (clip + (-8, -8, 8, 8)) & page.rect
            page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=clip).save(destination)


def prepare_body(text, source_dir, assets, slug):
    body = text.split(r'\end{titlepage}', 1)[-1].split(r'\end{document}', 1)[0]
    body = re.sub(r'(?m)^\s*%.*$', '', body)
    body = re.sub(r'\\(?:tableofcontents|newpage|clearpage)\b', '', body)
    # These notes save an image before opening its figure to keep it on one PDF page.
    pending = None
    lines = []
    for line in body.splitlines():
        if r'\sbox{\notefigureimage}' in line:
            pending = re.search(r'\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}', line).group(1)
            continue
        if r'\Needspace' in line:
            continue
        if r'\usebox{\notefigureimage}' in line:
            if not pending:
                raise ValueError('Figure uses an image that has not been defined')
            line = line.replace(r'\usebox{\notefigureimage}', r'\includegraphics{' + pending + '}')
            pending = None
        lines.append(line)
    body = '\n'.join(lines)
    for kind in ['importantbox', 'knowledgebox', 'warningbox', 'dialoguebox']:
        body = re.sub(r'\\begin\{' + kind + r'\}\{([^}]+)\}', lambda m: '\n\\begin{quote}\n\\textbf{' + m[1] + '}\n\n', body)
        body = body.replace('\\end{' + kind + '}', '\n\\end{quote}\n')
    body = re.sub(r'\\protect\s*\\footnotemark|\\footnotemark', '', body)
    body = replace_command(body, 'footnotetext', lambda s: '\n\\begin{quote}\\textit{' + s + '}\\end{quote}\n')
    figure_number = 0
    references = {}
    for figure in re.finditer(r'\\begin\{figure\}.*?\\end\{figure\}', body, re.S):
        figure_number += 1
        for label in re.findall(r'\\label\{([^}]+)\}', figure[0]):
            references[label] = str(figure_number)
    body = replace_command(body, 'ref', lambda s: references.get(s, s))
    diagrams = 0
    def diagram(match):
        nonlocal diagrams
        diagrams += 1
        name = f'diagram-{diagrams}.png'
        render_diagram(match[0], assets / name)
        return '\\includegraphics{' + f'/media/{slug}/{name}' + '}'
    body = re.sub(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', diagram, body, flags=re.S)
    def image(match):
        path = match[1]
        if path.startswith('/media/'):
            return match[0]
        original = (source_dir / path).resolve()
        if not original.is_file():
            raise FileNotFoundError(f'Referenced image is missing: {original}')
        # Flatten known relative paths while avoiding basename collisions.
        name = path.replace('\\', '/').replace('/', '-')
        shutil.copy2(original, assets / name)
        return '\\includegraphics{' + f'/media/{slug}/{name}' + '}'
    body = re.sub(r'\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}', image, body)
    return body


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path, help='Full LaTeX note file')
    parser.add_argument('--slug', required=True, help='Stable URL identifier (lowercase words and hyphens)')
    parser.add_argument('--date', required=True, help='Date the note was prepared, YYYY-MM-DD')
    parser.add_argument('--description', required=True)
    parser.add_argument('--tags', default='', help='Comma-separated free-form tags')
    parser.add_argument('--pdf', type=Path, help='Defaults to source with .pdf extension')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.slug):
        parser.error('--slug must contain lowercase letters, numbers, and hyphens')
    from datetime import date
    date.fromisoformat(args.date)
    source = args.source.resolve()
    text = source.read_text(encoding='utf-8')
    pdf = args.pdf.resolve() if args.pdf else source.with_suffix('.pdf')
    if not pdf.is_file():
        parser.error(f'PDF not found: {pdf}')
    target = ROOT / 'src/content/notes' / f'{args.slug}.md'
    media = ROOT / 'public/media' / args.slug
    # Stage conversion before replacing a published note so failed imports leave it intact.
    with tempfile.TemporaryDirectory(prefix='shiye-import-') as temporary:
        staging = Path(temporary)
        body = prepare_body(text, source.parent, staging, args.slug)
        ast = json.loads(pypandoc.convert_text(body, to='json', format='latex'))
        def walk(node):
            if isinstance(node, dict):
                if node.get('t') == 'RawBlock' and node['c'][0] == 'latex':
                    raise RuntimeError(f'Unsupported LaTeX block; export it before publishing: {node["c"][1][:180]}')
                if node.get('t') == 'CodeBlock':
                    if not node['c'][0][1]:
                        node['c'][0][1] = ['python']
                if node.get('t') == 'Header':
                    node['c'][0] = min(4, node['c'][0] + 1)
                if node.get('t') == 'Image':
                    node['c'][0] = ['', [], []]
                for value in node.values(): walk(value)
            elif isinstance(node, list):
                for index in range(len(node) - 1, -1, -1):
                    value = node[index]
                    walk(value)
                    # CommonMark can leave **literal markers** next to Chinese
                    # punctuation. Explicit HTML keeps the source emphasis exact.
                    if isinstance(value, dict) and value.get('t') == 'Strong':
                        node[index:index + 1] = [
                            {'t': 'RawInline', 'c': ['html', '<strong>']},
                            *value['c'],
                            {'t': 'RawInline', 'c': ['html', '</strong>']},
                        ]
        walk(ast)
        markdown = pypandoc.convert_text(json.dumps(ast), to='gfm+tex_math_dollars', format='json', extra_args=['--wrap=none']).replace('\r\n', '\n').replace('\r', '\n')
        from PIL import Image
        def enrich_figure(match):
            figure = match[0]
            caption_match = re.search(r'<figcaption>(.*?)</figcaption>', figure, re.S)
            caption = re.sub('<[^>]+>', '', caption_match[1]) if caption_match else '视频笔记插图'
            def enrich_image(image):
                path = image[1]
                with Image.open(staging / path.rsplit('/', 1)[-1]) as asset:
                    width, height = asset.size
                return f'<img src="{path}" alt="{html.escape(html.unescape(caption), quote=True)}" loading="lazy" decoding="async" width="{width}" height="{height}" />'
            return re.sub(r'<img src="([^"]+)"\s*/?>', enrich_image, figure)
        markdown = re.sub(r'<figure\b.*?</figure>', enrich_figure, markdown, flags=re.S)
        markdown = re.sub(r'^> \*(原视频字幕定位区间：.*?|视频画面时间区间：.*?)\*$', r'<p class="source-note">\1</p>', markdown, flags=re.M)
        cover = source.parent / metadata(text, 'videocoverpath')
        shutil.copy2(cover, staging / ('cover' + cover.suffix))
        shutil.copy2(pdf, staging / 'note.pdf')
        data = {
            'title': metadata(text, 'notetitle'), 'description': args.description,
            'date': args.date, 'author': metadata(text, 'videochannel'),
            'source': metadata(text, 'videourl'), 'duration': metadata(text, 'videoduration'),
            'tags': [t.strip() for t in args.tags.split(',') if t.strip()],
            'cover': f'/media/{args.slug}/cover{cover.suffix}',
            'pdf': f'/media/{args.slug}/note.pdf',
        }
        frontmatter = '\n'.join(f'{key}: {json.dumps(value, ensure_ascii=False)}' for key, value in data.items())
        media.mkdir(parents=True, exist_ok=True)
        for file in staging.iterdir():
            shutil.copy2(file, media / file.name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(f'---\n{frontmatter}\n---\n\n{markdown}', encoding='utf-8')
    print(f'Imported {args.slug}: {len(markdown)} characters, {len(list(media.iterdir()))} assets')
    print(f'Review {target} and run npm run build before publishing.')


if __name__ == '__main__':
    main()
