# 💧 Raindrop AI Navigator

> **🚀 Transform your Raindrop.io bookmarks into a stunning, personalized web navigation portal.**

A beautiful, grid-based bookmark manager for **Raindrop.io** with AI capabilities to auto-enrich bookmark descriptions and tags. Built with React, Tailwind CSS, and optimized for seamless deployment to **Cloudflare Pages**.

## ✨ Features
- **Grid Layout**: Premium frosted-glass UI with custom scrollbars for managing your bookmarks.
- **Access Control**: Secure your site from public access by configuring a customizable login key.
- **Raindrop Sync**: Direct API integration with your Raindrop.io collections and bookmarks.
- **AI Auto-Enrichment**: Configurable (OpenAI-compatible) endpoint to automatically generate concise descriptions and relevant tags for any link using an LLM. Features a stop button to cancel long-running batches.
- **Dead & Duplicate Link Checker**: Detect `404` errors or duplicate bookmarks. Cancel scanning anytime and review/delete findings using a dedicated modal interface for safety.
- **Serverless Ready**: The `/functions` directory utilizes Cloudflare Pages Functions, making deployment completely free and maintenance-free.

---

## 🚀 One-Click Deployment (Cloudflare Pages)

Deploying to Cloudflare Pages is the easiest way to host this app for free.
The deployment handles the frontend React build and exposes the backend APIs automatically.

### Deployment Steps

1. **Push your code:** Push this repository to your own GitHub/GitLab account.
2. **Cloudflare Dashboard:** Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/) ➡️ **Workers & Pages**.
3. **Create:** Click **Create Application** ➡️ **Pages** ➡️ **Connect to Git**.
4. **Select repo:** Select your `raindrop-ai-navigator` repository.
5. **Build Setup:** In the Build settings, choose **Vite** framework (or manually configure):
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. **⚠️ Important - Environment Variables:**
   - Expand the **Environment variables** section.
   - Add a new variable:
     - **Variable name**: `RAINDROP_API_KEY`
     - **Value**: *(Your Raindrop Test Token)*
     > *To get your Test Token, open [Raindrop Integrations](https://app.raindrop.io/settings/integrations), click "Create new app", and generate a Test Token.*
   - Add an optional variable to secure your app:
     - **Variable name**: `VITE_LOGIN_KEY`
     - **Value**: *(Any secret password you want your users to type in)*
7. **Deploy:** Click **Save and Deploy**. 

Cloudflare will automatically build the static assets and deploy the backend APIs (from the `/functions` folder)!

---

## ⚙️ AI Setup

Once deployed securely to Cloudflare, you can configure your AI provider directly in the UI. 
Click the **⚙️ AI Settings** gear in the top right header:

- **Base URL**: Leave empty for OpenAI, or enter your custom LLM proxy/provider (e.g., `https://api.deepseek.com/v1`).
- **API Key**: Your API secret key for the chosen provider.
- **Model ID**: Enter the model reference (e.g., `gpt-3.5-turbo`, `gpt-4o`, `deepseek-chat`).

*Note: Your AI credentials are saved locally in your browser's local storage and are never sent to a central server.*

---

## 💻 Local Development

If you want to run this project locally on your machine:

1. Clone repo and install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and set your `RAINDROP_API_KEY`.
3. Run the development server (runs with Vite and Express locally):
   ```bash
   npm run dev
   ```

Enjoy your aesthetic, AI-powered bookmark manager!
