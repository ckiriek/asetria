# Tasks Map - Asetria MVP

Infra
- [ ] Создать проект в Supabase, включить Auth, Storage, создать таблицы из DB_SCHEMA.md
- [ ] Подключить Vercel, настроить env переменные SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE
- [ ] Подключить Azure OpenAI (endpoint, api key)

Backend
- [ ] Edge function: /api/generate (читает entities + внешние источники -> вызывает Azure LLM -> сохраняет draft)
- [ ] Edge function: /api/validate (читает validation_rules -> выдает completeness и комментарии)
- [ ] Edge function: on_entity_update (пометка зависимых документов как outdated)
- [ ] Cron: auto_refresh_docs (перегенерация outdated документов)
- [ ] Клиенты к ClinicalTrials.gov, PubMed, openFDA, WHO ICTRP, lookup MedDRA subset

Frontend
- [ ] Проекты/Документы/Загрузка
- [ ] Вью IB с подсветкой секций и статусами валидации
- [ ] Панель зависимостей документов и статусы outdated/updated
- [ ] Экспорт DOCX/PDF

Compliance
- [ ] MFA для admin, неизменяемые логи аудита, версияция документов
- [ ] Политики хранения и шифрования, журнал доступа

Тесты
- [ ] Моки внешних API
- [ ] Prompt regression-тест для IB
- [ ] Валидация правил на демо-проектах
