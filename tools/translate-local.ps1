param(
    [ValidateSet('es','en')][string]$From = 'es',
    [ValidateSet('es','en')][string]$To = 'en',
    [string]$Python = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$models = Join-Path $root 'backend\.local\argos-en-es'
if ($From -eq $To) { throw 'Elige idiomas diferentes: -From es -To en, o -From en -To es.' }
if (-not $Python) {
    $runtime = Join-Path $root 'backend\.local\argos-runtime.json'
    if (-not (Test-Path -LiteralPath $runtime)) {
        throw 'Indica -Python con la ruta de tu entorno Argos. Consulta docs/ARGOS_TRANSLATE_SETUP.md.'
    }
    $Python = (Get-Content -LiteralPath $runtime -Raw | ConvertFrom-Json).python_executable
}
if (-not $Python -or -not (Test-Path -LiteralPath $Python -PathType Leaf)) {
    throw 'El entorno Python ya no esta disponible. Reinstala en un entorno propio y usa -Python.'
}
Write-Host 'EDUNEXT Translate: modelo local. No escribas datos personales. Puede contener errores.'
$arguments = @('-X', 'utf8', (Join-Path $root 'backend\scripts\translate_local.py'), '--packages-dir', $models, '--from', $From, '--to', $To)
if ($MyInvocation.ExpectingInput) {
    $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $input | & $Python @arguments
} else {
    & $Python @arguments
}
exit $LASTEXITCODE
