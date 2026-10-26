"""Apply product-specific buyer copy and factual structured specs to this batch only.

Re-run after an import to restore the editorial overlay. Product identities,
source captures, numeric facts, images and inquiry destinations are unchanged.
"""
import argparse,copy,json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
VARIANTS={
 'RW1959':'Reference size options: option 1, 23 × 23 × 30 mm; option 2, 7 × 31 × 40 mm. Ask which pictured design corresponds to each option.',
 'RW1514':'Reference sizes by option: 1, 20 × 22 × 30 mm; 2, 21 × 26 × 30 mm; 3, 24 × 24 × 25 mm; 4, 18 × 24 × 28 mm; 5, 11 × 11 × 18 mm; 6, 14 × 24 × 30 mm. Confirm the design-to-option mapping.',
}

def save(path,value,indent=2):path.write_text(json.dumps(value,ensure_ascii=False,indent=indent)+'\n')
def factual(value):
    return bool(value) and not re.search(r'confirm|inquiry|request|ask us|not specified',value,re.I)
def known_size(value):
    if not value or value.startswith('Confirm'):return None
    # Retain a known measurement and qualifier, not the trailing inquiry instruction.
    return re.split(r';\s*confirm',value,flags=re.I)[0]

def meta(hook,sku,facts):
    result=hook+' SKU '+sku+'.'
    for fact in facts:
        candidate=result+' '+fact
        if len(candidate)<=160:result=candidate
    if len(result)<80:result+=' Discuss your selected design before ordering.'
    assert 80<=len(result)<=160,(sku,len(result),result)
    return result

