"""Content validation service."""

from typing import List, Dict, Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.content import ContentValidationResult, LessonBlock


class ContentValidationService:
    """Service for validating educational content structure and quality."""

    # Valid block types
    VALID_BLOCK_TYPES = {
        "heading", "paragraph", "list", "image", "audio", "video",
        "example", "note", "table", "reflection_question", "resource", "summary"
    }

    # Required fields per block type
    BLOCK_REQUIRED_FIELDS = {
        "heading": ["text", "level"],
        "paragraph": ["text"],
        "list": ["items"],
        "image": ["resource_id", "alt_text"],
        "audio": ["resource_id", "description"],
        "video": ["resource_id", "description"],
        "example": ["title", "content"],
        "note": ["text"],
        "table": ["headers", "rows"],
        "reflection_question": ["question"],
        "resource": ["resource_id", "context"],
        "summary": ["text"],
    }

    def __init__(self, session: AsyncSession):
        self.session = session

    async def validate_lesson_blocks(
        self,
        blocks: List[LessonBlock],
        resource_ids: Optional[List[UUID]] = None,
    ) -> ContentValidationResult:
        """Validate lesson blocks structure and references."""
        errors = []
        warnings = []
        suggestions = []
        details = {}

        if not blocks:
            warnings.append("Lesson has no content blocks")
            return ContentValidationResult(
                is_valid=True,
                errors=errors,
                warnings=warnings,
                suggestions=suggestions,
                details=details,
            )

        used_ids = set()
        resource_ids_set = set(str(r) for r in (resource_ids or []))

        for index, block in enumerate(blocks):
            block_errors = await self._validate_block(block, index, used_ids, resource_ids_set)
            errors.extend(block_errors)

            if block.id in used_ids:
                errors.append(f"Block {index}: Duplicate block ID '{block.id}'")
            used_ids.add(block.id)

        # Check for heading hierarchy
        heading_errors = self._validate_heading_hierarchy(blocks)
        errors.extend(heading_errors)

        # Check for accessibility
        accessibility_warnings = self._check_accessibility(blocks)
        warnings.extend(accessibility_warnings)

        return ContentValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            details=details,
        )

    async def _validate_block(
        self,
        block: LessonBlock,
        index: int,
        used_ids: set,
        resource_ids_set: set,
    ) -> List[str]:
        errors = []

        # Validate block type
        if block.type not in self.VALID_BLOCK_TYPES:
            errors.append(f"Block {index} ('{block.id}'): Invalid block type '{block.type}'")
            return errors

        # Validate required fields
        required = self.BLOCK_REQUIRED_FIELDS.get(block.type, [])
        for field in required:
            if field not in block.data or not block.data[field]:
                errors.append(f"Block {index} ('{block.id}'): Missing required field '{field}' for type '{block.type}'")

        # Validate resource references
        if block.resource_ids:
            for res_id in block.resource_ids:
                if str(res_id) not in resource_ids_set:
                    errors.append(f"Block {index} ('{block.id}'): References non-existent resource {res_id}")

        # Type-specific validation
        if block.type == "heading":
            level = block.data.get("level")
            if not isinstance(level, int) or level < 1 or level > 6:
                errors.append(f"Block {index} ('{block.id}'): Heading level must be integer 1-6")

        elif block.type == "list":
            items = block.data.get("items")
            if not isinstance(items, list) or len(items) == 0:
                errors.append(f"Block {index} ('{block.id}'): List must have at least one item")

        elif block.type == "table":
            headers = block.data.get("headers")
            rows = block.data.get("rows")
            if not isinstance(headers, list) or len(headers) == 0:
                errors.append(f"Block {index} ('{block.id}'): Table must have headers")
            if not isinstance(rows, list):
                errors.append(f"Block {index} ('{block.id}'): Table rows must be a list")
            elif rows and len(rows[0]) != len(headers):
                errors.append(f"Block {index} ('{block.id}'): Row column count doesn't match headers")

        elif block.type in ["image", "audio", "video"]:
            if not block.data.get("resource_id"):
                errors.append(f"Block {index} ('{block.id}'): Must reference a resource")

        return errors

    def _validate_heading_hierarchy(self, blocks: List[LessonBlock]) -> List[str]:
        """Validate heading levels follow proper hierarchy."""
        errors = []
        last_level = 0
        
        for index, block in enumerate(blocks):
            if block.type == "heading":
                level = block.data.get("level", 1)
                if level > last_level + 1:
                    errors.append(f"Block {index} ('{block.id}'): Heading level {level} skips level {last_level + 1}")
                last_level = level
        
        return errors

    def _check_accessibility(self, blocks: List[LessonBlock]) -> List[str]:
        """Check accessibility requirements."""
        warnings = []
        
        for index, block in enumerate(blocks):
            if block.type == "image" and not block.data.get("alt_text"):
                warnings.append(f"Block {index} ('{block.id}'): Image missing alt text")
            elif block.type == "audio" and not block.data.get("transcript"):
                warnings.append(f"Block {index} ('{block.id}'): Audio missing transcript")
            elif block.type == "video" and not block.data.get("captions"):
                warnings.append(f"Block {index} ('{block.id}'): Video missing captions")
        
        return warnings

    async def validate_course_structure(
        self,
        course_id: UUID,
    ) -> ContentValidationResult:
        """Validate course has proper structure (units, lessons)."""
        from app.repositories import CourseRepository, UnitRepository, LessonRepository
        
        course_repo = CourseRepository(self.session)
        unit_repo = UnitRepository(self.session)
        lesson_repo = LessonRepository(self.session)
        
        errors = []
        warnings = []
        suggestions = []
        details = {}

        course = await course_repo.get_course(UUID("00000000-0000-0000-0000-000000000000"), course_id)
        
        units, _ = await unit_repo.list_units(course_id=course_id, page=1, page_size=1000)
        if not units:
            warnings.append("Course has no units")

        total_lessons = 0
        for unit in units:
            lessons, _ = await lesson_repo.list_lessons(unit_id=unit.id, page=1, page_size=1000)
            total_lessons += len(lessons)
            if not lessons:
                warnings.append(f"Unit '{unit.title}' has no lessons")

        details["unit_count"] = len(units)
        details["lesson_count"] = total_lessons

        return ContentValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            details=details,
        )