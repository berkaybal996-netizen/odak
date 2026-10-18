$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$resourcePath = Join-Path $PSScriptRoot '..\resources'
New-Item -ItemType Directory -Path $resourcePath -Force | Out-Null
$bitmap = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)
$shape = New-Object System.Drawing.Drawing2D.GraphicsPath
$shape.AddArc(4, 4, 80, 80, 180, 90)
$shape.AddArc(172, 4, 80, 80, 270, 90)
$shape.AddArc(172, 172, 80, 80, 0, 90)
$shape.AddArc(4, 172, 80, 80, 90, 90)
$shape.CloseFigure()
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#eee7f2'))
$graphics.FillPath($brush, $shape)
$pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#32352f')), 17
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawEllipse($pen, 57, 57, 142, 142)
$graphics.DrawLine($pen, 128, 88, 128, 132)
$graphics.DrawLine($pen, 128, 132, 161, 150)
$pngPath = Join-Path $resourcePath 'icon.png'
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$stream = [System.IO.File]::Create((Join-Path $resourcePath 'icon.ico'))
$writer = New-Object System.IO.BinaryWriter $stream
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
$writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
$writer.Write([uint16]1); $writer.Write([uint16]32)
$writer.Write([uint32]$pngBytes.Length); $writer.Write([uint32]22)
$writer.Write($pngBytes)
$writer.Dispose(); $stream.Dispose(); $pen.Dispose(); $brush.Dispose(); $shape.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
Write-Output 'Odak icon.png ve icon.ico oluşturuldu.'
