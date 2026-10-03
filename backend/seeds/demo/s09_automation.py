"""09 Automation: rules (trigger/condition/action JSON), a short run history, open escalations, audit trail.
Runs reference real entities (overdue milestones, failed QC, stalled projects) and are dated a few days back,
so the engine's cooldown does not hide new matches when someone presses "Run now"."""
from lib import *


def rule(key, name, desc, phase, trigger, params, conditions, actions, status="ACTIVE", by="ajay", ago=20):
    return dict(id=U("arule:" + key), code=key, name=name, description=desc, phase=phase, trigger_type=trigger,
                trigger_json={"params": params}, conditions_json=conditions, actions_json=actions, project_types=[],
                status=status, created_by=UID[by], updated_by=UID[by], created_at=dt(-ago, 11), updated_at=dt(-ago + 2, 15),
                last_run_at=dt(-2, 9, 30) if status == "ACTIVE" else None)


RULES = [
    rule("PAYMENT_OVERDUE_ALERT", "Payment milestone overdue", "Tells accounts and the project manager the day a client milestone goes past due.",
         "Finance", "PAYMENT_MILESTONE_OVERDUE", {"graceDays": 0, "cooldownHours": 72}, [],
         [{"type": "NOTIFY", "recipient": "accounts", "title": "Payment overdue — {{projectName}}",
           "message": "{{title}}: {{outstanding}} outstanding, {{daysOverdue}} days past due."},
          {"type": "NOTIFY", "recipient": "project_manager", "title": "Payment overdue — {{projectName}}",
           "message": "{{title}} is {{daysOverdue}} days late ({{outstanding}})."}], by="sunita", ago=40),
    rule("PAYMENT_OVERDUE_15D_ESCALATE", "Payment overdue 15+ days", "Escalates to the founders and opens a follow-up task for accounts.",
         "Finance", "PAYMENT_MILESTONE_OVERDUE", {"graceDays": 0, "cooldownHours": 168},
         [{"field": "daysOverdue", "operator": "greater_than", "value": "15"}],
         [{"type": "ESCALATE", "recipient": "admins", "priority": "HIGH", "title": "{{projectName}}: {{title}} unpaid for {{daysOverdue}} days"},
          {"type": "TASK", "recipient": "accounts", "priority": "high", "dueInDays": 2,
           "title": "Call client about {{title}} ({{projectName}})", "message": "{{outstanding}} outstanding since {{dueDate}}."}],
         by="ajay", ago=35),
    rule("PHASE_STALLED_21D", "Project phase stalled 3 weeks", "Flags active projects that have not cleared a gate or moved phase in 21 days.",
         "Projects", "PHASE_STALLED", {"days": 21, "cooldownHours": 168}, [],
         [{"type": "NOTIFY", "recipient": "project_manager", "title": "{{projectName}} has not moved in {{daysInPhase}} days",
           "message": "Still in {{currentPhase}}. Check what is blocking the next gate."},
          {"type": "TASK", "recipient": "project_manager", "priority": "medium", "dueInDays": 3,
           "title": "Unblock {{projectName}} ({{currentPhase}})"}], by="anjali", ago=30),
    rule("PHASE_STALLED_CRITICAL", "Critical project stalled", "Escalates high-priority projects stuck for 30+ days.",
         "Projects", "PHASE_STALLED", {"days": 30, "cooldownHours": 336},
         [{"field": "priority", "operator": "in", "value": "HIGH,CRITICAL"}],
         [{"type": "ESCALATE", "recipient": "admins", "priority": "CRITICAL", "title": "{{projectName}} stuck in {{currentPhase}} for {{daysInPhase}} days"}],
         by="ajay", ago=28),
    rule("QC_FAILED_CORRECTIVE", "QC failed — corrective task", "Creates a corrective task for site and alerts the PM when an inspection fails.",
         "Site operations", "QC_FAILED", {"lookbackDays": 30, "cooldownHours": 720}, [],
         [{"type": "TASK", "recipient": "site_engineer", "priority": "high", "dueInDays": 3,
           "title": "Corrective work: {{stepName}} at {{projectName}}", "message": "QC {{result}} on attempt {{attemptNumber}} (checked by {{checkedBy}})."},
          {"type": "NOTIFY", "recipient": "project_manager", "title": "QC {{result}}: {{stepName}}", "message": "{{projectName}} — corrective task raised for site."}],
         by="anjali", ago=25),
    rule("RFI_OVERDUE_24H", "RFI unanswered 24 hours", "Escalates site RFIs with no response after 24 hours.",
         "Site operations", "RFI_OVERDUE", {"hours": 24, "cooldownHours": 24}, [],
         [{"type": "NOTIFY", "recipient": "designer", "title": "RFI waiting {{ageHours}} h — {{projectName}}", "message": "{{entity_label}}"},
          {"type": "ESCALATE", "recipient": "project_manager", "priority": "HIGH", "title": "{{entity_label}} unanswered ({{projectName}})"}],
         by="anjali", ago=22),
    rule("TASK_OVERDUE_NUDGE", "Task overdue nudge", "Reminds the assignee one day after a task's due date.",
         "Execution", "TASK_OVERDUE", {"graceDays": 1, "cooldownHours": 72},
         [{"field": "priority", "operator": "in", "value": "high,critical"}],
         [{"type": "NOTIFY", "recipient": "assignee", "title": "Overdue: {{title}}", "message": "{{projectName}} — {{daysOverdue}} days past due."}],
         status="DRAFT", by="anjali", ago=6),
]


