# Reel 07 · Guess The Score

Private Hindi review cut. A one-page original score-guessing game inspired by the broad audience-guess format, without footage, names, graphics, or claims of show affiliation. The 0–10 sample scores are predetermined; AI assists in making the page and does not judge performances at runtime.

## What viewers learn

Ask an AI coding assistant for a mobile page with a talent selector, self-score input, reveal button, three judge cards, and rounded average. Then enter an act, predict 9, reveal the sample scores 3, 9, 5, and verify the average rounds to 6. The animated review Reel matches the starter in `index.html` and `model.mjs`.

## Copyable prompt

> एक मोबाइल-फ्रेंडली वेब गेम बनाओ। यूज़र एक मज़ेदार काल्पनिक टैलेंट चुने, 0 से 10 तक अपना स्कोर गेस करे, फिर Reveal दबाए। तीन काल्पनिक जजों के पहले से तय sample scores अलग कार्ड में दिखाओ, उनका औसत निकालकर nearest integer पर round करो, और यूज़र के अनुमान से फर्क बताओ। कम से कम तीन एक्ट डालो। HTML, CSS और JavaScript की तीन सरल फ़ाइलों में बनाओ; बिना API key के चलना चाहिए। UI में स्पष्ट लिखो कि scores sample हैं, live AI judging नहीं। मोबाइल पर बड़े readable text और button रखो।

## Review caption draft

मैंने खुद को 9 दिए। जजों का औसत 6 निकला! 😅

AI से अपना **Guess The Score** mini game बनाने के लिए ऊपर वाला prompt इस्तेमाल करो। पहले एक talent picker, 0–10 guess और Reveal button बनाओ। फिर sample scores 3, 9, 5 जोड़कर rounded average दिखाओ। इस demo में scores पहले से तय हैं; AI कोई real performance judge नहीं कर रहा।

तुम्हारा ऐसा कौन-सा टैलेंट है और कितने नंबर दोगे? 👇

#BuildWithPankaj #BuildWithAI #AIGame #CreativeCoding #HindiTech

## Demo

From this repository root, run `python3 -m http.server 8000` and visit `/reel07/`.
