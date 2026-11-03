from __future__ import annotations

import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    total = 0
    for ch in letters:
        total = total * 26 + ord(ch.upper()) - ord("A") + 1
    return total - 1


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        data = zf.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(data)
    values: list[str] = []
    for si in root.findall("main:si", NS):
        texts = [t.text or "" for t in si.findall(".//main:t", NS)]
        values.append("".join(texts))
    return values


def workbook_sheets(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall("pkg:Relationship", NS)}
    sheets: list[tuple[str, str]] = []
    for sheet in workbook.findall(".//main:sheet", NS):
        name = sheet.attrib["name"]
        rel_id = sheet.attrib[f"{{{NS['rel']}}}id"]
        target = rel_map[rel_id].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        sheets.append((name, target))
    return sheets


def cell_value(cell: ET.Element, shared: list[str]) -> str:
    value = cell.find("main:v", NS)
    inline = cell.find("main:is/main:t", NS)
    if inline is not None:
        return inline.text or ""
    if value is None:
        return ""
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        try:
            return shared[int(raw)]
        except (ValueError, IndexError):
            return raw
    return raw


def read_rows(zf: zipfile.ZipFile, sheet_path: str, shared: list[str], limit: int = 12) -> list[list[str]]:
    root = ET.fromstring(zf.read(sheet_path))
    rows: list[list[str]] = []
    for row in root.findall(".//main:sheetData/main:row", NS):
        values: list[str] = []
        for cell in row.findall("main:c", NS):
            idx = col_index(cell.attrib.get("r", "A1"))
            while len(values) <= idx:
                values.append("")
            values[idx] = cell_value(cell, shared).strip()
        if any(values):
            rows.append(values)
        if len(rows) >= limit:
            break
    return rows


def main() -> None:
    for arg in sys.argv[1:]:
        path = Path(arg)
        print(f"FILE\t{path}")
        with zipfile.ZipFile(path) as zf:
            shared = read_shared_strings(zf)
            for name, sheet_path in workbook_sheets(zf):
                print(f"SHEET\t{name}\t{sheet_path}")
                for row in read_rows(zf, sheet_path, shared):
                    print("\t".join(row))
                print()


if __name__ == "__main__":
    main()
