"""Export committed source and all Git refs; verify a clean-room restoration.
Usage: python3 scripts/export-project.py /absolute/output.zip
Excludes untracked files, databases, uploads and runtime configuration.
"""
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
def git(*args, cwd=ROOT):
    return subprocess.check_output(['git', *args], cwd=cwd)

def main():
    output = Path(sys.argv[1]).resolve()
    if output.exists():
        raise SystemExit('Refusing to overwrite an existing archive')
    if git('status', '--porcelain').strip():
        raise SystemExit('Commit or safely preserve all changes before exporting')
    head = git('rev-parse', 'HEAD').decode().strip()
    refs = git('for-each-ref', '--format=%(objectname) %(refname)').decode()
    with tempfile.TemporaryDirectory(prefix='pumamap-export-') as temp:
        temp = Path(temp)
        bundle = temp / 'history.bundle'
        git('bundle', 'create', str(bundle), '--all')
        git('clone', '--mirror', str(bundle), str(temp / 'restored.git'))
        restored = temp / 'restored.git'
        git('fsck', '--full', cwd=restored)
        assert git('for-each-ref', '--format=%(objectname) %(refname)', cwd=restored).decode() == refs
        assert git('rev-parse', 'HEAD', cwd=restored).decode().strip() == head
        source = zipfile.ZipFile(io.BytesIO(git('archive', '--format=zip', head)))
        files = {}
        for name in source.namelist():
            if name.endswith('/'):
                continue
            path = Path(name)
            if (path.name.startswith('.env') and path.name != '.env.example') or path.suffix in {'.pem', '.key', '.dump'}:
                raise SystemExit(f'Forbidden source path: {name}')
            data = source.read(name)
            assert data == git('show', f'{head}:{name}', cwd=restored)
            files['source/' + name] = data
        files['history.bundle'] = bundle.read_bytes()
        manifest = {'head': head, 'branch': git('branch','--show-current').decode().strip(),
                    'refs': refs.splitlines(), 'restoration': 'mirror clone, fsck, all refs and all source bytes verified',
                    'sha256': {n: hashlib.sha256(b).hexdigest() for n,b in files.items()}}
        files['MANIFEST.json'] = json.dumps(manifest, indent=2).encode()
        files['START_HERE.txt'] = (f'PumaMap checkpoint {head}\nClone history.bundle with git clone; source/ is a matching convenience copy.\nRead source/README.md and source/docs/HANDOFF_06.md. No database or private media is included.\n').encode()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name,data in files.items():
                archive.writestr(name,data)
        with zipfile.ZipFile(output) as archive:
            assert archive.testzip() is None
            for name, digest in manifest['sha256'].items():
                assert hashlib.sha256(archive.read(name)).hexdigest() == digest
    print(json.dumps({'archive':str(output),'head':head,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'verified':True}))

if __name__ == '__main__':
    main()
