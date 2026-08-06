# Implementation Plan - Health Connect "Insufficient Information" Resolution

Google is requesting a rationale for **StepsCadence/Steps**. This error usually occurs for one of two reasons:
1. The **Health Apps declaration form** in the Play Console still has "Steps" checked, even though we removed it from the code.
2. You have decided to keep the Steps feature and need a strong justification to pass Google's "Minimum Scope" review.

## User Review Required

> [!IMPORTANT]
> **Keep or Remove?**: In our previous step, we removed the Steps code to comply with Google's "Minimum Scope" policy. If you want to **keep** steps, I need to revert those changes. If you want to **remove** them, you must uncheck the "Steps" box in the Play Console.

## Proposed Actions

### Option A: Complete Removal (Recommended)
If you do **not** need steps:
1. **Uncheck "Steps"** in the Google Play Console under *App content > Health apps*.
2. **Increase the Version Code**: We will update your `versionCode` to **133** to ensure Google sees this as a fresh, clean submission.

### Option B: Keep Steps with Justification
If you **do** want to keep steps:
1. **Revert Code Changes**: I will restore the step-counting logic to the UI and Manifest.
2. **Provide Rationale**: You must use the following text in the Play Console:
    > "Ironlog provides a holistic view of the user's physical readiness and recovery. Daily step count is used as a primary metric for Non-Exercise Activity Thermogenesis (NEAT), which is essential for strength training athletes to monitor their total daily energy expenditure and recovery status. Displaying daily steps alongside lifting volume helps users understand their energy balance and optimize their muscle recovery and growth."

## Proposed Code Changes (For Option A - Versioning)

#### [MODIFY] [build.gradle](file:///C:/Users/amayj/ironlog/ironlog/new_app/android/app/build.gradle)
- Update `versionCode` to `133`.
- Update `versionName` to `1.0.2`.

## Verification Plan
- Run `.\gradlew :app:bundleRelease` to generate a new AAB with the updated version code.
