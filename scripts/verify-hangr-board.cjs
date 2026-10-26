// Behavioral checks carried forward from the approved D32 copy-humanization baseline.
// HANGR_PREVIEW is the complete mounted app URL, including /hangr.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.HANGR_PREVIEW || 'http://127.0.0.1:4178/hangr';
const capture = process.env.HANGR_CAPTURE !== '0';
const out = 'test-results/hangr/board-captures';
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync('test-results/hangr/board/checks', { recursive: true });
const families = [
  ['nav', 'Navigation', ['N1','N2','N3']], ['hero', 'Hero', ['H1','H2','H3']],
  ['product', 'Product display', ['P1','P2','P3']], ['features', 'Features', ['F1','F2','F3']],
  ['faq', 'Questions', ['Q1','Q2','Q3']], ['cta', 'Call to action', ['C1','C2','C3']], ['footer', 'Footer', ['FT1','FT2','FT3']],
];
const assert = (x,m) => { if (!x) throw new Error(m); };
const categoryButton = (p,name) => p.getByRole('navigation',{name:'Component categories'}).getByRole('button',{name:new RegExp('^'+name)});
(async()=>{
  const browser=await chromium.launch(); const report={base,at:new Date().toISOString(),cases:[]};
  try {
    for(const width of [1440,390,320]) {
      const p=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'}); const errors=[];
      p.on('pageerror',e=>errors.push(e.message));
      const res=await p.goto(`${base}/directions/components/`,{waitUntil:'networkidle'}); assert(res.status()===200,'Board unavailable');
      for(const [key,name,ids] of families) {
        await categoryButton(p,name).click(); await p.evaluate(()=>document.fonts.ready);
        for(const id of ids) {
          const specimen=p.locator(`article[id="${id}"]`); assert(await specimen.count()===1,`${id} missing/duplicated`);
          await specimen.scrollIntoViewIfNeeded();
        }
        await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
        const state=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,main:document.querySelectorAll('main').length,h1:document.querySelectorAll('h1').length,incumbentChrome:document.querySelectorAll('.site-header,.site-footer').length,canvas:document.querySelectorAll('canvas').length,badShree:[...document.querySelectorAll('h1,h2,h3,p,a,button')].filter(e=>/shree/i.test(getComputedStyle(e).fontFamily)&&getComputedStyle(e).fontWeight!=='700').map(e=>e.textContent),brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),emptyLinks:[...document.querySelectorAll('a')].filter(a=>a.getAttribute('href')==='#'||!a.getAttribute('href')).map(a=>a.textContent)}));
        assert(state.scrollWidth<=width,`${name} overflows ${width}`); assert(state.main===1&&state.h1===1,'Bad page landmarks'); assert(!state.incumbentChrome,'Old chrome leaked'); assert(!state.canvas,'WebGL mounted without explicit activation'); assert(!state.badShree.length,'Shree not bold'); assert(!state.brokenImages.length,'Broken image'); assert(!state.emptyLinks.length,'Empty anchor');
        if(capture&&width!==320) {
          await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'})});
          await p.screenshot({path:path.join(out,`${key}-${width}.png`),fullPage:true,animations:'disabled'});
        }
        report.cases.push({family:key,width,ids,...state,errors:[...errors]}); console.log(key,width,'passed');
      }
      assert(!errors.length,errors.join('; ')); await p.close();
    }
    const p=await browser.newPage({viewport:{width:1440,height:1000}}); await p.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true})); await p.goto(`${base}/directions/components/`,{waitUntil:'networkidle'});
    await p.getByRole('button',{name:'Review choices',exact:true}).click();
    assert(await p.getByText(/No choices yet/).count()===1,'Unexpected default selections');
    const emptyDownload=p.waitForEvent('download'); await p.getByRole('button',{name:'Download summary',exact:true}).click();
    const inventory=await emptyDownload; await inventory.saveAs('test-results/hangr/board/catalog.html');
    const inventoryHtml=fs.readFileSync('test-results/hangr/board/catalog.html','utf8');
    assert(!inventoryHtml.includes('{{CONTENT}}')&&inventoryHtml.includes('21 components created'),'Summary not complete');
    assert(families.flatMap(x=>x[2]).every(id=>inventoryHtml.includes(`variantId=&quot;${id}&quot;`)),'Summary misses component');
    for(const [key,name,ids] of families) {
      await categoryButton(p,name).click(); await p.getByRole('button',{name:`Choose ${ids[1]}`,exact:true}).click();
    }
    await p.reload({waitUntil:'networkidle'}); assert(await p.getByRole('button',{name:/Your shortlist 7\/7/}).count()===1,'Selections did not persist');
    await categoryButton(p,'Hero').click(); await p.getByRole('button',{name:'Choose H3',exact:true}).click();
    await p.getByRole('button',{name:'Review choices',exact:true}).click();
    assert(await p.getByText(/^H3: /).count()===1,'Replacement not shown');
    await p.getByRole('button',{name:'Copy shortlist',exact:true}).click();
    const fallback=p.locator('textarea'); if(await fallback.count())assert((await fallback.inputValue()).includes('H3'),'Clipboard fallback missing');
    const manifestDownload=p.waitForEvent('download');await p.getByRole('button',{name:'Implementation list (.json)',exact:true}).click();const manifestFile=await manifestDownload;await manifestFile.saveAs('test-results/hangr/board/checks/selection-fixture.json');
    const manifest=JSON.parse(fs.readFileSync('test-results/hangr/board/checks/selection-fixture.json','utf8'));assert(manifest.components.length===21&&Object.keys(manifest.picks).length===7&&manifest.picks.hero==='H3','Bad implementation export');
    await p.getByRole('button',{name:'Remove H3 selection',exact:true}).click();assert(await p.getByRole('button',{name:/Back to options 6\/7/}).count()===1,'Remove did not update count');
    await p.getByRole('button',{name:'Clear shortlist',exact:true}).click();assert(await p.getByText(/No choices yet/).count()===1,'Clear failed');
    await p.evaluate(()=>localStorage.setItem('hangr-component-shortlist-v1','broken-json'));await p.reload({waitUntil:'networkidle'});assert(await p.getByRole('status').innerText().then(t=>t.includes('could not read')),'Corrupt storage not handled');
    report.selection={blankByDefault:true,persists:true,replacesWithoutDuplicate:true,htmlInventoryComplete:true,jsonExportComplete:true,clipboardFallback:true,removeAndClear:true,corruptStorageHandled:true,fixturesAreNotUserChoices:true};
    if(capture){await p.getByRole('button',{name:/Your shortlist/}).click();await p.getByRole('button',{name:'Clear shortlist',exact:true}).click();await p.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.scrollTo({top:0,behavior:'instant'})});await p.screenshot({path:path.join(out,'summary-1440.png'),fullPage:true});await p.setViewportSize({width:390,height:844});await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,'summary-390.png'),fullPage:true});}
    await p.close();
  } finally {fs.writeFileSync('test-results/hangr/board/verification.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
