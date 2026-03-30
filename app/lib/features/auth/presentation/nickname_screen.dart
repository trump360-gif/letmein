import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../data/auth_repository.dart';
import 'auth_provider.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';

/// Availability state for the nickname field.
enum _NicknameAvailability { idle, checking, available, unavailable, error }

class NicknameScreen extends ConsumerStatefulWidget {
  const NicknameScreen({super.key});

  @override
  ConsumerState<NicknameScreen> createState() => _NicknameScreenState();
}

class _NicknameScreenState extends ConsumerState<NicknameScreen> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  _NicknameAvailability _availability = _NicknameAvailability.idle;
  Timer? _debounceTimer;
  String? _fieldError;

  static final _validPattern = RegExp(r'^[a-zA-Z0-9가-힣]+$');

  @override
  void dispose() {
    _controller.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  // ──────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────

  String? _validate(String value) {
    if (value.isEmpty) return null;
    if (value.length < 2) return '닉네임은 2자 이상이어야 해요.';
    if (value.length > 10) return '닉네임은 10자 이하여야 해요.';
    if (!_validPattern.hasMatch(value)) return '특수문자는 사용할 수 없어요.';
    return null;
  }

  // ──────────────────────────────────────────────
  // Debounced availability check
  // ──────────────────────────────────────────────

  void _onTextChanged(String value) {
    _debounceTimer?.cancel();

    final validationError = _validate(value);
    setState(() {
      _fieldError = validationError;
      _availability = _NicknameAvailability.idle;
    });

    if (validationError != null || value.isEmpty) return;

    setState(() => _availability = _NicknameAvailability.checking);

    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _checkAvailability(value);
    });
  }

  Future<void> _checkAvailability(String nickname) async {
    try {
      final repo = ref.read(authRepositoryProvider);
      final available = await repo.checkNickname(nickname);
      if (!mounted) return;
      setState(() {
        _availability = available
            ? _NicknameAvailability.available
            : _NicknameAvailability.unavailable;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _availability = _NicknameAvailability.error);
    }
  }

  // ──────────────────────────────────────────────
  // Submit
  // ──────────────────────────────────────────────

  bool get _canSubmit =>
      _availability == _NicknameAvailability.available &&
      _fieldError == null &&
      _controller.text.isNotEmpty;

  Future<void> _onSubmit() async {
    if (!_canSubmit) return;
    await ref
        .read(authStateProvider.notifier)
        .updateNickname(_controller.text.trim());
    // Redirect to interest selection before entering the main flow.
    if (mounted) {
      context.go(AppRoutes.interests);
    }
  }

  // ──────────────────────────────────────────────
  // UI helpers
  // ──────────────────────────────────────────────

  Widget? _buildSuffixIcon() {
    switch (_availability) {
      case _NicknameAvailability.checking:
        return const Padding(
          padding: EdgeInsets.all(12),
          child: SizedBox(
            key: Key('nickname_checking_indicator'),
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        );
      case _NicknameAvailability.available:
        return const Icon(
          LucideIcons.checkCircle,
          key: Key('nickname_available_icon'),
          color: Colors.green,
        );
      case _NicknameAvailability.unavailable:
        return const Icon(
          LucideIcons.xCircle,
          key: Key('nickname_unavailable_icon'),
          color: Colors.red,
        );
      default:
        return null;
    }
  }

  String? _buildHelperText() {
    if (_fieldError != null) return _fieldError;
    switch (_availability) {
      case _NicknameAvailability.available:
        return '사용 가능한 닉네임이에요.';
      case _NicknameAvailability.unavailable:
        return '이미 사용 중인 닉네임이에요.';
      case _NicknameAvailability.error:
        return '확인 중 오류가 발생했어요.';
      default:
        return '2~10자, 특수문자 제외';
    }
  }

  Color? _buildHelperColor() {
    if (_fieldError != null) return Colors.red;
    switch (_availability) {
      case _NicknameAvailability.available:
        return Colors.green;
      case _NicknameAvailability.unavailable:
      case _NicknameAvailability.error:
        return Colors.red;
      default:
        return Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    // Listen for auth errors.
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
      appBar: AppBar(
        title: const Text('닉네임 설정'),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pageH,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.sectionGap),

              const Text(
                '어떻게 불러드릴까요?',
                key: Key('nickname_title'),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '커뮤니티에서 사용할 닉네임을 입력해주세요.',
                key: const Key('nickname_subtitle'),
                style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
              ),

              const SizedBox(height: 32),

              // ── Nickname text field ───────────────────
              Form(
                key: _formKey,
                child: TextField(
                  key: const Key('nickname_input'),
                  controller: _controller,
                  autofocus: true,
                  maxLength: 10,
                  textInputAction: TextInputAction.done,
                  onChanged: _onTextChanged,
                  onSubmitted: (_) => _onSubmit(),
                  decoration: InputDecoration(
                    hintText: '닉네임 입력',
                    suffixIcon: _buildSuffixIcon(),
                    helperText: _buildHelperText(),
                    helperStyle: TextStyle(color: _buildHelperColor()),
                    errorText: null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    counterText: '',
                  ),
                ),
              ),

              const Spacer(),

              // ── Submit button ─────────────────────────
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  key: const Key('nickname_submit_button'),
                  onPressed: (authState.isLoading || !_canSubmit)
                      ? null
                      : _onSubmit,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: authState.isLoading
                      ? const SizedBox(
                          key: Key('nickname_loading'),
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          '완료',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
