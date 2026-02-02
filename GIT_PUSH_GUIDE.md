# Secure Git Push Guide

Follow these commands to push your code to GitHub securely. The `.gitignore` files have been set up to prevent sensitive data (like your `.env` file) from being uploaded.

## 1. Initialize Git
If you haven't initialized the repository yet:
```bash
git init
```

## 2. Check Ignored Files
Run this to make sure your `.env` file is NOT listed:
```bash
git status
```

## 3. Add and Commit
```bash
git add .
git commit -m "feat: integrate environment-based OTP fetching and secure configuration"
```

## 4. Push to GitHub
Replace `<YOUR_GITHUB_REPO_URL>` with your actual repository URL:
```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

> [!IMPORTANT]
> Never share your `.env` file. If you need to deploy, look at the `.env.example` file and configure the environment variables on your hosting provider (e.g., Railway, Heroku, AWS).
