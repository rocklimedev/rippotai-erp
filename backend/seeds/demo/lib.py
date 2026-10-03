"""Shared helpers + master data for the INOS demo seed (Rippotai Architecture).

Everything is deterministic: ids are uuid5 of a readable key and all dates are
relative to SEED_TODAY (default: the anchor in _seed_state, else 2026-09-29), so re-running produces identical
rows and `INSERT IGNORE` makes the seed idempotent.
"""
import json
import os
import random
import subprocess
import uuid
from datetime import date, datetime, timedelta

NS = uuid.UUID("6f1c2a52-2d0e-4c1e-9d8e-7a11a0000001")
DB = os.environ.get("SEED_DB", "spsyn8lm_rippotai_erp")


def _seed_today() -> str:
    """SEED_TODAY env, else the anchor kept by shift_dates.py (table _seed_state), else 2026-09-29."""
    if os.environ.get("SEED_TODAY"):
        return os.environ["SEED_TODAY"]
    try:
        out = subprocess.run(["mysql", DB, "-N", "-e", "SELECT v FROM _seed_state WHERE k = 'today'"],
                             capture_output=True, text=True).stdout.strip()
        if out:
            return out
    except Exception:
        pass
    return "2026-09-29"


TODAY = date.fromisoformat(_seed_today())
R = random.Random(20260929)


def U(key: str) -> str:
    return str(uuid.uuid5(NS, key))


def d(days: int) -> date:
    return TODAY + timedelta(days=days)


def dt(days: int, hour: int = 10, minute: int = 0) -> datetime:
    x = TODAY + timedelta(days=days)
    return datetime(x.year, x.month, x.day, hour, minute, 0)


def lit(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return repr(round(v, 3)) if isinstance(v, float) else str(v)
    if isinstance(v, datetime):
        return "'" + v.strftime("%Y-%m-%d %H:%M:%S") + "'"
    if isinstance(v, date):
        return "'" + v.isoformat() + "'"
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False)
    if isinstance(v, Raw):
        return v.sql
    s = str(v).replace("\\", "\\\\").replace("'", "''")
    return "'" + s + "'"


class Raw:
    def __init__(self, sql):
        self.sql = sql


class Out:
    def __init__(self, path):
        self.path = path
        self.buf = ["SET NAMES utf8mb4;", "SET FOREIGN_KEY_CHECKS=1;"]
        self.counts = {}

    def ins(self, table, rows, mode="IGNORE"):
        rows = [r for r in rows if r]
        if not rows:
            return
        existing = table_cols(table)
        cols = [c for c in rows[0].keys() if c in existing]  # tolerate schema drift
        for i in range(0, len(rows), 200):
            chunk = rows[i:i + 200]
            vals = ",\n".join("(" + ",".join(lit(r.get(c)) for c in cols) + ")" for r in chunk)
            self.buf.append(
                f"INSERT {mode} INTO `{table}` (" + ",".join(f"`{c}`" for c in cols) + ") VALUES\n" + vals + ";")
        self.counts[table] = self.counts.get(table, 0) + len(rows)

    def sql(self, s):
        self.buf.append(s.rstrip(";") + ";")

    def write(self):
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("\n".join(self.buf) + "\n")


def q(sql):
    out = subprocess.run(["mysql", DB, "-N", "--default-character-set=utf8mb4", "-e", sql],
                         capture_output=True, text=True, check=True).stdout
    return [line.split("\t") for line in out.splitlines() if line]


_COLS = {}


def table_cols(table):
    if table not in _COLS:
        _COLS[table] = {r[0] for r in q(f"SHOW COLUMNS FROM `{table}`")}
    return _COLS[table]


def has_col(table, col):
    return bool(q(f"SHOW COLUMNS FROM `{table}` LIKE '{col}'"))


def has_table(table):
    return bool(q(f"SHOW TABLES LIKE '{table}'"))


# ---------------------------------------------------------------- master data
ADMIN = "c4af5469-bbd1-11f1-9c80-02fc00000001"
ROLE_ADMIN = "c4af4d4a-bbd1-11f1-9c80-02fc00000001"
ROLE_USER = "c4af4fcd-bbd1-11f1-9c80-02fc00000001"

