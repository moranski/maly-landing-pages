# מפת דף הנחיתה: אנגלית מעצימה לי עם מלי

- **slug:** `reading`
- **תוכן חי:** EmDash, אוסף `landing_pages`, רשומה `reading`
- **תקציר הדף:** [`brief.md`](brief.md) — הנחות מוצר וקהל, עקרונות נגזרים וכוונת העיצוב
- **מקור העיצוב:** Google Stitch, פרויקט [דף נחיתה לימודי אנגלית](https://stitch.withgoogle.com/projects/5526393599336009433), מסך [Power English - דף נחיתה מבוסס מקור ואפיון מלא](https://stitch.withgoogle.com/projects/5526393599336009433/screens/b2c425fdf4ad47778bc459d79e30561c)

## אחריות

- EmDash מחזיק את תוכן הדף המפורסם ואת הטיוטות שלו. `brief.md` הוא מקור ההקשר והכוונה הפעילים.
- ה־repo מחזיק את renderer וההתנהגות הטכנית. מקור המימוש הוא `src/components/landing/EmDashLandingPage.astro`.
- החלטות ב־`decisions/` הן היסטוריה ונימוקים; `brief.md` מרכז את ההנחיות הפעילות לדף.

## מפת הקשר פעיל

- עקרונות כתיבה משותפים: [`docs/writing-style.md`](../../writing-style.md)
- הנחות ועקרונות ייחודיים לדף: [`brief.md`](brief.md)
- Stitch הוא המקור להחלטות העיצוב החזותיות; `src/` הוא המימוש הנוכחי.

לפני עריכת תוכן יש לקרוא את `brief.md` ואת `docs/writing-style.md`, ואז לבדוק ב־EmDash את מצב התוכן והשדות הקיימים. שינוי עיצוב מתחיל בעדכון Stitch; לאחר מכן מעדכנים את ה־renderer לפי Stitch ובודקים את התוצאה מול המסך.
