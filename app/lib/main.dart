import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

// ── 테마 프리셋 프로바이더 ──────────────────────
class ThemePresetNotifier extends Notifier<ThemePreset> {
  @override
  ThemePreset build() => ThemePreset.dark;

  void set(ThemePreset preset) => state = preset;
}

final themePresetProvider =
    NotifierProvider<ThemePresetNotifier, ThemePreset>(ThemePresetNotifier.new);

void main() {
  runApp(const ProviderScope(child: LetMeInApp()));
}

class LetMeInApp extends ConsumerWidget {
  const LetMeInApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final preset = ref.watch(themePresetProvider);
    final themeData = AppTheme.fromPreset(preset);
    final isDark = preset == ThemePreset.dark;

    return MaterialApp.router(
      title: 'Black Label',
      theme: themeData,
      darkTheme: AppTheme.dark,
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 430),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: ClipRect(child: child),
          ),
        );
      },
    );
  }
}
