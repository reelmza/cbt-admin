# CBT-V2 — User Guide

This guide explains how to use the **CBT-V2 administration portal**, the staff-facing
web application for running computer-based tests (CBTs) at your institution. From here
you manage students, staff, faculties, courses and assessments, run exams, monitor
candidates live, grade submissions and publish results.

> This portal is for **staff** (administrators and invigilators). Students sit their
> exams through the separate candidate application; they do not log in here.

---

## Table of contents

1. [Roles and what each can do](#1-roles-and-what-each-can-do)
2. [Logging in](#2-logging-in)
3. [The dashboard](#3-the-dashboard)
4. [Setting up your institution (first-time setup)](#4-setting-up-your-institution-first-time-setup)
5. [Faculties and departments](#5-faculties-and-departments)
6. [Courses](#6-courses)
7. [Students](#7-students)
8. [Staff (administrators & invigilators)](#8-staff-administrators--invigilators)
9. [Assessments](#9-assessments)
   - [Creating an assessment](#91-creating-an-assessment)
   - [Adding sections and questions](#92-adding-sections-and-questions)
   - [Bulk-uploading questions](#93-bulk-uploading-questions-from-csv)
   - [Configuring an assessment](#94-configuring-an-assessment)
   - [Assigning students](#95-assigning-students)
   - [Assigning invigilators](#96-assigning-invigilators)
   - [Running the exam](#97-running-the-exam)
10. [Live invigilation & monitoring](#10-live-invigilation--monitoring)
11. [Marking and grading](#11-marking-and-grading)
12. [Analytics and results](#12-analytics-and-results)
13. [Archiving assessments](#13-archiving-assessments)
14. [Audit logs](#14-audit-logs)
15. [Settings](#15-settings)
16. [Tips & troubleshooting](#16-tips--troubleshooting)

---

## 1. Roles and what each can do

The portal has three staff roles. What you see in the left-hand sidebar depends on your role.

| Capability | Superadmin | Admin | Invigilator |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| View students & faculties & courses | ✅ | ✅ | ✅ |
| Add/edit faculties, courses; bulk-upload students | ✅ | — | — |
| Create assessments | ✅ | ✅ | — |
| Manage **any** assessment | ✅ | own only | — |
| Manage staff accounts | ✅ | — | — |
| Invigilator dashboard & live monitoring | ✅ | — | ✅ |
| Archived assessments | ✅ | — | — |
| Audit logs | ✅ | — | — |
| Settings | ✅ | — | — |

- **Superadmin** — full control over the whole system and its configuration.
- **Admin** — creates and runs their own assessments. Admins can see lists of
  students/courses/faculties but cannot edit those records; they can only open and
  control assessments they created.
- **Invigilator** — monitors live exams they have been assigned to. No setup or
  editing rights.

---

## 2. Logging in

1. Open the portal URL in your browser.
2. Enter your **email address** and **password**, then click **Continue**.
3. On success you land on the **Dashboard**.

If you see *"Incorrect details provided"*, re-check your email and password. If you
see *"We couldn't reach the server"*, the exam server may be offline — wait a moment
and try again.

To sign out, use the **Logout** button at the bottom of the sidebar.

---

## 3. The dashboard

The dashboard greets you with your name and email and offers **Quick Actions**:

- **Bulk Upload Students** → jumps to the Students page.
- **Create an Assessment** → jumps to Assessments.
- **Create a Faculty** → jumps to Faculties.

Use the left sidebar to navigate to any section at any time.

---

## 4. Setting up your institution (first-time setup)

*(Superadmin only — under **Settings → General**.)*

Before creating assessments, set up the basics so everything is labelled correctly:

1. **Institution Details** — institution name, short name/abbreviation, contact email,
   and a **logo** (PNG/JPG, recommended 256×256px). The logo and names appear in the
   sidebar and on generated documents.
2. **Academic Session** — set the current **session** (e.g. `2024/2025`) and **semester/term**
   (First or Second). New assessments default to these values, so keep them current.

Click **Save Changes** in each card.

A sensible setup order is: **Institution → Faculties → Departments → Courses →
Students → Staff → Assessments**.

---

## 5. Faculties and departments

*(Superadmin creates/edits; everyone can view.)*

Faculties (and the departments inside them) are how students are grouped, so you can
later assign whole cohorts to an exam.

**Create a faculty** — go to **Faculties**, click **Create Faculty**, and enter a
**code**, **name**, and short **description**. The table shows each faculty's code,
name, description, number of departments, and creation date. Click the **pencil** icon
to edit a faculty.

**Departments** live under **Faculties → Departments** (a sub-item in the sidebar).
Each department belongs to a faculty.

---

## 6. Courses

*(Superadmin adds; everyone can view.)*

A course is a subject that can be examined.

1. Go to **Courses**.
2. Click **Add a course**.
3. Enter a **course code**, **title**, and **description**, then **Add course**.

Use the search box to find courses by title, code or description. The list is paginated —
use **Previous / Next** to move between pages.

---

## 7. Students

*(Superadmin manages; admins/invigilators can view and search.)*

Students are added in bulk rather than one at a time.

### Bulk-upload students

1. Go to **Users** (Students tab).
2. Click **Bulk Upload Students**.
3. Click **Download Upload Template** and fill in the spreadsheet with student details.
4. Choose the **faculty** and **department** the batch belongs to.
5. Select your completed file and click **Upload File**.

> If any row in the file has an error (e.g. a duplicate), **no** students are uploaded —
> fix the file and re-upload the whole batch.

### Bulk-upload passports (photos)

Click **Bulk Upload Passports** and upload a **.zip** of student photos. Each photo is
matched to a student by registration number, so name the images accordingly.

### Finding students

- **Search** by name, registration number, email or phone.
- **Filter** by level (100–500), faculty, and department.
- Use **Clear Filters** to reset, and **Previous / Next** to page through results.
  Superadmins can click a student row to open their detail page.

---

## 8. Staff (administrators & invigilators)

*(Superadmin only — **Users → Administrators**.)*

The Administrators tab lists all staff accounts with name, email, role, phone and
enrolment date.

**Create a staff member:** click **Create Admin**, enter full name, email and a
password, choose a **role** (Admin, Super Admin, or Invigilator), and submit.

---

## 9. Assessments

The **Assessments** page is the heart of the portal. It lists every assessment with its
course, due date, number of sections/questions, assigned students, total marks, and
status. You can:

- **Filter** with the tabs: *All Assessment*, *Not Started*, *Ongoing*, *Completed*.
- **Search** by title.
- (Superadmin) Toggle **Archived** to include archived assessments.
- Open an assessment you control by clicking its **Actions** link.

### 9.1 Creating an assessment

*(Superadmin or Admin — click **Create an Assessment**.)*

A dialog asks for the assessment details:

- **Course** — the subject being examined.
- **Session** and **Term** — default to your institution's current settings.
- **Instruction** — general instructions shown to candidates.
- **Total Marks** and **Status** — choose **Publish Now** to make it live, or
  **Save Draft** to keep working on it.
- **Start** and **End (due) dates**.

Click **Proceed to Questions** to continue, or **Cancel** to go back.

### 9.2 Adding sections and questions

An assessment is organised into **sections**, each holding questions of one type.

**Add a section** — in the right-hand panel click **Add a Section** and set:

- **Section title** and **description/instruction**.
- **Section type:**
  - **Objective** (multiple choice) — one correct answer (A–D).
  - **Multiple Select** — one *or more* correct answers (A–D).
  - **Subjective** — short typed answers checked against accepted answers (answer "slots").
  - **Theory** — long written answers; marked manually or by AI against an expected answer.
- **Each question's score** — the default mark per question in that section.

**Add questions** — with a section active, type the question, add options/answers, mark
the correct one(s), and click **Add Question**. Notes:

- Objective/Multiple-select questions support up to **4 options** (A–D). Pick the
  correct option with the radio button (objective) or checkboxes (multiple select).
- **Subjective** slots accept comma-separated acceptable answers (e.g. `Ans 1, Ans 2`).
- **Theory** takes a single expected answer and is flagged for manual/AI marking.
- You can attach an **image** to any question (JPG/PNG) and preview how candidates will see it.
- Each section holds up to **60 questions**.

Use the numbered buttons in the side panel to jump between questions, **Add Question**
to create more, or **Delete Section** to remove a whole section. Editing a saved
question shows **Update Question** instead of Add.

When finished, click **Submit Assessment**.

### 9.3 Bulk-uploading questions (from CSV)

For objective sections you can import many questions at once:

1. Make sure an **Objective (multiple choice)** section is active.
2. Click **Bulk Upload** and choose a **.csv** file with these columns:
   `question, option_a, option_b, option_c, option_d, correct_answer, score`.
3. The questions load into the section. If a column is missing or the file is malformed,
   nothing is imported and you'll get an error.

### 9.4 Configuring an assessment

Open an assessment to reach its control page. The top cards show **status, question
count, total marks** and **time allocated**. Below, the controls (only editable by the
assessment's owner or a superadmin) let you set:

- **Test Duration** — total time in minutes.
- **Test Status** — start / end / restart the exam (see [Running the exam](#97-running-the-exam)).
- **Start Date** and **Due Date**.
- **Total Marks** and **Pass Mark (%)**.
- **Shuffle Questions** — toggle per section type so each candidate sees questions in a
  random order.
- **Browser Restrictions** — when enabled, the candidate app locks down the browser
  (helps deter cheating; works with live violation tracking).

Each field has its own **Save** button.

### 9.5 Assigning students

On the right of the control page you choose who sits the exam:

- **Assign by level / faculty / department** — pick an action (**Assign** or **Unassign**),
  a **level**, and optionally a **faculty** and **department**, then **Proceed** to assign a
  whole cohort at once.
- **Assign a single student** — enter their **registration number** and click **Assign**.
- **Bulk assign / unassign** (for carry-over or borrowed-course students) — upload an
  **.xlsx** file of registration numbers. Use **Download template** to get the correct format.

### 9.6 Assigning invigilators

Invigilators must be attached to an assessment before they can monitor it. Use the
**Invigilators** dialog on the assessment to add staff (with the invigilator role) and
remove them again as needed.

### 9.7 Running the exam

The **Test Status** card drives the live exam:

- **Start Exam** — authorises the assessment so assigned candidates can begin. (Status
  becomes *Ongoing*.)
- **End Exam** — closes the exam for everyone.
- **Restart Exam** — reopens an exam that was ended.

Until you click *Start Exam*, candidates see "Not cleared to start".

---

## 10. Live invigilation & monitoring

*(Invigilator or Superadmin — **Invigilator** in the sidebar.)*

The **Invigilator Dashboard** lists the assessments you're assigned to. For each one it
shows the session/term, dates, total marks, and live counts of **total, submitted,
in-progress, still-writing** and **locked** candidates, plus a per-student table with
**status** and **violation count**.

Click **Monitoring** on an assessment to open the **live monitoring** screen. It connects
in real time (a "Live" indicator confirms the connection) and updates as candidates act:

- See each candidate's **status** (writing, submitted, locked, disconnected), **online/offline**
  connection, live **progress** (answered / total), and **violation count**.
- Stat cards track totals, who's online, who has started, and who is locked.

### Handling violations

When a candidate triggers a violation (e.g. leaving the exam window), it's counted live.
Repeated violations can **lock** a candidate or trigger an **auto-submit**. To review:

1. Click **(n) View Details** in the candidate's **Violations** column.
2. Read the list of violations with timestamps.
3. To excuse one, click **Pardon** — a **pardon code** is generated. Give this code to the
   candidate so they can resume.

---

## 11. Marking and grading

From an assessment's control page, open **View/Mark Submissions**.

The submissions list shows every candidate with their reg number, level, auto-marking
status, current score, and whether marking is **finalized**. You can click **Remark
Assessment** to re-run automatic marking across all submissions.

Click a submission to open the **marking screen** for that candidate:

- Objective and multiple-select answers are **auto-marked** and shown as Correct/Wrong.
- For **subjective/theory** answers you see the candidate's response next to the
  expected answer. Mark each:
  - **WRONG** awards 0, or
  - enter a **score** and confirm to award marks (up to the question's maximum).
- **AI Marking** (available on the cloud deployment) can grade written answers for you and
  attach feedback; you can still override any result.
- When done, click **Finalize Marking** to lock in the candidate's result.

---

## 12. Analytics and results

**Analytics** (from the assessment control page → **View Analytics**) shows:

- **Pass Rate** cards: total students, passed, failed, auto-submitted, pass/fail rate,
  and the configured pass mark. Click **Download PDF** for a report.
- **Student Rankings**: a leaderboard with each student's score, percentage, rank, and
  whether they were auto-submitted.

**Generate Results / Entries** (from the control page) lets you export:

- **Generate Submissions (Scripts)** — download raw submissions.
- **Generate Results** — export the result sheet as **PDF** or **XLSX**.

---

## 13. Archiving assessments

To take a finished assessment out of the active list, open it and click **Archive
Assessment**. Archived assessments are hidden by default; superadmins can view them via
the **Archived** toggle on the Assessments page or the **Assessments → Archived** sidebar item.

---

## 14. Audit logs

*(Superadmin only — **Audit Logs** in the sidebar.)*

A searchable, paginated record of important actions across the system. Each entry shows
the **actor**, **action** (create, update, focus-lost, reconnect, pardon-applied…),
**entity**, **IP address**, and **date**. Filter by action type, and click **View** for the
full detail of any record (including actor email, entity ID and full description).

---

## 15. Settings

*(Superadmin only.)*

- **General** — institution details and academic session (see [section 4](#4-setting-up-your-institution-first-time-setup)).
- **Appearance** — visual/theme preferences.
- **Security** — change your account password (enter current password, then the new one twice).
- **Backup & Sync** — synchronise data between the local exam server and the cloud.
  Push/pull individual collections or use **Push All / Pull All**. The most recently
  changed record wins on conflicts.
- **Database** — **permanently delete** records from selected collections (assessments,
  students, courses, groups, sub-groups, admins). This **cannot be undone**; the *Admins*
  collection is especially dangerous and rarely needed. After clearing, a results panel
  shows exactly how many records were removed.

---

## 16. Tips & troubleshooting

- **A student isn't getting the exam** — confirm they're **assigned** (by cohort or reg
  number) and that you've clicked **Start Exam**.
- **Upload rejected** — student/question uploads are all-or-nothing. Use the provided
  template and check for duplicate or malformed rows.
- **Candidate is locked out** — open live monitoring, review their violations, and
  **Pardon** if appropriate, then share the pardon code.
- **Can't edit an assessment** — only the creator (or a superadmin) can change an
  assessment's settings; others see the controls greyed out.
- **AI marking unavailable** — AI marking only runs on the cloud deployment, not the
  local exam server.
- **Don't see a menu item** — visibility depends on your role (see [section 1](#1-roles-and-what-each-can-do)).
- **Always keep the academic session/term current** in Settings so new assessments are
  labelled correctly.
</content>
</invoke>
