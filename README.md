# WhOregonTrail

A modern take on the classic Oregon Trail game, powered by AI.

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Copy the example environment file and update with your settings:
```bash
cp .env.example .env
```

6. Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Environment Variables

### Backend (.env)
- `OPENAI_API_KEY`: Your OpenAI API key
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `LOG_LEVEL`: Logging level (default: INFO)

## Features

- AI-powered narrative generation
- Dynamic event system
- Resource management
- Character stats and health tracking
- Modern web interface
- Real-time game state updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 