# ARCHITECTURE: Unhyped

> נכתב ב-11/11/2026 לפי מה שבנוי ורץ בפועל. זה לא סטאק הקורס (אתר סטטי + פונקציות Vercel). אורי בחר ב-11/11 לבנות את Unhyped בריפו נפרד, `unhyped-app`, כדי שכללי הקורס לא יחולו עליו. ראו ADR-1.

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- React 19 + TypeScript, נבנה עם Vite. עיצוב ב-Tailwind 3.4. אייקונים: lucide-react.
- ניתוב: react-router-dom עם HashRouter (כתובות בסגנון `#/story/...`).
- המסכים: Onboarding, Home, Story, Brief, Saved, Settings (Preferences), Editor.
- הדפדפן קורא סיפורים שפורסמו ישירות מ-Supabase (REST), עם המפתח הציבורי בלבד. RLS מאפשר לו לראות רק סיפורים שפורסמו.
- אם Supabase לא זמין, מוצגים נתוני דוגמה (`src/data`).
- העדפות אורח נשמרות ב-localStorage (`unhyped.prefs.v2`).

### לוגיקה
- **Supabase Edge Functions** (Deno), שלוש פונקציות:
  - `ingest`: קורא את כל המקורות הפעילים, שומר כתבות חדשות.
  - `process`: מאחד כתבות לסיפורים וכותב אותם בעזרת Gemini. עד 25 כתבות ועד 8 סיפורים בכל ריצה, עם תקציב זמן (מגבלה של 150 שניות).
  - `build-brief`: בונה את התדריך היומי.
- **pg_cron** בתוך Supabase מפעיל אותן: ingest כל 15 דקות, process בדקות 5 ו-35, brief כל יום ב-05:00 UTC.
- **כללים בקוד, לא במודל** (`_shared/rules.ts`): התווית לפי רמת המקור החזק ביותר, שמועה מוגבלת לציון 1, ציון 3 שאינו שמועה ← pending_review, סיפור שכבר פורסם נשאר מפורסם כשהוא נכתב מחדש.

### נתונים
- Supabase Postgres (פרויקט "Unhyped", eu-central-1, Free).
- Supabase Auth: קישור קסם במייל (PKCE).

## 2. מבנה הנתונים

| טבלה | מה יש בה | משמשת את |
|---|---|---|
| `sources` | name, url (RSS), tier: official / news / signal, topic: ai / tesla, active, keywords, fail_count, last_fetched_at, last_error | איסוף, תווית |
| `articles` | source_id, url (ייחודי), title, summary, published_at, topic, story_id, processed_at | איחוד, מקורות בדף הסיפור |
| `stories` | topic, area, label, importance 1–3, status: draft / pending_review / published / rejected, title, dek, takeaways, why_it_matters, what_happened, market_reaction, claims, change_note, image_id, article_count, needs_rewrite, published_at | Home, Story, Brief, Editor |
| `images` | path, topic, tags, alt. תגיות: `ai` (צויר ב-AI, מוצגת תגית Illustration), `generated` (התמונה של סיפור מסוים), `library` (מאגר גיבוי לפי תחום), `superseded` (לא בשימוש) | תמונה לסיפור |
| `briefs` | brief_date (ייחודי), story_ids | Brief |
| `profiles` | user_id, topics, depth, brief_time, timezone, reminder, email_brief, role: user / editor | Preferences, הרשאת עורך |
| `saved` | user_id, story_id | Saved (משתמש רשום) |

קשרים: `articles.source_id → sources`, `articles.story_id → stories`, `stories.image_id → images`, `profiles` ו-`saved` → `auth.users`.

בסכמה `private` (לא חשופה לדפדפן): `config` עם סוד ה-cron ורשימת מיילים של עורכים, והפונקציה `call_function` שקוראת ל-Edge Functions דרך pg_net.

