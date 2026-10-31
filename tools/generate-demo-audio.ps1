# Generación de recursos WAV reales, sin red ni API. Windows + voz Sabina es-MX.
# Ejecutar desde la raíz del repositorio. No se ejecuta en el navegador.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$destination = Join-Path $PSScriptRoot '..\frontend\assets\audio\lessons'
if (-not (Test-Path -LiteralPath $destination)) { throw 'Falta la carpeta de recursos de audio.' }
$manifest = & node --input-type=module -e "import {getCoursesDemo} from './frontend/js/data/courses-demo.data.js'; import {getUnitsDemo} from './frontend/js/data/units-demo.data.js'; const rows=[]; for(const g of [4,5,6]) for(const c of getCoursesDemo(g)) for(const u of getUnitsDemo(c)) for(const l of u.lessons) rows.push({id:l.id,text:l.audio.transcript}); console.log(JSON.stringify(rows));"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo construir el manifiesto de narraciones.' }
$lessons = $manifest | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
 $speaker.SelectVoice('Microsoft Sabina Desktop')
 $speaker.Rate = -1
 $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
 foreach ($lesson in $lessons) {
  $path = Join-Path $destination ($lesson.id + '.wav')
  $speaker.SetOutputToWaveFile($path, $format)
  $speaker.Speak($lesson.text)
  $speaker.SetOutputToNull()
 }
 'Narraciones WAV generadas: ' + $lessons.Count
} finally { $speaker.Dispose() }
