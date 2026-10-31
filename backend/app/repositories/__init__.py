"""Repositories package."""

from app.repositories.subject_repository import SubjectRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.unit_repository import UnitRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.content_version_repository import ContentVersionRepository
from app.repositories.resource_repository import ResourceRepository
from app.repositories.content_review_repository import ContentReviewRepository
from app.repositories.content_publication_repository import ContentPublicationRepository
from app.repositories.content_manifest_repository import ContentManifestRepository
from app.repositories.practice_repository import (
    PracticeRepository,
    PracticeVersionRepository,
    ExerciseRepository,
    ExerciseOptionRepository,
)
from app.repositories.practice_attempt_repository import (
    PracticeAttemptRepository,
    PracticeResponseRepository,
    PracticeResultRepository,
    PracticeFeedbackRepository,
)
from app.repositories.game_repository import (
    EducationalGameRepository,
    GameSessionRepository,
    GameResultRepository,
)

__all__ = [
    "SubjectRepository",
    "CourseRepository",
    "UnitRepository",
    "LessonRepository",
    "ContentVersionRepository",
    "ResourceRepository",
    "ContentReviewRepository",
    "ContentPublicationRepository",
    "ContentManifestRepository",
    "PracticeRepository",
    "PracticeVersionRepository",
    "ExerciseRepository",
    "ExerciseOptionRepository",
    "PracticeAttemptRepository",
    "PracticeResponseRepository",
    "PracticeResultRepository",
    "PracticeFeedbackRepository",
    "EducationalGameRepository",
    "GameSessionRepository",
    "GameResultRepository",
]