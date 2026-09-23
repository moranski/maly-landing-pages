---
version: "alpha"
name: "שם מערכת העיצוב"
description: "משפט קצר שמתאר את הקהל, התחושה והתפקיד של המערכת."
colors:
  primary: "#16324F"
  on-primary: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#1B1B1F"
  accent: "#C84A2F"
  on-accent: "#FFFFFF"
typography:
  heading:
    fontFamily: "Arial, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
---

## Overview

תארו את הקהל, התחושה הרצויה והעיקרון החזותי שמחבר ביניהם. הסבירו כיצד המערכת תומכת במסר בלי לחזור על בריף הקהל או על פרטי המוצר.

## Colors

הסבירו את התפקיד של כל צבע, את גבולות השימוש ואת שילובי הטקסט והרקע המותרים.

## Typography

הגדירו היררכיה, רוחב שורה, כללי RTL, רישוי וטעינת גופנים והתנהגות במסכים קטנים.

## Layout

תארו גריד, קצב אנכי, רוחבי תוכן, נקודות שבירה והתנהגות במובייל.

## Elevation & Depth

הגדירו שימוש בגבולות, צללים ושכבות. אם אין בהם שימוש, ציינו זאת במפורש.

## Shapes

הסבירו את שפת הרדיוסים והצורות ואת הקשר שלה לאופי הקהל.

## Components

תארו את הרכיבים המרכזיים, המצבים שלהם וכללי השימוש בהם. טוקנים שניתנים למיכון צריכים להופיע גם ב־frontmatter.

## Do's and Don'ts

רשמו כללים קצרים ומעשיים שמונעים סטייה מהשפה החזותית.
