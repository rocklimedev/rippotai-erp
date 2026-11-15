// Project codes PRJ-001, PRJ-002 … (migration 20261115_proto_project_codes.sql).
// Every project creation path ends up here: the Project model's AfterCreate
// hook and the raw-SQL fallback in the pipeline (leads) service.
import { QueryTypes, Transaction } from 'sequelize';
import type { Sequelize } from 'sequelize';

export const PROJECT_CODE_RE = /^PRJ-\d+$/;

let hasColumn: boolean | undefined;

async function codeColumnExists(db: Sequelize) {
  if (hasColumn !== undefined) return hasColumn;
  const rows: any[] = await db.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'code'`,
    { type: QueryTypes.SELECT },
  );
  hasColumn = rows.length > 0;
  return hasColumn;
}

/** Gives the project the next free PRJ-### code (no-op when it already has one). */
export async function assignProjectCode(
  db: Sequelize,
  projectId: string,
  transaction?: Transaction | null,
): Promise<string | null> {
  if (!projectId || !(await codeColumnExists(db))) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await db.query(
        `UPDATE projects p
           JOIN (SELECT COALESCE(MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)), 0) + 1 AS n
                   FROM projects WHERE code REGEXP '^PRJ-[0-9]+$') m
            SET p.code = CONCAT('PRJ-', LPAD(m.n, 3, '0'))
          WHERE p.id = :projectId AND p.code IS NULL`,
        { replacements: { projectId }, transaction: transaction ?? undefined },
      );
      break;
    } catch (e: any) {
      const dup =
        e?.original?.code === 'ER_DUP_ENTRY' ||
        /Duplicate entry/i.test(e?.message ?? '');
      if (!dup || attempt === 4) throw e;
    }
  }
  const [row]: any[] = await db.query(
    'SELECT code FROM projects WHERE id = :projectId',
    {
      replacements: { projectId },
      type: QueryTypes.SELECT,
      transaction: transaction ?? undefined,
    },
  );
  return row?.code ?? null;
}
