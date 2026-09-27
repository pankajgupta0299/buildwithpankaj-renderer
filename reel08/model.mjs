export const pitches = {
  'horror|shaadi': {
    title: 'BHOOT KI BARAAT',
    line: 'Shaadi mein dulha toh aaya... baraati 100 saal purane nikle.',
    twist: 'Dulhan hi sabse badi ghost hunter hai.',
    poster: 'poster.jpg',
  },
  'romance|sci-fi': {
    title: 'KAL KI DATE',
    line: 'Dating app ne uski match 2076 se bhej di.',
    twist: 'Future wali match, present ka app banane aayi hai.',
  },
  'comedy|mystery': {
    title: 'CHAI KA CASE',
    line: 'Office ki chai gayab. Detective intern ka pehla case.',
    twist: 'Chai machine khud chhutti par thi.',
  },
};

export function pitchFor(a,b){
  const key=[a,b].sort().join('|');
  if(!pitches[key]) throw new Error('Pick a supported genre pair');
  return pitches[key];
}
