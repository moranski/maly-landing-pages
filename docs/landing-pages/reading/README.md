# מפת דף הנחיתה: אנגלית מעצימה לי עם מלי

- **slug:** `reading`
- **תוכן חי:** EmDash, אוסף `landing_pages`, רשומה `reading`
- **הקשר יצירה:** EmDash, אוסף `agent_context`, מפתחות `reading-product`, `reading-audience` ו־`global-writing-style`
- **מקור אמת לעיצוב:** Google Stitch, פרויקט [דף נחיתה לימודי אנגלית](https://stitch.withgoogle.com/projects/5526393599336009433), מסך [Power English - דף נחיתה מבוסס מקור ואפיון מלא](https://stitch.withgoogle.com/projects/5526393599336009433/screens/b2c425fdf4ad47778bc459d79e30561c); מערכת העיצוב של הפרויקט חלה על המסך
- **סטטוס העברת הקשר:** הושלם ונקרא בחזרה מ־EmDash ב־2026-10-04; כל רשומות ההקשר נשארו טיוטות

## אחריות

- EmDash מחזיק את תוכן הדף ואת רשומות ההקשר; רשומות ההקשר חייבות להישאר טיוטות.
- ה־repo מחזיק את renderer וההתנהגות הטכנית. מקור המימוש הוא `src/components/landing/EmDashLandingPage.astro`.
- החלטות ב־`decisions/` הן היסטוריה ונימוקים, לא תחליף להקשר הפעיל ב־EmDash.

## מפת הקשר פעיל

- כתיבה גלובלית: `agent_context/global-writing-style` (`writing_style`, `page_slug=global`)
- מוצר: `agent_context/reading-product` (`product`, `page_slug=reading`)
- קהל: `agent_context/reading-audience` (`audience`, `page_slug=reading`)
- עיצוב: Google Stitch הוא מקור האמת היחיד לעיצוב. השתמשו במסך המפורט ובמערכת העיצוב המקושרים למעלה; קונספטים אחרים בפרויקט הם חלופות/חומרי עזר, לא מפרט העיצוב הפעיל.

הקבצים המקומיים באותה תיקייה וב־`docs/writing-style.md` הם מצביעים ל־EmDash בלבד. יש לקרוא את רשומות ה־CMS לפני כתיבה או עריכה; כולן נשמרות כטיוטות ואסור לפרסם אותן. שינוי עיצוב מתחיל בעדכון Stitch; לאחר מכן מעדכנים את ה־renderer לפי Stitch ובודקים את התוצאה מול המסך. אין לשנות את Stitch מתוך עריכת קוד בלבד.
