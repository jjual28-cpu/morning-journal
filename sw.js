var C='mm-v1';
var A=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(A)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){if(k!==C)return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request).then(function(res){var cp=res.clone();caches.open(C).then(function(c){c.put(e.request,cp)});return res}).catch(function(){return caches.match('./index.html')})}));
});
