import React from 'react';
import {
  AbsoluteFill,
  Composition,
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
};

const DEFAULT_SPEC = {
  eyebrow: 'BUILDWITHPANKAJ',
  headline: 'Professionals can\nbuild with AI.',
  body: 'Reusable 1080×1920 Reel rendering engine.',
  footer: '@buildwith_pankaj',
  badge: 'PRIVATE DRAFT • NOT FOR PUBLISHING',
};

const Reel = (props) => {
  const spec = {...DEFAULT_SPEC, ...props};
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const entrance = spring({frame, fps, config: {damping: 18}});
  const y = interpolate(entrance, [0, 1], [70, 0]);
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 45, durationInFrames - 1],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.white,
        fontFamily: 'Arial, sans-serif',
        padding: 110,
        justifyContent: 'center',
        opacity,
      }}
    >
      <div style={{fontSize: 34, letterSpacing: 4, color: BRAND.olive, fontWeight: 700, marginBottom: 35}}>
        {spec.eyebrow}
      </div>
      <div
        style={{
          fontSize: 94,
          lineHeight: 1.04,
          fontWeight: 800,
          color: BRAND.charcoal,
          transform: `translateY(${y}px)`,
          whiteSpace: 'pre-line',
        }}
      >
        {spec.headline}
      </div>
      <div style={{width: 180, height: 14, backgroundColor: BRAND.olive, borderRadius: 20, marginTop: 48}} />
      <div style={{fontSize: 38, lineHeight: 1.35, color: BRAND.body, marginTop: 45, maxWidth: 780}}>
        {spec.body}
      </div>
      <div style={{position: 'absolute', bottom: 90, left: 110, fontSize: 30, color: '#555'}}>
        {spec.footer} · {spec.badge}
      </div>
    </AbsoluteFill>
  );
};

const Root = () => (
  <Composition
    id="BuildWithPankajReel"
    component={Reel}
    durationInFrames={900}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={DEFAULT_SPEC}
  />
);

registerRoot(Root);
