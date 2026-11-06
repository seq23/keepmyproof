# Zero paid LLM — keepmyproof

Owner policy: nothing paid. The app makes no model calls at all (papers never leave the phone).

| Call site | What it does | Models | Guard |
|---|---|---|---|
| `scripts/translate-facts.mjs` (run by hand) | Translates verified state facts into Chinese and Korean | the `:free` OpenRouter models in `config/llm_routing.json`, in order | a response with a non-zero `usage.cost` is `NAMED STOP [PAID_MODEL]` and the run stops |
| Search Loop (`.github/workflows/search-loop.yml`, engine `seq23/search-loop`) | Drafts question pages | the engine's own $0 lanes (OpenRouter `:free`, Gemini no-billing project, Workers AI inside its free daily allowance) | the engine fails closed on any unknown cost |

`config/llm_routing.json` holds `max_cost_usd: 0` and the model list; the translate script reads it.
To refresh the list, fetch `https://openrouter.ai/api/v1/models` (no key), keep models whose prompt and
completion prices are `"0"`, and update `models` and `pricing_snapshot.date`.
