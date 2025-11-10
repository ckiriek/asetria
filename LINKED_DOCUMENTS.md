# Linked Documents Architecture
Принцип single source of truth: документы читают значения из entities_corpus.
Любое изменение сущности - пометка зависимых документов как outdated и авто-пересборка.

События:
- update entities_corpus -> trigger edge function -> update documents.status='outdated'
- cron auto-refresh -> генерация новой версии документа -> запись в audit_log
