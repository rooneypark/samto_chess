from pathlib import Path
import json
p=Path('bone-motion/art-in/roster-49-v1/body-review.json')
ids=['0','119','xuhuang','xunyu','machao','sunquan','ganning','taishici','sunshangxiang','diaochan']
p.write_text(json.dumps({'status':'in-progress','reason':'User identified body scale differences after ground alignment; prior ground check is not a body consistency pass.','ids':ids,'selected':{}},ensure_ascii=False,indent=2),encoding='utf8')
