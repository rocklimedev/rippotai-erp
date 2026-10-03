"""Extract the supplied workbook verbatim and generate the reviewable MySQL seed.

Usage: bundled-python scripts/extract_quality_template.py "path/to/QUALITY CHECK LIST.xlsx"
Only surrounding whitespace is removed. Repeated checkpoints and original serials remain.
"""
import json
import sys
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
workbook = openpyxl.load_workbook(sys.argv[1], data_only=False)
keys = ['EXCAVATION', 'PCC_WORK', 'FORMWORK_SHUTTERING', 'CONCRETING', 'BRICKWORK',
        'WATERPROOFING', 'PLASTER_WORK', 'PLUMBING', 'ELECTRICAL_LIGHTING', 'HVAC',
        'FALSE_CEILING', 'FLOORING_WORK', 'PAINT_WORK', 'KITCHEN', 'WARDROBE', 'DOORS', 'WINDOWS_GLAZING']
sheets = {'WATERPROOFING': 'Waterproofing', 'PLASTER_WORK': 'Plaster work', 'PLUMBING': 'Plumbing',
          'ELECTRICAL_LIGHTING': 'Electrical & lighting', 'HVAC': 'HVAC', 'FALSE_CEILING': 'FALSE CEILING',
          'FLOORING_WORK': 'FLOORING WORK', 'PAINT_WORK': 'PAINT WORK', 'KITCHEN': 'KITCHEN ',
          'WARDROBE': 'WARDROBE', 'DOORS': 'DOORS', 'WINDOWS_GLAZING': 'WINDOWS & GLAZING '}
heads = [row for row in workbook['QC -Work heads'].values if isinstance(row[0], (int, float))]
assert len(heads) == len(keys), 'Unexpected master work-head topology'
templates = []
for key, head in zip(keys, heads):
    sheet = workbook[sheets[key]] if key in sheets else None
    checkpoints = []
    phase = None
    if sheet:
        for row in sheet.values:
            text = str(row[1] or '').strip()
            phase_key = text.upper().replace(' ', '_')
            if phase_key in ('BEFORE_EXECUTION', 'DURING_EXECUTION', 'AFTER_EXECUTION'):
                phase = phase_key
            elif isinstance(row[0], (int, float)) and text:
                assert phase, 'Checkpoint without phase'
                checkpoints.append({'serial_number': int(row[0]), 'checkpoint_name': text, 'phase': phase})
    templates.append({'work_head': key, 'label': str(head[1]).strip(), 'serial_number': int(head[0]),
                      'sheet_name': sheet.title.strip() if sheet else str(head[1]).strip(),
                      'title': str(sheet.cell(1, 1).value).strip() if sheet else str(head[1]).strip(),
                      'version': '20261003', 'checkpoints': checkpoints})

(root / 'src/modules/site-operations/constants/quality-checklist-template.source.json').write_text(
    json.dumps(templates, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def sql(value):
    # Hex-encoded UTF-8 remains correct under either NO_BACKSLASH_ESCAPES mode.
    return "CONVERT(X'%s' USING utf8mb4)" % str(value).encode('utf-8').hex()

lines = ['-- QUALITY CHECK LIST.xlsx: QC -Work heads and all 12 detailed sheets.',
         '-- Preserves source checkpoint wording, duplicates, phases and serial numbers.',
         '-- Run before deploying the quality checklist workspace. DDL precedes transactional seeds.',
         'CREATE TABLE IF NOT EXISTS quality_checklist_templates (',
         '  work_head VARCHAR(50) NOT NULL PRIMARY KEY, label VARCHAR(255) NOT NULL,',
         '  serial_number INT NOT NULL, sheet_name VARCHAR(100) NOT NULL, title VARCHAR(255) NOT NULL,',
         '  version VARCHAR(30) NOT NULL, checkpoints JSON NOT NULL',
         ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;', '']
for table, column, definition in [
    ('quality_checklists', 'work_head', 'VARCHAR(50) NULL'),
    ('quality_checklists', 'template_version', 'VARCHAR(30) NULL'),
    ('quality_checklists', 'template_title', 'VARCHAR(255) NULL'),
    ('quality_checklists', 'template_sheet_name', 'VARCHAR(100) NULL'),
    ('quality_check_heads', 'work_head', 'VARCHAR(50) NULL'),
    ('quality_check_heads', 'template_serial_number', 'INT NULL'),
]:
    lines += [f"SET @qc_ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '{table}' AND column_name = '{column}') = 0,",
              f"  'ALTER TABLE {table} ADD COLUMN {column} {definition}', 'SELECT 1');",
              'PREPARE qc_stmt FROM @qc_ddl; EXECUTE qc_stmt; DEALLOCATE PREPARE qc_stmt;', '']
lines += ['START TRANSACTION;']
legacy = {'FORMWORK_SHUTTERING': ['Formwork'], 'KITCHEN': ['Kitchen inspection'],
          'WARDROBE': ['Wardrobe inspection'], 'DOORS': ['Doors, windows & glazing', 'Doors & Fixed furniture']}
for template in templates:
    key = template['work_head']
    values = [template[field] for field in ['work_head', 'label', 'serial_number', 'sheet_name', 'title', 'version']]
    values.append(json.dumps(template['checkpoints'], ensure_ascii=False))
    lines += ["INSERT INTO quality_checklist_templates (work_head,label,serial_number,sheet_name,title,version,checkpoints) VALUES (" + ','.join(sql(v) for v in values) + ')',
              'ON DUPLICATE KEY UPDATE label=VALUES(label),serial_number=VALUES(serial_number),sheet_name=VALUES(sheet_name),title=VALUES(title),version=VALUES(version),checkpoints=VALUES(checkpoints);']
    names = legacy.get(key, []) + [template['label']]
    lines += [f"UPDATE quality_check_heads SET work_head={sql(key)}, template_serial_number={template['serial_number']}, name={sql(template['label'])}, is_active=1",
              f"WHERE TRIM(name) IN ({','.join(sql(n) for n in names)}) OR work_head={sql(key)};",
              'SET @qc_next_sort = (SELECT COALESCE(MAX(sort_order),0)+1 FROM quality_check_heads);',
              'INSERT INTO quality_check_heads (id,name,sort_order,is_active,work_head,template_serial_number,created_at,updated_at)',
              f"SELECT UUID(),{sql(template['label'])},@qc_next_sort,1,{sql(key)},{template['serial_number']},NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM quality_check_heads WHERE work_head={sql(key)});", '']
lines += ["UPDATE quality_check_heads SET is_active=0 WHERE work_head IS NULL AND TRIM(name) IN ('Waterproofing (bathroom)', 'Bathroom inspection');",
          '-- Existing project check rows keep their IDs and results; obsolete catalog rows are retained.',
          'COMMIT;', '']
(root / 'migrations/20261003_quality_checklist_template.sql').write_text('\n'.join(lines), encoding='utf-8')
print(f'Extracted {len(templates)} work heads, {sum(len(t["checkpoints"]) for t in templates)} checkpoints.')
