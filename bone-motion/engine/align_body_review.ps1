param([string]$Variant='body-review-v1')
$ErrorActionPreference='Stop'
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$code=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'apply_roster_ground.ps1') -Raw
Invoke-Expression ($code.Substring(0,$code.IndexOf('$root=Split-Path')).Replace('p.A>1','p.A>127').Replace('p.A==1','p.A>0'))
$ids=@('0','119','xuhuang','xunyu','machao','sunquan','ganning','taishici','sunshangxiang','diaochan')
foreach($id in $ids){foreach($view in @('side','back')){
 $dir=Join-Path $root ('bone-motion/art-in/'+$id+'/'+$Variant);$srcPath=Join-Path $dir ($view+'.png');$outPath=Join-Path $dir ('aligned-'+$view+'.png')
 if(!(Test-Path -LiteralPath $srcPath) -or (Test-Path -LiteralPath $outPath)){continue}
 $src=[System.Drawing.Bitmap]::FromFile($srcPath);$lo=100;$hi=166
 if($id -in @('119','machao') -and $view -eq 'side'){$lo=75;$hi=185}
 $bottom=0;for($y=160;$y -lt 256;$y++){for($x=$lo;$x -lt $hi;$x++){if($src.GetPixel($x,$y).A -ge 128){$bottom=[Math]::Max($bottom,$y+1)}}}
 $left=256;$right=0
 for($y=$bottom-3;$y -lt $bottom;$y++){for($x=$lo;$x -lt $hi;$x++){if($src.GetPixel($x,$y).A -ge 128){$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x+1)}}}
 $dx=[int][Math]::Floor(128-($left+$right)/2.0+0.5);$dy=224-$bottom;$src.Dispose()
 $wrapped=[GroundPixels]::Apply($srcPath,$outPath,$dx,$dy)
 @{source=$view+'.png';offset=@($dx,$dy);foot=@(128,224);pixelPreserved=$true;wrappedAlpha1=$wrapped;status='body-review-pending';sha256=(Get-FileHash $outPath).Hash} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dir ('aligned-'+$view+'.json')) -Encoding utf8
 Write-Output "$id/$view aligned ($dx,$dy)"
}}
