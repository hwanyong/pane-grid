import json,collections,sys
T='/Users/uhd/.claude/jobs/2d2d4469/tmp/'
res=json.load(open(T+'journal-results.json'))
rows=[];hunks=[]
for o in res:
  r=o['result']
  if isinstance(r,str):
    try: r=json.loads(r)
    except Exception: print('STR',str(o['key'])[:60]); continue
  rows+=r.get('rows',[]); hunks+=r.get('hunks',[])
  print('==',str(o['key'])[:60], '| rows',len(r.get('rows',[])),'hunks',len(r.get('hunks',[])))
  print('  C:',r['conclusion'][:900])
  for x in r.get('openDecisions',[]): print('  OD:',x[:500])
json.dump({'rows':rows,'hunks':hunks},open(T+'wf.json','w'),ensure_ascii=False,indent=1)
print(len(rows), collections.Counter(r['verdict'] for r in rows))
