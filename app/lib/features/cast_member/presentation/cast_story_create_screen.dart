// lib/features/cast_member/presentation/cast_story_create_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/image_model.dart';
import '../../../shared/widgets/image_upload_widget.dart';
import '../data/cast_member_repository.dart';
import 'cast_member_provider.dart';

// ──────────────────────────────────────────────
// Story type constants
// ──────────────────────────────────────────────

class _StoryType {
  const _StoryType({
    required this.value,
    required this.label,
    required this.description,
    required this.color,
    required this.icon,
  });

  final String value;
  final String label;
  final String description;
  final Color color;
  final IconData icon;
}

const _storyTypes = [
  _StoryType(
    value: 'recovery',
    label: '회복일지',
    description: '시술 후 회복 과정을 공유해요',
    color: Color(0xFF00B894),
    icon: LucideIcons.heartPulse,
  ),
  _StoryType(
    value: 'qa',
    label: 'Q&A',
    description: '팬들의 질문에 답변해요',
    color: Color(0xFF0984E3),
    icon: LucideIcons.helpCircle,
  ),
  _StoryType(
    value: 'lifestyle',
    label: '일상',
    description: '일상적인 이야기를 나눠요',
    color: Color(0xFF6C5CE7),
    icon: LucideIcons.sun,
  ),
];

// ──────────────────────────────────────────────
// CastStoryCreateScreen
// ──────────────────────────────────────────────

class CastStoryCreateScreen extends ConsumerStatefulWidget {
  const CastStoryCreateScreen({super.key});

  @override
  ConsumerState<CastStoryCreateScreen> createState() =>
      _CastStoryCreateScreenState();
}

class _CastStoryCreateScreenState
    extends ConsumerState<CastStoryCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  final _youtubeLinkController = TextEditingController();

  String? _selectedStoryType;
  List<ImageModel> _uploadedImages = [];
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _contentController.dispose();
    _youtubeLinkController.dispose();
    super.dispose();
  }

  bool get _isValid {
    final contentLen = _contentController.text.trim().length;
    return _selectedStoryType != null &&
        contentLen >= 10 &&
        contentLen <= 1000;
  }

  String? _validateYoutubeUrl(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final trimmed = value.trim();
    final isValid = trimmed.startsWith('https://www.youtube.com/') ||
        trimmed.startsWith('https://youtu.be/') ||
        trimmed.startsWith('http://www.youtube.com/') ||
        trimmed.startsWith('http://youtu.be/');
    if (!isValid) {
      return '올바른 YouTube URL을 입력해주세요.';
    }
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedStoryType == null) {
      setState(() => _errorMessage = '스토리 유형을 선택해주세요.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final repo = ref.read(castMemberRepositoryProvider);
      final youtubeUrl = _youtubeLinkController.text.trim();

      await repo.createStory(
        content: _contentController.text.trim(),
        storyType: _selectedStoryType!,
        imageIds: _uploadedImages.isNotEmpty
            ? _uploadedImages.map((img) => img.id).toList()
            : null,
        youtubeUrl: youtubeUrl.isEmpty ? null : youtubeUrl,
      );

      // Invalidate story feed so it refreshes on next visit.
      ref.invalidate(castStoryFeedProvider);

      if (mounted) context.pop();
    } catch (_) {
      setState(() {
        _isSubmitting = false;
        _errorMessage = '스토리 작성에 실패했습니다. 다시 시도해주세요.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      key: const Key('cast_story_create_scaffold'),
      appBar: AppBar(
        title: const Text(
          '스토리 작성',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        actions: [
          TextButton(
            key: const Key('cast_story_create_submit_btn'),
            onPressed: (_isValid && !_isSubmitting) ? _submit : null,
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('게시'),
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
                key: const Key('cast_story_create_error_banner'),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _errorMessage!,
                  style:
                      TextStyle(color: theme.colorScheme.onErrorContainer),
                ),
              ),
              const SizedBox(height: AppSpacing.sectionGap),
            ],

            // ── Story type selector ──────────────
            Text('스토리 유형 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            _StoryTypeSelector(
              selectedType: _selectedStoryType,
              onSelected: (type) {
                setState(() => _selectedStoryType = type);
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Content ───────────────────────────
            Text('내용 *', style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextFormField(
              key: const Key('cast_story_create_content_field'),
              controller: _contentController,
              maxLines: 10,
              maxLength: 1000,
              decoration: const InputDecoration(
                hintText: '스토리 내용을 10자 이상 입력해주세요.',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              onChanged: (_) => setState(() {}),
              validator: (value) {
                if (value == null || value.trim().length < 10) {
                  return '내용을 10자 이상 입력해주세요.';
                }
                if (value.trim().length > 1000) {
                  return '내용은 1000자 이하로 입력해주세요.';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── Images ────────────────────────────
            Text('사진 (최대 10장, 선택)',
                style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            ImageUploadWidget(
              key: const Key('cast_story_create_image_upload'),
              maxImages: 10,
              bucket: 'public',
              entityType: 'cast_story',
              onImagesChanged: (images) {
                setState(() => _uploadedImages = images);
              },
            ),
            const SizedBox(height: AppSpacing.sectionGap),

            // ── YouTube link ──────────────────────
            Text('YouTube 링크 (선택)',
                style: theme.textTheme.labelLarge),
            const SizedBox(height: 8),
            TextFormField(
              key: const Key('cast_story_create_youtube_field'),
              controller: _youtubeLinkController,
              keyboardType: TextInputType.url,
              decoration: InputDecoration(
                hintText: 'https://www.youtube.com/...',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(LucideIcons.youtube),
              ),
              validator: _validateYoutubeUrl,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: AppSpacing.sectionGap),
          ],
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────
// _StoryTypeSelector — chip group
// ──────────────────────────────────────────────

class _StoryTypeSelector extends StatelessWidget {
  const _StoryTypeSelector({
    required this.selectedType,
    required this.onSelected,
  });

  final String? selectedType;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      key: const Key('cast_story_type_selector'),
      spacing: 8,
      runSpacing: 8,
      children: _storyTypes.map((type) {
        final isSelected = selectedType == type.value;
        return _StoryTypeChip(
          key: Key('cast_story_type_chip_${type.value}'),
          storyType: type,
          isSelected: isSelected,
          onTap: () => onSelected(type.value),
        );
      }).toList(),
    );
  }
}

class _StoryTypeChip extends StatelessWidget {
  const _StoryTypeChip({
    super.key,
    required this.storyType,
    required this.isSelected,
    required this.onTap,
  });

  final _StoryType storyType;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? storyType.color.withValues(alpha: 0.15)
              : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? storyType.color
                : theme.colorScheme.outline.withValues(alpha: 0.3),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              storyType.icon,
              size: 16,
              color: isSelected
                  ? storyType.color
                  : theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  storyType.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isSelected
                        ? storyType.color
                        : theme.colorScheme.onSurface,
                    fontFamily: 'Pretendard',
                  ),
                ),
                Text(
                  storyType.description,
                  style: TextStyle(
                    fontSize: 10,
                    color: isSelected
                        ? storyType.color.withValues(alpha: 0.8)
                        : theme.colorScheme.onSurface
                            .withValues(alpha: 0.4),
                    fontFamily: 'Pretendard',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
