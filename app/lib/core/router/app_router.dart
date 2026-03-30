import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/onboarding_screen.dart';
import '../../features/auth/presentation/agreement_screen.dart';
import '../../features/auth/presentation/nickname_screen.dart';
import '../../features/auth/presentation/interest_screen.dart';
import '../../features/auth/presentation/auth_provider.dart';
import '../../features/hospital/presentation/hospital_list_screen.dart';
import '../../features/hospital/presentation/hospital_detail_screen.dart';
import '../../features/consultation/presentation/consultation_home_screen.dart';
import '../../features/consultation/presentation/consultation_create_screen.dart';
import '../../features/consultation/presentation/consultation_detail_screen.dart';
import '../../features/chat/presentation/chat_list_screen.dart';
import '../../features/chat/presentation/chat_room_screen.dart';
import '../../features/community/presentation/community_home_screen.dart';
import '../../features/community/presentation/post_create_screen.dart';
import '../../features/community/presentation/post_detail_screen.dart';
import '../../features/community/presentation/poll_create_screen.dart';
import '../../features/community/presentation/poll_detail_screen.dart';
import '../../features/mypage/presentation/mypage_screen.dart';
import '../../features/mypage/presentation/notification_settings_screen.dart';
import '../../features/referral/presentation/referral_screen.dart';
import '../../features/cast_member/presentation/cast_member_profile_screen.dart';
import '../../features/cast_member/presentation/cast_story_feed_screen.dart';
import '../../features/cast_member/presentation/cast_apply_screen.dart';
import '../../features/review/presentation/review_list_screen.dart';
import '../../features/review/presentation/review_write_screen.dart';

// ──────────────────────────────────────────────
// Route paths
// ──────────────────────────────────────────────

class AppRoutes {
  static const onboarding = '/onboarding';
  static const login = '/login';
  static const agreement = '/agreement';
  static const nickname = '/nickname';
  static const interests = '/interests';
  static const castApply = '/cast-members/apply';
  static const home = '/';
  static const auction = '/auction';
  static const auctionCreate = '/auction/create';
  static const consultation = '/consultation';
  static const consultationCreate = '/consultation/create';
  static const community = '/community';
  static const communityCreate = '/community/create';
  static const hospital = '/hospital';
  static const mypage = '/mypage';
  static const mypageNotifications = '/mypage/notifications';
  static const mypageReferral = '/mypage/referral';
  static const chat = '/chat';
  static const chatRoom = '/chat/:id';
  static const communityPolls = '/community/polls';
  static const communityPollCreate = '/community/polls/create';
  static const castMembers = '/cast-members';
  static const castMemberProfile = '/cast-members/:id';
  static const castStories = '/cast-stories';
  static const reviewWrite = '/review/write';
}

// ──────────────────────────────────────────────
// Router provider
// ──────────────────────────────────────────────

