"""Import the supplied afternoon batch; update SLM10005 without changing its URL."""
import argparse, copy, hashlib, json, shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--media',type=Path,required=True);args=ap.parse_args()
plans=json.loads((ROOT/'scripts/data/product-plan-20261019-afternoon.json').read_text())
media={m['sku']:m for m in json.loads(args.media.read_text())}
catalog=json.loads((ROOT/'assets/v2/product-catalog.json').read_text())
assert catalog['count']==255
oldby={p['sku']:p for p in catalog['products']}
new=[]; changes=[]
for p in plans:
 if not p['haibu']:continue
 sku=p['sku'];old=oldby.get(sku);m=media[sku]
 title=old['title'] if old else p['title'];typ=old.get('type',p['type']) if old else p['type']
 category=old['category'] if old else p['haibuCategory'];pack=p['packing']+'; custom packing by inquiry'
 paths=list(m['paths']);dims=list(m['dimensions']);extensions=['jpg']*3;labels=p['galleryLabels'][:]
 directory='batch-2026-10-19-afternoon';prefix=p['key']+'-'+p['keywords']
 note=p['galleryNote']+' Props are not included. Packing quantity is not the MOQ.'
 if old:
  assert sku=='SLM10005'
  # Retain five of the existing approved styling photos and replace the overview.
  directory='batch-2026-08';prefix='slm10005-pastel-animal-slime-charms'
  target=ROOT/'assets/images/products'/directory/p['key']/(prefix+'-01.jpg')
  shutil.copy2(paths[0],target)
  paths=[str(target)];dims=dims[:1];extensions=['jpg'];labels=['updated supplied assortment reference']
  for i,entry in enumerate(old['gallery'][1:],2):
   rel=entry if isinstance(entry,str) else entry['src'];source=ROOT/rel.lstrip('/');ext=source.suffix.lstrip('.')
   target=source
   with Image.open(target) as im:w,h=im.size
   paths.append(str(target));dims.append(dict(width=w,height=h));extensions.append(ext);labels.append('previously supplied styling reference '+str(i))
  assert len(paths)==6
  shutil.rmtree(Path(m['paths'][0]).parent)
  note='Image 1 shows the updated supplied assortment. Images 2–6 retain earlier styling references. Confirm the current component mix and quantities by inquiry. Props are not included.'
 record=dict(sku=sku,title=title,originalTitle=p['sourceFields']['标题'],type=typ,categorySlug=category,imageAlt=title+', product code '+sku,
 description=p['description'],detailedDescription=p['description']+' '+p['factNote']+' Send the full product code, selected designs, quantity, packing requirements and destination for quotation.',
 seasonalTheme='Wholesale decorative craft components',keySellingPoints=[title,'Material: '+p['material'],'Dimensions: '+p['dimensions'],'Standard packing: '+pack,'Attachment: '+p['attachment']],
 specificationLines=['Product code: '+sku,'Material: '+p['material'],'Dimensions: '+p['dimensions'],'Hole: '+p['attachment'],'Standard pack: '+pack,'Selection note: '+p['factNote'],'MOQ and dispatch date: Confirm by quotation'],
 material=p['material'],dimensions=p['dimensions'],sourcePacking=pack,
 customizationOptions='Discuss selected designs, assortment and packaging with HAIBU. Confirm custom development requirements against your brief and quotation.',
 recommendedApplications=p['uses'],packagingMoq='Source packing: '+pack+'. This pack quantity is not the MOQ. Confirm minimum order quantity, current availability and lead time by quotation.',
 seoKeywords=p['keywords'].replace('-',' ')+', wholesale craft components',metaTitle=p['metaTitle'].replace('Qula Craft','HAIBUCRAFT'),metaDescription=p['description'],
 structuredSpecifications=True,sourceWorkbook='10.11(20261019-085415).xlsx',sourceFields=p['sourceFields'],sourceRow=p['sourceRow'],assetKey=p['key'],assetDirectory=directory,
 imagePrefix=prefix,imageExtensions=extensions,imageDimensions=dims,preserveImageRatio=True,galleryOrder=list(range(1,len(paths)+1)),
 galleryLabels=labels,galleryNote=note,mediaLabel='Product reference and buying details',factsUpdatedAt='2026-10-19',holeDescription=p['attachment'],preserveApprovedContent=True)
 if old:
  file=ROOT/'scripts/data/issue-12-slime-products.json';data=json.loads(file.read_text());previous=next(r for r in data['products'] if r['sku']==sku)
  assert previous['title']==title
  record['customizationOptions']+=' Mixed-SKU and private-label packaging review is available by inquiry.'
  previous.update(record);file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 else:new.append(record)
 changes.append(dict(sku=sku,operation='update' if old else 'new',sourceRow=p['sourceRow'],sourceFields=p['sourceFields'],sourceReferences=p['sourceReferences'],previousCatalog=old,imageOutputs=[dict(path='/'+str(Path(f).relative_to(ROOT)),**dims[i],sha256=hashlib.sha256(Path(f).read_bytes()).hexdigest()) for i,f in enumerate(paths)]))
assert len(new)==18 and len(changes)==19
batch=dict(batch='haibu-new-products-20261019-afternoon',expectedSkuCount=18,publicGalleryCount=3,assetDirectory='batch-2026-10-19-afternoon',imageExtension='jpg',structuredDataImageMode='gallery',lastModified='2026-10-19',preserveApprovedContent=True,prependProducts=True,packingOptions=[],products=new)
(ROOT/'scripts/data/haibu-new-products-20261019-afternoon.json').write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
manifest=dict(batchId='haibu-products-20261019-afternoon',catalogCountBefore=255,catalogCountAfter=273,newProductCount=18,updatedProductCount=1,previousProducts=copy.deepcopy(catalog['products']),products=changes)
(ROOT/'docs/tasks/haibu-new-products-20261019-afternoon-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'new':18,'updates':1,'catalog':273,'newImages':60}))
