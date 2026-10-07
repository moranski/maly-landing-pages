# הנחיות עבודה לפרויקט

האתר מיועד לקהל דובר עברית. הקוד והקשר העריכה נמצאים ב־repo; EmDash הוא מקור האמת למודל ה־CMS ולתוכן הדפים המפורסם.

## ניתוב עבודה

- לפני קריאה, יצירה, עריכה, בדיקה או פרסום של תוכן CMS, פעלו לפי `.agents/skills/emdash-cms-management/SKILL.md`.
- לפני שינוי renderer, routing, אינטגרציה או פריסת Cloudflare, בדקו את הקוד וההגדרות המתאימים ב־repo.
- מפו את הדף דרך `docs/landing-pages/<slug>/README.md`. קראו את `brief.md` של הדף ואת `docs/writing-style.md` לפני עריכת תוכן. קראו את רשומת `landing_pages` ב־EmDash כשמשנים או מאמתים תוכן מפורסם.

## גבולות

- EmDash הוא מקור האמת לתוכן המפורסם ולמודל התוכן. תקצירי הדפים ב־repo הם מקור האמת להנחות, לכוונה ולעקרונות העריכה.
- אין לשנות את D1 ישירות. השתמשו ב־EmDash MCP לכל גישה ל־EmDash; אל תשתמשו ב־CLI, curl או API כחלופה.
- רשומות `agent_context` ההיסטוריות ב־EmDash אינן מקור פעיל ואסור לפרסם אותן. אין לשמור הנחיות פנימיות בשדות תוכן מפורסם. עריכות בעמוד מתחילות כטיוטה; מפרסמים רק כשהמשתמש מבקש שינוי חי במפורש.
- ה־renderer חייב להעביר לרכיבים רק שדות תצוגה מאושרים. אין לכלול `agent_context` ב־HTML, במטא־נתונים, בנתונים מובנים או במצב לקוח.
- שמרו סודות ופרטי פריסה בסביבת Cloudflare ולא בשדות תוכן או בקובצי הנחיות.

## Remote Agent Skills

This repository utilizes the following remote skills:
*   [Emdash Skills][https://github.com/emdash-cms/emdash/tree/main/skills] - skills for building and testing an Emdash Site

## Git Operations
- Any agent performing changes on the repo on behalf of the user MUST add a line with the agent details according to the convention "Co-authored-by: NAME <NAME@EXAMPLE.COM>".
