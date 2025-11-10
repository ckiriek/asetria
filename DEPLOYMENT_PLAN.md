# Deployment Plan
Envs: Dev - локально, Staging - Vercel preview, Prod - Vercel prod.
Шаги:
1. Импорт схемы БД в Supabase
2. Создание buckets: documents, terms
3. Загрузка MedDRA subset CSV в terms
4. Настройка Azure OpenAI
5. Настройка переменных окружения в Vercel
6. Деплой фронта, подключение edge functions
7. Smoke-тест: создать проект, загрузить данные, сгенерировать IB, валидировать, экспортировать
