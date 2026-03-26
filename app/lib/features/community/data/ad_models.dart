// lib/features/community/data/ad_models.dart
//
// Feed ad models — no build_runner required.

class AdFeedItem {
  const AdFeedItem({
    required this.campaignId,
    required this.hospitalId,
    required this.hospitalName,
    required this.imageUrl,
    required this.headline,
  });

  final int campaignId;
  final int hospitalId;
  final String hospitalName;
  final String imageUrl;
  final String headline;

  factory AdFeedItem.fromJson(Map<String, dynamic> json) {
    return AdFeedItem(
      campaignId:
          (json['campaignId'] as num? ?? json['campaign_id'] as num? ?? 0)
              .toInt(),
      hospitalId:
          (json['hospitalId'] as num? ?? json['hospital_id'] as num? ?? 0)
              .toInt(),
      hospitalName: json['hospitalName'] as String? ??
          json['hospital_name'] as String? ??
          '',
      imageUrl: json['imageUrl'] as String? ??
          json['image_url'] as String? ??
          '',
      headline: json['headline'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'campaignId': campaignId,
        'hospitalId': hospitalId,
        'hospitalName': hospitalName,
        'imageUrl': imageUrl,
        'headline': headline,
      };
}
