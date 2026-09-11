import { BadRequestException, Injectable } from '@nestjs/common';
import { ZohoCrmService } from '../zoho/crm/zoho-crm.service'; // adjust path to wherever ZohoCrmService actually lives

// ------------------------------------------------------------------
// Canonical Bigin Pipeline stages, in board order — matches the
// pipeline configured in Zoho Bigin (Settings > Pipelines), shown
// left to right on the actual Bigin board: Qualification, Needs
// Analysis, Proposal/Price Quote, Negotiation/Review, Closed Won,
// Closed Lost.
//
// If the pipeline is edited in Bigin, update this list — the board
// always renders every stage as a column (even with 0 deals), same
// as Bigin itself does.
// ------------------------------------------------------------------
const STAGES = [
  'Qualification',
  'Needs Analysis',
  'Proposal/Price Quote',
  'Negotiation/Review',
  'Closed Won',
  'Closed Lost',
];

const CLOSED_STAGES = new Set(['Closed Won', 'Closed Lost']);

// Fields pulled from Bigin's Pipelines module for the board. Bigin
// requires an explicit `fields` param on every GET (see
// ZohoCrmService.withFields) — this overrides that generic default
// with everything the board/card actually needs in one call.
//
// NOTE: Card_Color, Tag, WhatsApp, Quoted_Amount, Quote_Timeline are
// examples of *custom* fields — rename these to match the real API
// names configured on your Pipelines module (Settings > Modules and
// Fields > Pipelines) if they differ.
const BOARD_FIELDS = [
  'id',
  'Deal_Name',
  'Stage',
  'Amount',
  'Closing_Date',
  'Contact_Name',
  'Account_Name',
  'Created_Time',
  'Owner',
  'Phone',
  'WhatsApp',
  'Card_Color',
  'Tag',
  'Quoted_Amount',
  'Quote_Timeline',
  'Description',
].join(',');

// Fields for the flat ContactsView list. Email/Mailing_City/
// Lead_Source are guessed API names for "email", "location" and
// "type" — Pipelines records don't have these by default in Bigin,
// so either add matching custom fields on Pipelines, or fetch them
// from the linked Contact/Company record instead and merge here.
const LIST_FIELDS = [
  'id',
  'Deal_Name',
  'Stage',
  'Amount',
  'Contact_Name',
  'Account_Name',
  'Owner',
  'Phone',
  'WhatsApp',
  'Email',
  'Mailing_City',
  'Lead_Source',
  'Created_Time',
].join(',');

const STUCK_AFTER_DAYS = 14;

// ------------------------------------------------------------------
// NewLeadPage's "Budget Range" field is a free-text select like
// "₹25L–₹75L" or "₹5Cr+", not a number — this turns it into a rough
// rupee estimate (midpoint of the range, or the single value if
// there's only one) so new leads still contribute to the pipeline
// value totals shown on the board. Purely an estimate; the raw string
// is also stored as-is (see Budget_Range below) so nothing is lost.
// ------------------------------------------------------------------

