$ErrorActionPreference = 'Stop'
$projectPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packageInfo = Get-Content -LiteralPath (Join-Path $projectPath 'package.json') -Raw | ConvertFrom-Json
$outputPath = Join-Path $projectPath $packageInfo.build.directories.output
$exePath = [System.IO.Path]::GetFullPath((Join-Path $outputPath 'win-unpacked\Odak.exe'))
$releasePattern = '^' + [regex]::Escape((Join-Path $projectPath 'release')) + '\\(?:\d+\.\d+\.\d+\\)?win-unpacked\\Odak\.exe$'
if (-not (Test-Path -LiteralPath $exePath)) { throw 'Önce Windows uygulamasını paketlemelisin.' }
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath 'Odak.lnk'
$shortcutShell = New-Object -ComObject WScript.Shell
if (Test-Path -LiteralPath $shortcutPath) {
  $previousShortcut = $shortcutShell.CreateShortcut($shortcutPath)
  $ownedShortcut = [regex]::IsMatch($previousShortcut.TargetPath, $releasePattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($previousShortcut.TargetPath -ne $exePath -and -not $ownedShortcut) {
    $shortcutPath = Join-Path $desktopPath 'Odak - Ders Sayaci.lnk'
    if (Test-Path -LiteralPath $shortcutPath) { throw 'Bu isimde bir kısayol zaten var; üzerine yazılmadı.' }
  }
}
$shortcut = $shortcutShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = Split-Path $exePath
$shortcut.Description = 'Odak - BAL ders calisma sayaci ve gunluk kayitlar'
$shortcut.IconLocation = (Join-Path $projectPath 'resources\icon.ico') + ',0'
$shortcut.Save()
$verifiedShortcut = $shortcutShell.CreateShortcut($shortcutPath)
if ($verifiedShortcut.TargetPath -ne $exePath) { throw 'Kısayol doğrulanamadı.' }
Write-Output $shortcutPath
