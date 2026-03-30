// lib/features/auction/presentation/auction_create_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/image_model.dart';
import '../../../shared/widgets/image_upload_widget.dart';
import '../../hospital/presentation/hospital_provider.dart';
import 'auction_provider.dart';

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
// Section metadata
// ──────────────────────────────────────────────

const _kSections = [
  (icon: LucideIcons.layoutGrid, label: '시술 카테고리'),
  (icon: LucideIcons.slidersHorizontal, label: '세부 시술'),
  (icon: LucideIcons.camera, label: '사진 업로드'),
  (icon: LucideIcons.lock, label: '사진 공개'),
  (icon: LucideIcons.pencil, label: '요청 내용'),
  (icon: LucideIcons.calendar, label: '희망 시기'),
];

// ──────────────────────────────────────────────
// AuctionCreateScreen
// ──────────────────────────────────────────────

class AuctionCreateScreen extends ConsumerStatefulWidget {
  const AuctionCreateScreen({super.key});

  @override
  ConsumerState<AuctionCreateScreen> createState() =>
      _AuctionCreateScreenState();
}

class _AuctionCreateScreenState extends ConsumerState<AuctionCreateScreen> {
  final _descController = TextEditingController();
  final _scrollController = ScrollController();
  final _formKey = GlobalKey<FormState>();

