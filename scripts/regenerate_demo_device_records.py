from __future__ import annotations

import json
import re
import zipfile
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable

from inspect_xlsx import read_rows, read_shared_strings, workbook_sheets

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/mock/demoDeviceRecords.ts"
YONGGANG_ENTERPRISE = "江苏永钢集团有限公司"
YONGGANG_EXPECTED_COUNT = 365
YONGGANG_WORKBOOK = (
    ROOT
    / "outputs/yonggang-region-split-20260819"
    / "江苏永钢集团起重机清单-区域位置拆分版.xlsx"
)


def xlsx_rows(path: Path, sheet_name: str | None = None) -> list[list[str]]:
    with zipfile.ZipFile(path) as zf:
        shared = read_shared_strings(zf)
        sheets = workbook_sheets(zf)
        sheet_path = sheets[0][1]
        if sheet_name:
            sheet_path = next(path for name, path in sheets if name == sheet_name)
        return read_rows(zf, sheet_path, shared, 100000)


def xlsx_table(path: Path, sheet_name: str | None = None) -> list[dict[str, str]]:
    rows = xlsx_rows(path, sheet_name)
    header = rows[0]
    records: list[dict[str, str]] = []
    for raw in rows[1:]:
        row = {name: raw[i].strip() if i < len(raw) else "" for i, name in enumerate(header)}
        if any(row.values()):
            records.append(row)
    return records


def existing_records() -> list[dict]:
    text = OUTPUT.read_text(encoding="utf-8")
    marker = "export const demoDeviceRecords: DemoDeviceRecord[] = "
    start = text.index(marker) + len(marker)
    start = text.index("[", start)
    end = text.rindex("]")
    return json.loads(text[start : end + 1])


def clean(value: str | None, fallback: str = "") -> str:
    if value is None:
        return fallback
    value = str(value).strip()
    return value if value else fallback


def excel_date(value: str, fallback: str = "") -> str:
    value = clean(value)
    if not value:
        return fallback
    if re.fullmatch(r"\d+(\.\d+)?", value):
        try:
            days = int(float(value))
            return (datetime(1899, 12, 30) + timedelta(days=days)).strftime("%Y-%m-%d")
        except ValueError:
            return value
    if re.fullmatch(r"\d{4}[./-]\d{1,2}([./-]\d{1,2})?", value):
        parts = re.split(r"[./-]", value)
        if len(parts) == 2:
            return f"{parts[0]}-{int(parts[1]):02d}"
        return f"{parts[0]}-{int(parts[1]):02d}-{int(parts[2]):02d}"
    return value


def compact_params(items: Iterable[tuple[str, str]]) -> list[dict[str, str]]:
    params: list[dict[str, str]] = []
    for name, value in items:
        value = clean(value)
        if value:
            params.append({"name": name, "value": value})
        if len(params) >= 6:
            break
    return params


def qingdao_records() -> list[dict]:
    rows = xlsx_table(ROOT / "示范应用单位/青岛港口应用示范单位-起重机械设备明细.xlsx")
    records = []
    for i, row in enumerate(rows, 1):
        unit = clean(row.get("使用单位"), "青岛港")
        town = clean(row.get("乡镇"), clean(row.get("区县"), "未分组"))
        register_code = clean(row.get("注册代码"))
        certificate = clean(row.get("登记证编号"))
        code = register_code or certificate or f"QD-{i:04d}"
        records.append({
            "id": f"port-qingdao-{i:04d}",
            "source": "QD-XLSX",
            "sourceIndex": i,
            "scene": "port",
            "enterprise": "青岛港",
            "affiliatedUnit": unit,
            "workArea": town,
            "name": "起重机械",
            "code": code,
            "type": "起重机械",
            "location": clean(row.get("设备地点"), town),
            "manufacturer": "未登记",
            "installDate": "未登记",
            "statusText": "在用",
            "technicalParams": compact_params([
                ("登记证编号", certificate),
                ("区县", row.get("区县", "")),
                ("乡镇", town),
                ("下次检验日期", excel_date(row.get("下次检验日期", ""))),
                ("使用单位联系人", row.get("使用单位联系人", "")),
                ("使用单位联系电话", row.get("使用单位联系电话", "")),
            ]),
        })
    return records


