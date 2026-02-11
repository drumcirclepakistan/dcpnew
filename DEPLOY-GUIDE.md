# How to Deploy Drum Circle Pakistan App (Free)

This guide walks you through deploying your app on Render.com for free.
No coding needed — just clicking buttons and pasting values.

---

## What You Need

- An email address
- About 15-20 minutes
- Your Resend API key (the one you already have)

---

## Step 1: Create a GitHub Account (if you don't have one)

1. Go to **https://github.com**
2. Click **Sign up**
3. Follow the steps to create a free account
4. Verify your email

---

## Step 2: Upload Your Code to GitHub

1. On GitHub, click the **+** icon (top right) and choose **New repository**
2. Name it: `drum-circle-pakistan`
3. Keep it **Private**
4. Click **Create repository**
5. You will see a page with setup instructions — keep this page open

Now, back in Replit:

1. Open the **Shell** tab in Replit (bottom panel)
2. Run these commands one by one (copy and paste each line):

```
git remote add github https://github.com/YOUR_GITHUB_USERNAME/drum-circle-pakistan.git
```
(Replace YOUR_GITHUB_USERNAME with your actual GitHub username)

```
git push github main
```

3. It will ask for your GitHub username and password
   - For password, you need a **Personal Access Token** (GitHub no longer accepts passwords)
   - Go to: https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Give it a name like "replit"
   - Check the box next to **repo**
   - Click **Generate token**
   - Copy the token and paste it as your password

---

## Step 3: Create a Render Account

1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Sign up with your GitHub account (easiest option)
4. No credit card needed

---

## Step 4: Deploy Using the Blueprint

This is the easiest method — it sets up everything automatically.

1. In Render, click **New** (top right) then **Blueprint**
2. Connect your GitHub account if not already connected
3. Select your **drum-circle-pakistan** repository
4. Render will read the `render.yaml` file and show you what it will create:
   - A web service (your app)
   - A PostgreSQL database (your data storage)
5. You will be asked for one value:
   - **RESEND_API_KEY**: Paste your Resend API key here
6. Click **Apply**
7. Wait 5-10 minutes for it to build and deploy

---

## Step 5: Set Up Your Data

Once deployed, your app will be running but with an empty database.
The first time you visit it, the seed data will be created automatically
(admin account, default show types, etc.)

1. Your app URL will be something like: `https://drum-circle-pakistan.onrender.com`
2. Log in with:
   - Username: `founder`
   - Password: `drumcircle2024`
3. Go to Settings and set up your band members, show types, etc.

---

## Important Notes

**Free Tier Behavior:**
- Your app "sleeps" after 15 minutes of no visitors
- When someone visits, it takes about 30 seconds to "wake up"
- After waking up, it works at normal speed
- This is normal for all free hosting

**Your Data is Safe:**
- The database stays active as long as you use the app
- Render's free PostgreSQL is available for 90 days
- Before 90 days, you can upgrade to a paid database ($7/month) to keep your data permanently
- Or you can export and re-import your data to reset the 90-day timer

**Custom Domain (Optional):**
- In Render dashboard, go to your web service > Settings
- Under "Custom Domains", you can add your own domain name

---

## If Something Goes Wrong

- Check the **Logs** tab in your Render dashboard for error messages
- Make sure all environment variables are set (DATABASE_URL, SESSION_SECRET, RESEND_API_KEY)
- The DATABASE_URL is set automatically by Render when using the Blueprint

---

## Updating Your App

Whenever you make changes in Replit and want to update the live app:

1. Open the Shell in Replit
2. Run: `git push github main`
3. Render will automatically detect the change and redeploy (takes 3-5 minutes)