## 3. התחברות והרשאות
- **אורח:** בלי חשבון. קורא סיפורים שפורסמו, תדריכים, מקורות ותמונות (RLS: select לכולם רק על מה שפורסם).
- **רשום:** קישור קסם. רואה ומשנה רק את ה-profile וה-saved שלו (RLS לפי `auth.uid()`).
- **עורך:** `profiles.role = 'editor'`. נקבע אוטומטית בהרשמה למיילים שברשימה `private.config.editor_emails`. הפונקציה `is_editor()` פותחת לו קריאה של סיפורים שלא פורסמו ועדכון של סיפורים, מקורות ותמונות.
- הכתובות המותרות להפניה אחרי קישור קסם מוגדרות ב-Supabase: `https://unhyped-app.vercel.app` ו-`https://unhyped-app.vercel.app/**`.

## 4. שכבת ה-AI
- **ספק:** Gemini דרך REST (v1beta), בשכבה החינמית. השכבה (`_shared/llm.ts`) מאפשרת להחליף ל-Anthropic עם המשתנה `LLM_PROVIDER`.
- **בחירת מודל אוטומטית:** ה-flash-lite היציב והחדש ביותר, ומודל flash רגיל כגיבוי. כרגע `gemini-3.5-flash-lite`.
- **שתי קריאות:** (1) קיבוץ: רשימת כתבות חדשות + סיפורים פתוחים ← לאיזה סיפור כל כתבה שייכת. (2) כתיבה: כתבות הסיפור ← JSON עם title, dek, takeaways, why_it_matters, what_happened, claims, importance, market_reaction.
- **שלוש מגבלות בפרומפט** (`_shared/prompts.ts`): רק מה שכתוב בכתבות, לא מעלים דרגת ודאות, אין תחזיות ואין ייעוץ השקעות.
- **הגנות:** timeout של 80 שניות, ניסיון חוזר על 503/429, מודל גיבוי, ניקוי סימונים כמו `[a1]` בקוד, כותרת חלופית אם חזרה ריקה.
- הקריאה למודל יוצאת רק מ-Edge Function, אף פעם לא מהדפדפן.

## 5. אינטגרציות, APIs ואוטומציות
| מה | איך | מתי |
|---|---|---|
| RSS של המקורות | `ingest`, עם User-Agent קבוע. עד 8 כתבות חדשות למקור בכל סבב, סינון לפי keywords, וכיבוי אוטומטי אחרי 12 כישלונות ברצף | כל 15 דקות |
| Gemini | `process`, `build-brief` | :05 ו-:35 בכל שעה, ותדריך ב-05:00 UTC |
| Cloudflare Workers AI (FLUX.1 schnell) | `make-images`: Gemini כותב תיאור סצנה בלי שמות ופנים, Cloudflare מצייר, מקטינים ל-800×600 (~50KB) ושומרים ב-bucket `images`. עד 4 תמונות בסבב, עד 70 ביום | כל 10 דקות (:02, :12...) |
| GitHub → Vercel | כל push ל-main בונה ומעלה את האתר | בכל push |
| Resend (מתוכנן) | שליחת תדריך במייל | Milestone עתידי |

## 6. מפתחות וסודות
| מה | איפה | מגיע לדפדפן? |
|---|---|---|
| `GEMINI_API_KEY` | Secrets של Edge Functions ב-Supabase (אורי הזין בדשבורד) | לא |
| `SUPABASE_SERVICE_ROLE_KEY` | זמין אוטומטית ל-Edge Functions | לא |
| סוד ה-cron | `private.config`, נבדק עם `check_cron_secret` (רק service_role) | לא |
| כתובת Supabase + מפתח ציבורי (publishable) | בקוד הלקוח ו/או `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` | כן, וזה בסדר: RLS מגן על הטבלאות |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Secrets של Edge Functions (אורי הזין בדשבורד) | לא |
| `RESEND_API_KEY` (עתידי) | Secrets של Edge Functions | לא |

