## **Query Planning & Decomposition Agent**

**Concept**: Add an intelligent **Query Planner Agent** that analyzes complex questions and creates a structured search strategy before retrieval begins.

### Current Limitation

The `retrieval_node` sends the raw user question directly to the retrieval agent as a single message. The system performs only one retrieval call and may miss important aspects of complex, multi-part questions.

### What You'll Build

**1. Enhanced State Schema** ([`state.py`](ikms-be/src/app/core/agents/state.py))

Add new fields to track planning:

```python
plan: str | None  # Natural language search strategy
sub_questions: list[str] | None  # Decomposed questions
```

**2. Planning Agent** ([`prompts.py`](ikms-be/src/app/core/agents/prompts.py), [`agents.py`](ikms-be/src/app/core/agents/agents.py))

Create a new agent with a system prompt that:

- Rephrases ambiguous questions
- Identifies key entities, time ranges, or topics
- Decomposes complex questions into focused sub-questions
- Outputs a structured search plan

**Example Planning Output**:

```
Original Question: "What are the advantages of vector databases compared to traditional databases, and how do they handle scalability?"

Plan:
1. Search for advantages of vector databases
2. Search for comparison with traditional databases
3. Search for scalability mechanisms in vector databases

Sub-questions:
- "vector database advantages benefits"
- "vector database vs relational database comparison"
- "vector database scalability architecture"
```

**3. Graph Node Implementation** ([`graph.py`](ikms-be/src/app/core/agents/graph.py))

Insert planning node into the pipeline:

```
START → planning → retrieval → summarization → verification → END
```

The planning node:

- Reads `state["question"]`
- Invokes the planning agent
- Extracts and stores the plan in state

**4. Enhanced Retrieval**

Update `retrieval_node` to use the plan:

- Include both original question AND plan in retrieval messages
- Optionally enable multiple retrieval tool calls for each sub-question
- Aggregate results from all sub-queries

### Acceptance Criteria

✅ Complex questions trigger a visible planning step in logs

✅ Retrieval behavior changes based on generated plan (more relevant/diverse chunks)

✅ Downstream agents (summarization, verification) continue working without modification

✅ API exposes the generated plan in response

### UI Implementation Ideas

- Display the generated search plan above the final answer
- Show which sub-questions were created
- Visualize the planning → retrieval → answer flow
- Add a toggle to enable/disable query planning