final routerProvider = Provider<GoRouter>((ref) {
  // Create a notifier listenable so GoRouter rebuilds on auth state changes.
  final authNotifier = _AuthStateNotifier(ref);

  return GoRouter(
    initialLocation: AppRoutes.onboarding,
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final location = state.matchedLocation;

      // While auth status is being determined, stay put.
      if (authState.status == AuthStatus.unknown) return null;

      final isOnPublicRoute = location == AppRoutes.onboarding ||
          location == AppRoutes.login ||
          location == AppRoutes.agreement ||
          location == AppRoutes.nickname ||
          location == AppRoutes.interests;

      // New user must complete agreement and nickname setup.
      if (authState.status == AuthStatus.newUser) {
        if (location == AppRoutes.agreement ||
            location == AppRoutes.nickname ||
            location == AppRoutes.interests) {
          return null;
        }
        return AppRoutes.agreement;
      }

      // Authenticated user should not be on public/auth routes.
      if (authState.status == AuthStatus.authenticated && isOnPublicRoute) {
        return AppRoutes.home;
      }

      // Unauthenticated user must stay on public routes.
      if (authState.status == AuthStatus.unauthenticated && !isOnPublicRoute) {
        return AppRoutes.login;
      }

      return null;
    },
    routes: [
      // ── Public / Auth Routes ────────────────
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.agreement,
        builder: (context, state) => const AgreementScreen(),
      ),
      GoRoute(
        path: AppRoutes.nickname,
        builder: (context, state) => const NicknameScreen(),
      ),
      GoRoute(
        path: AppRoutes.interests,
        builder: (context, state) => const InterestScreen(),
      ),

      // ── Legacy /auction → /consultation redirect ──
      GoRoute(
        path: AppRoutes.auction,
        redirect: (context, state) {
          final sub = state.uri.toString().replaceFirst(AppRoutes.auction, '');
          return '${AppRoutes.consultation}$sub';
        },
      ),

      // ── Chat Routes (full-screen, outside tab shell) ──
      GoRoute(
        path: AppRoutes.chat,
        builder: (context, state) => const ChatListScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = int.parse(state.pathParameters['id']!);
              return ChatRoomScreen(roomId: id);
            },
          ),
        ],
      ),

      // ── Review Write Route (full-screen, outside tab shell) ──
      GoRoute(
        path: AppRoutes.reviewWrite,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final hospitalId = extra?['hospitalId'] as int?;
          return ReviewWriteScreen(initialHospitalId: hospitalId);
        },
      ),

      // ── Cast Member Routes (full-screen, outside tab shell) ──
      GoRoute(
        path: AppRoutes.castMembers,
        builder: (context, state) => const CastStoryFeedScreen(),
        routes: [
          GoRoute(
            path: ':id',
            builder: (context, state) {
              final id = int.parse(state.pathParameters['id']!);
              return CastMemberProfileScreen(castMemberId: id);
            },
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.castStories,
        builder: (context, state) => const CastStoryFeedScreen(),
      ),
      GoRoute(
        path: AppRoutes.castApply,
        builder: (context, state) => const CastApplyScreen(),
      ),

      // ── Main Shell Route (5 tabs) ───────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.consultation,
                builder: (context, state) =>
                    const ConsultationHomeScreen(),
                routes: [
                  GoRoute(
                    path: 'create',
                    builder: (context, state) =>
                        const ConsultationCreateScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (context, state) {
                      final id =
                          int.parse(state.pathParameters['id']!);
                      return ConsultationDetailScreen(requestId: id);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.community,
                builder: (context, state) =>
                    const CommunityHomeScreen(),
                routes: [
                  GoRoute(
                    path: 'create',
                    builder: (context, state) {
                      final extra =
                          state.extra as Map<String, dynamic>?;
                      final boardType =
                          extra?['boardType'] as String? ??
                              'before_after';
                      return PostCreateScreen(boardType: boardType);
                    },
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (context, state) {
                      final id =
                          int.parse(state.pathParameters['id']!);
                      return PostDetailScreen(postId: id);
                    },
                  ),
                  GoRoute(
                    path: 'polls/create',
                    builder: (context, state) =>
                        const PollCreateScreen(),
                  ),
                  GoRoute(
                    path: 'polls/:id',
                    builder: (context, state) {
                      final id =
                          int.parse(state.pathParameters['id']!);
                      return PollDetailScreen(pollId: id);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.hospital,
                builder: (context, state) {
                  final categoryName = state.uri.queryParameters['category'];
                  return HospitalListScreen(initialCategory: categoryName);
                },
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) {
                      final id =
                          int.parse(state.pathParameters['id']!);
                      return HospitalDetailScreen(hospitalId: id);
                    },
                    routes: [
                      GoRoute(
                        path: 'reviews',
                        builder: (context, state) {
                          final id =
                              int.parse(state.pathParameters['id']!);
                          return ReviewListScreen(hospitalId: id);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.mypage,
                builder: (context, state) => const MyPageScreen(),
                routes: [
                  GoRoute(
                    path: 'notifications',
                    builder: (context, state) =>
                        const NotificationSettingsScreen(),
                  ),
                  GoRoute(
                    path: 'referral',
                    builder: (context, state) =>
                        const ReferralScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

// ──────────────────────────────────────────────
// Listenable that bridges Riverpod → GoRouter
// ──────────────────────────────────────────────

class _AuthStateNotifier extends ChangeNotifier {
  _AuthStateNotifier(Ref ref) {
    ref.listen<AuthState>(authStateProvider, (prev, next) {
      notifyListeners();
    });
  }
}

// ──────────────────────────────────────────────
// Bottom nav shell
// ──────────────────────────────────────────────

class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _navItems = [
    _NavItem(icon: LucideIcons.home, label: '홈'),
    _NavItem(icon: LucideIcons.clipboardList, label: '상담요청'),
    _NavItem(icon: LucideIcons.messagesSquare, label: '커뮤니티'),
    _NavItem(icon: LucideIcons.stethoscope, label: '병원'),
    _NavItem(icon: LucideIcons.user, label: 'MY'),
  ];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final currentIndex = navigationShell.currentIndex;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).dividerColor,
              width: 1,
            ),
          ),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 56,
            child: Row(
              children: List.generate(_navItems.length, (index) {
                final item = _navItems[index];
                final isSelected = index == currentIndex;
                return Expanded(
                  child: _NavBarItem(
                    icon: item.icon,
                    label: item.label,
                    isSelected: isSelected,
                    onTap: () => navigationShell.goBranch(
                      index,
                      initialLocation: index == currentIndex,
                    ),
                    activeColor: colorScheme.primary,
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem({required this.icon, required this.label});
  final IconData icon;
  final String label;
}

class _NavBarItem extends StatelessWidget {
  const _NavBarItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    required this.activeColor,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color activeColor;

  @override
  Widget build(BuildContext context) {
    final inactiveColor = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4);
    final iconColor = isSelected ? activeColor : inactiveColor;
    final labelColor = isSelected ? activeColor : inactiveColor;
    final labelWeight =
        isSelected ? FontWeight.w700 : FontWeight.w400;

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: InkWell(
        onTap: onTap,
        splashColor: activeColor.withValues(alpha: 0.08),
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: iconColor),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: labelWeight,
                color: labelColor,
                fontFamily: 'Pretendard',
              ),
            ),
          ],
        ),
      ),
    );
  }
}
