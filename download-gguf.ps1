$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root
try {
    node tools/install-local-minicpm.cjs --download
    if ($LASTEXITCODE -ne 0) { throw "El instalador terminó con código $LASTEXITCODE" }
} finally {
    Pop-Location
}
