# Supabase Credentials для Asetria

## ✅ Проект создан и настроен

### Project Details
- **Project URL**: https://your-project.supabase.co
- **Project ID**: your-project-id
- **Region**: us-east-1
- **Status**: ACTIVE_HEALTHY

### API Keys

**⚠️ IMPORTANT: Never commit real API keys to Git!**

Get your keys from [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API

### Create .env.local file

Copy the following template to `.env.local` and replace with your actual credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key - ⚠️ SERVER-SIDE ONLY!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## ✅ База данных настроена

### Созданные таблицы (11 шт):
- ✅ organizations (1 запись)
- ✅ users (4 записи)
- ✅ projects (1 запись)
- ✅ documents (1 запись)
- ✅ entities_corpus (3 записи)
- ✅ evidence_sources (2 записи)
- ✅ validation_rules (14 правил для IB)
- ✅ term_ontology (6 MedDRA терминов)
- ✅ audit_log (1 запись)
- ✅ integrations (0 записей)
- ✅ document_links (0 записей)

### RLS Policies
- ✅ Row Level Security включен на всех таблицах
- ✅ Политики настроены для ролей: admin, medical_writer, reviewer, viewer
- ✅ Триггеры для автоматической пометки outdated документов

### Тестовые данные
**Организация**: Demo CRO
**Пользователи**:
- admin@democro.com (admin)
- writer@democro.com (medical_writer)
- reviewer@democro.com (reviewer)
- viewer@democro.com (viewer)

**Проект**: AST-101 Phase 2 Trial (Type 2 Diabetes)

## Следующие шаги

1. ✅ Получите Service Role Key из Dashboard
2. ✅ Создайте `.env.local` с ключами выше
3. ➡️ Переходите к Фазе 2: Next.js проект

## Полезные ссылки

- [Dashboard](https://supabase.com/dashboard/project/your-project-id)
- [Table Editor](https://supabase.com/dashboard/project/your-project-id/editor)
- [SQL Editor](https://supabase.com/dashboard/project/your-project-id/sql)
- [API Settings](https://supabase.com/dashboard/project/your-project-id/settings/api)
