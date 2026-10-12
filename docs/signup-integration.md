# הגדרת טופס ההרשמה

טופס `/reading` משתמש ב־Cloudflare Turnstile וב־Responder API V2. פרטי Responder נשארים ב־Worker ואינם נשלחים לדפדפן.

## משתני Worker

הגדירו ב־Cloudflare Worker Variables את `SITE_URL` ככתובת הקנונית המדויקת של האתר, כולל `https://`, וכן את `TURNSTILE_SITE_KEY`, `RESPONDER_CLIENT_ID` ו־`RESPONDER_LIST_ID`. מפתח Turnstile ומזהי החשבון והרשימה אינם סודות; מפתח Turnstile יוצג בדף כחלק מהווידג׳ט. ה־endpoint משווה את `SITE_URL` ל־Origin ולשם המארח ש־Turnstile מאמת.

שמרו את הערכים הרגישים כ־Cloudflare Secrets דרך `npx wrangler secret put <NAME>` או במסך Settings → Variables and Secrets של ה־Worker:

- `TURNSTILE_SECRET`
- `RESPONDER_CLIENT_SECRET`
- `RESPONDER_USER_TOKEN`

צרו מפתחות Turnstile שמורשים לדומיין שמופיע ב־`SITE_URL`. חשבון Responder צריך לספק Client ID, Client Secret, User Token ומזהה רשימת תפוצה. הגדרת הערכים ב־Cloudflare אינה דורשת להעביר אותם בצ׳אט או להוסיף אותם לקוד.

## התנהגות API

- אימות Responder מתבצע ב־`POST https://graph.responder.live/v2/oauth/token`; האסימון הזמני משמש מיד לקריאת API ואינו נשמר.
- יצירת הנרשם מתבצעת ב־`POST https://graph.responder.live/v2/subscribers` עם `email`, `name`, `list_ids` ו־`override: false`.
- אם Responder מחזיר `duplicate: true`, הטופס מציג הודעה ולא מעדכן את הנרשם ולא ממשיך לתשלום.
- Turnstile חייב לאשר `success`, מארח שתואם ל־`SITE_URL` ופעולה `signup`. חריגה ממגבלת הקצב נחסמת לפני פנייה לספק.

## Rate Limiting

ה־Worker מוגדר למקסימום 5 בקשות הרשמה בדקה לכל IP, בנוסף ל־Turnstile. `namespace_id` של ה־binding הוא `88120417`; מזהה זה חייב להיות ייחודי לחשבון Cloudflare כדי שמונה הבקשות לא ישותף עם Worker אחר. אם הוא כבר בשימוש בחשבון, הקצו מזהה מספרי ייחודי ועדכנו את `wrangler.json` לפני פריסה.

## פיתוח מקומי

צרו `.dev.vars` מקומי (הקובץ מוחרג מ־Git), הגדירו `SITE_URL=http://localhost:4321` והשתמשו במפתחות הבדיקה הרשמיים של Turnstile. לצורך בדיקת יצירה השתמשו ברשימת בדיקה ב־Responder בלבד, משום שה־endpoint המקומי יוצר נרשמים אמיתיים בחשבון שאליו הוגדר.
