// lib/features/review/presentation/review_write_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/hospital/data/hospital_models.dart';
import '../../../features/hospital/data/hospital_repository.dart';
import '../../../shared/models/image_model.dart';
import '../../../shared/widgets/image_upload_widget.dart';
import '../data/review_models.dart';
import '../data/review_repository.dart';
import 'review_provider.dart';

// ──────────────────────────────────────────────
// ReviewWriteScreen
// ──────────────────────────────────────────────

class ReviewWriteScreen extends ConsumerStatefulWidget {
  const ReviewWriteScreen({
    super.key,
    this.initialHospitalId,
  });

  /// If provided, the hospital selector is pre-filled.
  final int? initialHospitalId;

  @override
  ConsumerState<ReviewWriteScreen> createState() => _ReviewWriteScreenState();
}

class _ReviewWriteScreenState extends ConsumerState<ReviewWriteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();

  HospitalListItem? _selectedHospital;
  int _rating = 0;
  List<ImageModel> _uploadedImages = [];
  bool _isSubmitting = false;
  String? _errorMessage;

  // Hospital search
  final _hospitalSearchController = TextEditingController();
  List<HospitalListItem> _hospitalSuggestions = [];
  bool _isSearchingHospital = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialHospitalId != null) {
      _loadInitialHospital(widget.initialHospitalId!);
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    _hospitalSearchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialHospital(int id) async {
    try {
      final repo = ref.read(hospitalRepositoryProvider);
      final hospital = await repo.getById(id);
      if (mounted) {
        setState(() {
          _selectedHospital = HospitalListItem(
            id: hospital.id,
            name: hospital.name,
            address: hospital.address,
            profileImage: hospital.profileImage,
            isPremium: hospital.isPremium,
            reviewCount: hospital.reviewCount,
            specialties: hospital.specialties,
          );
        });
      }
    } catch (_) {
      // ignore — hospital selector still usable
    }
  }

  Future<void> _searchHospitals(String query) async {
    if (query.length < 2) {
      setState(() => _hospitalSuggestions = []);
      return;
    }
    setState(() => _isSearchingHospital = true);
    try {
      final repo = ref.read(hospitalRepositoryProvider);
      final result = await repo.search(query: query, limit: 10);
      if (mounted) {
        setState(() {
          _hospitalSuggestions = result.items;
          _isSearchingHospital = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isSearchingHospital = false);
    }
  }

  bool get _isValid {
    return _selectedHospital != null &&
        _rating > 0 &&
        _contentController.text.trim().length >= 30;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedHospital == null) {
      setState(() => _errorMessage = '병원을 선택해주세요.');
      return;
    }
    if (_rating == 0) {
      setState(() => _errorMessage = '별점을 선택해주세요.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final repo = ref.read(reviewRepositoryProvider);
      await repo.createReview(CreateReviewPayload(
        hospitalId: _selectedHospital!.id,
        rating: _rating,
        content: _contentController.text.trim(),
        imageIds: _uploadedImages.isNotEmpty
            ? _uploadedImages.map((img) => img.id).toList()
            : null,
      ));

      // Invalidate cached reviews for this hospital.
      ref.invalidate(hospitalReviewsProvider(_selectedHospital!.id));
      ref.invalidate(hospitalReviewSummaryProvider(_selectedHospital!.id));

      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _isSubmitting = false;
        _errorMessage = '후기 작성에 실패했습니다. 다시 시도해주세요.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('후기 작성'),
        actions: [
          TextButton(
            key: const Key('review_write_submit_button'),
            onPressed: (_isValid && !_isSubmitting) ? _submit : null,
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('완료'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.pagePadding),
          children: [
            // ── Error banner ──────────────────────
            if (_errorMessage != null) ...[
              Container(
                key: const Key('review_write_error_banner'),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(color: theme.colorScheme.onErrorContainer),
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),
            ],

            // ── Hospital selector ─────────────────
            Text('병원 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            if (_selectedHospital != null) ...[
              Chip(
                key: Key('review_write_hospital_chip_${_selectedHospital!.id}'),
                avatar: const Icon(LucideIcons.stethoscope, size: 16),
                label: Text(_selectedHospital!.name),
                onDeleted: () => setState(() {
                  _selectedHospital = null;
                  _hospitalSearchController.clear();
                }),
              ),
              const SizedBox(height: 8),
            ],
            TextFormField(
              key: const Key('review_write_hospital_search_field'),
              controller: _hospitalSearchController,
              decoration: InputDecoration(
                hintText: '병원 이름으로 검색',
                prefixIcon: const Icon(LucideIcons.search),
                suffixIcon: _isSearchingHospital
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : null,
              ),
              onChanged: (q) => _searchHospitals(q),
              validator: (_) {
                if (_selectedHospital == null) return '병원을 선택해주세요.';
                return null;
              },
            ),
            if (_hospitalSuggestions.isNotEmpty) ...[
              const SizedBox(height: 4),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: _hospitalSuggestions
                      .map((h) => ListTile(
                            key: Key('review_write_hospital_item_${h.id}'),
                            title: Text(h.name),
                            subtitle: h.address.isNotEmpty
                                ? Text(
                                    h.address,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  )
                                : null,
                            onTap: () {
                              setState(() {
                                _selectedHospital = h;
                                _hospitalSuggestions = [];
                                _hospitalSearchController.clear();
                              });
                            },
                          ))
                      .toList(),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Star rating ───────────────────────
            Text('별점 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            _StarRatingBar(
              key: const Key('review_write_star_rating'),
              rating: _rating,
              onChanged: (r) => setState(() => _rating = r),
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Content ───────────────────────────
            Text('후기 내용 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextFormField(
              key: const Key('review_write_content_field'),
              controller: _contentController,
              maxLines: 7,
              maxLength: 1000,
              decoration: const InputDecoration(
                hintText: '시술 경험을 30자 이상 작성해주세요.',
                alignLabelWithHint: true,
              ),
              onChanged: (_) => setState(() {}),
              validator: (value) {
                if (value == null || value.trim().length < 30) {
                  return '후기 내용을 30자 이상 입력해주세요.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Images (optional) ─────────────────
            Text('사진 첨부 (선택, 최대 5장)', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            ImageUploadWidget(
              key: const Key('review_write_image_upload'),
              maxImages: 5,
              bucket: 'public',
              entityType: 'review',
              onImagesChanged: (images) {
                setState(() => _uploadedImages = images);
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StarRatingBar
// ──────────────────────────────────────────────

class _StarRatingBar extends StatelessWidget {
  const _StarRatingBar({
    super.key,
    required this.rating,
    required this.onChanged,
  });

  final int rating;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: List.generate(5, (index) {
        final starValue = index + 1;
        final isFilled = starValue <= rating;
        return GestureDetector(
          key: Key('review_write_star_$starValue'),
          onTap: () => onChanged(starValue),
          child: Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Icon(
              isFilled ? Icons.star_rounded : Icons.star_outline_rounded,
              size: 40,
              color: isFilled
                  ? AppColors.gold
                  : colorScheme.onSurface.withValues(alpha: 0.25),
            ),
          ),
        );
      }),
    );
  }
}