אין מפתח סודי בריפו. `.env` ב-`.gitignore`, ו-`.env.example` מכיל רק שמות.

## 7. מבנה התיקיות של הקוד
```
index.html, vite.config.ts, tailwind.config.js, vercel.json
public/img/                 תמונות הספרייה (זמניות, חתוכות מהמוקאפים)
src/
  main.tsx, App.tsx         כניסה וניתוב
  pages/                    Onboarding, Home, StoryPage, Brief, Saved, Settings, Editor
  components/               Shell, SignupSheet, ui
  lib/                      supabase.ts, stories.ts, feed.ts, prefs.tsx
  data/                     נתוני דוגמה ונושאים
supabase/
  migrations/               סכמה, seed, cron, editor_emails
  functions/
    _shared/                db, llm, prompts, rules, rss
    ingest/ process/ build-brief/
spec/                       המסמכים האלה, התמונות ו-plans/
```

## הנחות והחלטות
- נתוני הדוגמה נשארים בקוד, כדי שהאתר לא ייראה שבור אם Supabase מושהה.
- Supabase Free משהה פרויקט אחרי שבוע בלי פעילות. ה-cron רץ כל 15 דקות, ולכן זה לא אמור לקרות.

## Key decisions (ADRs)

### ADR-1: ריפו נפרד, לא סטאק הקורס
**Context:** הריפו `Hirsch2828/unhyped` שייך לקורס, עם סטאק אחר (HTML סטטי, פונקציות Vercel, n8n) וכללים מחמירים. הקוד שלנו כבר נבנה ב-React ו-Supabase Edge Functions.
**Decision:** ריפו חדש, `Hirsch2828/unhyped-app`, ופרויקט Vercel חדש בשם `unhyped-app`. הריפו והאתר של הקורס לא נוגעים.
**Consequences:** שני מוצרים מקבילים. כללי `course-stack.md` לא חלים כאן, אבל חוק המפתחות נשמר.

### ADR-2: Gemini בשכבה החינמית במקום Claude
**Context:** אורי ביקש אפס עלות.
**Decision:** Gemini flash-lite עם בחירת מודל אוטומטית, ושכבה שמאפשרת להחליף ספק.
**Consequences:** הגבלות קצב ועומסים (503). לכן יש ניסיון חוזר, מודל גיבוי ותקציב זמן. בשכבה החינמית Google עשויה להשתמש בתוכן, וזה בסדר כי מדובר בכתבות ציבוריות בלבד.

### ADR-3: Supabase Edge Functions + pg_cron במקום n8n
**Context:** צריך איסוף כל 15 דקות ועיבוד AI, בלי שרת ובלי עלות.
**Decision:** שלוש Edge Functions שמופעלות מ-pg_cron דרך pg_net, עם סוד cron במקום JWT.
**Consequences:** הכול במקום אחד. מגבלת 150 שניות לריצה מחייבת עבודה במנות קטנות.

### ADR-4: הדפדפן קורא מ-Supabase ישירות, עם RLS
**Context:** האתר צריך רק לקרוא סיפורים שפורסמו.
**Decision:** קריאה ישירה עם המפתח הציבורי. RLS מתיר לאורח רק סיפורים שפורסמו, ולעורך גם את התור.
**Consequences:** אין צורך בשרת ביניים. כל שינוי הרשאות נעשה ב-policies, בזהירות.

### ADR-5: התווית נקבעת בכלל, לא ב-AI
**Context:** אמינות היא ליבת המוצר, ו-AI עלול "להעלות דרגה".
**Decision:** התווית נגזרת מרמת המקור החזק ביותר (official / news / signal).
**Consequences:** איכות התווית תלויה לגמרי בסיווג הנכון של המקורות.

