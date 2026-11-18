$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$base = Join-Path $repoRoot 'bone-motion/art-in/0'
$dest = Join-Path $base 'base-draft-v4'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$results = @()
foreach ($entry in @(@{View='front';X=0;Y=0},@{View='side';X=2;Y=9},@{View='back';X=1;Y=3})) {
    $srcPath = Join-Path $base ('base-draft-v1/' + $entry.View + '.png')
    $outPath = Join-Path $dest ($entry.View + '.png')
    if (Test-Path -LiteralPath $outPath) { throw "Preserve existing: $outPath" }
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    if ($src.Width -ne 256 -or $src.Height -ne 256) { throw 'Expected 256 square' }
    $dst = [System.Drawing.Bitmap]::new(256,256,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y=0;$y -lt 256;$y++) { for ($x=0;$x -lt 256;$x++) {
        $p=$src.GetPixel($x,$y); $tx=$x+$entry.X; $ty=$y+$entry.Y
        if ($tx -ge 0 -and $tx -lt 256 -and $ty -ge 0 -and $ty -lt 256) {
            $dst.SetPixel($tx,$ty,$p)
        } elseif ($p.A -ne 0) { throw 'Would clip nontransparent source pixel' }
    }}
    $dst.Save($outPath,[System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    $check=[System.Drawing.Bitmap]::FromFile($outPath)
    $bottom=0; $left=256; $right=0; $count=0
    for ($y=0;$y -lt 256;$y++) { for ($x=0;$x -lt 256;$x++) {
        $p=$check.GetPixel($x,$y)
        if ($p.A -ge 128) { $bottom=[Math]::Max($bottom,$y+1) }
        if ($p.A -gt 0) {
            $sx=$x-$entry.X; $sy=$y-$entry.Y
            if ($sx -lt 0 -or $sy -lt 0 -or $src.GetPixel($sx,$sy).ToArgb() -ne $p.ToArgb()) { throw 'Pixel mismatch' }
            $count++
        }
    }}
    for ($y=$bottom-4;$y -lt $bottom;$y++) { for ($x=0;$x -lt 256;$x++) {
        if ($check.GetPixel($x,$y).A -ge 128) { $left=[Math]::Min($left,$x); $right=[Math]::Max($right,$x+1) }
    }}
    if ($bottom -ne 224 -or [Math]::Abs(($left+$right)/2.0-128) -gt 0.5) { throw 'Ground pivot failed' }
    $results += @{view=$entry.View;source='base-draft-v1/'+$entry.View+'.png';offset=@($entry.X,$entry.Y);canvas=@(256,256);pivot=@(128,224);visible_sole_y=$bottom;sole_center_x=($left+$right)/2.0;preserved_nontransparent_pixels=$count;pixel_match=$true;clipped_pixels=0;sha256=(Get-FileHash -LiteralPath $outPath -Algorithm SHA256).Hash}
    $check.Dispose();$src.Dispose()
}
@{method='Lossless integer PNG canvas translation; no generation, scaling or resampling';visible_sole_definition='alpha >=128; bottom edge coordinate; center of bottom four rows';status='ground-alignment-verified; full rig review pending';views=$results} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $dest 'alignment.json') -Encoding utf8
$results | ConvertTo-Json -Depth 5
