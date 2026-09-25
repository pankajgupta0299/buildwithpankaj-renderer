// Original fictional score-guessing demo. Scores are deterministic, not live AI judgments.
export const acts = [
  {id:'alarm',label:'पाँच अलार्म बंद करके भी सो जाना',short:'Snooze champion',scores:[3,9,5],reaction:'एक जज को नींद की कला पसंद आ गई।'},
  {id:'chai',label:'चाय देखकर मौसम बताना',short:'Chai weather forecast',scores:[8,4,7],reaction:'जजों को चाय पसंद आई, भविष्यवाणी कम।'},
  {id:'dance',label:'लिफ्ट में अकेले डांस करना',short:'Elevator dance',scores:[6,8,7],reaction:'सात अंक! लिफ्ट के सीसीटीवी को सलाम।'},
];

export function judge(actId,prediction){
  const act=acts.find(a=>a.id===actId);
  if(!act) throw new Error('Choose a valid act.');
  const guess=Number(prediction);
  if(!Number.isInteger(guess)||guess<0||guess>10) throw new Error('Guess must be an integer from 0 to 10.');
  const total=act.scores.reduce((a,b)=>a+b,0);
  const average=Math.round(total/act.scores.length);
  return {act,guess,scores:[...act.scores],average,difference:Math.abs(guess-average),match:guess===average,reaction:act.reaction};
}
