// search.js - Fuse.js wrapper
const fuseOpts = {
  includeScore: true,
  threshold: 0.26,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: true,
  keys: [
    { name: 'name', weight: 0.8 },
    { name: 'bundleIdentifier', weight: 0.2 }
  ]
};
let fuse = null;
let allApps = [];

export function initSearch(apps){
  allApps = (apps||[]).slice();
  fuse = new Fuse(allApps, fuseOpts);
  return fuse;
}

export function addApps(apps){
  if(!apps || !apps.length) return;
  apps.forEach(app => {
    if (app.versions && app.versions.length) {
      app.versions.forEach(v => {
        // Create a new object for each version, merging app-level and version-level data
        allApps.push({ ...app, ...v, _isVersion: true });
      });
    } else {
      // If no versions array, treat the app itself as a single version
      allApps.push({ ...app, _isVersion: true });
    }
  });
  if(!fuse) fuse = new Fuse(allApps, fuseOpts);
  else fuse.add(allApps); // Add all new flattened apps to Fuse
}

export function searchApps(q, appsToSearch = allApps, limit=50){
  q = (q||'').trim();
  const targetApps = appsToSearch || allApps;
  if(!q) return targetApps.slice(0, limit);

  // Re-initialize Fuse with the targetApps if it's different from allApps
  let currentFuse = fuse;
  if (targetApps !== allApps) {
    currentFuse = new Fuse(targetApps, fuseOpts);
  }

  const raw = currentFuse.search(q, { limit: limit * 2 });
  const qLower = q.toLowerCase();
  const scored = raw.map(r=>{
    const item = r.item;
    let rel = 1 - (r.score ?? 1);
    if(item.name && item.name.toLowerCase() === qLower) rel += 0.7;
    else if(item.name && item.name.toLowerCase().startsWith(qLower)) rel += 0.4;
    else if(item.name && item.name.toLowerCase().includes(qLower)) rel += 0.18;
    return { item, rel };
  }).sort((a,b)=>b.rel - a.rel).slice(0, limit).map(r=>r.item);
  return scored;
}
