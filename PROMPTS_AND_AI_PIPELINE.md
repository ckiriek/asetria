# AI Pipeline
Этапы: Ingest -> Extract -> Enrich (внешние API) -> Generate -> Validate -> Assemble -> Audit.

Пример системного промпта IB:
You are an expert medical writer. Generate an Investigator's Brochure strictly aligned to ICH E6 structure.
Input JSON содержит: compound, indication, phase, endpoints, safety_profile (from openFDA), analog_studies (from ClinicalTrials.gov), publications (PubMed).
Выводи структурированные секции, с маркерами источников и списком отсутствующих данных.

Валидация: запуск rules по validation_rules. Возвращаем completeness_score и список недостающих секций.
