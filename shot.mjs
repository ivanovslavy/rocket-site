import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 860 })
await page.goto('http://localhost:5210/', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise(r => setTimeout(r, 6000))
await page.evaluate(()=>{const m=document.documentElement.scrollHeight-document.documentElement.clientHeight; window.scrollTo(0,m*0.16)})
await new Promise(r=>setTimeout(r,1800))
const cursor = () => page.evaluate(()=>getComputedStyle(document.body).cursor)
let hit=null
const cx=980, cy=330
search: for (let a=0;a<360 && !hit;a+=8){ for(const rad of [50,80,110,140,170]){ const x=Math.round(cx+Math.cos(a*Math.PI/180)*rad), y=Math.round(cy+Math.sin(a*Math.PI/180)*rad*0.8); if(x<560||x>1430||y<80||y>820)continue; await page.mouse.move(x,y); await new Promise(r=>setTimeout(r,30));
  if(await cursor()==='pointer'){ await new Promise(r=>setTimeout(r,450)); await page.mouse.move(x,y); await new Promise(r=>setTimeout(r,120)); if(await cursor()==='pointer'){ hit={x,y}; break search } } } }
let info=null
if(hit){
  await page.mouse.click(hit.x,hit.y)
  await new Promise(r=>setTimeout(r,500))
  info = await page.evaluate((hx,hy)=>{
    const ui = window.__ui ? window.__ui.get() : null
    const moon = window.__moon || {}
    const pid = ui ? ui.pinnedMoon : null
    const pos = pid ? moon[pid] : null
    const card=[...document.querySelectorAll('.glass-card')].find(d=>/pinned · click to close/.test(d.textContent||''))
    let cardPos=null; if(card){const r=card.getBoundingClientRect(); cardPos={cx:Math.round(r.x+r.width/2),cy:Math.round(r.y+r.height/2)}}
    return { pinnedMoon:pid, hoveredMoon: ui?ui.hoveredMoon:null, projected:pos, cardPos, distMouseToCard: cardPos?Math.round(Math.hypot(cardPos.cx-hx,cardPos.cy-hy)):null }
  }, hit.x, hit.y)
  await page.screenshot({ path:'/tmp/f_moon.png' })
}
console.log(JSON.stringify({ hit, info }))
await browser.close()
