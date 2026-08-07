# Implementation Plan - Complete Removal of Health Connect

This plan will completely remove all Health Connect permissions and user-facing features to satisfy Google Play's strict health data policies and ensure app approval.

## User Review Required

> [!WARNING]
> **Feature Loss**: This action will permanently disable the ability for users to sync weight, calories, or workouts from external health apps until the feature is re-implemented and approved by Google in a future update.

## Proposed Changes

### Android Manifest

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/src/main/AndroidManifest.xml)
- Explicitly remove EVERY health-related permission using `tools:node="remove"`.
- This ensures that even the permissions bundled with the `@capgo/capacitor-health` library are completely stripped from the final App Bundle.

### JavaScript Code & UI

#### [MODIFY] [utils/health.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/utils/health.js)
- Force `isHealthAvailable` to always return `false`.
- Stub other functions to ensure no accidental calls to the native plugin.

#### [MODIFY] [HomeScreen.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/screens/HomeScreen.jsx)
- Remove the "Health activity strip" (Calories display) from the home screen UI.

#### [MODIFY] [MoreScreen.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/screens/MoreScreen.jsx)
- Remove the entire "Google Health Connect" settings section.

### Build Configuration

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
- Increment `versionCode` to **135**.
- Increment `versionName` to **1.0.4**.

## Verification Plan

### Automated Tests
- Run `.\gradlew :app:assembleRelease`.
- Inspect the merged manifest to confirm zero `android.permission.health` entries exist.

### Manual Verification
- Deploy to a device.
- Confirm that no Health Connect prompts or settings are visible in the app.
- Resubmit Version 135 to the Play Console.
