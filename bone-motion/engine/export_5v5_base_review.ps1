Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$batch = Get-Content -LiteralPath (Join-Path $repoRoot 'bone-motion/art-in/review-5v5-v1/final-sources.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$footPlacement = @{
  '1' = @(-3,1,1); '15' = @(1,7,3); '16' = @(9,9,17); '35' = @(13,12,12)
  '32' = @(5,5,5); '33' = @(10,4,10); 'xuchu' = @(3,7,3); 'simayi' = @(4,3,3)
}
foreach ($hero in $batch.heroes) {
  $dest = Join-Path $repoRoot ('bone-motion/art-in/' + $hero.id + '/base-review-v1')
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  foreach ($dir in @('front','side','back')) {
    $inputPath = $hero.views.$dir.source
    $source = [System.Drawing.Bitmap]::FromFile($inputPath)
    if ($source.Width -ne $source.Height) { throw "Non-square source: $inputPath" }
    $target = [System.Drawing.Bitmap]::new(256,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $dirIndex = [array]::IndexOf(@('front','side','back'),$dir)
    $offsetY = $footPlacement.([string]$hero.id)[$dirIndex]
    # Canvas registration only: identical 256px full-canvas scale, integer Y placement.
    # No per-silhouette fit, body/weapon reshaping, or alpha cleanup.
    $graphics.DrawImage($source,[System.Drawing.Rectangle]::new(0,$offsetY,256,256),0,0,$source.Width,$source.Height,[System.Drawing.GraphicsUnit]::Pixel)
    $target.Save((Join-Path $dest "$dir.png"),[System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "$($hero.id)/$dir full-canvas scale -> 256x256, canvas Y placement $offsetY"
    $graphics.Dispose(); $target.Dispose(); $source.Dispose()
  }
}
