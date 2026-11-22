# The English Library — MVP

A cozy, library-themed learning space for **Rabeha's** English course and her four students: **Rania, Zeinab, Mariam and Fatma**. Sessions are books on a shelf. Tasks open into a writing desk or a speaking studio. Students hand in work, Rabeha reviews it with written and audio feedback, and each student's study room grows as she makes progress.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
npm run dev          # development → http://localhost:3000
# or, for real use:
npm run build && npm start      # listens on all network interfaces, port 3000
```

There is no database to install. On the first request the app creates `storage/db.json` and seeds the five profiles plus Session 1.

| Profile | Username | Mobile (demo) |
|---|---|---|
| Rabeha (teacher) | `rabeha` | `01000000000` |
| Rania | `rania` | `01000000001` |
| Zeinab | `zeinab` | `01000000002` |
| Mariam | `mariam` | `01000000003` |
| Fatma | `fatma` | `01000000004` |

**The mobile numbers are placeholders.** Change them in `lib/seed-content.ts` before the first run, or in `storage/db.json` afterwards (then restart).

Other commands:

- `npm run reset` deletes all demo data and uploads. The next request re-seeds.
- `node scripts/smoke-test.mjs http://localhost:3000` runs 30 end-to-end checks against a running server: access rules, data separation, rewards, feedback and cascading deletes. It creates real submissions, so run `npm run reset` afterwards.

## What's in it

**Students**
- **Library room.** Seven shelves: Sessions Archive, Assignments, Vocabulary Vault, Idioms & Phrasal Verbs, Extra Materials, Feedback Corner and Achievements Gallery. Each student also has a personal study room that grows with her points. On mobile the shelves stack vertically.
- **Session books.** Each session opens as a two-page spread: overview, objectives, progress and tasks on one side, tabs for Speaking, Reading, Listening, Grammar, Vocabulary, Phonics, Idioms, Phrasal Verbs and Games & Videos on the other. Empty sections say they're waiting for Rabeha's materials.
- **Task workspace.**
  - Speaking studio: vintage microphone, record / pause / resume / stop, live waveform, playback, delete & re-record, upload an existing audio file, and an ideas notebook for planning before recording.
  - Writing desk: handwritten-notebook editor with word count, photo (JPG/PNG) or PDF upload.
  - Listening room: YouTube or audio player plus questions.
  - Reading nook: text with highlighted key words that show their meaning on hover, plus questions and notes.
  - Drafts autosave. Every submission is a new, immutable version. Reopening a task always shows the latest answer.
- **Submission history** on each task: every version with its date, status and the feedback on *that* version.
- **Vocabulary Vault and Idioms & Phrasal Verbs:** search, filter by session or category, sort, mark as learned, favourite, personal notes, and a 🔊 button that uses the browser's built-in voice.
- **Feedback Corner** with a red badge in the menu and on the shelf when new feedback arrives.

**Rabeha**
- **Teacher's Desk:** queue of submissions waiting for review, plus a card per student with status counts and room level.
- **Student page:** progress per session, every task with its versions, and the student's room and achievements.
- **Review screen:**
  - Listen to audio, view notebook photos and PDFs, read typed answers.
  - Written feedback and recorded or uploaded audio feedback.
  - Corrections: select words in the answer and click *Add selected text as correction*.
  - Score (0–100) and a 1–5 star rating.
  - Choose **Mark as reviewed**, **Request revision** or **Comment only**.
- **Session editor:**
  - Create and edit sessions (including a draft/visible switch), sections (simple markdown), materials (YouTube, links, PDF, audio, images) and tasks (skill, secondary skill, difficulty, minutes, due date, questions, reading text, highlight words, attachments).
  - Add vocabulary and expressions, or reuse an entry from another session, so one entry can belong to several sessions.

**Arabic / RTL:** the العربية / English button switches interface text and the whole layout direction. Lesson content stays in English.

## Reward rule

All values live in `lib/rewards.ts`.