# key, name, email, phone, job title, team key, role
USERS = [
    ("ritika", "Ritika Sharma", "ritika.sharma@rippotai.in", "+91 98110 20401", "Principal Architect", "design", ROLE_ADMIN),
    ("arjun", "Arjun Mehra", "arjun.mehra@rippotai.in", "+91 98110 20402", "Senior Architect", "design", ROLE_USER),
    ("neha", "Neha Bansal", "neha.bansal@rippotai.in", "+91 98110 20403", "Lead Interior Designer", "design", ROLE_USER),
    ("kabir", "Kabir Khanna", "kabir.khanna@rippotai.in", "+91 98110 20404", "Junior Architect", "design", ROLE_USER),
    ("sandeep", "Sandeep Yadav", "sandeep.yadav@rippotai.in", "+91 98110 20405", "Site Engineer", "site", ROLE_USER),
    ("manoj", "Manoj Rawat", "manoj.rawat@rippotai.in", "+91 98110 20406", "Site Supervisor", "site", ROLE_USER),
    ("imran", "Imran Qureshi", "imran.qureshi@rippotai.in", "+91 98110 20407", "Site Engineer", "site", ROLE_USER),
    ("pooja", "Pooja Arora", "pooja.arora@rippotai.in", "+91 98110 20408", "Procurement Manager", "procurement", ROLE_USER),
    ("rohit", "Rohit Gupta", "rohit.gupta@rippotai.in", "+91 98110 20409", "Procurement Executive", "procurement", ROLE_USER),
    ("sunita", "Sunita Jain", "sunita.jain@rippotai.in", "+91 98110 20410", "Accounts Manager", "accounts", ROLE_USER),
    ("vivek", "Vivek Malhotra", "vivek.malhotra@rippotai.in", "+91 98110 20411", "Business Development Manager", "bd", ROLE_USER),
    ("anjali", "Anjali Verma", "anjali.verma@rippotai.in", "+91 98110 20412", "Project Manager", "planning", ROLE_USER),
]
UID = {k: U("user:" + k) for k, *_ in USERS}
UID["ajay"] = ADMIN
UNAME = {k: n for k, n, *_ in USERS}
UNAME["ajay"] = "Ajay Chhabra"

# Existing rows (never deleted; enriched with UPDATEs)
EXISTING_CLIENTS = {
    "aurum": "14e299fc-3945-4e85-94a5-56c0ed83ba0a",
    "sagar": "5446cce3-970f-4b5b-9284-9e17da90926e",
    "malhotra": "791d0df6-43f6-46b6-a73b-d54c3a64812d",
    "kapoor": "9d1c7f10-0000-4000-8000-000000000002",
}
EXISTING_PROJECTS = {
    "sagar": "2af18e7c-ac58-4475-ac5a-b7c1427d7921",
    "cmstore": "8b4849cb-e919-486a-a956-20f7bf931eeb",
    "malhotra": "bbbe795e-3a69-4ba7-8918-da5647d100c3",
    "kapoor": "c14f9e90-bcdb-419b-abf4-e3a3002d6283",
    "aurum": "de1b1f71-9bbc-4319-bf63-bbf8e2ae49d8",
}
RESIDENTIAL_TYPE = "7c0e8d8a-0000-4000-8000-000000000001"