LIANYUNGANG_OVERVIEW = [
    ("江苏连云港港口股份有限公司东方港务分公司", "东方港务分公司", 135),
    ("连云港新东方国际货柜码头有限公司", "新东方国际货柜码头", 46),
    ("连云港新东方集装箱码头有限公司", "新东方集装箱码头", 37),
    ("连云港新海湾码头有限公司", "新海湾码头", 28),
    ("连云港新圩港码头有限公司", "新圩港码头", 26),
    ("连云港新云台码头有限公司", "新云台码头", 22),
    ("江苏连云港港口股份有限公司", "港口股份本部", 11),
    ("连云港东粮码头有限公司", "东粮码头", 16),
    ("连云港新银湾码头有限公司", "新银湾码头", 15),
    ("新陆桥（连云港）码头有限公司", "新陆桥码头", 14),
    ("江苏新龙港港口有限公司", "新龙港港口", 13),
    ("连云港鸿云实业有限公司", "鸿云实业", 8),
    ("连云港港口控股集团灌云有限公司", "灌云港区", 7),
    ("连云港新苏港码头有限公司", "新苏港码头", 7),
]


def lianyungang_records() -> list[dict]:
    rows = xlsx_table(ROOT / "示范应用单位/江苏连云港/连云港港口在用起重机台账 - 1.xlsx")
    by_unit: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        by_unit.setdefault(clean(row.get("使用单位")), []).append(row)

    records = []
    source_index = 1
    for unit, work_area, required_count in LIANYUNGANG_OVERVIEW:
        selected = by_unit.get(unit, [])[:required_count]
        for row in selected:
            device_name = clean(row.get("设备名称"), clean(row.get("设备品种"), "起重机械"))
            device_type = clean(row.get("设备品种"), clean(row.get("设备名称"), "起重机械"))
            code = clean(row.get("档案号"), clean(row.get("单位内部编号"), clean(row.get("出厂编号"), f"LYG-{source_index:04d}")))
            records.append({
                "id": f"port-lianyungang-{source_index:04d}",
                "source": "LYG-XLSX",
                "sourceIndex": source_index,
                "scene": "port",
                "enterprise": "连云港港口",
                "affiliatedUnit": unit,
                "workArea": work_area,
                "name": device_name,
                "code": code,
                "type": device_type,
                "location": clean(row.get("设备使用地点"), work_area),
                "manufacturer": clean(row.get("原制造单位"), "未登记"),
                "installDate": excel_date(row.get("出厂日期", ""), "未登记"),
                "statusText": clean(row.get("设备状态"), "在用"),
                "technicalParams": compact_params([
                    ("规格型号", row.get("规格型号", "")),
                    ("额定起重量", row.get("起重量（t）", "")),
                    ("起重力矩", row.get("起重力矩（kNm）", "")),
                    ("跨度", row.get("跨度", "")),
                    ("起升速度", row.get("各起升机构起升速度", "") or row.get("起升速度(带载)(m/min)", "")),
                    ("起升高度", row.get("各起升机构起升高度", "")),
                ]),
            })
            source_index += 1

        for fill_i in range(required_count - len(selected)):
            source_index += 1
            records.append({
                "id": f"port-lianyungang-fill-{source_index:04d}",
                "source": "LYG-OVERVIEW-FILL",
                "sourceIndex": source_index,
                "scene": "port",
                "enterprise": "连云港港口",
                "affiliatedUnit": unit,
                "workArea": work_area,
                "name": "起重机械",
                "code": f"LYG-FILL-{source_index:04d}",
                "type": "起重机械",
                "location": work_area,
                "manufacturer": "未登记",
                "installDate": "未登记",
                "statusText": "在用",
                "technicalParams": [{"name": "数据来源", "value": "连云港应用示范地域-数量-一览表"}],
            })
    return records


