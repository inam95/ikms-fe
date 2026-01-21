# ikms-fe ↔ ikms-be Integration Guide

This guide explains how to use the integrated Python RAG backend with the Next.js frontend.

## Overview

The integration allows the chatbot to use either:

1. **Direct OpenAI** - The original implementation using OpenAI directly
2. **Python RAG Backend** - Multi-agent RAG pipeline with LangChain, LangGraph, and Pinecone

## Architecture

```
Frontend (Next.js)
  ↓ UIMessage[]
/api/python-be route
  ↓ {question: string}
Python Backend /qa/stream (SSE)
  ↓ LangGraph Multi-Agent RAG
  ↓ SSE tokens
/api/python-be route (converts to UI Message Stream Protocol)
  ↓ UI Message Stream
Frontend useChat hook
  ↓ Renders in UI
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the `ikms-fe` directory:

```bash
# Python Backend URL
PYTHON_BE_URL=http://localhost:8001
```

### 2. Start the Python Backend

```bash
cd ikms-be
source .venv/bin/activate  # or activate your virtual environment
uvicorn src.app.api:app --reload --port 8001
```

The backend should be running at `http://localhost:8001`

### 3. Start the Next.js Frontend

```bash
cd ikms-fe
pnpm dev
```

The frontend should be running at `http://localhost:3000`

## Using the Integration

1. Open your browser to `http://localhost:3000`
2. You'll see a **Backend Selection** toggle at the top
3. Click the toggle to switch between:
   - **OpenAI Direct** - Uses the original `/api/chat` route
   - **Python Backend** - Uses the new `/api/python-be` route with RAG

## Features

### Current Implementation

- ✅ Streaming responses from Python backend
- ✅ Message format conversion (UIMessage ↔ QuestionRequest)
- ✅ SSE parsing and UI Message Stream Protocol conversion
- ✅ Error handling and display
- ✅ Backend toggle in UI

### Optional Enhancements (Not Yet Implemented)

To add RAG context as sources, modify the Python backend to emit source markers:

**In `ikms-be/src/app/api.py`:**

```python
async def event_generator():
    try:
        # Get context first
        result = answer_question(question)
        context = result.get("context", "")

        # Send context as a source marker
        if context:
            yield f"data: [SOURCE]{context}\n\n"

        # Stream the answer
        async for token in stream_answer(question):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: [ERROR] {str(e)}\n\n"
```

The frontend route already handles `[SOURCE]` markers and will render them in the Sources component.

## Testing

### Test Streaming

1. Switch to "Python Backend" mode
2. Ask a question: "What is a vector database?"
3. Verify:
   - Response streams token-by-token
   - No errors in browser console
   - Response is relevant to your indexed documents

### Test Error Handling

1. Stop the Python backend (Ctrl+C)
2. Try to send a message with Python Backend selected
3. Verify error message is displayed

### Test Backend Switching

1. Ask a question with OpenAI Direct
2. Switch to Python Backend
3. Ask another question
4. Verify both backends work independently

## Troubleshooting

### "Failed to fetch" Error

- **Cause**: Python backend is not running or wrong URL
- **Solution**: Check that `uvicorn` is running on port 8001

### No Streaming (Full Response at Once)

- **Cause**: SSE parsing issue
- **Solution**: Check browser Network tab for the `/api/python-be` request

### TypeScript Errors

- **Cause**: Missing types or incorrect imports
- **Solution**: Run `pnpm install` to ensure all dependencies are installed

## File Changes

### New Files

- `src/app/api/python-be/route.ts` - API route for Python backend integration

### Modified Files

- `src/app/page.tsx` - Added backend toggle UI

### Configuration Files

- `.env.local` - Environment variables (create manually, not in git)
- `.env.example` - Example environment variables (blocked by gitignore)

## Technical Details

### Message Format Conversion

**Frontend → Backend:**

```typescript
// UIMessage with parts
{
  id: "msg-123",
  role: "user",
  parts: [{ type: "text", text: "What is a vector database?" }]
}

// Converted to
{
  question: "What is a vector database?"
}
```

**Backend → Frontend:**

```
SSE Stream:
data: What
data:  is
data:  a
data:  vector
data:  database?
data: [DONE]

Converted to UI Message Stream Protocol:
data: {"type":"text-start","id":"txt_xxx"}
data: {"type":"text-delta","id":"txt_xxx","delta":"What"}
data: {"type":"text-delta","id":"txt_xxx","delta":" is"}
...
data: {"type":"text-end","id":"txt_xxx"}
```

### Key Dependencies

- `ai` (v6.0.42) - Vercel AI SDK
- `@ai-sdk/react` (v3.0.44) - React hooks for AI SDK
- `nanoid` - Generate unique IDs for message parts

## Next Steps

1. **Add Context Sources**: Implement `[SOURCE]` markers in Python backend
2. **Add Reasoning**: Emit reasoning steps from LangGraph agents
3. **Add File Upload**: Support PDF uploads through the chat interface
4. **Add Chat History**: Persist conversations in database
5. **Add Authentication**: Secure the API routes

## Support

For issues or questions:

- Check the browser console for errors
- Check the Python backend logs
- Review the implementation in `src/app/api/python-be/route.ts`
