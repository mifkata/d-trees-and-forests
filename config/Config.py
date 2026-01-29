import os
import sys

OUTPUT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), '..', 'output'))

# VERBOSE is False when --json is passed (disables logging)
VERBOSE = '--json' not in sys.argv
