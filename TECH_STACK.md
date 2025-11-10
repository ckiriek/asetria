# Tech Stack - Asetria
Frontend: Next.js 14 + TypeScript + Tailwind, деплой в Vercel
Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
AI: Azure OpenAI (gpt-4o/gpt-4-turbo) через Azure SDK
Шаблоны: Jinja2-подобные шаблоны в базе, сборка DOCX (python-docx) и PDF (ReportLab)
Интеграции (MVP): ClinicalTrials.gov, PubMed/Entrez, openFDA, WHO ICTRP, MedDRA subset
Мониторинг: Vercel Analytics, Supabase logs, Sentry
Безопасность: AES-256 at rest, TLS in transit, Part 11-базовые практики, MFA для админов
