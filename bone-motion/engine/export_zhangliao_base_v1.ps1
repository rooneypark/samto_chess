# Format export only: same full-canvas nearest-neighbour conversion for all directions.
# No silhouette fit, individual zoom, body warp, weapon edit, or alpha threshold.
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dest = Join-Path $repoRoot 'bone-motion/art-in/34/base-v1'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
if (Test-Path -LiteralPath (Join-Path $dest 'blade-flip-qa.json')) { throw 'User-corrected side blade exists. Do not overwrite it with the generated source.' }
$generated = 'C:/Users/pms10/.codex/generated_images/01a1edec-e7a8-7b30-a481-c6294875f061'
$files = @{
  front = 'exec-24062dfb-6aa6-48f0-b6a6-4fb282a06b1b.png'
  side = 'exec-ffc1cd17-0896-436b-96c0-27b7820a386f.png'
  back = 'exec-bc41a0b5-52e5-42ef-ad3a-f28306170757.png'
}
foreach ($direction in @('front','side','back')) {
  $source = [System.Drawing.Bitmap]::FromFile((Join-Path $generated $files[$direction]))
  $target = [System.Drawing.Bitmap]::new(256,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.DrawImage($source,[System.Drawing.Rectangle]::new(0,0,256,256),0,0,$source.Width,$source.Height,[System.Drawing.GraphicsUnit]::Pixel)
  $target.Save((Join-Path $dest "$direction.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "$direction $($source.Width)x$($source.Height) -> 256x256"
  $graphics.Dispose(); $target.Dispose(); $source.Dispose()
}
