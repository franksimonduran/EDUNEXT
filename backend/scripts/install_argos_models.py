"""Explicit one-time model download. No app import, DB, cloud translation or overwrite."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import tempfile
import urllib.request
import zipfile
from datetime import datetime, timezone

INDEX = "https://raw.githubusercontent.com/argosopentech/argospm-index/main/index.json"
MAX_ARCHIVE = 350 * 1024 * 1024
MAX_EXPANDED = 800 * 1024 * 1024


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def download(url, destination, maximum):
    opener = urllib.request.build_opener(NoRedirect())
    digest, total = hashlib.sha256(), 0
    request = urllib.request.Request(url, headers={"User-Agent": "EDUNEXT-local-model-installer/1.0"})
    with opener.open(request, timeout=60) as response, destination.open("xb") as output:
        while chunk := response.read(1024 * 1024):
            total += len(chunk)
            if total > maximum:
                raise ValueError("Download exceeds size limit")
            digest.update(chunk)
            output.write(chunk)
    return digest.hexdigest(), total


def extract(archive, folder, pair):
    with zipfile.ZipFile(archive) as package:
        entries = package.infolist()
        if len(entries) > 10000 or sum(entry.file_size for entry in entries) > MAX_EXPANDED:
            raise ValueError("Model archive exceeds extraction limits")
        roots = set()
        for entry in entries:
            name = PurePosixPath(entry.filename)
            if name.is_absolute() or ".." in name.parts or "\\" in entry.filename or ":" in entry.filename or stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError("Unsafe model archive path")
            if not name.parts:
                raise ValueError("Invalid archive entry")
            roots.add(name.parts[0])
        if len(roots) != 1:
            raise ValueError("Expected one model package directory")
        base = roots.pop()
        metadata = json.loads(package.read(base + "/metadata.json"))
        if pair != metadata.get("from_code", "") + "-" + metadata.get("to_code", ""):
            raise ValueError("Unexpected model language pair")
        folder.mkdir()
        for entry in entries:
            relative = PurePosixPath(entry.filename).parts[1:]
            if not relative:
                continue
            target = folder.joinpath(*relative)
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with package.open(entry) as source, target.open("xb") as output:
                    shutil.copyfileobj(source, output, length=1024 * 1024)
    # Older valid CTranslate2 packages have no config.json; vocabulary is bundled.
    required = ["metadata.json", "model/model.bin"]
    tokenizer = "sentencepiece.model" if (folder / "sentencepiece.model").is_file() else "bpe.model"
    required.append(tokenizer)
    if not all((folder / name).is_file() for name in required):
        raise ValueError("Incomplete model package: " + ", ".join(name for name in required if not (folder / name).is_file()))
    # Include every inference file, not Stanza/SBD material unused by this adapter.
    runtime = sorted(set(required + [str(file.relative_to(folder)).replace("\\", "/") for file in (folder / "model").rglob("*") if file.is_file()]))
    hashes = {name: hashlib.sha256((folder / name).read_bytes()).hexdigest() for name in runtime}
    license_files = [str(file.relative_to(folder)).replace("\\", "/") for file in folder.rglob("*") if file.is_file() and re.search(r"license|licence|readme", file.name, re.I)]
    return {"package_version": metadata.get("package_version"), "runtime_sha256": hashes, "license_files": license_files}


def main():
    parser = argparse.ArgumentParser(description="Install English/Spanish Argos models explicitly; never during a translation.")
    parser.add_argument("--destination", type=Path, required=True)
    parser.add_argument("--download-models", action="store_true", help="Explicitly allow network downloads of the two model packages")
    args = parser.parse_args()
    if not args.download_models:
        parser.error("Pass --download-models to authorize the initial downloads")
    destination = args.destination.resolve()
    if destination.exists():
        parser.error("Destination already exists; choose a new directory. No existing models will be overwritten.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="edunext-model-install-", dir=destination.parent) as scratch:
        temporary = Path(scratch)
        index_file = temporary / "index.json"
        index_hash, _ = download(INDEX, index_file, 1024 * 1024)
        index = json.loads(index_file.read_text(encoding="utf-8"))
        prepared = temporary / "installed"
        prepared.mkdir()
        receipt = {"installed_at": datetime.now(timezone.utc).isoformat(), "index": INDEX, "index_sha256": index_hash, "packages": {}, "note": "Hashes record downloaded content; they are not publisher signatures or pedagogical/license approval."}
        for pair in ("en-es", "es-en"):
            source, target = pair.split("-")
            matches = [item for item in index if item.get("from_code") == source and item.get("to_code") == target]
            if len(matches) != 1:
                raise ValueError("Expected one official package per pair")
            entry = matches[0]
            url = next((link for link in entry["links"] if re.fullmatch(r"https://argos-net\.com/v1/translate-(?:en_es|es_en)-[0-9_]+\.argosmodel", link)), None)
            if url is None:
                raise ValueError("No approved HTTPS model URL in index")
            archive = temporary / (pair + ".argosmodel")
            digest, size = download(url, archive, MAX_ARCHIVE)
            record = extract(archive, prepared / pair, pair)
            receipt["packages"][pair] = {**record, "url": url, "archive_sha256": digest, "archive_bytes": size}
            print(f"Prepared {pair}: {size} bytes; SHA-256 {digest}")
        (prepared / "model-set.json").write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        # Same parent/filesystem; publish a complete set only, never a partial install.
        prepared.rename(destination)
    print("Installed model set: " + str(destination))
    print("Review included model licenses before institutional use. No application gate was enabled.")


if __name__ == "__main__":
    main()
