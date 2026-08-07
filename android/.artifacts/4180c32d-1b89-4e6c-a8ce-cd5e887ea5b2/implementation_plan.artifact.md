# Implementation Plan - Upgrade GitHub Actions to Resolve Node.js 20 Deprecation

The current GitHub Actions workflow uses versions of standard actions (`checkout`, `setup-node`, `setup-java`, `upload-artifact`) that target Node.js 20, which is being deprecated on GitHub Runners. This plan upgrades these actions to their latest major versions (as of August 2026) to ensure they run on the modern Node.js 24/26 runtimes and eliminate deprecation warnings.

## User Review Required

> [!NOTE]
> This change only affects the **CI/CD build process** on GitHub. It does not change how your app runs on Android devices or local development.

## Proposed Changes

### [Component: CI/CD Workflow]

#### [MODIFY] [android-build.yml](file:///C:/Users/amayj/ironlog/ironlog/new_app/.github/workflows/android-build.yml)
- Upgrade `actions/checkout@v4` to **`@v7`**.
- Upgrade `actions/setup-node@v4` to **`@v7`**.
- Upgrade `actions/setup-java@v4` to **`@v5`**.
- Upgrade `actions/upload-artifact@v4` to **`@v7`**.
- (Optional) Update `node-version` from `22` to **`26`** to use the latest LTS/Stable Node version in the build environment.

## Verification Plan

### Automated Tests
- Once pushed to the `master` branch, the workflow will trigger automatically.
- I will check the GitHub Actions logs (if the user provides access or feedback) to confirm the Node.js 20 deprecation warnings are gone.

### Manual Verification
- Verify that the build still completes successfully and produces a valid `.aab` artifact.