function parseINR(token: string): number | null {
  const match = token.trim().match(/^₹?\s*([\d.]+)\s*(l|cr)?$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = (match[2] || '').toUpperCase();
  const multiplier = unit === 'CR' ? 10000000 : unit === 'L' ? 100000 : 1;

  return value * multiplier;
}

function parseBudgetRange(range?: string): number | null {
  if (!range) return null;

  const clean = range.replace(/under\s*/i, '').replace('+', '');

  const nums = clean
    .split(/[–-]/)
    .map((part) => parseINR(part))
    .filter((n): n is number => n != null);

  if (!nums.length) return null;

  return nums.length === 1 ? nums[0] : (nums[0] + nums[1]) / 2;
}

interface CreateLeadInput {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  type?: string;
  location?: string;
  size?: string;
  budget?: string;
  timeline?: string;
  source?: string;
}

@Injectable()
export class LeadsService {
  constructor(private readonly zohoCrmService: ZohoCrmService) {}

  // ============================================================
  // BOARD
  // ============================================================

  async getBoard(ownerKey: string) {
    const response = await this.zohoCrmService.getPipelines(ownerKey, {
      fields: BOARD_FIELDS,
      per_page: 200,
    });

    const records = response?.data || [];

    const columns = STAGES.map((stage) => ({
      id: stage,
      label: stage,
      leads: [] as ReturnType<LeadsService['toLead']>[],
    }));

    const columnById = new Map(columns.map((c) => [c.id, c]));

    let activeCount = 0;

    for (const record of records) {
      const lead = this.toLead(record);

      // A Stage value we don't recognise (e.g. a stage added in
      // Bigin after STAGES was last updated) gets its own column
      // appended, instead of silently dropping the lead.
      let column = columnById.get(lead.stage);

      if (!column) {
        column = { id: lead.stage, label: lead.stage, leads: [] };
        columnById.set(lead.stage, column);
        columns.push(column);
      }

      column.leads.push(lead);

      if (!CLOSED_STAGES.has(lead.stage)) {
        activeCount += 1;
      }
    }

    return { columns, activeCount };
  }

  // ============================================================
  // CREATE LEAD (NewLeadPage)
  // Lands in the first pipeline stage, same as capturing a new deal
  // manually in Bigin does.
  // ============================================================

  async createLead(ownerKey: string, body: CreateLeadInput) {
    if (!body?.name?.trim()) {
      throw new BadRequestException("Enter the lead's full name.");
    }

    if (!body?.phone?.trim()) {
      throw new BadRequestException('A phone number is required.');
    }

    const amount = parseBudgetRange(body.budget);

    const created = await this.zohoCrmService.createPipeline(ownerKey, {
      Deal_Name: body.name,
      Stage: STAGES[0],
      Phone: body.phone,
      WhatsApp: body.whatsapp,
      Email: body.email,
      Amount: amount ?? undefined,
      // Custom fields — rename to match the actual API names on your
      // Pipelines module (Settings > Modules and Fields > Pipelines)
      // if these differ.
      Project_Type: body.type,
      Mailing_City: body.location,
      Approx_Size: body.size,
      Budget_Range: body.budget,
      Expected_Timeline: body.timeline,
      Lead_Source: body.source,
    });

    const result = created?.data?.[0];

    if (!result || result.status !== 'success') {
      throw new BadRequestException(
        result?.message || 'Failed to create lead in Zoho Bigin.',
      );
    }

    const id = result.details?.id;

    // The create response only confirms success + the new id, not
    // the full record — fetch it back so we can return the assigned
    // Owner (NewLeadPage shows "assigned to {owner}" from this).
    const fetched = await this.zohoCrmService.getRecord(
      ownerKey,
      'Pipelines',
      id,
      {
        fields: 'id,Deal_Name,Owner,Stage',
      },
    );

    const record = fetched?.data?.[0];

    return {
      id,
      name: record?.Deal_Name || body.name,
      owner: record?.Owner?.name || 'Unassigned',
      stage: record?.Stage || STAGES[0],
    };
  }

  // ============================================================
  // FLAT LEADS LIST (ContactsView) — searchable, sortable
  // ============================================================

  async getLeads(ownerKey: string, { q, sort }: { q?: string; sort?: string }) {
    const response = await this.zohoCrmService.getPipelines(ownerKey, {
      fields: LIST_FIELDS,
      per_page: 200,
    });

    let rows = (response?.data || []).map((r) => this.toContactRow(r));

    if (q) {
      const needle = q.trim().toLowerCase();

      rows = rows.filter((row) =>
        [row.name, row.phone, row.email, row.location, row.owner]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle)),
      );
    }

    rows.sort(this.comparatorFor(sort));

    return rows;
  }

  // ============================================================
  // DELETE LEAD
  // ============================================================

  async deleteLead(ownerKey: string, id: string) {
    return this.zohoCrmService.deletePipeline(ownerKey, id);
  }

  // ============================================================
  // MOVE STAGE (drag & drop)
  // ============================================================

  async moveStage(ownerKey: string, id: string, stage: string) {
    return this.zohoCrmService.updatePipeline(ownerKey, id, { Stage: stage });
  }

  // ============================================================
  // GENERAL UPDATE (card color, edit modal, quick menu actions)
  // ============================================================

  async updateLead(ownerKey: string, id: string, body: Record<string, any>) {
    const data: Record<string, any> = {};

    if (body.Stage) data.Stage = body.Stage;
    if ('Card_Color' in body) data.Card_Color = body.Card_Color;
    if (body.Tag) data.Tag = body.Tag;
    if (body.Deal_Name) data.Deal_Name = body.Deal_Name;
    if (body.Amount != null) data.Amount = body.Amount;

    return this.zohoCrmService.updatePipeline(ownerKey, id, data);
  }

  // ============================================================
  // ADD NOTE / REMARK
  //
  // Bigin actually stores notes as a related list on the record
  // (`POST /Pipelines/{id}/Notes`). This appends onto the Description
  // field instead so it works with the generic CRUD methods already
  // on ZohoCrmService — swap for a dedicated Notes call if you add
  // one to ZohoCrmService later.
  // ============================================================

  async addNote(ownerKey: string, id: string, text: string) {
    const record = await this.zohoCrmService.getRecord(
      ownerKey,
      'Pipelines',
      id,
      {
        fields: 'Description',
      },
    );

    const existing = record?.data?.[0]?.Description || '';
    const stamp = new Date().toISOString().slice(0, 10);
    const appended = existing
      ? `${existing}\n\n[${stamp}] ${text}`
      : `[${stamp}] ${text}`;

    return this.zohoCrmService.updatePipeline(ownerKey, id, {
      Description: appended,
    });
  }

  // ============================================================
  // SET PROPOSAL (quoted amount / timeline / remarks)
  // Moves the deal into "Proposal/Price Quote" to mirror what
  // happens when you quote a deal in Bigin itself.
  // ============================================================

  async setProposal(
    ownerKey: string,
    id: string,
    {
      amount,
      timeline,
      remarks,
    }: { amount: string; timeline: string; remarks?: string },
  ) {
    await this.zohoCrmService.updatePipeline(ownerKey, id, {
      Stage: 'Proposal/Price Quote',
      Quoted_Amount: amount,
      Quote_Timeline: timeline,
    });

    if (remarks) {
      await this.addNote(ownerKey, id, remarks);
    }

    return { ok: true };
  }

  // ============================================================
  // MAP A RAW BIGIN "Pipelines" RECORD -> LeadCard SHAPE
  // ============================================================

  private toLead(record: Record<string, any>) {
    const createdAt = record.Created_Time || null;

    const tag =
      typeof record.Tag === 'object'
        ? record.Tag?.name || null
        : record.Tag || null;

    return {
      id: record.id,
      name: record.Deal_Name,
      stage: record.Stage,

      company: record.Account_Name?.name || record.Account_Name || null,

      contact: record.Contact_Name?.name || record.Contact_Name || null,

      budgetValue: typeof record.Amount === 'number' ? record.Amount : null,

      budget: record.Amount != null ? `₹${record.Amount}` : null,

      owner: record.Owner?.name || null,

      phone: record.Phone || null,

      whatsapp: record.WhatsApp || record.Phone || null,

      color: record.Card_Color || null,

      tag,

      createdAt,

      stuck: this.isStuck(createdAt),

      proposal: record.Quoted_Amount
        ? {
            amount: record.Quoted_Amount,
            timeline: record.Quote_Timeline || null,
          }
        : null,
    };
  }

  private isStuck(createdAt: string | null) {
    if (!createdAt) return false;

    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return false;

    return (Date.now() - created) / 86400000 > STUCK_AFTER_DAYS;
  }

  // ============================================================
  // MAP A RAW BIGIN "Pipelines" RECORD -> ContactsView ROW SHAPE
  // ============================================================

  private toContactRow(record: Record<string, any>) {
    return {
      id: record.id,
      name: record.Deal_Name,
      stage: record.Stage,
      phone: record.Phone || null,
      whatsapp: record.WhatsApp || record.Phone || null,
      email: record.Email || null,
      location: record.Mailing_City || null,
      type: record.Lead_Source || null,
      owner: record.Owner?.name || null,
      createdAt: record.Created_Time || null,
    };
  }

  // ============================================================
  // SORT ORDER for the ContactsView "sort" dropdown
  // ============================================================

  private comparatorFor(sort?: string) {
    switch (sort) {
      case 'name-desc':
        return (a: any, b: any) => (b.name || '').localeCompare(a.name || '');

      case 'stage':
        return (a: any, b: any) =>
          STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage);

      case 'days':
        // Longest-in-pipeline first. We don't track a separate
        // "entered this stage" timestamp, so this approximates it
        // with Created_Time — swap in a real Stage-change field if
        // you start tracking one in Bigin.
        return (a: any, b: any) =>
          this.daysSince(b.createdAt) - this.daysSince(a.createdAt);

      case 'owner':
        return (a: any, b: any) => (a.owner || '').localeCompare(b.owner || '');

      case 'location':
        return (a: any, b: any) =>
          (a.location || '').localeCompare(b.location || '');

      case 'name-asc':
      default:
        return (a: any, b: any) => (a.name || '').localeCompare(b.name || '');
    }
  }

  private daysSince(createdAt: string | null) {
    if (!createdAt) return 0;

    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return 0;

    return (Date.now() - created) / 86400000;
  }
}
