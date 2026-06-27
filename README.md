# 🤖 AUDIRA-BOT-DC — Enterprise Bot Management Suite

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue.svg?style=for-the-badge" alt="Version 2.0.0">
  <img src="https://img.shields.io/badge/Node.js-20.x-green.svg?style=for-the-badge&logo=node.js" alt="Node.js 20">
  <img src="https://img.shields.io/badge/Platforms-WhatsApp%20%7C%20Telegram-orange.svg?style=for-the-badge" alt="Platforms">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License MIT">
</p>

---

## 🌟 Overview

**AUDIRA-BOT-DC** (PJTAUDIRABOT) is a state-of-the-art, production-ready bot management suite. Running on a scalable monorepo structure, it integrates **WhatsApp** (via Baileys) and **Telegram** (via grammY) with a React-based telemetry dashboard, centralized command logic, distributed rate-limiting, and AI-driven capabilities.

Developed by **Agus Dwi R (AUDIRA)**.

---

## 🏗️ Core Architecture & Monorepo Structure

Built with **pnpm workspaces** for strict dependency boundaries and modular reuse:

```
AUDIRA-BOT-DC/
├── packages/
│   ├── api/            # Fastify REST API server (port 4000)
│   ├── bots/           # Multi-platform bot orchestrators (WhatsApp & Telegram)
│   ├── dashboard/      # Vite + React Live Monitoring Dashboard (Neural Insights)
│   ├── services/       # Core business logic (AI, clustering, watchdog, command registry)
│   ├── config/         # Zod-validated configuration manager
│   ├── core/           # Shared logging (Winston), base errors, and models
│   └── database/       # PostgreSQL models with Prisma ORM
```

---

## 🧠 Audira Intelligent Core (AIC) & Advanced Features

The system features advanced automation modules designed to provide cognitive intelligence and high availability:

| Module | Technical Overview | Key Capabilities |
| :--- | :--- | :--- |
| **Smart Ticket Clustering** | Automated NLP classification & similarity matching | Groups related tickets within a 60-min window, handles cascade resolution, and alerts via Telegram NOC. |
| **Sentiment Analysis** | Injects AI models (`GPT-4o-mini`) into pipeline | Evaluates user expressions to output sentiment score: `POSITIVE`, `NEUTRAL`, `NEGATIVE`, or `URGENT`. |
| **Self-Healing Watchdog** | Active monitoring & autonomous container recovery | Runs system check every minute; auto-restarts Docker containers on prolonged API or Bot drops. |
| **Unified Identity** | Cross-platform contact mapping | Links WhatsApp and Telegram accounts together under a unified profile using verified phone numbers. |
| **Live Chat Takeover** | Socket.IO bridge for agent intervention | Allows admins to whisper tips or completely takeover bot sessions from the dashboard. |

---

## 🔐 Role-Based Permission Model

The command handler enforces strict Role-Based Access Control (RBAC):

```
┌─────────────────────────────────────────────────────────┐
│                       admin                             │
│  - Manage groups, reports, configuration, promote users  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                       user                              │
│  - Create tickets, write knowledge base, set reminders  │
└─────────────────────────────────────────────────────────┘
```

### Command Access Reference

| Command | Category | Min Role | Description |
| :--- | :--- | :--- | :--- |
| `!add-group` | Group Setup | **Admin** | Register a WhatsApp/Telegram group for monitoring |
| `!list-groups` | Group Setup | **Admin** | List all registered and monitored groups |
| `!set-monitor-group` | Group Setup | **Admin** | Enable/disable monitoring on specific group |
| `!remove-group` | Group Setup | **Admin** | Stop monitoring and remove group registration |
| `!setrole <phone> admin` | Security | **Admin** | Elevate a user's permission level |
| `!ticket <issue>` | Data Entry | **User** | Create a system-wide support ticket |
| `!kb <query>` | Data Entry | **User** | Query internal knowledge base |
| `!remind <time> <msg>` | Data Entry | **User** | Schedule a reminder |
| `!ping` | Diagnostic | **User** | Test responsiveness |

---

## 🚀 Quick Start

### 📋 Prerequisites
*   **Node.js**: `v20.0.0+`
*   **PostgreSQL**: `v15+`
*   **Redis**: `v7+`
*   **pnpm**: `v8+`
*   **Docker & Compose**: (Required for containerized setup)

### 💻 Local Installation

1.  **Clone and Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Environment Configuration**
    ```bash
    cp .env.example .env
    # Edit the generated .env with your credentials
    ```

3.  **Start Services via Docker**
    ```bash
    docker-compose -f docker/docker-compose.yml up -d
    ```

4.  **Database Migration & Seeding**
    ```bash
    pnpm db:migrate
    pnpm db:seed
    ```

5.  **Run Development Mode**
    ```bash
    # Start everything
    pnpm dev

    # Or run specific packages
    pnpm dev:api
    pnpm dev:whatsapp
    pnpm dev:telegram
    pnpm dev:dashboard
    ```

---

## 🐳 Production Container Deployment

Use the automated orchestration scripts:

```bash
# Clean build and start dockerized production environment
pnpm docker:up

# View real-time logs
pnpm docker:logs

# Tear down environment
pnpm docker:down
```

---

## 📄 Documentation Index

For deep dives into our architecture and features, refer to the documentation files:

*   📖 [Documentation Index](./docs/INDEX.md) — Map of all documentation
*   🏗️ [Architecture Guide](./docs/ARCHITECTURE.md) — Technical details & design
*   🎯 [Clustering Quickstart](./docs/CLUSTERING_QUICK_REFERENCE.md) — Incident clustering setup
*   🔐 [Permission Model](./docs/PERMISSION_MODEL.md) — Detailed RBAC manual
*   🚀 [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) — Production rollout guide

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](file:///f:/AUDIRA-BOT-DC/LICENSE) file for details.

Copyright © 2026 **Agus Dwi R (AUDIRA)**. All rights reserved.
