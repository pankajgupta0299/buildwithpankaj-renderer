import fs from 'node:fs/promises';

const BASE=(process.env.PRIVATE_MEDIA_BASE_URL||'').trim();
const TOKEN=(process.env.PRIVATE_MEDIA_TOKEN||'').trim();
if(!BASE||!TOKEN) throw new Error('Missing private media secrets');

const pkg=JSON.parse(await fs.readFile(process.env.PUBLISH_PACKAGE_PATH||'publish-package.json','utf8'));
if(pkg.brand!=='BuildWithPankaj'||pkg.destination!=='@buildwith_pankaj') throw new Error('Wrong package identity');
if(!pkg.approved||pkg.status!=='approved') throw new Error('Package is not approved');

const results=[];
for(const asset of pkg.assets||[]){
  const url=`${BASE}/media/${encodeURIComponent(asset.key)}`;
  const r=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${TOKEN}`}});
  const body=await r.text();
  if(!r.ok && r.status!==404) throw new Error(`R2 delete failed for ${asset.key}: HTTP ${r.status} ${body}`);
  results.push({key:asset.key,status:r.status,deleted:r.ok||r.status===404});
}
console.log(JSON.stringify({ok:true,count:results.length,results},null,2));
