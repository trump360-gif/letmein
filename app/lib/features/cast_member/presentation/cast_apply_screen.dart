// lib/features/cast_member/presentation/cast_apply_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../data/cast_member_repository.dart';

// ──────────────────────────────────────────────
// CastApplyScreen
// ──────────────────────────────────────────────

class CastApplyScreen extends ConsumerStatefulWidget {
  const CastApplyScreen({super.key});

  @override
  ConsumerState<CastApplyScreen> createState() => _CastApplyScreenState();
}

class _CastApplyScreenState extends ConsumerState<CastApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _displayNameController = TextEditingController();
  final _youtubeUrlController = TextEditingController();
  final _bioController = TextEditingController();

  bool _isSubmitting = false;
  bool _isDone = false;

  static const _bg = Color(0xFF0D0D0D);
  static const _card = Color(0xFF1A1A1A);
  static const _accent = Color(0xFFC62828);
  static const _border = Color(0xFF2C2C2C);

  @override
  void dispose() {
    _displayNameController.dispose();
    _youtubeUrlController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  String? _validateDisplayName(String? v) {
    if (v == null || v.trim().isEmpty) return '활동명을 입력해주세요.';
    if (v.trim().length < 2) return '2자 이상 입력해주세요.';
    return null;
  }

  String? _validateYoutubeUrl(String? v) {
    if (v == null || v.trim().isEmpty) return '유튜브 채널 URL을 입력해주세요.';
    final uri = Uri.tryParse(v.trim());
    if (uri == null || !uri.hasScheme) return '올바른 URL 형식이 아닙니다.';
    if (!v.contains('youtube.com') && !v.contains('youtu.be')) {
      return '유튜브 URL을 입력해주세요.';
    }
    return null;
  }

  String? _validateBio(String? v) {
    if (v == null || v.trim().isEmpty) return '자기소개를 입력해주세요.';
    if (v.trim().length < 10) return '10자 이상 입력해주세요.';
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final repo = ref.read(castMemberRepositoryProvider);
      await repo.applyForVerification(
        displayName: _displayNameController.text.trim(),
        youtubeUrl: _youtubeUrlController.text.trim(),
        bio: _bioController.text.trim(),
      );
      if (mounted) setState(() => _isDone = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('신청 중 오류가 발생했습니다. 다시 시도해주세요.'),
            backgroundColor: Color(0xFFC62828),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: const Key('cast_apply_scaffold'),
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
          tooltip: '뒤로',
        ),
        title: const Text(
          '출연자 인증 신청',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontFamily: 'Pretendard',
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: _isDone ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  // ── Success ────────────────────────────────

  Widget _buildSuccess() {
    return Center(
      key: const Key('cast_apply_success'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Color(0xFF1A1A1A),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.checkCircle,
                size: 36,
                color: Color(0xFFC62828),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              '신청이 완료되었습니다',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                fontFamily: 'Pretendard',
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '관리자 검토 후 승인됩니다.\n검토는 영업일 기준 3~5일 소요됩니다.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withValues(alpha: 0.55),
                height: 1.6,
                fontFamily: 'Pretendard',
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                key: const Key('cast_apply_success_close_btn'),
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  '확인',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Pretendard',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Form ──────────────────────────────────

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Notice card ─────────────────────
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    LucideIcons.info,
                    size: 16,
                    color: Color(0xFFC62828),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '성형 TV 출연자이거나 유튜브 채널을 운영 중인 경우 신청하실 수 있습니다. '
                      '심사 후 승인되면 출연자 배지가 부여됩니다.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.5,
                        fontFamily: 'Pretendard',
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ── displayName ─────────────────────
            _FieldLabel(label: '활동명', required: true),
            const SizedBox(height: 8),
            _DarkTextFormField(
              key: const Key('cast_apply_display_name_field'),
              controller: _displayNameController,
              hintText: '활동 시 사용하는 이름 (예: 홍길동)',
              validator: _validateDisplayName,
              textInputAction: TextInputAction.next,
            ),

            const SizedBox(height: 20),

            // ── YouTube URL ─────────────────────
            _FieldLabel(label: '유튜브 채널 URL', required: true),
            const SizedBox(height: 8),
            _DarkTextFormField(
              key: const Key('cast_apply_youtube_url_field'),
              controller: _youtubeUrlController,
              hintText: 'https://www.youtube.com/channel/...',
              validator: _validateYoutubeUrl,
              keyboardType: TextInputType.url,
              textInputAction: TextInputAction.next,
              prefixIcon: const Icon(
                LucideIcons.youtube,
                size: 18,
                color: Colors.red,
              ),
            ),

            const SizedBox(height: 20),

            // ── Bio ─────────────────────────────
            _FieldLabel(label: '자기소개', required: true),
            const SizedBox(height: 8),
            _DarkTextFormField(
              key: const Key('cast_apply_bio_field'),
              controller: _bioController,
              hintText:
                  '성형 관련 활동 경력, 채널 소개 등을 자유롭게 작성해주세요. (10자 이상)',
              validator: _validateBio,
              maxLines: 5,
              textInputAction: TextInputAction.done,
            ),

            const SizedBox(height: 36),

            // ── Submit ──────────────────────────
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                key: const Key('cast_apply_submit_btn'),
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: _accent.withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        key: Key('cast_apply_loading'),
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        '인증 신청',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Pretendard',
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _FieldLabel
// ──────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label, this.required = false});

  final String label;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.white,
            fontFamily: 'Pretendard',
          ),
        ),
        if (required) ...[
          const SizedBox(width: 4),
          const Text(
            '*',
            style: TextStyle(
              color: Color(0xFFC62828),
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _DarkTextFormField
// ──────────────────────────────────────────────

class _DarkTextFormField extends StatelessWidget {
  const _DarkTextFormField({
    super.key,
    required this.controller,
    required this.hintText,
    required this.validator,
    this.maxLines = 1,
    this.keyboardType,
    this.textInputAction,
    this.prefixIcon,
  });

  final TextEditingController controller;
  final String hintText;
  final String? Function(String?) validator;
  final int maxLines;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Widget? prefixIcon;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      maxLines: maxLines,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      style: const TextStyle(
        color: Colors.white,
        fontFamily: 'Pretendard',
        fontSize: 14,
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          color: Colors.white.withValues(alpha: 0.3),
          fontFamily: 'Pretendard',
          fontSize: 14,
        ),
        prefixIcon: prefixIcon,
        filled: true,
        fillColor: const Color(0xFF1A1A1A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2C2C2C)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2C2C2C)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFC62828), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1.5),
        ),
        errorStyle: const TextStyle(
          color: Colors.red,
          fontFamily: 'Pretendard',
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
