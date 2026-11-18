param([Parameter(Mandatory=$true)][string]$HeroId,[Parameter(Mandatory=$true)][string]$Direction,[Parameter(Mandatory=$true)][string]$SourcePath,[ValidateSet('base-draft-v1','base-draft-v2','base-draft-v3','body-review-v1','body-review-v2')][string]$Variant='base-draft-v1')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if ($HeroId -notmatch '^[a-z0-9]+$' -or $Direction -notin @('front','side','back')) { throw 'Invalid asset identifier' }
$dest = Join-Path $repoRoot ('bone-motion/art-in/' + $HeroId + '/' + $Variant)
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$outputPath=Join-Path $dest ($Direction + '.png')
if (Test-Path -LiteralPath $outputPath) { throw "Existing draft preserved: $outputPath" }
$source = [System.Drawing.Bitmap]::FromFile($SourcePath)
if ($source.Width -ne $source.Height) { $source.Dispose(); throw 'Non-square output needs a new generation; do not distort' }
$target = [System.Drawing.Bitmap]::new(256,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($target)
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.DrawImage($source,[System.Drawing.Rectangle]::new(0,0,256,256),0,0,$source.Width,$source.Height,[System.Drawing.GraphicsUnit]::Pixel)
$target.Save($outputPath,[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$target.Dispose();$source.Dispose()
$count=@('front','side','back' | Where-Object { Test-Path -LiteralPath (Join-Path $dest ($_ + '.png')) }).Count
# Reconcile the shared roster after the batch, avoiding concurrent writes.
Write-Output "$HeroId/$Direction saved256RGBA; $count/3; not rig-approved"