  // Track how many sections have been reached
  int _maxReachedSection = 0;

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
        .read(createRequestProvider.notifier)
        .setDescription(_descController.text);
  }

  void _updateReachedSection(int section) {
    if (section > _maxReachedSection) {
      setState(() => _maxReachedSection = section);
    }
  }

  Future<void> _submit() async {
    await ref.read(createRequestProvider.notifier).submit();
    if (!mounted) return;
    final state = ref.read(createRequestProvider);
    if (state.createdRequest != null) {
      context.pushReplacement(
          '${AppRoutes.auction}/${state.createdRequest!.id}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final formState = ref.watch(createRequestProvider);
    final categoriesAsync = ref.watch(categoryProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // Track progress based on filled fields
    int currentFilledStep = 0;
    if (formState.selectedCategoryId != null) currentFilledStep = 1;
    if (formState.selectedDetailIds.isNotEmpty) currentFilledStep = 2;
    if (formState.uploadedPhotoIds.isNotEmpty) currentFilledStep = 3;
    if (currentFilledStep >= 3) currentFilledStep = 4; // photo public always visible
    if (formState.description.trim().length >= 20) currentFilledStep = 5;
    if (formState.preferredPeriod != null) currentFilledStep = 6;

    // Listen for errors
    ref.listen<CreateRequestState>(createRequestProvider, (prev, next) {
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
          '상담 요청하기',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: _StepProgressBar(
            totalSteps: _kSections.length,
            currentStep: currentFilledStep,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          key: const Key('auction_create_scroll'),
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 20, AppSpacing.pagePadding, 120),
          children: [
            // ── Section 1: Category ─────────────────
            _SectionHeader(
              stepNumber: 1,
              icon: _kSections[0].icon,
              title: _kSections[0].label,
              required: true,
            ),
            const SizedBox(height: 12),
            categoriesAsync.when(
              loading: () => const Center(
                key: Key('auction_create_categories_loading'),
                child: CircularProgressIndicator(),
              ),
              error: (e, _) => Center(
                key: const Key('auction_create_categories_error'),
                child: Text(
                  '카테고리를 불러오지 못했습니다.',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
              data: (categories) {
                return GridView.builder(
                  key: const Key('auction_create_category_grid'),
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
                        key: Key('auction_create_category_${cat.id}'),
                        onTap: () {
                          ref
                              .read(createRequestProvider.notifier)
                              .selectCategory(cat.id);
                          _updateReachedSection(1);
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeInOut,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? colorScheme.primaryContainer
                                : Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? colorScheme.primary
                                  : Colors.grey.shade200,
                              width: isSelected ? 1.5 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: colorScheme.primary
                                          .withValues(alpha: 0.18),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? colorScheme.primary
                                          .withValues(alpha: 0.15)
                                      : Colors.grey.shade100,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Icon(
                                    LucideIcons.syringe,
                                    size: 20,
                                    color: isSelected
                                        ? colorScheme.primary
                                        : Colors.grey[600],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 7),
                              Text(
                                cat.name,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isSelected
                                      ? colorScheme.onPrimaryContainer
                                      : Colors.grey[700],
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

            const SizedBox(height: 28),

            // ── Section 2: Detail selection ─────────
            _SectionHeader(
              stepNumber: 2,
              icon: _kSections[1].icon,
              title: _kSections[1].label,
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
                    key: const Key('auction_create_details_hint'),
                    style: TextStyle(color: Colors.grey[500]),
                  );
                }
                final selectedCat = categories.firstWhere(
                  (c) => c.id == formState.selectedCategoryId,
                  orElse: () => categories.first,
                );
                if (selectedCat.details.isEmpty) {
                  return Text(
                    '선택 가능한 세부 시술이 없습니다.',
                    style: TextStyle(color: Colors.grey[500]),
                  );
                }
                return Wrap(
                  key: const Key('auction_create_detail_chips'),
                  spacing: 8,
                  runSpacing: 8,
                  children: selectedCat.details.map((detail) {
                    final isSelected =
                        formState.selectedDetailIds.contains(detail.id);
                    return Semantics(
                      selected: isSelected,
                      child: FilterChip(
                        key: Key('auction_create_detail_chip_${detail.id}'),
                        label: Text(detail.name),
                        selected: isSelected,
                        onSelected: (_) {
                          ref
                              .read(createRequestProvider.notifier)
                              .toggleDetail(detail.id);
                          _updateReachedSection(2);
                        },
                      ),
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 28),

            // ── Section 3: Photo upload ─────────────
            _SectionHeader(
              stepNumber: 3,
              icon: _kSections[2].icon,
              title: _kSections[2].label,
              required: false,
            ),
            const SizedBox(height: 4),
            Text(
              '시술 부위 사진을 첨부하면 더 정확한 상담을 받을 수 있어요. (최대 4장)',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: ImageUploadWidget(
                key: const Key('auction_create_photo_upload'),
                maxImages: 4,
                bucket: 'private',
                entityType: 'consultation',
                onImagesChanged: (List<ImageModel> images) {
                  ref
                      .read(createRequestProvider.notifier)
                      .setPhotoIds(images.map((img) => img.id).toList());
                  if (images.isNotEmpty) _updateReachedSection(3);
                },
              ),
            ),

            const SizedBox(height: 28),

            // ── Section 4: Photo public toggle ──────
            _SectionHeader(
              stepNumber: 4,
              icon: _kSections[3].icon,
              title: _kSections[3].label,
              required: false,
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '병원에 사진 공개',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '켜면 응답하는 병원이 내 사진을 볼 수 있습니다.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Semantics(
                    label: '사진 공개 여부 토글',
                    toggled: formState.photoPublic,
                    child: Switch(
                      key: const Key('auction_create_photo_public_toggle'),
                      value: formState.photoPublic,
                      onChanged: (val) => ref
                          .read(createRequestProvider.notifier)
                          .setPhotoPublic(val),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ── Section 5: Description ──────────────
            _SectionHeader(
              stepNumber: 5,
              icon: _kSections[4].icon,
              title: _kSections[4].label,
              required: true,
            ),
            const SizedBox(height: 4),
            Text(
              '20~500자로 작성해주세요.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 12),
            Semantics(
              label: '상담 요청 내용 입력',
              child: TextField(
                key: const Key('auction_create_description_field'),
                controller: _descController,
                maxLength: 500,
                maxLines: 5,
                textInputAction: TextInputAction.newline,
                onChanged: (_) => _updateReachedSection(5),
                decoration: InputDecoration(
                  hintText: '원하시는 시술 내용, 현재 상태, 우려되는 점 등을 자세히 적어주세요.',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                  counterText:
                      '${formState.description.trim().length}/500',
                  errorText: formState.description.trim().isNotEmpty &&
                          formState.description.trim().length < 20
                      ? '최소 20자 이상 입력해주세요.'
                      : null,
                ),
              ),
            ),

            const SizedBox(height: 28),

            // ── Section 6: Preferred period ─────────
            _SectionHeader(
              stepNumber: 6,
              icon: _kSections[5].icon,
              title: _kSections[5].label,
              required: true,
            ),
            const SizedBox(height: 12),
            Wrap(
              key: const Key('auction_create_period_chips'),
              spacing: 8,
              runSpacing: 8,
              children: _kPeriodOptions.map((option) {
                final optLabel = option.$1;
                final optValue = option.$2;
                final isSelected = formState.preferredPeriod == optValue;
                return Semantics(
                  selected: isSelected,
                  child: ChoiceChip(
                    key: Key('auction_create_period_chip_$optValue'),
                    label: Text(optLabel),
                    selected: isSelected,
                    onSelected: (_) {
                      ref
                          .read(createRequestProvider.notifier)
                          .setPreferredPeriod(isSelected ? null : optValue);
                      _updateReachedSection(6);
                    },
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _SubmitButton(
        isValid: formState.isValid,
        isSubmitting: formState.isSubmitting,
        onSubmit: _submit,
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StepProgressBar
// ──────────────────────────────────────────────

class _StepProgressBar extends StatelessWidget {
  const _StepProgressBar({
    required this.totalSteps,
    required this.currentStep,
  });

  final int totalSteps;
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 0, AppSpacing.pagePadding, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Step $currentStep / $totalSteps',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.primary,
                ),
              ),
              Text(
                '${((currentStep / totalSteps) * 100).round()}% 완료',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: currentStep / totalSteps,
              backgroundColor: Colors.grey.shade200,
              color: colorScheme.primary,
              minHeight: 5,
            ),
          ),
        ],
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
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            size: 17,
            color: colorScheme.onPrimaryContainer,
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
        ),
        if (required) ...[
          const SizedBox(width: 4),
          Text(
            '*',
            style: TextStyle(
              color: Colors.red[600],
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────
// _SubmitButton — sticky bottom with gradient overlay
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

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.white.withValues(alpha: 0.0),
            Colors.white.withValues(alpha: 0.95),
            Colors.white,
          ],
          stops: const [0.0, 0.3, 1.0],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.pagePadding, 12, AppSpacing.pagePadding, 16),
          child: AnimatedOpacity(
            opacity: isValid ? 1.0 : 0.5,
            duration: const Duration(milliseconds: 200),
            child: SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                key: const Key('auction_create_submit_btn'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                  elevation: isValid ? 4 : 0,
                  shadowColor: colorScheme.primary.withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: (isValid && !isSubmitting) ? onSubmit : null,
                child: isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        '상담 요청하기',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
