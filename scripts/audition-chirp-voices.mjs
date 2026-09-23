import {execFileSync} from 'node:child_process';
const required=['DROPBOX_APP_KEY','DROPBOX_APP_SECRET','DROPBOX_REFRESH_TOKEN','GOOGLE_CLOUD_PROJECT_ID'];
for(const k of required) if(!process.env[k]) throw new Error('Missing private configuration: '+k);
const sample='Three action items disappeared inside these meeting notes. One had no owner. Another had no deadline. The third was never followed up. Let us turn them into a clear action list.';
const token=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
const basic=Buffer.from(process.env.DROPBOX_APP_KEY+':'+process.env.DROPBOX_APP_SECRET).toString('base64');
const auth=await fetch('https://api.dropbox.com/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+basic,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:process.env.DROPBOX_REFRESH_TOKEN})});
if(!auth.ok) throw new Error('Private storage authentication failed: '+auth.status);
const {access_token:dbxToken}=await auth.json();
if(!dbxToken) throw new Error('Missing private storage token');
for(const name of ['Charon','Orus']){
  const voice='en-IN-Chirp3-HD-'+name;
  const response=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','X-Goog-User-Project':process.env.GOOGLE_CLOUD_PROJECT_ID},body:JSON.stringify({input:{text:sample},voice:{languageCode:'en-IN',name:voice},audioConfig:{audioEncoding:'MP3'}})});
  if(!response.ok) throw new Error(voice+' synthesis failed: HTTP '+response.status);
  const payload=await response.json();
  if(!payload.audioContent) throw new Error(voice+' returned no audio');
  const bytes=Buffer.from(payload.audioContent,'base64');
  if(bytes.length<1000) throw new Error(voice+' audio unexpectedly small');
  const path='/BUILDWITHPANKAJ/Instagram-Staging/Voice-Audition-'+name+'.mp3';
  const upload=await fetch('https://content.dropboxapi.com/2/files/upload',{method:'POST',headers:{Authorization:'Bearer '+dbxToken,'Dropbox-API-Arg':JSON.stringify({path,mode:'overwrite',autorename:false,mute:true}),'Content-Type':'application/octet-stream'},body:bytes});
  if(!upload.ok) throw new Error(voice+' private copy failed: HTTP '+upload.status);
  const saved=await upload.json();
  if(saved.size!==bytes.length) throw new Error(voice+' copy size mismatch');
  console.log(voice+' audio verified ('+saved.size+' bytes)');
}
