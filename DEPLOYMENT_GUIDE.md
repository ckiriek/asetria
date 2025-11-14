# 🚀 Deployment Guide - Skaldi на Vercel

## Пошаговая инструкция

### Предварительные требования

- ✅ GitHub аккаунт
- ✅ Vercel аккаунт (бесплатный)
- ✅ Supabase проект настроен
- ✅ Azure OpenAI credentials
- ✅ Все изменения закоммичены в Git

---

## Шаг 1: Подготовка репозитория

### 1.1 Проверка файлов

Убедитесь что есть:
- ✅ `vercel.json` - конфигурация Vercel
- ✅ `.vercelignore` - игнорируемые файлы
- ✅ `README.md` - документация
- ✅ `package.json` - зависимости

### 1.2 Commit и Push

```bash
# Проверьте статус
git status

# Добавьте все изменения
git add .

# Commit
git commit -m "Ready for production deployment"

# Push в main branch
git push origin main
```

---

## Шаг 2: Создание проекта на Vercel

### 2.1 Вход на Vercel

1. Откройте [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Authorize Vercel

### 2.2 Import проекта

1. Нажмите **"Add New..."** → **"Project"**
2. Найдите репозиторий `skaldi`
3. Нажмите **"Import"**

### 2.3 Configure Project

**Framework Preset**: Next.js (автоматически определится)

**Root Directory**: `./` (по умолчанию)

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Node.js Version**: 18.x (рекомендуется)

---

## Шаг 3: Environment Variables

### 3.1 Добавление переменных

В Vercel project settings → **Environment Variables**:

#### Supabase
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Azure OpenAI
```
AZURE_OPENAI_ENDPOINT = https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY = your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME = gpt-4
```

### 3.2 Environment Scope

Для каждой переменной выберите:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Шаг 4: Deploy

### 4.1 Первый Deploy

1. Нажмите **"Deploy"**
2. Дождитесь завершения build (2-5 минут)
3. Проверьте логи на ошибки

### 4.2 Проверка Deploy

После успешного deploy:
- ✅ Build Status: Ready
- ✅ Deployment URL: `https://skaldi-xxx.vercel.app`
- ✅ Production URL: `https://your-domain.com` (если настроен)

---

## Шаг 5: Supabase Edge Functions

### 5.1 Deploy Edge Functions

```bash
# Login to Supabase
npx supabase login

# Link project
npx supabase link --project-ref your-project-ref

# Deploy generate-document function
npx supabase functions deploy generate-document

# Deploy extract-entities function
npx supabase functions deploy extract-entities
```

### 5.2 Set Edge Function Secrets

```bash
# Set Azure OpenAI credentials for Edge Functions
npx supabase secrets set AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
npx supabase secrets set AZURE_OPENAI_API_KEY=your-api-key
npx supabase secrets set AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

---

## Шаг 6: Custom Domain (опционально)

### 6.1 Добавление домена

1. Vercel Project → **Settings** → **Domains**
2. Нажмите **"Add"**
3. Введите домен: `skaldi.co`
4. Следуйте инструкциям по настройке DNS

### 6.2 DNS Records

Добавьте в вашем DNS провайдере:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 SSL Certificate

Vercel автоматически создаст SSL сертификат (Let's Encrypt).

---

## Шаг 7: Тестирование Production

### 7.1 Smoke Tests

Откройте production URL и проверьте:

1. ✅ **Auth**: Login/Signup работает
2. ✅ **Dashboard**: Загружается
3. ✅ **Projects**: Создание проекта
4. ✅ **Documents**: Генерация документа
5. ✅ **Files**: Upload файла
6. ✅ **Export**: DOCX/PDF download
7. ✅ **API Integrations**: Fetch external data

### 7.2 Performance Check

```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 95+
```

---

## Шаг 8: Monitoring & Analytics

### 8.1 Vercel Analytics

1. Project → **Analytics** tab
2. Enable Web Analytics
3. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### 8.2 Supabase Monitoring

1. Supabase Dashboard → **Logs**
2. Monitor:
   - API requests
   - Database queries
   - Edge Function invocations
   - Storage usage

---

## Troubleshooting

### Build Errors

**Error**: `Module not found`
```bash
# Solution: Clear cache and rebuild
vercel --force
```

**Error**: `Environment variable missing`
```bash
# Solution: Check all env vars are set
vercel env ls
```

### Runtime Errors

**Error**: `Supabase connection failed`
- Check NEXT_PUBLIC_SUPABASE_URL
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY
- Verify Supabase project is active

**Error**: `Azure OpenAI timeout`
- Check AZURE_OPENAI_ENDPOINT
- Check AZURE_OPENAI_API_KEY
- Verify API quota

### Edge Function Errors

```bash
# Check Edge Function logs
npx supabase functions logs generate-document

# Redeploy if needed
npx supabase functions deploy generate-document --no-verify-jwt
```

---

## Continuous Deployment

### Auto-Deploy on Push

Vercel автоматически deploy'ит при push в:
- **main branch** → Production
- **other branches** → Preview deployments

### Preview Deployments

Каждый PR автоматически получает preview URL:
```
https://skaldi-git-feature-branch-xxx.vercel.app
```

### Rollback

Если что-то пошло не так:
1. Vercel Dashboard → **Deployments**
2. Найдите предыдущий успешный deploy
3. Нажмите **"..."** → **"Promote to Production"**

---

## Post-Deployment Checklist

- [ ] Production URL работает
- [ ] Auth flow работает
- [ ] Document generation работает
- [ ] File upload работает
- [ ] Export DOCX/PDF работает
- [ ] API integrations работают
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Custom domain configured (если нужно)
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Monitoring setup

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check error logs
- Monitor performance metrics
- Review API usage

**Monthly:**
- Update dependencies
- Review security advisories
- Backup database

**Quarterly:**
- Performance optimization
- Cost analysis
- Feature roadmap review

---

## Support

### Vercel Support
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Email: support@vercel.com

### Supabase Support
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Email: support@supabase.io

---

## 🎉 Deployment Complete!

Ваш Skaldi MVP теперь в production!

**Production URL**: https://your-domain.vercel.app

**Next Steps:**
1. Share with stakeholders
2. Gather feedback
3. Monitor usage
4. Plan next features

---

**Deployed with ❤️ on Vercel**
