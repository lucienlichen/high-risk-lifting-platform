from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

from inspect_xlsx import read_rows, read_shared_strings, workbook_sheets
import zipfile

ROOT = Path(__file__).resolve().parents[1]
YONGGANG_ENTERPRISE = "江苏永钢集团有限公司"
YONGGANG_EXPECTED_COUNT = 365
YONGGANG_WORKBOOK = "outputs/yonggang-region-split-20260819/江苏永钢集团起重机清单-区域位置拆分版.xlsx"


def demo_records() -> list[dict]:
    text = (ROOT / "src/mock/demoDeviceRecords.ts").read_text(encoding="utf-8")
    marker = "export const demoDeviceRecords: DemoDeviceRecord[] = "
    start = text.index(marker) + len(marker)
    start = text.index("[", start)
    end = text.rindex("]")
    return json.loads(text[start : end + 1])


def allocation_rows() -> list[dict]:
    text = (ROOT / "src/mock/index.ts").read_text(encoding="utf-8")
    rows = []
    for line in text.splitlines():
        match = re.search(
            r"\{\s*enterprise:\s*'([^']+)'\s*,\s*affiliatedUnit:\s*'([^']+)'\s*,\s*workArea:\s*'([^']+)'\s*,\s*count:\s*(\d+)",
            line,
        )
        if match:
            rows.append({
                "enterprise": match.group(1),
                "affiliatedUnit": match.group(2),
                "workArea": match.group(3),
                "count": int(match.group(4)),
            })
    return rows


def scene_for_enterprise(name: str) -> str:
    if name in {"本钢集团", "江苏永钢集团有限公司"}:
        return "冶金起重装备"
    if name in {"青岛港", "连云港港口"}:
        return "港口起重装备"
    if name == "招商局金陵船舶（江苏）有限公司":
        return "造船起重装备"
    if name == "中国建筑":
        return "建筑起重装备"
    return "未知"


def displayed_levels(units: dict[str, set[str]]) -> tuple[int, str]:
    has_third = any(unit != "本部" and len(areas) > 1 for unit, areas in units.items())
    if has_third:
        return 3, "企业名称 -> 所属单位 -> 作业区域 -> 设备"
    return 2, "企业名称 -> 所属单位 -> 设备"


def runtime_unit(record: dict) -> tuple[str, str]:
    if record["enterprise"] == YONGGANG_ENTERPRISE:
        unit = str(record.get("affiliatedUnit") or "").strip()
        area = str(record.get("workArea") or "").strip()
        if not unit or not area:
            raise ValueError(
                f"永钢记录必须使用显式 affiliatedUnit/workArea 层级：id={record.get('id')!r}, "
                f"affiliatedUnit={unit!r}, workArea={area!r}"
            )
        return unit, area
    if record["enterprise"] == "招商局金陵船舶（江苏）有限公司":
        raw = record.get("location") or "未分组"
        for prefix in ("机舱分段车间", "船体厂房", "管加工", "集配仓库"):
            if raw.startswith(prefix): return prefix, prefix
        match = re.match(r"^(\d+#(?:船坞|坞))", raw)
        unit = match.group(1) if match else raw[:4]
        return unit, unit
    return record.get("affiliatedUnit") or "本部", record.get("workArea") or "未分组"


def xlsx_record_count(path: str) -> int:
    total = 0
    with zipfile.ZipFile(ROOT / path) as zf:
        shared = read_shared_strings(zf)
        for _name, sheet_path in workbook_sheets(zf):
            rows = read_rows(zf, sheet_path, shared, 100000)
            if rows:
                total += max(0, len(rows) - 1)
    return total


def xlsx_sheet_record_count(path: str, target_sheet: str) -> int:
    with zipfile.ZipFile(ROOT / path) as zf:
        shared = read_shared_strings(zf)
        for name, sheet_path in workbook_sheets(zf):
            if name == target_sheet:
                rows = read_rows(zf, sheet_path, shared, 100000)
                return max(0, len(rows) - 1)
    return 0


