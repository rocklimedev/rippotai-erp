# Client Brief Automation Strategy Ref: https://www.sarvam.ai/

## 1. Objective

The goal is to automate the Client Brief process so the team does **not have to manually fill the Client Brief form** after every client meeting.

The current Client Brief is a structured document covering:

1. Client & Contact
2. Site & Property Details
3. Scope of Work
4. Space Requirements
5. Design Direction & Preferences
6. Budget
7. Timeline
8. Approvals, Constraints & Site Risks
9. Users & Lifestyle
10. Sign-off

The Master Brain defines the Client Brief as the origin point of the project, from which downstream work traces back.

Therefore, the automation strategy should treat the Client Brief as a **generated project record**, not primarily as a data-entry form.

---

## 2. Core Principle

> **Do not automate filling the Client Brief. Automate the capture of information so the Client Brief is automatically produced from the Master Brain.**

The team's normal offline client meeting should remain unchanged.

The architect/interior designer should conduct the meeting naturally instead of trying to complete a form while talking to the client.

---

## 3. Proposed Workflow

```text
OFFLINE CLIENT MEETING
        |
        v
Record Meeting Audio
        |
        v
Transcription
        |
        v
Upload Recording / Transcript to RIPPOTAI
        |
        v
AI Extraction
        |
        v
Master Brain
        |
        +----------------------+
        |                      |
        v                      v
Captured Information     Missing / Uncertain /
                         Conflicting Information
        |                      |
        +----------+-----------+
                   |
                   v
             Human Review
                   |
                   v
             Confirmed Data
                   |
                   v
          Client Brief Generated
                   |
                   v
        Downstream Automation
```

---

## 4. Meeting Capture

### 4.1 Offline meeting remains the primary input

The team already conducts client meetings offline. The process should not be redesigned around a form.

The meeting should simply be recorded using an appropriate transcription/recording tool.

Possible input formats:

- Audio recording
- Generated transcript
- Meeting notes
- Later, potentially video/transcript where available

### 4.2 RIPPOTAI should accept

- `.mp3`
- `.wav`
- `.m4a`
- Text transcript
- Other supported transcript formats

The user should be able to select:

**Project → Upload Meeting → Process Meeting**

---

## 5. Transcription Layer

The transcription layer has one responsibility:

> **Convert the offline conversation into reliable text.**

It should not be responsible for building the Client Brief.

The architecture should separate:

```text
Audio
  |
  v
Transcription Service
  |
  v
Raw Transcript
```

The raw transcript should be retained as a source record.

This allows the extracted information to be traced back to what was actually said in the meeting.

---

## 6. AI Extraction Layer

The next layer converts the transcript into structured project information.

```text
Raw Transcript
      |
      v
AI Extraction Engine
      |
      v
Structured Project Data
```

The AI should extract information relevant to the Client Brief, including:

### Client & Contact

- Client name
- Contact person
- Mobile
- Email
- Relationship to client
- Referred by / source
- Date of brief

### Project

- Project name
- Project type

### Site & Property

- Site address
- Property type
- Site area
- Facing / orientation
- Parking
- Ownership status
- Number of floors
- Lift availability
- Site type
- Site condition
- Available drawings/documents

### Scope

- Type of work
- Services required
- Material procurement requirements
- Areas included
- Areas excluded
- Work already completed by others

### Space Requirements

- Spaces required
- Space-specific requirements
- Must-have requirements
- User-specific requirements

### Design Direction

- Style direction
- Vastu requirements
- Colours to avoid
- Preferred colours
- Materials liked
- Materials disliked
- Must-have elements
- Maintenance appetite
- References shared

### Budget

- Initial budget
- GST inclusion/exclusion
- Funding stage
- Budget flexibility

### Timeline

- Desired start date
- Fixed/preferred date
- Site handover date
- Target completion
- Reason for deadline
- Phasing requirement
- Phase dates

### Risks & Constraints

- Society/RWA timings
- NOC/security deposit
- Structural-change restrictions
- Material movement restrictions
- Neighbour sensitivities
- Power/water availability
- Access
- Storage
- Debris disposal
- Other agencies working on site

### Users & Lifestyle

