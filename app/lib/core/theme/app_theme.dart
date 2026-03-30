import 'package:flutter/material.dart';

// ──────────────────────────────────────────────
// AppSpacing — 다이사 스타일 여백/간격 상수
// 모든 화면에서 이 상수를 사용하여 일관된 레이아웃 유지
// ──────────────────────────────────────────────

class AppSpacing {
  AppSpacing._();

  /// 화면 좌우 패딩 (기존 16~20 → 24 통일)
  static const double pagePadding = 24;

  /// 화면 좌우 패딩 EdgeInsets
  static const EdgeInsets pageH = EdgeInsets.symmetric(horizontal: 24);

  /// 섹션 간 수직 간격 (기존 16 → 32)
  static const double sectionGap = 32;

  /// 카드 내부 패딩
  static const double cardPadding = 16;

  /// 리스트 아이템 간 간격
  static const double itemGap = 12;

  /// 섹션 헤더 아래 간격
  static const double sectionHeaderBottom = 12;

  /// 컴포넌트 내 작은 간격
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

// ──────────────────────────────────────────────
// ThemePreset — 4가지 테마 프리셋
// ──────────────────────────────────────────────

enum ThemePreset {
  dark('다크', '0D0D0D'),
  light('라이트', 'FAF8F5'),
  cream('크림+버건디', 'FAF8F5'),
  rose('로즈', 'FDF6EE');

  const ThemePreset(this.label, this.bgHex);
  final String label;
  final String bgHex;
}

// ──────────────────────────────────────────────
// AppColors — PRD 13_design.md 다크 프리미엄 팔레트
// ──────────────────────────────────────────────

class AppColors {
  AppColors._();

  // Background
  static const scaffoldBackground = Color(0xFF0D0D0D);
  static const surface = Color(0xFF1E1E2E);
  static const surfaceVariant = Color(0xFF252535);
  static const cardColor = Color(0xFF1E1E2E);

  // Accent / Primary
  static const primary = Color(0xFFC0392B);
  static const primaryDark = Color(0xFFA93226);
  static const onPrimary = Color(0xFFFFFFFF);

  // Gold / Premium
  static const gold = Color(0xFFD4A574);
  static const goldLight = Color(0xFFE8C89A);

  // Text
  static const textPrimary = Color(0xFFF5F5F5);
  static const textSecondary = Color(0xFF9E9E9E);
  static const textHint = Color(0xFF666666);

  // Divider / Border
  static const divider = Color(0xFF2A2A3A);
  static const border = Color(0xFF2A2A3A);

  // Navigation
  static const navBackground = Color(0xFF0D0D0D);
  static const navActive = Color(0xFFC0392B);
  static const navInactive = Color(0xFF666666);

  // Semantic
  static const error = Color(0xFFCF6679);
  static const success = Color(0xFF4CAF82);
  static const warning = Color(0xFFF59E0B);
}

// ──────────────────────────────────────────────
// AppTheme
// ──────────────────────────────────────────────

class AppTheme {
  AppTheme._();

  static const _fontFamily = 'Pretendard';

  // ── Dark ColorScheme (PRD 13_design.md) ─────
  static final _darkColorScheme = ColorScheme.dark(
    brightness: Brightness.dark,
    primary: AppColors.primary,
    onPrimary: AppColors.onPrimary,
    primaryContainer: AppColors.primaryDark,
    onPrimaryContainer: AppColors.onPrimary,
    secondary: AppColors.gold,
    onSecondary: AppColors.scaffoldBackground,
    secondaryContainer: AppColors.surfaceVariant,
    onSecondaryContainer: AppColors.textPrimary,
    tertiary: AppColors.gold,
    onTertiary: AppColors.scaffoldBackground,
    surface: AppColors.surface,
    onSurface: AppColors.textPrimary,
    surfaceContainerHighest: AppColors.surfaceVariant,
    onSurfaceVariant: AppColors.textSecondary,
    outline: AppColors.border,
    outlineVariant: AppColors.divider,
    error: AppColors.error,
    onError: Colors.white,
    shadow: Colors.black,
    inverseSurface: AppColors.textPrimary,
    onInverseSurface: AppColors.scaffoldBackground,
    inversePrimary: AppColors.primaryDark,
    scrim: Colors.black,
  );

