// lib/shared/utils/keyword_filter.dart
//
// 금액·외부 연락처 키워드 필터링 유틸리티
// 채팅 메시지 및 상담 텍스트 입력에 적용.

class KeywordFilter {
  KeywordFilter._();

  static final _pricePatterns = [
    RegExp(r'\d+만\s*원'),
    RegExp(r'\d+원'),
    RegExp(r'\d+만'),
    RegExp(r'가격|비용|할인|이벤트가|세일'),
  ];

  static final _contactPatterns = [
    RegExp(r'010-?\d{4}-?\d{4}'),
    RegExp(r'카카오톡|카톡|오픈채팅'),
    RegExp(r'@\w+'),
  ];

  static bool containsPrice(String text) =>
      _pricePatterns.any((p) => p.hasMatch(text));

  static bool containsContact(String text) =>
      _contactPatterns.any((p) => p.hasMatch(text));

  /// 위반 시 에러 메시지 반환, 정상이면 null 반환
  static String? validate(String text) {
    if (containsPrice(text)) return '금액 정보는 입력할 수 없습니다';
    if (containsContact(text)) return '외부 연락처는 입력할 수 없습니다';
    return null;
  }
}
