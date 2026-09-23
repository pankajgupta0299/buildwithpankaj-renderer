import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  registerRoot,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';

const BRAND = {
  olive: '#6B6F2A',
  charcoal: '#202020',
  body: '#444444',
  white: '#FFFFFF',
  soft: '#F3F3EE',
};

const DEFAULT_SPEC = {
  footer: '@buildwith_pankaj',
  badge: 'PRIVATE DRAFT • NOT FOR PUBLISHING',
  audioSrc: null,
  scenes: [
    {type: 'title', durationFrames: 150, eyebrow: 'BUILDWITHPANKAJ', headline: 'Professionals can\nbuild with AI.', body: 'A reusable multi-scene Reel engine.'},
    {type: 'text', durationFrames: 180, headline: 'One idea.\nOne clear scene.', body: 'Each scene has its own timing, layout and animation.'},
    {type: 'media', durationFrames: 240, headline: 'Screen recordings, images and demos', body: 'Private media will be injected later through the secure backend.', mediaKind: 'placeholder'},
    {type: 'text', durationFrames: 180, headline: 'Animated captions', body: 'Captions can appear at exact frames and stay inside mobile-safe areas.'},
    {type: 'cta', durationFrames: 150, headline: 'Build. Test. Improve.', body: 'Final publishing remains locked until explicit approval.'}
  ],
  captions: []
};

