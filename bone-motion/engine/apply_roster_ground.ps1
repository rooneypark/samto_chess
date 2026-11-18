$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @("System.Drawing.Common", "System.Drawing.Primitives", "System.Private.Windows.GdiPlus", "System.Private.Windows.Core") -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
public static class GroundPixels {
 public static int Apply(string input,string output,int dx,int dy) {
  using(var src=new Bitmap(input)) {
   int w=src.Width,h=src.Height,wrapped=0;
   if(!File.Exists(output)) using(var dst=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
    for(int y=0;y<h;y++) for(int x=0;x<w;x++) {
     var p=src.GetPixel(x,y);int tx=x+dx,ty=y+dy;
     if((tx<0||tx>=w||ty<0||ty>=h)&&p.A>1) throw new Exception("Visible clipping");
     dst.SetPixel((tx+w)%w,(ty+h)%h,p);
    }
    dst.Save(output,ImageFormat.Png);
   }
   using(var check=new Bitmap(output)) {
    if(check.Width!=w||check.Height!=h) throw new Exception("Size mismatch");
    for(int y=0;y<h;y++) for(int x=0;x<w;x++) {
     var p=src.GetPixel(x,y);int tx=x+dx,ty=y+dy;
     if(tx<0||tx>=w||ty<0||ty>=h) {if(p.A>1) throw new Exception("Visible clipping");if(p.A==1)wrapped++;}
     if(p.ToArgb()!=check.GetPixel((tx+w)%w,(ty+h)%h).ToArgb())throw new Exception("RGBA mismatch");
    }
   }
   return wrapped;
  }
 }
}
"@

$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$plan=Get-Content -Raw -LiteralPath (Join-Path $root 'bone-motion/out/ground-audit/plan.json') | ConvertFrom-Json
$results=@()
foreach($r in $plan){
 $srcPath=Join-Path $root $r.path
 $dir=Join-Path $root ('bone-motion/art-in/'+$r.id+'/base-final-v1')
 New-Item -ItemType Directory -Force -Path $dir | Out-Null
 $outPath=Join-Path $dir ($r.view+'.png')

 $dx=[int]$r.offset[0];$dy=[int]$r.offset[1]
 $wrapped=[GroundPixels]::Apply($srcPath,$outPath,$dx,$dy)
 $record=[ordered]@{id=$r.id;view=$r.view;source=$r.path;source_sha256=(Get-FileHash -LiteralPath $srcPath).Hash;path=('bone-motion/art-in/'+$r.id+'/base-final-v1/'+$r.view+'.png');size=$r.size;offset=$r.offset;foot_roi=$r.roi;source_foot_y=$r.foot_bottom;target_foot_y=[Math]::Round(224*$r.scale);pivot=@([Math]::Round(128*$r.scale),[Math]::Round(224*$r.scale));logical_pivot=@(128,224);source_foot_center=$r.foot_center;pixel_match=$true;visible_clipped_pixels=0;preserved_wrapped_alpha1_speckles=$wrapped;sha256=(Get-FileHash -LiteralPath $outPath).Hash;approval='user-approved-2026-11-18';scope='standing artwork and ground alignment only; full rig/motion verification separate'}
 $meta=Join-Path (Split-Path $srcPath) ($r.view+'-generation.json')
 if(Test-Path -LiteralPath $meta){$record['generation_provenance']=Get-Content -LiteralPath $meta -Raw | ConvertFrom-Json}
 $record | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $dir ($r.view+'-alignment.json')) -Encoding utf8
 $results+=$record
}
@{status='user-approved';method='Integer PNG translation without scaling/resampling. Alpha=1 background speckles crossing the canvas border wrap to retain every RGBA pixel; all alpha>1 content stays in bounds.';views=$results} | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $root 'bone-motion/art-in/roster-49-v1/ground-alignment.json') -Encoding utf8
Write-Output ('Verified '+$results.Count+' PNGs; exact RGBA bijection, no visible clipping')
