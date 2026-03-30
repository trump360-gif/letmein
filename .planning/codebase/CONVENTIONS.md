# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- Screens: `snake_case_screen.dart` — e.g., `hospital_list_screen.dart`, `chat_room_screen.dart`
- Providers: `snake_case_provider.dart` — e.g., `hospital_provider.dart`, `auth_provider.dart`
- Repositories: `snake_case_repository.dart` — e.g., `auth_repository.dart`
- Models: `snake_case_models.dart` — e.g., `auction_models.dart`, `chat_models.dart`
- Widgets: `snake_case_widget.dart` or `snake_case_card.dart` — e.g., `community_card.dart`
- Generated files: `snake_case_models.freezed.dart`, `snake_case_models.g.dart`

**Classes:**
- Screens: `PascalCaseScreen` — e.g., `HospitalListScreen`, `ChatRoomScreen`
- State classes: `PascalCaseState` — e.g., `AuthState`, `HospitalSearchState`, `MyRequestsState`
- Notifiers: `PascalCaseNotifier` — e.g., `AuthNotifier`, `MyRequestsNotifier`
- Repositories: `PascalCaseRepository` — e.g., `AuthRepository`, `HospitalRepository`
- Models: `PascalCaseModel` (domain models sometimes drop "Model") — e.g., `UserModel`, `HospitalListItem`, `ConsultationRequest`
- Theme/config classes: `AppColors`, `AppSpacing`, `AppTheme`, `AppRoutes`

**Variables and fields:**
- camelCase for all variables, fields, and parameters
- Private fields: `_camelCase` — e.g., `_dio`, `_repository`, `_scrollController`
- Sentinel constant: `const Object _sentinel = Object()` used for nullable `copyWith` params

**Providers:**
- `camelCaseProvider` — e.g., `authStateProvider`, `hospitalSearchProvider`, `categoryProvider`
- Family providers: `camelCaseProvider.family<ReturnType, ParamType>`
- AutoDispose providers: `camelCaseProvider.autoDispose` for form/create screens

**Enums:**
- PascalCase enum name, camelCase values
- Enums carry display string + API value via constructor:
  ```dart
  enum ConsultationStatus {
    pending('pending', '진행중'),
    completed('completed', '완료');
    const ConsultationStatus(this.value, this.label);
    final String value;
    final String label;
  }
  ```
- Always include a `static fromString(String value)` fallback factory

**Route constants:**
- Defined in `AppRoutes` class in `app/lib/core/router/app_router.dart` as `static const String`
- Kebab-case path strings: `'/cast-members/apply'`, `'/mypage/notifications'`

## Code Style

**Formatting:**
- Dart default formatter (`dart format`)
- No custom `.prettierrc` equivalent — uses `analysis_options.yaml` with `package:flutter_lints/flutter.yaml`

**Linting:**
- `flutter_lints` package (included via `analysis_options.yaml`)
- `avoid_print` rule present but selectively suppressed with `// ignore: avoid_print` in provider error handlers
- Inline suppression used sparingly: `// ignore: name_of_lint`

**Line style:**
- Section dividers use `// ──────────────────────────────────────────────` (em-dash lines)
- Double-line section headers use `// ══════════════════════════════════════════════`
- Inline comments use `// ── Description ────────────────────────────` for subsection headers

## Import Organization

**Order (observed pattern):**
1. Dart SDK: `dart:io`, `dart:typed_data`, `dart:ui`
2. Flutter framework: `package:flutter/material.dart`
3. Third-party packages: `package:flutter_riverpod/flutter_riverpod.dart`, `package:dio/dio.dart`, `package:go_router/go_router.dart`
4. Internal core: `'../../../core/router/app_router.dart'`, `'../../../core/theme/app_theme.dart'`
5. Feature-local: `'../data/hospital_models.dart'`, `'hospital_provider.dart'`
6. Shared: `'../../../shared/widgets/cached_image.dart'`

**Path style:** Relative paths only — no `package:letmein_app/...` alias imports used

**Legacy provider import:**
```dart
import 'package:flutter_riverpod/legacy.dart'
    show StateNotifier, StateNotifierProvider;
```
This explicit import is required in every file using `StateNotifier`.

## State Management

**Pattern:** Riverpod `StateNotifier` (legacy API) for mutable state + `FutureProvider`/`FutureProvider.family` for read-only async data.

**State class design:**
- All state classes are plain Dart classes with `const` constructor
- `copyWith` method required on every state class
- Nullable fields that can be explicitly cleared use the `_sentinel` pattern:
  ```dart
  const Object _sentinel = Object();

  MyState copyWith({
    Object? errorMessage = _sentinel,
  }) {
    return MyState(
      errorMessage: errorMessage == _sentinel
          ? this.errorMessage
          : errorMessage as String?,
    );
  }
  ```
- Loading states use `isLoading` + `isLoadingMore` boolean fields for pagination

