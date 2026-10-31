"""Seed the shared primary grade catalog."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Grade


DEFAULT_GRADES = (
    {"number": 4, "name": "4to Primaria", "display_name": "4.º de primaria", "sequence": 4},
    {"number": 5, "name": "5to Primaria", "display_name": "5.º de primaria", "sequence": 5},
    {"number": 6, "name": "6to Primaria", "display_name": "6.º de primaria", "sequence": 6},
)


async def ensure_default_grades(session: AsyncSession) -> None:
    """Create the grades used by the initial primary-school scope when missing."""
    existing = {
        grade.number
        for grade in (await session.execute(select(Grade))).scalars().all()
    }
    for definition in DEFAULT_GRADES:
        if definition["number"] in existing:
            continue
        session.add(
            Grade(
                number=definition["number"],
                name=definition["name"],
                display_name=definition["display_name"],
                sequence=definition["sequence"],
                status="active",
            )
        )
    await session.flush()
