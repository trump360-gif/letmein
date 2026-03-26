// lib/features/chat/data/centrifugo_client.dart
//
// Wraps the centrifuge-dart client for use via Riverpod.
// centrifuge-dart handles automatic reconnection internally.

import 'dart:async';
import 'dart:convert';
import 'package:centrifuge/centrifuge.dart' as centrifuge;
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

final centrifugoServiceProvider = Provider<CentrifugoService>((ref) {
  final service = CentrifugoService();
  ref.onDispose(service.dispose);
  return service;
});

// ──────────────────────────────────────────────
// CentrifugoService
// ──────────────────────────────────────────────

class CentrifugoService {
  static const String _wsUrl =
      'ws://localhost:8000/connection/websocket';

  centrifuge.Client? _client;

  // channel → subscription
  final Map<String, centrifuge.Subscription> _subscriptions = {};

  // ── Connect ─────────────────────────────

  /// Establish a WebSocket connection using the provided Centrifugo JWT.
  Future<void> connect(String token) async {
    // Disconnect existing client if any
    await disconnect();

    _client = centrifuge.createClient(
      _wsUrl,
      centrifuge.ClientConfig(
        token: token,
        // centrifuge-dart handles reconnection automatically via built-in
        // exponential back-off (minReconnectDelay → maxReconnectDelay).
      ),
    );

    await _client!.connect();
  }

  // ── Subscribe ────────────────────────────

  /// Subscribe to a channel and invoke [onMessage] for every publication.
  ///
  /// Channel name example: "chat:room_42"
  /// The published payload is JSON encoded; [onMessage] receives the decoded Map.
  Future<void> subscribe(
    String channel,
    void Function(Map<String, dynamic> data) onMessage,
  ) async {
    if (_client == null) return;

    // Avoid duplicate subscriptions.
    if (_subscriptions.containsKey(channel)) return;

    final sub = _client!.newSubscription(channel);

    sub.publication.listen((event) {
      try {
        final jsonString = utf8.decode(event.data);
        final decoded = jsonDecode(jsonString) as Map<String, dynamic>;
        onMessage(decoded);
      } catch (_) {
        // Ignore malformed payloads
      }
    });

    _subscriptions[channel] = sub;
    await sub.subscribe();
  }

  // ── Unsubscribe ──────────────────────────

  Future<void> unsubscribe(String channel) async {
    final sub = _subscriptions.remove(channel);
    if (sub == null) return;
    await sub.unsubscribe();
  }

  // ── Disconnect ───────────────────────────

  Future<void> disconnect() async {
    for (final sub in _subscriptions.values) {
      await sub.unsubscribe();
    }
    _subscriptions.clear();
    await _client?.disconnect();
    _client = null;
  }

  // ── Dispose ──────────────────────────────

  Future<void> dispose() async {
    await disconnect();
  }
}
