import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../docs/responsive-images-20261030.json',import.meta.url),'utf8'));
const images=new Map(manifest.images.map(image=>[image.source,image]));
const routes=new Set(manifest.pages.map(page=>'/'+page.replace(/index\.html$/,'')));
export function responsiveImageMarkup(html,route){
 if(!routes.has(route))return html;
 return html.replace(/<img\b[^>]*>/gi,tag=>{
  const source=tag.match(/\ssrc=["']([^"']+)["']/i)?.[1]?.split('?')[0];
  const image=images.get(source);if(!image)return tag;
  const srcset=image.variants.map(v=>`${v.url} ${v.width}w`).join(', ');
  const sizes='(max-width:720px) calc(100vw - 48px), 400px';
  return tag.replace(/\s+(?:srcset|sizes)=["'][^"']*["']/gi,'').replace(/\s*\/?>$/,end=>` srcset="${srcset}" sizes="${sizes}"${end}`);
 });
}
