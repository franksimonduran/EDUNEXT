"""RFC-style CSV quoting plus independent spreadsheet formula neutralization."""

import csv
import io
import json


def safe_cell(value):
    if value is None:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False, default=str)
    text = str(value)
    probe = text.lstrip(" \t\r\n\v\f\x00\ufeff")
    if probe.startswith(("=", "+", "-", "@")) or text.startswith(("\t", "\r", "\n")):
        return "'" + text
    return text


def export_csv(report):
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\r\n")
    def write(row):
        writer.writerow([safe_cell(cell) for cell in row])
    write(["EDUNEXT — reporte informativo, no oficial"])
    for key, value in report.metadata.model_dump(mode="json").items():
        write([key, value])
    write([])
    write(["metric_id", "value", "unit", "numerator", "denominator", "data_status"])
    for metric in report.metrics:
        write([metric.id, metric.value, metric.unit, metric.numerator, metric.denominator, metric.data_status])
    write([])
    write(report.columns)
    for row in report.rows:
        write([row.get(column) for column in report.columns])
    write([])
    write(["metric_definitions", report.definitions])
    return output.getvalue().encode("utf-8-sig")