def yonggang_records(all_existing_records: list[dict]) -> list[dict]:
    rows = xlsx_table(YONGGANG_WORKBOOK, "Sheet1")
    if len(rows) != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"永钢拆分版 Sheet1 应有 {YONGGANG_EXPECTED_COUNT} 条设备记录，实际为 {len(rows)} 条"
        )

    missing_regions = [i for i, row in enumerate(rows, 2) if not clean(row.get("区域"))]
    if missing_regions:
        preview = ", ".join(str(row_number) for row_number in missing_regions[:10])
        suffix = "……" if len(missing_regions) > 10 else ""
        raise ValueError(f"永钢拆分版“区域”存在空值，Excel 行号：{preview}{suffix}")

    missing_codes = [i for i, row in enumerate(rows, 2) if not clean(row.get("单位内部编号"))]
    if missing_codes:
        preview = ", ".join(str(row_number) for row_number in missing_codes[:10])
        suffix = "……" if len(missing_codes) > 10 else ""
        raise ValueError(f"永钢拆分版“单位内部编号”存在空值，Excel 行号：{preview}{suffix}")

    workbook_codes = [clean(row.get("单位内部编号")) for row in rows]
    duplicate_workbook_codes = sorted(code for code, count in Counter(workbook_codes).items() if count > 1)
    if duplicate_workbook_codes:
        preview = ", ".join(duplicate_workbook_codes[:10])
        suffix = "……" if len(duplicate_workbook_codes) > 10 else ""
        raise ValueError(f"永钢拆分版“单位内部编号”重复：{preview}{suffix}")

    existing_yonggang = [
        record
        for record in all_existing_records
        if record.get("enterprise") == YONGGANG_ENTERPRISE or record.get("source") == "YG-XLSX"
    ]
    if len(existing_yonggang) != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"现有永钢设备身份基线应为 {YONGGANG_EXPECTED_COUNT} 条，实际为 {len(existing_yonggang)} 条"
        )
    existing_codes = [clean(record.get("code")) for record in existing_yonggang]
    missing_existing_codes = [
        clean(record.get("id"), f"sourceIndex={record.get('sourceIndex')}")
        for record in existing_yonggang
        if not clean(record.get("code"))
    ]
    if missing_existing_codes:
        raise ValueError(f"现有永钢记录缺少 code：{', '.join(missing_existing_codes[:10])}")
    duplicate_existing_codes = sorted(code for code, count in Counter(existing_codes).items() if count > 1)
    if duplicate_existing_codes:
        preview = ", ".join(duplicate_existing_codes[:10])
        suffix = "……" if len(duplicate_existing_codes) > 10 else ""
        raise ValueError(f"现有永钢记录 code 重复，无法稳定复用设备身份：{preview}{suffix}")

    existing_by_code = {clean(record.get("code")): record for record in existing_yonggang}
    used_ids = {clean(record.get("id")) for record in all_existing_records if clean(record.get("id"))}
    existing_source_indices = [record.get("sourceIndex") for record in existing_yonggang]
    invalid_source_indices = [value for value in existing_source_indices if not isinstance(value, int) or value < 1]
    if invalid_source_indices:
        raise ValueError(f"现有永钢记录含无效 sourceIndex：{invalid_source_indices[:10]}")
    duplicate_source_indices = sorted(
        source_index
        for source_index, count in Counter(existing_source_indices).items()
        if count > 1
    )
    if duplicate_source_indices:
        raise ValueError(f"现有永钢记录 sourceIndex 重复：{duplicate_source_indices[:10]}")
    existing_ids = [clean(record.get("id")) for record in existing_yonggang]
    missing_existing_ids = [
        f"code={record.get('code')!r}, sourceIndex={record.get('sourceIndex')!r}"
        for record in existing_yonggang
        if not clean(record.get("id"))
    ]
    if missing_existing_ids:
        raise ValueError(f"现有永钢记录缺少 id：{'; '.join(missing_existing_ids[:10])}")
    duplicate_existing_ids = sorted(record_id for record_id, count in Counter(existing_ids).items() if count > 1)
    if duplicate_existing_ids:
        raise ValueError(f"现有永钢记录 id 重复：{duplicate_existing_ids[:10]}")

    used_source_indices = set(existing_source_indices)
    next_source_index = max(used_source_indices, default=0) + 1

    def allocate_identity(code: str) -> tuple[str, int]:
        nonlocal next_source_index
        existing = existing_by_code.get(code)
        if existing is not None:
            return clean(existing.get("id")), int(existing["sourceIndex"])

        while True:
            candidate_id = f"metallurgy-yonggang-{next_source_index:04d}"
            if next_source_index not in used_source_indices and candidate_id not in used_ids:
                source_index = next_source_index
                used_source_indices.add(source_index)
                used_ids.add(candidate_id)
                next_source_index += 1
                return candidate_id, source_index
            next_source_index += 1

    records = []
    for row in rows:
        device_type = clean(row.get("设备品种"), "起重机械")
        code = clean(row.get("单位内部编号"))
        region = clean(row.get("区域"))
        location = clean(row.get("具体位置"), region)
        record_id, source_index = allocate_identity(code)
        records.append({
            "id": record_id,
            "source": "YG-XLSX",
            "sourceIndex": source_index,
            "scene": "metallurgy",
            "enterprise": YONGGANG_ENTERPRISE,
            "affiliatedUnit": region,
            "workArea": region,
            "name": device_type,
            "code": code,
            "type": device_type,
            "location": location,
            "manufacturer": clean(row.get("原制造单位"), "未登记"),
            "installDate": "未登记",
            "statusText": "在用",
            "technicalParams": compact_params([
                ("规格型号", row.get("规格型号", "")),
                ("额定起重量", row.get("起重量（t）", "")),
                ("起重力矩", row.get("起重力矩（kNm）", "")),
                ("跨度", row.get("跨度", "")),
                ("起升速度", row.get("各起升机构起升速度", "")),
                ("起升高度", row.get("各起升机构起升高度", "")),
            ]),
        })

    if len(records) != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"永钢生成记录应为 {YONGGANG_EXPECTED_COUNT} 条，实际为 {len(records)} 条"
        )
    for key in ("id", "sourceIndex", "code"):
        values = [record[key] for record in records]
        duplicates = [value for value, count in Counter(values).items() if count > 1]
        if duplicates:
            raise ValueError(f"永钢生成记录 {key} 重复：{duplicates[:10]}")
    region_total = sum(Counter(record["workArea"] for record in records).values())
    if region_total != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"永钢区域合计应为 {YONGGANG_EXPECTED_COUNT} 台，实际为 {region_total} 台"
        )
    return records