def build(o: Out):
    o.ins("automation_rules", RULES)
    rid = {r["code"]: r["id"] for r in RULES}
    name = {r["code"]: r["name"] for r in RULES}

    runs, escs = [], []

    def run(i, code, trig, etype, row, conds, actions, ago, hour, status="SUCCESS", err=None, source="schedule"):
        started = dt(-ago, hour, (i * 11) % 60)
        runs.append(dict(id=U(f"arun:{i}"), seq=i + 1, rule_id=rid[code], rule_name=name[code], trigger_type=trig, source=source,
                         project_id=row.get("project_id"), entity_type=etype, entity_id=str(row["entity_id"]), entity_label=row["entity_label"],
                         status=status, duration_ms=60 + (i * 37) % 300, payload_json=row, conditions_json=conds, actions_json=actions,
                         error=err, started_at=started, completed_at=started))
        return U(f"arun:{i}")

    pays = q("""SELECT m.id, s.project_id, m.title, p.name, m.amount - COALESCE(m.paid_amount,0), DATEDIFF(CURDATE(), m.due_date)
                  FROM payment_schedule_milestones m JOIN payment_schedules s ON s.id = m.payment_schedule_id
                  JOIN projects p ON p.id = s.project_id
                 WHERE m.status IN ('DUE','OVERDUE','PARTIALLY_PAID') AND m.due_date < CURDATE() ORDER BY m.due_date LIMIT 3""")
    qcs = q("""SELECT q.id, q.project_id, COALESCE(st.name,'QC'), p.name, q.result, q.attempt_number, q.checked_by
                 FROM qc_sign_offs q JOIN projects p ON p.id = q.project_id LEFT JOIN steps st ON st.id = q.step_id
                WHERE q.result IN ('FAIL','REWORK') ORDER BY q.checked_at DESC LIMIT 4""")
    projs = q("""SELECT p.id, p.name, CONCAT(UPPER(LEFT(REPLACE(SUBSTRING(p.current_phase, 4), '_', ' '),1)), LOWER(SUBSTRING(REPLACE(SUBSTRING(p.current_phase, 4), '_', ' '),2))), p.priority FROM projects p
                  WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.current_phase IS NOT NULL ORDER BY p.updated_at LIMIT 2""")

    i = 0
    for k, (mid, pid, title, pname, out, late) in enumerate(pays):
        row = dict(entity_id=mid, project_id=pid, entity_label=title, title=title, projectName=pname,
                   outstanding=float(out), daysOverdue=max(int(late) - 3, 1), status="DUE")
        run(i, "PAYMENT_OVERDUE_ALERT", "PAYMENT_MILESTONE_OVERDUE", "PAYMENT", row, [],
            [{"label": "Notified Accounts", "status": "SUCCESS", "detail": "Sunita Jain"},
             {"label": "Notified Project manager", "status": "SUCCESS", "detail": "Anjali Verma"}], 6 - k, 9)
        i += 1
        if int(late) > 18:
            r_id = run(i, "PAYMENT_OVERDUE_15D_ESCALATE", "PAYMENT_MILESTONE_OVERDUE", "PAYMENT", row,
                       [{"label": "Days overdue > 15", "passed": True}],
                       [{"label": "Escalation opened for Admins", "status": "SUCCESS"},
                        {"label": "Task created for Sunita Jain", "status": "SUCCESS"}], 4 - k, 9)
            escs.append(dict(id=U(f"aesc:pay:{mid}"), rule_id=rid["PAYMENT_OVERDUE_15D_ESCALATE"], run_id=r_id, project_id=pid,
                             entity_type="PAYMENT", entity_id=mid, title=f"{pname}: {title} unpaid for {int(late)} days",
                             details=f"Rs {float(out):,.0f} outstanding", priority="HIGH", level=1, assigned_to=UID["ajay"],
                             assigned_role="Admins", status="OPEN", opened_at=dt(-4 + k, 9, 5)))
            i += 1

    for k, (qid, pid, step, pname, res, att, by) in enumerate(qcs):
        row = dict(entity_id=int(qid), project_id=pid, entity_label=f"{step} — {res}", stepName=step, projectName=pname,
                   result=res, attemptNumber=int(att), checkedBy=by)
        failed = k == 3
        run(i, "QC_FAILED_CORRECTIVE", "QC_FAILED", "QC", row, [],
            [{"label": "Task created for Sandeep Yadav", "status": "SUCCESS"},
             {"label": "Notified Project manager", "status": "FAILED" if failed else "SUCCESS",
              "detail": "Notification service timed out" if failed else "Anjali Verma"}],
            8 - k, 17, status="FAILED" if failed else "SUCCESS", err="Notification service timed out" if failed else None,
            source="event")
        i += 1

    for k, (pid, pname, phase, prio) in enumerate(projs):
        row = dict(entity_id=pid, project_id=pid, entity_label=pname, projectName=pname, currentPhase=phase, priority=prio,
                   daysInPhase=26 + 9 * k)
        r_id = run(i, "PHASE_STALLED_21D", "PHASE_STALLED", "PROJECT", row, [],
                   [{"label": "Notified Project manager", "status": "SUCCESS"},
                    {"label": "Task created for Anjali Verma", "status": "SUCCESS"}], 9 - k, 8)
        i += 1
        if k == 0:
            escs.append(dict(id=U(f"aesc:stall:{pid}"), rule_id=rid["PHASE_STALLED_21D"], run_id=r_id, project_id=pid,
                             entity_type="PROJECT", entity_id=pid, title=f"{pname} stuck in {phase} for {26 + 9 * k} days",
                             priority="MEDIUM", level=1, assigned_to=UID["anjali"], assigned_role="Project manager",
                             status="ACKNOWLEDGED", opened_at=dt(-9, 8, 2), acknowledged_at=dt(-8, 10)))

    o.ins("automation_runs", runs)
    o.ins("automation_escalations", escs)

    audit = [
        (40, "sunita", "CREATED_RULE", "PAYMENT_OVERDUE_ALERT", "Created rule “Payment milestone overdue” (ACTIVE)."),
        (35, "ajay", "CREATED_RULE", "PAYMENT_OVERDUE_15D_ESCALATE", "Created rule “Payment overdue 15+ days” (ACTIVE)."),
        (30, "anjali", "CREATED_RULE", "PHASE_STALLED_21D", "Created rule “Project phase stalled 3 weeks” (ACTIVE)."),
        (25, "anjali", "CREATED_RULE", "QC_FAILED_CORRECTIVE", "Created rule “QC failed — corrective task” (ACTIVE)."),
        (22, "anjali", "UPDATED_RULE", "RFI_OVERDUE_24H", "Changed params (response SLA 48 h → 24 h)."),
        (12, "ajay", "ENABLED_RULE", "PHASE_STALLED_CRITICAL", "Enabled rule."),
        (6, "anjali", "CREATED_RULE", "TASK_OVERDUE_NUDGE", "Created rule “Task overdue nudge” (DRAFT)."),
    ]
    full = {k: n for k, n, *_ in USERS}
    o.ins("automation_audit_logs", [
        dict(id=U(f"aaudit:{i}"), user_id=UID[who], user_name=full.get(who, "Ajay Chhabra") if who != "ajay" else "Ajay Chhabra",
             action=act, rule_id=rid.get(code), target=code, description=desc, created_at=dt(-ago, 11, i * 5))
        for i, (ago, who, act, code, desc) in enumerate(audit)])
