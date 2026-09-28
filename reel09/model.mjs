export const sampleInventory = ['palak', 'paneer', 'dahi', 'tomato', 'lemon', 'roti'];

export const recipes = [
  {id:'wrap', name:'Palak Paneer Wrap', emoji:'🌯', minutes:20, ingredients:['palak','paneer','tomato','roti'], optional:['lemon'], tags:['vegetarian'], note:'Cook the filling and use a fresh roti.'},
  {id:'bowl', name:'Paneer Dahi Bowl', emoji:'🥣', minutes:10, ingredients:['paneer','dahi','tomato'], optional:['lemon'], tags:['vegetarian'], note:'Add chopped vegetables or a grain if available.'},
  {id:'saag', name:'Palak Tomato Saag', emoji:'🍲', minutes:25, ingredients:['palak','tomato'], optional:['roti','rice','dahi'], tags:['vegetarian','vegan'], note:'Cook thoroughly; pair with a protein and grain.'},
  {id:'raita', name:'Palak Dahi Raita', emoji:'🥗', minutes:15, ingredients:['palak','dahi','lemon'], optional:['tomato'], tags:['vegetarian'], note:'Cook and cool the palak before adding it to dahi.'},
  {id:'rice', name:'Paneer Tomato Rice', emoji:'🍚', minutes:25, ingredients:['paneer','tomato','rice'], optional:['lemon'], tags:['vegetarian'], note:'Use cooked rice only when safely stored.'},
];

export function suggestMeals(inventory, {preference='vegetarian', maxMinutes=30}={}) {
  const available=new Set(inventory.map(x=>x.trim().toLowerCase()).filter(Boolean));
  return recipes.filter(r=>r.tags.includes(preference) && r.minutes<=maxMinutes)
    .map(r=>({...r, missing:r.ingredients.filter(x=>!available.has(x)), matched:r.ingredients.filter(x=>available.has(x))}))
    .filter(r=>r.matched.length>=2)
    .sort((a,b)=>a.missing.length-b.missing.length || b.matched.length-a.matched.length || a.minutes-b.minutes);
}

export function cookMeal(inventory, recipeId) {
  const recipe=recipes.find(r=>r.id===recipeId);
  if(!recipe) throw new Error('Unknown meal');
  const available=new Set(inventory.map(x=>x.trim().toLowerCase()).filter(Boolean));
  const missing=recipe.ingredients.filter(x=>!available.has(x));
  if(missing.length) throw new Error(`Missing required ingredients: ${missing.join(', ')}`);
  return [...available].filter(x=>!recipe.ingredients.includes(x));
}
