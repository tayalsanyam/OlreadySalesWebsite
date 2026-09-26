#!/usr/bin/env python3
"""Regenerate lib/legal-v31.ts from Legal Docs/*.docx after policy edits."""
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "Legal Docs"
OUT = ROOT / "lib" / "legal-v31.ts"
NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
EFFECTIVE = "1 May 2026"


def docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paras = []
    for p in root.iter(NS + "p"):
        texts = [t.text for t in p.iter(NS + "t") if t.text]
        if texts:
            paras.append("".join(texts))
    return "\n\n".join(paras)


def main() -> None:
    parts = [
        "/** OLREADY legal policies v3.1 — synced from Legal Docs/*.docx. Do not edit by hand; re-run scripts/sync-legal-v31.py */\n"
    ]
    for var, fname in [
        ("LEGAL_TERMS_V31", "OLREADY_Terms_of_Use_and_Service.docx"),
        ("LEGAL_PRIVACY_V31", "OLREADY_Privacy_Policy.docx"),
        ("LEGAL_REFUNDS_V31", "OLREADY_Refund_and_Cancellation_Policy.docx"),
    ]:
        text = docx_text(DOCS / fname).replace("[INSERT PUBLICATION DATE]", EFFECTIVE)
        parts.append(f"export const {var} = `{text}`;\n")
    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