- User names/relations
- Specific requirements
- Household notes

### Sign-off

- Open points
- Brief taken by
- Confirmation status
- Client confirmation

---

## 7. Do Not Treat AI Output as Automatically Confirmed

AI extraction should not directly become unquestioned project truth.

Every extracted value should ideally have:

```text
value
source
confidence
status
extracted_at
confirmed_by
confirmed_at
```

Example:

```json
{
  "budget": {
    "value": 4500000,
    "currency": "INR",
    "source": "client_meeting_2026_08_27",
    "confidence": 0.94,
    "status": "NEEDS_CONFIRMATION"
  }
}
```

Recommended statuses:

- `EXTRACTED`
- `NEEDS_CONFIRMATION`
- `CONFIRMED`
- `VERIFIED`
- `CONFLICT`
- `REJECTED`

---

## 8. Master Brain as the Source of Truth

The transcript should **not** directly generate a static Client Brief PDF.

Instead:

```text
Meeting
  |
  v
Transcript
  |
  v
AI Extraction
  |
  v
MASTER BRAIN
  |
  +--> Client Brief
  +--> Scope of Work
  +--> Site Brief
  +--> Plan of Action
  +--> Project Timeline
  +--> Other downstream records
```

This avoids duplicate data entry.

If information changes later, the Master Brain is updated and downstream documents can reflect the change according to the project's rules.

---

## 9. Client Brief as a Generated Document

The Client Brief should become an output of the system.

```text
Master Brain
      |
      v
Client Brief Generator
      |
      +--> Web View
      +--> PDF
      +--> Printable Version
```

The existing Client Brief format can remain as the final presentation/document format.

The major change is that the team does not manually enter the information into it.

---

## 10. Missing Information Engine

After extraction, RIPPOTAI should identify what is missing.

Example:

```text
CLIENT BRIEF READINESS

92% Ready

Client Details       ✓
Project Type         ✓
Site Details         ✓
Scope                ✓
Space Requirements   ✓
Design Direction     ✓
Budget               ✓
Timeline             ⚠
Risks                ⚠
Users                ✓

3 items require confirmation.
```

The system should ask only for missing or uncertain information.

It should not force the user to revisit the entire Client Brief.

---

## 11. Conflict Detection

The system should detect contradictions between information sources.

Example:

```text
CLIENT BRIEF CONFLICT

Client meeting:
4 bedrooms required

Existing drawing:
3 bedrooms

Status:
CONFLICT

Action:
Confirm with Architect
```

Potential sources of conflict:

- Client meeting
- Previous project information
- Uploaded drawings
- Site recce
- Existing project data
- Later client instructions

The system should preserve the source of each conflicting value.

---

## 12. Human Review

The architect should become a **reviewer/approver**, not a data-entry operator.

Example UI:

```text
AI CAPTURED

Design Direction
Contemporary + Warm

Source:
Client meeting

Confidence:
High

[ Confirm ] [ Edit ]
```

Another example:

```text
MISSING

Target completion date

[ Add Answer ]
```

Another:

```text
CONFLICT

Client requested 4 bedrooms.
Existing drawing shows 3.

[ Resolve Conflict ]
```

The goal is:

```text
SYSTEM:
Capture -> Extract -> Organize -> Detect

HUMAN:
Review -> Correct -> Confirm
```

---

## 13. Adaptive Questioning

When information is missing, the system should ask only relevant questions.

Example:

If the transcript already establishes:

> The client is renovating an existing 3BHK and retaining the kitchen.

The system should not ask generic questions already answered.

Instead, it could ask:

> Since the existing kitchen is being retained, would you like any cosmetic changes to it?

This keeps the follow-up process short.

---

## 14. Document Intelligence

The Client Brief includes a section for documents available with the client.

Instead of manually ticking document checkboxes, users should be able to upload documents.

Example:

```text
Uploaded Files

Floor_Plan.pdf
Structural_Drawing.pdf
Society_NOC.pdf
```

The system can identify:

```text
Architectural Drawing       FOUND
Structural Drawing         FOUND
Society NOC                 FOUND
MEP Layout                  NOT FOUND
Completion Certificate     NOT FOUND
```

The detected documents should become part of the project's document records.

