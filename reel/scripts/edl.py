import json
W=json.load(open('words_raw.json'))
fix={'всетаки':'всё-таки','мое':'моё','фитбэк':'фидбэк','германии':'Германии'}
for w in W: w['w']=fix.get(w['w'],w['w'])
# merge "какое то"
for i,w in enumerate(W):
    if w['w']=='какое' and W[i+1]['w']=='то': w['w']='какое-то'; w['e']=W[i+1]['e']; W[i+1]['del']=True
W=[w for w in W if not w.get('del')]
LEAD,TAIL=0.10,0.16
ranges=[]; cs=W[0]['s']-0.25
for i in range(len(W)-1):
    e=W[i]['e']-0.1+TAIL; s=W[i+1]['s']-LEAD
    if s-e>0.30:
        ranges.append([cs,e]); cs=s
ranges.append([cs,W[-1]['e']+0.35])
# map times
def m(t):
    o=0
    for a,b in ranges:
        if t<a: return o
        if t<=b: return o+t-a
        o+=b-a
    return o
for w in W: w['os']=round(m(w['s']),3); w['oe']=round(m(min(w['e'],w['e'])),3)
out_cuts=[]; o=0
for a,b in ranges: out_cuts.append(round(o,3)); o+=b-a
json.dump({'ranges':ranges,'cuts':out_cuts,'dur':o,'words':W},open('edl.json','w'),ensure_ascii=False,indent=0)
print('dur',round(o,2),'cuts',len(ranges))
print(' '.join(f"{i}:{w['w']}@{w['os']:.2f}" for i,w in enumerate(W)))
print(out_cuts)
