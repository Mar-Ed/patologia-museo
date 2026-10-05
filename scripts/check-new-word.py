"""Check conversion completeness, original hashes and non-clinical exclusions."""
import hashlib
import json
import re
from pathlib import Path

from docx import Document

report = json.loads(Path("scripts/reports/new-word-conversion.json").read_text(encoding="utf-8"))
assert report["documents"] == len(report["files"])
for item in report["files"]:
    source = Path(item["source"])
    destination = Path(item["destination"])
    assert hashlib.sha256(source.read_bytes()).hexdigest() == item["sourceSha256"], source
    data = destination.read_bytes()
    assert hashlib.sha256(data).hexdigest() == item["markdownSha256"], destination
    text = data.decode("utf-8")
    assert text.startswith("# ") and len(text) > 500, destination
    assert not re.search(r"dedicatoria|agradecimiento|te elaboro el informe|data:image|aviso de conversi", text, re.I), destination
    retained = []
    for paragraph in Document(source).paragraphs:
        value = paragraph.text.strip()
        if value and value not in item["removedNonClinicalParagraphs"]:
            retained.append(value)
            assert value in text, f"Missing source paragraph in {destination}: {value[:80]}"
    assert len(retained) == item["retainedParagraphs"], destination
assert report["pathologies"] == len({str(Path(item["destination"]).parent) for item in report["files"]})
print(json.dumps({"verifiedDocuments": report["documents"], "pathologies": report["pathologies"], "originalsUnchanged": True, "allRetainedParagraphsPresent": True}, indent=2))