---

## 15. Reference Intelligence

Client design references can be uploaded with the meeting record.

The system can use them as supporting evidence for the design-direction section.

Potential output:

```text
DESIGN DIRECTION

Primary:
Contemporary

Secondary:
Warm / Minimal

Observed Preferences:
- Natural materials
- Warm palette
- Clean lines
- Storage-focused design

Hard No:
Marble
```

The architect should confirm the interpretation before it becomes confirmed project data.

---

## 16. Space Requirement Extraction

The existing Client Brief specifically asks for space requirements in the client's own words.

This is well suited to transcript extraction.

Example meeting statement:

> "My parents should have a room on the ground floor, the kids need study areas, and we want a large kitchen with lots of storage."

Possible structured extraction:

```text
Parents Bedroom
- Ground floor
- Accessibility priority

Children's Bedrooms
- Study area required

Kitchen
- Large kitchen
- High storage requirement
```

The original transcript remains the source.

---

## 17. Scope Automation

Once the Client Brief is sufficiently confirmed:

```text
Confirmed Client Brief
        |
        v
Scope Extraction / Generation
        |
        v
Initial Scope of Work
        |
        v
Architect Review
        |
        v
Approved Scope
```

This follows the Master Brain's process where the Client Brief is the origin point and the Scope of Work is a downstream project document.

The team should not have to re-enter scope information into another form.

---

## 18. Site Recce Integration

The Client Brief should not be considered permanently complete after the meeting.

The Master Brain should allow later information to enrich it.

```text
Client Meeting
      |
      v
Initial Client Brief
      |
      v
Site Recce
      |
      v
Actual Site Conditions
      |
      v
Compare
      |
      +--> Confirmed
      +--> New Information
      +--> Conflict
      +--> Scope Change
```

The Master Brain process identifies the joint site visit, site analysis, detailed site brief and escalation of the Scope of Work into Scope of Approval after actual site conditions are known.

---

## 19. Downstream Automation

Once the Client Brief is confirmed, it should trigger downstream processes.

### Brief Ready

Possible actions:

```text
Generate Scope of Work
Create project readiness check
Notify responsible Architect
Create required document checklist
Open Pre-Design workflow
```

### Site Recce Complete

Possible actions:

```text
Generate Site Brief
Compare against Client Brief
Detect conflicts
Update scope
Create approval requirements
```

### Concept 02 Finalised

Possible actions:

```text
Open Material Requirements
Notify Procurement
Start material sourcing workflow
```

### Tender Drawings Finalised

Possible actions:

```text
Open Vendor Pricing
Enable quotation workflow
Prepare BOQ readiness
Notify Admin / Accounts
```

These should eventually be handled through the broader RIPPOTAI automation engine.

---

## 20. Event-Driven Architecture

The automation should be event driven.

Example:

```text
EVENT:
Meeting transcript uploaded

ACTIONS:
1. Transcribe if necessary
2. Extract information
3. Update Master Brain
4. Recalculate readiness
5. Detect conflicts
6. Create review items
```

Another:

```text
EVENT:
Client Brief confirmed

ACTIONS:
1. Generate Scope of Work
2. Create readiness checks
3. Notify Architect
4. Open next process stage
```

Another:

```text
EVENT:
Site Recce completed

ACTIONS:
1. Generate Site Brief
2. Compare project data
3. Detect conflicts
4. Identify scope changes
5. Create approval requirements
```

---

## 21. Recommended System Components

### A. Meeting Intake

Responsible for:

- Upload recording
- Upload transcript
- Associate meeting with project
- Store meeting metadata

### B. Transcription Service

Responsible for:

- Audio-to-text
- Speaker separation where supported
- Raw transcript storage

### C. AI Extraction Service

Responsible for:

- Structured extraction
- Classification
- Confidence scoring
- Source references

### D. Master Brain

Responsible for:

- Project truth
- Entities
- Relationships
- Source tracking
- History
- Confirmations

### E. Readiness Engine

Responsible for:

- Missing information
- Required confirmations
- Project readiness score

### F. Conflict Engine

Responsible for:

- Detecting contradictory information
- Showing sources
- Creating resolution tasks

### G. Document Generator

