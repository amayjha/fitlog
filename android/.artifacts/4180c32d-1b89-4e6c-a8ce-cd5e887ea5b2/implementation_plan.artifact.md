# Implementation Plan - Resolve Health Connect Excessive Data Access

Google has rejected the app because it requests Health Connect permissions that are not deemed "essential" for the app's current feature set. Specifically, Google flagged **Distance, Heart Rate, Sleep, and Steps**.

To resolve this, we will follow the "Minimum Scope" principle by removing these permissions from the Android manifest and updating the application code to stop requesting or using this data.

## User Review Required

> [!WARNING]
> **Functional Changes**: Removing these permissions means the app will no longer display **Steps** or **Distance** in the "More" screen summary or workout logs. This is necessary to comply with Google's policy and get the app approved.

## Proposed Changes

### Android Manifest

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/src/main/AndroidManifest.xml)
- Use `tools:node="remove"` to explicitly exclude the flagged permissions (Steps, Distance, Heart Rate, Sleep).
- We will also exclude all other unused health permissions that the `@capgo/capacitor-health` library adds to the manifest by default (e.g., Blood Pressure, Oxygen Saturation, etc.) to ensure we strictly follow the "Minimum Scope" policy.
- We will only keep: `READ_ACTIVE_CALORIES_BURNED`, `READ_TOTAL_CALORIES_BURNED`, `READ_WEIGHT`, `WRITE_WEIGHT`, and `READ_EXERCISE`.

### JavaScript Code

#### [MODIFY] [utils/health.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/utils/health.js)
- Remove `steps` from `requestHealthPermissions`.
- Remove `steps` query and display logic from `getDayActivity`.
- Remove `distanceKm` (totalDistance) extraction from `getRecentWorkouts`.

#### [MODIFY] [MoreScreen.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/screens/MoreScreen.jsx)
- Update `checkHealthStatus` and `handleHealthConnect` to remove `steps` and `heartRate` from the read/write requests.
- Update UI to remove Step-related displays if applicable.

## Verification Plan

### Automated Tests
- Build the app using `.\gradlew :app:assembleRelease` to ensure the manifest merger succeeds.
- Inspect the final merged manifest (if possible) to confirm the permissions are gone.

### Manual Verification
- Deploy to a device.
- Open the "More" screen and click "Connect" to Health Connect.
- Verify that the consent screen ONLY asks for Weight, Calories, and Workouts.
- Verify that the app doesn't crash when attempting to fetch data (since we've updated the code).
