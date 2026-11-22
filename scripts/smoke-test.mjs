// End-to-end API checks against a running server.
// Usage:  npm run reset && npm run build && npm start   (in one terminal)
//         node scripts/smoke-test.mjs [http://localhost:3000]
// It creates real submissions, so reset again afterwards for a clean demo.
import { readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

function client() {
  let cookie = "";
  return async (path, { method = "GET", json, form } = {}) => {
    const res = await fetch(BASE + path, {
      method, redirect: "manual",
      headers: { ...(cookie && { cookie }), ...(json && { "content-type": "application/json" }) },
      body: json ? JSON.stringify(json) : form,
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const type = res.headers.get("content-type") || "";
    const body = type.includes("json") ? await res.json() : await res.text();
    return { status: res.status, body };
  };
}

// Reads the app's data from wherever the server keeps it (Postgres when DATABASE_URL is set, else the JSON file).
const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let pgClient = null;
async function db() {
  if (!PG_URL) return JSON.parse(readFileSync("storage/db.json", "utf8"));
  if (!pgClient) {
    const { default: pg } = await import("pg");
    pgClient = new pg.Client({ connectionString: PG_URL, ssl: /localhost|127\.0\.0\.1/.test(PG_URL) ? false : { rejectUnauthorized: false } });
    await pgClient.connect();
  }
  return (await pgClient.query("SELECT doc FROM app_state WHERE id = 1")).rows[0].doc;
}

const anon = client();
await anon("/enter");
const d0 = await db();
const user = (u) => d0.users.find((x) => x.username === u);
const rania = client(), zeinab = client(), teacher = client();

ok((await anon("/library")).status === 307, "anonymous visitor is redirected away from the library");
ok((await rania("/api/auth/login", { method: "POST", json: { userId: user("rania").id, username: "rania", mobile: "000" } })).status === 400, "wrong mobile number is rejected");
ok((await rania("/api/auth/login", { method: "POST", json: { userId: user("rania").id, username: "Rania", mobile: user("rania").mobile, avatar: "swan" } })).status === 200, "Rania enters with username + mobile");
await zeinab("/api/auth/login", { method: "POST", json: { userId: user("zeinab").id, username: "zeinab", mobile: user("zeinab").mobile } });
await teacher("/api/auth/login", { method: "POST", json: { userId: user("rabeha").id, username: "rabeha", mobile: user("rabeha").mobile } });

const task = d0.tasks[0];
ok(task.title === "You're the Singer!", "Session 1 speaking task is seeded");

// drafts
const dr = await rania(`/api/tasks/${task.id}/draft`, { method: "PUT", json: { notes: "My song is called Sunrise." } });
ok(dr.status === 200 && dr.body.notes.includes("Sunrise"), "draft saves");
ok((await rania(`/api/tasks/${task.id}/submit`, { method: "POST", json: { notes: "no audio" } })).status === 400, "speaking task can't be submitted without audio");

// upload audio
const fd = new FormData();
fd.append("file", new File([new Uint8Array(4000).fill(7)], "take1.webm", { type: "audio/webm" }));
const up = await rania("/api/files", { method: "POST", form: fd });
ok(up.status === 200 && up.body.kind === "AUDIO", "audio upload stored as file metadata");
const bad = new FormData(); bad.append("file", new File(["#!/bin/sh"], "x.sh", { type: "application/x-sh" }));
ok((await rania("/api/files", { method: "POST", form: bad })).status === 415, "disallowed file type is refused");

const s1 = await rania(`/api/tasks/${task.id}/submit`, { method: "POST", json: { notes: "My song is called Sunrise.", fileIds: [up.body.id] } });
ok(s1.status === 200 && s1.body.submission.version === 1, "first submission is version 1");
const keys1 = s1.body.granted.map((a) => a.key);
ok(keys1.includes(`submit:${task.id}`) && keys1.includes("milestone:first-recording"), `rewards granted on submit: ${keys1.join(", ")}`);
const s2 = await rania(`/api/tasks/${task.id}/submit`, { method: "POST", json: { notes: "v2", fileIds: [up.body.id] } });
ok(s2.body.submission.version === 2 && s2.body.granted.length === 0, "re-submitting creates v2 and grants no duplicate reward");

// separation
ok((await zeinab(`/api/files/${up.body.id}`)).status === 404, "Zeinab cannot open Rania's recording");
ok((await rania(`/api/files/${up.body.id}`)).status === 200, "Rania can open her own recording");
ok((await teacher(`/api/files/${up.body.id}`)).status === 200, "Rabeha can open Rania's recording");
const zPage = await zeinab(`/library/tasks/${task.id}`);
ok(zPage.status === 200 && !zPage.body.includes("Sunrise"), "Zeinab's task page shows none of Rania's work");
ok((await zeinab(`/api/submissions/${s2.body.submission.id}/feedback`, { method: "POST", json: { text: "hi", decision: "REVIEWED" } })).status === 403, "student cannot give feedback");
ok((await zeinab("/api/teacher/sessions", { method: "POST", json: { title: "Hack" } })).status === 403, "student cannot create sessions");
ok((await zeinab("/teacher")).status === 307, "student is redirected away from the teacher desk");

// teacher review
const fb = await teacher(`/api/submissions/${s2.body.submission.id}/feedback`, { method: "POST", json: {
  text: "Lovely story!", score: 88, rating: 5, decision: "REVIEWED",
  corrections: [{ original: "I sing along the song", correction: "I sing along to the song", note: "sing along TO" }] } });
ok(fb.status === 200 && fb.body.submissionId === s2.body.submission.id, "feedback is attached to the exact submission (v2)");
const d1 = await db();
const ra = d1.achievements.filter((a) => a.studentId === user("rania").id).map((a) => a.key);
ok(ra.includes(`reviewed:${task.id}`) && ra.some((k) => k.startsWith("session:")), "review grants the reviewed + session-complete rewards");
ok(!d1.achievements.some((a) => a.studentId === user("zeinab").id), "Zeinab's rewards are untouched");
ok(d1.submissions.find((s) => s.id === s1.body.submission.id).status === "SUBMITTED", "v1 keeps its own status (history preserved)");
const fbPage = await rania("/library/feedback");
ok(fbPage.body.includes("Lovely story!") && fbPage.body.includes("sing along to the song"), "Rania sees the feedback and correction");
const lib = await rania("/library");
ok(/class="dot"/.test(lib.body), "library shows a new-feedback indicator");

// teacher CRUD
const ns = await teacher("/api/teacher/sessions", { method: "POST", json: { title: "Test session", published: false } });
ok(ns.status === 201 && ns.body.levelId, "teacher creates a new session (numbered within its level)");
const nt = await teacher("/api/teacher/tasks", { method: "POST", json: { sessionId: ns.body.id, title: "Read & answer", skill: "READING", questions: [{ prompt: "What is the main idea?" }] } });
ok(nt.status === 201 && nt.body.questions[0].id, "teacher creates a reading task with questions");
const ne = await teacher("/api/teacher/expressions", { method: "POST", json: { expression: "face the music", meaning: "accept the consequences", category: "IDIOM", sessionIds: [ns.body.id] } });
ok(ne.status === 201 && ne.body.sessionIds[0] === ns.body.id, "expression is linked to its session");
ok((await zeinab(`/library/sessions/${ns.body.id}`)).status === 404, "unpublished session is hidden from students");
ok((await teacher(`/api/teacher/sessions/${ns.body.id}`, { method: "DELETE" })).status === 200, "teacher deletes the test session");
ok(!(await db()).tasks.some((t) => t.sessionId === ns.body.id), "deleting a session cascades to its tasks");

if (pgClient) await pgClient.end();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
