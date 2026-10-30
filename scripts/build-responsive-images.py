"""Create faithful display images without changing any source image or product data."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','products/slime-charms-wholesale/index.html','products/polymer-clay-slices-wholesale/index.html','products/resin-charms-for-slime/index.html','products/sequins-glitter-confetti/index.html']
class Sources(HTMLParser):
 def __init__(self):super().__init__();self.sources=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and a.get('src','').startswith('/assets/'):self.sources.append(a['src'].split('?')[0])
def main():
 usage={}
 for page in PAGES:
  p=Sources();p.feed((ROOT/page).read_text(encoding='utf-8'))
  for src in p.sources:usage.setdefault(src,[]).append(page)
 out=ROOT/'assets/images/responsive-20261030';out.mkdir(exist_ok=True)
 records=[]
 def process(entry):
  src,pages=entry
  source=ROOT/src.lstrip('/');raw=source.read_bytes()
  if 'index.html' not in pages and len(raw)<180000:return None
  with Image.open(source) as original:
   im=ImageOps.exif_transpose(original);w,h=im.size;variants=[];retain=False
   for width in sorted({min(w,360),min(w,640)}):
    height=max(1,round(h*width/w));target=out/(source.stem[:72]+'-'+hashlib.sha256(src.encode()).hexdigest()[:8]+f'-{width}w.webp')
    valid=False
    if target.is_file() and target.stat().st_size:
     try:
      with Image.open(target) as check:check.load();valid=check.size==(width,height)
     except OSError:pass
    if not valid:
     temp=target.with_suffix('.tmp.webp')
     im.resize((width,height),Image.Resampling.LANCZOS).save(temp,'WEBP',quality=88,method=6,exact=True,alpha_quality=100,icc_profile=original.info.get('icc_profile',b''))
     temp.replace(target)
    if target.stat().st_size>=len(raw):
     assert target.resolve().parent==out.resolve();target.unlink();retain=True;continue
    variants.append({'url':'/'+target.relative_to(ROOT).as_posix(),'width':width,'height':height,'bytes':target.stat().st_size})
   if retain:variants.append({'url':src,'width':w,'height':h,'bytes':len(raw)})
   return {'source':src,'sourceBytes':len(raw),'sourceSha256':hashlib.sha256(raw).hexdigest(),'width':w,'height':h,'variants':sorted(variants,key=lambda v:v['width'])}
 with ThreadPoolExecutor(max_workers=4) as pool:records=[r for r in pool.map(process,sorted(usage.items())) if r]
 (ROOT/'docs/responsive-images-20261030.json').write_text(json.dumps({'pages':PAGES,'images':records},indent=2),encoding='utf-8')
 print(json.dumps({'sources':len(records),'originalBytes':sum(r['sourceBytes'] for r in records),'display640Bytes':sum(min(r['variants'],key=lambda v:abs(v['width']-640))['bytes'] for r in records)}))
if __name__=='__main__':main()
