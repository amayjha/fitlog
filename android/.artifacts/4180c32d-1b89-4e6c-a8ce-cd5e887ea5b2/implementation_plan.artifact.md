# Implementation Plan - Delete Comments in Community Section

This plan adds the ability for users to delete their own comments in the community section.

## User Review Required

> [!NOTE]
> This implementation allows users to delete **only their own** comments. It does not (yet) allow post owners to delete comments on their posts, or users to delete their own posts.

## Proposed Changes

### [Component: Community Utils]

#### [MODIFY] [community.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/utils/community.js)
- Add `deleteComment(commentId, userId)` function to handle Supabase deletion.

### [Component: Community UI]

#### [MODIFY] [CommunityScreen.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/screens/CommunityScreen.jsx)
- Import `deleteComment` from `utils/community.js`.
- In `ItemDetail` component:
    - Add `handleDeleteComment(commentId)` with a confirmation dialog.
    - Update comment rendering to show a "Delete" button (trash icon or text) next to comments authored by the current `userId`.

## Verification Plan

### Automated Tests
- I'll verify the build doesn't break after the changes.

### Manual Verification
1. Sign in to a paid community account.
2. Navigate to a shared item (Template, Goal, or Food Plan).
3. Post a comment.
4. Verify that a "Delete" option appears for your comment.
5. Click "Delete" and confirm.
6. Verify the comment is removed from the list.
7. Verify that other users' comments do NOT show a "Delete" option.
