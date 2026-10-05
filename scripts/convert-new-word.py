"""Read incoming DOCX files and print an additive Markdown patch, without writes.

Run with the bundled document Python runtime. Apply the emitted patch with
apply_patch; existing Markdown and source Word files are never overwritten.
"""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph


ROOT = Path.cwd()
SOURCE = ROOT / "public" / "nuevos_word"
DESTINATION = ROOT / "public" / "patologias"
ALIASES = {"craneotoracophago-en-felino": "craneotoracopago-en-felino"}


def normalized(text):
    return "".join(c for c in unicodedata.normalize("NFD", text) if not unicodedata.combining(c)).lower()


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", normalized(text)).strip("-")


def body_blocks(document):
    for element in document.element.body:
        if element.tag == qn("w:p"):
            yield Paragraph(element, document)
        elif element.tag == qn("w:tbl"):
            yield Table(element, document)


def markdown(document):
    blocks = []
    retained = []
    removed = []
    title_seen = False
    excluded = False
    for block in body_blocks(document):
        if isinstance(block, Table):
            rows = [[cell.text.replace("\n", "<br>").replace("|", "\\|").strip() for cell in row.cells] for row in block.rows]
            if rows and not excluded:
                width = max(map(len, rows))
                rows = [row + [""] * (width - len(row)) for row in rows]
                lines = ["| " + " | ".join(rows[0]) + " |", "| " + " | ".join(["---"] * width) + " |"]
                lines += ["| " + " | ".join(row) + " |" for row in rows[1:]]
                blocks.append("\n".join(lines))
            continue
        text = block.text.strip()
        if not text:
            continue
        if normalized(text).startswith("te elaboro el informe"):
            removed.append(text)
            continue
        style = block.style.name if block.style else ""
        heading = bool(re.match(r"Heading \d+", style)) or (text.isupper() and len(text) < 110)
        if heading:
            key = normalized(text)
            excluded = bool(re.search(r"dedicatoria|agradecimiento", key))
        if excluded:
            removed.append(text)
            continue
        retained.append(text)
        if not title_seen:
            blocks.append("# " + text)
            title_seen = True
        elif heading:
            level = re.search(r"Heading (\d+)", style)
            depth = max(2, min(4, int(level[1]) + 1)) if level else 2
            blocks.append("#" * depth + " " + text)
        elif block._p.pPr is not None and block._p.pPr.numPr is not None:
            blocks.append("- " + text)
        else:
            blocks.append(text)
    if not title_seen:
        raise ValueError("Document has no extractable content")
    return "\n\n".join(blocks) + "\n", retained, removed


changes = []
records = []
reserved = set()
# Main report precedes any numbered supplementary copy.
files = sorted(SOURCE.glob("*.docx"), key=lambda p: (re.sub(r"\s*\(\d+\)$", "", p.stem), bool(re.search(r"\(\d+\)$", p.stem))))
for source in files:
    stem = re.sub(r"\s*\(\d+\)$", "", source.stem)
    key = ALIASES.get(slug(stem), slug(stem))
    matches = [folder for folder in DESTINATION.iterdir() if folder.is_dir() and slug(folder.name) == key]
    if len(matches) > 1:
        raise ValueError(f"Ambiguous pathology: {source.name}")
    folder = matches[0] if matches else DESTINATION / key
    document = Document(source)
    converted, retained, removed = markdown(document)
    duplicate = next((p for p in folder.glob("*.md") if p.read_text(encoding="utf-8").strip() == converted.strip()), None)
    index = 1
    while (folder / f"documento-{index}.md").exists() or (folder / f"documento-{index}.md") in reserved:
        index += 1
    destination = duplicate or folder / f"documento-{index}.md"
    if not duplicate:
        reserved.add(destination)
        changes.append((destination, converted))
    records.append({
        "source": source.relative_to(ROOT).as_posix(),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "destination": destination.relative_to(ROOT).as_posix(),
        "markdownSha256": hashlib.sha256(converted.encode("utf-8")).hexdigest(),
        "retainedParagraphs": len(retained),
        "characters": len(converted),
        "removedNonClinicalParagraphs": removed,
        "status": "already-converted" if duplicate else "added",
    })

if not files:
    raise ValueError("No DOCX files in public/nuevos_word")

report = {"documents": len(files), "pathologies": len({r["destination"].rsplit("/", 1)[0] for r in records}), "files": records}
report_path = ROOT / "scripts" / "reports" / "new-word-conversion.json"
report_text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
patch = ["*** Begin Patch"]
for destination, converted in changes:
    patch.append(f"*** Add File: {destination.as_posix()}")
    patch.extend("+" + line for line in converted.splitlines())
if not report_path.exists():
    patch.append(f"*** Add File: {report_path.as_posix()}")
    patch.extend("+" + line for line in report_text.splitlines())
patch.append("*** End Patch")
print(json.dumps({"report": report, "patch": "\n".join(patch)}, ensure_ascii=True))