def shipbuilding_records() -> list[dict]:
    rows = xlsx_table(ROOT / "示范应用单位/招商局金陵船舶/招商局金陵船舶起重机明细表-删减.xlsx", "筛选后")
    records = []
    for i, row in enumerate(rows, 1):
        device_name = clean(row.get("设备名称"), clean(row.get("设备品种"), "起重机械"))
        device_type = clean(row.get("设备品种"), device_name)
        location = clean(row.get("设备使用地点"), "未分组")
        code = clean(row.get("档案号"), clean(row.get("单位内部编号"), clean(row.get("出厂编号"), f"ZC-{i:04d}")))
        records.append({
            "id": f"shipbuilding-zhaoshang-{i:04d}",
            "source": "ZC-XLS",
            "sourceIndex": i,
            "scene": "shipbuilding",
            "enterprise": "招商局金陵船舶（江苏）有限公司",
            "affiliatedUnit": "本部",
            "workArea": location,
            "name": device_name,
            "code": code,
            "type": device_type,
            "location": location,
            "manufacturer": clean(row.get("原制造单位"), "未登记"),
            "installDate": excel_date(row.get("检验日期", ""), "未登记"),
            "statusText": clean(row.get("设备状态"), "在用"),
            "technicalParams": compact_params([
                ("额定起重量", f"{row.get('起重量（t）', '')}t" if clean(row.get("起重量（t）", "")) else ""),
                ("跨度", f"{row.get('跨度', '')}m" if clean(row.get("跨度", "")) else ""),
                ("起升速度", f"{row.get('各起升机构起升速度', '')}m/min" if clean(row.get("各起升机构起升速度", "")) else ""),
                ("起升高度", f"{row.get('各起升机构起升高度', '')}m" if clean(row.get("各起升机构起升高度", "")) else ""),
                ("安全管理部门", row.get("安全管理部门", "")),
                ("下次检验日期", excel_date(row.get("下次检验日期", ""))),
            ]),
        })
    return records


