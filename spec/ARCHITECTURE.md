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
