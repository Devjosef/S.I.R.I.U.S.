# S.I.R.I.U.S. 🤖

> **S**mart **I**ntelligent **R**esponsive **I**nterface for **U**niversal **S**upport

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Desktop-lightgrey.svg)](https://github.com/yourusername/sirius)
[![AI](https://img.shields.io/badge/AI-Ollama%20Powered-orange.svg)](https://ollama.ai/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/yourusername/sirius)

S.I.R.I.U.S. is a **privacy-first**, **offline-capable** AI assistant that runs entirely on your local machine. It serves as an intelligent companion for managing daily tasks, emails, calendars, and more, with a strong emphasis on keeping all data secure and local. The system learns from user patterns, including circadian rhythms (distinguishing morning or evening person behaviors), and provides personalized recommendations while maintaining complete data privacy through self-hosted, local processing.

## ✨ Features

### 🤖 **AI-Powered Intelligence**
- **Smart Task Management** - AI-driven task prioritization, scheduling, and autonomous actions
- **Email Intelligence** - Integration with Gmail for reading, summarizing, and composing emails with context
- **Calendar Optimization** - Smart scheduling with Google Calendar, including conflict resolution
- **Daily Digest** - Personalized daily summaries and insights via dailyDigestService
- **Context Awareness** - Learns user preferences, patterns, and adapts over time using contextEngine
- **Circadian Rhythm Analysis** - Detects and learns from user patterns to identify morning/evening preferences, with predictive modeling using transition matrices and confidence scoring
- **ML Predictions** - Next action prediction, optimal timing, success probability, and personalized recommendations via predictionService

### 🔒 **Privacy & Security**
- **100% Local** - All processing (including AI via Ollama) runs on your computer, no cloud dependencies required
- **Offline First** - Core features, including AI processing and memory storage, work without an internet connection
- **Data Ownership** - All user data stays local and private; no data is shared with third parties
- **Encrypted Storage** - Sensitive data is stored securely in local JSON files (e.g., data/memory/)
- **Self-Hosted Design** - No external authentication; all APIs are local and accessible only on your machine

### 📱 **Multi-Platform Support**
- **Web Interface** - Modern, responsive web app built with accessibility-first principles (ARIA labels, responsive design)
- **Mobile App** - Native React Native app with offline support (mobile-app/)
- **Browser Extension** - Quick access via Chrome/Edge extension (browser-extension/)
- **Desktop Integration** - System-level notifications and worker threads for efficient processing

### 🔧 **Integrations**
- **Asana** - Project management with best practices via asanaService and asanaBestPracticesService
- **Google Workspace** - Calendar, Gmail, and Drive integration through googleWorkspaceService
- **Jira** - Issue tracking and management via jiraService
- **Trello** - Board and card management with butlerAutomationService
- **n8n** - Workflow automation via n8nIntegrationService
- **Pinecone** - Vector database for advanced memory storage via pineconeService
- **Notion** - Note-taking integration via notionService
- **Ollama** - Local AI engine for offline processing via ollamaService
- **Multi-Platform** - Unified handling of multiple platforms via multiPlatformService

### ⚙️ **Technical Highlights**
- **Local AI** - Powered by Ollama for privacy-preserving AI operations
- **Memory System** - Persistent local storage for user patterns and learning (memoryService)
- **Worker Threads** - Efficient handling of CPU-intensive tasks (workers/ and workerManager)
- **WebSocket** - Real-time communication via websocketService
- **Testing Suite** - Comprehensive tests for memory, Ollama, workers, circadian patterns, ML predictions, and integrations (/tests/)

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Ollama** - Local AI engine - [Install here](https://ollama.ai/) and pull a model (e.g., `ollama pull llama3.1:8b`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sirius.git
   cd sirius
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configurations (e.g., API keys for integrations, if needed)
   ```

4. **Start S.I.R.I.U.S.**
   ```bash
   npm start
   # Or for development: npm run dev
   ```

5. **Access the interface**
   - Web: Open `http://localhost:3000` in your browser
   - Mobile: Run `npm run mobile` in mobile-app/
   - Extension: Load browser-extension/ in your browser's extension manager

## 📚 Documentation

### 🎯 **Getting Started**
- **[Setup Guide](docs/SETUP_SIMPLE.md)** - Detailed installation and configuration
- **[User Guide](docs/USER_GUIDE_SIMPLE.md)** - Effective usage of S.I.R.I.U.S.
- **[API Reference](docs/API_SIMPLE.md)** - Connecting external applications
- **[Troubleshooting](docs/TROUBLESHOOTING_SIMPLE.md)** - Solutions to common issues

### 🔧 **Technical Documentation**
- **[Memory System](docs/MEMORY.md)** - How S.I.R.I.U.S. learns from user patterns (including circadian rhythms)
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Local deployment instructions
- **[Ollama Setup](docs/OLLAMA_SETUP.md)** - Configuring the local AI engine
- **[Logging System](docs/LOGGING.md)** - Debugging and monitoring with logger.js
- **[AI Optimization](docs/MATRYOSHKA_QUANTIZATION.md)** - Performance tuning with matryoshkaQuantization

### 🎤 **Advanced Features**
- **[Voice Integration](docs/VOICE_ROADMAP.md)** - Planned voice commands and synthesis
- **[Platform Integrations](docs/HYPER_FUNCTIONAL_INTEGRATIONS.md)** - Connecting to Asana, Jira, Trello, etc.
- **[Testing](tests/README.md)** - Running and understanding the test suite

## 🏗️ Architecture

```
S.I.R.I.U.S.
├── 🤖 AI Engine (Ollama) - Local AI processing
├── 🧠 Memory System (Local JSON + Pinecone) - User patterns and circadian learning
├── 🔌 WebSocket Server - Real-time updates
├── 📱 Multi-Platform Interfaces (Web, Mobile, Extension)
├── 🔧 Services (asanaService, jiraService, etc.) - Integrations and logic
├── ⚙️ Workers (actionWorker, contextWorker, etc.) - Efficient processing
└── 🔒 Local Security - No external auth, fully self-hosted
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm
- Git
- Optional: Ollama for AI features, API keys for integrations

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/yourusername/sirius.git
cd sirius

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Project Structure
```
S.I.R.I.U.S./
├── src/                 # Core application code
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers (e.g., asanaController.js)
│   ├── middleware/      # Express middleware (e.g., errorHandler.js)
│   ├── routes/          # API routes (e.g., predictionRoutes.js)
│   ├── services/        # Business logic (e.g., memoryService.js, ollamaService.js)
│   └── utils/           # Utilities (e.g., logger.js, workerManager.js)
├── public/              # Static assets (e.g., icons/)
├── mobile-app/          # React Native mobile application
├── browser-extension/   # Browser extension files
├── data/                # Local data storage (e.g., memory/, oauth-tokens.json)
├── tests/               # Test scripts (e.g., test-ollama.js)
├── workers/             # Worker threads (e.g., ollamaWorker.js)
└── README.md            # This file
```

## 🤝 Contributing

Contributions are welcome! Please follow the [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Adhere to clean code principles (SOLID, DRY, SRP)
- Use Functional or Object-Oriented Programming as appropriate
- Follow UI/UX rules: Accessibility first, responsive design, minimalistic, ARIA labels
- Test-driven or Event-driven design where fitting
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** - For local AI capabilities
- **Pinecone** - For vector memory storage
- **Express.js** - Web framework
- **React Native** - Mobile framework
- **Community** - Contributors and users

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/sirius/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/sirius/discussions)
- **Email**: support@sirius.ai (local support only)

## 📊 Project Status

- **Version**: 1.0.0
- **Status**: Active Development
- **Last Updated**: [Current Date]

---

<div align="center">

**Made with ❤️ for Privacy and Efficiency**

[![GitHub stars](https://img.shields.io/github/stars/Devjosef/S.I.R.I.U.S.?style=social)](https://github.com/Devjosef/S.I.R.I.U.S.)
[![GitHub forks](https://img.shields.io/github/forks/Devjosef/S.I.R.I.U.S.?style=social)](https://github.com/Devjosef/S.I.R.I.U.S.)
[![GitHub issues](https://img.shields.io/github/issues/Devjosef/S.I.R.I.U.S.)](https://github.com/Devjosef/S.I.R.I.U.S./issues)

</div>