  // ── Light ColorScheme ─────────────────────
  static const _lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: Color(0xFFC0392B),
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFFFDAD6),
    onPrimaryContainer: Color(0xFF410002),
    secondary: Color(0xFFD4A574),
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFF5E6D3),
    onSecondaryContainer: Color(0xFF3E2A1A),
    tertiary: Color(0xFFD4A574),
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFF5E6D3),
    onTertiaryContainer: Color(0xFF3E2A1A),
    error: Color(0xFFBA1A1A),
    onError: Colors.white,
    surface: Colors.white,
    onSurface: Color(0xFF1A1A1A),
    surfaceContainerHighest: Color(0xFFF5F5F5),
    onSurfaceVariant: Color(0xFF666666),
    outline: Color(0xFFCCCCCC),
    outlineVariant: Color(0xFFEEEEEE),
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: Color(0xFF1A1A1A),
    onInverseSurface: Colors.white,
    inversePrimary: Color(0xFFFFB4AB),
  );

  // ── Dark Theme (기본값) ─────────────────────
  static final dark = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: _darkColorScheme,
    fontFamily: _fontFamily,
    scaffoldBackgroundColor: AppColors.scaffoldBackground,
    canvasColor: AppColors.scaffoldBackground,
    cardColor: AppColors.cardColor,
    dividerColor: AppColors.divider,
    textTheme: _textTheme.apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    ),
    cardTheme: _darkCardTheme,
    appBarTheme: _darkAppBarTheme,
    navigationBarTheme: _darkNavigationBarTheme,
    elevatedButtonTheme: _darkElevatedButtonTheme,
    filledButtonTheme: _darkFilledButtonTheme,
    outlinedButtonTheme: _darkOutlinedButtonTheme,
    textButtonTheme: _darkTextButtonTheme,
    inputDecorationTheme: _darkInputDecorationTheme,
    dividerTheme: _darkDividerTheme,
    chipTheme: _darkChipTheme,
    switchTheme: _darkSwitchTheme,
    checkboxTheme: _darkCheckboxTheme,
    bottomNavigationBarTheme: _darkBottomNavTheme,
    popupMenuTheme: _darkPopupMenuTheme,
    dialogTheme: _darkDialogTheme,
    snackBarTheme: _darkSnackBarTheme,
    iconTheme: const IconThemeData(color: AppColors.textSecondary),
    primaryIconTheme: const IconThemeData(color: AppColors.primary),
    splashColor: AppColors.primary.withValues(alpha: 0.08),
    highlightColor: AppColors.primary.withValues(alpha: 0.04),
    hintColor: AppColors.textHint,
  );

  // ── Light Theme ──────────────────────────────
  static final light = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: _lightColorScheme,
    fontFamily: _fontFamily,
    scaffoldBackgroundColor: const Color(0xFFF5F5F7),
    textTheme: _textTheme,
    cardTheme: _lightCardTheme,
    appBarTheme: _lightAppBarTheme,
    navigationBarTheme: _lightNavigationBarTheme,
    elevatedButtonTheme: _lightElevatedButtonTheme,
    inputDecorationTheme: _lightInputDecorationTheme,
    dividerTheme: _lightDividerTheme,
  );

  // ── Cream + Burgundy Theme (크림+버건디) ──────
  static final cream = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xFFC0392B),
      onPrimary: Colors.white,
      primaryContainer: Color(0xFFFFDAD6),
      onPrimaryContainer: Color(0xFF410002),
      secondary: Color(0xFFD4A574),
      onSecondary: Colors.white,
      secondaryContainer: Color(0xFFF5E6D3),
      onSecondaryContainer: Color(0xFF3E2A1A),
      tertiary: Color(0xFFD4A574),
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFF5E6D3),
      onTertiaryContainer: Color(0xFF3E2A1A),
      error: Color(0xFFBA1A1A),
      onError: Colors.white,
      surface: Colors.white,
      onSurface: Color(0xFF1A1A1A),
      surfaceContainerHighest: Color(0xFFF0EDE8),
      onSurfaceVariant: Color(0xFF666666),
      outline: Color(0xFFD5CFC7),
      outlineVariant: Color(0xFFEAE5DD),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: Color(0xFF1A1A1A),
      onInverseSurface: Colors.white,
      inversePrimary: Color(0xFFFFB4AB),
    ),
    fontFamily: _fontFamily,
    scaffoldBackgroundColor: const Color(0xFFFAF8F5),
    textTheme: _textTheme,
    cardTheme: _lightCardTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFFFAF8F5),
      foregroundColor: const Color(0xFF1A1A1A),
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Color(0xFF1A1A1A),
      ),
    ),
    navigationBarTheme: _lightNavigationBarTheme,
    elevatedButtonTheme: _lightElevatedButtonTheme,
    inputDecorationTheme: _lightInputDecorationTheme,
    dividerTheme: _lightDividerTheme,
  );

  // ── Rose Theme (오프화이트+딥로즈) ─────────────
  static final rose = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme(
      brightness: Brightness.light,
      primary: Color(0xFF9B4157),
      onPrimary: Colors.white,
      primaryContainer: Color(0xFFFFD9DE),
      onPrimaryContainer: Color(0xFF3F0017),
      secondary: Color(0xFFC8956C),
      onSecondary: Colors.white,
      secondaryContainer: Color(0xFFF5E0CE),
      onSecondaryContainer: Color(0xFF3E2A1A),
      tertiary: Color(0xFFC8956C),
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFF5E0CE),
      onTertiaryContainer: Color(0xFF3E2A1A),
      error: Color(0xFFBA1A1A),
      onError: Colors.white,
      surface: Color(0xFFFFFFFF),
      onSurface: Color(0xFF1A1A1A),
      surfaceContainerHighest: Color(0xFFF5EDE8),
      onSurfaceVariant: Color(0xFF666666),
      outline: Color(0xFFD5CFC7),
      outlineVariant: Color(0xFFEDE5DD),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: Color(0xFF1A1A1A),
      onInverseSurface: Colors.white,
      inversePrimary: Color(0xFFFFB1C0),
    ),
    fontFamily: _fontFamily,
    scaffoldBackgroundColor: const Color(0xFFFDF6EE),
    textTheme: _textTheme,
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFEDE5DD)),
      ),
      margin: EdgeInsets.zero,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFFFDF6EE),
      foregroundColor: const Color(0xFF1A1A1A),
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Color(0xFF1A1A1A),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: const Color(0xFFFDF6EE),
      indicatorColor: const Color(0xFF9B4157).withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(fontFamily: _fontFamily, fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF9B4157));
        }
        return const TextStyle(fontFamily: _fontFamily, fontSize: 11, color: Color(0xFF999999));
      }),
    ),
    elevatedButtonTheme: _lightElevatedButtonTheme,
    inputDecorationTheme: _lightInputDecorationTheme,
    dividerTheme: _lightDividerTheme,
  );

  /// 프리셋으로 ThemeData 가져오기
  static ThemeData fromPreset(ThemePreset preset) {
    switch (preset) {
      case ThemePreset.dark:
        return dark;
      case ThemePreset.light:
        return light;
      case ThemePreset.cream:
        return cream;
      case ThemePreset.rose:
        return rose;
    }
  }

  // ─────────────────────────────────────────────
  // Text Theme
  // ─────────────────────────────────────────────

  static const _textTheme = TextTheme(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w300,
      letterSpacing: -0.25,
      height: 1.12,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w300,
      height: 1.16,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w300,
      height: 1.22,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w400,
      height: 1.25,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w400,
      height: 1.29,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w400,
      height: 1.33,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w500,
      height: 1.27,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.15,
      height: 1.5,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      height: 1.43,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.15,
      height: 1.5,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      height: 1.43,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      height: 1.33,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      height: 1.43,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      height: 1.33,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      height: 1.45,
    ),
  );

  // ─────────────────────────────────────────────
  // Dark component themes
  // ─────────────────────────────────────────────

  static final _darkCardTheme = CardThemeData(
    elevation: 0,
    color: AppColors.cardColor,
    shadowColor: Colors.transparent,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.border, width: 1),
    ),
    clipBehavior: Clip.antiAlias,
  );

  static const _darkAppBarTheme = AppBarTheme(
    centerTitle: true,
    elevation: 0,
    scrolledUnderElevation: 0,
    backgroundColor: Color(0xFF0D0D0D),
    foregroundColor: AppColors.textPrimary,
    surfaceTintColor: Colors.transparent,
    titleTextStyle: TextStyle(
      fontFamily: _fontFamily,
      fontSize: 17,
      fontWeight: FontWeight.w500,
      letterSpacing: -0.3,
      color: AppColors.textPrimary,
    ),
    iconTheme: IconThemeData(color: AppColors.textSecondary),
    actionsIconTheme: IconThemeData(color: AppColors.textSecondary),
  );

  static final _darkNavigationBarTheme = NavigationBarThemeData(
    height: 65,
    backgroundColor: AppColors.navBackground,
    indicatorColor: AppColors.primary.withValues(alpha: 0.15),
    indicatorShape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    iconTheme: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const IconThemeData(color: AppColors.navActive);
      }
      return const IconThemeData(color: AppColors.navInactive);
    }),
    labelTextStyle: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return const TextStyle(
          fontFamily: _fontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.navActive,
        );
      }
      return const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: AppColors.navInactive,
      );
    }),
  );

  static final _darkElevatedButtonTheme = ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.4),
      disabledForegroundColor: Colors.white.withValues(alpha: 0.6),
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      elevation: 0,
      shadowColor: Colors.transparent,
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.1,
      ),
    ),
  );

  static final _darkFilledButtonTheme = FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      elevation: 0,
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  );

  static final _darkOutlinedButtonTheme = OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primary,
      side: const BorderSide(color: AppColors.primary),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    ),
  );

  static final _darkTextButtonTheme = TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.primary,
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    ),
  );

  static final _darkInputDecorationTheme = InputDecorationTheme(
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.border, width: 1),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.border, width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.error, width: 1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.error, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    filled: true,
    fillColor: AppColors.surfaceVariant,
    labelStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
      color: AppColors.textSecondary,
    ),
    hintStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
      color: AppColors.textHint,
    ),
    prefixIconColor: AppColors.textSecondary,
    suffixIconColor: AppColors.textSecondary,
  );

  static const _darkDividerTheme = DividerThemeData(
    thickness: 1,
    color: AppColors.divider,
    space: 1,
  );

  static final _darkChipTheme = ChipThemeData(
    backgroundColor: AppColors.surfaceVariant,
    selectedColor: AppColors.primary,
    disabledColor: AppColors.surfaceVariant.withValues(alpha: 0.5),
    labelStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 13,
      color: AppColors.textPrimary,
    ),
    secondaryLabelStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 13,
      color: Colors.white,
    ),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: const BorderSide(color: AppColors.border),
    ),
    side: const BorderSide(color: AppColors.border),
    checkmarkColor: Colors.white,
  );

  static final _darkSwitchTheme = SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return Colors.white;
      return AppColors.textSecondary;
    }),
    trackColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary;
      return AppColors.surfaceVariant;
    }),
  );

  static final _darkCheckboxTheme = CheckboxThemeData(
    fillColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) return AppColors.primary;
      return Colors.transparent;
    }),
    checkColor: WidgetStateProperty.all(Colors.white),
    side: const BorderSide(color: AppColors.border, width: 1.5),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
  );

  static const _darkBottomNavTheme = BottomNavigationBarThemeData(
    backgroundColor: AppColors.navBackground,
    selectedItemColor: AppColors.navActive,
    unselectedItemColor: AppColors.navInactive,
    elevation: 0,
  );

  static final _darkPopupMenuTheme = PopupMenuThemeData(
    color: AppColors.surfaceVariant,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: AppColors.border),
    ),
    textStyle: const TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.textPrimary,
      fontSize: 14,
    ),
  );

  static final _darkDialogTheme = DialogThemeData(
    backgroundColor: AppColors.surface,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.border),
    ),
    titleTextStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: AppColors.textPrimary,
    ),
    contentTextStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
      color: AppColors.textSecondary,
      height: 1.5,
    ),
  );

  static final _darkSnackBarTheme = SnackBarThemeData(
    backgroundColor: AppColors.surfaceVariant,
    contentTextStyle: const TextStyle(
      fontFamily: _fontFamily,
      color: AppColors.textPrimary,
      fontSize: 14,
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(10),
    ),
    behavior: SnackBarBehavior.floating,
  );

  // ─────────────────────────────────────────────
  // Light component themes (fallback)
  // ─────────────────────────────────────────────

  static final _lightCardTheme = CardThemeData(
    elevation: 2,
    shadowColor: Colors.black.withValues(alpha: 0.08),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    clipBehavior: Clip.antiAlias,
  );

  static const _lightAppBarTheme = AppBarTheme(
    centerTitle: true,
    elevation: 0,
    scrolledUnderElevation: 0,
    backgroundColor: Colors.white,
    titleTextStyle: TextStyle(
      fontFamily: _fontFamily,
      fontSize: 17,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.3,
      color: Color(0xFF1A1A1A),
    ),
  );

  static final _lightNavigationBarTheme = NavigationBarThemeData(
    height: 65,
    indicatorShape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    labelTextStyle: WidgetStateProperty.all(
      const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    ),
  );

  static final _lightElevatedButtonTheme = ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      minimumSize: const Size(double.infinity, 48),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      elevation: 0,
      textStyle: const TextStyle(
        fontFamily: _fontFamily,
        fontSize: 15,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.1,
      ),
    ),
  );

  static final _lightInputDecorationTheme = InputDecorationTheme(
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(width: 1),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.grey.shade300, width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFC0392B), width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Colors.red, width: 1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Colors.red, width: 1.5),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    filled: true,
    labelStyle: const TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
    ),
    hintStyle: TextStyle(
      fontFamily: _fontFamily,
      fontSize: 14,
      color: Colors.grey.shade400,
    ),
  );

  static final _lightDividerTheme = DividerThemeData(
    thickness: 1,
    color: Colors.grey.shade100,
    space: 1,
  );
}
