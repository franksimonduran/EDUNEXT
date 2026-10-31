# EDUNEXT AI - MiniCPM local en el navegador

**Instalado:** `MiniCPM5-2B-Q4_K_M-GGUF` con el runtime `wllama` 3.8.1. Es una opción
experimental del tutor para pruebas internas con material demostrativo. No es el tutor
institucional, no sustituye la revisión docente y no acredita calidad pedagógica.

## Modelo y runtime

- Pesos: `frontend/assets/models/minicpm5-2b-gguf/MiniCPM5-2B-Q4_K_M.gguf`.
- Repositorio: `openbmb/MiniCPM5-2B-GGUF`, revisión `2079a22f3beaa4e306449978533478fe0522f4b3`.
- Modelo base y plantilla: `openbmb/MiniCPM5-2B`, revisión `f97400052a43d642bbc6e9975e2397e3ae6a6b52`.
- Tamaño: 1 561 318 368 bytes; SHA-256 `ec2d5801640099e97d8d7e8003ad4d81f336e757811f03a26173dddf386602fd`.
- Licencia de pesos: Apache-2.0. Se conserva `LICENSE-APACHE-2.0.txt` y `PROVENANCE.json`.
- Runtime: `wllama` 3.8.1 (MIT), vendorizado en `frontend/js/vendor/wllama/` con
  `index.js`, `wllama.wasm`, `LICENSE` y `PROVENANCE.json`. No se usa CDN ni se descarga
  código en tiempo de ejecución.
- Plantilla: el GGUF incluye la plantilla de chat; se activa con `jinja: true` y
  `chat_template_kwargs: {enable_thinking: false}`. Se conserva una copia de referencia en
  `chat_template.jinja`.

## Ejecución

La inferencia corre en el navegador con WebAssembly (CPU). `wllama` puede usar WebGPU,
pero esta integración lo deja desactivado (`n_gpu_layers: 0`) para evitar fallos por
VRAM/drivers. El servicio puede usar hasta 4 hilos sólo si el contexto está aislado
(`crossOriginIsolated` y `SharedArrayBuffer`); en caso contrario usa 1 hilo, por lo que no
requiere cabeceras COOP/COEP.

Consecuencias esperadas:

- La primera carga lee 1.5 GB de pesos y necesita varios GB de RAM libres.
- En CPU la generación puede tardar minutos y consumir batería; no hay garantía de latencia.
- Si el navegador no ofrece WebAssembly, la vista falla cerrada y no cambia a la nube.
- Las preguntas y respuestas no se guardan; cada pregunta se procesa por separado.
- La calidad en español y el comportamiento pedagógico no están certificados.

## Instalación y verificación

Desde la raíz del proyecto:

```powershell
node tools/install-local-minicpm.cjs --verify
node tools/install-local-minicpm.cjs --download   # sólo si faltan recursos
```

`--verify` no usa red: comprueba el recibo, el SHA-256 de los pesos, la licencia, la
plantilla y los archivos vendorizados de `wllama`. `--download` no sobrescribe archivos
existentes que no coincidan; revisa manualmente cualquier `.installing`. El GGUF está
ignorado por Git; el recibo, la licencia, la plantilla y el runtime sí son versionables.

`download-gguf.ps1` ahora delega en `node tools/install-local-minicpm.cjs --download`;
no borra ni sobrescribe el GGUF existente y conserva la verificación de hashes y runtime.

## Seguridad y CSP

El despliegue debe permitir WebAssembly y el worker interno de `wllama` sin debilitar el
resto de la política. En `infra/docker/nginx.conf` la CSP incluye:

- `script-src 'self' 'wasm-unsafe-eval' blob:`
- `worker-src 'self' blob:`

No se habilita `'unsafe-eval'`, no se permite JavaScript remoto y no se relajan CSRF,
CORS ni RBAC. La demo local sirve `.wasm` como `application/wasm` y soporta rangos HTTP
para no cargar el GGUF completo en memoria del servidor.

## Pruebas y límites

- `node tests/local-minicpm.cjs`: servicio con runtime simulado, validación de entrada/salida,
  hashes reales de los artefactos instalados y comprobación de inventario. **No** demuestra
  inferencia real ni compatibilidad de dispositivos.
- `EDUNEXT_MINICPM_BROWSER=1 node tests/frontend-refresh.browser.cjs`: prueba opcional en
  navegador real; puede tardar mucho en CPU y no forma parte de la puerta por defecto.
- Resultado observado el 2026-10-30 en Edge headless 156 sobre Windows, CPU/WASM y 1 hilo:
  carga 13.8 s, primera respuesta 131 s y segunda respuesta con red emulada offline 34 s,
  con dos preguntas sintéticas. Evidencia:
  `docs/final/evidence/revalidation-1793374866725-17248/`. Son medidas de un equipo, no
  una garantía de latencia ni una aprobación pedagógica.
- Los recursos de marca (`mark.svg`, `open-book.svg`, `edunext-192.png`) ya están
  presentes en `frontend/assets/images/branding/` y las pruebas de navegador
  (`frontend-refresh.browser.cjs`) y el validador PWA (`phase49-infra.cjs`) superan
  la comprobación de recursos faltantes.
- La evidencia se guarda en un espacio `docs/final/evidence/revalidation-*` cuando el
  manifiesto candidato está congelado; nunca se sobrescribe evidencia histórica.

Estado: **NO-GO**. Esta integración es interna y experimental. No autoriza piloto real,
uso con menores, publicación, aprobación pedagógica ni sustitución de revisión docente.
