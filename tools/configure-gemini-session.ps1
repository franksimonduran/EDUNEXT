# Run manually in your local PowerShell terminal. Never paste the key in chat.
# Does not read/write .env, start processes, contact Google or access a database.
[CmdletBinding()]
param()

function Set-EdunextGeminiSession {
    $model = (Read-Host 'Identificador exacto del modelo disponible en Google AI Studio (gemini-...)').Trim()
    if ($model -notmatch '^gemini-[a-zA-Z0-9._-]{1,100}$') {
        Write-Warning 'Identificador no valido. No se cambio la configuracion.'
        return
    }
    Write-Host 'Solo pruebas con textos ficticios, en equipo y entorno autorizados.'
    Write-Host 'Google recibira preguntas y material educativo. Puede haber costos.'
    $approval = Read-Host 'Escribe AUTORIZO para preparar esta sesion; cualquier otro texto cancela'
    if ($approval -cne 'AUTORIZO') {
        Write-Host 'Cancelado. No se cambio la configuracion.'
        return
    }
    $secret = Read-Host 'Nueva clave privada de Google AI Studio (entrada oculta)' -AsSecureString
    $pointer = [IntPtr]::Zero
    $value = $null
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if ([string]::IsNullOrWhiteSpace($value) -or $value -match '[\r\n]') {
            Write-Warning 'Clave vacia o formato no valido. No se cambio la configuracion.'
            return
        }
        # Process-scoped only: inherited by a backend started from THIS terminal.
        $env:GEMINI_API_KEY = $value
        $env:AI_PROVIDER_CODE = 'gemini_online'
        $env:AI_MODEL = $model
        $env:AI_LOCAL_ONLY_ATTESTED = 'false'
        $env:AI_REMOTE_PROCESSING_APPROVED = 'true'
        $env:AITHRON_AI_ENABLED = 'true'
        $env:EDUNEXT_AI_ENABLED = 'true'
        Write-Host 'Configuracion preparada solo para esta terminal. Clave no guardada en archivos.'
        Write-Host 'No se inicio el backend ni se comprobaron Google o PostgreSQL.'
        Write-Host 'Antes de iniciar el backend: verificar base de pruebas y politica institucional.'
        Write-Host 'Cerrar esta terminal descarta su configuracion; no termina procesos ya iniciados.'
    }
    finally {
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        $value = $null
        $secret.Dispose()
    }
}

Set-EdunextGeminiSession
