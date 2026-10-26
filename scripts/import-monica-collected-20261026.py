"""Register the reviewed resin/slime subset of the owner's Monica capture."""
import copy
import hashlib
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
plans=json.loads((ROOT/'scripts/data/product-plan-20261026-monica.json').read_text())
previous=json.loads((ROOT/'assets/v2/product-catalog.json').read_text())['products']
selected=[p for p in plans if p['haibu']]
editorial_path=ROOT/'scripts/data/monica-editorial-copy-20261026.json'
editorial=json.loads(editorial_path.read_text()) if editorial_path.exists() else {}
assert len(selected)==23
assert not {p['sku'] for p in selected}.intersection(p['sku'] for p in previous)
template=json.loads((ROOT/'scripts/data/haibu-new-products-20261026-json-trial.json').read_text())
batch=copy.deepcopy(template)
batch.update(batch='haibu-new-products-20261026-monica',expectedSkuCount=len(selected),
             assetDirectory='batch-2026-10-26-monica',products=[])
for plan in selected:
    p=copy.deepcopy(template['products'][0])
    sku=plan['sku']
    for field in ['sku','title','material','dimensions','description','metaDescription']:
        p[field]=plan['description'] if field=='metaDescription' else plan[field]
    p.update(originalTitle=plan['sourceFields']['title'],type=plan['type'],categorySlug=plan['haibuCategory'],
             imageAlt=plan['title']+', product code '+sku,
             detailedDescription=plan['factNote']+' '+plan['uses']+' Reference '+sku+' and confirm the required quantity, assortment, packing and destination with your inquiry.',
             seasonalTheme='Wholesale decorative craft components',
             keySellingPoints=[plan['title'],'Material: '+plan['material'],'Dimensions: '+plan['dimensions'],'Packing: '+plan['packing']],
             specificationLines=['Product code: '+sku,'Material: '+plan['material'],'Dimensions: '+plan['dimensions'],'Attachment: '+plan['attachment'],'Standard pack: '+plan['packing'],'Selection note: '+plan['factNote'],'MOQ and dispatch date: Confirm by inquiry'],
             sourcePacking=plan['packing'],recommendedApplications=plan['uses'],
             packagingMoq='Packing reference: '+plan['packing']+'. This pack quantity is not the MOQ. Confirm minimum order quantity, current availability, sample timing and dispatch date by inquiry.',
             seoKeywords=plan['keywords'].replace('-',' ')+', wholesale craft components',
             metaTitle=plan['metaTitle'].replace('| Qula','| HAIBU'),
             sourceFields=plan['sourceFields'],sourceProductId=plan['sourceProductId'],
             sourceUrl=plan['sourceUrl'],materialBasis=plan['materialBasis'],assetKey=plan['key'],
             assetDirectory='batch-2026-10-26-monica',imagePrefix=plan['key']+'-'+plan['keywords'],
             imageDimensions=plan['imageDimensions'],galleryLabels=plan['galleryLabels'],
             galleryNote=plan['galleryNote'],mediaLabel='Product reference and buying details',
             holeDescription=plan['attachment'])
    if sku in editorial:
        p.update(editorial[sku]['haibu'])
        p['verifiedStructuredSpecifications']=editorial[sku]['verifiedStructuredSpecifications']
    batch['products'].append(p)

def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
save(ROOT/'scripts/data/haibu-new-products-20261026-monica.json',batch)
changes=[]
for p in selected:
    changes.append(dict(sku=p['sku'],operation='new',sourceFields=p['sourceFields'],
                        sourceUrl=p['sourceUrl'],materialBasis=p['materialBasis'],
                        imageOutputs=[dict(path='/'+f,role=p['galleryLabels'][i],
                                           sha256=hashlib.sha256((ROOT/f).read_bytes()).hexdigest(),
                                           **p['imageDimensions'][i]) for i,f in enumerate(p['imagesLocal'])]))
save(ROOT/'docs/tasks/haibu-new-products-20261026-monica-manifest.json',
     dict(batchId='haibu-products-20261026-monica',catalogCountBefore=len(previous),
          catalogCountAfter=len(previous)+len(selected),newProductCount=len(selected),
          updatedProductCount=0,imageCount=3*len(selected),previousProducts=previous,
          products=changes,qulaOnlySkus=[p['sku'] for p in plans if not p['haibu']]))
f=ROOT/'scripts/build-v2-product-details.mjs';text=f.read_text()
marker='const productBatches = [';assert text.count(marker)==1
text=text.replace(marker,"const haibuMonicaOctober26 = JSON.parse(await readFile(path.join(root, 'scripts/data/haibu-new-products-20261026-monica.json'), 'utf8'));\n"+marker)
marker="  { issue: 'haibu-new-products-20261026-json-trial', data: haibuOctober26JsonTrial }"
assert text.count(marker)==1
text=text.replace(marker,marker+",\n  { issue: 'haibu-new-products-20261026-monica', data: haibuMonicaOctober26 }")
f.write_text(text)
for p in plans:
    if not p['haibu']:
        folder=ROOT/'assets/images/products/batch-2026-10-26-monica'/p['key']
        if folder.exists():shutil.rmtree(folder)
print(json.dumps(dict(new=len(selected),catalog=len(previous)+len(selected),images=3*len(selected))))
