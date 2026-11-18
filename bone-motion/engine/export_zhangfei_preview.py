"""Export isolated large-spear preview; no change to shared families or GUARD."""
import json
from pathlib import Path
from overview import solve
from export import primitives
import samto_motion as sm

def main():
    out = {'weaponLength':163.4,'bladeLength':55.1,'sideOffset':32,'clips':{}}
    for cid in ['idle','move','a1','a2','a3','s1']:
        _,clip,rig,frames=solve('foot_spear',cid)
        views={}
        for view,_ in sm.VIEWS:
            drawn=[]
            for original in frames:
                j=dict(original)
                axis=sm.unit(sm.sub(j['spear_tip'],j['spear_butt']))
                j['spear_tip']=sm.add(j['spear_butt'],sm.mul(axis,163.4))
                j['spear_collar']=sm.add(j['spear_butt'],sm.mul(axis,108.3))
                drawn.append(primitives(rig,j,view))
            views[view]=drawn
        out['clips'][cid]=views
    path=Path(sm.WORK)/'sim/zhangfei-preview.js'
    path.write_text('window.ZHANGFEI_PREVIEW = '+json.dumps(out,separators=(',',':'))+';\n',encoding='utf-8')
    print(path)

if __name__=='__main__': main()
