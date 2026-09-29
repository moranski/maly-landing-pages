# מפת התיעוד והבעלות

EmDash הוא מקור האמת למודל התוכן, להגדרות האתר ולתוכן הדפים. ה־repo הוא מקור האמת לקוד שמציג את התוכן, להגדרות סביבת הריצה ולהוראות התפעול של הסוכנים.

## מה נמצא היכן

| תחום | מקור אמת | אחריות |
| --- | --- | --- |
| אוסף, שדות, block types והגדרות אתר של EmDash | EmDash CMS | ניהול ב־EmDash בלבד; קריאה וכתיבה דרך MCP/API |
| תוכן דף שמוצג למבקרים | רשומת `landing_pages` | כתיבה, טיוטות ופרסום דרך EmDash |
| הקשר והנחיות ליצירת תוכן | רשומות טיוטה ב־`agent_context` | קריאה מאומתת על ידי סוכנים; אין לפרסם |
| renderer, routing, רכיבי UI ואינטגרציות | `src/` ו־`astro.config.mjs` | פיתוח ובדיקות ב־repo |
| bindings, כתובת אתר והגדרות פריסה | `wrangler.json` וסביבת Cloudflare | פריסה והגדרות סביבה; סודות נשמרים ב־Cloudflare secrets |
| הוראות תפעול | `AGENTS.md`, `.agents/skills/` ו־`docs/workflows/` | ניתוב תהליך העבודה וכללי שימוש בכלים |
| היסטוריית החלטות | `docs/landing-pages/<slug>/decisions/` | הקשר היסטורי; אינה גוברת על ההקשר הפעיל ב־EmDash |

## מעבר תוכן ההקשר ל־EmDash

ה־collection והעברת ההקשר עדיין ממתינים לחיבור CMS מאומת. עד שהרשומות נוצרות ונקראות בחזרה דרך EmDash, הקבצים הקיימים `docs/writing-style.md` ו־`docs/landing-pages/<slug>/{product,audience,design}.md` הם חומר מעבר בלבד. אין להציג את המיגרציה כאילו הושלמה; אם נדרשת כתיבת תוכן והקשר ה־CMS חסר, יש לעצור ולדווח על כך.

במודל הנוכחי `lead_endpoint` עדיין נמצא ב־block ההצעה ב־EmDash. מתייחסים אליו כתצורת אינטגרציה ולא כ־copy; העברתו להגדרת runtime דורשת שינוי CMS וקוד נפרד.

לאחר המיגרציה, המפתח `context_key` יזהה רשומות כמו `global-writing-style`, `reading-product`, `reading-audience` ו־`reading-design`. רשומות אלה יישארו טיוטות. אין לשמור עותק פעיל של ההקשר בקובצי Markdown.

## הוראות ותהליכים

- `AGENTS.md` הוא שער קצר שמנתב לסקילים ולתהליכים.
- `.agents/skills/emdash-cms-management/SKILL.md` מסביר כיצד לעבוד עם EmDash.
- `.agents/skills/landing-page-topology-check/SKILL.md` מגדיר audit קריאה בלבד בין ההקשר ב־EmDash, התוכן וה־renderer.
- `docs/workflows/landing-page-creation.md` מתאר יצירה ועדכון של דפים.
- התבניות תחת `docs/templates/` מיועדות לרשומות החלטה ולתכנון עיצוב; הן אינן הגדרות אתר או CMS.

## בדיקות

`npm run docs:check` בודק את מפת העמודים המקומית בלבד. `npm run check` בודק את תיעוד ה־repo ואת בניית האתר; הוא אינו מאמת את EmDash החי. אימות סכמה, תוכן, טיוטה ותצוגה מקדימה נעשים דרך EmDash לפי מיומנות ניהול ה־CMS.
