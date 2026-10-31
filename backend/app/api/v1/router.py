"""API v1 router aggregation."""

from fastapi import APIRouter
from app.api.v1.endpoints import progress
from app.api.v1.endpoints import planner
from app.api.v1.endpoints import reports
from app.api.v1.endpoints import insights
from app.api.v1.endpoints import sync
from app.api.v1.endpoints import ai

from app.api.v1.endpoints import (
    academic_movements,
    academic_periods,
    academic_years,
    assessments,
    auth,
    classrooms,
    content_manifests,
    content_publications,
    content_reviews,
    content_versions,
    courses,
    educational_games,
    educational_resources,
    enrollments,
    exercises,
    game_sessions,
    grades,
    health,
    lessons,
    meta,
    people,
    practice_attempts,
    practice_versions,
    practices,
    sections,
    subjects,
    system,
    teacher_assignments,
    units,
)

api_router = APIRouter()
api_router.include_router(progress.router)
api_router.include_router(planner.router)
api_router.include_router(reports.router)
api_router.include_router(insights.router)
api_router.include_router(sync.router)
api_router.include_router(ai.router)

# Health check endpoints
api_router.include_router(health.router, tags=["Health"])

# Metadata endpoints
api_router.include_router(meta.router, tags=["Meta"])

# System status endpoints
api_router.include_router(system.router, tags=["System"])

# Authentication endpoints
api_router.include_router(auth.router, tags=["Authentication"])

# Institution-scoped people and membership endpoints
api_router.include_router(people.router)

# Academic organization, classrooms, enrollments, and teacher assignments
api_router.include_router(academic_years.router)
api_router.include_router(academic_periods.router)
api_router.include_router(grades.router)
api_router.include_router(sections.router)
api_router.include_router(classrooms.router)
api_router.include_router(enrollments.router)
api_router.include_router(academic_movements.router)
api_router.include_router(teacher_assignments.router)

# Content management endpoints
api_router.include_router(subjects.router)
api_router.include_router(courses.router)
api_router.include_router(units.router)
api_router.include_router(lessons.router)
api_router.include_router(content_versions.router)
api_router.include_router(educational_resources.router)
api_router.include_router(content_reviews.router)
api_router.include_router(content_publications.router)
api_router.include_router(content_manifests.router)

# Assessment endpoints
api_router.include_router(assessments.router)

# Practice Engine endpoints
api_router.include_router(practices.router)
api_router.include_router(practice_versions.router)
api_router.include_router(exercises.router)
api_router.include_router(practice_attempts.router)
api_router.include_router(educational_games.router)
api_router.include_router(game_sessions.router)
