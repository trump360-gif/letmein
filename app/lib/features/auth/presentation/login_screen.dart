import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final colorScheme = Theme.of(context).colorScheme;

    // Show any error as a snackbar.
    ref.listen<AuthState>(authStateProvider, (_, next) {
      if (next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
        ref.read(authStateProvider.notifier).clearError();
      }
    });

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colorScheme.primary.withValues(alpha: 0.15),
              colorScheme.surface,
            ],
            stops: const [0.0, 0.55],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: AppSpacing.pageH,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(flex: 2),

                // ── App Logo ───────────────────────────────
                Container(
                  width: 104,
                  height: 104,
                  decoration: BoxDecoration(
                    color: colorScheme.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: colorScheme.primary.withValues(alpha: 0.30),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    LucideIcons.sparkles,
                    size: 52,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 28),

                // ── Branding ──────────────────────────────
                const Text(
                  'LetMeIn',
                  key: Key('login_title'),
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '성형 정보·커뮤니티 플랫폼',
                  key: const Key('login_subtitle'),
                  style: TextStyle(fontSize: 16, color: colorScheme.onSurface.withValues(alpha: 0.5)),
                ),

                const Spacer(flex: 3),

                // ── 간편 로그인 label ──────────────────────
                Text(
                  '간편 로그인',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.onSurface.withValues(alpha: 0.4),
                    letterSpacing: 0.5,
                  ),
                ),

                const SizedBox(height: 12),

                // ── Kakao Login Button ────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    key: const Key('kakao_login_button'),
                    onPressed: authState.isLoading
                        ? null
                        : () => _onKakaoLogin(context, ref),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFEE500),
                      foregroundColor: Colors.black87,
                      disabledBackgroundColor:
                          const Color(0xFFFEE500).withAlpha(153),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: authState.isLoading
                        ? const SizedBox(
                            key: Key('login_loading'),
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.black54,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.messageCircle, size: 20),
                              SizedBox(width: 8),
                              Text(
                                '카카오로 시작하기',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 24),

                // ── Terms notice ──────────────────────────
                Text(
                  '로그인 시 이용약관에 동의합니다',
                  key: const Key('login_terms_notice'),
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurface.withValues(alpha: 0.3),
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _onKakaoLogin(BuildContext context, WidgetRef ref) async {
    const mockKakaoToken = 'mock_kakao_access_token_for_mvp';

    await ref.read(authStateProvider.notifier).loginWithKakao(mockKakaoToken);

    if (!context.mounted) return;
    final authState = ref.read(authStateProvider);
    if (authState.status == AuthStatus.newUser) {
      context.go('/agreement');
    } else if (authState.status == AuthStatus.authenticated) {
      context.go('/');
    }
  }
}
