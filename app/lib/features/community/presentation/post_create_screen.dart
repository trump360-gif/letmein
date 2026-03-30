// lib/features/community/presentation/post_create_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../features/hospital/data/hospital_models.dart';
import '../../../features/hospital/data/hospital_repository.dart';
import '../../../features/hospital/presentation/hospital_provider.dart';
import '../../../shared/models/image_model.dart';
import '../../../shared/widgets/image_upload_widget.dart';
import '../data/community_models.dart';
import '../data/community_repository.dart';
import 'community_provider.dart';

// ──────────────────────────────────────────────
// PostCreateScreen
// ──────────────────────────────────────────────

class PostCreateScreen extends ConsumerStatefulWidget {
  const PostCreateScreen({
    super.key,
    this.boardType = 'before_after',
  });

  final String boardType;

  bool get isFreeBoard => boardType == 'free';

  @override
  ConsumerState<PostCreateScreen> createState() => _PostCreateScreenState();
}

class _PostCreateScreenState extends ConsumerState<PostCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  final _titleController = TextEditingController();

  int? _selectedCategoryId;
  HospitalListItem? _selectedHospital;
  bool _isAnonymous = false;
  List<ImageModel> _uploadedImages = [];
  bool _isSubmitting = false;
  String? _errorMessage;

  // Hospital search state
  final _hospitalSearchController = TextEditingController();
  List<HospitalListItem> _hospitalSuggestions = [];
  bool _isSearchingHospital = false;

  @override
  void dispose() {
    _contentController.dispose();
    _titleController.dispose();
    _hospitalSearchController.dispose();
    super.dispose();
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
    final contentOk = _contentController.text.trim().length >= 20;
    if (widget.isFreeBoard) {
      return _titleController.text.trim().isNotEmpty && contentOk;
    }
    return _selectedCategoryId != null && contentOk;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!widget.isFreeBoard && _selectedCategoryId == null) {
      setState(() => _errorMessage = '시술 카테고리를 선택해주세요.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final repo = ref.read(communityRepositoryProvider);
      await repo.createPost(CreatePostPayload(
        boardType: widget.boardType,
        categoryId: _selectedCategoryId,
        title: widget.isFreeBoard
            ? _titleController.text.trim()
            : null,
        content: _contentController.text.trim(),
        hospitalId: _selectedHospital?.id,
        isAnonymous: _isAnonymous,
        imageIds: _uploadedImages.isNotEmpty
            ? _uploadedImages.map((img) => img.id).toList()
            : null,
      ));

      // Refresh the relevant feed and navigate back.
      if (widget.isFreeBoard) {
        ref.read(freePostListProvider.notifier).refresh();
      } else {
        ref.read(postListProvider.notifier).refresh();
      }
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _isSubmitting = false;
        _errorMessage = '게시물 작성에 실패했습니다. 다시 시도해주세요.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categoriesAsync = ref.watch(categoryProvider);
    final appBarTitle =
        widget.isFreeBoard ? '자유게시판 글쓰기' : '글쓰기';

    return Scaffold(
      appBar: AppBar(
        title: Text(appBarTitle),
        actions: [
          TextButton(
            key: const Key('post_create_submit_button'),
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

            // ── Title field (자유게시판 only) ──────
            if (widget.isFreeBoard) ...[
              Text('제목 *', style: theme.textTheme.labelLarge),
              const SizedBox(height: 8),
              TextFormField(
                key: const Key('post_create_title_field'),
                controller: _titleController,
                maxLength: 100,
                decoration: const InputDecoration(
                  hintText: '제목을 입력해주세요.',
                  border: OutlineInputBorder(),
                ),
                onChanged: (_) => setState(() {}),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '제목을 입력해주세요.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.sectionGap),
            ],

            // ── Category select (비포&애프터 only — required) ──
            if (!widget.isFreeBoard) ...[
              Text('시술 카테고리 *',
                  style: theme.textTheme.labelLarge),
              const SizedBox(height: 8),
              categoriesAsync.when(
                data: (categories) => Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: categories.map((cat) {
                    final selected = _selectedCategoryId == cat.id;
                    return FilterChip(
                      key: Key('category_chip_${cat.id}'),
                      label: Text(cat.name),
                      selected: selected,
                      onSelected: (_) {
                        setState(() {
                          _selectedCategoryId = cat.id;
                        });
                      },
                    );
                  }).toList(),
                ),
                loading: () => const CircularProgressIndicator(),
                error: (e, s) =>
                    const Text('카테고리를 불러오지 못했습니다.'),
              ),
              const SizedBox(height: AppSpacing.sectionGap),
            ],

            // ── Content ───────────────────────────
            Text('내용 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextFormField(
              key: const Key('post_create_content_field'),
              controller: _contentController,
              maxLines: 8,
              maxLength: 2000,
              decoration: const InputDecoration(
                hintText: '내용을 20자 이상 입력해주세요.',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              onChanged: (_) => setState(() {}),
              validator: (value) {
                if (value == null || value.trim().length < 20) {
                  return '내용을 20자 이상 입력해주세요.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Images ────────────────────────────
            Text('사진 (최대 10장)',
                style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            ImageUploadWidget(
              key: const Key('post_create_image_upload'),
              maxImages: 10,
              bucket: 'public',
              entityType: 'community',
              onImagesChanged: (images) {
                setState(() => _uploadedImages = images);
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Hospital tag (비포&애프터 only) ───────
            if (!widget.isFreeBoard) ...[
              Text('병원 태그 (선택)',
                  style: theme.textTheme.labelLarge),
              const SizedBox(height: 8),
              if (_selectedHospital != null) ...[
                Chip(
                  key: Key(
                      'hospital_chip_${_selectedHospital!.id}'),
                  avatar: const Icon(LucideIcons.stethoscope, size: 16),
                  label: Text(_selectedHospital!.name),
                  onDeleted: () =>
                      setState(() => _selectedHospital = null),
                ),
                const SizedBox(height: 8),
              ],
              TextFormField(
                key: const Key('hospital_search_field'),
                controller: _hospitalSearchController,
                decoration: InputDecoration(
                  hintText: '병원 이름으로 검색',
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(LucideIcons.search),
                  suffixIcon: _isSearchingHospital
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2),
                          ),
                        )
                      : null,
                ),
                onChanged: (q) => _searchHospitals(q),
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
                              title: Text(h.name),
                              subtitle: h.address.isNotEmpty
                                  ? Text(h.address,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis)
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
            ],

            // ── Anonymous toggle ──────────────────
            SwitchListTile(
              key: const Key('post_create_anonymous_switch'),
              title: const Text('익명으로 게시'),
              subtitle: const Text('작성자 이름 대신 "익명"으로 표시됩니다.'),
              value: _isAnonymous,
              onChanged: (v) => setState(() => _isAnonymous = v),
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: AppSpacing.sectionGap),
          ],
        ),
      ),
    );
  }
}
