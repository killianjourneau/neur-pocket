// Neur Pocket — service worker : hors ligne + isolation cross-origin (requise par le moteur GBA)
const CACHE='neurpocket-2.2.1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./mgba.js','./mgba.wasm'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
function isolate(res){
  if(!res||res.status===0||res.type==='opaque')return res;
  const h=new Headers(res.headers);
  h.set('Cross-Origin-Embedder-Policy','require-corp');
  h.set('Cross-Origin-Opener-Policy','same-origin');
  h.set('Cross-Origin-Resource-Policy','same-origin');
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h});
}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  if(r.cache==='only-if-cached'&&r.mode!=='same-origin')return;
  const same=new URL(r.url).origin===self.location.origin;
  if(!same)return;
  const heavy=/mgba\.(js|wasm)$/.test(r.url);
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(heavy){const c=await cache.match(r);if(c)return isolate(c);}
    try{const res=await fetch(r);if(res.ok)cache.put(r,res.clone());return isolate(res);}
    catch(err){const c=await cache.match(r)||await cache.match('./index.html');return isolate(c);}
  })());
});
