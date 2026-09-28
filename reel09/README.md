# Reel 09 — Fridge to Plate

Working mobile web demo. Run `python3 -m http.server 8000` from the renderer root and open `/reel09/`.

The fridge image is illustrative, and its ingredients are sample entries that the viewer can edit. The app filters a small local recipe library by ingredients, preference and time; it lists missing items and changes the inventory when a complete meal is selected. It does **not** use a live AI model, recognize food from photos, infer freshness, calculate nutrition, or prescribe a diet. AI assisted construction of the mini app. No account or API key is needed.

Build prompt for viewers: “Create a mobile-first Fridge to Plate app in HTML, CSS and JavaScript. Let me edit an ingredient inventory, choose vegetarian or vegan and a time limit, then rank matching meals from a small local recipe dataset. Show exactly which required ingredients are missing. Let me mark a complete meal as cooked and remove its required ingredients from the inventory. Keep all data local, never claim to infer freshness or exact nutrition from a photo, and label it as general meal ideas rather than a medical diet plan. Include sample recipes and local run instructions.”
