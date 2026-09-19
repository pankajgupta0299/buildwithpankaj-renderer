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
  captions: [
    {startFrame: 12, endFrame: 110, text: 'BUILD WITH AI'},
    {startFrame: 355, endFrame: 455, text: 'REAL DEMOS'},
    {startFrame: 585, endFrame: 705, text: 'CLEAR CAPTIONS'}
  ]
};

const Fade = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(frame,[0,12,Math.max(13,durationInFrames-12),durationInFrames-1],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
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

const MediaPane = ({scene}) => {
  const common={width:820,height:680,borderRadius:42,objectFit:'cover'};
  if(scene.mediaSrc && scene.mediaKind==='video') return <OffthreadVideo src={scene.mediaSrc} muted style={common}/>;
  if(scene.mediaSrc && scene.mediaKind==='image') return <Img src={scene.mediaSrc} style={common}/>;
  return <div style={{...common,backgroundColor:BRAND.soft,border:'3px solid #DDDCCF',display:'flex',alignItems:'center',justifyContent:'center',color:BRAND.olive,fontSize:34,fontWeight:700,letterSpacing:2}}>MEDIA / SCREEN RECORDING</div>;
};

const Scene = ({scene, footer, badge}) => {
  return <Fade>
    <AbsoluteFill style={{backgroundColor:BRAND.white,fontFamily:'Arial, sans-serif',padding:'120px 110px 150px',justifyContent:'center'}}>
      {scene.type==='title' && <TextBlock eyebrow={scene.eyebrow || 'BUILDWITHPANKAJ'} headline={scene.headline} body={scene.body}/>}
      {scene.type==='text' && <TextBlock headline={scene.headline} body={scene.body}/>}
      {scene.type==='media' && <div><TextBlock headline={scene.headline} body={scene.body}/><div style={{marginTop:55}}><MediaPane scene={scene}/></div></div>}
      {scene.type==='cta' && <div style={{backgroundColor:BRAND.soft,borderRadius:48,padding:70}}><TextBlock eyebrow="BUILDWITHPANKAJ" headline={scene.headline} body={scene.body}/></div>}
      <div style={{position:'absolute',bottom:72,left:110,fontSize:28,color:'#555'}}>{footer} · {badge}</div>
    </AbsoluteFill>
  </Fade>;
};

const CaptionLayer = ({captions=[]}) => {
  const frame = useCurrentFrame();
  const active=captions.find(c=>frame>=c.startFrame && frame<=c.endFrame);
  if(!active) return null;
  return <div style={{position:'absolute',left:90,right:90,bottom:190,display:'flex',justifyContent:'center',pointerEvents:'none'}}>
    <div style={{backgroundColor:BRAND.charcoal,color:BRAND.white,borderRadius:24,padding:'18px 30px',fontFamily:'Arial, sans-serif',fontSize:42,fontWeight:800,letterSpacing:1,textAlign:'center',maxWidth:860}}>
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
    {spec.audioSrc ? <Audio src={spec.audioSrc}/> : null}
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
