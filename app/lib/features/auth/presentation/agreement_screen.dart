import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';

class AgreementScreen extends StatefulWidget {
  const AgreementScreen({super.key});

  @override
  State<AgreementScreen> createState() => _AgreementScreenState();
}

class _AgreementScreenState extends State<AgreementScreen> {
  // Required
  bool _termsOfService = false;
  bool _privacyPolicy = false;
  bool _ageConfirmation = false;

  // Optional
  bool _marketingConsent = false;
  bool _sensitiveInfoConsent = false;

  bool get _allAgreed =>
      _termsOfService &&
      _privacyPolicy &&
      _ageConfirmation &&
      _marketingConsent &&
      _sensitiveInfoConsent;

  bool get _requiredAgreed =>
      _termsOfService && _privacyPolicy && _ageConfirmation;

  void _toggleAll(bool value) {
    setState(() {
      _termsOfService = value;
      _privacyPolicy = value;
      _ageConfirmation = value;
      _marketingConsent = value;
      _sensitiveInfoConsent = value;
    });
  }

  void _onNext() {
    if (_requiredAgreed) {
      context.go('/nickname');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('서비스 이용 동의'),
        centerTitle: true,
        leading: IconButton(
          key: const Key('agreement_back_button'),
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'LetMeIn 서비스 이용을 위해\n아래 약관에 동의해주세요.',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        height: 1.4,
                      ),
                    ),

                    const SizedBox(height: AppSpacing.sectionGap),

                    // ── All agree ─────────────────────
                    _AllAgreeRow(
                      key: const Key('agreement_all_toggle'),
                      checked: _allAgreed,
                      onChanged: _toggleAll,
                    ),

                    const Divider(height: 32),

                    // ── Required items ────────────────
                    _AgreementRow(
                      key: const Key('agreement_terms_of_service'),
                      label: '서비스 이용약관',
                      required: true,
                      checked: _termsOfService,
                      onChanged: (v) => setState(() => _termsOfService = v),
                    ),
                    const SizedBox(height: 12),
                    _AgreementRow(
                      key: const Key('agreement_privacy_policy'),
                      label: '개인정보 수집·이용',
                      required: true,
                      checked: _privacyPolicy,
                      onChanged: (v) => setState(() => _privacyPolicy = v),
                    ),
                    const SizedBox(height: 12),
                    _AgreementRow(
                      key: const Key('agreement_age_confirmation'),
                      label: '만 18세 이상 확인',
                      required: true,
                      checked: _ageConfirmation,
                      onChanged: (v) => setState(() => _ageConfirmation = v),
                    ),

                    const SizedBox(height: 24),

                    // ── Optional items ────────────────
                    _AgreementRow(
                      key: const Key('agreement_marketing'),
                      label: '마케팅 수신 동의',
                      required: false,
                      checked: _marketingConsent,
                      onChanged: (v) => setState(() => _marketingConsent = v),
                    ),
                    const SizedBox(height: 12),
                    _AgreementRow(
                      key: const Key('agreement_sensitive_info'),
                      label: '민감정보 수집 동의',
                      required: false,
                      checked: _sensitiveInfoConsent,
                      onChanged: (v) =>
                          setState(() => _sensitiveInfoConsent = v),
                    ),
                  ],
                ),
              ),
            ),

            // ── Next button ───────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, AppSpacing.sectionGap),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  key: const Key('agreement_next_button'),
                  onPressed: _requiredAgreed ? _onNext : null,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    '다음',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// All Agree Row
// ──────────────────────────────────────────────

class _AllAgreeRow extends StatelessWidget {
  const _AllAgreeRow({
    super.key,
    required this.checked,
    required this.onChanged,
  });

  final bool checked;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            _CheckIcon(checked: checked),
            const SizedBox(width: 12),
            const Text(
              '전체 동의',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Agreement Row
// ──────────────────────────────────────────────

class _AgreementRow extends StatelessWidget {
  const _AgreementRow({
    super.key,
    required this.label,
    required this.required,
    required this.checked,
    required this.onChanged,
  });

  final String label;
  final bool required;
  final bool checked;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            _CheckIcon(checked: checked, size: 22),
            const SizedBox(width: 12),
            if (required)
              Text(
                '[필수] ',
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              )
            else
              Text(
                '[선택] ',
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                  fontWeight: FontWeight.w600,
                ),
              ),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 14),
              ),
            ),
            Icon(
              LucideIcons.chevronRight,
              size: 18,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// Check Icon
// ──────────────────────────────────────────────

class _CheckIcon extends StatelessWidget {
  const _CheckIcon({required this.checked, this.size = 24});

  final bool checked;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Icon(
      checked ? LucideIcons.checkCircle : LucideIcons.checkCircle,
      size: size,
      color: checked ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.3),
    );
  }
}
