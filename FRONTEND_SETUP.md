# Frontend Setup Guide

## Quick Start

### 1. Install Frontend Dependencies

From the project root:
```bash
cd frontend
npm install
```

### 2. Install Python Dependencies

Make sure you're in the project root (not the frontend directory):
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

If you don't have a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start the Application

**Option A: Use the convenience script**
```bash
./start_frontend.sh
```

**Option B: Manual start**

Terminal 1 (Backend):
```bash
source venv/bin/activate
python backend_api.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 4. Open in Browser

Navigate to: `http://localhost:3000`

## Troubleshooting

### Error: "Could not open requirements file"

**Problem**: You're running `pip install` from the wrong directory.

**Solution**: Make sure you're in the project root directory (`/Users/krewdev/google`), not in the `frontend` directory.

```bash
# Check your current directory
pwd

# Should show: /Users/krewdev/google

# If you're in frontend/, go back:
cd ..
```

### Error: "externally-managed-environment"

**Problem**: Your system Python is externally managed.

**Solution**: Always use the virtual environment:

```bash
# Activate venv first
source venv/bin/activate

# Then install
pip install -r requirements.txt
```

### Error: "Module not found" when running backend

**Problem**: Dependencies not installed or venv not activated.

**Solution**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't connect to backend

**Problem**: Backend not running or wrong port.

**Solution**:
1. Make sure backend is running on port 8000
2. Check `vite.config.js` has the correct proxy settings
3. Verify backend API is accessible: `curl http://localhost:8000/api/health`

## Environment Variables

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
API_PORT=8000
FLASK_DEBUG=False
```

## Project Structure

```
google/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   └── ...
│   └── package.json
├── backend_api.py        # Flask API server
├── requirements.txt      # Python dependencies
├── venv/                 # Virtual environment
└── .env                  # Environment variables
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

### Backend Development

```bash
source venv/bin/activate
python backend_api.py
```

### Building for Production

```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`.

## Need Help?

- Check the main [README.md](../README.md)
- Review [frontend/README.md](frontend/README.md)
- Check browser console for frontend errors
- Check terminal output for backend errors
