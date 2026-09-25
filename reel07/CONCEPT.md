# Reel 07 — Guess The Score (concept for approval)

**Format:** 9:16 Reel / Short, 30–36 seconds maximum 40, Hindi voice with clear Hindi/English on-screen captions.

**Current cultural reference:** Netflix lists a 2026 season of Samay Raina's *India's Got Latent* and describes contestants predicting their own scores. This build borrows the broad idea of guessing a score, with a separate original game, fictional judges, and no clips, show graphics, voices, logo, likenesses, or implied affiliation. Verify any current show claim at publication time.

## The build

An original one-page “Guess The Score” game. Select a deliberately silly talent, predict a score from 0–10, tap Reveal, watch three fictional score cards pop, and compare the rounded average with the guess. The working starter in `index.html` uses deterministic sample scores from `model.mjs`. AI assists with the code, but the runtime scores are not AI evaluations. Adapt the game to use real judging logic only when a real input and reliable evaluator exist.

## Hook and scene map

| Time target | Audio (Hindi) | Visual action | Purpose |
| --- | --- | --- | --- |
| 0–3s | “मैंने अपने टैलेंट को नौ नंबर दिए... जजों ने छह!” | First frame: giant **9 → 6**, buzzer, three score cards flip; label “काल्पनिक गेम” small but readable. | Result first, then curiosity. |
| 3–6s | “क्या तुम्हारा अंदाज़ा सही होगा?” | Choice: “पाँच अलार्म बंद करके भी सो जाना”; thumb taps 9/10. | Viewer challenge. |
| 6–11s | “समय के शो के स्कोर-गेस आइडिया से, AI की मदद से अपना गेम बनाया।” | Short text prompt and page skeleton flash: act selector + self-score + reveal. | State what we teach. |
| 11–18s | “AI को बोला: तीन जज के कार्ड, एक औसत, और मेरा अनुमान दिखाओ।” | One concise build prompt, then actual HTML/game running. | Show creation, not just explanation. |
| 18–27s | “ये देखो: तीन, नौ, पाँच। औसत छह। मेरा अंदाज़ा नौ... गलत!” | Cards pop 3 / 9 / 5; arithmetic (3+9+5)/3 ≈ 5.67 rounds to 6. | Honest result and visible interaction. |
| 27–34s | “अपना टैलेंट लिखो—कितने नंबर मिलेंगे? कोड और प्रॉम्प्ट कैप्शन में।” | Second act teaser, comment prompt, source cue. | Participation and save value. |

## Hindi voice and edit plan

- Start with `hi-IN-Chirp3-HD-Charon`, a Google listed Hindi voice; judge the actual sound in a private render. Use Hindi in Devanagari for narration and avoid trying to mimic Samay Raina or any real person.
- Use quick score-card action and a sound sting in the first 2 seconds, then readable holds. Avoid a long title card or logo lead-in.
- Total duration comes from measured speech. If it exceeds 40 seconds, shorten narration and re-render; do not accelerate speech unnaturally.
- Cover: **“मैंने दिए 9... जजों ने 6!”** with original score UI, no show imagery.

## Success check after publication

Compare reach, views, average watch time, three-second view rate, shares, and saves for this Reel against the earlier posts after a comparable time window. The connected Metricool account is `hififaa` rather than `@buildwith_pankaj`, so its analytics must not be used for this diagnosis. Views alone cannot identify the cause of low reach.
