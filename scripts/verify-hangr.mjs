// Run against the actual Vercel preview/local router, not only Vite's SPA fallback.
// HANGR_HOST=http://127.0.0.1:4178 node scripts/verify-hangr.mjs
// --personal-only records the unchanged personal homepage before mirroring.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';

const host = (process.env.HANGR_HOST || 'http://127.0.0.1:4178').replace(/\/$/, '');
const label = process.env.HANGR_CHECK_LABEL || 'candidate';
const out = path.resolve('test-results/hangr', label);
const report = { host, at: new Date().toISOString(), personal: [], hangr: [], errors: [] };
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [mode, width] of [['terminal',1440], ['graph',1440], ['graph',375]]) {
    const p = await browser.newPage({ viewport: { width, height:900 }, reducedMotion:'reduce' });
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    const response = await p.goto(`${host}/?mode=${mode}&theme=light`, { waitUntil:'networkidle' });
    assert.equal(response.status(),200);
    await p.waitForFunction(mode => document.documentElement.dataset.mode === mode, mode);
    await p.evaluate(() => document.fonts.ready);
    const state = await p.evaluate(() => ({ title:document.title, text:document.body.innerText,
      scrollWidth:document.documentElement.scrollWidth,
      hangrLinks:[...document.querySelectorAll('a[href]')].filter(a => /^\/hangr(?:\/|$)/.test(new URL(a.href).pathname)).length }));
    assert(state.text.length>50, 'Personal homepage did not render');
    assert.equal(state.hangrLinks,0,'Hangr was added to the personal menu');
    assert(state.scrollWidth<=width,`Personal ${mode} overflow at ${width}`);
    assert.deepEqual(errors,[]);
    await p.screenshot({ path:path.join(out,`personal-${mode}-${width}.png`), animations:'disabled' });
    report.personal.push({ mode,width,title:state.title,scrollWidth:state.scrollWidth,hangrLinks:state.hangrLinks,errors });
    await p.close();
  }
  if (!process.argv.includes('--personal-only')) {
    const routes = ['', 'home/', 'directions/', 'directions/edit/', 'directions/studio/', 'directions/components/'];
    for (const width of [1440,390,320]) {
      for (const route of routes) {
        const p = await browser.newPage({ viewport:{ width,height:width===1440?900:844 } });
        const errors=[],failed=[];
        p.on('pageerror', e => errors.push(e.message));
        p.on('response', r => { if (new URL(r.url()).pathname.startsWith('/hangr/') && r.status()>=400) failed.push({url:r.url(),status:r.status()}); });
        const response = await p.goto(`${host}/hangr/${route}`, { waitUntil:'networkidle' });
        assert.equal(response.status(),200,`Unavailable route ${route}`);
        assert((await response.headerValue('content-type')).includes('text/html'));
        await p.evaluate(() => document.fonts.ready);
        // Native lazy images below the fold are not broken. Activate each
        // visible specimen before checking its decoded dimensions.
        for (const image of await p.locator('img').all()) {
          if (await image.isVisible()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(i=>i.decode()); }
        }
        await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        const state = await p.evaluate(() => ({ title:document.title,h1:[...document.querySelectorAll('h1')].map(h=>h.textContent),
          width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          brokenImages:[...document.images].filter(i=>i.checkVisibility()&&(!i.complete||!i.naturalWidth)).map(i=>i.src),
          images:[...document.images].map(i=>i.src.startsWith('data:')?i.src:new URL(i.src).pathname),
          fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),
          oldChrome:document.querySelectorAll('.site-header,.site-footer').length,
          links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent,href:a.getAttribute('href')})) }));
        assert.equal(state.h1.length,1,`Expected one main heading: ${route}`);
        assert(state.scrollWidth<=width,`${route} overflow at ${width}`);
        assert.deepEqual(state.brokenImages,[]);
        assert(state.images.every(p=>p.startsWith('/hangr/')||p.startsWith('data:')),`An image escaped the mount: ${route}`);
        assert(state.fonts.some(f=>/shree/i.test(f)),`Custom heading font missing: ${route}`);
        assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
        if (!route || route.startsWith('directions/')) assert.equal(state.oldChrome,0,`Duplicate original chrome: ${route}`);
        if (!route) {
          assert.match(state.h1[0],/Two ways/i,'The entry must be the two-design hub, not an assembled homepage');
          for (const target of ['/hangr/home','/hangr/directions/edit','/hangr/directions/studio','/hangr/directions/components']) {
            assert(state.links.some(l=>new URL(l.href,host).pathname.replace(/\/$/,'')===target),`Hub lacks direct link ${target}`);
          }
          const shortcut = p.locator('a[href="/hangr/directions/components/"]').first();
          const fallback = p.locator('a[href="/hangr/directions/components"]').first();
          await (await shortcut.count()?shortcut:fallback).click();
          await p.waitForURL(/\/hangr\/directions\/components\/?$/);
          assert(await p.getByRole('button',{name:'Choose H1',exact:true}).count()===1,'Hub-to-chooser navigation failed');
          await p.goBack({waitUntil:'networkidle'});
        }
        if (width!==320) await p.screenshot({path:path.join(out,`hangr-${route.replaceAll('/','-')||'hub'}-${width}.png`),fullPage:true,animations:'disabled'});
        report.hangr.push({route,width,...state,errors,failed}); await p.close();
      }
    }
    // Public HTML is itself the output contract. Downloaded links must stay on
    // the public Hangr namespace; they must not lead to the old private machine.
    for (const file of ['plan.html','component-inventory.html','wording-changes.html']) {
      const p = await browser.newPage({viewport:{width:390,height:844}});
      const response=await p.goto(`${host}/hangr/directions/${file}`,{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      const state=await p.evaluate(()=>({title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        privateLinks:[...document.querySelectorAll('a[href]')].filter(a=>/^http:\/\/(100\.|127\.|localhost)/.test(a.href)).map(a=>a.href)}));
      assert.match(state.title,/Hangr/i); assert(state.scrollWidth<=390); assert.deepEqual(state.privateLinks,[]);
      await p.screenshot({path:path.join(out,file.replace('.html','')+'-390.png'),fullPage:false});
      report.hangr.push({file,...state}); await p.close();
    }
    const p=await browser.newPage();
    await p.goto(`${host}/hangr/directions/components/`,{waitUntil:'networkidle'});
    await p.evaluate(()=>{localStorage.setItem('on.mode','terminal');localStorage.setItem('on.theme','dark')});
    await p.getByRole('button',{name:'Choose H1',exact:true}).click();
    await p.getByRole('button',{name:'Review choices',exact:true}).click();
    await p.getByRole('button',{name:'Clear shortlist',exact:true}).click();
    assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('on.mode'),localStorage.getItem('on.theme')]),['terminal','dark'],'Clearing Hangr erased personal-site preferences');
    await p.close();
    for (const script of ['verify-hangr-board.cjs','verify-hangr-interactions.cjs']) {
      const result=spawnSync(process.execPath,[`scripts/${script}`],{stdio:'inherit',env:{...process.env,HANGR_PREVIEW:`${host}/hangr`,HANGR_CAPTURE:'0'}});
      assert.equal(result.status,0,`${script} failed`);
    }
    report.fullComponentChecks=true;
  }
} catch(error) { report.errors.push(error.stack); throw error; }
finally { await writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n'); await browser.close(); }
console.log(`Hangr ${label} checks passed; evidence: ${out}`);
