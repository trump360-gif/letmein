// lib/features/consultation/presentation/consultation_create_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/models/image_model.dart';
import '../../../shared/utils/keyword_filter.dart';
import '../../../shared/widgets/image_upload_widget.dart';
import '../../../core/theme/app_theme.dart';
import '../../hospital/presentation/hospital_provider.dart';
import 'consultation_provider.dart';

// ──────────────────────────────────────────────
// Period options
// ──────────────────────────────────────────────

const _kPeriodOptions = [
  ('1개월 이내', '1month'),
  ('3개월 이내', '3months'),
  ('6개월 이내', '6months'),
  ('미정', 'undecided'),
];

// ──────────────────────────────────────────────
// ConsultationCreateScreen
// ──────────────────────────────────────────────

class ConsultationCreateScreen extends ConsumerStatefulWidget {
  const ConsultationCreateScreen({super.key});

  @override
  ConsumerState<ConsultationCreateScreen> createState() =>
      _ConsultationCreateScreenState();
}

class _ConsultationCreateScreenState
    extends ConsumerState<ConsultationCreateScreen> {
  final _descController = TextEditingController();
  final _scrollController = ScrollController();

  // 민감정보 동의 상태 (로컬)
  bool _sensitiveConsent = false;
  bool _sensitiveExpanded = false;

  @override
  void initState() {
    super.initState();
    _descController.addListener(_onDescriptionChanged);
  }

  @override
  void dispose() {
    _descController.removeListener(_onDescriptionChanged);
    _descController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onDescriptionChanged() {
    ref
        .read(createConsultationProvider.notifier)
        .setDescription(_descController.text);
  }

  String? get _descriptionError =>
      _descController.text.trim().isEmpty
          ? null
          : KeywordFilter.validate(_descController.text.trim());

  Future<void> _submit() async {
    await ref.read(createConsultationProvider.notifier).submit();
    if (!mounted) return;
    final state = ref.read(createConsultationProvider);
    if (state.createdRequest != null) {
      context.pushReplacement(
          '${AppRoutes.consultation}/${state.createdRequest!.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(createConsultationProvider);
    final categoriesAsync = ref.watch(categoryProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    ref.listen<CreateRequestState>(createConsultationProvider, (prev, next) {
      if (next.errorMessage != null &&
          next.errorMessage != prev?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: Colors.red[700],
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '상담 접수하기',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: ListView(
        key: const Key('consultation_create_scroll'),
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, 120),
        children: [
          // ── Coordinator banner ───────────────────
          Container(
            margin: const EdgeInsets.symmetric(vertical: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  LucideIcons.userCheck,
                  size: 20,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '블랙라벨 코디네이터 매칭',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '코디네이터가 직접 검토 후 맞춤 병원 2~3곳을 안내해 드립니다.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Section 1: Category ─────────────────
          _SectionHeader(
            stepNumber: 1,
            icon: LucideIcons.layoutGrid,
            title: '시술 카테고리',
            required: true,
          ),
          const SizedBox(height: 12),
          categoriesAsync.when(
            loading: () => const Center(
              key: Key('consultation_create_categories_loading'),
              child: CircularProgressIndicator(),
            ),
            error: (e, _) => Center(
              key: const Key('consultation_create_categories_error'),
              child: Text(
                '카테고리를 불러오지 못했습니다.',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
              ),
            ),
            data: (categories) {
              return GridView.builder(
                key: const Key('consultation_create_category_grid'),
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.1,
                ),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  final cat = categories[index];
                  final isSelected =
                      formState.selectedCategoryId == cat.id;
                  return Semantics(
                    button: true,
                    selected: isSelected,
                    label: '${cat.name} 카테고리',
                    child: InkWell(
                      key: Key('consultation_create_category_${cat.id}'),
                      onTap: () => ref
                          .read(createConsultationProvider.notifier)
                          .selectCategory(cat.id),
                      borderRadius: BorderRadius.circular(12),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeInOut,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? colorScheme.primaryContainer
                              : colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? colorScheme.primary
                                : colorScheme.outline.withValues(alpha: 0.35),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              LucideIcons.syringe,
                              size: 22,
                              color: isSelected
                                  ? colorScheme.primary
                                  : colorScheme.onSurface
                                      .withValues(alpha: 0.4),
                            ),
                            const SizedBox(height: 7),
                            Text(
                              cat.name,
                              style:
                                  theme.textTheme.bodySmall?.copyWith(
                                color: isSelected
                                    ? colorScheme.onPrimaryContainer
                                    : colorScheme.onSurface,
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.normal,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 2: Detail selection ─────────
          _SectionHeader(
            stepNumber: 2,
            icon: LucideIcons.slidersHorizontal,
            title: '세부 시술',
            required: true,
          ),
          const SizedBox(height: 12),
          categoriesAsync.when(
            loading: () => const SizedBox.shrink(),
            error: (err, stack) => const SizedBox.shrink(),
            data: (categories) {
              if (formState.selectedCategoryId == null) {
                return Text(
                  '먼저 카테고리를 선택해주세요.',
                  key: const Key('consultation_create_details_hint'),
                  style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4)),
                );
              }
              final selectedCat = categories.firstWhere(
                (c) => c.id == formState.selectedCategoryId,
                orElse: () => categories.first,
              );
              if (selectedCat.details.isEmpty) {
                return Text(
                  '선택 가능한 세부 시술이 없습니다.',
                  style: TextStyle(color: colorScheme.onSurface.withValues(alpha: 0.4)),
                );
              }
              return Wrap(
                key: const Key('consultation_create_detail_chips'),
                spacing: 8,
                runSpacing: 8,
                children: selectedCat.details.map((detail) {
                  final isSelected =
                      formState.selectedDetailIds.contains(detail.id);
                  final colorScheme = Theme.of(context).colorScheme;
                  return Semantics(
                    selected: isSelected,
                    button: true,
                    label: '${detail.name} 세부 시술',
                    child: InkWell(
                      key: Key(
                          'consultation_create_detail_chip_${detail.id}'),
                      onTap: () => ref
                          .read(createConsultationProvider.notifier)
                          .toggleDetail(detail.id),
                      borderRadius: BorderRadius.circular(20),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? colorScheme.primary
                              : colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? colorScheme.primary
                                : colorScheme.outline.withValues(alpha: 0.4),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          detail.name,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                                color: isSelected
                                    ? Colors.white
                                    : colorScheme.onSurface
                                        .withValues(alpha: 0.75),
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              );
            },
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 3: 민감정보 동의 (사진 업로드 전 필수) ────
          _SectionHeader(
            stepNumber: 3,
            icon: LucideIcons.shieldCheck,
            title: '민감정보 수집·이용 동의',
            required: true,
          ),
          const SizedBox(height: 8),
          _SensitiveConsentWidget(
            consented: _sensitiveConsent,
            expanded: _sensitiveExpanded,
            onConsentChanged: (val) {
              setState(() => _sensitiveConsent = val);
            },
            onToggleExpand: () {
              setState(() => _sensitiveExpanded = !_sensitiveExpanded);
            },
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 4: Photo upload ─────────────
          _SectionHeader(
            stepNumber: 4,
            icon: LucideIcons.camera,
            title: '사진 업로드',
            required: false,
          ),
          const SizedBox(height: 4),
          Text(
            '시술 부위 사진을 첨부하면 더 정확한 상담을 받을 수 있어요. (최대 4장)',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
          const SizedBox(height: 12),
          if (!_sensitiveConsent) ...[
            Container(
              key: const Key('consultation_create_photo_locked'),
              height: 90,
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.lock,
                    size: 18,
                    color: colorScheme.onSurface.withValues(alpha: 0.4),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '민감정보 동의 후 사진을 업로드할 수 있습니다.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            SizedBox(
              height: 120,
              child: ImageUploadWidget(
                key: const Key('consultation_create_photo_upload'),
                maxImages: 4,
                bucket: 'private',
                entityType: 'consultation',
                onImagesChanged: (List<ImageModel> images) {
                  ref
                      .read(createConsultationProvider.notifier)
                      .setPhotoIds(images.map((img) => img.id).toList());
                },
              ),
            ),
          ],

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 5: Photo public toggle ──────
          _SectionHeader(
            stepNumber: 5,
            icon: LucideIcons.lock,
            title: '사진 공개',
            required: false,
          ),
          const SizedBox(height: 8),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '코디네이터에게 사진 공개',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '켜면 배정된 병원이 내 사진을 볼 수 있습니다.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurface.withValues(alpha: 0.4),
                        ),
                      ),
                    ],
                  ),
                ),
                Semantics(
                  label: '사진 공개 여부 토글',
                  toggled: formState.photoPublic,
                  child: Switch(
                    key: const Key(
                        'consultation_create_photo_public_toggle'),
                    value: formState.photoPublic,
                    onChanged: (val) => ref
                        .read(createConsultationProvider.notifier)
                        .setPhotoPublic(val),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 6: Description (optional) ──
          _SectionHeader(
            stepNumber: 6,
            icon: LucideIcons.pencil,
            title: '추가 요청사항',
            required: false,
          ),
          const SizedBox(height: 4),
          Text(
            '특별히 원하시는 점이 있으면 적어주세요. (선택)',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
          const SizedBox(height: 12),
          Semantics(
            label: '추가 요청사항 입력',
            child: TextField(
              key: const Key('consultation_create_description_field'),
              controller: _descController,
              maxLength: 500,
              minLines: 5,
              maxLines: null,
              textInputAction: TextInputAction.newline,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: '원하시는 시술 내용, 현재 상태, 우려되는 점 등을 적어주세요.',
                hintStyle: TextStyle(
                  color: colorScheme.onSurface.withValues(alpha: 0.35),
                  fontSize: 14,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: colorScheme.outline.withValues(alpha: 0.4),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: colorScheme.outline.withValues(alpha: 0.3),
                  ),
                ),
                contentPadding: const EdgeInsets.all(16),
                filled: true,
                counterText:
                    '${formState.description.trim().length}/500',
                errorText: _descriptionError,
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.sectionGap),

          // ── Section 7: Preferred period ─────────
          _SectionHeader(
            stepNumber: 7,
            icon: LucideIcons.calendar,
            title: '희망 시기',
            required: true,
          ),
          const SizedBox(height: 12),
          Wrap(
            key: const Key('consultation_create_period_chips'),
            spacing: 8,
            runSpacing: 8,
            children: _kPeriodOptions.map((option) {
              final optLabel = option.$1;
              final optValue = option.$2;
              final isSelected = formState.preferredPeriod == optValue;
              final colorScheme = Theme.of(context).colorScheme;
              return Semantics(
                selected: isSelected,
                button: true,
                label: '$optLabel 선택',
                child: InkWell(
                  key: Key('consultation_create_period_chip_$optValue'),
                  onTap: () => ref
                      .read(createConsultationProvider.notifier)
                      .setPreferredPeriod(isSelected ? null : optValue),
                  borderRadius: BorderRadius.circular(20),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colorScheme.primary
                          : colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? colorScheme.primary
                            : colorScheme.outline.withValues(alpha: 0.4),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      optLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isSelected
                            ? Colors.white
                            : colorScheme.onSurface.withValues(alpha: 0.75),
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
      bottomNavigationBar: _SubmitButton(
        isValid: formState.isValid && _sensitiveConsent && _descriptionError == null,
        isSubmitting: formState.isSubmitting,
        onSubmit: _submit,
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _SectionHeader
// ──────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.stepNumber,
    required this.icon,
    required this.title,
    required this.required,
  });

  final int stepNumber;
  final IconData icon;
  final String title;
  final bool required;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: colorScheme.onSurface.withValues(alpha: 0.45),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w500,
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.75),
              ),
        ),
        if (required) ...[
          const SizedBox(width: 3),
          Text(
            '*',
            style: TextStyle(
              color: Colors.red[400],
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _SensitiveConsentWidget
// ──────────────────────────────────────────────

class _SensitiveConsentWidget extends StatelessWidget {
  const _SensitiveConsentWidget({
    required this.consented,
    required this.expanded,
    required this.onConsentChanged,
    required this.onToggleExpand,
  });

  final bool consented;
  final bool expanded;
  final ValueChanged<bool> onConsentChanged;
  final VoidCallback onToggleExpand;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Container(
      key: const Key('consultation_sensitive_consent'),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: consented
            ? Border.all(
                color: colorScheme.primary.withValues(alpha: 0.4),
                width: 1,
              )
            : null,
      ),
      child: Column(
        children: [
          // ── 체크박스 행 ────────────────────────
          Semantics(
            checked: consented,
            label: '민감정보(신체 사진) 수집·이용 동의 (필수)',
            child: InkWell(
              key: const Key('consultation_sensitive_consent_row'),
              onTap: () => onConsentChanged(!consented),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                child: Row(
                  children: [
                    Checkbox(
                      key: const Key('consultation_sensitive_consent_checkbox'),
                      value: consented,
                      onChanged: (val) => onConsentChanged(val ?? false),
                      visualDensity: VisualDensity.compact,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '민감정보(신체 사진) 수집·이용 동의',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '필수',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.red[400],
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Pretendard',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── 펼치기/접기 버튼 ──────────────────
          InkWell(
            key: const Key('consultation_sensitive_consent_toggle'),
            onTap: onToggleExpand,
            borderRadius: expanded
                ? BorderRadius.zero
                : const BorderRadius.vertical(bottom: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Row(
                children: [
                  Text(
                    expanded ? '동의 내용 접기' : '동의 내용 보기',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    expanded
                        ? LucideIcons.chevronUp
                        : LucideIcons.chevronDown,
                    size: 14,
                    color: colorScheme.primary,
                  ),
                ],
              ),
            ),
          ),

          // ── 펼쳐진 동의 내용 ──────────────────
          if (expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ConsentRow(
                    title: '수집 항목',
                    content: '시술 부위 신체 사진',
                  ),
                  const SizedBox(height: 8),
                  _ConsentRow(
                    title: '수집 목적',
                    content: '시술 상담 매칭을 위한 코디네이터 검토 및 병원 전달',
                  ),
                  const SizedBox(height: 8),
                  _ConsentRow(
                    title: '보관 기간',
                    content: '상담 완료 후 6개월, 이후 즉시 파기',
                  ),
                  const SizedBox(height: 8),
                  _ConsentRow(
                    title: '제3자 제공',
                    content: '매칭된 병원(의료기관)에 한하여 제공. 사진 공개 설정 시 적용.',
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '* 동의 거부 시 사진 업로드 없이 텍스트 상담만 진행할 수 있습니다.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ConsentRow extends StatelessWidget {
  const _ConsentRow({required this.title, required this.content});

  final String title;
  final String content;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 72,
          child: Text(
            title,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            content,
            style: theme.textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _SubmitButton
// ──────────────────────────────────────────────

class _SubmitButton extends StatelessWidget {
  const _SubmitButton({
    required this.isValid,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final bool isValid;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.pagePadding, 12, AppSpacing.pagePadding, 16),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            key: const Key('consultation_create_submit_btn'),
            style: ElevatedButton.styleFrom(
              backgroundColor: isValid
                  ? colorScheme.primary
                  : colorScheme.primary.withValues(alpha: 0.38),
              foregroundColor: Colors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: (isValid && !isSubmitting) ? onSubmit : null,
            child: isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    '상담 접수하기',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                      color: isValid
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
