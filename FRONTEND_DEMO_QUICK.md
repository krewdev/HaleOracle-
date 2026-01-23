# 🚀 Frontend Demo - Quick Reference

## Start Commands

```bash
# Option 1: Use script
cd /Users/krewdev/google
./start_frontend.sh

# Option 2: Manual
# Terminal 1:
source venv/bin/activate
python backend_api.py

# Terminal 2:
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/health

---

## 5-Minute Demo Flow

1. **Opening (30s)** - "Complete web interface for trustless verification"
2. **Verification Form (2m)** - Show PASS example, then FAIL example
3. **Deployment (30s)** - Show deployment instructions
4. **Monitoring (30s)** - Show dashboard
5. **Documentation (30s)** - Show built-in docs
6. **Integration (30s)** - Show code examples
7. **Closing (30s)** - "Production-ready platform"

---

## Test Data (Copy-Paste Ready)

### PASS Example
**Contract Terms:**
```
Generate a Python script to fetch the current price of USDC using the CoinGecko API.
```

**Acceptance Criteria:**
- Must be written in Python 3
- Must handle API errors gracefully
- Must print the price to console

**Delivery Content:**
```python
import requests

def get_usdc_price():
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd'
    try:
        response = requests.get(url)
        data = response.json()
        print(f'Current USDC Price: ${data["usd-coin"]["usd"]}')
    except Exception as e:
        print('Error fetching price')

get_usdc_price()
```

### FAIL Example
**Contract Terms:**
```
Generate a Python script to fetch USDC price.
```

**Acceptance Criteria:**
- Must handle API errors gracefully

**Delivery Content (Missing error handling):**
```python
import requests

def get_usdc_price():
    url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd'
    response = requests.get(url)
    data = response.json()
    print(f'Current USDC Price: ${data["usd-coin"]["usd"]}')

get_usdc_price()
```

---

## Key Talking Points

- ✅ **No-code interface** - Anyone can use it
- ✅ **Real-time AI verification** - 2-5 seconds
- ✅ **Complete platform** - Deploy, monitor, integrate
- ✅ **Production-ready** - Fully functional
- ✅ **Developer-friendly** - Code snippets included

---

## Troubleshooting

**Backend not running?**
```bash
source venv/bin/activate
python backend_api.py
```

**Frontend not loading?**
```bash
cd frontend
npm run dev
```

**Verification failing?**
- Check GEMINI_API_KEY in .env
- Check backend is running: curl http://localhost:8000/api/health

---

## Demo Checklist

- [ ] Backend running (port 8000)
- [ ] Frontend running (port 3000)
- [ ] Test data ready
- [ ] Browser tabs open
- [ ] GEMINI_API_KEY set

---

**Full guide:** See `FRONTEND_DEMO.md`
