# Changelog

All notable functional improvements, database safety migrations, security hardenings, and architectural additions to the **QR Code Attendance Management System** are documented in this file.

---

## [Version 2.2.0] — Academic Session Architecture, Security Hardening & Functional Audit Release

### 1. Added
- **Academic Session Architecture (`academic_sessions` Table)**:
  - Created `academic_sessions` schema containing `name` (e.g. `2024/2025`, `2025/2026`), `start_date`, `end_date`, `is_current`, `status` (`ACTIVE`, `INACTIVE`, `CONCLUDED`), timestamps, and soft deletes.
  - Implemented `App\Models\AcademicSession` Eloquent model with `scopeCurrent()` and `scopeActive()` query scopes.
  - Added additive foreign key `academic_session_id` to `lecture_sessions` table with cascade protections.
- **Academic Session API Endpoints (`AcademicSessionController`)**:
  - `GET /api/v1/academic-sessions` — Paginated listing with search, status filtering, and dependent lecture sessions count.
  - `GET /api/v1/academic-sessions/current` — Retrieves currently active academic session.
  - `POST /api/v1/academic-sessions` — Admin creation with automatic single-active session state enforcement.
  - `POST /api/v1/academic-sessions/{id}/activate` — Dedicated atomic activation endpoint unsetting previous active sessions.
  - `DELETE /api/v1/academic-sessions/{id}` — Safe deletion with cascade check preventing deletion if dependent lecture sessions exist.
- **Frontend Academic Session Integration**:
  - Added TypeScript domain interfaces `AcademicSessionRecord` and TanStack Query v5 hooks (`useAcademicSessions`, `useCurrentAcademicSession`, `useCreateAcademicSession`, `useUpdateAcademicSession`, `useActivateAcademicSession`, `useDeleteAcademicSession`).
  - Added dynamic Academic Session dropdown selector to `app/admin/dashboard/@formmodal/(.)addsession/page.tsx` pre-selected to the current active session.
  - Added Academic Session badge indicator in Lecture Sessions table and filters in Attendance Logs table.
- **Automated Feature Test Suite**:
  - Authored `backend/tests/Feature/AcademicAttendanceWorkflowTest.php` covering 11 critical integration flows with 23 assertions.

---

### 2. Improved & Fixed
- **Attendance Verification & Time Window Enforcement (`AttendanceController::scan`)**:
  - **Academic Session Status Check**: Rejects attendance scans if the lecture session belongs to an inactive/concluded academic session (`400 Bad Request`).
  - **Start Time Validation**: Checks if student attempts to check in before session `start_time` (with a 5-minute early buffer) -> `"Attendance session has not started. Please wait until [start_time]."`.
  - **End Time & Closing Validation**: Rejects check-ins attempted after session `end_time` (with a 5-minute grace period) -> `"Attendance session has closed for this lecture."`.
  - **Attendance Status Determination**:
    - Scans recorded within the first 15 minutes of lecture start time are recorded as `PRESENT`.
    - Scans recorded after 15 minutes but before session conclusion are automatically recorded as `LATE`.
- **Duplicate Attendance Prevention**:
  - Verified and strengthened database-level composite unique index `['student_id', 'lecture_session_id']` and application-level check returning `HTTP 409 Conflict` with `"Attendance has already been recorded for this session."`.
- **Student Eligibility Enforcement**:
  - Validates student's enrolled department against the hosting lecture session's department, rejecting cross-departmental scans with `HTTP 403 Forbidden`.
- **Lecturer IDOR & Authorization Hardening**:
  - In `LectureSessionController::store`, verifies lecturer is assigned to the course.
  - In `LectureSessionController::generateQrToken` and `endSession`, enforces that lecturers can only generate QR codes and conclude sessions they own (`403 Forbidden`).
  - In `StudentController::publicRegister`, strictly enforces assignment of the `Student` role to prevent privilege escalation.

---

### 3. Database Safety & Migrations
- Added `2026_08_01_000001_create_academic_sessions_table.php` (Additive table creation).
- Added `2026_08_01_000002_add_academic_session_id_to_lecture_sessions_table.php` (Additive nullable foreign key).
- Updated `DatabaseSeeder.php` to seed `2025/2026` active academic session and `2024/2025` concluded academic session, linking existing sample sessions.

---

### 4. Verification & Testing Matrix

| Scenario / Requirement | Expected Behavior | Automated / Manual Test Status |
| :--- | :--- | :--- |
| **Admin Login & Auth Token** | Issues Bearer token & Sanctum session | **PASS** |
| **Academic Session Creation** | Stores new session; handles `is_current` | **PASS** (`test_admin_can_create_and_list_academic_sessions`) |
| **Academic Session Activation** | Sets chosen session as current, resets others | **PASS** (`test_academic_session_activation`) |
| **Deletion Protection** | Rejects deletion if linked sessions exist (`422`) | **PASS** (`test_cannot_delete_academic_session_with_dependent_records`) |
| **Lecture Session Scheduling**| Associates with active academic session | **PASS** (`test_lecture_session_creation_with_academic_session`) |
| **Encrypted QR Generation** | AES-256 encrypted payload with session ID | **PASS** (`test_qr_token_generation`) |
| **Valid Student Scan** | Records check-in as `PRESENT` | **PASS** (`test_student_attendance_scan_success`) |
| **Duplicate Scan Rejection** | Returns `409 Conflict` on re-scan | **PASS** (`test_duplicate_attendance_scan_rejected`) |
| **Inactive Academic Session** | Rejects check-in for concluded session (`400`)| **PASS** (`test_inactive_academic_session_scan_rejected`) |
| **Future Session Scan** | Rejects check-in before start time (`400`) | **PASS** (`test_future_session_scan_rejected`) |
| **Department Eligibility** | Rejects un-enrolled students (`403`) | **PASS** (`test_student_from_different_department_rejected`) |
| **Lecturer IDOR Protection** | Rejects editing another lecturer's session (`403`)| **PASS** (`test_lecturer_cannot_modify_other_lecturer_session`) |
| **Full PHP Test Suite** | 13/13 Feature & Unit tests pass | **PASS** (`php artisan test`) |
| **Frontend TypeScript Build** | `npx tsc --noEmit` & `npm run build` | **PASS** (39/39 routes compiled cleanly) |
