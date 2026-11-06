# keepmyproof

Read AGENTS.md first: it holds the working rules for this repository.

- Model use: nothing paid. Every model call uses a `:free` model from `config/llm_routing.json`
  (`max_cost_usd: 0`); see `docs/cost/zero-paid-llm.md`.
- Website: `site/` (static, Cloudflare Pages). Landing pages and the /vault hub: `site/landings.mjs`.
  Identity and sameAs: `site/data/entity.json`.
- Search data: `data/search-console/` is written daily by `.github/workflows/search-console-daily.yml`.
