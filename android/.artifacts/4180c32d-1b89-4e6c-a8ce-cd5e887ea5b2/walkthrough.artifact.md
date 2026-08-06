# Walkthrough - Delete Comments in Community Section

I have implemented the ability for users to delete their own comments within the community section of the app.

## Changes Made

### 1. Backend Utility
- **[utils/community.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/utils/community.js)**:
    - Added a `deleteComment` function that interacts with the Supabase `comments` table. It ensures that a comment can only be deleted if the `user_id` matches the current user.

### 2. Community UI
- **[CommunityScreen.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/screens/CommunityScreen.jsx)**:
    - Integrated the `deleteComment` utility.
    - Added a `handleDeleteComment` function to the `ItemDetail` view, which includes a confirmation prompt before deletion.
    - Updated the comment list to display a bin icon (🗑️) next to comments authored by the signed-in user.

## Verification

### Automated Tests
- Verified the Android build succeeds with `gradle_build :app:assembleDebug`.

### Manual Steps
1. Navigate to the **Community** section.
2. Open any shared template, food plan, or goal.
3. Post a comment.
4. You should now see a **Delete** button next to your comment.
5. Clicking **Delete** will prompt for confirmation and then remove the comment from the view and the database.
6. Verify that you cannot see the "Delete" button on comments posted by other users.
