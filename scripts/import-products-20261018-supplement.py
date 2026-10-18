"""Prepare the owner-supplied October 18 supplement from the current catalog.

Run after preparing brand-specific media. Existing SKU titles and URLs are kept.
The source workbook is read-only. The manifest retains all prior catalog records.
"""
import argparse, hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument('--media',type=Path,required=True)
args=ap.parse_args()
plans=json.loads((ROOT/'scripts/data/product-plan-20261018-supplement.json').read_text())
media={m['sku']:m for m in json.loads(args.media.read_text())}
catalog=json.loads((ROOT/'assets/v2/product-catalog.json').read_text())
assert catalog['count']==209
oldby={p['sku']:p for p in catalog['products']}
new=[]
changes=[]
batchfiles=[p for p in (ROOT/'scripts/data').glob('*.json') if p.name!='product-plan-20261018-supplement.json']
batches={}
for file in batchfiles:
 try: data=json.loads(file.read_text())
 except: continue
 if isinstance(data,dict) and isinstance(data.get('products'),list) and all(isinstance(p,dict) and 'sku' in p for p in data['products']):batches[file]=data
for p in plans:
 if not p['haibu']:continue
 sku=p['sku'];old=oldby.get(sku);m=media[sku]
 title=old['title'] if old else p['title']
 typ=old['type'] if old else p['type']
 category=old['category'] if old else {'plastic-sequins':'sequins-glitter-confetti'}.get(p['category'],p['category'])
 hole='No hole specified; confirm attachment method'
 pack=p['packing']+'; custom packing by inquiry'
 record=dict(sku=sku,title=title,originalTitle=p['sourceFields']['标题'],type=typ,categorySlug=category,imageAlt=title+', product code '+sku,
 description=p['description'],detailedDescription=p['description']+' '+p['factNote']+' Send the full product code, selected designs, quantity, packing requirements and destination for quotation.',
 seasonalTheme='Wholesale decorative craft components',keySellingPoints=[title,'Material: '+p['sourceFields']['材质'],'Dimensions: '+p['dimensions'],'Standard packing: '+pack,'Attachment: '+hole],
 specificationLines=['Product code: '+sku,'Material: '+p['sourceFields']['材质'],'Dimensions: '+p['dimensions'],'Hole: '+hole,'Standard pack: '+pack,'Selection note: '+p['factNote'],'MOQ and dispatch date: Confirm by quotation'],
 material=p['sourceFields']['材质'],dimensions=p['dimensions'],sourcePacking=pack,
 customizationOptions='Discuss selected designs, assortment and packaging with HAIBU. Confirm custom development requirements against your brief and quotation.',
 recommendedApplications=p['uses'],packagingMoq='Source packing: '+pack+'. This pack quantity is not the MOQ. Confirm minimum order quantity, current availability and lead time by quotation.',
 seoKeywords=p['keywords'].replace('-',' ')+', wholesale craft components',metaTitle=p['metaTitle'].replace('Qula Craft','HAIBUCRAFT'),metaDescription=p['description'],
 structuredSpecifications=True,sourceWorkbook='10.11(20261018-071932).xlsx',sourceFields=p['sourceFields'],sourceRow=p['sourceRow'],assetKey=p['key'],assetDirectory='batch-2026-10-18-supplement',
 imagePrefix=p['key']+'-'+p['keywords'],imageExtensions=['jpg']*3,imageDimensions=m['dimensions'],preserveImageRatio=True,galleryOrder=[1,2,3],
 galleryLabels=['product reference','source specification summary','packing and order brief'],galleryNote='Image 1: '+('brand-neutral edited styling reference' if sku in {'RW26802','RW26788'} else 'supplied product reference')+'. Images 2–3: specification and packing graphics. Props are not included. Displayed counts are not packing quantities. Confirm selected designs and sizes by sample.',
 mediaLabel='Product reference and buying details',factsUpdatedAt='2026-10-18',holeDescription=hole,preserveApprovedContent=True)
 found=[(f,b,r) for f,b in batches.items() for r in b['products'] if r['sku']==sku and f.name not in {'haibu-purchasing-20261002.json'}]
 if old and found:
  assert len(found)==1,(sku,[x[0].name for x in found])
  file,batch,previous=found[0]
  previous.update(record)
  # The batch's historical title owns the URL, including its original asset key.
  file.write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
 else:new.append(record)
 changes.append(dict(sku=sku,operation='update' if old else 'new',sourceRow=p['sourceRow'],sourceFields=p['sourceFields'],sourceReferences=p['sourceReferences'],previousCatalog=old,imageOutputs=[dict(path='/'+str(Path(f).relative_to(ROOT)),**m['dimensions'][i],sha256=hashlib.sha256(Path(f).read_bytes()).hexdigest(),origin=('brand-neutral edited reference' if i==0 and sku in {'RW26802','RW26788'} else p['imageOrigins'][i])) for i,f in enumerate(m['paths'])]))
batch=dict(batch='haibu-new-products-20261018-supplement',expectedSkuCount=len(new),publicGalleryCount=3,assetDirectory='batch-2026-10-18-supplement',imageExtension='jpg',structuredDataImageMode='gallery',lastModified='2026-10-18',preserveApprovedContent=True,prependProducts=True,packingOptions=[],products=new)
(ROOT/'scripts/data/haibu-new-products-20261018-supplement.json').write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
manifest=dict(batchId='haibu-products-20261018-supplement',catalogCountBefore=209,catalogCountAfter=220,newProductCount=11,updatedProductCount=4,imageCount=45,previousProducts=catalog['products'],products=changes,
 imageEdit=dict(mode='built-in image generation tool',skus=['RW26802','RW26788'],prompt='Remove only the upper-right QULA CRAFT OEM/ODM badge. Seamlessly continue the background. Preserve product shapes, colors, quantities, texture, composition and application inset. Do not crop, stretch, add logos or change any other element.'))
(ROOT/'docs/tasks/haibu-new-products-20261018-supplement-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
script=ROOT/'scripts/build-v2-product-details.mjs'
s=script.read_text()
s=s.replace("const purchasingBatch =", "const haibuOctober18Supplement = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20261018-supplement.json'), 'utf8'));\nconst purchasingBatch =")
s=s.replace("{ issue: 'haibu-new-products-20261018', data: haibuOctober18Batch }", "{ issue: 'haibu-new-products-20261018', data: haibuOctober18Batch },\n  { issue: 'haibu-new-products-20261018-supplement', data: haibuOctober18Supplement }")
s=s.replace("approvedListing: batchRecord?.data.preserveApprovedContent ? {", "approvedListing: (batchProduct?.preserveApprovedContent ?? batchRecord?.data.preserveApprovedContent) ? {")
script.write_text(s)
print(json.dumps({'new':11,'updates':4,'catalog':220,'images':45}))
