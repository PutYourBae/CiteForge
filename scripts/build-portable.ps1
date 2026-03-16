# scripts/build-portable.ps1

Write-Host "1. Building Vite & Electron core..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

Write-Host "2. Killing stray Electron processes to unlock ASAR..."
Get-Process | Where-Object {$_.Path -match "CiteForge\.exe" -or $_.Name -match "electron"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "3. Unpacking existing ASAR..."
$appDir = "release\win-unpacked\resources\app_unpacked"
if (Test-Path $appDir) { Remove-Item $appDir -Recurse -Force }
npx asar extract "release\win-unpacked\resources\app.asar" $appDir

Write-Host "4. Patching ASAR with new dist & assets..."
Copy-Item -Path "dist\*" -Destination "$appDir\dist" -Recurse -Force
Copy-Item -Path "dist-electron\*" -Destination "$appDir\dist-electron" -Recurse -Force
if (-not (Test-Path "$appDir\assets")) { New-Item -ItemType Directory -Path "$appDir\assets" | Out-Null }
Copy-Item -Path "assets\*" -Destination "$appDir\assets" -Recurse -Force

Write-Host "5. Repacking ASAR..."
npx asar pack $appDir "release\win-unpacked\resources\app.asar"
Remove-Item -Recurse -Force $appDir

Write-Host "6. Rebuilding Portable ZIP..."
$zipPath = "release\CiteForge-1.0.0-win-portable.zip"
$tempDir = "release\temp_zip_dir"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }

Copy-Item -Path "release\win-unpacked" -Destination $tempDir -Recurse -Force
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

$size = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "✅ Final ZIP rebuilt: $size MB"
