# מפת התיעוד והבעלות

EmDash הוא מקור האמת למודל התוכן, להגדרות האתר ולתוכן הדפים המפורסם. ה־repo הוא מקור האמת לקוד, להקשר העריכה ולהוראות העבודה.

## מה נמצא היכן

| תחום | מקור אמת | אחריות |
| --- | --- | --- |
| מודל תוכן והגדרות CMS | EmDash | ניהול ב־EmDash דרך MCP |
| תוכן דף שמוצג למבקרים | רשומת `landing_pages` | טיוטות ופרסום דרך EmDash |
| הנחות, עקרונות עריכה וכוונת עיצוב לדף | `docs/landing-pages/<slug>/brief.md` | תקציר אחד לכל דף; עריכה וביקורת ב־Git |
| עקרונות כתיבה משותפים | [`docs/writing-style.md`](writing-style.md) | כללים כלליים שאינם מחליפים את תקציר הדף |
| מקור עיצוב חיצוני | הכלי או הקובץ המקושרים בתקציר הדף | ההחלטות החזותיות נשמרות במקור העיצוב; ה־repo מכיל את המימוש |
| renderer, routing, רכיבי UI ואינטגרציות | `src/` ו־`astro.config.mjs` | פיתוח ב־repo |
| bindings, כתובת אתר והגדרות פריסה | `wrangler.toml` וסביבת Cloudflare | סודות נשמרים ב־Cloudflare secrets |
| הוראות ותהליכי עבודה | `AGENTS.md`, `.agents/skills/`, `docs/workflows/` | ניתוב וכללי שימוש בכלים |
| פרטיות והסכמה | [`docs/privacy-consent.md`](privacy-consent.md) | התנהגות EmPrivacy ו־GTM |
| היסטוריית החלטות | `docs/landing-pages/<slug>/decisions/` | תיעוד היסטורי; התקציר העדכני הוא ההנחיה הפעילה |

## הקשר עמודים

לכל דף יש תקציר יחיד ב־`docs/landing-pages/<slug>/brief.md`. התקציר מאורגן מלמעלה למטה: הנחות מוצר וקהל, עקרונות הנגזרים מהן, ואז כוונת העיצוב. אין לפצל את ההנחות האלה למסמכי מוצר, קהל ועיצוב נפרדים.

EmDash מחזיק את נוסח הדף, המדיה, ההצעה והמטא־נתונים המפורסמים. אין להעתיק אליו הנחיות פנימיות. רשומות קיימות באוסף `agent_context` הן היסטוריות ואינן מקור פעיל; אין לפרסם אותן.

## הוראות ותהליכים

- `AGENTS.md` מנתב לסקילים ולתהליכים.
- `.agents/skills/emdash-cms-management/SKILL.md` מסביר כיצד לעבוד עם תוכן EmDash.
- `docs/workflows/landing-page-creation.md` מתאר יצירה ועדכון של דפים.
- `docs/templates/landing-page-brief.md` היא תבנית לתקציר אחוד.

## בדיקות

<!-- Co-authored-by: Codex <codex@openai.com> -->

דפי נחיתה באוסף `landing_pages` מוצגים בנתיב `/landing/<slug>/`. עמודים כלליים באוסף `pages` מוצגים בנתיב `/pages/<slug>` דרך רכיב `CmsPage`: הכותרת והתוכן העשיר מגיעים מ־EmDash, והשפה והכיווניות נבחרות לפי שפת הרשומה. הכתובות הישנות `/<slug>` מפנות בהפניית 308 לכתובת החדשה תוך שמירת פרמטרים ועוגנים. תבנית הכתובת ב־EmDash היא `/landing/{slug}/`. פרסום באדמין אינו יוצר נתיב Astro חדש; לכל אוסף נדרש renderer מתאים בקוד. תוכן לא מפורסם נגיש רק במצב תצוגה מקדימה או עריכה של EmDash.

`npm run docs:check` בודק את מפת העמודים המקומית בלבד. `npm run check` בודק את תיעוד ה־repo, build, TypeScript ו־Wrangler dry run; הוא אינו מאמת את EmDash החי. אימות סכמה, תוכן, טיוטה ותצוגה מקדימה נעשים דרך EmDash לפי מיומנות ניהול ה־CMS.

`npm test` מריץ בדיקות יחידה של שער ההסכמה ל־Google Tag Manager. לפני פריסת Worker יש להשתמש ב־`npm run deploy`, שמפעיל בדיקות ו־`npm run check` דרך `predeploy`. אין להריץ `wrangler deploy` ישירות.
