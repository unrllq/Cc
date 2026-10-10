from fontTools.ttLib import TTFont
from fontTools.merge import Merger
import sys,os
specs=[("oswald",700),("unbounded",900),("unbounded",600),("jetbrains-mono",500),("jetbrains-mono",800),("dela-gothic-one",400),("press-start-2p",400),("rubik-mono-one",400)]
for fam,w in specs:
    parts=[]
    for sub in ["latin","cyrillic"]:
        src=f"npmf/{fam}/files/{fam}-{sub}-{w}-normal.woff2"
        if not os.path.exists(src): print("missing",src); continue
        f=TTFont(src); f.flavor=None; out=f"fonts/_{fam}-{sub}-{w}.ttf"; f.save(out); parts.append(out)
    try:
        m=Merger().merge(parts); m.save(f"fonts/{fam}-{w}.ttf"); print("ok",fam,w)
    except Exception as e:
        print("merge fail",fam,w,e)