def build_editorial(plans,profiles):
    result={}
    for p in plans:
        sku=p['sku'];label,visual,project,selection,bulk,qhook,hhook=profiles[sku]
        # A list of examples is clearer than a misleading min/max tuple for variants.
        if sku=='RW1514':selection='Select the mushroom design before choosing its numbered size option. Request the design-to-size mapping and the contents of the proposed assortment.'
        dimensions=known_size(p['dimensions']);pack=p['packing'] if factual(p['packing']) else None
        material=p['material'] if factual(p['material']) and not p['material'].startswith('Mixed decorative') else None
        facts=[]
        if dimensions:facts.append('Size: '+dimensions+'.')
        if pack:facts.append('Pack: '+pack+'.')
        fact_paragraph=' '.join(('Reference dimensions: '+dimensions+'.' if dimensions else '', 'Reference packing: '+pack+'.' if pack else '')).strip()
        verified={}
        if material:verified['material']=material
        if dimensions:verified['size']=dimensions
        if pack:verified['additionalProperty']=[{'@type':'PropertyValue','name':'Standard pack','value':pack}]
        if sku.startswith('SLM'):
            packing=(('Reference packing: '+pack+'. ') if pack else '')+'Request a pack-weight and component-content quotation for this mix. State bag quantities and whether larger accents need separate packing; minimum order quantity is confirmed with the quote.'
            custom='Describe the included and excluded components and preferred mixing proportions. Substitute components, custom mixes and packing changes need confirmation against a sample and quotation.'
        else:
            packing=(('Reference packing: '+pack+'. ') if pack else 'Request the number of pieces or complete sets in each sales pack. ')+'Specify the selected configuration and handling requirements. The reference pack count does not establish the MOQ; agree packing and minimum quantities in the quotation.'
            custom='Describe requested motif, color-assortment or packing changes for '+sku+'. Feasibility, sample approval, minimum quantity and lead time must be confirmed for the specific request.'
        variant=VARIANTS.get(sku,'')
        qsummary=visual
        qdetail=qsummary+' '+project+' '+selection+(' '+fact_paragraph if fact_paragraph else '')+(' '+variant if variant else '')
        hdetail=bulk+(' '+fact_paragraph if fact_paragraph else '')+(' '+variant if variant else '')+' Include the selected design reference and the intended use when requesting a quotation, so the dimensions, assortment and packing can be reviewed together.'
        public_specs={
          'Material':p['material'] if material else 'Ask us to confirm the composition of your selected option.',
          'Size':p['dimensions'] if dimensions else 'Request measurements for the selected design.',
          'Standard pack':p['packing'] if pack else 'Request pack contents and the sales unit with your quote.',
        }
        result[sku]={
          'verifiedStructuredSpecifications':verified,
          'publicSelection':selection,'variantSizeNotes':variant,
          'qula':{'displayTitle':p['title'],'metaTitle':label+' | '+sku+' | Qula Craft',
                  'metaDescription':meta(qhook,sku,facts),'summary':qsummary,'detail':qdetail,
                  'projectUse':project,'selectionAdvice':selection,'variantSizeNotes':variant,
                  'publicSpecs':public_specs,'galleryNote':p.get('galleryNote','')},
          'haibu':{'description':bulk,'metaTitle':sku+' '+label+' Wholesale | HAIBU',
                   'metaDescription':meta(hhook,sku,facts),'detailedDescription':hdetail,
                   'recommendedApplications':project,'customizationOptions':custom,'packagingMoq':packing,
                   'keySellingPoints':[visual,bulk]+facts,
                   'specificationLines':['Product code: '+sku,'Material: '+public_specs['Material'],
                                         'Dimensions: '+public_specs['Size'],'Reference pack: '+public_specs['Standard pack'],
                                         'Selection: '+selection]+(['Size options: '+variant] if variant else [])+['MOQ and dispatch timing: Request confirmation with your quotation.']}
        }
        assert len(result[sku]['qula']['metaTitle'])<=72
        assert len(result[sku]['haibu']['metaTitle'])<=72
        assert result[sku]['qula']['metaDescription']!=result[sku]['haibu']['metaDescription']
        assert 'source title' not in qdetail.lower() and 'captured option' not in qdetail.lower()
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--brand',choices=['qula','haibu'],required=True);a=ap.parse_args()
    path=ROOT/'scripts/data/product-plan-20261026-monica.json';plans=json.loads(path.read_text())
    trial=json.loads((ROOT/'scripts/data/product-source-20261026-json-trial.json').read_text())
    trial_plan=dict(sku='RW26724',title='Red and White Mushroom Resin Charms',material='Resin',dimensions='16 × 17 mm',packing='100 pieces per bag',haibu=True,galleryNote=trial['galleryNote'])
    profiles=json.loads((ROOT/'scripts/data/monica-editorial-profiles-20261026.json').read_text())
    editorial=build_editorial([trial_plan]+plans,profiles)
    save(ROOT/'scripts/data/monica-editorial-copy-20261026.json',editorial)
    for p in plans:
        e=editorial[p['sku']];brand=e[a.brand]
        p['description']=brand['metaDescription'];p['metaTitle']=brand['metaTitle']
        p['factNote']=e['publicSelection']+(' '+e['variantSizeNotes'] if e['variantSizeNotes'] else '')
        p['uses']=e['qula']['projectUse'];p['verifiedStructuredSpecifications']=e['verifiedStructuredSpecifications']
    save(path,plans)
    if a.brand=='haibu':
        count=0
        for filename in ['haibu-new-products-20261026-monica.json','haibu-new-products-20261026-json-trial.json']:
            p=ROOT/'scripts/data'/filename;batch=json.loads(p.read_text())
            for record in batch['products']:
                e=editorial[record['sku']];record.update(e['haibu']);record['verifiedStructuredSpecifications']=e['verifiedStructuredSpecifications'];count+=1
            save(p,batch)
        print('HAIBU editorial products:',count)
    else:
        pdpp=ROOT/'assets/data/pdp-data.json';pdp=json.loads(pdpp.read_text())
        cp=ROOT/'assets/data/pdp-copy.json';copies=json.loads(cp.read_text())
        dp=ROOT/'assets/data/pdp-description-details.json';details=json.loads(dp.read_text())
        for row in pdp:
            if row['sku'] not in editorial:continue
            e=editorial[row['sku']];q=e['qula'];key=row['assetKey']
            row.update(metaTitle=q['metaTitle'],metaDescription=q['metaDescription'],shortProductDescription=q['summary'],specs=q['publicSpecs'],verifiedStructuredSpecifications=e['verifiedStructuredSpecifications'],galleryNote=q['galleryNote'] or row.get('galleryNote',''))
            copies[key].update(displayTitle=q['displayTitle'],metaTitle=q['metaTitle'],metaDescription=q['metaDescription'],selectionAdvice=q['selectionAdvice'],projectUse=q['projectUse'],variantSizeNotes=q['variantSizeNotes'])
            details[key]=q['summary']
        save(pdpp,pdp);save(cp,copies);save(dp,details)
        print('QULA editorial products:',len(editorial))
    public_facts={p['sku']:{k:p.get(k) for k in ['material','dimensions','packing','sourceFields','sourceProductId','sourceUrl','imagesLocal']} for p in plans}
    applicable=set(editorial) if a.brand=='qula' else {'RW26724'}|{p['sku'] for p in plans if p['haibu']}
    save(ROOT/'docs/monica-copy-review-20261026.json',dict(products=len(applicable),brand=a.brand,editorialSkuList=[sku for sku in editorial if sku in applicable],unconfirmedSchemaFieldsOmitted=True,sourceFacts=public_facts))

if __name__=='__main__':main()
