"""Insights only consume already authorized Reports; no alternate academic queries."""

from app.core.exceptions import NotFoundError
from app.rules.insight_rules import RULES, evaluate, insight_id
from app.services.report_service import ReportService, definition_for


class InsightsService:
    def __init__(self, session):
        self.reports = ReportService(session)

    async def catalog(self, context):
        await self.reports.identity(context)
        from app.services.report_definitions import DEFINITIONS
        return [{"rule_code": r.code, "rule_version": r.version, "report_code": r.report_code,
                 "source_metric_ids": [r.metric], "condition": "count == 0" if r.code.startswith("content.") else "count > 0",
                 "permissions": list(DEFINITIONS[r.report_code].permissions),
                 "limitation": "Descriptive state only; no academic judgment or automatic action"}
                for r in RULES if all(p in context.permissions for p in DEFINITIONS[r.report_code].permissions)]

    async def generate(self, context, scope, kind, filters):
        code = f"{scope}.{kind}"
        allowed = {r.report_code for r in RULES} | {
            f"{s}.{k}" for s in ("me", "monitor", "institution")
            for k in ("practices", "assessments", "competencies")}
        if code not in allowed:
            raise NotFoundError("Unknown Insights source")
        definition_for(code, context)
        report = await self.reports.generate(context, code, filters)
        metadata = report.metadata
        result = {"metadata": metadata.model_dump(mode="json"), "items": [],
                  "page": report.page, "page_size": report.page_size, "source_total": report.total,
                  "data_status": "available", "limitations": [
                      "Computed on request; not persisted, not valid offline, requery after source changes.",
                      "No resource recommendation or teacher decision is created.",
                      *metadata.limitations]}
        if metadata.data_status not in {"calculated_from_server_records", "no_applicable_records"}:
            result["data_status"] = "source_unavailable"
            return result
        if not report.rows:
            result["data_status"] = "insufficient_data"
            return result
        for rule in RULES:
            if rule.report_code != code:
                continue
            for row in report.rows:
                reference = row.get("assignment_id") or row.get("course_id")
                finding = evaluate(rule, row.get(rule.metric))
                if finding is None:
                    continue
                result["items"].append({
                    "insight_id": insight_id(context.institution_id, rule, metadata.filters, reference,
                                             metadata.definition_version, finding["observed_value"]),
                    "insight_type": "descriptive_condition", "rule_code": rule.code,
                    "rule_version": rule.version, "source_metric_ids": [rule.metric],
                    "source_report_id": code, "metric_definition_version": metadata.definition_version,
                    "academic_period_id": metadata.filters.get("academic_period_id"),
                    "institution_context": str(context.institution_id), "source_reference": reference,
                    "generated_at": metadata.generated_at.isoformat(), **finding})
        return result
