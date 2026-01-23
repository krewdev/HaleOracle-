# HALE Oracle Frontend

A modern, comprehensive frontend for deploying, customizing, monitoring, and integrating HALE Oracle.

## Features

- ✅ **Verification Form**: Enter custom data and verify deliveries
- ✅ **Deployment**: Deploy and configure the escrow contract
- ✅ **Monitoring**: Real-time monitoring of oracle performance
- ✅ **Documentation**: Comprehensive guides and API reference
- ✅ **Integration**: Easy integration guides for projects and agent wallets

## Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for backend API)

### Installation

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Install backend dependencies:
```bash
cd ..
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp env.template .env
# Edit .env and add your GEMINI_API_KEY
```

### Running

1. Start the backend API server:
```bash
python backend_api.py
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Building for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── VerificationForm.jsx  # Main verification interface
│   │   ├── Deployment.jsx         # Contract deployment
│   │   ├── Monitoring.jsx        # Oracle monitoring
│   │   ├── Documentation.jsx     # Comprehensive docs
│   │   └── Integration.jsx       # Integration guides
│   ├── App.jsx                   # Main app component
│   ├── App.css                   # Global styles
│   ├── index.css                 # Base styles
│   └── main.jsx                  # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## API Endpoints

The frontend communicates with the backend API at `http://localhost:8000`:

- `POST /api/verify` - Verify a delivery
- `GET /api/monitor/:address` - Get monitoring stats
- `POST /api/format` - Format data for oracle
- `GET /api/health` - Health check

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Ethers.js** - Web3 interactions
- **Axios** - HTTP client
- **Lucide React** - Icons

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
