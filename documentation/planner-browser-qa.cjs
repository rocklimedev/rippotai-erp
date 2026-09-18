const { chromium } = require('C:/Users/devro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const defaults = require('../backend/dist/src/modules/projects/planner-workbook-template').WORKBOOK_TEMPLATE;
(async () => {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const phases=new Map();
 const items=defaults.tasks.map((row,i)=>{const key=row.module+row.phase;if(!phases.has(key))phases.set(key,{id:key,title:row.phase,module:row.module,sort_order:phases.size});return {...row,id:'t'+i,phase_id:key,phase:phases.get(key),locations:[{id:'r'+i,location_id:'floor',status:'NOT_STARTED',progress_pct:0}]};});
 const data={project:{id:'project',name:'Courtyard residence'},planners:[{id:'planner',project_id:'project',type:'PROJECT',items,procurement_items:defaults.procurement.map((r,i)=>({...r,id:'p'+i}))}],locations:[{id:'floor',name:'Stilt',type:'FLOOR',children:[{id:'room',name:'Kitchen',type:'ROOM'}]}]};
 const writes=[];
 await page.route('**/*',async route=>{
  const req=route.request(); const url=new URL(req.url());
  if(url.host==='127.0.0.1:5173')return route.continue();
  const path=url.pathname;
  if(path.endsWith('/projects'))return route.fulfill({json:[{id:'project',name:'Courtyard residence'}]});
  if(path.endsWith('/planners/overview'))return route.fulfill({json:data});
  if(req.method()==='PATCH'){
   const patch=req.postDataJSON();writes.push({path,patch});
   if(path.includes('planner-item-locations')) {const id=path.split('/').pop();for(const task of items)for(const r of task.locations)if(r.id===id)Object.assign(r,patch);}
   else if(path.includes('/planner-items/'))Object.assign(items.find(i=>i.id===path.split('/').pop()),patch);
   else Object.assign(data.planners[0].procurement_items.find(i=>i.id===path.split('/').pop()),patch);
   return route.fulfill({json:patch});
  }
  if(path.endsWith('/locations')&&req.method()==='POST') {const task=items.find(i=>i.id===path.split('/').at(-2));task.locations.push({id:'new-relation',location_id:'room',status:'NOT_STARTED'});return route.fulfill({json:task});}
  return route.fulfill({json:{}});
 });
 await page.goto('http://127.0.0.1:5173/planner-qa.html');
 await page.getByLabel('Project',{exact:true}).selectOption('project');
 await page.getByRole('tab',{name:'Consultancy',exact:true}).click();
 if(await page.locator('tbody tr').count()!==40)throw new Error('Expected 40 consultancy rows');
 await page.getByLabel('EXISTING LAYOUT — Stilt',{exact:true}).selectOption('COMPLETED');
 await page.waitForFunction(()=>document.querySelector('select[aria-label="EXISTING LAYOUT — Stilt"]').value==='COMPLETED');
 await page.getByLabel('details — EXISTING LAYOUT',{exact:true}).fill('Measured layout');
 await page.getByRole('tab',{name:'PMC',exact:true}).click();
 if(await page.locator('tbody tr').count()!==39)throw new Error('Expected 39 PMC rows');
 await page.getByRole('tab',{name:'Vendor & Procurement',exact:true}).click();
 await page.getByLabel('vendor name — TILES',{exact:true}).fill('QA supplier');
 await page.getByLabel('purchase date — TILES',{exact:true}).fill('2026-09-18');
 await page.getByRole('tab',{name:'Overview',exact:true}).click();
 await page.getByLabel('EXISTING LAYOUT — Kitchen',{exact:true}).selectOption('IN_PROGRESS');
 await page.waitForTimeout(300);
 const pdfDownload=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download current sheet PDF',exact:true}).click();
 await (await pdfDownload).saveAs('documentation/planner-qa.pdf');
 await page.screenshot({path:'documentation/planner-desktop-qa.png',fullPage:false});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'documentation/planner-mobile-qa.png',fullPage:false});
 const width=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));
 if(width.body!==width.viewport)throw new Error('Body overflow '+JSON.stringify(width));
 if(errors.length)throw new Error(errors.join('\n'));
 if(!writes.some(w=>w.patch.status==='COMPLETED')||!writes.some(w=>w.patch.details==='Measured layout')||!writes.some(w=>w.patch.purchase_date==='2026-09-18')||!writes.some(w=>w.patch.status==='IN_PROGRESS'))throw new Error('Missing saved edits '+JSON.stringify(writes));
 console.log(JSON.stringify({consultancy:40,pmc:39,procurement:22,writes:writes.length,mobile:width,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
