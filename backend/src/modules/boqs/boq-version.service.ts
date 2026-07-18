import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { BoqVersion } from './models/boq-version.model';
import { Boq } from './models/boq.model';

export interface CreateVersionRecordParams {
  /**
   * Id of the very first Boq in this lineage (the "v1" row). Every
   * BoqVersion belonging to the same family shares this value on
   * `boq_id`, which is how getHistory() below can find the whole
   * family starting from *any* version, not just the root.
   */
  rootBoqId: string;
  version: number;
  versionName?: string;
}

@Injectable()
export class BoqVersionService {
  constructor(
    @InjectModel(BoqVersion)
    private readonly versionModel: typeof BoqVersion,
    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,
  ) {}

  /**
   * Creates a BoqVersion row for a given Boq snapshot and points that
   * Boq's `boq_version_id` at the new row. Call this once per Boq
   * snapshot — on initial creation (v1) and on every clone (v2, v3, ...).
   */
  async createVersionRecord(
    boqId: string,
    params: CreateVersionRecordParams,
    transaction?: Transaction,
  ): Promise<BoqVersion> {
    const versionRow = await this.versionModel.create(
      {
        boq_id: params.rootBoqId,
        version: params.version,
        version_name: params.versionName?.trim() || `Version ${params.version}`,
      } as BoqVersion,
      { transaction },
    );

    await this.boqModel.update(
      { boq_version_id: versionRow.id },
      { where: { id: boqId }, transaction },
    );

    return versionRow;
  }

  /**
   * Resolves the root boq id (the family's v1 Boq) for any Boq in a
   * version lineage. Falls back to the boq's own id when it has no
   * boq_version_id yet — e.g. legacy rows created before versioning
   * existed, or a v1 row read mid-transaction before its version
   * record has been attached.
   */
  async resolveRootBoqId(boq: Boq, transaction?: Transaction): Promise<string> {
    if (!boq.boq_version_id) return boq.id;

    const versionRow = await this.versionModel.findByPk(boq.boq_version_id, {
      transaction,
    });

    return versionRow?.boq_id ?? boq.id;
  }

  /**
   * Full version history for a Boq family: every BoqVersion row
   * sharing the same root boq_id, together with the concrete Boq
   * snapshot(s) that point to it, oldest first.
   */
  async getHistory(boqId: string) {
    const boq = await this.boqModel.findByPk(boqId);

    if (!boq) {
      throw new NotFoundException('BOQ not found');
    }

    const rootBoqId = await this.resolveRootBoqId(boq);

    return this.versionModel.findAll({
      where: {
        boq_id: rootBoqId,
      },
      include: [
        {
          model: Boq,
          as: 'versionBoqs', // <-- IMPORTANT
          attributes: [
            'id',
            'title',
            'status',
            'version',
            'total_value',
            'locked',
            'updated_at',
          ],
        },
      ],
      order: [['version', 'ASC']],
    });
  }
  /**
   * Renames a single version entry (e.g. "Client revision 2") without
   * touching the underlying Boq snapshot.
   */
  async renameVersion(versionId: string, versionName: string) {
    const versionRow = await this.versionModel.findByPk(versionId);
    if (!versionRow) throw new NotFoundException('BOQ version not found');

    await versionRow.update({ version_name: versionName });
    return versionRow;
  }
}
