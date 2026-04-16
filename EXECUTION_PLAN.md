# Smart Attendance — Execution Plan (MERN)

**Stack:** MongoDB, Express, React (Vite), Node.js, JWT auth, Socket.IO (real-time), qrcode + html5-qrcode.

Each phase delivers a **testable slice** — backend + frontend together — so you can validate after every step.

---

## Phase 0 — Project Scaffolding
**Goal:** Monorepo runs end-to-end with a "hello world" API call.
- Create `/server` (Express + Mongoose + dotenv + cors) and `/client` (Vite + React + Tailwind + React Router).
- Add `.env` (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`).
- Root `package.json` with `concurrently` to run both.
- **Test:** `npm run dev` → client hits `/api/health`, sees `{ ok: true }`.

---

## Phase 1 — Root Homepage + Routing Shell
**Goal:** Public landing page + route skeleton.
- Landing page (hero, features, CTA: Login / Signup).
- Routes: `/`, `/login`, `/signup`, `/teacher/*`, `/student/*` (protected placeholders).
- **Test:** Navigate all routes; protected routes redirect to `/login`.

---

## Phase 2 — Auth (Signup/Login, Teacher & Student)
**Goal:** Working auth with role selection.
- Backend: `User` model (`role: teacher | student`), `/api/auth/signup`, `/api/auth/login`, bcrypt, JWT.
- Frontend: Signup (role toggle), Login, AuthContext, axios interceptor, protected routes by role.
- **Test:** Sign up as teacher and student; login routes to correct dashboard.

---

## Phase 3 — Forgot / Reset Password
**Goal:** Password recovery flow.
- Backend: `/forgot-password` (token + expiry), `/reset-password/:token`. Use nodemailer (Ethereal for dev).
- Frontend: Forgot page, Reset page.
- **Test:** Request reset → open dev mail link → set new password → login works.

---

## Phase 4 — Profile Management (Teacher & Student)
**Goal:** View/edit own profile.
- Backend: `GET/PUT /api/users/me` (name, phone, department / roll no., avatar URL).
- Frontend: Profile page for each role with edit form.
- **Test:** Update profile, refresh, changes persist.

---

## Phase 5 — Class / Course Management (Teacher)
**Goal:** Teachers create and manage classes.
- Backend: `Class` model (`name`, `code`, `teacherId`, `studentIds[]`). CRUD under `/api/classes`.
- Frontend: Teacher → "My Classes" list + create modal + class detail page.
- **Test:** Teacher creates class, sees it in list, can edit/delete.

---

## Phase 6 — Assign Students to Class
**Goal:** Teacher enrolls students.
- Backend: `GET /api/users/students?search=`, `POST /api/classes/:id/assign`, `DELETE .../unassign`.
- Frontend: Class detail → search/add students, roster table with remove.
- Student side: "My Classes" list showing enrolled classes.
- **Test:** Assign student; student sees class in their dashboard.

---

## Phase 7 — Session Creation + QR Generation
**Goal:** Teacher starts a session with QR.
- Backend: `Session` model (`classId`, `title`, `startTime`, `durationMin`, `qrToken`, `status`). `POST /api/sessions`, signed short-lived token; `GET /api/sessions/:id/qr` returns QR (rotate token every 10–15s optional).
- Frontend: Class page → "Start Session" form → full-screen QR display with countdown and live roster.
- **Test:** Teacher starts session; QR renders; session visible to assigned students.

---

## Phase 8 — Student QR Scan + Attendance Marking
**Goal:** Student scans QR, attendance recorded.
- Backend: `Attendance` model (`sessionId`, `studentId`, `status`, `scannedAt`). `POST /api/attendance/mark` validates: session active, student assigned, no duplicate.
- Frontend: Student dashboard → "Scan QR" (html5-qrcode camera) → success/error toast.
- **Test:** Assigned student marks present; unassigned student gets rejected; duplicate scan blocked.

---

## Phase 9 — Real-Time Attendance + Notifications
**Goal:** Live updates via Socket.IO.
- Server: emit `session:created` to class room, `attendance:marked` to teacher room.
- Client: teacher's live session page updates roster instantly; student dashboard shows toast when new session starts.
- **Test:** Two browsers — student scan appears on teacher screen within a second.

---

## Phase 10 — Attendance Close + Absent Marking
**Goal:** Finalize session.
- Backend: `POST /api/sessions/:id/end` auto-marks un-scanned assigned students as absent.
- Frontend: Teacher "End Session" button; final summary.
- **Test:** End session → absentees appear with `status=absent`.

---

## Phase 11 — Student Attendance Dashboard + History
**Goal:** Students see their record.
- Backend: `GET /api/attendance/me?classId=` (grouped by class, with percentage).
- Frontend: Student dashboard: overall %, per-class cards, drill-down session history with status.
- **Test:** Student sees accurate history and percentage after multiple sessions.

---

## Phase 12 — Teacher Attendance Reports
**Goal:** Teacher views / exports records.
- Backend: `GET /api/classes/:id/attendance` (per-session and per-student summaries), CSV export.
- Frontend: Reports tab with filters (date range, session), table + percentage per student + CSV download.
- **Test:** Teacher filters by date, exports CSV, numbers match student view.

---

## Phase 13 — Security Hardening + RBAC Audit
**Goal:** Lock it down.
- Role middleware on every route; helmet; rate limit on auth; input validation (zod / joi); QR token HMAC + short TTL + one-time per student.
- **Test:** Try teacher-only route as student → 403; expired / reused QR → rejected.

---

## Phase 14 — Responsive UI Polish
**Goal:** Mobile-first pass.
- Tailwind breakpoints audit (QR scanner, tables → cards on mobile), empty states, loading skeletons, error boundaries.
- **Test:** Use full flow on phone viewport in DevTools and a real phone on LAN.

---

## Phase 15 — Deployment
**Goal:** Live demo.
- Server → Render / Railway; Client → Vercel; MongoDB Atlas; env vars configured; CORS set.
- **Test:** Full teacher → student flow on deployed URLs.

---

## Feature → Phase Map

| Feature | Phase |
|---|---|
| User authentication (Teacher & Student) | 2 |
| Forgot / reset password | 3 |
| Teacher & Student profile management | 4 |
| Class / Course creation | 5 |
| Assign students to class | 6 |
| Session creation (title, duration, start time) | 7 |
| QR code generation per session | 7 |
| Student QR scanning | 8 |
| Attendance validation (assigned only) | 8 |
| Real-time attendance marking | 9 |
| Present / Absent status | 8, 10 |
| Session / attendance notifications | 9 |
| Student attendance dashboard | 11 |
| Attendance history per subject / session | 11 |
| Attendance percentage calculation | 11 |
| Teacher dashboard + records | 12 |
| Per-session / per-class views | 12 |
| Secure session handling | 2, 13 |
| Role-based access control | 2, 13 |
| Responsive web interface | 14 |
| Backend API + DB (MERN) | All |
| Root homepage | 1 |