const Fade = ({children, fast=false}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const edge = fast ? 3 : 8;
  const opacity = interpolate(frame,[0,edge,Math.max(edge+1,durationInFrames-edge),durationInFrames-1],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const TextBlock = ({eyebrow, headline, body, align='left'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame,fps,config:{damping:18}});
  const y = interpolate(enter,[0,1],[55,0]);
  return <div style={{transform:`translateY(${y}px)`,textAlign:align}}>
    {eyebrow ? <div style={{fontSize:32,letterSpacing:4,color:BRAND.olive,fontWeight:700,marginBottom:28}}>{eyebrow}</div> : null}
    <div style={{fontSize:88,lineHeight:1.04,fontWeight:800,color:BRAND.charcoal,whiteSpace:'pre-line'}}>{headline}</div>
    {body ? <div style={{fontSize:38,lineHeight:1.38,color:BRAND.body,marginTop:36,maxWidth:820}}>{body}</div> : null}
  </div>;
};

const mediaSrc = (scene) => scene.mediaSrc ? staticFile(scene.mediaSrc) : null;
const mediaSrc2 = (scene) => scene.mediaSrc2 ? staticFile(scene.mediaSrc2) : null;

const FullImage = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const zoom = interpolate(frame,[0,Math.max(1,durationInFrames-1)],[1.02,1.075],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{backgroundColor:'#111',overflow:'hidden'}}>
    {scene.mediaSrc ? <Img src={mediaSrc(scene)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`}}/> : null}
    <AbsoluteFill style={{background:'linear-gradient(180deg, rgba(0,0,0,.10) 40%, rgba(0,0,0,.56) 100%)'}}/>
    {scene.kicker ? <div style={{position:'absolute',top:125,left:72,right:72,color:BRAND.white,fontFamily:'Arial,sans-serif',fontSize:42,fontWeight:800,textShadow:'0 2px 12px rgba(0,0,0,.35)'}}>{scene.kicker}</div> : null}
    {scene.label ? <div style={{position:'absolute',bottom:155,left:72,right:72,color:BRAND.white,fontFamily:'Arial,sans-serif',fontSize:58,lineHeight:1.05,fontWeight:900,textShadow:'0 2px 14px rgba(0,0,0,.45)'}}>{scene.label}</div> : null}
  </AbsoluteFill>;
};

const SplitReveal = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = interpolate(frame,[0,Math.max(1,durationInFrames-1)],[0.18,0.82],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const divider = `${progress*100}%`;
  return <AbsoluteFill style={{backgroundColor:'#111',overflow:'hidden'}}>
    {scene.mediaSrc ? <Img src={mediaSrc(scene)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/> : null}
    {scene.mediaSrc2 ? <div style={{position:'absolute',inset:0,clipPath:`inset(0 ${100-progress*100}% 0 0)`}}>
      <Img src={mediaSrc2(scene)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
    </div> : null}
    <div style={{position:'absolute',top:0,bottom:0,left:divider,width:5,backgroundColor:BRAND.white,boxShadow:'0 0 18px rgba(0,0,0,.35)'}}/>
    <div style={{position:'absolute',top:110,left:55,padding:'12px 20px',borderRadius:999,backgroundColor:'rgba(0,0,0,.68)',color:BRAND.white,fontFamily:'Arial,sans-serif',fontSize:32,fontWeight:800}}>2026</div>
    <div style={{position:'absolute',top:110,right:55,padding:'12px 20px',borderRadius:999,backgroundColor:'rgba(107,111,42,.92)',color:BRAND.white,fontFamily:'Arial,sans-serif',fontSize:32,fontWeight:800}}>1985</div>
    {scene.label ? <div style={{position:'absolute',bottom:135,left:65,right:65,textAlign:'center',color:BRAND.white,fontFamily:'Arial,sans-serif',fontSize:52,fontWeight:900,textShadow:'0 2px 16px rgba(0,0,0,.55)'}}>{scene.label}</div> : null}
  </AbsoluteFill>;
};

const PromptUI = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter=spring({frame,fps,config:{damping:18}});
  const y=interpolate(enter,[0,1],[60,0]);
  return <AbsoluteFill style={{backgroundColor:'#F7F7F3',padding:'150px 64px 140px',fontFamily:'Arial,sans-serif'}}>
    <div style={{fontSize:30,fontWeight:800,letterSpacing:2,color:BRAND.olive,marginBottom:34}}>CHATGPT</div>
    <div style={{backgroundColor:BRAND.white,border:'2px solid #E5E5DC',borderRadius:34,padding:34,boxShadow:'0 12px 42px rgba(0,0,0,.08)',transform:`translateY(${y}px)`}}>
      <div style={{fontSize:30,color:'#777',marginBottom:18}}>{scene.eyebrow || 'New message'}</div>
      <div style={{fontSize:50,lineHeight:1.17,fontWeight:800,color:BRAND.charcoal,whiteSpace:'pre-line'}}>{scene.headline}</div>
      {scene.body ? <div style={{fontSize:34,lineHeight:1.35,color:BRAND.body,marginTop:24,whiteSpace:'pre-line'}}>{scene.body}</div> : null}
      {scene.mediaSrc ? <div style={{marginTop:30,borderRadius:26,overflow:'hidden',height:470}}><Img src={mediaSrc(scene)} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div> : null}
    </div>
    {scene.pills?.length ? <div style={{display:'flex',flexWrap:'wrap',gap:14,marginTop:30}}>
      {scene.pills.map((p,i)=><div key={i} style={{padding:'14px 18px',backgroundColor:i===0?BRAND.olive:BRAND.white,color:i===0?BRAND.white:BRAND.charcoal,borderRadius:999,fontSize:27,fontWeight:800,border:'2px solid #E1E1D7'}}>{p}</div>)}
    </div> : null}
  </AbsoluteFill>;
};

const DetailImage = ({scene}) => {
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const zoom=interpolate(frame,[0,Math.max(1,durationInFrames-1)],[1.15,1.32],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{backgroundColor:'#111',overflow:'hidden'}}>
    {scene.mediaSrc ? <Img src={mediaSrc(scene)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`}}/> : null}
    <AbsoluteFill style={{backgroundColor:'rgba(0,0,0,.18)'}}/>
    <div style={{position:'absolute',left:62,right:62,bottom:150,display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
      {(scene.pills||[]).map((p,i)=><div key={i} style={{backgroundColor:i===1?'rgba(107,111,42,.94)':'rgba(25,25,25,.78)',color:BRAND.white,borderRadius:999,padding:'15px 20px',fontFamily:'Arial,sans-serif',fontSize:31,fontWeight:900}}>{p}</div>)}
    </div>
  </AbsoluteFill>;
};

const MediaPane = ({scene}) => {
  const common={width:820,height:680,borderRadius:42,objectFit:'cover'};
  if(scene.mediaSrc && scene.mediaKind==='video') return <OffthreadVideo src={staticFile(scene.mediaSrc)} muted style={common}/>;
  if(scene.mediaSrc && scene.mediaKind==='image') return <Img src={staticFile(scene.mediaSrc)} style={common}/>;
  return <div style={{...common,backgroundColor:BRAND.soft,border:'3px solid #DDDCCF',display:'flex',alignItems:'center',justifyContent:'center',color:BRAND.olive,fontSize:34,fontWeight:700,letterSpacing:2}}>MEDIA / SCREEN RECORDING</div>;
};

const WorkflowBeat = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const progress = spring({frame, fps, config:{damping:17, stiffness:150}});
  const lift = interpolate(progress,[0,1],[65,0]);
  const danger = scene.variant === 'gate';
  const success = scene.variant === 'success';
  const dark = danger || success;
  const bg = danger ? BRAND.charcoal : success ? BRAND.olive : BRAND.white;
  const ink = dark ? BRAND.white : BRAND.charcoal;
  const phase = interpolate(frame,[0,Math.max(1,durationInFrames-1)],[0,1],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{backgroundColor:bg,fontFamily:'Arial,sans-serif',padding:'165px 80px 190px',justifyContent:'center',overflow:'hidden'}}>
    <div style={{position:'absolute',top:120,left:80,color:dark?'#E9EBD4':BRAND.olive,fontWeight:800,fontSize:29,letterSpacing:3}}>{scene.eyebrow || 'BUILDWITHPANKAJ / REAL WORKFLOW'}</div>
    <div style={{transform:`translateY(${lift}px)`,opacity:progress}}>
      <div style={{color:ink,fontSize:scene.small ? 70 : 88,lineHeight:1.06,fontWeight:900,whiteSpace:'pre-line',letterSpacing:-3}}>{scene.headline}</div>
      {scene.body ? <div style={{color:dark?'#EEE':'#494949',fontSize:35,lineHeight:1.3,marginTop:40,maxWidth:840}}>{scene.body}</div> : null}
      {scene.panelTitle ? <div style={{marginTop:66,backgroundColor:dark?'rgba(255,255,255,.12)':BRAND.soft,border:dark?'2px solid rgba(255,255,255,.25)':'2px solid #E1E1D7',borderRadius:28,padding:'30px 32px',boxShadow:dark?'none':'0 18px 50px rgba(0,0,0,.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:18}}><div style={{fontSize:29,fontWeight:800,color:ink,letterSpacing:1}}>{scene.panelTitle}</div><div style={{fontSize:27,fontWeight:900,color:dark?'#EDEFCF':BRAND.olive}}>{scene.panelState || '● ACTIVE'}</div></div>
        <div style={{height:2,backgroundColor:dark?'rgba(255,255,255,.25)':'#D9D9CE',margin:'24px 0'}}/>
        {(scene.panelLines || []).map((line,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:20,margin:'15px 0',fontSize:33,color:ink,fontWeight:i===0?800:600,opacity:i===0?1:.82}}><span style={{width:17,height:17,borderRadius:20,backgroundColor:dark?'#F2F5CE':BRAND.olive,flexShrink:0}}/>{line}</div>)}
        {scene.panelProgress ? <div style={{height:11,backgroundColor:dark?'rgba(255,255,255,.22)':'#DADBCB',borderRadius:10,marginTop:30,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,(phase*.6+.35)*100)}%`,backgroundColor:dark?'#F2F5CE':BRAND.olive}}/></div> : null}
      </div> : null}
      {!scene.panelTitle && scene.steps?.length ? <div style={{display:'flex',flexWrap:'wrap',gap:14,marginTop:58}}>{scene.steps.map((s,i)=><div key={i} style={{backgroundColor:dark?'rgba(255,255,255,.16)':i===scene.active?BRAND.olive:BRAND.soft,color:dark?BRAND.white:i===scene.active?BRAND.white:BRAND.charcoal,borderRadius:18,padding:'18px 24px',fontSize:31,fontWeight:800}}>{s}</div>)}</div> : null}
    </div>
    <div style={{position:'absolute',bottom:145,left:80,right:80,height:8,borderRadius:8,backgroundColor:dark?'rgba(255,255,255,.2)':'#E5E5DC'}}><div style={{width:`${Math.round((scene.progress || 0.1)*100)}%`,height:'100%',backgroundColor:dark?'#fff':BRAND.olive,borderRadius:8}}/></div>
  </AbsoluteFill>;
};

const MeetingBeat = ({scene}) => {
  const frame=useCurrentFrame();
  const {fps,durationInFrames}=useVideoConfig();
  const enter=spring({frame,fps,config:{damping:18,stiffness:160}});
  const drift=interpolate(frame,[0,Math.max(1,durationInFrames-1)],[0,-24]);
  const stage=scene.stage;
  const dark=stage==='result';
  const bg=dark?BRAND.charcoal:'#F5F5EF';
  const ink=dark?BRAND.white:BRAND.charcoal;
  const card={backgroundColor:BRAND.white,border:'2px solid #DEDFD4',borderRadius:28,boxShadow:'0 16px 50px rgba(20,20,20,.1)'};
  const note=(text,i,active=false)=> <div key={i} style={{padding:'22px 24px',borderBottom:i===2?'none':'2px solid #E8E9DE',fontSize:38,lineHeight:1.25,color:BRAND.charcoal,fontWeight:active?800:500,backgroundColor:active?'#EFF0D7':'transparent'}}>{text}</div>;
  const pill=(text,emphasis=false)=> <span style={{display:'inline-block',padding:'10px 16px',borderRadius:12,backgroundColor:emphasis?BRAND.olive:'#ECEDE5',color:emphasis?'white':BRAND.charcoal,fontSize:27,fontWeight:900}}>{text}</span>;
  const trackerRow=(task,owner,due,index,highlight=false)=> <div key={index} style={{display:'grid',gridTemplateColumns:'1.7fr 1fr 1fr',gap:10,alignItems:'center',padding:'22px 18px',borderTop:'2px solid #E5E6DC',backgroundColor:highlight?'#F0F1DA':'transparent',fontSize:31,color:BRAND.charcoal}}><b>{task}</b><span>{owner}</span><span>{due}</span></div>;
  return <AbsoluteFill style={{backgroundColor:bg,fontFamily:'Arial,sans-serif',padding:'110px 68px 170px',overflow:'hidden'}}>
    <div style={{color:dark?'#D5D99E':BRAND.olive,fontSize:27,fontWeight:900,letterSpacing:3,marginBottom:38}}>BUILDWITHPANKAJ  /  AI AT WORK</div>
    <div style={{color:ink,fontSize:stage==='result'?78:76,lineHeight:1.02,fontWeight:900,letterSpacing:-2,whiteSpace:'pre-line',transform:`translateY(${(1-enter)*45}px)`,opacity:enter}}>{scene.headline}</div>
    <div style={{marginTop:55,transform:`translateY(${drift}px)`,opacity:interpolate(frame,[0,6],[0,1],{extrapolateRight:'clamp'})}}>
      {stage==='notes' && <div style={{...card,overflow:'hidden'}}><div style={{padding:'23px 25px',fontSize:28,color:BRAND.olive,fontWeight:900}}>MONDAY TEAM MEETING  /  NOTES</div>{note('Send revised proposal to Priya by Friday',0)}{note('Arjun to review the Q4 budget',1)}{note('Neha to check client sample approval',2)}</div>}
      {stage==='owner' && <div style={{...card,padding:30}}><div style={{fontSize:27,color:'#777',fontWeight:800,marginBottom:23}}>FROM MEETING NOTES</div><div style={{fontSize:48,fontWeight:900,color:BRAND.charcoal,lineHeight:1.17}}>Send revised proposal<br/>to Priya by Friday</div><div style={{marginTop:46}}>{pill('OWNER: MISSING',true)}</div></div>}
      {stage==='deadline' && <div style={{...card,padding:30}}><div style={{fontSize:27,color:'#777',fontWeight:800,marginBottom:23}}>FROM MEETING NOTES</div><div style={{fontSize:49,fontWeight:900,color:BRAND.charcoal,lineHeight:1.2}}>Arjun to review<br/>the Q4 budget</div><div style={{marginTop:46}}>{pill('DUE DATE: MISSING',true)}</div></div>}
      {stage==='before' && <div style={{...card,overflow:'hidden'}}><div style={{padding:24,fontSize:28,fontWeight:900,color:BRAND.olive}}>CURRENT ACTION TRACKER</div><div style={{padding:'18px 18px',display:'grid',gridTemplateColumns:'1.7fr 1fr 1fr',fontSize:25,fontWeight:800,color:'#777'}}><span>TASK</span><span>OWNER</span><span>DUE</span></div>{trackerRow('Proposal','—','Friday',0)}{trackerRow('Budget review','Arjun','—',1)}<div style={{padding:22,fontSize:29,fontWeight:900,color:'#A33B2E',backgroundColor:'#FFF0EB'}}>Client follow-up: NOT HERE</div></div>}
      {stage==='extract' && <div style={{...card,padding:34}}><div style={{fontSize:29,fontWeight:900,color:BRAND.olive,marginBottom:28}}>NOTES → ACTION LIST</div>{['Extract each commitment','Keep names and dates from the notes','Flag blanks; never invent them'].map((x,i)=><div key={i} style={{padding:'22px 0',borderTop:'2px solid #E5E6DC',fontSize:37,fontWeight:700,color:BRAND.charcoal}}><span style={{color:BRAND.olive,marginRight:18}}>✓</span>{x}</div>)}</div>}
      {stage==='result' && <div style={{...card,overflow:'hidden'}}><div style={{padding:24,fontSize:28,fontWeight:900,color:BRAND.olive}}>ACTION LIST  /  REVIEW THE GAPS</div><div style={{padding:'16px 18px',display:'grid',gridTemplateColumns:'1.7fr 1fr 1fr',fontSize:25,fontWeight:800,color:'#777'}}><span>TASK</span><span>OWNER</span><span>DUE</span></div>{trackerRow('Proposal','MISSING','Friday',0,true)}{trackerRow('Budget review','Arjun','MISSING',1,true)}{trackerRow('Client follow-up','Neha','MISSING',2,true)}</div>}
    </div>
    {stage==='result' && <div style={{color:'white',fontSize:38,fontWeight:900,marginTop:40}}>AI finds the gaps. You decide.</div>}
    <div style={{position:'absolute',bottom:100,left:68,right:68,height:7,backgroundColor:dark?'#5A5A53':'#E2E4D2',borderRadius:7}}><div style={{height:'100%',width:`${Math.round((scene.progress||.1)*100)}%`,backgroundColor:dark?'#D6DB97':BRAND.olive,borderRadius:7}}/></div>
  </AbsoluteFill>;
};

const Scene = ({scene, footer, badge}) => {
  if(scene.type==='meeting') return <MeetingBeat scene={scene}/>;
  if(scene.type==='workflow') return <WorkflowBeat scene={scene}/>;
  if(scene.type==='fullImage') return <Fade fast><FullImage scene={scene}/></Fade>;
  if(scene.type==='split') return <Fade fast><SplitReveal scene={scene}/></Fade>;
  if(scene.type==='promptUI') return <Fade fast><PromptUI scene={scene}/></Fade>;
  if(scene.type==='detail') return <Fade fast><DetailImage scene={scene}/></Fade>;
  return <Fade>
    <AbsoluteFill style={{backgroundColor:BRAND.white,fontFamily:'Arial, sans-serif',padding:'120px 110px 150px',justifyContent:'center'}}>
      {scene.type==='title' && <TextBlock eyebrow={scene.eyebrow || 'BUILDWITHPANKAJ'} headline={scene.headline} body={scene.body}/>}
      {scene.type==='text' && <TextBlock headline={scene.headline} body={scene.body}/>}
      {scene.type==='media' && <div><TextBlock headline={scene.headline} body={scene.body}/><div style={{marginTop:55}}><MediaPane scene={scene}/></div></div>}
      {scene.type==='cta' && <div style={{backgroundColor:BRAND.soft,borderRadius:48,padding:70}}><TextBlock eyebrow="BUILDWITHPANKAJ" headline={scene.headline} body={scene.body}/></div>}
      <div style={{position:'absolute',bottom:72,left:110,fontSize:28,color:'#555'}}>{footer}{badge ? ` · ${badge}` : ''}</div>
    </AbsoluteFill>
  </Fade>;
};

const CaptionLayer = ({captions=[]}) => {
  const frame = useCurrentFrame();
  const active=captions.find(c=>frame>=c.startFrame && frame<=c.endFrame);
  if(!active) return null;
  return <div style={{position:'absolute',left:80,right:80,bottom:92,display:'flex',justifyContent:'center',pointerEvents:'none'}}>
    <div style={{backgroundColor:'rgba(20,20,20,.86)',color:BRAND.white,borderRadius:20,padding:'14px 24px',fontFamily:'Arial, sans-serif',fontSize:38,fontWeight:800,textAlign:'center',maxWidth:900}}>
      {active.text}
    </div>
  </div>;
};

const Reel = (props) => {
  const spec={...DEFAULT_SPEC,...props};
  let cursor=0;
  return <AbsoluteFill style={{backgroundColor:BRAND.white}}>
    {spec.scenes.map((scene,index)=>{
      const from=cursor;
      cursor+=scene.durationFrames;
      return <Sequence key={index} from={from} durationInFrames={scene.durationFrames}><Scene scene={scene} footer={spec.footer} badge={spec.badge}/></Sequence>;
    })}
    <CaptionLayer captions={spec.captions}/>
    {spec.audioSrc ? <Audio src={staticFile(spec.audioSrc)}/> : null}\n    {spec.musicSrc ? <Audio src={staticFile(spec.musicSrc)} volume={spec.musicVolume ?? 0.08}/> : null}
  </AbsoluteFill>;
};

const calculateMetadata=({props})=>({
  durationInFrames:(props.scenes || DEFAULT_SPEC.scenes).reduce((sum,s)=>sum+s.durationFrames,0),
  fps:30,
  width:1080,
  height:1920,
});

const Root=()=> <Composition
  id="BuildWithPankajReel"
  component={Reel}
  durationInFrames={900}
  fps={30}
  width={1080}
  height={1920}
  defaultProps={DEFAULT_SPEC}
  calculateMetadata={calculateMetadata}
/>;

registerRoot(Root);