def main() -> None:
    exact = demo_records()
    allocations = allocation_rows()

    exact_enterprises = {"本钢集团", YONGGANG_ENTERPRISE, "青岛港", "连云港港口", "招商局金陵船舶（江苏）有限公司"}

    enterprise_devices: dict[str, int] = defaultdict(int)
    enterprise_units: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    source_types: dict[str, set[str]] = defaultdict(set)

    for row in exact:
        enterprise = row["enterprise"]
        enterprise_devices[enterprise] += 1
        unit, area = runtime_unit(row)
        enterprise_units[enterprise][unit].add(area)
        source_types[enterprise].add(str(row["source"]))

    for row in allocations:
        enterprise = row["enterprise"]
        if enterprise in exact_enterprises:
            continue
        enterprise_devices[enterprise] += row["count"]
        enterprise_units[enterprise][row["affiliatedUnit"]].add(row["workArea"])
        source_types[enterprise].add("mock-allocation")

    yonggang_workbook_count = xlsx_sheet_record_count(YONGGANG_WORKBOOK, "Sheet1")
    if yonggang_workbook_count != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"永钢拆分版 Sheet1 应有 {YONGGANG_EXPECTED_COUNT} 条设备记录，实际为 {yonggang_workbook_count} 条"
        )
    if enterprise_devices[YONGGANG_ENTERPRISE] != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"系统永钢设备应为 {YONGGANG_EXPECTED_COUNT} 台，实际为 {enterprise_devices[YONGGANG_ENTERPRISE]} 台"
        )

    excel_counts = {
        "本钢集团": "1614（已按 Excel 明细）",
        YONGGANG_ENTERPRISE: f"{yonggang_workbook_count}（区域/具体位置拆分版 Sheet1）",
        "青岛港": f"{xlsx_record_count('示范应用单位/青岛港口应用示范单位-起重机械设备明细.xlsx')}（已按 Excel 明细）",
        "连云港港口": "385（一览表标准，已按台账裁剪/补齐）",
        "招商局金陵船舶（江苏）有限公司": "125（已按筛选后 Excel 明细）",
        "中国建筑": "无 Excel，当前为合成 mock",
    }

    print("| 场景 | 企业 | 系统设备数 | Excel/标准数 | 平台层级数 | 当前层级口径 | 所属单位数 | 作业区域数 | 数据来源/备注 |")
    print("|---|---:|---:|---:|---:|---|---:|---:|---|")
    for enterprise in sorted(enterprise_devices.keys(), key=lambda x: (scene_for_enterprise(x), x)):
        units = enterprise_units[enterprise]
        levels, label = displayed_levels(units)
        area_count = sum(len(areas) for areas in units.values())
        sources = ", ".join(sorted(source_types[enterprise]))
        print(
            f"| {scene_for_enterprise(enterprise)} | {enterprise} | {enterprise_devices[enterprise]} | "
            f"{excel_counts.get(enterprise, '未提供')} | {levels} | {label} | {len(units)} | {area_count} | {sources} |"
        )

    print("\n| 企业 | 所属单位 | 作业区域 | 系统设备数 |")
    print("|---|---|---|---:|")
    area_counts: dict[tuple[str, str, str], int] = defaultdict(int)
    for row in exact:
        unit, area = runtime_unit(row)
        area_counts[(row["enterprise"], unit, area)] += 1
    for row in allocations:
        if row["enterprise"] in exact_enterprises:
            continue
        area_counts[(row["enterprise"], row["affiliatedUnit"], row["workArea"])] += row["count"]
    yonggang_area_total = sum(
        count
        for (enterprise, _unit, _area), count in area_counts.items()
        if enterprise == YONGGANG_ENTERPRISE
    )
    if yonggang_area_total != YONGGANG_EXPECTED_COUNT:
        raise ValueError(
            f"永钢区域设备合计应为 {YONGGANG_EXPECTED_COUNT} 台，实际为 {yonggang_area_total} 台"
        )
    for (enterprise, unit, area), count in sorted(area_counts.items(), key=lambda item: (scene_for_enterprise(item[0][0]), item[0][0], item[0][1], item[0][2])):
        print(f"| {enterprise} | {unit} | {area} | {count} |")


if __name__ == "__main__":
    main()
