"""Retrieve only explicitly authorized published lesson text; never assessment keys."""

from sqlalchemy import select

from app.core.exceptions import ForbiddenError, NotFoundError, ServiceUnavailableError
from app.db.models import Course, Grade
from app.repositories.progress_repository import ProgressRepository
from app.schemas.ai import AISource
from app.services.academic_access_service import AcademicAccessService
from app.services.planner_access_service import PlannerAccessService
from app.services.ai_safety_service import plain_text


class AIContextService:
    def __init__(self, session):
        self.session = session

    async def catalog(self, context, *, classroom_id=None):
        repo = ProgressRepository(self.session)
        if "ai.tutor.use_assigned_context" in context.permissions and classroom_id:
            teaching = await PlannerAccessService(self.session).teaching_contexts(context, page=1, page_size=100,
                permission_code="ai.tutor.use_assigned_context")
            course_ids = list({c["course_id"] for c in teaching["items"] if c["classroom_id"] == str(classroom_id)})
            if not course_ids:
                raise ForbiddenError("No hay una asignación docente autorizada para el contexto")
        elif "ai.tutor.use_own" in context.permissions:
            if classroom_id:
                raise ForbiddenError("El contexto del estudiante se obtiene de su matrícula")
            student = await AcademicAccessService(self.session).student(context)
            courses, _ = await repo.courses(context, student.id)
            course_ids = [c.id for c in courses]
        else:
            raise ForbiddenError("Se requiere permiso de Tutor para el contexto")
        statement = repo.catalog_statement(context.institution_id, course_ids)
        # Bound the source list before loading content; larger catalogs need future paging.
        return list((await self.session.execute(statement.limit(100))).all()) if course_ids else []

    async def resolve(self, context, lesson_id, classroom_id=None):
        rows = await self.catalog(context, classroom_id=classroom_id)
        entry = next((e for e in rows if str(e.lesson_id) == str(lesson_id)), None)
        if entry is None:
            raise NotFoundError("La lección publicada no está disponible para este contexto")
        snippet = []
        for field in ("description", "content"):
            value = entry.snapshot.get(field)
            if isinstance(value, str):
                snippet.append(value)
        blocks = entry.snapshot.get("blocks", [])
        for block in (blocks if isinstance(blocks, list) else [])[:20]:
            if isinstance(block, dict) and block.get("type", block.get("kind")) in {"text", "paragraph", "heading"}:
                if isinstance(block.get("text"), str):
                    snippet.append(block["text"])
        # No answers, questions, assessment settings, family records, names or full snapshots.
        combined = "\n".join(snippet)
        if len(combined.strip()) < 20:
            raise ServiceUnavailableError("La lección publicada no contiene un fragmento textual suficiente para el Tutor")
        text = plain_text(combined[:4000], maximum=4000)
        grade = (await self.session.execute(select(Grade.number).join(Course, Course.grade_id == Grade.id).where(
            Course.id == entry.course_id))).scalar_one()
        if grade not in {4, 5, 6}:
            raise ForbiddenError("Grado fuera del alcance educativo configurado")
        source = AISource(lesson_id=entry.lesson_id, version_id=entry.version_id, course_id=entry.course_id,
            title=entry.snapshot.get("title", "Lección publicada"))
        return {"confirmed_grade": grade, "lesson_excerpt": text, "excerpt_limited": len(combined) > 4000}, source
