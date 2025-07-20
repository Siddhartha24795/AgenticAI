# Agrigentic AI - Your AI-Powered Farming Assistant

Agrigentic AI is a modern web application built with Next.js, designed to be a comprehensive digital assistant for farmers. It leverages the power of generative AI to provide critical information and tools, including crop disease diagnosis, real-time market analysis, information on government schemes, and an emergency notification system. The entire application is multilingual, supporting English, Kannada, and Hindi.

## Features

- **Crop Disease Diagnosis**: Upload a photo of a plant, describe the issue with text, or use your voice to get an instant AI-powered diagnosis and recommended remedies.
- **Market Analysis**: Get real-time market insights for your crops in various locations across India to make informed selling decisions.
- **Government Schemes Navigator**: Ask questions about government agricultural schemes to receive simple, actionable summaries, including eligibility and application links.
- **Emergency Notifier**: Quickly send alerts for emergencies like fire, flood, or medical issues to local authorities and fellow farmers.
- **Multilingual Interface**: Full UI and AI response support for English, Kannada, and Hindi.
- **Dual Text & Audio Responses**: All AI-generated responses are provided in both text and an optional, on-demand audio format.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI Integration**: [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) with the [Google Gemini API](https://ai.google.dev/docs/gemini_api_overview)
- **Backend Services**: [Firebase Authentication](https://firebase.google.com/docs/auth) & [Cloud Firestore](https://firebase.google.com/docs/firestore)

---

## Getting Started

Follow these instructions to set up and run the project locally for development and testing.

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en) (v20 or later recommended)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/getting-started/install)

### 1. Set Up Your Firebase Project

This project uses Firebase for user authentication (anonymous sign-in) and Firestore to store diagnosis history.

1.  **Create a Firebase Project**: If you don't have one already, go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App**: In your project's dashboard, add a new Web Application. Firebase will provide you with a configuration object containing your API keys. You will need these for your environment file.
3.  **Enable Authentication**: In the Firebase Console, navigate to **Build > Authentication**. Go to the **Sign-in method** tab and enable the **Anonymous** sign-in provider.
4.  **Set Up Firestore**: Go to **Build > Firestore Database** and create a database. Start in **production mode** and choose a location near your users.

### 2. Set Up Your Google Cloud Project for AI

Genkit uses the Google Gemini API for all generative AI features.

1.  **Enable the AI Platform API**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and select the same project that your Firebase project is linked to. Search for and enable the **"Vertex AI API"**.
2.  **Get Your API Key**:
    - Navigate to **APIs & Services > Credentials**.
    - Click **+ CREATE CREDENTIALS** and select **API key**.
    - A new API key will be generated. Copy this key. **Important:** For security, it's highly recommended to restrict this key to only allow calls to the Vertex AI API.

### 3. Configure Environment Variables

Create a file named `.env` in the root of the project directory. Copy the contents of the `.env.example` file (if present) or use the template below and fill in the values you obtained from the steps above.

```env
# Firebase Configuration
# Get these from your Firebase project settings > General > Your apps > Web app
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_WEB_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"

# Google Gemini API Key for Genkit
# Get this from your Google Cloud project credentials
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### 4. Install Dependencies

Open your terminal, navigate to the project's root directory, and run the following command to install all the necessary packages:

```bash
npm install
```
_or if you use yarn:_
```bash
yarn install
```

### 5. Run the Application

Once the installation is complete, start the development server:

```bash
npm run dev
```
_or if you use yarn:_
```bash
yarn dev
```

The application will now be running locally, typically at `http://localhost:9002`. You can open this URL in your browser to see the app in action.

---

This README provides a comprehensive guide to getting Agrigentic AI up and running on a local development machine.
