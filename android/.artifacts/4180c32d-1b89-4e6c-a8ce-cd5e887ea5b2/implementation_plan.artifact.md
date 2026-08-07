# Implementation Plan - Version Code Reset (v1000)

The persistent "You can't rollout this release" error indicates that Version 300 is still causing a conflict with an active version or draft in your Play Console. To ensure a completely clean upgrade path, we will jump to a much higher version number.

## User Review Required

### Play Console Cleanup (MANDATORY)
Before uploading the new bundle, please perform these steps in the Google Play Console:
1.  **Discard Drafts**: Go to **Testing** > **Internal testing** (and other tracks). If you see a "Draft" or "In progress" release, click **Manage track** and then **Discard release**.
2.  **App Bundle Explorer**: Check your **App Bundle Explorer** and sort by Version code. If you see any version higher than 300, let me know.
3.  **One Bundle per Release**: When creating your new release, ensure you **remove** any old bundles from the "App bundles to include" list. Only the new Version 1000 should be present.

## Proposed Changes

### [Component: Versioning]

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
- Increment `versionCode` to **1000**.
- Increment `versionName` to **1.1.0**.

#### [MODIFY] [android-build.yml](file:///C:/Users/amayj/ironlog/ironlog/new_app/.github/workflows/android-build.yml)
- Update auto-increment logic to use `run_number + 1000`.

## Verification Plan

### Automated Tests
- Run `.\gradlew :app:bundleRelease` to verify the build.
- The resulting `.aab` will have version 1000.

### Manual Verification
- Upload Version 1000 to the Play Console. By jumping to 1000, we effectively "outrank" any previous tests or accidental uploads, clearing the upgrade path for all users.
