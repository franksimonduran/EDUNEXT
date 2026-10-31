"""Practice scoring service for auto-grading exercises."""

from datetime import timezone
from typing import Dict, Any, List, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Exercise, PracticeAttempt, PracticeResponse, PracticeFeedback, StudentProfile
from app.schemas.practice import ExerciseType, PracticeDifficulty


class PracticeScoringService:
    """Service for scoring practice attempts."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def score_attempt(self, attempt: PracticeAttempt, responses: List[PracticeResponse]) -> Dict[str, Any]:
        """Score a complete attempt and return results."""
        # Get exercises for this version
        exercises = await self.session.execute(
            select(Exercise).where(Exercise.version_id == str(attempt.version_id))
        )
        exercises = list(exercises.scalars().all())
        
        # Create response lookup
        response_map = {str(r.exercise_id): r for r in responses}
        
        total_score = 0
        max_score = 0
        correct = 0
        incorrect = 0
        pending_review = 0
        answered = 0
        total_time = 0
        
        for exercise in exercises:
            max_score += exercise.points
            response = response_map.get(str(exercise.id))
            
            if not response or response.response_status != "saved":
                continue
            
            answered += 1
            total_time += response.time_spent_seconds or 0
            
            # Score based on exercise type
            if exercise.exercise_type == ExerciseType.OPEN_RESPONSE:
                # Mark for manual review
                response.needs_review = True
                pending_review += 1
                response.response_status = "submitted"
                response.submitted_at = datetime.now(timezone.utc)
                continue
            
            # Auto-score other types
            result = self._score_exercise(exercise, response)
            response.is_correct = result["is_correct"]
            response.points_earned = result["points_earned"]
            response.max_points = result["max_points"]
            response.auto_feedback = result["feedback"]
            response.scoring_details = result["details"]
            response.is_correct = result["is_correct"]
            response.submitted_at = datetime.now(timezone.utc)
            response.response_status = "submitted"
            
            if result["is_correct"]:
                correct += 1
                total_score += result["points_earned"]
            else:
                incorrect += 1
                total_score += result["points_earned"]
        
        percentage = (total_score / max_score * 100) if max_score > 0 else 0
        
        return {
            "score": total_score,
            "max_score": max_score,
            "percentage": round(percentage, 2),
            "correct": correct,
            "incorrect": incorrect,
            "pending_review": pending_review,
            "answered": answered,
            "total": len(exercises),
            "time_spent": total_time,
        }

    def _score_exercise(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score a single exercise based on its type."""
        if exercise.exercise_type == ExerciseType.SINGLE_CHOICE:
            return self._score_single_choice(exercise, response)
        elif exercise.exercise_type == ExerciseType.TRUE_FALSE:
            return self._score_true_false(exercise, response)
        elif exercise.exercise_type == ExerciseType.MULTIPLE_CHOICE:
            return self._score_multiple_choice(exercise, response)
        elif exercise.exercise_type == ExerciseType.MATCHING:
            return self._score_matching(exercise, response)
        elif exercise.exercise_type == ExerciseType.ORDERING:
            return self._score_ordering(exercise, response)
        elif exercise.exercise_type == ExerciseType.NUMERIC:
            return self._score_numeric(exercise, response)
        elif exercise.exercise_type == ExerciseType.FILL_BLANK:
            return self._score_fill_blank(exercise, response)
        elif exercise.exercise_type == ExerciseType.CLASSIFICATION:
            return self._score_classification(exercise, response)
        else:
            # Unknown type - mark as incorrect
            return {
                "is_correct": False,
                "points_earned": 0,
                "max_points": exercise.points,
                "feedback": "Tipo de ejercicio no reconocido",
                "details": {"error": "unknown_type"},
            }

    def _score_single_choice(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score single choice exercise."""
        answer = response.answer_data.get("selected_option_id")
        if not answer:
            return self._incorrect(exercise, "No option selected")
        
        correct_option = None
        for opt in exercise.options:
            if opt.is_correct:
                correct_option = opt
                break
        
        if not correct_option:
            return self._incorrect(exercise, "No correct option defined")
        
        is_correct = str(answer) == str(correct_option.id)
        points = exercise.points if is_correct else 0
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": correct_option.feedback if is_correct else "Respuesta incorrecta",
            "details": {"selected": str(answer), "correct": str(correct_option.id)},
        }

    def _score_true_false(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score true/false exercise."""
        answer = response.answer_data.get("value")
        if answer is None:
            return self._incorrect(exercise, "No answer provided")
        
        correct_option = None
        for opt in exercise.options:
            if opt.is_correct:
                correct_option = opt
                break
        
        correct_value = correct_option.text.lower() in ["true", "verdadero", "1", "yes", "sí"]
        is_correct = str(answer).lower() == str(correct_value).lower()
        points = exercise.points if is_correct else 0
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": "Correcto" if is_correct else "Incorrecto",
            "details": {"selected": str(answer), "correct": str(correct_value)},
        }

    def _score_multiple_choice(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score multiple choice exercise with partial credit."""
        selected = response.answer_data.get("selected_option_ids", [])
        if not isinstance(selected, list):
            selected = []
        
        correct_ids = [str(opt.id) for opt in exercise.options if opt.is_correct]
        selected_set = set(str(s) for s in selected)
        correct_set = set(correct_ids)
        
        # Exact match required for full points
        if selected_set == correct_set:
            return {
                "is_correct": True,
                "points_earned": exercise.points,
                "max_points": exercise.points,
                "feedback": "Todas las opciones correctas",
                "details": {"selected": selected, "correct": correct_ids},
            }
        
        # Partial scoring if enabled
        if exercise.content and exercise.content.get("partial_scoring", True):
            # Calculate partial score
            correct_selected = len(selected_set & correct_set)
            incorrect_selected = len(selected_set - correct_set)
            missed_correct = len(correct_set - selected_set)
            
            total_items = len(correct_set)
            earned_ratio = max(0, (correct_selected - incorrect_selected) / total_items) if total_items > 0 else 0
            points = int(exercise.points * earned_ratio)
            
            return {
                "is_correct": False,  # Not fully correct
                "points_earned": points,
                "max_points": exercise.points,
                "feedback": f"Parcialmente correcto: {correct_selected}/{total_items} opciones correctas",
                "details": {
                    "selected": selected,
                    "correct": correct_ids,
                    "correct_selected": correct_selected,
                    "incorrect_selected": incorrect_selected,
                    "missed_correct": missed_correct,
                },
            }
        
        return self._incorrect(exercise, "Respuesta parcialmente incorrecta")

    def _score_matching(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score matching exercise."""
        pairs = response.answer_data.get("pairs", {})
        if not isinstance(pairs, dict):
            pairs = {}
        
        correct_pairs = exercise.content.get("pairs", {}) if exercise.content else {}
        
        correct_matches = 0
        total_pairs = len(correct_pairs)
        
        for left, right in correct_pairs.items():
            if pairs.get(left) == right:
                correct_matches += 1
        
        is_correct = correct_matches == total_pairs
        points = exercise.points if is_correct else 0
        
        # Partial credit if enabled
        if exercise.content and exercise.content.get("partial_scoring", True) and total_pairs > 0:
            points = int(exercise.points * correct_matches / total_pairs)
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": f"{correct_matches}/{total_pairs} parejas correctas",
            "details": {
                "submitted_pairs": pairs,
                "correct_pairs": correct_pairs,
                "correct_matches": correct_matches,
            },
        }

    def _score_ordering(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score ordering exercise."""
        submitted_order = response.answer_data.get("order", [])
        if not isinstance(submitted_order, list):
            submitted_order = []
        
        correct_order = exercise.content.get("order", []) if exercise.content else []
        
        # Check exact match
        is_correct = submitted_order == correct_order
        points = exercise.points if is_correct else 0
        
        # Partial credit using longest common subsequence or position-based
        if not is_correct and exercise.content and exercise.content.get("partial_scoring", True):
            correct_positions = {item: idx for idx, item in enumerate(correct_order)}
            matches = 0
            for idx, item in enumerate(submitted_order):
                if correct_positions.get(item) == idx:
                    matches += 1
            if len(correct_order) > 0:
                points = int(exercise.points * matches / len(correct_order))
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": "Orden correcto" if is_correct else f"Orden parcialmente correcto: {points}/{exercise.points} puntos",
            "details": {"submitted_order": submitted_order, "correct_order": correct_order},
        }

    def _score_numeric(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score numeric exercise."""
        answer = response.answer_data.get("value")
        try:
            answer = float(answer)
        except (TypeError, ValueError):
            return self._incorrect(exercise, "Respuesta no numérica válida")
        
        correct_answer = exercise.content.get("answer", 0) if exercise.content else 0
        tolerance = exercise.content.get("tolerance", 0) if exercise.content else 0
        
        is_correct = abs(answer - correct_answer) <= tolerance
        points = exercise.points if is_correct else 0
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": "Respuesta correcta" if is_correct else f"Respuesta incorrecta. Valor esperado: {correct_answer}",
            "details": {"submitted": answer, "correct": correct_answer, "tolerance": tolerance},
        }

    def _score_fill_blank(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score fill in the blank exercise."""
        answers = response.answer_data.get("answers", {})
        if not isinstance(answers, dict):
            answers = {}
        
        correct_answers = exercise.content.get("answers", {}) if exercise.content else {}
        
        total_blanks = len(correct_answers)
        correct_blanks = 0
        
        for blank_id, correct_answer in correct_answers.items():
            submitted = answers.get(blank_id, "").strip().lower()
            correct_normalized = str(correct_answer).strip().lower()
            
            if submitted == correct_normalized:
                correct_blanks += 1
        
        is_correct = correct_blanks == total_blanks
        points = exercise.points if is_correct else 0
        
        # Partial credit
        if total_blanks > 0 and exercise.content and exercise.content.get("partial_scoring", True):
            points = int(exercise.points * correct_blanks / total_blanks)
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": f"{correct_blanks}/{total_blanks} espacios correctos",
            "details": {"submitted_answers": answers, "correct_answers": correct_answers},
        }

    def _score_classification(self, exercise: Exercise, response: PracticeResponse) -> Dict[str, Any]:
        """Score classification exercise."""
        classifications = response.answer_data.get("classifications", {})
        if not isinstance(classifications, dict):
            classifications = {}
        
        correct_classifications = exercise.content.get("classifications", {}) if exercise.content else {}
        
        total_items = len(correct_classifications)
        correct_items = 0
        
        for item_id, correct_category in correct_classifications.items():
            if classifications.get(item_id) == correct_category:
                correct_items += 1
        
        is_correct = correct_items == total_items
        points = exercise.points if is_correct else 0
        
        # Partial credit
        if total_items > 0 and exercise.content and exercise.content.get("partial_scoring", True):
            points = int(exercise.points * correct_items / total_items)
        
        return {
            "is_correct": is_correct,
            "points_earned": points,
            "max_points": exercise.points,
            "feedback": f"{correct_items}/{total_items} elementos clasificados correctamente",
            "details": {"submitted": classifications, "correct": correct_classifications},
        }

    def _incorrect(self, exercise: Exercise, message: str) -> Dict[str, Any]:
        return {
            "is_correct": False,
            "points_earned": 0,
            "max_points": exercise.points,
            "feedback": message,
            "details": {},
        }

    async def generate_feedback(self, attempt: PracticeAttempt, responses: List[PracticeResponse], scoring_result: Dict) -> List[Dict]:
        """Generate feedback items for the attempt."""
        feedback_items = []
        
        # Get exercises with responses
        for response in responses:
            exercise = await self.session.get(Exercise, UUID(response.exercise_id))
            if not exercise:
                continue
            
            if response.is_correct is True:
                feedback_items.append({
                    "result_id": str(attempt.result.id) if attempt.result else "",
                    "exercise_id": str(exercise.id),
                    "feedback_type": "success",
                    "title": "¡Correcto!",
                    "message": response.auto_feedback or "Respuesta correcta",
                    "is_positive": True,
                    "resources_recommended": [],
                    "lessons_recommended": [],
                })
            elif response.is_correct is False:
                feedback_items.append({
                    "result_id": str(attempt.result.id) if attempt.result else "",
                    "exercise_id": str(exercise.id),
                    "feedback_type": "error",
                    "title": "Incorrecto",
                    "message": response.auto_feedback or "Respuesta incorrecta",
                    "is_positive": False,
                    "resources_recommended": [str(r) for r in exercise.resource_ids] if exercise.resource_ids else [],
                    "lessons_recommended": [],
                })
            elif response.needs_review:
                feedback_items.append({
                    "result_id": str(attempt.result.id) if attempt.result else "",
                    "exercise_id": str(exercise.id),
                    "feedback_type": "pending_review",
                    "title": "Pendiente de revisión",
                    "message": "Esta respuesta será revisada por tu docente",
                    "is_positive": True,
                    "resources_recommended": [],
                    "lessons_recommended": [],
                })
        
        return feedback_items