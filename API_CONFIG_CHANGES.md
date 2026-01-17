# API Configuration Update Summary

## ✅ Changes Completed

### 1. Created Centralized API Configuration
- **File**: `frontend/src/lib/api-config.ts`
- **Purpose**: Single source of truth for backend URL
- **Features**:
  - Uses `VITE_BACKEND_URL` environment variable
  - Fallback to `http://localhost:5000` for local development
  - Development mode logging
  - Helper function `getApiUrl()` for constructing endpoints

### 2. Updated All Components to Use API_CONFIG

#### AI Components
- ✅ `PersonalizedRecommendations.tsx` - Changed from `VITE_API_URL` to `VITE_BACKEND_URL`
- ✅ `ChatbotWidget.tsx` - Changed from `VITE_API_URL` to `VITE_BACKEND_URL`
- ✅ `HiddenChargeDetector.tsx` - Using `API_CONFIG.BACKEND_URL`
- ✅ `SentimentSummary.tsx` - Using `API_CONFIG.BACKEND_URL`
- ✅ `TravelTimeEstimator.tsx` - Using `API_CONFIG.BACKEND_URL`

#### Admin Components
- ✅ `DocumentReviewPanel.tsx` - Using `API_CONFIG.BACKEND_URL`
- ✅ `ModerationPanel.tsx` - Using `API_CONFIG.BACKEND_URL`

#### Owner Components
- ✅ `DocumentVerification.tsx` - Using `API_CONFIG.BACKEND_URL`

#### Analytics Components
- ✅ `AnalyticsDashboard.tsx` - Using `API_CONFIG.BACKEND_URL`

#### Pages
- ✅ `PGDetail.tsx` - Using `API_CONFIG.BACKEND_URL`

#### Hooks
- ✅ `use-recently-viewed.ts` - Using `API_CONFIG.BACKEND_URL`

### 3. Environment Variable Standardization

**Before**: Mixed usage of `VITE_API_URL` and `VITE_BACKEND_URL`
**After**: Consistent use of `VITE_BACKEND_URL` everywhere

### 4. Benefits

1. **Single Source of Truth**: All backend URLs managed in one place
2. **Easier Debugging**: Console logs show backend URL in development
3. **Deployment Ready**: Easy to switch between local/staging/production
4. **Type Safe**: TypeScript configuration with const assertions
5. **Consistent**: No more confusion between different env var names

## 🔧 Environment Variable Required

```env
VITE_BACKEND_URL=http://localhost:5000  # Local development
VITE_BACKEND_URL=https://your-backend.onrender.com  # Production
```

## 📝 Usage Pattern

```typescript
import { API_CONFIG } from '@/lib/api-config';

// Option 1: Direct usage
fetch(`${API_CONFIG.BACKEND_URL}/api/endpoint`)

// Option 2: Using helper (recommended)
import { getApiUrl } from '@/lib/api-config';
fetch(getApiUrl('/api/endpoint'))
```

## 🚀 Deployment Notes

1. **Vercel (Frontend)**:
   - Set `VITE_BACKEND_URL` to your Render backend URL
   - Example: `https://smartstay-backend-xxxx.onrender.com`

2. **Local Development**:
   - Uses `http://localhost:5000` as fallback
   - Backend must be running on port 5000

3. **Testing**:
   - Check browser console for API configuration log (dev mode)
   - Verify all API calls use correct URL

## ✅ All Files Updated

Total files modified: **12**
- Components: 9
- Pages: 1
- Hooks: 1
- New files: 1 (api-config.ts)

## Next Steps

1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd frontend && npm run dev`
3. Verify all API calls work correctly
4. For deployment: Update `VITE_BACKEND_URL` in Vercel to Render URL
