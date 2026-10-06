# הנחיות עבודה לפרויקט

האתר מיועד לקהל דובר עברית. הנחיות ההפעלה והקוד נמצאים ב־repo; מודל ה־CMS, תוכן הדפים והקשר הכתיבה הפעיל מנוהלים ב־EmDash.

## ניתוב עבודה

- לפני קריאה, יצירה, עריכה, בדיקה או פרסום של תוכן CMS, פעלו לפי `.agents/skills/emdash-cms-management/SKILL.md`.
- לפני שינוי renderer, routing, אינטגרציה או פריסת Cloudflare, בדקו את הקוד וההגדרות המתאימים ב־repo.
- לצורך audit קריאה בלבד של התאמת דף, הפעילו את `.agents/skills/landing-page-topology-check/SKILL.md`.
- מפו את הדף דרך `docs/landing-pages/<slug>/README.md`. קראו את שדה `agent_context` של רשומת `landing_pages` ואת ההקשר הגלובלי הרלוונטי דרך EmDash MCP לפני עריכה או אימות. רשומות נפרדות ב־`agent_context` אינן מקור פעיל לאחר השלמת המעבר ואימות השדה בדף.

## גבולות

- EmDash הוא מקור האמת לתוכן המפורסם, למודל התוכן ולהקשר יצירת התוכן.
- אין לשנות את D1 ישירות. השתמשו ב־EmDash MCP לכל גישה ל־EmDash; אל תשתמשו ב־CLI, curl או API כחלופה.
- שמרו רשומות `agent_context` כטיוטות בלבד. עריכות בעמוד מתחילות כטיוטה; מפרסמים רק כשהמשתמש מבקש שינוי חי במפורש.
- לפני הוספת הקשר פנימי לשדה בדף, ודאו דרך MCP אם שדות הדף נחשפים ב־API ציבורי למשתמשים רגילים ואם ניתן להגביל את החשיפה. אם לא ניתן לאמת הגנה כזו, אל תעבירו את ההקשר לשדה.
- ה־renderer חייב להעביר לרכיבים רק שדות תצוגה מאושרים. אין לכלול `agent_context` ב־HTML, במטא־נתונים, בנתונים מובנים או במצב לקוח.
- שמרו סודות ופרטי פריסה בסביבת Cloudflare ולא בשדות תוכן או בקובצי הנחיות.

## Remote Agent Skills

This repository utilizes the following remote skills:
*   [Emdash Skills][https://github.com/emdash-cms/emdash/tree/main/skills] - skills for building and testing an Emdash Site

## Git Operations
- Any agent performing changes on the repo on behalf of the user MUST add a line with the agent details according to the convention "Co-authored-by: NAME <NAME@EXAMPLE.COM>".
