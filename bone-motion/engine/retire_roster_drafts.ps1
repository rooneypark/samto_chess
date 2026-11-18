$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Split-Path (Split-Path $PSScriptRoot -Parent) -Parent))
$artRoot=Join-Path $root 'bone-motion/art-in'
$delivery=Join-Path $root 'art-source/characters/v1'
$gallery=Join-Path $artRoot 'roster-49-v1'
$progress=Get-Content -LiteralPath (Join-Path $gallery 'progress.json') -Raw | ConvertFrom-Json
if($progress.views -ne 147 -or $progress.format_issues.Count -ne 0){throw 'Delivery incomplete'}
$targets=[Collections.Generic.List[string]]::new()
$oldRecords=@{}
foreach($r in $progress.records){
 if($r.id -notmatch '^[a-z0-9]+$'){throw 'Invalid hero ID'}
 foreach($v in @('front','side','back')){
  $f=Join-Path $root $r.views.$v.path
  if((Get-FileHash -LiteralPath $f).Hash.ToLower() -ne $r.views.$v.sha256){throw 'Hash changed'}
 }
 $hero=Join-Path $artRoot $r.id
 Get-ChildItem -LiteralPath $hero -Directory | Where-Object { ($_.Name -like 'base-*' -or $_.Name -like 'body-review-*') -and $_.Name -ne 'base-final-v1' } | ForEach-Object {$targets.Add($_.FullName)}
 $old=Join-Path $delivery $r.id
 if(Test-Path -LiteralPath $old){
  $manifest=Join-Path $old 'manifest.json'
  if(Test-Path -LiteralPath $manifest){$oldRecords[$r.id]=Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json}
  $targets.Add($old)
 }
}
foreach($rel in @('bone-motion/art-in/review-5v5-v1','bone-motion/out/guanyu-base-v2-guides','bone-motion/out/zhangliao-base-v2-guides','bone-motion/out/base-art-measurement-20261118')){
 $p=Join-Path $root $rel;if(Test-Path -LiteralPath $p){$targets.Add($p)}
}
# Resolve and validate every target before any recursive deletion.
$resolved=@($targets | ForEach-Object {(Resolve-Path -LiteralPath $_).Path})
foreach($p in $resolved){
 $full=[IO.Path]::GetFullPath($p)
 if(!$full.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw "Outside workspace: $full"}
 if($full -match 'base-final-v1|pixellab|art-source[\\/]motions|game[\\/]assets'){throw "Protected target: $full"}
}
$deleted=@()
foreach($p in $resolved){
 $files=@(Get-ChildItem -LiteralPath $p -File -Recurse)
 $deleted+=@{path=$p.Substring($root.Length+1).Replace('\','/');files=$files.Count;pngs=@($files|Where-Object Extension -eq '.png').Count}
 Remove-Item -LiteralPath $p -Recurse -Force
}
$newHeroes=@()
foreach($r in $progress.records){
 $dir=Join-Path $delivery $r.id;New-Item -ItemType Directory -Force -Path $dir | Out-Null
 $dirs=@{}
 foreach($v in @('front','side','back')){
  $source=Join-Path $root $r.views.$v.path
  # Compatibility paths point to the same current file, never a stale copied sprite.
  foreach($link in @((Join-Path $dir ($v+'.png')),(Join-Path (Join-Path $artRoot $r.id) ($v+'.png')))){
   if(Test-Path -LiteralPath $link){Remove-Item -LiteralPath $link -Force}
   New-Item -ItemType HardLink -Path $link -Target $source | Out-Null
  }
  $meta=Get-Content -LiteralPath ([IO.Path]::Combine([IO.Path]::GetDirectoryName($source),$v+'-alignment.json')) -Raw | ConvertFrom-Json
  $dirs[$v]=@{path=$r.views.$v.path;canvas=$r.views.$v.size;foot=$meta.pivot;sha256=$r.views.$v.sha256}
 }
 $h=@{id=$r.id;name=$r.name;artRevision='ground-body-v1';folder=$r.id;status=$r.status;directions=$dirs;logicalFoot=@(128,224);runtimeApplied=$false;motionComplete=$false;sideFacing='left';right='mirror-side'}
 if($oldRecords.ContainsKey($r.id)){$h.faction=$oldRecords[$r.id].faction}
 $h | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $dir 'manifest.json') -Encoding utf8
 $newHeroes+=$h
}
foreach($name in @('lineup-back.png','lineup-side.png','style-reference.png','qa-report.json','display-scale.json')){
 $p=Join-Path $delivery $name;if(Test-Path -LiteralPath $p){Remove-Item -LiteralPath $p -Force}
}
@{schemaVersion=3;artRevision='ground-body-v1';count=49;images=147;logicalFoot=@(128,224);nativeResolutionException='Zhang Fei retains original 1254px pixels';characters=$newHeroes;runtimeApplied=$false;motionComplete=$false} | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $delivery 'manifest.json') -Encoding utf8
'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../../../bone-motion/art-in/roster-49-v1/index.html"><a href="../../../bone-motion/art-in/roster-49-v1/index.html">현재 49장수 원화 비교판</a>' | Set-Content -LiteralPath (Join-Path $delivery 'index.html') -Encoding utf8
@{reason='User requested retirement of previous 49-hero artwork and drafts; current set verified before removal';deleted=$deleted;current='bone-motion/art-in/<id>/base-final-v1';compatibility='art-in/<id> and art-source/characters/v1/<id> PNG paths are hardlinks to current canonical files';motionsAndGameAssetsPreserved=$true} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $gallery 'retired-drafts.json') -Encoding utf8
Write-Output ('Retired '+$deleted.Count+' old directories; current 147 PNGs linked; motions and game assets preserved')
