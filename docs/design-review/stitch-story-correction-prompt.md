# תיקון פלט Stitch — 9.10.2026

נשלח באמצעות `edit_screens` לשלושת מסכי הסבב החדש לאחר בדיקת הפלט. הבריף המדויק:

Correct the three selected review screens. Keep titles, palette and basic style. These are required corrections based on inspection of actual output:
1. Mobile screen ff4a6bb55e784658b22fb57f170f546a currently ENDS immediately after hero: its main contains only hero then comment for section2 and closing main. REBUILD as a COMPLETE full-height landing page with ALL story sections: hero, difficulty, explanation+3 numbered steps, personal introduction, material gallery, honest empty testimonial slot, suitability, FAQ BEFORE disabled demo offer, personal closing, sticky CTA. Do not return hero-only. Screenshot must show full page, not single viewport. Same exact story as wide, responsive 390px and resilient 320px.
2. Wide screen edbdddf667d7421198c4031de91f9422 wrongly uses kickers “השגרה היומיומית” over difficulty and “שאלות ותשובות” over FAQ. REMOVE those entirely. Kickers ONLY hero context, basis/process, person, demo, empty social proof, invitation. No kicker for difficulty, suitability, FAQ, final.
3. Wide reading containers max-w680 are too wide relative to original brief. Use centered 512px outer reading frame (480px usable) on wide; catalog can be wide. Same reusable scale on mobile.
4. All screens: remove invented claims like “מבוסס על שנות ניסיון במערכת החינוך והדרכת משפחות”, “ליווי מקצועי”, “ללא התחייבות”, “התנסות” as commercial offer, and “פותח מתוך הקשבה”. No credentials or trial terms were supplied. Generic actions: “לפרטי הדוגמה” scroll to offer, “איך זה עובד?” scroll process. Generic intro “כאן נכיר את מי שמלווה את הלמידה — תוכן לדוגמה”. Disabled form name/email only, no added grade field required.
5. Neutral media placeholders must be actual flat labelled illustrative boxes/symbols, NOT realistic photos of people with “איור” label. Remove realistic photos in catalog and pages. Owner chooses actual media in EmDash later.
6. Use genuinely everyday generic body copy: replace “מגלים מחדש את חדוות הסקרנות הטבעית...” with “רואים דוגמה, מנסים יחד וחוזרים כשצריך. כאן אפשר לבדוק איך הדף נראה עם טקסט קצר וברור.” Catalog annotations may be technical, page visitor copy must be conversational.
7. Retain honest empty social proof “כאן תופיע עדות מאושרת” without invented quotes/names. All forms fully disabled, no external embeds/payment/posting. Preserve all catalog independent framed block and element specimens and actual CMS names. Final page prototype clearly labelled “תוכן לדוגמה”.
Return 3 COMPLETE corrected screens with screenshot and HTML.

Co-authored-by: Codex <codex@openai.com>
