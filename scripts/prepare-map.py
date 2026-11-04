"""Build a compact, pixel-snapped atlas from the upstream March 2026 GIS snapshot.
Download province.geojson files into /tmp/vn-provinces/{1..34}.json first.
Shared borders are extracted from identical source segments before rendering.
"""
import json, math, collections
from pathlib import Path
NAMES=['Hà Nội','Cao Bằng','Tuyên Quang','Lào Cai','Điện Biên','Lai Châu','Sơn La','Thái Nguyên','Lạng Sơn','Quảng Ninh','Phú Thọ','Bắc Ninh','Hải Phòng','Hưng Yên','Ninh Bình','Thanh Hóa','Nghệ An','Hà Tĩnh','Quảng Trị','Huế','Đà Nẵng','Quảng Ngãi','Khánh Hòa','Gia Lai','Đắk Lắk','Lâm Đồng','Tây Ninh','Đồng Nai','Hồ Chí Minh','Vĩnh Long','Đồng Tháp','An Giang','Cần Thơ','Cà Mau']
def project(p):return (round((p[0]-102)*46/2)*2+140,round((23.6-p[1])*48/2)*2+30)
def path(ring,close=False):
 pts=[]
 for p in ring:
  q=project(p)
  if not pts or pts[-1]!=q:pts.append(q)
 if not pts:return ''
 # Deliberate orthogonal steps: shared source segments render identically in either direction.
 out=f'M{pts[0][0]},{pts[0][1]}'
 for a,b in zip(pts,pts[1:]):
  if a[0]!=b[0] and a[1]!=b[1]:
   corner=(b[0],a[1]) if a<b else (a[0],b[1])
   out+=f'L{corner[0]},{corner[1]}'
  out+=f'L{b[0]},{b[1]}'
 return out+('Z' if close else '')
def length(a,b):
 lon1,lat1,lon2,lat2=map(math.radians,(*a,*b)); h=math.sin((lat2-lat1)/2)**2+math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
 return 6371*2*math.asin(min(1,math.sqrt(h)))
edges=collections.defaultdict(set); provinces=[]
for i,name in enumerate(NAMES,1):
 f=json.load(open(f'/tmp/vn-provinces/{i}.json'))['features'][0]; polys=f['geometry']['coordinates']; d=''
 largest=max(polys,key=lambda p:len(p[0]))[0]
 for poly in polys:
  for ring in poly:
   d+=path(ring,True)
   for a,b in zip(ring,ring[1:]):edges[tuple(sorted([tuple(a),tuple(b)]))].add(i)
 x,y=project([sum(p[0] for p in largest)/len(largest),sum(p[1] for p in largest)/len(largest)])
 provinces.append(dict(id=i,name=name,path=d,center=[x,y],region='North' if i<=16 else 'Central' if i<=26 else 'South'))
pairs=collections.defaultdict(list)
for edge,ids in edges.items():
 if len(ids)==2:pairs[tuple(sorted(ids))].append(edge)
borders=[]
for (a,b),segments in pairs.items():
 graph=collections.defaultdict(list)
 for p,q in segments:graph[p].append(q); graph[q].append(p)
 remaining=set(segments); chains=[]
 while remaining:
  start=next((p for p in graph if len(graph[p])==1 and any(tuple(sorted((p,q))) in remaining for q in graph[p])),next(iter(remaining))[0]); chain=[start]
  while True:
   nxt=next((p for p in graph[chain[-1]] if tuple(sorted((chain[-1],p))) in remaining),None)
   if nxt is None:break
   remaining.remove(tuple(sorted((chain[-1],nxt)))); chain.append(nxt)
  chains.append(chain)
 borders.append(dict(id=f'{a}-{b}',a=a,b=b,path=''.join(path(c) for c in chains),km=round(sum(length(*s) for s in segments))))
out=dict(provinces=provinces,borders=borders,source='https://github.com/thanglequoc/vietnamese-provinces-database',snapshot='11 March 2026',effective='1 July 2025')
Path('public/data/vietnam.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(f'{len(provinces)} provinces, {len(borders)} shared borders; {Path("public/data/vietnam.json").stat().st_size:,} bytes')
