# Deploying to Google Play Store

This plan outlines the steps required to prepare and build your app for release on the Google Play Store. Since this is a Capacitor-based Android project, we will follow standard Android release procedures.

## User Review Required

> [!IMPORTANT]
> **Google Play Developer Account**: You must have a registered Google Play Developer account (which has a one-time $25 fee) to upload and publish apps.
> **Keystore Security**: The keystore file (`.jks`) and its passwords are critical. If you lose them, you will NOT be able to update your app in the future. We will store passwords in a `keystore.properties` file which should be kept out of version control.

## Open Questions

1. Do you already have a release keystore, or should we generate a new one?
2. What is the intended `versionCode` and `versionName` for this first release? (Defaulting to `1` and `1.0` if not specified).

## Proposed Changes

### Build Configuration

#### [NEW] [keystore.properties](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/keystore.properties)
Create a properties file to store sensitive signing information.

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
Update to load `keystore.properties` and configure the `release` build type with signing.

#### [MODIFY] [.gitignore](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/.gitignore)
Ensure `keystore.properties` and `*.jks` are ignored to prevent accidental leaks.

## Verification Plan

### Automated Tests
- Run `./gradlew :app:assembleRelease` to verify the release build compiles.
- Run `./gradlew :app:bundleRelease` to generate the Android App Bundle (`.aab`).

### Manual Verification
- Inspect the generated `.aab` file in `app/build/outputs/bundle/release/`.
- The user will need to manually upload this file to the [Google Play Console](https://play.google.com/console/).
