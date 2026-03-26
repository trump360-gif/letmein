import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Displays a remote image served from the uploads directory.
///
/// Builds the full URL as `http://localhost:8080/uploads/<path>` and
/// delegates loading/caching to [CachedNetworkImage].  A shimmer-style
/// grey placeholder is shown while the image is loading and an error icon
/// is displayed if the network request fails.
class CachedImage extends StatelessWidget {
  /// The relative path returned by the media API (e.g. `"users/1/avatar.jpg"`).
  final String path;

  final double? width;
  final double? height;
  final BoxFit fit;

  static const String _baseUrl = 'http://localhost:8080/uploads/';

  const CachedImage({
    super.key,
    required this.path,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  String get _url => '$_baseUrl$path';

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: _url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => _ShimmerPlaceholder(
        width: width,
        height: height,
      ),
      errorWidget: (context, url, error) => _ErrorPlaceholder(
        width: width,
        height: height,
      ),
    );
  }
}

/// Animated shimmer-style loading placeholder.
class _ShimmerPlaceholder extends StatefulWidget {
  final double? width;
  final double? height;

  const _ShimmerPlaceholder({this.width, this.height});

  @override
  State<_ShimmerPlaceholder> createState() => _ShimmerPlaceholderState();
}

class _ShimmerPlaceholderState extends State<_ShimmerPlaceholder>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.4, end: 0.8).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: _animation.value),
        );
      },
    );
  }
}

/// Placeholder displayed when the image fails to load.
class _ErrorPlaceholder extends StatelessWidget {
  final double? width;
  final double? height;

  const _ErrorPlaceholder({this.width, this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Center(
        child: Icon(LucideIcons.imageOff, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3)),
      ),
    );
  }
}
