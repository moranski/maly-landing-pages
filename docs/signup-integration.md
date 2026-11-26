# הגדרת טופס ההרשמה

טופס ההצעה ב־`/landing/reading/` משתמש ב־Cloudflare Turnstile וב־Responder API V2. פרטי החיבור ל־Responder נשארים ב־Worker.

<!-- Co-authored-by: Codex <codex@openai.com> -->

## משתני Worker

המשתנים `SITE_URL`, `TURNSTILE_SITE_KEY`, `RESPONDER_CLIENT_ID` ו־`RESPONDER_LIST_IDS` מוגדרים ב־`wrangler.toml`. המיפוי `RESPONDER_LIST_IDS` משייך את `reading` לרשימה `122801`. לכל משפך נוסף הקצו מזהה רשימה ייחודי והגדירו לטופס את מזהה המשפך ואת פעולת Turnstile בתבנית `signup_<funnel>`. ה־Worker דורש שמקור הבקשה יתאים לכתובת הבקשה ולאחד משני המארחים המוגדרים, `SITE_URL` או `LEGACY_SITE_URL` האופציונלי.

שמרו את הערכים הרגישים כ־Cloudflare Secrets דרך `npx wrangler secret put <NAME>` או במסך Settings → Variables and Secrets של ה־Worker:

- `TURNSTILE_SECRET`
- `RESPONDER_CLIENT_SECRET`
- `RESPONDER_USER_TOKEN`

הגדירו ב־Turnstile את המארח של `SITE_URL` (בייצור: `land.maly.school`) ואת המארח של `LEGACY_SITE_URL` אם הוגדר. חשבון Responder צריך לספק Client ID, Client Secret, User Token ומזהה רשימת תפוצה. הגדרת הערכים ב־Cloudflare אינה דורשת להעביר אותם בצ׳אט או להוסיף אותם לקוד.

## התנהגות API

- אימות Responder מתבצע ב־`POST https://graph.responder.live/v2/oauth/token`; האסימון הזמני משמש מיד לקריאת API ואינו נשמר.
- יצירת הנרשם מתבצעת ב־`POST https://graph.responder.live/v2/subscribers` עם `email`, `name`, `phone`, `list_ids` ו־`override: false`. הטלפון נבדק בצד הדפדפן וב־Worker ומנורמל למספר ישראלי המתחיל ב־`0` לפני השליחה.
- אחרי אימות הטופס, הדפדפן עובר ל־Cardcom גם אם הנרשם כבר קיים או אם Responder מחזיר שגיאה. היעד מקבל את `subscribers_email`, `subscribers_name` ו־`subscribers_phone` ואת פרמטרי הייחוס הנתמכים. כתובת העמוד ב־CMS צריכה להתאים לנתיב התשלום המאושר בקוד.
- הווידג׳ט מופעל בשליחה ומופיע אם Turnstile דורש אינטראקציה (`execution=execute`, `appearance=interaction-only`). האימות דורש את שם המארח של הבקשה ואת הפעולה `signup_reading` עבור משפך הקריאה. ה־Worker חוסם בקשות שחורגות ממגבלת הקצב לפני פנייה לספק.
- אפשר להשאיר את מצב הווידג׳ט הקיים (Managed) כדי להציג אתגר למבקרים חשודים בלבד. מצב Invisible אמיתי נקבע בהגדרות הווידג׳ט ב־Cloudflare, ולא באמצעות מאפיין HTML; לפני מעבר אליו יש לעדכן את מדיניות הפרטיות בהתאם ל־Turnstile Privacy Addendum.

## Rate Limiting

ה־Worker מוגדר למקסימום 5 בקשות הרשמה בדקה לכל IP, בנוסף ל־Turnstile. `namespace_id` של ה־binding הוא `88120417`; מזהה זה חייב להיות ייחודי לחשבון Cloudflare כדי שמונה הבקשות לא ישותף עם Worker אחר. אם הוא כבר בשימוש בחשבון, הקצו מזהה מספרי ייחודי ועדכנו את `wrangler.toml` לפני פריסה.

## פיתוח מקומי

צרו `.dev.vars` מקומי (הקובץ מוחרג מ־Git), הגדירו `SITE_URL=http://localhost:4321` והשתמשו במפתחות הבדיקה הרשמיים של Turnstile. לצורך בדיקת יצירה השתמשו ברשימת בדיקה ב־Responder בלבד, משום שה־endpoint המקומי יוצר נרשמים אמיתיים בחשבון שאליו הוגדר.
