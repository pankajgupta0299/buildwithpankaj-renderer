import fs from 'node:fs/promises';

const BASE=(process.env.PRIVATE_MEDIA_BASE_URL||'').trim();
const TOKEN=(process.env.PRIVATE_MEDIA_TOKEN||'').trim();
if(!BASE||!TOKEN) throw new Error('Missing private media secrets');

const pkg=JSON.parse(await fs.readFile(process.env.PUBLISH_PACKAGE_PATH||'publish-package.json','utf8'));
if(pkg.brand!=='BuildWithPankaj'||pkg.destination!=='@buildwith_pankaj') throw new Error('Wrong package identity');
if(!pkg.approved||pkg.status!=='approved') throw new Error('Package is not approved');

const results=[];
for(const key of [...(pkg.assets||[]).map(asset=>asset.key),'draft-run-36023163561.mp4']){
  const url=`${BASE}/media/${encodeURIComponent(key)}`;
  const r=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${TOKEN}`}});
  const body=await r.text();
  if(!r.ok && r.status!==404 && r.status!==405) throw new Error(`R2 delete failed for ${key}: HTTP ${r.status} ${body}`);
  const verify=await fetch(url,{method:'HEAD',headers:{Authorization:`Bearer ${TOKEN}`}});
  results.push({key,deleteStatus:r.status,headStatus:verify.status,deleted:verify.status===404});
  if(verify.status!==404) throw new Error(`R2 cleanup verification failed for ${key}: HEAD ${verify.status}`);
}
console.log(JSON.stringify({ok:true,count:results.length,results},null,2));
