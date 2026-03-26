import 'package:flutter_test/flutter_test.dart';
import 'package:letmein_app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('App starts', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: LetMeInApp()));
    expect(find.text('LetMeIn'), findsOneWidget);
  });
}
