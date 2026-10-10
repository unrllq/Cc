import json
d=json.load(open('giga.json')); W=[]
for s in d:
    cur=None
    for ch,t in zip(s['tokens'],s['ts']):
        if ch==' ':
            if cur: W.append(cur); cur=None
            continue
        if cur is None: cur={'w':'','s':t,'e':t}
        cur['w']+=ch; cur['e']=t
    if cur: W.append(cur)
    W[-1]['seg_end']=True
for w in W: w['e']+=0.1
for i,w in enumerate(W): print(i,w['w'],round(w['s'],2),round(w['e'],2))
json.dump(W,open('words_raw.json','w'),ensure_ascii=False)