### ADR-6: מקורות כלליים עם סינון מילות מפתח
**Context:** לטסלה אין פיד RSS רשמי, ולרוב אתרי החדשות הגדולים (CNBC, NYT, BBC, Axios) אין פיד נפרד ל-AI.
**Decision:** עמודה `keywords` במקורות. כשהיא מלאה, נשמרות רק כתבות שהכותרת או התקציר שלהן מכילים אחת המילים. המקור הרשמי לטסלה הוא הדיווחים שלה לרשות ניירות הערך האמריקאית (SEC, טופס 8-K).
**Consequences:** יותר מקורות איכותיים בלי כתבות לא קשורות. מילה כללית מדי (למשל "ai") עלולה להכניס כתבה לא רלוונטית מדי פעם. דיווחי SEC נדירים, ולכן התווית Official בטסלה תופיע רק לפעמים.

### ADR-7: איור AI לכל סיפור עם Cloudflare Workers AI
**Context:** אורי רצה תמונה לכל סיפור, בחינם. מודלי התמונה של Gemini בתשלום, ול-ChatGPT החינמי אין API.
**Decision:** פונקציה `make-images` שקוראת ל-Cloudflare Workers AI (FLUX.1 schnell) במכסה החינמית (10,000 יחידות ביום). בפועל ביום הראשון המכסה הספיקה לכ-80 תמונות, ולכן התקרה 70 ביום. רק איורים: בלי פנים של אנשים אמיתיים, בלי לוגואים ובלי טקסט, ותגית "Illustration" באתר. מאגר גיבוי של כ-4 איורים לכל תחום, ו-`process` נותן לסיפור חדש תמונה מהמאגר עד שהאיור שלו מוכן.
**Consequences:** כל סיפור מקבל תמונה ייחודית תוך כ-10 דקות, בלי עלות. התמונה מוקטנת בשרת (jpeg-js), ולכן כל סבב מוגבל ל-4 תמונות כדי לא לעבור את מגבלת המעבד של Edge Function. 1GB חינמי מספיק לכ-20,000 תמונות. לפני שנגיע לשם צריך להחליט על מחיקת תמונות ישנות.

### ADR-8: לוחות שנוצרים בקוד במקום תמונות, ושכבת "העשרה" נפרדת
**Context:** בכיוון העיצוב A (Milestone 5ג) אין צילומים. איורי ה-AI (Cloudflare) נתקעו במכסה היומית, ותמונות חסרות או חוזרות פגעו במראה. רגעי החתימה צריכים מידע נוסף על כל סיפור: הכותרת המפוצצת, ביטוי למרקר, שאלות פתוחות ועמדת כל מקור.
**Decision:** כל סיפור מקבל "לוח" שנוצר בדפדפן (נקודות וסימן מתוך הסיפור), בלי קובץ תמונה. ב-`process` נוסף שלב שלישי, "העשרה": קריאת AI קצרה לכל סיפור שפורסם, שבוחרת כותרת מפוצצת מתוך כותרות המקורות (מועתקת מילה במילה), ביטוי מתוך הכותרת שלנו, שאלות פתוחות ועמדות מקורות. השרת בודק שהכותרת אמיתית והביטוי באמת מופיע בכותרת. שורת הסטטוס ו-"Since you read this" מחושבים בכלל, בטלפון, בלי AI.
**Consequences:** עלות 0, אין תמונה חסרה. עמודות חדשות ב-`stories`: `hype_title`, `hype_source`, `highlight`, `uncertain`, `source_notes`, `enriched_at`. עד 10 קריאות AI נוספות בכל ריצה. `make-images` יושהה כשהעיצוב יעלה לאתר הראשי (עד אז האתר הראשי עדיין מציג איורים). ה-Delta נשמר רק בטלפון, ולכן לא עובר בין מכשירים.

