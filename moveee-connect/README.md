# Moveee Connect — Mobile App

React Native (Expo) app for Moveee Connect. Targets Android (`.apk`/`.aab`) and iOS (`.ipa`) from a single codebase.

## Stack

- **Expo** (managed workflow)
- **React Navigation** — bottom tabs + native stack
- **Zustand** — auth state
- **MMKV** — offline feed cache with TTL
- **expo-secure-store** — JWT storage
- **expo-notifications** — push (FCM)
- **react-native-iap** — Google Play Billing (Pro upgrade)

## Architecture

```
src/
  api/          # typed fetch client (WP REST direct)
  auth/         # Zustand auth store, SecureStore JWT
  features/     # hooks per domain (useFeed, useComments, …)
  components/   # shared UI (PostCard, TierBadge, TimeAgo)
  navigation/   # tab + stack navigators
  screens/      # one folder per tab (community, magazine, games, events, member)
  store/        # MMKV storage + cache helpers
  types/        # shared TypeScript types
```

## Primary feature: Connect (community feed)

- `ConnectFeedScreen` — unified feed (community posts, Pulse stories, magazine
  editorials, happenings/events, directory entries, quotes), paginated,
  pull-to-refresh, optimistic emoji reactions — mirrors the webapp's `/connect`
  unified feed (`getUnifiedFeed()` in `lib/unified-feed.ts`)
- `PostDetailScreen` — comments thread + inline comment composer
- `NewPostScreen` — 1000-char post composer, pending-state awareness
- `MemberProfileScreen` — view any member's public profile

## Getting started

```bash
npm install
npx expo start
```

Press `a` for Android emulator, `i` for iOS simulator.

## Building

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Android APK
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

Set `extra.eas.projectId` in `app.json` after running `eas init`.

## WP REST endpoints used

| Feature | Endpoint |
|---|---|
| Login | `POST /culture/v1/login` |
| Register | `POST /culture/v1/register` |
| Unified feed | `GET /culture/v1/feed` |
| Community feed | `GET /culture/v1/community/posts` |
| Submit post | `POST /culture/v1/community/submit` |
| Comments | `GET /culture/v1/community/comments` |
| Add comment | `POST /culture/v1/community/comment` |
| Like | `POST /culture/v1/community/react` |
| Report | `POST /culture/v1/community/report` |
| Profile | `GET /culture/v1/user/profile` |
| Push token | `POST /culture/v1/user/push-token` |
