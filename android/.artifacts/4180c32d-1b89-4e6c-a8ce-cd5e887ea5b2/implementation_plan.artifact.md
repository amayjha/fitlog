# Implementation Plan - Resolve Version Code Upgrade Path

The error "doesn't allow any existing users to upgrade" usually means the new App Bundle has a `versionCode` lower than or equal to a version currently active in another track, or it has lower device support than a previous version.

To resolve this, we will perform a "Clean Break" by significantly increasing the version code.

## Proposed Changes

### [Component: Versioning]

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
- Increment `versionCode` to **300**.
- Increment `versionName` to **1.0.6**.
- This ensures the new bundle is considered "newer" than anything currently in any track (Production, Internal, Alpha, Beta).

#### [MODIFY] [android-build.yml](file:///C:/Users/amayj/ironlog/ironlog/new_app/.github/workflows/android-build.yml)
- Update the auto-increment logic to use `run_number + 300` to keep the cloud builds in sync with local development.

## Verification Plan

### Automated Tests
- Run `.\gradlew :app:bundleRelease` to ensure the versioning is applied correctly.

### Manual Verification
1. Build the new AAB (Version 300).
2. Upload to the Google Play Console.
3. The Play Console should now show that this version "covers" all existing users because the version code is strictly higher than previous releases.

> [!IMPORTANT]
> If you have multiple tracks (e.g., a bundle in "Internal Testing" that was never promoted), the Play Console will warn you if you try to put a *lower* version in Production. By jumping to 300, we override everything.