### ADR-9: קישור שיתוף `/s/<id>` עם פונקציית Vercel קטנה
**Context:** האתר עובד עם כתובות `#/story/<id>`. וואטסאפ, טוויטר ולינקדאין לא רואים מה שאחרי ה-`#`, ולכן כל סיפור ששותף הציג את אותה תצוגה מקדימה כללית.
**Decision:** כפתור השיתוף שולח כתובת `/s/<id>`. ב-`vercel.json` יש הפניה מ-`/s/:id` אל `api/share.js`, פונקציה קטנה שקוראת את הכותרת והתקציר של הסיפור מ-Supabase (במפתח הציבורי), מחזירה דף עם תגיות OG, ומעבירה את הקורא מיד ל-`/#/story/<id>`. אם הסיפור לא נמצא, מוצגת תצוגה כללית (`og.png`).
**Consequences:** לכל סיפור יש תצוגה מקדימה משלו בלי לעבור לשרת מלא או לשנות את הניתוב באפליקציה. קריאה אחת ל-Supabase לכל פתיחת קישור (עם מטמון של 10 דקות). הכתובות הישנות עם `#` ממשיכות לעבוד.

### ADR-10: כללי תוכן אוטומטיים ו"אירוע אחד = סיפור אחד"
**Context:** סיפורים חזרו על אותו אירוע (כמה סיפורי Nvidia באותו גיליון), וחלק מהטקסטים כללו מילות הייפ, כותרות ארוכות או "למה זה חשוב" כללי.
**Decision:** ב-`_shared/rules.ts` יש בדיקות קבועות (מילות הייפ, כותרת עד 80 תווים, עד 2 משפטים ב"למה זה חשוב", מקור אחד לפחות, בלי ניסוח של ייעוץ השקעות על Tesla). סיפור שנכשל נכתב מחדש פעם אחת; אם הוא עדיין נכשל הוא עובר לתור העורך. באפליקציה, סיפורים שחולקים שמות בכותרת בתוך 72 שעות מקובצים ל"שרשור": בגיליון מופיע רק הראשי, והשאר תחת "Developing story".
**Consequences:** בלי עמודות חדשות במסד. הקיבוץ נעשה בדפדפן ולכן יכול לטעות לפעמים (שני אירועים שונים עם אותם שמות). פונקציית `process` המעודכנת צריכה פריסה ל-Supabase כדי שהכללים יפעלו על סיפורים חדשים.

### ADR-11: עובדות חברה במסד הנתונים, ואנטומיה ב-SVG בקוד
**Context:** כל ידיעה מקבלת אנטומיה של החברה שלה, והעובדות חייבות לעבור עורך.
**Decision:** הציורים (אובייקטים מתפרקים ומכונות) נכתבים בקוד כ-SVG שנשלט בגלילה. הטקסטים נשמרים בטבלאות `companies` ו-`company_parts` עם `status` (draft או approved). קוראים רואים רק שורות מאושרות (RLS), והעורך מאשר בלשונית Companies. עד שחברה מאושרת, האתר מציג את הטיוטה מ-`src/data/companies.ts`.
**Consequences:** חברה חדשה דורשת קוד (צורה וחלקים) וגם שורות במסד. תיקון ניסוח לא דורש פריסה.

### ADR-12: תמונה קומיקסית־מציאותית לכל ידיעה
**Context:** אורי רוצה תמונה משלה לכל ידיעה, ולא את האנטומיה כתמונה ממוזערת.
**Decision:** `make-images` מצייר כל ידיעה מ-7 הימים האחרונים בסגנון graphic novel מציאותי (FLUX.1 schnell ב-Cloudflare), עם התגית `comic`. ידיעה עם תמונה כזו מציגה אותה לפני תמונת מקור, ובצבע.
**Consequences:** ציור מחדש של ידיעות קיימות משתמש במכסה היומית (70 תמונות, 4 בכל ריצה של 10 דקות).

