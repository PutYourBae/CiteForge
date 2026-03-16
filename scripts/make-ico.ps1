# Script to create a proper multi-size Windows .ico file
# from an existing .ico or .png file
# Usage: powershell -ExecutionPolicy Bypass -File scripts/make-ico.ps1

Add-Type -AssemblyName System.Drawing

$InputPath  = "D:\Dev\CiteForge\assets\icon.ico"
$OutputPath = "D:\Dev\CiteForge\assets\icon.ico"
$Sizes      = @(16, 24, 32, 48, 64, 128, 256)

# Load source image
$source = $null
try {
    $source = [System.Drawing.Image]::FromFile($InputPath)
    Write-Host "Loaded source: $($source.Width)x$($source.Height)"
} catch {
    Write-Error "Failed to load $InputPath : $_"
    exit 1
}

# Helper: write a DWORD (4 bytes, little-endian)
function Write-DWORD([System.IO.BinaryWriter]$w, [uint32]$v) {
    $w.Write([byte]($v -band 0xFF))
    $w.Write([byte](($v -shr 8) -band 0xFF))
    $w.Write([byte](($v -shr 16) -band 0xFF))
    $w.Write([byte](($v -shr 24) -band 0xFF))
}

# Helper: write a WORD (2 bytes, little-endian)
function Write-WORD([System.IO.BinaryWriter]$w, [uint16]$v) {
    $w.Write([byte]($v -band 0xFF))
    $w.Write([byte](($v -shr 8) -band 0xFF))
}

# Generate PNG bytes for each size
$pngList = @()
foreach ($size in $Sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($source, 0, 0, $size, $size)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    $pngList += @{ Size = $size; Data = $ms.ToArray() }
    $ms.Dispose()
    Write-Host "  Generated ${size}x${size} ($(${pngList}[-1].Data.Length) bytes)"
}

$source.Dispose()

# Build ICO file structure
$count    = $pngList.Count
$dirSize  = 6 + $count * 16   # ICONDIR + ICONDIRENTRY * n
$offset   = $dirSize

$outStream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create)
$writer    = New-Object System.IO.BinaryWriter($outStream)

# ICONDIR header
Write-WORD  $writer 0           # reserved
Write-WORD  $writer 1           # type = ICO
Write-WORD  $writer $count      # number of images

# ICONDIRENTRY entries
foreach ($entry in $pngList) {
    $sz = [uint32]$entry.Size
    $szByte = if ($sz -eq 256) { [byte]0 } else { [byte]$sz }
    $writer.Write($szByte)   # width  (0 = 256)
    $writer.Write($szByte)   # height (0 = 256)
    $writer.Write([byte]0)    # color count (0 = more than 256)
    $writer.Write([byte]0)    # reserved
    Write-WORD  $writer 1     # planes
    Write-WORD  $writer 32    # bit count
    Write-DWORD $writer ([uint32]$entry.Data.Length)  # bytes in res
    Write-DWORD $writer ([uint32]$offset)             # offset to data
    $offset += $entry.Data.Length
}

# Write actual PNG data for each size
foreach ($entry in $pngList) {
    $writer.Write($entry.Data)
}

$writer.Close()
$outStream.Close()

$finalSize = [math]::Round((Get-Item $OutputPath).Length / 1KB, 1)
Write-Host ""
Write-Host "✅ Created multi-size ICO: $OutputPath ($finalSize KB)"
Write-Host "   Sizes: $($Sizes -join ', ')px"
