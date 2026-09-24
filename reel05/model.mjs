export const csv = `date,item,quantity,unit_price,revenue
2026-09-01,Cold Brew,3,150,450
2026-09-01,Iced Latte,2,180,360
2026-09-01,Matcha,1,220,220
2026-09-01,Cold Brew,1,150,150
2026-09-01,Iced Latte,3,180,540
2026-09-01,Matcha,2,220,440
2026-09-02,Cold Brew,2,150,300
2026-09-02,Iced Latte,1,180,180
2026-09-02,Matcha,3,220,660
2026-09-02,Cold Brew,4,150,600
2026-09-02,Iced Latte,2,180,360
2026-09-02,Matcha,1,220,220`;

export function parseCsv(input) {
  const lines = String(input).trim().split(/\r?\n/).map(line => line.split(','));
  const expected = ['date','item','quantity','unit_price','revenue'];
  if (lines.length < 2 || expected.some((x,i) => lines[0][i]?.trim() !== x)) throw new Error('Expected date,item,quantity,unit_price,revenue columns');
  return lines.slice(1).map((cells,i) => {
    if (cells.length !== 5) throw new Error(`Invalid row ${i+2}`);
    const [date,item,quantity,unit_price,revenue] = cells.map(x=>x.trim());
    const q=Number(quantity), price=Number(unit_price), amount=Number(revenue);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !item || ![q,price,amount].every(Number.isFinite) || q<=0 || price<0 || amount!==q*price) throw new Error(`Invalid values in row ${i+2}`);
    return {date,item,quantity:q,unit_price:price,revenue:amount};
  });
}

export function summarize(rows, day='all') {
  const selected=day==='all'?rows:rows.filter(row=>row.date===day);
  const byItem={};
  for (const row of selected) byItem[row.item]=(byItem[row.item]||0)+row.revenue;
  const products=Object.entries(byItem).map(([item,revenue])=>({item,revenue})).sort((a,b)=>b.revenue-a.revenue || a.item.localeCompare(b.item));
  return {day,rows:selected,orders:selected.length,revenue:selected.reduce((n,row)=>n+row.revenue,0),products,top:products[0]||null};
}

export const sampleRows=parseCsv(csv);
