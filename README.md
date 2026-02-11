# Drum Circle Suite

This project is configured to be deployed to platforms like **Render** or **GitHub**.

## Deploying to Render

Render is a cloud provider that can host this application for free.

1.  **Push to GitHub**: Make sure your code is pushed to a GitHub repository.
2.  **Create a Web Service on Render**:
    *   Go to [dashboard.render.com](https://dashboard.render.com).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure**:
    *   Render should automatically detect the `render.yaml` file in this repository and configure everything for you.
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run start`
4.  **Database**:
    *   The application requires a **PostgreSQL** database.
    *   On Render, you can create a free PostgreSQL database.
    *   Render should automatically provision it if you use the `render.yaml` blueprint.
    *   Otherwise, ensure `DATABASE_URL` environment variable is set.

## Environment Variables

The following environment variables are required or optional:

*   `DATABASE_URL`: Connection string for PostgreSQL (Required).
*   `SESSION_SECRET`: Secret key for sessions (Optional, defaults to a secure value if not set, but recommended).
*   `RESEND_API_KEY`: API key for Resend to send emails (Optional, email features will be disabled if missing).
*   `FROM_EMAIL`: Email address to send from (Optional, defaults to `onboarding@resend.dev`).
*   `ADMIN_RECOVERY_KEY`: Key to reset admin password in emergency (Optional).

## Running Locally

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    npm run dev
    ```

## Features

*   **Shows Management**: Create and track shows.
*   **Invoices**: Generate invoices (PDF).
*   **Band Members**: Manage band members and payouts.
*   **Email Notifications**: Send assignments to members (requires Resend).
