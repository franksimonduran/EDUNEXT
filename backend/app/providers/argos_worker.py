"""Private bounded worker. Argos tokenizers + installed Argos/CTranslate2 models.

Avoid the high-level pipeline's automatic SBD downloads and global paragraph cache.
Short passages use deterministic sentence boundaries. Each process forgets all text
on exit. No API, SQL, app settings, prompts, tools or filesystem writes are exposed.
"""

import contextlib
import hashlib
import io
import json
from pathlib import Path
import re
import socket
import sys


def no_network(*args, **kwargs):
    raise RuntimeError("Network disabled in local translation worker")


def packages(root):
    manifest = json.loads((root / "model-set.json").read_text(encoding="utf-8"))
    found = {}
    for pair in ("en-es", "es-en"):
        entry = manifest["packages"][pair]
        required = {"metadata.json", "model/model.bin"}
        if not required.issubset(entry["runtime_sha256"]) or not {"sentencepiece.model", "bpe.model"}.intersection(entry["runtime_sha256"]):
            raise ValueError("Incomplete model receipt")
        folder = (root / pair).resolve()
        if not folder.is_relative_to(root):
            raise ValueError("Invalid model directory")
        for name, expected in entry["runtime_sha256"].items():
            file = (folder / name).resolve()
            if not file.is_relative_to(folder) or not file.is_file():
                raise ValueError("Missing model file")
            digest = hashlib.sha256()
            with file.open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(chunk)
            if digest.hexdigest() != expected:
                raise ValueError("Model fingerprint changed")
        metadata = json.loads((folder / "metadata.json").read_text(encoding="utf-8"))
        if pair != metadata["from_code"] + "-" + metadata["to_code"]:
            raise ValueError("Model language mismatch")
        found[pair] = (folder, metadata)
    return found


def run(root, request):
    import ctranslate2
    from argostranslate.tokenizer import BPETokenizer, SentencePieceTokenizer

    installed = packages(root)
    for folder, _ in installed.values():
        if not ctranslate2.contains_model(str(folder / "model")):
            raise ValueError("Invalid local model")
    if request.get("operation") == "check":
        return {"ok": True, "pairs": sorted(installed)}
    if request.get("operation") != "translate":
        raise ValueError("Invalid operation")
    pair = request["source_language"] + "-" + request["target_language"]
    folder, metadata = installed[pair]
    text, maximum = request["text"], request["max_tokens"]
    if not isinstance(text, str) or not text.strip() or len(text) > 1000 or type(maximum) is not int or not 32 <= maximum <= 512:
        raise ValueError("Invalid text or limit")
    if (folder / "sentencepiece.model").is_file():
        tokenizer = SentencePieceTokenizer(folder / "sentencepiece.model")
    else:
        tokenizer = BPETokenizer(folder / "bpe.model", metadata["from_code"], metadata["to_code"])
    # Explicit float32: the official es-en 1.9 model produced degenerate repeated
    # output with int8 on this CPU/runtime. Never trade correctness for auto quantization.
    translator = ctranslate2.Translator(str(folder / "model"), device="cpu", compute_type="float32", inter_threads=1, intra_threads=2)
    paragraphs, used = [], 0
    for paragraph in text.split("\n"):
        if not paragraph.strip():
            paragraphs.append("")
            continue
        sentences = re.split(r"(?<=[.!?])\s+", paragraph.strip())
        tokens = [tokenizer.encode(sentence) for sentence in sentences]
        if any(len(sentence) > 512 for sentence in tokens):
            raise ValueError("Input exceeds tokenizer limit")
        prefix = metadata.get("target_prefix", "")
        answers = translator.translate_batch(tokens, target_prefix=[[prefix]] * len(tokens) if prefix else None,
            beam_size=4, replace_unknowns=True, max_input_length=512, max_decoding_length=maximum + 1,
            length_penalty=0.2, max_batch_size=32, batch_type="tokens")
        values = []
        for answer in answers:
            output = answer.hypotheses[0]
            used += len(output)
            if used > maximum or len(output) >= maximum + 1:
                raise ValueError("Output exceeds limit; no truncated translation returned")
            value = tokenizer.decode(output)
            if prefix and value.startswith(prefix):
                value = value[len(prefix):]
            values.append(value.strip())
        paragraphs.append(" ".join(values))
    translated = "\n".join(paragraphs).strip()
    if not translated or len(translated) > 6000:
        raise ValueError("Invalid output")
    return {"ok": True, "text": translated}


if __name__ == "__main__":
    socket.socket.connect = no_network
    socket.socket.connect_ex = no_network
    socket.create_connection = no_network
    socket.getaddrinfo = no_network
    try:
        raw = sys.stdin.buffer.read(16385)
        if len(raw) > 16384:
            raise ValueError("Request too large")
        # Suppress dependency output so neither source text nor internal errors leak.
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            result = run(Path(sys.argv[1]).resolve(), json.loads(raw))
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
    except Exception:
        sys.stdout.write('{"ok":false}')
        raise SystemExit(1)
