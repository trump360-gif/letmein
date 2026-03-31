// lib/features/cast_member/presentation/cast_member_status_provider.dart
//
// 현재 로그인된 유저가 검증된 출연자인지 확인하는 provider.
// authStateProvider.userExtra.isCastMember 플래그를 주 소스로 사용하며,
// 필요 시 서버 재확인 FutureProvider도 제공한다.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_provider.dart';
import '../data/cast_member_models.dart';
import '../data/cast_member_repository.dart';

// ──────────────────────────────────────────────
// 1. 빠른 동기 판단 — authStateProvider 기반
//    authStateProvider의 userExtra.isCastMember 플래그를 읽어
//    로딩 없이 바로 bool을 반환한다.
// ──────────────────────────────────────────────

final isCastMemberProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).userExtra.isCastMember;
});

// ──────────────────────────────────────────────
// 2. 서버 재확인 FutureProvider — CastMember 프로필 전체 반환
//    null → 출연자 아님 / non-null → 출연자 프로필
// ──────────────────────────────────────────────

final myCastMemberProfileProvider =
    FutureProvider<CastMember?>((ref) async {
  final isCastMember = ref.watch(isCastMemberProvider);
  if (!isCastMember) return null;

  final repo = ref.watch(castMemberRepositoryProvider);
  return repo.getMyCastMemberProfile();
});
