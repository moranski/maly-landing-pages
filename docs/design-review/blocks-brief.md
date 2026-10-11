# בדיקה עיצובית ב־Google Stitch

ההצעה העדכנית נוצרה בפרויקט חדש לפי בקשת בעל האתר, עם צבעים נוספים בעיקר לווריאציות רקע: [אלמנטים ורקעים עשירים](rich-backgrounds.md). המסכים בפרויקט הישן נשארים כהצעה קודמת; לא אושרו למימוש. המדיה הסופית מנוהלת ב־EmDash בידי בעל האתר.

## תהליך מוסכם

1. מעבירים בריף ל־Google Stitch ומייצרים קטלוג אלמנטים ודוגמאות דפים עם תוכן גנרי לבדיקה עיצובית.
2. ממתינים לאישור מפורש של בעל האתר לעיצוב ב־Stitch.
3. מממשים את העיצוב המאושר ברכיבי האתר ובדף ההדגמה המקומי, ושומרים שמות סוגים וקישורים לסכמות ולתצוגה.
4. ממתינים לאישור האלמנטים הממומשים בדף ההדגמה.
5. רק לאחר מכן עוברים לתוכן הדף לפי תקציר הדף ועקרונות הכתיבה, דרך EmDash MCP.

## משוב בעל האתר

ה־kickers/eyebrows צריכים מראה אחיד יותר אך לא חדגוני. הבריף מבקש משפחה אחת של טיפוגרפיה, מידות, צורה וריווח, ושלושה טיפולים מבוקרים לפי הקשר: מסגרת ניטרלית, מילוי חם וגרסה הפוכה על נייבי. אלה הצעות לבדיקה, לא החלטות שאושרו.

## פלט לבדיקה — 8.10.2026

- [קטלוג אלמנטים ובלוקים — לבדיקה עיצובית](https://stitch.withgoogle.com/preview/5526393599336009433?node-id=4778b363e666439c89f0c1bce02f173d). הקטלוג נוצר בבקשת Stitch עם sessionId `5806069821079801303`.
- [דף דוגמה גנרי — מובייל](https://stitch.withgoogle.com/preview/5526393599336009433?node-id=242f30976b67486698f17fdb1141772d).
- [דף דוגמה גנרי — מסך רחב](https://stitch.withgoogle.com/preview/5526393599336009433?node-id=8f764e9b0e0b4098aff80f01029a9a1d).
- מערכת העיצוב שנוצרה עבור ההצעה: `assets/1ed3606626be4164ae6a0e4e56435751`.
- קישורי צפייה משתמשים בדפוס `/preview/<project-id>?node-id=<screen-id>`. בעל האתר סיפק ואימת את קישור המובייל; קישורי הקטלוג והמסך הרחב הורכבו לפי אותו דפוס עם המזהים שחזרו מ־Stitch MCP. אין ליצור כתובות צפייה מדפוס משאב ה־API (`projects/.../screens/...`), שהחזיר 404.
- מצב: **ממתין לבדיקת בעל האתר; לא אושר למימוש.**
- הפלט הגנרי אינו מקור לעובדות, מחירים או תוכן מפורסם. אין להעתיק ממנו תוכן ל־CMS.

## הבריף שנשלח

Create a NEW design-review screen in this existing Power English project. Reference the visual direction of source screen b2c425fdf4ad47778bc459d79e30561c. Do not replace existing screens. Owner workflow: Stitch visual approval first, implementation in local blocks-demo only after explicit owner approval, real landing-page copy only after approval of implemented components. This request is only for design review using GENERIC HEBREW CONTENT marked "תוכן לדוגמה"; no actual course claims, pricing, testimonials, payment destinations, lead submission, or fabricated people.
Visual direction: Hebrew RTL throughout, Rubik for Hebrew, warm #FBF9F5 canvas, navy #00236F structural emphasis, #A73A00 main CTA with white text, #FFDBCE warm tint, #F5F3EF soft sections, white cards, 24px major corners / 12-16px nested corners, light shadows. Educational, warm, calm, credible to parents and inviting to school-age learners, not babyish. Preserve mobile-first single-column reading flow (512px outer / 480px usable) even in wide-page examples, no arbitrary new brand.
IMPORTANT OWNER FEEDBACK: kickers/eyebrows should look MORE UNIFIED WITHOUT BEING MONOTONOUS. Establish ONE recognisable family with same Rubik size/weight, padding, corner geometry, height and baseline spacing before heading. Show 3 controlled contextual treatments (neutral outlined / warm filled / inverse on navy), optional subtle icon or short start-edge accent used consistently by semantic role. Vary only these controlled treatments according to context, never random shape/font/size changes by section. A kicker is a short editorial label, not a CTA or a status chip; don't put a loud pill on every paragraph. Include specimens on plain, tinted and navy backgrounds, with a real heading below each, and short/long Hebrew labels. Name variants, explain WHEN each is used, give exact tokens.
Supported CMS block types and labels:
landing_hero (פתיח): eyebrow, title, subtitle, body paragraphs, main CTA, visual image/alt/title/caption.
landing_content_section (מקטע תוכן): kicker/title, plain/tinted/deep tone, paragraphs; cards with title/body and ordered_cards false/true; profile image/alt/caption; gallery image/alt/caption; FAQ question/answer. Cards/profile/gallery/FAQ are section fields, not standalone CMS types. Gallery currently uses deep tone.
landing_offer (הצעה ותשלום): title/body/includes checklist and disabled demonstration form.
landing_final_cta (קריאה אחרונה לפעולה): heading/paragraphs/signature/CTA.
Additional presentation elements: site header, mobile sticky CTA, primary and secondary buttons, disabled inputs/button, captions, numbered badge, text/quote style (quote is display-only, no CMS field).
Accessibility: readable Hebrew at 320-390px, correct direction isolation for Latin identifiers/email, body contrast at least 4.5:1, visible focus, comfortable tap targets, no cramped text/overlap, dark section headings and body/captions readable, restrained spacing.
Deliver output as actual visual screen(s), not only prose; design annotations and technical type labels only in the specimen catalog, not in generic landing-page user flows.

Co-authored-by: Codex <codex@openai.com>
