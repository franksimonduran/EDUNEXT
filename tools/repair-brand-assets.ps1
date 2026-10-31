$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$images = Join-Path $root 'frontend/assets/images'
$branding = Join-Path $images 'branding'
$source = Join-Path $images 'Icono.png'
$bytes = [IO.File]::ReadAllBytes($source)
$base64 = [Convert]::ToBase64String($bytes)
$bitmap = [Drawing.Image]::FromFile($source)
try {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1280 1280"><image width="1280" height="1280" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,' + $base64 + '"/></svg>'
    $mark = Join-Path $branding 'mark.svg'
    if (Test-Path $mark) { throw 'mark.svg already exists; refusing to overwrite.' }
    [IO.File]::WriteAllText($mark, $svg, [Text.UTF8Encoding]::new($false))
    foreach ($size in @(192, 512)) {
        $target = Join-Path $branding "edunext-$size.png"
        if (Test-Path $target) { throw "$target already exists; refusing to overwrite." }
        $canvas = [Drawing.Bitmap]::new($size, $size)
        $graphics = [Drawing.Graphics]::FromImage($canvas)
        try {
            $graphics.Clear([Drawing.Color]::Transparent)
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $ratio = [Math]::Min($size / $bitmap.Width, $size / $bitmap.Height)
            $width = [int]($bitmap.Width * $ratio)
            $height = [int]($bitmap.Height * $ratio)
            $graphics.DrawImage($bitmap, [int](($size-$width)/2), [int](($size-$height)/2), $width, $height)
            $canvas.Save($target, [Drawing.Imaging.ImageFormat]::Png)
        } finally { $graphics.Dispose(); $canvas.Dispose() }
    }
} finally { $bitmap.Dispose() }
