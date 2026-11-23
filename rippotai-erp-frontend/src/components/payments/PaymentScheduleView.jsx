import { forwardRef, useMemo } from 'react';
import {
  PrintDocument,
  Stats,
  Totals,
  HtmlTerms,
  htmlToTerms,
  SignOff,
  Note,
  Pill,
  has,
  fmtDate,
  inr,
  money,
  titleCase,
  WSign,
  coverRows,
  projectPeople,
} from '@/components/print-document';
import './payment-schedule-document.css';

const shareAmount = (m, contract) =>
  Number(m.amount) || (contract ? (contract * (Number(m.percentage) || 0)) / 100 : 0);

const pct = (v) => `${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;

export function buildScheduleSections(schedule) {
  const project = schedule.project || {};
  const client = project.client || {};
  const milestones = [...(schedule.milestones || [])].sort(
    (a, b) =>
      Number(a.sortOrder ?? a.milestoneNumber ?? 0) - Number(b.sortOrder ?? b.milestoneNumber ?? 0),
  );
  const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const contract = Number(schedule.totalContractValue) || 0;
  const gst =
    Number(schedule.gstAmount) ||
    (schedule.gstRate != null ? (contract * Number(schedule.gstRate)) / 100 : 0);
  const payable = Number(schedule.totalPayable) || contract + gst;
  const sections = [];

  const stats = [
    { value: inr(contract)?.short, label: 'Contract value (before GST)' },
    {
      value: gst > 0 ? inr(gst)?.short : '',
      label: `GST${has(schedule.gstRate) ? ` @ ${pct(schedule.gstRate)}` : ''}`,
    },
    { value: inr(payable)?.short, label: 'Total payable' },
  ];
  const overview = [];
  if (stats.some((s) => has(s.value))) overview.push(<Stats key="s" items={stats} />);
  if (milestones.length > 1)
    overview.push(
      <div key="split">
        <span className="pd-label">How the payments are spread</span>
        <div className="pd-split">
          {milestones.map((m, i) => (
            <span key={m.id || i} style={{ flex: `${Number(m.percentage) || 0.5} 1 0` }}>
              {Number(m.percentage) >= 9
                ? `M${m.milestoneNumber || i + 1} · ${pct(m.percentage)}`
                : ''}
            </span>
          ))}
        </div>
      </div>,
    );
  if (overview.length) sections.push({ title: 'Summary', blocks: overview });

  if (milestones.length) {
    const blocks = [];
    if (Math.round(totalPct) !== 100)
      blocks.push(<Note key="chk">Milestone shares add up to {pct(totalPct)}, not 100%.</Note>);
    blocks.push({
      keep: (
        <Totals
          key="tot"
          lines={[
            {
              label: `Total of milestones (${pct(totalPct)})`,
              value: milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0) || contract,
            },
            gst > 0 && {
              label: `GST${has(schedule.gstRate) ? ` @ ${pct(schedule.gstRate)}` : ''}`,
              value: gst,
            },
            { label: 'Total payable', value: payable, grand: true },
          ].filter(Boolean)}
        />
      ),
    });
    sections.push({
      title: 'Milestones',
      intro: 'Amounts are before GST.',
      rows: {
        cols: ['No.', 'Milestone', 'Due', '#Share', '#Amount'],
        template: '11mm 1fr 38mm 15mm 30mm',
        items: milestones.map((m, i) => {
          const status = String(m.status || '').toUpperCase();
          return {
            key: m.id || i,
            cells: [
              { text: String(m.milestoneNumber || i + 1).padStart(2, '0'), strong: false },
              {
                text: (
                  <>
                    {m.title || 'Milestone'}
                    {status && status !== 'PENDING' && <Pill>{titleCase(status)}</Pill>}
                  </>
                ),
                sub: [
                  m.description,
                  status === 'PAID' && m.paidAt ? `Paid on ${fmtDate(m.paidAt)}` : '',
                ]
                  .filter(has)
                  .join('\n'),
                strong: true,
              },
              {
                text: [m.releaseTrigger, m.dueDate && `By ${fmtDate(m.dueDate, { short: true })}`]
                  .filter(has)
                  .join('\n'),
                strong: false,
              },
              pct(m.percentage),
              money(m.amount),
            ],
          };
        }),
      },
      blocks,
    });
  }

  const termsHtml = schedule.terms_content_snapshot ?? schedule.termsTemplate?.content_html;
  if (htmlToTerms(termsHtml).length)
    sections.push({
      title: 'Terms',
      newPage: true,
      blocks: [<HtmlTerms key="t" html={termsHtml} />],
    });

  const architect =
    project.team_members?.find((m) => m.role_label === 'Principal Architect')?.user?.name ||
    project.team_members?.find((m) => m.is_primary)?.user?.name;
  sections.push({
    title: 'Acceptance',
    blocks: [
      <SignOff
        key="sign"
        note="The client confirms having read and accepted the milestones, shares and terms in this schedule, which forms part of the signed agreement for this project."
        left={{
          name: architect || 'Rippotai Architecture',
          role: 'For Rippotai Architecture · Authorised signatory',
        }}
        right={{
          name: client.name || 'Client',
          role: `Client · ${schedule.acceptedAt ? fmtDate(schedule.acceptedAt) : 'Date'}`,
        }}
      />,
    ],
  });
  return sections;
}

/* =====================================================================
   PAYMENT SCHEDULE TEMPLATE (.docx) — Word family of the print kit
   ===================================================================== */

const DONUT = [
  '#0D3D2F',
  '#14503D',
  '#1B634B',
  '#247659',
  '#3C8A70',
  '#6FA593',
  '#8DB8A9',
  '#A9C9BE',
];

function sortMilestones(schedule) {
  return [...(schedule.milestones || [])].sort(
    (a, b) =>
      Number(a.sortOrder ?? a.milestoneNumber ?? 0) - Number(b.sortOrder ?? b.milestoneNumber ?? 0),
  );
}

const isHandover = (m) => /snag|handover|retention/i.test(`${m.title} ${m.milestoneCode || ''}`);

/** Donut of milestone shares with M1…Mn labels and "100% CONTRACT VALUE" in the middle. */
function Donut({ milestones }) {
  const total = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0) || 1;
  const R = 50;
  const r = 32;
  const cx = 70;
  const cy = 70;
  const pt = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
  const starts = milestones.map(
    (_, i) =>
      -Math.PI / 2 +
      (milestones.slice(0, i).reduce((s, x) => s + (Number(x.percentage) || 0), 0) / total) *
        Math.PI *
        2,
  );
  const segs = milestones.map((m, i) => {
    const a0 = starts[i];
    const a1 = a0 + ((Number(m.percentage) || 0) / total) * Math.PI * 2;
    const [x0, y0] = pt(R, a0);
    const [x1, y1] = pt(R, a1);
    const [x2, y2] = pt(r, a1);
    const [x3, y3] = pt(r, a0);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    const mid = (a0 + a1) / 2;
    const seg = {
      d: `M${x0} ${y0} A${R} ${R} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${big} 0 ${x3} ${y3} Z`,
      fill: i === milestones.length - 1 && isHandover(m) ? '#D9B061' : DONUT[i % DONUT.length],
      label: pt((R + r) / 2, mid),
      tag: pt(R + 9, mid),
      pct: Number(m.percentage) || 0,
      n: m.milestoneNumber || i + 1,
    };
    return seg;
  });
  return (
    <svg className="wd-ps-donut" viewBox="0 0 140 140" aria-hidden="true">
      {segs.map((s, i) => (
        <path key={i} d={s.d} fill={s.fill} stroke="#fff" strokeWidth="1.2" />
      ))}
      {segs.map((s, i) => (
        <g key={`t${i}`}>
          {s.pct >= 4 && (
            <text
              x={s.label[0]}
              y={s.label[1] + 1.8}
              textAnchor="middle"
              fontSize="5.4"
              fill="#fff"
              fontFamily="Lato"
            >
              {`${s.pct.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`}
            </text>
          )}
          <text
            x={s.tag[0]}
            y={s.tag[1] + 1.6}
            textAnchor="middle"
            fontSize="4.6"
            fill="#0D3D2F"
            fontFamily="Lato"
          >
            M{s.n}
          </text>
        </g>
      ))}
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fontSize="14"
        fill="#101010"
        fontFamily="Lato"
        fontWeight="300"
      >
        100%
      </text>
      <text
        x={cx}
        y={cy + 10.5}
        textAnchor="middle"
        fontSize="3.4"
        letterSpacing="0.9"
        fill="#7E9A92"
        fontFamily="Lato"
      >
        CONTRACT VALUE
      </text>
    </svg>
  );
}

const monthsBetween = (a, b) => {
  if (!a || !b) return null;
  const d = (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24 * 30.44);
  return Number.isFinite(d) && d > 0 ? Math.max(1, Math.round(d)) : null;
};

export function buildScheduleWordSections(schedule) {
  const milestones = sortMilestones(schedule);
  const totalPct = milestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  const maxPct = Math.max(...milestones.map((m) => Number(m.percentage) || 0), 1);
  const contract = Number(schedule.totalContractValue) || 0;
  const gst =
    Number(schedule.gstAmount) ||
    (schedule.gstRate != null ? (contract * Number(schedule.gstRate)) / 100 : 0);
  const payable = Number(schedule.totalPayable) || contract + gst;
  const dues = milestones
    .map((m) => m.dueDate)
    .filter(Boolean)
    .sort();
  const months = monthsBetween(dues[0], dues[dues.length - 1]);
  const last = milestones[milestones.length - 1];
  const sections = [];

  /* PAYMENT PLAN */
  sections.push({
    title: 'PAYMENT PLAN',
    unnumbered: true,
    headClass: 'wd-ps-head',
    blocks: [
      <div key="panel" className="wd-ps-panel">
        {milestones.length > 0 && <Donut milestones={milestones} />}
        <div className="wd-ps-stats">
          {[
            [
              String(milestones.length).padStart(2, '0'),
              'Payment milestones from booking to handover',
            ],
            [months ? String(months) : '', 'Months from the first to the last milestone due date'],
            [last ? pct(last.percentage) : '', last ? last.releaseTrigger || last.title : ''],
          ].map(([v, l], i) => (
            <div key={i} className="wd-ps-stat">
              <span className="wd-ps-stat__v">{v}</span>
              <span className="wd-ps-stat__l">{l}</span>
            </div>
          ))}
        </div>
      </div>,
      milestones.length > 0 && (
        <div key="rel" className="wd-ps-release">
          <div className="wd-ps-label">PAYMENT RELEASE — AGAINST PHASES</div>
          {milestones.map((m, i) => {
            const w = ((Number(m.percentage) || 0) / maxPct) * 100;
            const gold = i === milestones.length - 1 && isHandover(m);
            const inside = w >= 32;
            return (
              <div key={m.id || i} className="wd-ps-release__row">
                <span className="wd-ps-release__dot" />
                <span className="wd-ps-release__m">M{m.milestoneNumber || i + 1}</span>
                <div className="wd-ps-release__track">
                  <div
                    className={`wd-ps-release__bar ${gold ? 'is-gold' : ''}`}
                    style={{ width: `${w}%` }}
                  >
                    {inside && <span>{String(m.title || '').toUpperCase()}</span>}
                  </div>
                  {!inside && (
                    <span className="wd-ps-release__out">
                      {String(m.title || '').toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="wd-ps-release__pct">
                  {pct(m.percentage)}
                  {shareAmount(m, contract) > 0 && (
                    <b className="wd-ps-amt">{money(shareAmount(m, contract))}</b>
                  )}
                </span>
              </div>
            );
          })}
          <div className="wd-ps-axis">
            <span>ON SIGNING</span>
            <span>ON HANDOVER</span>
          </div>
        </div>
      ),
    ].filter(Boolean),
  });

  /* Milestone detail */
  if (milestones.length)
    sections.push({
      title: 'Milestone detail',
      unnumbered: true,
      headClass: 'wd-ps-head',
      blocks: [
        {
          table: {
            skin: 'word',
            className: 'wd-table--open wd-ps-t',
            allowSplit: true,
            cols: ['', 'Milestone', 'Coverage & release trigger', 'Share'],
            template: '10.5mm 33.5mm 1fr 30mm',
            items: [
              ...milestones.map((m, i) => {
                const status = String(m.status || '').toUpperCase();
                const facts = [
                  m.dueDate && `Due ${fmtDate(m.dueDate, { short: true })}`,
                  status && status !== 'PENDING' && titleCase(status),
                  status === 'PAID' && m.paidAt && `Paid on ${fmtDate(m.paidAt, { short: true })}`,
                ].filter(Boolean);
                return {
                  key: m.id || i,
                  cells: [
                    {
                      text: String(m.milestoneNumber || i + 1).padStart(2, '0'),
                      className: 'wd-ps-t__no',
                    },
                    { text: m.title || 'Milestone', className: 'wd-ps-t__title' },
                    {
                      text: (
                        <>
                          {has(m.description) && (
                            <span className="wd-ps-t__desc">{m.description}</span>
                          )}
                          {has(m.releaseTrigger) && (
                            <span className="wd-ps-t__trig">{m.releaseTrigger}</span>
                          )}
                          {facts.length > 0 && (
                            <span className="wd-ps-t__facts">{facts.join(' · ')}</span>
                          )}
                        </>
                      ),
                    },
                    {
                      text: (
                        <>
                          <span className="wd-ps-pct">{pct(m.percentage)}</span>
                          {shareAmount(m, contract) > 0 && (
                            <b className="wd-ps-amt">{money(shareAmount(m, contract))}</b>
                          )}
                        </>
                      ),
                      className: 'wd-ps-t__share',
                    },
                  ],
                };
              }),
              {
                key: 'total',
                cells: [
                  '',
                  { text: 'TOTAL CONTRACT VALUE', className: 'wd-ps-t__total' },
                  '',
                  {
                    text: (
                      <>
                        <span className="wd-ps-pct">{pct(totalPct)}</span>
                        {contract > 0 && <b className="wd-ps-amt">{money(contract)}</b>}
                      </>
                    ),
                    className: 'wd-ps-t__share wd-ps-t__share--total',
                  },
                ],
              },
            ],
          },
        },
        {
          keep: (
            <div key="sum" className="wd-ps-sum">
              <div>
                <span>CONTRACT VALUE</span>
                <b>{money(contract) || '—'}</b>
              </div>
              <div>
                <span>GST @{has(schedule.gstRate) ? pct(schedule.gstRate) : '—'}</span>
                <b>{gst > 0 ? money(gst) : 'EXTRA AS APPLICABLE'}</b>
              </div>
              <div>
                <span>TOTAL PAYABLE</span>
                <b>{money(payable) || '—'}</b>
              </div>
            </div>
          ),
        },
      ],
    });

  /* Terms & Conditions + acceptance */
  const terms = htmlToTerms(
    schedule.terms_content_snapshot ?? schedule.termsTemplate?.content_html,
  );
  const architect =
    schedule.project?.team_members?.find((m) => /principal/i.test(m.role_label || ''))?.user
      ?.name || schedule.project?.team_members?.find((m) => m.is_primary)?.user?.name;
  sections.push({
    title: 'Terms & Conditions',
    unnumbered: true,
    headClass: 'wd-ps-head',
    blocks: [
      ...terms.map((t, i) => (
        <div key={i} className={`wd-ps-term ${i % 2 ? 'is-alt' : ''}`}>
          <span className="wd-ps-term__n">{String(i + 1).padStart(2, '0')}</span>
          <div>
            {t.title && <div className="wd-ps-term__t">{t.title}</div>}
            {t.body && <div className="wd-ps-term__b">{t.body}</div>}
          </div>
        </div>
      )),
      <div key="acc" className="wd-ps-acc">
        <p>
          The Client confirms having read and accepted the milestones, percentages and terms set out
          in this schedule, which forms an integral part of the Plan of Action and the signed
          Agreement for this project.
        </p>
      </div>,
      <div key="sign" className="wd-ps-sign">
        <WSign
          label="For Rippotai"
          lines={[
            'Authorised Signatory',
            { label: 'Name ·', value: architect },
            { label: 'Date ·', value: '' },
          ]}
        />
        <WSign
          label="Accepted by the client"
          lines={[
            'Client Signature',
            {
              label: 'Name ·',
              value: schedule.acceptedByClient ? schedule.project?.client?.name : '',
            },
            { label: 'Date ·', value: schedule.acceptedAt ? fmtDate(schedule.acceptedAt) : '' },
          ]}
        />
      </div>,
    ],
  });
  return sections;
}

const PaymentScheduleView = forwardRef(function PaymentScheduleView({ schedule }, ref) {
  const sections = useMemo(() => buildScheduleWordSections(schedule), [schedule]);
  const project = schedule.project || {};
  const client = project.client || {};
  return (
    <PrintDocument
      ref={ref}
      variant="word"
      className="wd-ps"
      docType="Payment Schedule"
      footerLabel="PAYMENT SCHEDULE"
      numbered={false}
      bodyHeight={248}
      title={project.name || 'Project'}
      wordCover={{
        title: 'PAYMENT SCHEDULE',
        className: 'wd-ps-cover',
        logoWidth: 66,
        logoTop: 52,
        footerLabel: '',
        rowsTop: 236,
        rows: coverRows({
          project: project.name,
          address: project.site_location,
          client: client.name,
          ...projectPeople(project.team_members),
        }),
      }}
      sections={sections}
    />
  );
});

export default PaymentScheduleView;
