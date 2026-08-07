# Implementation Plan - Automate AAB Build with GitHub Actions

This plan sets up a reliable GitHub Actions workflow to build your Android App Bundle (`.aab`) automatically whenever you push to the `master` branch.

## User Review Required

> [!IMPORTANT]
> **GitHub Secrets**: For this to work, you MUST add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):
> 1. `KEYSTORE_BASE64`: Run `[Convert]::ToBase64String([IO.File]::ReadAllBytes('android/release-key.jks'))` in PowerShell and paste the output.
> 2. `KEYSTORE_PASSWORD`: Your keystore password.
> 3. `KEY_ALIAS`: Use `release-key`.
> 4. `KEY_PASSWORD`: Your key password.

## Proposed Changes

### [Component: CI/CD Workflow]

#### [MODIFY] [android-build.yml](file:///C:/Users/amayj/ironlog/ironlog/new_app/.github/workflows/android-build.yml)
- Update the workflow to handle the current project structure and versioning correctly.
- Ensure it runs `npm run build` and `npx cap sync android`.
- Use GitHub's `run_number` to automatically increment the `versionCode` so every build is unique and uploadable.
- Remove the manual `npm uninstall @capgo/capacitor-health` step, as we now handle this via the manifest merger.

## Verification Plan

### Automated Tests
- Once pushed, you can view the progress in the **Actions** tab of your GitHub repository.
- A successful run will produce a downloadable `.aab` file as an artifact.

### Manual Verification
- Download the resulting artifact from GitHub Actions and verify it can be uploaded to the Play Console.
