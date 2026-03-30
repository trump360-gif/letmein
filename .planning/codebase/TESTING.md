# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runner:**
- `flutter_test` (SDK bundled) — Dart/Flutter's built-in test framework
- Config: No separate config file — uses Flutter's default test runner
- Version: Specified in `app/pubspec.yaml` under `dev_dependencies`

**Assertion Library:**
- Flutter's built-in `expect` + `find` (from `flutter_test`)

**Run Commands:**
```bash
flutter test                   # Run all tests
flutter test --watch           # Watch mode (not natively supported, use third-party)
flutter test --coverage        # Generate coverage report
flutter analyze                # Static analysis (linting)
```

## Test File Organization

**Location:**
- All tests live in `app/test/`
- Currently only one test file exists: `app/test/widget_test.dart`
- No co-located `_test.dart` files alongside source files

**Naming:**
- Pattern: `feature_name_test.dart` (following `widget_test.dart` convention)
- Files end in `_test.dart`

**Current test directory structure:**
```
app/test/
└── widget_test.dart    # Single smoke test for app startup
```

## Test Structure

**Suite Organization (observed pattern):**
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:letmein_app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('App starts', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: LetMeInApp()));
    expect(find.text('LetMeIn'), findsOneWidget);
  });
}
```

**Patterns:**
- Wrap widget tests in `ProviderScope` to satisfy Riverpod requirements
- Use `testWidgets` for widget tests
- `tester.pumpWidget(...)` to mount widgets
- `expect(find.text(...), findsOneWidget)` for text assertions

## Mocking

**Framework:** No mocking library installed (e.g., no `mockito`, `mocktail` in `pubspec.yaml`)

**Current state:** No mocks are written. The codebase has no mock implementations of repositories or providers.

**Recommended pattern (not yet implemented):**
For testing providers in isolation, the Riverpod pattern would be:
```dart
// Override a provider in tests using ProviderScope overrides
testWidgets('shows loading', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(MockAuthRepository()),
      ],
      child: const LetMeInApp(),
    ),
  );
});
```

**What to Mock (when mocks are added):**
- `AuthRepository` — for auth flow tests
- `HospitalRepository`, `AuctionRepository` — for feature screen tests
- `ApiClient` / `Dio` — for network layer tests

**What NOT to Mock:**
- `AppTheme`, `AppColors`, `AppSpacing` — pure static data, no need to mock
- `AppRoutes` — route constant strings, testable as-is

## Fixtures and Factories

**Test Data:** No factories or fixture files currently exist.

**Location:** None established yet. If added, should go in `app/test/fixtures/` or `app/test/helpers/`.

**Recommended pattern when needed:**
```dart
// app/test/helpers/test_factories.dart
UserModel testUser({String id = '1', String nickname = 'TestUser'}) {
  return UserModel(id: id, nickname: nickname, isNewUser: false);
}
```

## Coverage

**Requirements:** None enforced. No coverage thresholds configured.

**View Coverage:**
```bash
flutter test --coverage
# Output: coverage/lcov.info
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## Test Types

**Unit Tests:**
- Not present. Business logic in `StateNotifier` subclasses and repository methods is untested.
- Good candidates: `AuthNotifier._parseError`, `ConsultationStatus.fromString`, `CreateRequestState.isValid`

**Widget Tests:**
- One smoke test in `app/test/widget_test.dart`
- Tests that `LetMeInApp()` renders without crashing inside `ProviderScope`

**Integration Tests:**
- Not present. No `integration_test` package in `pubspec.yaml`.

**E2E Tests:**
- Not used. No Patrol, Maestro, or other E2E framework installed.

## Current Test Coverage Summary

The project has minimal test coverage. The single existing test:
- `app/test/widget_test.dart` — smoke test verifying app widget mounts

**Untested areas (entire surface):**
- All `StateNotifier` classes: `AuthNotifier`, `MyRequestsNotifier`, `CreateRequestNotifier`, `HospitalSearchNotifier`, `CommunityNotifier`, etc.
- All repository classes: `AuthRepository`, `HospitalRepository`, `AuctionRepository`, `ChatRepository`, etc.
- All `fromJson`/`toJson` serialization in manual model files
- Navigation/routing logic in `app/lib/core/router/app_router.dart`
- Auth redirect logic in `GoRouter.redirect`
- `compressImage` utility in `app/lib/shared/utils/image_utils.dart`
- Form validation: `CreateRequestState.isValid`

## Notes for Adding Tests

**Riverpod test setup:** Every widget test must wrap with `ProviderScope`:
```dart
await tester.pumpWidget(const ProviderScope(child: MyWidget()));
```

**Testing notifiers directly (unit test):**
```dart
test('load sets isLoading then items', () async {
  final container = ProviderContainer(
    overrides: [
      auctionRepositoryProvider.overrideWithValue(fakeRepo),
    ],
  );
  addTearDown(container.dispose);

  await container.read(myRequestsProvider.notifier).load();
  expect(container.read(myRequestsProvider).isLoading, false);
  expect(container.read(myRequestsProvider).items, isNotEmpty);
});
```

**Widget keys for test targeting:** Screens use `Key(...)` on critical widgets:
- `Key('hospital_search_field')` — hospital search TextField
- `Key('consultation_tab_bar')` — consultation tab bar
- `Key('consultation_tab_${tab.name}')` — individual tab items

---

*Testing analysis: 2026-03-30*