**Provider co-location:** Each feature's provider is defined in `presentation/feature_provider.dart` alongside the screen files.

**Provider registration:** Repository providers are defined at the top of each repository file:
```dart
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRepository(apiClient.dio);
});
```

**AutoDispose:** Used for create/form screens via `StateNotifierProvider.autoDispose`

## Data Serialization

**Two approaches used:**

1. **Freezed + json_serializable** (auth domain only):
   - `@freezed` annotation with `part` directives for `.freezed.dart` and `.g.dart`
   - Used in `app/lib/features/auth/data/auth_models.dart`
   - Generated with `build_runner`

2. **Manual fromJson/toJson** (all other features):
   - Hand-written `factory ClassName.fromJson(Map<String, dynamic> json)` and `Map<String, dynamic> toJson()`
   - Comment at top of file: `// Manual fromJson/toJson — no build_runner required.`
   - Null-safe casting with explicit fallbacks: `(json['id'] as num).toInt()`, `json['name'] as String? ?? ''`
   - List parsing uses explicit `(json['field'] as List<dynamic>? ?? []).map(...)` pattern

**API response unwrapping:** All API responses unwrap a `data` key:
```dart
final data = response.data['data'] as Map<String, dynamic>;
return Model.fromJson(data);
```

## Widget Conventions

**Screen widget type:**
- Stateless screens using only Riverpod: `ConsumerWidget`
- Screens with local state (scroll, animation, tabs): `ConsumerStatefulWidget` + `ConsumerState<T>`
- Pure UI widgets (no provider access): `StatelessWidget`

**Screen structure:**
```dart
class MyScreen extends ConsumerStatefulWidget {
  const MyScreen({super.key});

  @override
  ConsumerState<MyScreen> createState() => _MyScreenState();
}

class _MyScreenState extends ConsumerState<MyScreen> {
  // Controllers declared as fields
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Setup listeners
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(someProvider);
    final theme = Theme.of(context);
    // ...
  }
}
```

**Spacing constants:** Always use `AppSpacing` constants from `app/lib/core/theme/app_theme.dart`:
- `AppSpacing.pagePadding` (24) for screen horizontal padding
- `AppSpacing.pageH` (`EdgeInsets.symmetric(horizontal: 24)`)
- `AppSpacing.sectionGap` (32) for vertical section gaps
- `AppSpacing.itemGap` (12) for list item spacing
- `AppSpacing.xs/sm/md/lg/xl/xxl` (4/8/16/24/32/48)

**Color usage:** Use `AppColors` constants or `Theme.of(context).colorScheme` — never hardcode hex in widgets.

**Semantic keys:** Widgets that need test targeting use `Key('descriptive_key_name')`:
```dart
TextField(key: const Key('hospital_search_field'), ...)
TabBar(key: const Key('consultation_tab_bar'), ...)
```

**Bottom-up accessibility:** `Semantics` widget used on interactive elements in nav bar:
```dart
Semantics(button: true, selected: isSelected, label: label, child: ...)
```

## Repository Pattern

**Constructor:** Takes `Dio _dio` as only dependency — no service locator, pure DI via Riverpod.

**Method documentation:** Each API method has a short comment with HTTP method + path:
```dart
/// POST /api/v1/auth/kakao
Future<AuthResponse> kakaoLogin(String kakaoAccessToken) async { ... }
```

**Error handling in repositories:** Errors propagate up to notifiers — repositories do not catch errors except for non-critical "fire and forget" calls:
```dart
try {
  await _dio.post('/auth/interests', data: ...);
} catch (_) {
  // 관심 시술은 부가 기능이므로 에러 전파 생략
}
```

## Error Handling

**In Notifiers:**
- Wrap all async operations in `try/catch`
- On error: `state = state.copyWith(isLoading: false, errorMessage: _parseError(e))`
- Error messages are Korean user-facing strings
- Private `_parseError(Object e)` helper method for consistent error formatting
- Errors swallowed in non-critical paths with inline comment explaining why

**In screens:**
- Error state displayed inline in UI via `state.errorMessage != null`
- `clearError()` method pattern on notifiers, called before new attempts

**Silenced errors:**
- `// ignore: avoid_print` used in `auth_provider.dart` for dev login error logging
- Pattern: `catch (e, st) { print('ERROR: $e'); print('STACK: $st'); ... }`

## Comments

**Language:** Mix of Korean and English
- Korean comments for business logic explanations, UI copy guidance, and domain context
- English comments for technical documentation (method signatures, patterns)

**When to comment:**
- Non-obvious business rules always get a comment
- DEV-only workarounds marked: `// DEV: use dev-login instead of Kakao OAuth`
- TODOs marked with `// TODO: description`
- Section separators for visual grouping in large files

**Exported types:** Re-exported from providers for convenience:
```dart
export '../data/auth_models.dart' show UserExtra;
```

---

*Convention analysis: 2026-03-30*
