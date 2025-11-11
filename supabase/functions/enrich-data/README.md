# Enrich Data Edge Function

**Purpose:** Orchestrate data enrichment from multiple sources for Generic products

## Architecture

```
Edge Function
  ↓
Step 1: PubChem → InChIKey ✅
  ↓
Step 2: Orange Book → RLD info ✅
  ↓
Step 3: DailyMed → Latest label ✅
  ↓
Step 4: openFDA → FDA label (fallback) ✅
  ↓
Step 5: ClinicalTrials.gov → Trial data ✅
  ↓
Step 6: PubMed → Literature ✅
  ↓
Update project + Log
```

## Data Flow

1. **Input:** `{ project_id: string }`
2. **Fetch project** from database
3. **Resolve InChIKey** via PubChem
4. **Fetch RLD info** via Orange Book (if Generic)
5. **Fetch labels** via DailyMed + openFDA
6. **Fetch trials** via ClinicalTrials.gov
7. **Fetch literature** via PubMed
8. **Store all data** in regulatory tables
9. **Update project** with enrichment status
10. **Log operations** to ingestion_logs

## Error Handling

- Non-blocking: If one source fails, continue with others
- Error codes: E301, E302, E303, etc.
- Severity levels: error, warning, info
- Coverage tracking: % of data fetched

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy enrich-data

# Test locally
supabase functions serve enrich-data
```

## Environment Variables

```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Usage

```typescript
// From API route
const response = await fetch(`${SUPABASE_URL}/functions/v1/enrich-data`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({ project_id: 'uuid' }),
})
```

## Response

```json
{
  "success": true,
  "project_id": "uuid",
  "inchikey": "INCHIKEY",
  "duration_ms": 5000,
  "coverage": {
    "compound_identity": 1.0,
    "labels": 1.0,
    "clinical": 0.8,
    "literature": 0.6
  },
  "sources_used": ["PubChem", "Orange Book", "DailyMed", "openFDA", "ClinicalTrials.gov", "PubMed"],
  "records_fetched": {
    "labels": 2,
    "trials": 5,
    "literature": 10,
    "adverse_events": 0
  }
}
```

## Status

**Current:** ALL 6 ADAPTERS INTEGRATED! ✅  
**Version:** 2.0.0 - Full Integration  
**Progress:** 6/6 (100%) 🎉

### Integrated Adapters:
1. ✅ PubChem - InChIKey resolution & chemical data
2. ✅ Orange Book - RLD & TE codes (Generic only)
3. ✅ DailyMed - Current FDA labels
4. ✅ openFDA - FDA labels (fallback)
5. ✅ ClinicalTrials.gov - Clinical trial data
6. ✅ PubMed - Scientific literature

### Features:
- ✅ Non-blocking execution
- ✅ Comprehensive error handling
- ✅ Coverage tracking
- ✅ Provenance logging
- ✅ Rate limiting for all sources
- ✅ Graceful degradation (if one source fails, continue)
- ✅ Metrics and reporting
