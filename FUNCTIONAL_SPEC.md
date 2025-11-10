# Functional Spec - Asetria
Роли: admin, medical_writer, reviewer, viewer.

MVP функции:
- Проекты, загрузка файлов, извлечение сущностей (NER)
- Интеграции: ClinicalTrials.gov, PubMed/Entrez, openFDA, WHO ICTRP
- Генерация IB, проверка completeness (ICH E6), экспорт DOCX/PDF
- Audit trail и версияция документов
- Linked Documents: изменения в IB синхронно обновляют Protocol/ICF (через entities_corpus)

Фаза 2:
- Полная интеграция MedDRA + WHODrug, Protocol Synopsis генерация, ICF генерация
- Расширенный валидатор (структура + контентные правила)
