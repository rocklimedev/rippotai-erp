"""Usage: python3 gen.py <section-module> -> writes sql/<section>.sql and prints row counts."""
import importlib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import Out  # noqa: E402

name = sys.argv[1]
mod = importlib.import_module(name)
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sql"), exist_ok=True)
o = Out(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sql", name + ".sql"))
mod.build(o)
o.write()
print(name, ", ".join(f"{t}={n}" for t, n in o.counts.items()))
