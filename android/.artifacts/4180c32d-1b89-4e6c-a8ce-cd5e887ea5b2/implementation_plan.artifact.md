# Implementation Plan - Fix Health Connect Permissions Merging

Google is still reporting many unused Health Connect permissions. This is likely because the previous `AndroidManifest.xml` cleanup was incomplete and contained a conflict (trying to both keep and remove `READ_TOTAL_CALORIES_BURNED`).

This plan will exhaustively remove all flagged permissions and ensure the manifest merger correctly outputs only the 5 required permissions.

## User Review Required

> [!IMPORTANT]
> **Fresh Submission**: After I apply these changes, you MUST build a new App Bundle and upload it to the Play Store. Google will not see the changes until a new version is uploaded. I will increment the `versionCode` again to ensure it's a fresh submission.

## Proposed Changes

### Android Manifest

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/src/main/AndroidManifest.xml)
- Completely rewrite the Health Connect permissions section.
- Explicitly list the 5 permissions we WANT to keep:
    - `READ_ACTIVE_CALORIES_BURNED`
    - `READ_TOTAL_CALORIES_BURNED`
    - `READ_WEIGHT`
    - `WRITE_WEIGHT`
    - `READ_EXERCISE`
- Explicitly list ALL other permissions from the `@capgo/capacitor-health` library with `tools:node="remove"`. This includes the ones specifically flagged by Google:
    - `READ_STEPS`, `WRITE_STEPS`
    - `READ_DISTANCE`, `WRITE_DISTANCE`
    - `WRITE_ACTIVE_CALORIES_BURNED`
    - `READ_HEART_RATE`, `WRITE_HEART_RATE`
    - `READ_SLEEP`, `WRITE_SLEEP`
    - `WRITE_TOTAL_CALORIES_BURNED`
    - Plus all others (Respiratory rate, etc.) to be safe.

### Build Configuration

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
- Increment `versionCode` to **134**.
- Increment `versionName` to **1.0.3**.

## Verification Plan

### Automated Tests
- Run `.\gradlew :app:assembleRelease` to verify the build.
- I will attempt to run a command to inspect the **Merged Manifest** to confirm that the unwanted permissions are indeed gone from the final build.

### Manual Verification
- You will need to upload the generated `.aab` (Version 134) to the Play Console and verify that the "App Content" section no longer flags these permissions.
