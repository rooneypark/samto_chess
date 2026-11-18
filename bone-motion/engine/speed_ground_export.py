from pathlib import Path
p=Path('bone-motion/engine/apply_roster_ground.ps1');s=p.read_text(encoding='utf-8-sig')
start=s.index(' $src=[System.Drawing.Bitmap]');end=s.index(' $record=[ordered]',start)
s=s[:start]+''' $dx=[int]$r.offset[0];$dy=[int]$r.offset[1]
 $wrapped=[GroundPixels]::Apply($srcPath,$outPath,$dx,$dy)
'''+s[end:]
s=s.replace(' if(Test-Path -LiteralPath $outPath){throw "Already exists $outPath"}','')
s=s.replace('$results+=$record;$check.Dispose();$src.Dispose()','$results+=$record')
s=s.replace("Add-Type -AssemblyName System.Drawing",'''Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common -TypeDefinition @"
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
''')
p.write_text(s,encoding='utf8')
