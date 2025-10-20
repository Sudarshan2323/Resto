# RestoManager - Restaurant Order Management System

## Overview

RestoManager is a full-featured, real-time restaurant order management application inspired by Zomato’s modern UI. It provides role-based access for Admins and Captains, enabling seamless management of tables, orders (KOTs), billing, and payments. The application features a persistent data layer using `localStorage`, ensuring that all data is saved across browser sessions.

## Features

- **Role-Based Access**: Separate dashboards and permissions for Admin and Captain roles.
- **Real-Time Table Management**: Live view of table statuses (Available, Running, Billing) with color-coding.
- **Order Management (KOTs)**: Create, view, and manage Kitchen Order Tickets (KOTs) for each table. Admins can edit/remove items from a KOT.
- **Billing & Payment**: Generate bills, take payments via multiple modes (Cash, Card, UPI), and settle orders.
- **Captain Management**: Admins can add and remove Captain accounts with persistent credentials.
- **Sales Analytics**: A comprehensive dashboard for admins to view real-time sales data, top-selling items, and captain performance.
- **AI-Powered Suggestions**: Uses the Google Gemini API to suggest a "Dish of the Day" based on top-selling items.
- **Persistent Data**: All application data (tables, sales, users) is saved in `localStorage`, so no data is lost on refresh.
- **Cross-Tab Sync**: Changes made in one browser tab are automatically synced to other open tabs.
- **Modern UI/UX**: Zomato-inspired design with a dark mode toggle and toast notifications for user actions.

## Tech Stack

- **Frontend**: React.js, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **Charts & Visualization**: Recharts
- **Icons**: Lucide React
- **AI Integration**: Google Gemini API

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18.x or higher is recommended)
- A modern web browser (e.g., Chrome, Firefox, Edge)

The local web server will be run using `npx`, which is included with Node.js and npm.

## Installation and Setup

Follow these steps to get the application running locally.

### 1. Set Up Project Files

Create a new folder for the project on your machine and place all the provided source files (e.g., `index.html`, `App.tsx`, `components/`, `pages/`, etc.) inside it, maintaining the directory structure.

### 2. Configure Your Gemini API Key

The "Dish of the Day" feature in the Sales Analytics dashboard requires a Google Gemini API key.

**IMPORTANT**: The project is configured to read an environment variable (`process.env.API_KEY`) which works in specialized cloud environments but not directly in a browser. You will need to manually insert your key for local testing.

1.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open the following file in your code editor: `components/dashboard/SalesAnalytics.tsx`.
3.  Find this line of code (around line 100):
    ```typescript
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    ```
4.  Replace `process.env.API_KEY` with your actual API key as a string:
    ```typescript
    // Replace YOUR_API_KEY_HERE with your actual key
    const ai = new GoogleGenAI({ apiKey: 'YOUR_API_KEY_HERE' });
    ```
    > **Security Warning**: Do not commit this file with your hardcoded API key to a public repository like GitHub. This method is for local development and testing only.

### 3. Run the Local Server

The project is set up to run as a static site with modern JavaScript modules. The easiest way to run it is with a simple, local HTTP server.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of your project folder (the one containing `index.html`).
3.  Run the following command:
    ```bash
    npx serve
    ```
4.  The terminal will output a local address, typically `http://localhost:3000`. Open this URL in your web browser.

The application should now be running!

## How to Use

### Login Credentials

You can log in with the following default accounts:

-   **Admin**:
    -   **Email**: `admin@resto.com`
    -   **Password**: `12345`

-   **Captain**:
    -   **Email**: `sub@resto.com`
    -   **Password**: `23456`

Admins can create additional Captain accounts from the "Manage Captains" page in their dashboard. All user data is saved in `localStorage`, so new accounts will persist.
