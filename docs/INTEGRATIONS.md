# Integrations Guide

S.I.R.I.U.S. supports a wide range of integrations to help you connect your favorite tools and services—all while keeping your data private and local.

## Available Integrations
- **Google Workspace** (Calendar, Gmail, Drive)
- **Asana** (Project and task management)
- **Jira** (Issue tracking)
- **Trello** (Kanban boards, Butler automation)
- **Notion** (Notes and databases)
- **n8n** (Workflow automation)
- **Pinecone** (Vector memory storage)
- **Ollama** (Local AI engine)
- **Multi-Platform** (Unified handling of multiple platforms)

## How to Enable/Disable Integrations
- Integrations are controlled via your `.env` file and `src/config/`.
- To enable an integration, add the required API keys or tokens to your `.env` file (see `.env.example` for variable names).
- To disable, simply remove or comment out the relevant keys in `.env`.
- Some integrations (like Ollama and Pinecone) work locally and require no external API keys.

## Where is the Code?
- Each integration has a dedicated service in `src/services/`:
  - Google: `googleWorkspaceService.js`, `gmailService.js`, `googleCalendarService.js`
  - Asana: `asanaService.js`, `asanaBestPracticesService.js`
  - Jira: `jiraService.js`
  - Trello: `trelloService.js`, `butlerAutomationService.js`
  - Notion: `notionService.js`
  - n8n: `n8nIntegrationService.js`
  - Pinecone: `pineconeService.js`
  - Ollama: `ollamaService.js`
  - Multi-platform: `multiPlatformService.js`
- API endpoints for each integration are defined in `src/routes/` (e.g., `googleRoutes.js`, `asanaRoutes.js`).

## Adding a New Integration
1. **Create a new service** in `src/services/` (e.g., `myNewService.js`).
2. **Add API routes** in `src/routes/` (e.g., `myNewRoutes.js`).
3. **Register your routes** in `src/routes/index.js`.
4. **Add any required config** to `src/config/` and update `.env.example`.
5. **Document your integration** in this file and the README.
6. (Optional) Add UI components or mobile support if needed.

## Privacy and API Keys
- All integrations are designed to keep your data local whenever possible.
- API keys are stored only in your local `.env` file and never sent to the cloud.
- You control which integrations are enabled.
- For maximum privacy, use only local integrations (Ollama, Pinecone) and avoid entering external API keys.

---

For more details, see the relevant service and route files, or ask in the project discussions! 