### ADR-13: מד Hype vs Reality בכללים, ומחירי מניה מ-Yahoo
**Context:** ב-5ח כל ידיעה מקבלת פסק דין שאפשר לבדוק, וידיעה על חברה ציבורית מקבלת גרף מניה.
**Decision:** הציון (0–100) מחושב בקוד ב-`rules.ts` (`hypeScore`) מסוג המקורות, מספרם, כותרת מוגזמת ושאלות פתוחות, וה-AI לא משתתף בו. מחירי סגירה נשמרים פעם ביום (22:30 UTC, ימי מסחר) בטבלה `prices` על ידי הפונקציה `prices`, מה-API הציבורי של Yahoo, בלי מפתח. ה-AI רק בוחר טיקר מרשימה סגורה (`TICKERS`).
**Consequences:** הציון תמיד ניתן להסבר במשפט אחד. אם Yahoo ייחסם, נעבור ל-Twelve Data או Finnhub עם מפתח חינמי. הגרף מציג עובדות בלבד, עם "What happened, not advice".

### ADR-14: פורמט ידיעה 2 ושדרוג הדרגתי
**Context:** הפורמט החדש (סיכום ארוך, לחברה/למניה, Watch next, Bull vs Bear) צריך להגיע גם לידיעות קיימות, בלי לחרוג מהמכסה החינמית של Gemini.
**Decision:** עמודה `format` (1 ישן, 2 חדש). בכל ריצה של `process`, מקומות כתיבה פנויים (עד 3) כותבים מחדש ידיעות מפורסמות מ-7 הימים האחרונים, והן שומרות את `published_at` שלהן. נושא אישי ("Your own") נבנה בצד הלקוח, לפי מילות מפתח מעל כל הידיעות.
**Consequences:** ידיעות ישנות מתעדכנות בהדרגה במשך כמה שעות. נושא אישי לא צריך מקורות או טבלאות חדשות, אבל מוגבל למה שהמקורות הקיימים מכסים.

### ADR-15: כלל "אמיתי" בקוד, בלי עורך בזרימה
**Context:** ב-23/11 הוחלט שאין עורך אנושי, וש-AI מפרסם לבד, אבל רק ממקורות מהימנים (Milestone 6).
**Decision:** לכל מקור יש תפקיד (`tier`): `official` (רשמי), `news` (חדשות מאושר) או `signal` (גילוי). ידיעה מתפרסמת רק אם יש בה לפחות כתבה אחת ממקור `official` או `news` (`statusFor` ב-`rules.ts`). ידיעה עם מקורות גילוי בלבד נשמרת כ-`draft`, ועולה לבד כשמקור מאושר מצטרף. המצב `pending_review` כבר לא בשימוש: ידיעה שנכשלת בכללי הכתיבה גם אחרי כתיבה חוזרת נשארת `draft`. כתבה ממקור AI שיש בכותרת שלה "Nvidia" נכנסת לנושא `nvidia` (`topicFor` ב-`ingest`). האתר טוען רק את הנושאים ai, tesla ו-nvidia; מקורות הסקטורים של 5י כבויים (`active = false`) ולא נמחקו. Anthropic, xAI ו-Mistral נקראים דרך מראה ציבורית של דפי החדשות שלהם (github.com/Olshansk/rss-feeds), כי אין להם RSS משלהם. עיתונאים מהירים (באישור אורי, כרגע Hayden Field, Casey Newton, Nilay Patel ו-Tom Warren) נקראים מפיד ה-RSS של פרופיל ה-Bluesky שלהם, כמקורות גילוי בלבד, עם סינון מילות מפתח. לפוסט אין כותרת, ולכן תחילת הפוסט משמשת ככותרת (`parseFeed`).
**Consequences:** אין תור שמחכה לאדם, וכל ידיעה באתר נשענת על מקור מאושר. מסך העורך נשאר לתיקונים ולהורדה מפרסום (Unpublish מעביר ל-`rejected`). אם המראה של Anthropic, xAI או Mistral תפסיק להתעדכן, המקורות האלה ייכשלו ויכבו לבד אחרי 12 כשלונות.