Responsible for:

- Client Brief
- Scope of Work
- Other downstream documents

### H. Automation Engine

Responsible for:

- Events
- Conditions
- Actions
- Notifications
- Task creation
- Workflow transitions

---

## 22. Suggested Data Flow

```text
Meeting
  |
  +--> Recording
  |
  +--> Transcript
  |
  +--> Participants
  |
  +--> Date / Time
          |
          v
     AI Extraction
          |
          v
   Extracted Facts
          |
          v
   Master Brain
          |
     +----+----+
     |         |
     v         v
Readiness   Conflicts
     |         |
     +----+----+
          |
          v
     Human Review
          |
          v
      Confirmed
          |
          v
    Client Brief
          |
          v
   Scope / Planning /
   Site / Design /
   Procurement /
   Execution
```

---

## 23. MVP Scope

Do not build the entire automation platform first.

The first MVP should solve one clear problem:

> **"After an offline client meeting, nobody should need to manually fill the Client Brief."**

### MVP Features

- Project selection
- Meeting audio upload
- Transcript upload
- Transcription integration
- AI extraction
- Client Brief field mapping
- Confidence score
- Missing information detection
- Conflict detection
- Human confirmation
- Master Brain update
- Auto-generated Client Brief
- PDF generation
- Audit/source trail

---

## 24. MVP User Experience

### Step 1

Create/select project.

### Step 2

Upload meeting recording or transcript.

### Step 3

Click:

**Process Meeting**

### Step 4

RIPPOTAI displays:

```text
Meeting processed.

42 facts extracted
31 confirmed automatically
7 require confirmation
4 missing
2 conflicts
```

### Step 5

User reviews only exceptions.

### Step 6

Click:

**Confirm Brief**

### Step 7

RIPPOTAI generates:

- Client Brief
- Updated Master Brain
- Initial Scope of Work readiness
- Follow-up items

---

## 25. Success Criteria

The automation should be considered successful when:

### Current

```text
Meeting
↓
Manual notes
↓
Manual form filling
↓
Client Brief
↓
Manual re-entry into other modules
```

### Target

```text
Meeting
↓
Recording / Transcript
↓
AI Extraction
↓
Master Brain
↓
Human Exception Review
↓
Client Brief
↓
Automated Downstream Workflow
```

The primary KPI should be:

> **Minutes of manual data entry required per Client Brief**

Target:

```text
Current:
High manual effort

MVP:
Only exceptions and confirmations

Future:
Near-zero manual data entry
```

---

## 26. Long-Term Vision

The Client Brief automation should become the first implementation of a larger **Project Intelligence Layer**.

```text
MEETINGS
DOCUMENTS
MESSAGES
SITE RECCE
DESIGN DECISIONS
CLIENT APPROVALS
TEAM INPUT
       |
       v
MASTER BRAIN
       |
       v
AUTOMATION ENGINE
       |
       +--> Documents
       +--> Tasks
       +--> Notifications
       +--> Approvals
       +--> Gates
       +--> Timelines
       +--> Procurement
       +--> Vendor workflows
       +--> Reporting
```

The Client Brief is therefore not the final destination.

It is the **first automated ingestion pipeline into the Master Brain**.

---

## 27. Final Strategy

The recommended strategy is:

```text
1. Keep offline client meetings exactly as they are.
                  |
2. Record the meeting.
                  |
3. Transcribe the meeting.
                  |
4. Upload recording/transcript to RIPPOTAI.
                  |
5. AI extracts Client Brief information.
                  |
6. Store extracted facts in the Master Brain.
                  |
7. Identify missing / uncertain / conflicting information.
                  |
8. Ask the architect to review only exceptions.
                  |
9. Confirm the information.
                  |
10. Generate the Client Brief automatically.
                  |
11. Use the same Master Brain data downstream.
                  |
12. Trigger Scope, Planning and other workflows automatically.
```

## Core Principle

> **The team should conduct the meeting, not fill the form.**

The recording captures the conversation.

The transcription captures the words.

AI structures the information.

The Master Brain stores the information.

The human confirms the important decisions.

RIPPOTAI generates the Client Brief.

The automation engine then uses that information to move the project forward.
