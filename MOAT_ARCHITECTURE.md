# Moat Architecture - Asetria

Компоненты moat:
1. Knowledge Graph - накопление структурированных сущностей и шаблонов документов в entities_corpus
2. Validation Rules Engine - база правил ICH/FDA с исполнением на edge functions
3. Terminology Graph - онтология терминов AE/SAE и препаратов (openFDA + MedDRA subset)

Почему это защитимо:
- Данные структур и правил накапливаются и улучшают качество генераций
- Терминологическая онтология снижает ошибки и повышает доверие регуляторов
- Связка с Linked Documents создает живую систему, которой трудно конкурировать простым LLM-подходом
