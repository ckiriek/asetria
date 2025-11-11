# Autocomplete Guide

## Overview
The Asetria platform includes intelligent autocomplete functionality for key form fields, powered by external regulatory databases and internal project data.

## Features
- **Smart Search:** Searches across multiple data sources (PubChem, FDA, ClinicalTrials.gov)
- **Debounced Input:** 300ms delay to reduce API calls
- **Keyboard Navigation:** Full keyboard support (arrows, enter, escape)
- **Loading Indicators:** Visual feedback during search
- **Source Attribution:** Shows where data comes from
- **Minimum Characters:** 3 characters for most fields, 2 for countries

## Autocomplete Fields

### 1. Compound / Drug Name
**Endpoint:** `/api/v1/autocomplete/compounds`  
**Data Sources:**
- PubChem (chemical compounds)
- DailyMed (drug names)

**Returns:**
- Compound name
- Molecular formula
- InChIKey
- Source

**Example:**
```
User types: "metf"
Suggestions:
- Metformin (C4H11N5 • pubchem)
- Metformin Hydrochloride (C4H12ClN5 • pubchem)
```

### 2. RLD Brand Name
**Endpoint:** `/api/v1/autocomplete/rld?type=brand`  
**Data Source:** FDA Orange Book

**Returns:**
- Brand name
- Application number
- Generic name
- Dosage form
- TE code

**Example:**
```
User types: "glu"
Suggestions:
- GLUCOPHAGE (NDA020357 • Metformin Hydrochloride • TE: AB)
- GLUCOTROL (NDA019468 • Glipizide • TE: AB)
```

### 3. Application Number
**Endpoint:** `/api/v1/autocomplete/rld?type=application`  
**Data Source:** FDA Orange Book

**Returns:**
- Application number
- Brand name
- Generic name
- Dosage form
- TE code

**Example:**
```
User types: "NDA020"
Suggestions:
- NDA020357 (GLUCOPHAGE • Metformin Hydrochloride)
```

### 4. Indication
**Endpoint:** `/api/v1/autocomplete/indications`  
**Data Sources:**
- Existing projects (Supabase)
- ClinicalTrials.gov

**Returns:**
- Indication name
- Source (projects or clinicaltrials)
- Count (for existing projects)

**Example:**
```
User types: "diab"
Suggestions:
- Type 2 Diabetes (3 projects)
- Diabetes Mellitus (1 project)
- Diabetic Nephropathy (clinicaltrials)
```

### 5. Countries
**Endpoint:** `/api/v1/autocomplete/countries`  
**Data Source:** Curated list of 50+ countries

**Returns:**
- Country name

**Example:**
```
User types: "un"
Suggestions:
- United States
- United Kingdom
```

## Component Usage

### Basic Usage
```tsx
import { FieldAutocomplete } from '@/components/forms/field-autocomplete'

<FieldAutocomplete
  value={formData.compound_name}
  onChange={(value) => setFormData({ ...formData, compound_name: value })}
  endpoint="/api/v1/autocomplete/compounds"
  placeholder="e.g., Metformin Hydrochloride"
  required
/>
```

### Advanced Usage
```tsx
<FieldAutocomplete
  value={formData.countries}
  onChange={(value) => setFormData({ ...formData, countries: value })}
  endpoint="/api/v1/autocomplete/countries"
  placeholder="e.g., USA, Germany, Japan"
  minChars={2}
  onSelect={(item) => {
    console.log('Selected:', item)
    // Custom logic on selection
  }}
  renderSuggestion={(item) => (
    <div className="custom-suggestion">
      {item.country}
    </div>
  )}
/>
```

## API Response Format

### Compounds
```json
{
  "success": true,
  "data": [
    {
      "name": "Metformin Hydrochloride",
      "source": "pubchem",
      "molecular_formula": "C4H12ClN5",
      "inchikey": "XZUCBFLUEBDNSJ-UHFFFAOYSA-N"
    }
  ],
  "query": "metf",
  "total": 1
}
```

### RLD
```json
{
  "success": true,
  "data": [
    {
      "brand_name": "GLUCOPHAGE",
      "application_number": "NDA020357",
      "generic_name": "Metformin Hydrochloride",
      "dosage_form": "TABLET",
      "te_code": "AB"
    }
  ],
  "query": "glu",
  "type": "brand",
  "total": 1
}
```

### Indications
```json
{
  "success": true,
  "data": [
    {
      "indication": "Type 2 Diabetes",
      "source": "projects",
      "count": 3
    },
    {
      "indication": "Diabetes Mellitus",
      "source": "clinicaltrials"
    }
  ],
  "query": "diab",
  "total": 2
}
```

### Countries
```json
{
  "success": true,
  "data": [
    { "country": "United States" },
    { "country": "United Kingdom" }
  ],
  "query": "un",
  "total": 2
}
```

## Keyboard Shortcuts
- **Arrow Down:** Move to next suggestion
- **Arrow Up:** Move to previous suggestion
- **Enter:** Select highlighted suggestion
- **Escape:** Close suggestions dropdown

## Performance Considerations
- **Debouncing:** 300ms delay reduces API calls
- **Rate Limiting:** Respects external API rate limits
- **Caching:** Consider implementing Redis cache for popular searches
- **Limit:** Maximum 10 suggestions per search

## Error Handling
- Network errors: Gracefully degrades, returns empty results
- API errors: Logged to console, user sees no suggestions
- Timeout: 30 second timeout on external API calls

## Future Enhancements
- [ ] Add drug class autocomplete
- [ ] Add primary endpoint autocomplete
- [ ] Implement Redis caching for popular searches
- [ ] Add analytics to track most-used suggestions
- [ ] Support for multiple selections (tags)
- [ ] Fuzzy matching for typos
- [ ] Recent searches history

## Troubleshooting

### No suggestions appearing
1. Check minimum character requirement (3 for most fields, 2 for countries)
2. Check network tab for API errors
3. Verify external API credentials (if required)
4. Check console for error messages

### Slow suggestions
1. Check network speed
2. Verify external API response times
3. Consider implementing caching
4. Check rate limiting status

### Wrong suggestions
1. Verify query is in English
2. Check data source configuration
3. Verify external API is returning correct data
4. Check suggestion rendering logic

## Related Files
- `components/forms/field-autocomplete.tsx` - Main component
- `app/api/v1/autocomplete/compounds/route.ts` - Compounds endpoint
- `app/api/v1/autocomplete/rld/route.ts` - RLD endpoint
- `app/api/v1/autocomplete/indications/route.ts` - Indications endpoint
- `app/api/v1/autocomplete/countries/route.ts` - Countries endpoint
- `lib/adapters/pubchem.ts` - PubChem adapter
- `lib/adapters/orange-book.ts` - Orange Book adapter
- `lib/adapters/clinicaltrials.ts` - ClinicalTrials.gov adapter
- `lib/adapters/dailymed.ts` - DailyMed adapter

## Support
For issues or questions, see:
- `devlog/2025-11-11-autocomplete-fix.md` - Implementation details
- `docs/ERROR_HANDLING.md` - Error handling guide
- `docs/API_INTEGRATIONS.md` - External API documentation
