# Walkthrough - Automated AAB Building with GitHub Actions

I have configured a GitHub Actions workflow that automatically builds a signed Android App Bundle (`.aab`) whenever you push changes to your `master` branch.

## Changes Made

### 1. CI/CD Workflow
- **[.github/workflows/android-build.yml](file:///C:/Users/amayj/ironlog/ironlog/new_app/.github/workflows/android-build.yml)**:
    - Updated to use **Node 22** and **Java 21** for compatibility with the latest Capacitor/Android standards.
    - Added automated `npm run build` and `npx cap sync android` steps to ensure the AAB always contains your latest web code.
    - Implemented auto-incrementing `versionCode` (using `run_number + 200`) to ensure every build is unique and Play Store-ready.
    - Integrated secure signing using GitHub Secrets.

## Setup Instructions

To make this build successful, you **must** add the following secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):

### 1. `KEYSTORE_BASE64`
Run this command in your local PowerShell to get the base64 string of your keystore:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('android/release-key.jks'))
```
Copy the long string output and paste it as the value for this secret.

### 2. `KEYSTORE_PASSWORD`
The password you chose for your `release-key.jks` file.

### 3. `KEY_ALIAS`
Use the value: `release-key`

### 4. `KEY_PASSWORD`
The password for the key alias (usually the same as the keystore password).

## How to Get Your Build
1. Push any code change to the `master` branch.
2. Go to your repository on GitHub and click the **Actions** tab.
3. Select the **Android Release Build** workflow.
4. Once finished, look at the **Artifacts** section at the bottom of the page to download your `.aab` file.