# key, name, contact, email, phone, address
CLIENTS = [
    ("kapoor", "Vikram Kapoor", "Vikram Kapoor", "vikram.kapoor@example.com", "+91 98110 45672", "B-12, Vasant Vihar, New Delhi 110057"),
    ("malhotra", "Anil Malhotra", "Anil Malhotra", "anil.malhotra@example.com", "+91 98111 30219", "14, Golf Links, New Delhi 110003"),
    ("sagar", "Sagar Mehta", "Sagar Mehta", "sagar@example.com", "+91 98100 11111", "C-4/7, Vasant Vihar, New Delhi 110057"),
    ("aurum", "Aurum Capital", "M. Iyer", "facilities@example.com", "+91 98100 22222", "Tower B, DLF Cyber City Phase II, Gurugram 122002"),
    ("cm", "Chhabra Marble Pvt Ltd", "Ajay Chhabra", "store@chhabramarble.com", "+91 98112 00101", "Plot 21, Kirti Nagar Industrial Area, New Delhi 110015"),
    ("bhatia", "Rajiv Bhatia", "Rajiv Bhatia", "rajiv.bhatia@example.com", "+91 98100 45120", "S-218, Greater Kailash II, New Delhi 110048"),
    ("oberoi", "Karan Oberoi", "Karan & Sneha Oberoi", "karan.oberoi@example.com", "+91 98189 33104", "Tower 3, Apt 1402, DLF The Camellias, Golf Course Road, Gurugram 122009"),
    ("sethi", "Sethi Hospitality Pvt Ltd", "Harpreet Sethi", "harpreet@sethihospitality.example.com", "+91 98733 11820", "Kh. No. 312, Ward 7, Mehrauli, New Delhi 110030"),
    ("rocklime", "Rocklime India Pvt Ltd", "Ajay Chhabra", "admin@rocklime.com", "+91 98112 00100", "D-41, Okhla Industrial Area Phase II, New Delhi 110020"),
    ("gupta", "Nandini Gupta", "Nandini Gupta", "nandini.gupta@example.com", "+91 98107 66410", "Farm 9, Sainik Farms, New Delhi 110062"),
    ("arora", "Arora Foods Pvt Ltd", "Siddharth Arora", "siddharth@arorafoods.example.com", "+91 99990 21478", "Plot 88, Sector 44, Gurugram 122003"),
    ("singhania", "Deepa Singhania", "Deepa Singhania", "deepa.singhania@example.com", "+91 98182 77430", "Penthouse 2, Tower A, Sector 42, Golf Course Road, Gurugram 122002"),
    ("tandon", "Harish Tandon", "Harish Tandon", "harish.tandon@example.com", "+91 98101 58822", "D-9, Panchsheel Park, New Delhi 110017"),
    ("brew", "Brew Theory Cafe LLP", "Aditi Rao", "aditi@brewtheory.example.com", "+91 97111 40302", "32, Hauz Khas Village, New Delhi 110016"),
    ("choudhary", "Amit Choudhary", "Amit Choudhary", "amit.choudhary@example.com", "+91 98995 12076", "B-704, Sector 50, Noida 201301"),
]
CID = {k: EXISTING_CLIENTS.get(k, U("client:" + k)) for k, *_ in CLIENTS}
CNAME = {k: n for k, n, *_ in CLIENTS}
CADDR = {k: a for k, n, c, e, p, a in CLIENTS}

PROJECT_TYPES = [
    ("residential", "Residential", "Independent houses, kothis and builder floors"),
    ("farmhouse", "Farmhouse", "Farmhouses and weekend estates in Delhi-NCR"),
    ("apartment", "Apartment Interiors", "Turnkey interiors for apartments and penthouses"),
    ("office", "Commercial Office", "Corporate office fit-outs"),
    ("retail", "Retail & F&B", "Stores, showrooms, cafes and experience centres"),
    ("hospitality", "Hospitality", "Boutique hotels and resorts"),
]
PTID = {k: (RESIDENTIAL_TYPE if k == "residential" else U("ptype:" + k)) for k, *_ in PROJECT_TYPES}

# Main phase sequence used by the gate engine / command center (DOCUMENTS module)
PHASES = ["01_BRIEF", "02_RECCE", "03_PRE_DESIGN", "04_PLANNING", "05_DESIGN", "06_TENDER",
          "07_WORKING", "08_EXECUTION", "09_HANDOVER"]
PHASE_IDX = {p: i for i, p in enumerate(PHASES)}
PHASE_IDX["A_VENDOR_TRADES"] = 5.5
PHASE_IDX["B_MATERIAL"] = 4.5

