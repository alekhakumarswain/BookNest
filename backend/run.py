import sys
import subprocess
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
venv_python = backend_dir / "venv" / "Scripts" / "python.exe"

# If running with global python, re-run using the virtualenv python
if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
    sys.exit(subprocess.call([str(venv_python), __file__] + sys.argv[1:]))

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
