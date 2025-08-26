# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AI Observe is a Next.js application that provides AI observability by monitoring and analyzing interactions with OpenAI's API. It tracks token usage, latency metrics, and provides detailed token-level visualization for prompts and responses.

## Core Architecture

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with OpenAI integration
- **Database**: SQLite with Prisma ORM
- **Token Analysis**: tiktoken for OpenAI token encoding/decoding
- **UI**: Custom dark-themed interface with real-time dashboards

## Key Components

### API Routes
- `/api/chat` - Handles OpenAI completions, tracks metrics, and provides token breakdowns
- `/api/metrics` - Aggregates and serves dashboard statistics

### Frontend Components
- `Dashboard.tsx` - Real-time metrics display with auto-refresh
- `TokenVisualization.tsx` - Interactive token-level breakdown with hover tooltips
- `page.tsx` - Main chat interface with model selection

### Database Schema
- `Metric` model tracks: model, prompt hash, character/token counts, latency, status, errors

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Initialize database
npm run prisma:migrate
```

### Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations
npm run prisma:migrate    # Apply migrations
npx prisma studio         # View database GUI
npx prisma db push        # Push schema changes
```

### Testing Individual Components
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "model": "gpt-4o-mini"}'

curl http://localhost:3000/api/metrics
```

## Environment Setup

Required environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - SQLite database path (defaults to `file:./dev.db`)

## Architecture Notes

### Token Visualization Strategy
The app uses multiple fallback strategies for token visualization:
1. Primary: tiktoken encoding for accurate token-to-text mapping
2. Fallback: Text-based segmentation when tiktoken fails
3. Last resort: Generic token numbering

### Real-time Updates
- Dashboard auto-refreshes every 3 seconds
- Metrics are stored immediately after each API call
- Recent requests limited to 50 for performance

### Error Handling
- OpenAI API errors are captured and stored in metrics
- Frontend gracefully handles missing token data
- Database disconnection is properly managed

### Performance Considerations
- Uses Turbopack for faster development builds
- Token visualization is lazy-loaded and collapsible
- Recent requests have scrollable overflow for large datasets

## File Structure Navigation

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # OpenAI integration & metrics
│   │   └── metrics/route.ts   # Dashboard data aggregation  
│   ├── layout.tsx             # Root layout with fonts
│   ├── page.tsx               # Main chat interface
│   └── globals.css            # Tailwind styles
├── components/
│   ├── Dashboard.tsx          # Metrics dashboard
│   └── TokenVisualization.tsx # Token breakdown UI
prisma/
├── schema.prisma              # Database schema
└── dev.db                     # SQLite database file
```

## Common Debugging

### Token Visualization Issues
- Check browser console for tiktoken WASM loading errors
- Verify OpenAI model compatibility with tiktoken encoding
- Test fallback visualization with simple text inputs

### Database Issues
- Ensure `DATABASE_URL` points to writable location
- Run `npx prisma db push` after schema changes
- Check `dev.db` file permissions

### OpenAI API Issues
- Verify API key is set correctly in `.env`
- Check network connectivity and API rate limits
- Review error logs in metrics table for detailed error messages
