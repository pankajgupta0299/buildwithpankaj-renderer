// Original fictional pitches. This deterministic starter needs no API key.
const worlds = {
  bollywood: {
    label: 'BOLLYWOOD',
    title: 'The Last Train to Monsoon',
    genre: 'Musical romance · mystery',
    logline: 'When Mira misses the last train home, a stranger with a borrowed umbrella leads her through a rain-soaked city—and toward a song she thought her mother had forgotten.',
    palette: ['#A5432B','#F4BD66'],
    motif: 'rain · music · family',
  },
  hollywood: {
    label: 'HOLLYWOOD',
    title: 'LAST DEPARTURE',
    genre: 'Night-time thriller',
    logline: 'A stranded commuter finds a phone left on the platform. It rings once: the caller knows which train will disappear before sunrise.',
    palette: ['#182D3C','#5FA8B5'],
    motif: 'one call · one night · no way out',
  },
};

export function generatePitch(situation, style) {
  const idea = String(situation || '').trim();
  if (!idea) throw new Error('Enter an everyday situation.');
  if (!worlds[style]) throw new Error('Choose Bollywood or Hollywood.');
  if (idea.toLowerCase() === 'i missed the last train') return {situation:idea, ...worlds[style]};
  const phrase = idea.replace(/[.!?]+$/,'').slice(0,65);
  const keyword = phrase.split(/\s+/).at(-1).replace(/[^A-Za-z0-9]/g,'');
  const title = style === 'bollywood' ? `The ${keyword[0]?.toUpperCase() + keyword.slice(1) || 'Moment'} That Changed Everything` : `${keyword.toUpperCase() || 'ONE NIGHT'}: AFTER DARK`;
  const logline = style === 'bollywood'
    ? `It starts with “${phrase}.” An unlikely friendship turns a small setback into a colorful night of music, family, and second chances.`
    : `It starts with “${phrase}.” An ordinary night becomes a race against time when a hidden clue reveals that nothing happened by accident.`;
  return {situation:idea, ...worlds[style], title, logline};
}
