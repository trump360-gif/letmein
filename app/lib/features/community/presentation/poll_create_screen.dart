// lib/features/community/presentation/poll_create_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../data/poll_models.dart';
import '../data/poll_repository.dart';
import 'poll_provider.dart';

// ──────────────────────────────────────────────
// PollCreateScreen
// ──────────────────────────────────────────────

class PollCreateScreen extends ConsumerStatefulWidget {
  const PollCreateScreen({super.key});

  @override
  ConsumerState<PollCreateScreen> createState() =>
      _PollCreateScreenState();
}

class _PollCreateScreenState extends ConsumerState<PollCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _pollType = 'single';
  final List<TextEditingController> _optionControllers = [
    TextEditingController(),
    TextEditingController(),
  ];
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    for (final c in _optionControllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _addOption() {
    if (_optionControllers.length >= 10) return;
    setState(() {
      _optionControllers.add(TextEditingController());
    });
  }

  void _removeOption(int index) {
    if (_optionControllers.length <= 2) return;
    setState(() {
      _optionControllers[index].dispose();
      _optionControllers.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final options = _optionControllers
        .map((c) => c.text.trim())
        .where((t) => t.isNotEmpty)
        .toList();
    if (options.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('옵션을 2개 이상 입력해 주세요.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final repo = ref.read(pollRepositoryProvider);
      await repo.createPoll(
        CreatePollPayload(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim().isEmpty
              ? null
              : _descriptionController.text.trim(),
          pollType: _pollType,
          options: options,
        ),
      );

      // Refresh poll list so new item shows up.
      ref.read(pollListProvider.notifier).refresh();

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('투표가 생성되었습니다.')),
        );
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('투표 생성에 실패했습니다.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('투표 만들기'),
        centerTitle: false,
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child:
                        CircularProgressIndicator(strokeWidth: 2),
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
            // ── Title ───────────────────────────────
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: '제목 *',
                hintText: '투표 제목을 입력하세요',
                border: OutlineInputBorder(),
              ),
              maxLength: 200,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '제목을 입력해 주세요.';
                return null;
              },
            ),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Description ─────────────────────────
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '설명 (선택)',
                hintText: '투표에 대한 설명을 추가하세요',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              maxLength: 500,
            ),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Poll type toggle ─────────────────────
            Text('선택 방식',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(
                    value: 'single', label: Text('단일선택')),
                ButtonSegment(
                    value: 'multiple', label: Text('복수선택')),
              ],
              selected: {_pollType},
              onSelectionChanged: (s) =>
                  setState(() => _pollType = s.first),
            ),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Options ──────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('선택지',
                    style:
                        Theme.of(context).textTheme.titleSmall),
                Text(
                  '${_optionControllers.length}/10',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4), fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 8),

            ...List.generate(_optionControllers.length, (i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _optionControllers[i],
                        decoration: InputDecoration(
                          labelText: '선택지 ${i + 1}'
                              '${i < 2 ? ' *' : ''}',
                          border: const OutlineInputBorder(),
                        ),
                        maxLength: 200,
                        validator: i < 2
                            ? (v) {
                                if (v == null || v.trim().isEmpty) {
                                  return '선택지를 입력해 주세요.';
                                }
                                return null;
                              }
                            : null,
                      ),
                    ),
                    if (_optionControllers.length > 2)
                      IconButton(
                        icon:
                            const Icon(LucideIcons.minusCircle),
                        color: Colors.red,
                        onPressed: () => _removeOption(i),
                      ),
                  ],
                ),
              );
            }),

            if (_optionControllers.length < 10)
              OutlinedButton.icon(
                onPressed: _addOption,
                icon: const Icon(LucideIcons.plus),
                label: const Text('선택지 추가'),
              ),

            const SizedBox(height: AppSpacing.sectionGap),

            // ── Submit ───────────────────────────────
            FilledButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('투표 만들기'),
            ),
          ],
        ),
      ),
    );
  }
}