| Event | Bookmarks | When |
|---|---|---|
| First submission of a task | +5 | on submit, once per task |
| Task marked **Reviewed** | +20 | on Rabeha's approval, once per task |
| Every task in a session reviewed | +50 | once per session |
| Milestones (first recording, first review, 5 / 15 entries learned, 5 tasks reviewed…) | +5 to +25 | once each |

Every reward has a unique key per student, so re-submitting, revisions and duplicate uploads never pay twice, and one student's rewards never touch another's. The study room has 8 levels, from a small desk up to a tall arched window. The levels and their thresholds are in `ROOM_LEVELS`.

Session progress on the book covers counts a handed-in task as half done and a reviewed task as fully done.

## Architecture

```
app/                 Next.js App Router pages + API route handlers
  api/               auth, files, drafts, submit, feedback, entries, teacher CRUD
  library/…          student-facing pages (teacher can view sessions & vocab too)
  teacher/…          Rabeha only (enforced in the layout and every API)
components/          Shell, recorder, uploader, media, history, study-room SVG…
lib/
  store.ts           ← the ONLY place that touches persistence
  types.ts           entity types (mirror docs/target-schema.prisma)
  auth.ts            demo access + server-side role checks
  rewards.ts         reward rules, milestones, room levels
  seed-content.ts    Session 1 (speaking task kept word for word)
docs/target-schema.prisma   production schema for PostgreSQL
storage/             db.json + uploads/ (created at runtime, git-ignored)
```

- **Persistence is server-side.** All data lives in `storage/db.json` on the machine running the app. Writes are serialised and atomic. Everyone who opens the **same running server** (for example, students on the same Wi-Fi opening `http://<your-PC-IP>:3000`) shares the same data. Nothing syncs anywhere else: separate copies of the app on different computers are separate libraries.
- **Uploads** go to `storage/uploads/`. The database stores only metadata (name, type, size, owner, storage key). Allowed types are audio, JPG/PNG/WebP and PDF for students, plus Office documents for Rabeha. Limit: 25 MB per file.
- **Access rules are checked on the server:**
  - Students can only read and write their own drafts, submissions, files, notes and rewards.
  - Teacher APIs return 403 to students.
  - Files are served only to their owner, to Rabeha, or as course material or as feedback on the student's own work.

## Known limitations (be honest with the class)

1. **Demo access is not authentication.** Anyone who knows a username and mobile number can enter as that person. Don't put anything private in the app, and don't expose it to the public internet as-is.
2. **Recording on phones needs HTTPS.** Browsers only allow the microphone on `https://` or `localhost`. A phone opening `http://192.168.x.x:3000` will get a clear message and can still **upload** a voice-memo file. To record in-browser on phones, deploy behind HTTPS (see below) or use a tunnel such as Cloudflare Tunnel.
3. Built for one class on one server. The JSON store is fine for 5 people. It is not designed for hundreds of concurrent writers.
4. No push notifications: the feedback badge updates when the student opens or refreshes the app.
5. YouTube titles are placeholders ("Session 1 — Video 1/2"). Rabeha can rename them in the session editor.

## Going to a shared, multi-device deployment

1. **Database:** copy `docs/target-schema.prisma` into `prisma/schema.prisma` and point it at PostgreSQL (Neon, Supabase or Railway). Replace the `read()` / `mutate()` calls with Prisma queries. They're all in `app/api/**` and the page files, and `lib/types.ts` already matches the models. Import `storage/db.json` with a one-off script.
2. **Files:** swap the two functions in `app/api/files/*` for S3 / Cloudflare R2 / Supabase Storage. `FileAsset.storageKey` already holds the object key.
3. **Authentication:** replace `getCurrentUser()` in `lib/auth.ts` with a real session (NextAuth/Auth.js, Clerk or Supabase Auth, with phone OTP if you want to keep "mobile number" as the identity). Every role check already goes through `requireApiUser` / `requirePageUser`, so nothing else changes.
4. **Hosting:** any Node host with HTTPS (Vercel + Postgres + R2, Railway, Render, a VPS behind Caddy). HTTPS also unlocks microphone recording on phones.
"# TEL" 
