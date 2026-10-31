# Endpoints — extracción estática

Prefijo /api/v1 según configuración de ejemplo. No sustituye OpenAPI en ejecución; revisar dependencias RBAC en los archivos indicados. No se atribuyen modelos ni pruebas sin evidencia.

| Método | Ruta | Router | Handler | Response model |
|---|---|---|---|---|
| GET | /api/v1/academic-movements | backend/app/api/v1/endpoints/academic_movements.py | list_movements | Page[AcademicMovementRead] |
| GET | /api/v1/academic-periods | backend/app/api/v1/endpoints/academic_periods.py | list_academic_periods | Page[AcademicPeriodRead] |
| GET | /api/v1/academic-periods/{period_id} | backend/app/api/v1/endpoints/academic_periods.py | get_academic_period | AcademicPeriodRead |
| POST | /api/v1/academic-periods | backend/app/api/v1/endpoints/academic_periods.py | create_academic_period | AcademicPeriodRead |
| PATCH | /api/v1/academic-periods/{period_id} | backend/app/api/v1/endpoints/academic_periods.py | update_academic_period | AcademicPeriodRead |
| GET | /api/v1/academic-years | backend/app/api/v1/endpoints/academic_years.py | list_academic_years | Page[AcademicYearRead] |
| GET | /api/v1/academic-years/{year_id} | backend/app/api/v1/endpoints/academic_years.py | get_academic_year | AcademicYearRead |
| POST | /api/v1/academic-years | backend/app/api/v1/endpoints/academic_years.py | create_academic_year | AcademicYearRead |
| PATCH | /api/v1/academic-years/{year_id} | backend/app/api/v1/endpoints/academic_years.py | update_academic_year | AcademicYearRead |
| GET | /api/v1/ai/capabilities | backend/app/api/v1/endpoints/ai.py | capabilities | See source |
| GET | /api/v1/ai/configuration | backend/app/api/v1/endpoints/ai.py | configuration | See source |
| PATCH | /api/v1/ai/configuration | backend/app/api/v1/endpoints/ai.py | configure | See source |
| GET | /api/v1/ai/tutor/contexts | backend/app/api/v1/endpoints/ai.py | tutor_contexts | See source |
| POST | /api/v1/ai/tutor/messages | backend/app/api/v1/endpoints/ai.py | tutor | AIResult |
| GET | /api/v1/ai/tutor/conversations | backend/app/api/v1/endpoints/ai.py | conversations | See source |
| GET | /api/v1/ai/tutor/conversations/{conversation_id} | backend/app/api/v1/endpoints/ai.py | conversation | See source |
| POST | /api/v1/ai/translate | backend/app/api/v1/endpoints/ai.py | translate | AIResult |
| GET | /api/v1/ai/dictionary/search | backend/app/api/v1/endpoints/ai.py | dictionary_search | See source |
| GET | /api/v1/ai/dictionary/entries/{entry_id} | backend/app/api/v1/endpoints/ai.py | dictionary_entry | See source |
| POST | /api/v1/ai/pronunciation/sessions | backend/app/api/v1/endpoints/ai.py | pronunciation_begin | See source |
| GET | /api/v1/ai/pronunciation/references | backend/app/api/v1/endpoints/ai.py | pronunciation_references | See source |
| GET | /api/v1/ai/pronunciation/references/{entry_id} | backend/app/api/v1/endpoints/ai.py | pronunciation_reference | See source |
| GET | /api/v1/ai/pronunciation/sessions/{session_id} | backend/app/api/v1/endpoints/ai.py | pronunciation_read | See source |
| POST | /api/v1/ai/pronunciation/sessions/{session_id}/attempts | backend/app/api/v1/endpoints/ai.py | pronunciation_attempt | See source |
| GET | /api/v1/ai/usage/me | backend/app/api/v1/endpoints/ai.py | usage | UsageRead |
| GET | /api/v1/ai/usage/institution | backend/app/api/v1/endpoints/ai.py | institutional_usage | See source |
| POST | /api/v1/auth/login | backend/app/api/v1/endpoints/auth.py | login | LoginResponse |
| POST | /api/v1/auth/refresh | backend/app/api/v1/endpoints/auth.py | refresh_token | TokenRefreshResponse |
| POST | /api/v1/auth/logout | backend/app/api/v1/endpoints/auth.py | logout | See source |
| POST | /api/v1/auth/logout-all | backend/app/api/v1/endpoints/auth.py | logout_all | See source |
| GET | /api/v1/auth/me | backend/app/api/v1/endpoints/auth.py | get_current_user_info | CurrentUserResponse |
| GET | /api/v1/auth/sessions | backend/app/api/v1/endpoints/auth.py | get_active_sessions | SessionsResponse |
| GET | /api/v1/auth/csrf | backend/app/api/v1/endpoints/auth.py | get_csrf_token | CSRFResponse |
| POST | /api/v1/auth/change-password | backend/app/api/v1/endpoints/auth.py | change_password | PasswordChangeResponse |
| GET | /api/v1/classrooms | backend/app/api/v1/endpoints/classrooms.py | list_classrooms | Page[ClassroomRead] |
| GET | /api/v1/classrooms/{classroom_id} | backend/app/api/v1/endpoints/classrooms.py | get_classroom | ClassroomDetail |
| GET | /api/v1/classrooms/{classroom_id}/students | backend/app/api/v1/endpoints/classrooms.py | list_classroom_students | List[ClassroomStudentRead] |
| POST | /api/v1/classrooms | backend/app/api/v1/endpoints/classrooms.py | create_classroom | ClassroomRead |
| PATCH | /api/v1/classrooms/{classroom_id} | backend/app/api/v1/endpoints/classrooms.py | update_classroom | ClassroomRead |
| POST | /api/v1/classrooms/{classroom_id}/archive | backend/app/api/v1/endpoints/classrooms.py | archive_classroom | ClassroomRead |
| GET | /api/v1/monitors/me/classrooms | backend/app/api/v1/endpoints/classrooms.py | list_my_classrooms | List[ClassroomRead] |
| GET | /api/v1/content-manifests | backend/app/api/v1/endpoints/content_manifests.py | list_manifests | Page[ContentManifestRead] |
| GET | /api/v1/content-manifests/{manifest_id} | backend/app/api/v1/endpoints/content_manifests.py | get_manifest | ContentManifestRead |
| POST | /api/v1/content-manifests | backend/app/api/v1/endpoints/content_manifests.py | generate_manifest | ContentManifestRead |
| GET | /api/v1/content-manifests/{manifest_id}/verify | backend/app/api/v1/endpoints/content_manifests.py | verify_manifest | See source |
| GET | /api/v1/students/me/manifests | backend/app/api/v1/endpoints/content_manifests.py | get_student_manifests | List[ContentManifestRead] |
| GET | /api/v1/content-publications | backend/app/api/v1/endpoints/content_publications.py | list_publications | Page[ContentPublicationRead] |
| GET | /api/v1/content-publications/{publication_id} | backend/app/api/v1/endpoints/content_publications.py | get_publication | ContentPublicationRead |
| POST | /api/v1/content-versions/{version_id}/publish | backend/app/api/v1/endpoints/content_publications.py | publish_version | ContentPublicationRead |
| PATCH | /api/v1/content-publications/{publication_id} | backend/app/api/v1/endpoints/content_publications.py | update_publication | ContentPublicationRead |
| POST | /api/v1/content-publications/{publication_id}/withdraw | backend/app/api/v1/endpoints/content_publications.py | withdraw_publication | ContentPublicationRead |
| POST | /api/v1/content-publications/{old_publication_id}/supersede/{new_version_id} | backend/app/api/v1/endpoints/content_publications.py | supersede_publication | ContentPublicationRead |
| GET | /api/v1/content-reviews | backend/app/api/v1/endpoints/content_reviews.py | list_reviews | Page[ContentReviewRead] |
| GET | /api/v1/content-reviews/{review_id} | backend/app/api/v1/endpoints/content_reviews.py | get_review | ContentReviewRead |
| POST | /api/v1/content-reviews/submit | backend/app/api/v1/endpoints/content_reviews.py | submit_for_review | ContentReviewRead |
| POST | /api/v1/content-reviews/{review_id}/start | backend/app/api/v1/endpoints/content_reviews.py | start_review | ContentReviewRead |
| POST | /api/v1/content-reviews/{review_id}/decide | backend/app/api/v1/endpoints/content_reviews.py | submit_decision | ContentReviewRead |
| GET | /api/v1/monitors/me/reviews | backend/app/api/v1/endpoints/content_reviews.py | list_my_reviews | Page[ContentReviewRead] |
| GET | /api/v1/reviewers/me/pending | backend/app/api/v1/endpoints/content_reviews.py | get_pending_reviews | List[ContentReviewRead] |
| GET | /api/v1/lessons/{lesson_id}/versions | backend/app/api/v1/endpoints/content_versions.py | list_lesson_versions | Page[ContentVersionRead] |
| GET | /api/v1/units/{unit_id}/versions | backend/app/api/v1/endpoints/content_versions.py | list_unit_versions | Page[ContentVersionRead] |
| GET | /api/v1/courses/{course_id}/versions | backend/app/api/v1/endpoints/content_versions.py | list_course_versions | Page[ContentVersionRead] |
| GET | /api/v1/content-versions/{version_id} | backend/app/api/v1/endpoints/content_versions.py | get_version | ContentVersionRead |
| GET | /api/v1/lessons/{lesson_id}/versions/latest | backend/app/api/v1/endpoints/content_versions.py | get_latest_lesson_version | ContentVersionRead |
| GET | /api/v1/lessons/{lesson_id}/versions/published | backend/app/api/v1/endpoints/content_versions.py | get_published_lesson_version | ContentVersionRead |
| POST | /api/v1/lessons/{lesson_id}/versions | backend/app/api/v1/endpoints/content_versions.py | create_lesson_version | ContentVersionRead |
| POST | /api/v1/units/{unit_id}/versions | backend/app/api/v1/endpoints/content_versions.py | create_unit_version | ContentVersionRead |
| POST | /api/v1/courses/{course_id}/versions | backend/app/api/v1/endpoints/content_versions.py | create_course_version | ContentVersionRead |
| PATCH | /api/v1/content-versions/{version_id} | backend/app/api/v1/endpoints/content_versions.py | update_version | ContentVersionRead |
| DELETE | /api/v1/content-versions/{version_id} | backend/app/api/v1/endpoints/content_versions.py | delete_version | See source |
| GET | /api/v1/courses | backend/app/api/v1/endpoints/courses.py | list_courses | Page[CourseRead] |
| GET | /api/v1/courses/{course_id} | backend/app/api/v1/endpoints/courses.py | get_course | CourseRead |
| GET | /api/v1/courses/{course_id}/detail | backend/app/api/v1/endpoints/courses.py | get_course_detail | CourseRead |
| POST | /api/v1/courses | backend/app/api/v1/endpoints/courses.py | create_course | CourseRead |
| PATCH | /api/v1/courses/{course_id} | backend/app/api/v1/endpoints/courses.py | update_course | CourseRead |
| POST | /api/v1/courses/{course_id}/archive | backend/app/api/v1/endpoints/courses.py | archive_course | CourseRead |
| GET | /api/v1/monitors/me/courses | backend/app/api/v1/endpoints/courses.py | list_my_courses | Page[CourseRead] |
| GET | /api/v1/educational-games | backend/app/api/v1/endpoints/educational_games.py | list_games | Page[EducationalGameRead] |
| GET | /api/v1/educational-games/{game_id} | backend/app/api/v1/endpoints/educational_games.py | get_game | EducationalGameRead |
| GET | /api/v1/educational-games/{game_id}/detail | backend/app/api/v1/endpoints/educational_games.py | get_game_detail | EducationalGameDetail |
| POST | /api/v1/educational-games | backend/app/api/v1/endpoints/educational_games.py | create_game | EducationalGameRead |
| PATCH | /api/v1/educational-games/{game_id} | backend/app/api/v1/endpoints/educational_games.py | update_game | EducationalGameRead |
| DELETE | /api/v1/educational-games/{game_id} | backend/app/api/v1/endpoints/educational_games.py | delete_game | See source |
| GET | /api/v1/courses/{course_id}/games | backend/app/api/v1/endpoints/educational_games.py | list_course_games | Page[EducationalGameRead] |
| GET | /api/v1/students/me/games | backend/app/api/v1/endpoints/educational_games.py | get_student_games | Page[EducationalGameRead] |
| GET | /api/v1/resources | backend/app/api/v1/endpoints/educational_resources.py | list_resources | Page[ResourceRead] |
| GET | /api/v1/resources/{resource_id} | backend/app/api/v1/endpoints/educational_resources.py | get_resource | ResourceRead |
| GET | /api/v1/resources/{resource_id}/detail | backend/app/api/v1/endpoints/educational_resources.py | get_resource_detail | ResourceRead |
| POST | /api/v1/resources | backend/app/api/v1/endpoints/educational_resources.py | create_resource | ResourceRead |
| POST | /api/v1/resources/upload | backend/app/api/v1/endpoints/educational_resources.py | upload_resource | ResourceRead |
| PATCH | /api/v1/resources/{resource_id} | backend/app/api/v1/endpoints/educational_resources.py | update_resource | ResourceRead |
| DELETE | /api/v1/resources/{resource_id} | backend/app/api/v1/endpoints/educational_resources.py | delete_resource | See source |
| GET | /api/v1/resources/{resource_id}/download | backend/app/api/v1/endpoints/educational_resources.py | download_resource | See source |
| GET | /api/v1/enrollments | backend/app/api/v1/endpoints/enrollments.py | list_enrollments | Page[EnrollmentRead] |
| GET | /api/v1/enrollments/{enrollment_id} | backend/app/api/v1/endpoints/enrollments.py | get_enrollment | EnrollmentDetail |
| POST | /api/v1/enrollments | backend/app/api/v1/endpoints/enrollments.py | create_enrollment | EnrollmentRead |
| PATCH | /api/v1/enrollments/{enrollment_id} | backend/app/api/v1/endpoints/enrollments.py | update_enrollment | EnrollmentRead |
| POST | /api/v1/enrollments/{enrollment_id}/withdraw | backend/app/api/v1/endpoints/enrollments.py | withdraw_enrollment | EnrollmentRead |
| POST | /api/v1/enrollments/{enrollment_id}/complete | backend/app/api/v1/endpoints/enrollments.py | complete_enrollment | EnrollmentRead |
| POST | /api/v1/enrollments/{enrollment_id}/transfer | backend/app/api/v1/endpoints/enrollments.py | transfer_enrollment | EnrollmentRead |
| GET | /api/v1/practice-versions/{version_id}/exercises | backend/app/api/v1/endpoints/exercises.py | list_exercises | Page[ExerciseRead] |
| GET | /api/v1/exercises/{exercise_id} | backend/app/api/v1/endpoints/exercises.py | get_exercise | ExerciseRead |
| GET | /api/v1/exercises/{exercise_id}/detail | backend/app/api/v1/endpoints/exercises.py | get_exercise_detail | ExerciseDetail |
| POST | /api/v1/practice-versions/{version_id}/exercises | backend/app/api/v1/endpoints/exercises.py | create_exercise | ExerciseDetail |
| PATCH | /api/v1/exercises/{exercise_id} | backend/app/api/v1/endpoints/exercises.py | update_exercise | ExerciseDetail |
| DELETE | /api/v1/exercises/{exercise_id} | backend/app/api/v1/endpoints/exercises.py | delete_exercise | See source |
| POST | /api/v1/practice-versions/{version_id}/exercises/reorder | backend/app/api/v1/endpoints/exercises.py | reorder_exercises | List[ExerciseRead] |
| POST | /api/v1/exercises/{exercise_id}/options | backend/app/api/v1/endpoints/exercises.py | add_exercise_option | ExerciseOptionRead |
| PATCH | /api/v1/exercise-options/{option_id} | backend/app/api/v1/endpoints/exercises.py | update_exercise_option | ExerciseOptionRead |
| DELETE | /api/v1/exercise-options/{option_id} | backend/app/api/v1/endpoints/exercises.py | delete_exercise_option | See source |
| GET | /api/v1/game-sessions | backend/app/api/v1/endpoints/game_sessions.py | list_sessions | Page[GameSessionRead] |
| GET | /api/v1/game-sessions/{session_id} | backend/app/api/v1/endpoints/game_sessions.py | get_session | GameSessionRead |
| GET | /api/v1/game-sessions/{session_id}/detail | backend/app/api/v1/endpoints/game_sessions.py | get_session_detail | GameSessionDetail |
| POST | /api/v1/educational-games/{game_id}/sessions | backend/app/api/v1/endpoints/game_sessions.py | start_session | GameSessionDetail |
| PATCH | /api/v1/game-sessions/{session_id} | backend/app/api/v1/endpoints/game_sessions.py | update_session | GameSessionRead |
| POST | /api/v1/game-sessions/{session_id}/finish | backend/app/api/v1/endpoints/game_sessions.py | finish_session | GameSessionDetail |
| POST | /api/v1/game-sessions/{session_id}/abandon | backend/app/api/v1/endpoints/game_sessions.py | abandon_session | GameSessionRead |
| GET | /api/v1/educational-games/{game_id}/sessions | backend/app/api/v1/endpoints/game_sessions.py | list_game_sessions | Page[GameSessionRead] |
| GET | /api/v1/students/me/game-sessions | backend/app/api/v1/endpoints/game_sessions.py | get_my_sessions | Page[GameSessionRead] |
| GET | /api/v1/grades | backend/app/api/v1/endpoints/grades.py | list_grades | List[GradeRead] |
| GET | /api/v1/grades/{grade_id} | backend/app/api/v1/endpoints/grades.py | get_grade | GradeRead |
| GET | /api/v1/health/live | backend/app/api/v1/endpoints/health.py | liveness | See source |
| GET | /api/v1/health/ready | backend/app/api/v1/endpoints/health.py | readiness | See source |
| GET | /api/v1/insights/rules/catalog | backend/app/api/v1/endpoints/insights.py | catalog | See source |
| GET | /api/v1/insights/{scope}/{kind} | backend/app/api/v1/endpoints/insights.py | read_insights | See source |
| GET | /api/v1/units/{unit_id}/lessons | backend/app/api/v1/endpoints/lessons.py | list_lessons | Page[LessonRead] |
| GET | /api/v1/lessons/{lesson_id} | backend/app/api/v1/endpoints/lessons.py | get_lesson | LessonRead |
| GET | /api/v1/lessons/{lesson_id}/detail | backend/app/api/v1/endpoints/lessons.py | get_lesson_detail | LessonRead |
| POST | /api/v1/units/{unit_id}/lessons | backend/app/api/v1/endpoints/lessons.py | create_lesson | LessonRead |
| PATCH | /api/v1/lessons/{lesson_id} | backend/app/api/v1/endpoints/lessons.py | update_lesson | LessonRead |
| DELETE | /api/v1/lessons/{lesson_id} | backend/app/api/v1/endpoints/lessons.py | delete_lesson | See source |
| POST | /api/v1/units/{unit_id}/lessons/reorder | backend/app/api/v1/endpoints/lessons.py | reorder_lessons | List[LessonRead] |
| POST | /api/v1/lessons/{lesson_id}/resources | backend/app/api/v1/endpoints/lessons.py | add_resource_to_lesson | LessonResourceRead |
| DELETE | /api/v1/lessons/{lesson_id}/resources/{resource_id} | backend/app/api/v1/endpoints/lessons.py | remove_resource_from_lesson | See source |
| GET | /api/v1/meta | backend/app/api/v1/endpoints/meta.py | meta | See source |
| GET | /api/v1/meta/version | backend/app/api/v1/endpoints/meta.py | version | See source |
| GET | /api/v1/institutions | backend/app/api/v1/endpoints/people.py | list_institutions | list[InstitutionOut] |
| GET | /api/v1/institutions/{institution_id} | backend/app/api/v1/endpoints/people.py | get_institution | InstitutionOut |
| PATCH | /api/v1/institutions/{institution_id} | backend/app/api/v1/endpoints/people.py | update_institution | InstitutionOut |
| GET | /api/v1/users | backend/app/api/v1/endpoints/people.py | list_users | Page[UserOut] |
| POST | /api/v1/users | backend/app/api/v1/endpoints/people.py | create_user | UserOut |
| GET | /api/v1/users/{user_id} | backend/app/api/v1/endpoints/people.py | get_user | UserOut |
| PATCH | /api/v1/users/{user_id} | backend/app/api/v1/endpoints/people.py | update_user | UserOut |
| DELETE | /api/v1/users/{user_id} | backend/app/api/v1/endpoints/people.py | deactivate_user | See source |
| GET | /api/v1/students | backend/app/api/v1/endpoints/people.py | list_students | Page[StudentOut] |
| POST | /api/v1/students | backend/app/api/v1/endpoints/people.py | create_student | StudentDetail |
| GET | /api/v1/students/{student_id} | backend/app/api/v1/endpoints/people.py | get_student | StudentDetail |
| PATCH | /api/v1/students/{student_id} | backend/app/api/v1/endpoints/people.py | update_student | StudentDetail |
| DELETE | /api/v1/students/{student_id} | backend/app/api/v1/endpoints/people.py | deactivate_student | See source |
| GET | /api/v1/monitors | backend/app/api/v1/endpoints/people.py | list_monitors | Page[MonitorOut] |
| POST | /api/v1/monitors | backend/app/api/v1/endpoints/people.py | create_monitor | MonitorOut |
| GET | /api/v1/monitors/{monitor_id} | backend/app/api/v1/endpoints/people.py | get_monitor | MonitorOut |
| PATCH | /api/v1/monitors/{monitor_id} | backend/app/api/v1/endpoints/people.py | update_monitor | MonitorOut |
| DELETE | /api/v1/monitors/{monitor_id} | backend/app/api/v1/endpoints/people.py | deactivate_monitor | See source |
| GET | /api/v1/memberships | backend/app/api/v1/endpoints/people.py | list_memberships | Page[MembershipOut] |
| POST | /api/v1/memberships | backend/app/api/v1/endpoints/people.py | create_membership | MembershipOut |
| PATCH | /api/v1/memberships/{membership_id} | backend/app/api/v1/endpoints/people.py | update_membership | MembershipOut |
| DELETE | /api/v1/memberships/{membership_id} | backend/app/api/v1/endpoints/people.py | deactivate_membership | See source |
| GET | /api/v1/planner-context/me | backend/app/api/v1/endpoints/planner.py | teaching_contexts | See source |
| POST | /api/v1/assignments | backend/app/api/v1/endpoints/planner.py | create_assignment | See source |
| GET | /api/v1/assignments/me | backend/app/api/v1/endpoints/planner.py | own_assignments | See source |
| GET | /api/v1/assignments | backend/app/api/v1/endpoints/planner.py | teacher_assignments | See source |
| GET | /api/v1/assignments/{assignment_id} | backend/app/api/v1/endpoints/planner.py | get_assignment | See source |
| PATCH | /api/v1/assignments/{assignment_id} | backend/app/api/v1/endpoints/planner.py | update_assignment | See source |
| POST | /api/v1/assignments/{assignment_id}/publish | backend/app/api/v1/endpoints/planner.py | publish_assignment | See source |
| POST | /api/v1/assignments/{assignment_id}/close | backend/app/api/v1/endpoints/planner.py | close_assignment | See source |
| GET | /api/v1/assignments/{assignment_id}/targets | backend/app/api/v1/endpoints/planner.py | targets | See source |
| POST | /api/v1/assignments/{assignment_id}/archive | backend/app/api/v1/endpoints/planner.py | archive_assignment | See source |
| POST | /api/v1/assignment-targets/{target_id}/extend | backend/app/api/v1/endpoints/planner.py | extend_target | See source |
| POST | /api/v1/assignments/{assignment_id}/submissions | backend/app/api/v1/endpoints/planner.py | begin_submission | See source |
| GET | /api/v1/assignment-submissions/{submission_id} | backend/app/api/v1/endpoints/planner.py | get_submission | See source |
| PATCH | /api/v1/assignment-submissions/{submission_id} | backend/app/api/v1/endpoints/planner.py | save_submission | See source |
| POST | /api/v1/assignment-submissions/{submission_id}/submit | backend/app/api/v1/endpoints/planner.py | submit | See source |
| POST | /api/v1/assignment-submissions/{submission_id}/resubmit | backend/app/api/v1/endpoints/planner.py | resubmit | See source |
| GET | /api/v1/assignments/{assignment_id}/submissions | backend/app/api/v1/endpoints/planner.py | teacher_submissions | See source |
| GET | /api/v1/assignments/{assignment_id}/summary | backend/app/api/v1/endpoints/planner.py | assignment_summary | See source |
| GET | /api/v1/planner-summary/me | backend/app/api/v1/endpoints/planner.py | planner_summary | See source |
| POST | /api/v1/assignment-submissions/{submission_id}/feedback | backend/app/api/v1/endpoints/planner.py | feedback | See source |
| GET | /api/v1/planner-summary/institution | backend/app/api/v1/endpoints/planner.py | institutional_summary | See source |
| POST | /api/v1/assignment-feedback/{feedback_id}/publish | backend/app/api/v1/endpoints/planner.py | publish_feedback | See source |
| POST | /api/v1/assignment-submissions/{submission_id}/attachments | backend/app/api/v1/endpoints/planner.py | blocked_attachments | See source |
| POST | /api/v1/reinforcement-plans | backend/app/api/v1/endpoints/planner.py | create_reinforcement | See source |
| GET | /api/v1/reinforcement-plans/me | backend/app/api/v1/endpoints/planner.py | own_reinforcements | See source |
| POST | /api/v1/reinforcement-plans/{plan_id}/{action} | backend/app/api/v1/endpoints/planner.py | reinforcement_transition | See source |
| GET | /api/v1/reinforcement-plans/{plan_id} | backend/app/api/v1/endpoints/planner.py | get_reinforcement | See source |
| POST | /api/v1/calendar-events | backend/app/api/v1/endpoints/planner.py | create_event | See source |
| GET | /api/v1/calendar-events | backend/app/api/v1/endpoints/planner.py | calendar_events | See source |
| GET | /api/v1/calendar-events/{event_id} | backend/app/api/v1/endpoints/planner.py | get_event | See source |
| PATCH | /api/v1/calendar-events/{event_id} | backend/app/api/v1/endpoints/planner.py | update_event | See source |
| POST | /api/v1/calendar-events/{event_id}/cancel | backend/app/api/v1/endpoints/planner.py | cancel_event | See source |
| GET | /api/v1/academic-calendar/me | backend/app/api/v1/endpoints/planner.py | calendar | See source |
| GET | /api/v1/practices | backend/app/api/v1/endpoints/practices.py | list_practices | Page[PracticeRead] |
| GET | /api/v1/practices/{practice_id} | backend/app/api/v1/endpoints/practices.py | get_practice | PracticeRead |
| GET | /api/v1/practices/{practice_id}/detail | backend/app/api/v1/endpoints/practices.py | get_practice_detail | PracticeDetail |
| POST | /api/v1/practices | backend/app/api/v1/endpoints/practices.py | create_practice | PracticeRead |
| PATCH | /api/v1/practices/{practice_id} | backend/app/api/v1/endpoints/practices.py | update_practice | PracticeRead |
| POST | /api/v1/practices/{practice_id}/archive | backend/app/api/v1/endpoints/practices.py | archive_practice | PracticeRead |
| POST | /api/v1/practices/{practice_id}/submit-review | backend/app/api/v1/endpoints/practices.py | submit_practice_for_review | PracticeRead |
| GET | /api/v1/courses/{course_id}/practices | backend/app/api/v1/endpoints/practices.py | list_course_practices | Page[PracticeRead] |
| GET | /api/v1/practice-attempts | backend/app/api/v1/endpoints/practice_attempts.py | list_attempts | Page[PracticeAttemptRead] |
| GET | /api/v1/practice-attempts/{attempt_id} | backend/app/api/v1/endpoints/practice_attempts.py | get_attempt | PracticeAttemptRead |
| GET | /api/v1/practice-attempts/{attempt_id}/detail | backend/app/api/v1/endpoints/practice_attempts.py | get_attempt_detail | PracticeAttemptDetail |
| POST | /api/v1/practices/{practice_id}/attempts | backend/app/api/v1/endpoints/practice_attempts.py | start_attempt | PracticeAttemptDetail |
| PUT | /api/v1/practice-attempts/{attempt_id}/responses/{exercise_id} | backend/app/api/v1/endpoints/practice_attempts.py | save_response | PracticeResponseRead |
| POST | /api/v1/practice-attempts/{attempt_id}/submit | backend/app/api/v1/endpoints/practice_attempts.py | submit_attempt | PracticeAttemptDetail |
| POST | /api/v1/practice-attempts/{attempt_id}/cancel | backend/app/api/v1/endpoints/practice_attempts.py | cancel_attempt | PracticeAttemptRead |
| GET | /api/v1/practice-attempts/{attempt_id}/result | backend/app/api/v1/endpoints/practice_attempts.py | get_attempt_result | PracticeResultDetail |
| GET | /api/v1/practice-results | backend/app/api/v1/endpoints/practice_attempts.py | list_results | Page[PracticeResultRead] |
| GET | /api/v1/practice-results/{result_id} | backend/app/api/v1/endpoints/practice_attempts.py | get_result | PracticeResultDetail |
| GET | /api/v1/students/me/practice-results | backend/app/api/v1/endpoints/practice_attempts.py | get_my_results | Page[PracticeResultRead] |
| GET | /api/v1/practices/{practice_id}/versions | backend/app/api/v1/endpoints/practice_versions.py | list_practice_versions | Page[PracticeVersionRead] |
| GET | /api/v1/practices/{practice_id}/versions/latest | backend/app/api/v1/endpoints/practice_versions.py | get_latest_practice_version | PracticeVersionDetail |
| GET | /api/v1/practices/{practice_id}/versions/published | backend/app/api/v1/endpoints/practice_versions.py | get_published_practice_version | PracticeVersionDetail |
| GET | /api/v1/practice-versions/{version_id} | backend/app/api/v1/endpoints/practice_versions.py | get_practice_version | PracticeVersionDetail |
| POST | /api/v1/practices/{practice_id}/versions | backend/app/api/v1/endpoints/practice_versions.py | create_practice_version | PracticeVersionDetail |
| PATCH | /api/v1/practice-versions/{version_id} | backend/app/api/v1/endpoints/practice_versions.py | update_practice_version | PracticeVersionDetail |
| POST | /api/v1/practice-versions/{version_id}/publish | backend/app/api/v1/endpoints/practice_versions.py | publish_practice_version | PracticeVersionDetail |
| DELETE | /api/v1/practice-versions/{version_id} | backend/app/api/v1/endpoints/practice_versions.py | delete_practice_version | See source |
| GET | /api/v1/monitors/me/student-progress | backend/app/api/v1/endpoints/progress.py | monitor_progress | See source |
| GET | /api/v1/progress/institution/summary | backend/app/api/v1/endpoints/progress.py | institution_summary | See source |
| GET | /api/v1/progress/me | backend/app/api/v1/endpoints/progress.py | overview | ProgressOverview |
| GET | /api/v1/progress/me/courses | backend/app/api/v1/endpoints/progress.py | courses | Page[CourseProgressRead] |
| GET | /api/v1/progress/courses/{course_id} | backend/app/api/v1/endpoints/progress.py | course | CourseProgressRead |
| GET | /api/v1/progress/units/{unit_id} | backend/app/api/v1/endpoints/progress.py | unit | UnitProgressRead |
| GET | /api/v1/progress/lessons/{lesson_id} | backend/app/api/v1/endpoints/progress.py | lesson | LessonProgressRead |
| POST | /api/v1/progress/lessons/{lesson_id}/start | backend/app/api/v1/endpoints/progress.py | start | LessonProgressRead |
| POST | /api/v1/progress/lessons/{lesson_id}/complete | backend/app/api/v1/endpoints/progress.py | complete | LessonProgressRead |
| GET | /api/v1/progress/me/achievements | backend/app/api/v1/endpoints/progress.py | achievements | list[AchievementRead] |
| GET | /api/v1/badges | backend/app/api/v1/endpoints/progress.py | badges | list[AchievementRead]) |
| GET | /api/v1/progress/competencies | backend/app/api/v1/endpoints/progress.py | competencies | SourceAvailability |
| GET | /api/v1/progress/me/history | backend/app/api/v1/endpoints/progress.py | history | Page[LearningHistoryRead] |
| GET | /api/v1/reports/catalog | backend/app/api/v1/endpoints/reports.py | catalog | See source |
| POST | /api/v1/reports/exports | backend/app/api/v1/endpoints/reports.py | create_export | See source |
| GET | /api/v1/reports/monitor/context | backend/app/api/v1/endpoints/reports.py | monitor_context | See source |
| GET | /api/v1/reports/institution/context | backend/app/api/v1/endpoints/reports.py | institution_context | See source |
| GET | /api/v1/reports/{scope}/{kind} | backend/app/api/v1/endpoints/reports.py | read_report | ReportRead |
| GET | /api/v1/sections | backend/app/api/v1/endpoints/sections.py | list_sections | Page[SectionRead] |
| GET | /api/v1/sections/{section_id} | backend/app/api/v1/endpoints/sections.py | get_section | SectionRead |
| POST | /api/v1/sections | backend/app/api/v1/endpoints/sections.py | create_section | SectionRead |
| PATCH | /api/v1/sections/{section_id} | backend/app/api/v1/endpoints/sections.py | update_section | SectionRead |
| GET | /api/v1/subjects | backend/app/api/v1/endpoints/subjects.py | list_subjects | Page[SubjectRead] |
| GET | /api/v1/subjects/{subject_id} | backend/app/api/v1/endpoints/subjects.py | get_subject | SubjectRead |
| POST | /api/v1/subjects | backend/app/api/v1/endpoints/subjects.py | create_subject | SubjectRead |
| PATCH | /api/v1/subjects/{subject_id} | backend/app/api/v1/endpoints/subjects.py | update_subject | SubjectRead |
| DELETE | /api/v1/subjects/{subject_id} | backend/app/api/v1/endpoints/subjects.py | delete_subject | See source |
| GET | /api/v1/sync/status | backend/app/api/v1/endpoints/sync.py | status | See source |
| GET | /api/v1/sync/bootstrap | backend/app/api/v1/endpoints/sync.py | bootstrap | See source |
| POST | /api/v1/sync/operations | backend/app/api/v1/endpoints/sync.py | operations | list[SyncReceiptRead] |
| GET | /api/v1/sync/operations/{operation_id} | backend/app/api/v1/endpoints/sync.py | receipt | SyncReceiptRead |
| GET | /api/v1/system/status | backend/app/api/v1/endpoints/system.py | system_status | See source |
| GET | /api/v1/teacher-assignments | backend/app/api/v1/endpoints/teacher_assignments.py | list_teacher_assignments | Page[TeacherAssignmentRead] |
| GET | /api/v1/teacher-assignments/{assignment_id} | backend/app/api/v1/endpoints/teacher_assignments.py | get_teacher_assignment | TeacherAssignmentRead |
| POST | /api/v1/teacher-assignments | backend/app/api/v1/endpoints/teacher_assignments.py | create_teacher_assignment | TeacherAssignmentRead |
| PATCH | /api/v1/teacher-assignments/{assignment_id} | backend/app/api/v1/endpoints/teacher_assignments.py | update_teacher_assignment | TeacherAssignmentRead |
| POST | /api/v1/teacher-assignments/{assignment_id}/revoke | backend/app/api/v1/endpoints/teacher_assignments.py | revoke_teacher_assignment | TeacherAssignmentRead |
| GET | /api/v1/courses/{course_id}/units | backend/app/api/v1/endpoints/units.py | list_units | Page[UnitRead] |
| GET | /api/v1/units/{unit_id} | backend/app/api/v1/endpoints/units.py | get_unit | UnitRead |
| GET | /api/v1/units/{unit_id}/detail | backend/app/api/v1/endpoints/units.py | get_unit_detail | UnitRead |
| POST | /api/v1/courses/{course_id}/units | backend/app/api/v1/endpoints/units.py | create_unit | UnitRead |
| PATCH | /api/v1/units/{unit_id} | backend/app/api/v1/endpoints/units.py | update_unit | UnitRead |
| DELETE | /api/v1/units/{unit_id} | backend/app/api/v1/endpoints/units.py | delete_unit | See source |
| POST | /api/v1/courses/{course_id}/units/reorder | backend/app/api/v1/endpoints/units.py | reorder_units | List[UnitRead] |
