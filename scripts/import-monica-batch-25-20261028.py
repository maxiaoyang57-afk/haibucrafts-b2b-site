"""Register reviewed source batches with HAIBU sourcing copy and exact specifications."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATE='2026-10-29'
plan=json.loads((ROOT/'scripts/data/monica-reviewed-batch-25-20261028.json').read_text())
previous=json.loads((ROOT/'assets/v2/product-catalog.json').read_text())['products']
assert not {p['sku'] for p in plan['products']}.intersection(p['sku'] for p in previous)
registrations=[];manifest=[]
for n in sorted({p['batchNumber'] for p in plan['products']}):
    products=[]
    selected=[p for p in plan['products'] if p['batchNumber']==n]
    for p in selected:
        for info in p['haibuImageInfo']:
            assert hashlib.sha256((ROOT/info['path']).read_bytes()).hexdigest()==info['sha256']
        record=dict(sku=p['sku'],title=p['title'],originalTitle=p['sourceFields']['title'],type=p['type'],categorySlug=p['haibuCategory'],
                    imageAlt=p['title']+', product code '+p['sku'],description=p['procurementAdvice'],
                    detailedDescription=p['caption']+' '+p['procurementAdvice']+' '+p['variantSizeNotes'],
                    seasonalTheme='Wholesale decorative craft components',
                    keySellingPoints=[p['title'],'Material: '+p['material'],'Dimensions: '+p['dimensions'],'Reference pack: '+p['packing']],
                    specificationLines=['Product code: '+p['sku'],'Material: '+p['material'],'Dimensions: '+p['dimensions'],
                                        'Reference pack: '+p['packing'],'Attachment: '+p['attachment'],'Selection: '+p['variantSizeNotes'],
                                        'MOQ and dispatch timing: Confirm in your quotation'],
                    material=p['material'],dimensions=p['dimensions'],sourcePacking=p['packing'],
                    customizationOptions='For '+p['sku']+', describe any requested design, assortment or packing changes. Confirm feasibility, sample approval, minimum quantity and lead time for your specific brief.',
                    recommendedApplications=p['uses'],packagingMoq='Reference packing: '+p['packing']+'. This is not the MOQ. Confirm bag quantities, assortment and destination in your quotation.',
                    seoKeywords=p['keywords'].replace('-',' ')+', wholesale craft components',metaTitle=p['haibuMetaTitle'],metaDescription=p['haibuDescription'],
                    structuredSpecifications=True,verifiedStructuredSpecifications={'material':p['material'],'size':p['dimensions'],'additionalProperty':[{'@type':'PropertyValue','name':'Standard pack','value':p['packing']}]},
                    sourceJson=plan['sourceFile'],sourceFileSha256=plan['sourceSha256'],sourceFields=p['sourceFields'],sourceProductId=p['sourceProductId'],sourceUrl=p['sourceUrl'],
                    materialBasis=p['materialBasis'],assetKey=p['key'],assetDirectory='batch-'+p['batchId'],imagePrefix=p['key']+'-'+p['keywords'],
                    imageExtensions=['jpg']*3,imageDimensions=p['imageDimensions'],preserveImageRatio=True,galleryOrder=[1,2,3],
                    galleryLabels=p['galleryLabels'],galleryNote=p['galleryNote'],mediaLabel='Product reference and buying details',
                    factsUpdatedAt=DATE,holeDescription=p['attachment'],preserveApprovedContent=True)
        products.append(record)
        manifest.append(dict(sku=p['sku'],batchNumber=n,sourceUrl=p['sourceUrl'],sourceFields=p['sourceFields'],imageOutputs=p['haibuImageInfo']))
    batchid='haibu-new-products-'+selected[0]['batchId']
    batch=dict(batch=batchid,expectedSkuCount=len(products),publicGalleryCount=3,assetDirectory='batch-'+selected[0]['batchId'],
               imageExtension='jpg',structuredDataImageMode='gallery',lastModified=DATE,preserveApprovedContent=True,prependProducts=True,packingOptions=[],products=products)
    (ROOT/'scripts/data'/(batchid+'.json')).write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
    registrations.append(batchid)
f=ROOT/'scripts/build-v2-product-details.mjs';text=f.read_text();marker='const productBatches = [';assert text.count(marker)==1
definitions='\n'.join(f"const monicaOctober28TwentyFifthBatch{i} = JSON.parse(await readFile(path.join(root, 'scripts/data/{batch}.json'), 'utf8'));" for i,batch in enumerate(registrations,1))+'\n'
text=text.replace(marker,definitions+marker)
marker="  { issue: 'haibu-new-products-20261028-monica-24', data: monicaOctober28TwentyFourthBatch1 }";assert text.count(marker)==1
text=text.replace(marker,marker+',\n'+',\n'.join(f"  {{ issue: '{batch}', data: monicaOctober28TwentyFifthBatch{i} }}" for i,batch in enumerate(registrations,1)))
f.write_text(text)
(ROOT/'scripts/data/product-plan-20261028-monica-25.json').write_text(json.dumps([dict(sku=p['sku'],haibu=True,haibuCategory=p['haibuCategory'],operation='new') for p in plan['products']],ensure_ascii=False,indent=2)+'\n')
(ROOT/'docs/tasks/haibu-new-products-20261028-monica-25-manifest.json').write_text(json.dumps(dict(batchId='haibu-products-20261028-monica-25',date=DATE,batchCount=plan['batchCount'],batchSize=20,catalogCountBefore=len(previous),catalogCountAfter=len(previous)+len(manifest),newProductCount=len(manifest),imageCount=3*len(manifest),previousProducts=previous,products=manifest),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(new=len(manifest),batches=plan['batchCount'],catalog=len(previous)+len(manifest))))
