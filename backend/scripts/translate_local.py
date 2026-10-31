"""Single-user terminal translation; no HTTP server, database or session bypass."""

import argparse
import asyncio
import os
from pathlib import Path
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser(description="EDUNEXT Translate: local English/Spanish translation. Text is read from standard input, not saved.")
    parser.add_argument("--packages-dir", type=Path, required=True)
    parser.add_argument("--from", dest="source", choices=("es", "en"), required=True)
    parser.add_argument("--to", dest="target", choices=("es", "en"), required=True)
    args = parser.parse_args()
    if args.source == args.target:
        parser.error("Select different languages")
    root = args.packages_dir.resolve()
    backend = Path(__file__).resolve().parents[1]
    # Keep Pydantic's relative .env lookup outside the project. Do not read private config.
    with tempfile.TemporaryDirectory(prefix="edunext-translate-") as temporary:
        original = Path.cwd()
        try:
            os.chdir(temporary)
            sys.path.insert(0, str(backend))
            from app.providers.argos_provider import ArgosProvider
            from app.providers.base_provider import ProviderFailure
            from app.services.ai_safety_service import plain_text, validate_output
            from app.core.exceptions import ValidationError
            if sys.stdin.isatty():
                print("Texto educativo (sin datos personales):", file=sys.stderr)
                try:
                    text = input()
                except EOFError:
                    print("No se recibio texto. Escribe en una terminal interactiva o usa entrada estandar.", file=sys.stderr)
                    return 1
            else:
                text = sys.stdin.read(1001)
            async def translate():
                provider = ArgosProvider(packages_dir=str(root), timeout=60)
                result = await provider.generate_text(system="", payload={"text": plain_text(text, maximum=1000), "source_language": args.source, "target_language": args.target}, max_tokens=512)
                return validate_output(result.text)
            try:
                print(asyncio.run(translate()))
            except (ProviderFailure, ValidationError):
                print("Traducción no disponible: revisa modelos, límites y texto educativo sin datos personales.", file=sys.stderr)
                return 1
        finally:
            os.chdir(original)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