# key, name, client, type, location, budget(INR), status, priority, phase, progress,
# start offset (days ago), duration days, site-ops int id, sqft, floors, site_type
PROJECTS = [
    ("kapoor", "Kapoor Farmhouse", "kapoor", "farmhouse", "Chhatarpur, New Delhi", 32000000, "active", "HIGH", "08_EXECUTION", 58, 300, 540, 1, 9500, 2, "KOTHI"),
    ("malhotra", "Malhotra Residence", "malhotra", "residential", "Golf Links, New Delhi", 45000000, "active", "HIGH", "07_WORKING", 44, 240, 600, 2, 7200, 3, "KOTHI"),
    ("sagar", "Sagar Residence", "sagar", "residential", "Vasant Vihar, New Delhi", 18000000, "active", "MEDIUM", "05_DESIGN", 27, 120, 420, None, 4200, 3, "FLOOR"),
    ("cmstore", "Chhabra Marble Flagship Store", "cm", "retail", "Kirti Nagar, New Delhi", 8500000, "active", "HIGH", "08_EXECUTION", 72, 170, 240, 3, 6000, 2, "RAW"),
    ("aurum", "Aurum Offices", "aurum", "office", "Cyber City, Gurugram", 24000000, "active", "MEDIUM", "06_TENDER", 36, 150, 330, None, 14500, 1, "FLOOR"),
    ("bhatia", "Bhatia Kothi", "bhatia", "residential", "Greater Kailash II, New Delhi", 65000000, "active", "CRITICAL", "08_EXECUTION", 38, 330, 720, 4, 10800, 4, "KOTHI"),
    ("oberoi", "Oberoi Apartment", "oberoi", "apartment", "DLF The Camellias, Gurugram", 12000000, "active", "MEDIUM", "08_EXECUTION", 81, 200, 260, 5, 5200, 1, "FLAT"),
    ("courtyard", "The Courtyard Boutique Hotel", "sethi", "hospitality", "Mehrauli, New Delhi", 80000000, "active", "CRITICAL", "04_PLANNING", 17, 75, 720, None, 22000, 4, "RAW"),
    ("rocklime", "Rocklime Experience Centre", "rocklime", "retail", "Okhla Phase II, New Delhi", 9500000, "active", "HIGH", "09_HANDOVER", 93, 190, 200, 6, 4800, 1, "FLOOR"),
    ("gupta", "Gupta Villa", "gupta", "farmhouse", "Sainik Farms, New Delhi", 38000000, "active", "MEDIUM", "03_PRE_DESIGN", 11, 45, 600, None, 8800, 2, "KOTHI"),
    ("arora", "Arora Foods Corporate Office", "arora", "office", "Sector 44, Gurugram", 16000000, "active", "MEDIUM", "02_RECCE", 5, 18, 240, None, 9000, 1, "FLOOR"),
    ("singhania", "Singhania Penthouse", "singhania", "apartment", "Golf Course Road, Gurugram", 22000000, "active", "HIGH", "07_WORKING", 49, 210, 360, 7, 6400, 2, "FLAT"),
    ("tandon", "Tandon Residence", "tandon", "residential", "Panchsheel Park, New Delhi", 14000000, "completed", "LOW", "09_HANDOVER", 100, 420, 330, None, 3900, 3, "FLOOR"),
    ("brew", "Brew Theory Cafe", "brew", "retail", "Hauz Khas Village, New Delhi", 4500000, "on_hold", "LOW", "05_DESIGN", 31, 110, 150, None, 1800, 2, "RAW"),
]
PID = {p[0]: EXISTING_PROJECTS.get(p[0], U("project:" + p[0])) for p in PROJECTS}
PNAME = {p[0]: p[1] for p in PROJECTS}
PBYKEY = {p[0]: p for p in PROJECTS}
SITE_INT = {p[0]: p[12] for p in PROJECTS if p[12]}
PM = {  # lead architect / site engineer per project
    "kapoor": ("ritika", "sandeep"), "malhotra": ("arjun", "manoj"), "sagar": ("neha", None),
    "cmstore": ("neha", "imran"), "aurum": ("arjun", None), "bhatia": ("ritika", "manoj"),
    "oberoi": ("neha", "imran"), "courtyard": ("ritika", None), "rocklime": ("kabir", "sandeep"),
    "gupta": ("arjun", None), "arora": ("kabir", "imran"), "singhania": ("neha", "sandeep"),
    "tandon": ("arjun", "manoj"), "brew": ("kabir", None),
}


def phase_of(pk):
    return PBYKEY[pk][8]


def pidx(pk):
    return PHASE_IDX[phase_of(pk)] + (1 if PBYKEY[pk][6] == "completed" else 0)


def start_of(pk):
    return -PBYKEY[pk][10]


def site_addr(pk):
    p = PBYKEY[pk]
    return CADDR[p[2]] if p[2] in CADDR else p[4]


# units: code, name
UNITS = [("SQFT", "Square Feet"), ("SQM", "Square Metre"), ("RFT", "Running Feet"), ("RMT", "Running Metre"),
         ("NOS", "Numbers"), ("CUM", "Cubic Metre"), ("KG", "Kilogram"), ("MT", "Metric Tonne"),
         ("BAG", "Bag"), ("LTR", "Litre"), ("SET", "Set"), ("LS", "Lump Sum"), ("BOX", "Box"),
         ("CFT", "Cubic Feet"), ("DAY", "Man-day"), ("PT", "Point")]


def unit_ids():
    rows = q("SELECT code, id FROM units")
    return {c: i for c, i in rows}
