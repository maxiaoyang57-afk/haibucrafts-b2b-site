import { test, expect } from '@playwright/test';
import { octoberArticles } from '../../scripts/content/blogs-20261017.mjs';
test('reorder and quantity guides retain tables, images and exact product destinations',async({page},info)=>{
 await page.route('**/api/inquiry',r=>r.abort());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/blog/');
 for(const a of octoberArticles)await expect(page.locator('main a[href="/blog/'+a.slug+'/"]')).toBeVisible();
 for(const a of octoberArticles){
  await page.goto('/blog/'+a.slug+'/');
  await expect(page.locator('h1')).toHaveText(a.title);
  const decline=page.locator('[data-analytics-decline]');if(await decline.isVisible())await decline.click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const img=page.locator('.blog-article-body img');await img.scrollIntoViewIfNeeded();
  await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  expect(await img.evaluate(i=>Math.abs((i.getBoundingClientRect().width/i.getBoundingClientRect().height)-(i.naturalWidth/i.naturalHeight))<0.02)).toBe(true);
  await expect(page.locator('table caption')).toContainText('Illustrative');
  const links=await page.locator('main a[href^="/"]').evaluateAll(ls=>[...new Set(ls.map(l=>l.getAttribute('href')))]);
  for(const link of links)expect((await page.request.get(link)).status(),link).toBe(200);
  await page.locator('main').screenshot({path:info.outputPath(a.slug+'.png')});
  await page.locator('main h2').last().scrollIntoViewIfNeeded();
  await page.locator('.back-top').click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(5);
  await page.locator('.blog-checklist-card .btn').click();
  await expect(page).toHaveURL(new RegExp('article='+a.slug));
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
 }
 expect(errors).toEqual([]);
});