def normalize_benxi_storage_hierarchy(record: dict) -> dict:
    if record.get("enterprise") != "本钢集团":
        return record
    area = record.get("workArea", "")
    mapping = {
        "储运（板材区域）": "板材板块",
        "储运（北营区域）": "北营板块",
        "储运（矿业区域）": "矿业板块",
    }
    if area in mapping:
        record = {**record, "affiliatedUnit": mapping[area]}
    return record


def main() -> None:
    current_records = existing_records()
    regenerated_sources = {"QD-XLSX", "LYG-XLSX", "LYG-OVERVIEW-FILL", "YG-XLSX", "ZC-XLS"}
    kept = [
        r for r in current_records
        if r.get("source") not in regenerated_sources
        and r.get("enterprise") != YONGGANG_ENTERPRISE
        and r.get("scene") != "port"
        and r.get("scene") != "shipbuilding"
    ]
    kept = [normalize_benxi_storage_hierarchy(record) for record in kept]
    records = kept + yonggang_records(current_records) + shipbuilding_records() + qingdao_records() + lianyungang_records()
    expected_counts = {
        YONGGANG_ENTERPRISE: YONGGANG_EXPECTED_COUNT,
        "招商局金陵船舶（江苏）有限公司": 125,
        "青岛港": 712,
    }
    for enterprise, expected in expected_counts.items():
        actual = sum(1 for record in records if record.get("enterprise") == enterprise)
        if actual != expected:
            raise ValueError(f"{enterprise} expected {expected} records, got {actual}")
    benxi = [record for record in records if record.get("enterprise") == "本钢集团"]
    if len(benxi) != 1614:
        raise ValueError(f"本钢集团 expected 1614 records, got {len(benxi)}")
    block_counts = {block: sum(record.get("affiliatedUnit") == block for record in benxi) for block in ("板材板块", "北营板块", "矿业板块")}
    if block_counts != {"板材板块": 883, "北营板块": 493, "矿业板块": 238}:
        raise ValueError(f"本钢板块 counts mismatch: {block_counts}")
    storage_counts = {area: sum(record.get("workArea") == area for record in benxi) for area in ("储运（板材区域）", "储运（北营区域）", "储运（矿业区域）")}
    if storage_counts != {"储运（板材区域）": 27, "储运（北营区域）": 23, "储运（矿业区域）": 17}:
        raise ValueError(f"本钢储运 counts mismatch: {storage_counts}")
    body = json.dumps(records, ensure_ascii=False, indent=2)
    text = """// Generated from files under 示范应用单位/.
// Do not edit individual records by hand; regenerate from the source spreadsheets when they change.

export interface DemoDeviceRecord {
  id: string
  source: string
  sourceIndex: number
  scene: string
  enterprise: string
  affiliatedUnit: string
  workArea: string
  name: string
  code: string
  type: string
  location: string
  manufacturer: string
  installDate: string
  statusText: string
  technicalParams: { name: string; value: string }[]
}

export const demoDeviceRecords: DemoDeviceRecord[] = %s
""" % body
    OUTPUT.write_text(text, encoding="utf-8")
    print(f"wrote {len(records)} records")
    print(f"yonggang {len([r for r in records if r.get('source') == 'YG-XLSX'])}")
    print(f"shipbuilding {len([r for r in records if r.get('source') == 'ZC-XLS'])}")
    print(f"qingdao {len([r for r in records if r.get('source') == 'QD-XLSX'])}")
    print(f"lianyungang {len([r for r in records if str(r.get('source', '')).startswith('LYG')])}")


if __name__ == "__main__":
    main()
