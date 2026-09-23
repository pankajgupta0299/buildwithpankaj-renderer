import fs from 'node:fs/promises';

const BASE=(process.env.PRIVATE_MEDIA_BASE_URL||'').trim();
const TOKEN=(process.env.PRIVATE_MEDIA_TOKEN||'').trim();
if(!BASE||!TOKEN) throw new Error('Missing private media secrets');

const marker=(await fs.readFile('cleanup-r2-trigger.txt','utf8')).trim();
const keys=marker==='cleanup-discarded-reel04-20260923'
  ? ['draft-run-35863604573.mp4','draft-run-35864721504.mp4','draft-run-35885337813.mp4']
  : null;

if(keys){
  const results=[];
  for(const key of keys){
    const url=`${BASE}/media/${encodeURIComponent(key)}`;
    const r=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${TOKEN}`}});
    if(!r.ok && r.status!==404) throw new Error(`Discarded R2 delete failed for ${key}: HTTP ${r.status}`);
    const verify=await fetch(url,{method:'HEAD',headers:{Authorization:`Bearer ${TOKEN}`}});
    if(verify.status!==404) throw new Error(`Discarded R2 cleanup verification failed for ${key}: HEAD ${verify.status}`);
    results.push({key,deleteStatus:r.status,headStatus:verify.status});
  }
  console.log(JSON.stringify({ok:true,discarded:true,results},null,2));
  process.exit(0);
}

const pkg=JSON.parse(await fs.readFile(process.env.PUBLISH_PACKAGE_PATH||'publish-package.json','utf8'));
if(pkg.brand!=='BuildWithPankaj'||pkg.destination!=='@buildwith_pankaj') throw new Error('Wrong package identity');
if(!pkg.approved||pkg.status!=='approved') throw new Error('Package is not approved');

const results=[];
for(const asset of pkg.assets||[]){
  const url=`${BASE}/media/${encodeURIComponent(asset.key)}`;
  const r=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${TOKEN}`}});
  const body=await r.text();
  if(!r.ok && r.status!==404 && r.status!==405) throw new Error(`R2 delete failed for ${asset.key}: HTTP ${r.status} ${body}`);
  const verify=await fetch(url,{method:'HEAD',headers:{Authorization:`Bearer ${TOKEN}`}});
  results.push({key:asset.key,deleteStatus:r.status,headStatus:verify.status,deleted:verify.status===404});
  if(verify.status!==404) throw new Error(`R2 cleanup verification failed for ${asset.key}: HEAD ${verify.status}`);
}
console.log(JSON.stringify({ok:true,count:results.length,results},null,2));
