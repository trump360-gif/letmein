// lib/features/consultation/data/consultation_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// ConsultationStatus
// ──────────────────────────────────────────────

enum ConsultationStatus {
  pending('pending', '진행중'),
  completed('completed', '완료'),
  cancelled('cancelled', '취소'),
  expired('expired', '만료');

  const ConsultationStatus(this.value, this.label);

  final String value;
  final String label;

  static ConsultationStatus fromString(String value) {
    return ConsultationStatus.values.firstWhere(
      (s) => s.value == value,
      orElse: () => ConsultationStatus.pending,
    );
  }
}

// ──────────────────────────────────────────────
// ConsultationRequest
// ──────────────────────────────────────────────

class ConsultationRequest {
  const ConsultationRequest({
    required this.id,
    required this.categoryId,
    required this.categoryName,
    required this.detailIds,
    required this.detailNames,
    required this.description,
    required this.preferredPeriod,
    required this.photoPublic,
    required this.status,
    this.expiresAt,
    required this.createdAt,
    required this.responseCount,
    required this.responses,
    this.photoUrls,
  });

  final int id;
  final int categoryId;
  final String categoryName;
  final List<int> detailIds;
  final List<String> detailNames;
  final String description;
  final String preferredPeriod;
  final bool photoPublic;
  final ConsultationStatus status;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final int responseCount;
  final List<dynamic> responses; // legacy field, kept for compat
  final List<String>? photoUrls;

  factory ConsultationRequest.fromJson(Map<String, dynamic> json) {
    final detailIdsList = (json['detailIds'] as List<dynamic>? ?? [])
        .map((e) => (e as num).toInt())
        .toList();
    final detailNamesList = (json['detailNames'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    final photoUrlsList = (json['photoUrls'] as List<dynamic>?)
        ?.map((e) => e as String)
        .toList();

    return ConsultationRequest(
      id: (json['id'] as num).toInt(),
      categoryId: (json['categoryId'] as num).toInt(),
      categoryName: json['categoryName'] as String? ?? '',
      detailIds: detailIdsList,
      detailNames: detailNamesList,
      description: json['description'] as String? ?? '',
      preferredPeriod: json['preferredPeriod'] as String? ?? '',
      photoPublic: json['photoPublic'] as bool? ?? false,
      status: ConsultationStatus.fromString(
          json['status'] as String? ?? 'pending'),
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      responseCount: (json['responseCount'] as num?)?.toInt() ?? 0,
      responses: const [],
      photoUrls: photoUrlsList,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'categoryId': categoryId,
        'categoryName': categoryName,
        'detailIds': detailIds,
        'detailNames': detailNames,
        'description': description,
        'preferredPeriod': preferredPeriod,
        'photoPublic': photoPublic,
        'status': status.value,
        'expiresAt': expiresAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'responseCount': responseCount,
        'photoUrls': photoUrls,
      };
}

// ──────────────────────────────────────────────
// CreateConsultationRequest (form payload)
// ──────────────────────────────────────────────

class CreateConsultationRequest {
  const CreateConsultationRequest({
    required this.categoryId,
    required this.detailIds,
    required this.description,
    required this.preferredPeriod,
    required this.photoPublic,
    this.photoIds,
  });

  final int categoryId;
  final List<int> detailIds;
  final String description;
  final String preferredPeriod;
  final bool photoPublic;
  final List<int>? photoIds;

  Map<String, dynamic> toJson() => {
        'categoryId': categoryId,
        'detailIds': detailIds,
        'description': description,
        'preferredPeriod': preferredPeriod,
        'photoPublic': photoPublic,
        if (photoIds != null && photoIds!.isNotEmpty) 'photoIds': photoIds,
      };
}

// ──────────────────────────────────────────────
// CoordinatorMatch
// ──────────────────────────────────────────────

class CoordinatorMatch {
  const CoordinatorMatch({
    required this.id,
    required this.requestId,
    required this.hospitalId,
    required this.hospitalName,
    this.hospitalProfileImage,
    this.hospitalAddress,
    this.note,
    required this.status,
    this.chatRoomId,
    required this.createdAt,
    this.isPremium = false,
    this.doctorInfo,
    this.treatmentCases,
    // Premium 확장 필드
    this.hospitalImageUrls,
    this.caseCount,
  });

  final int id;
  final int requestId;
  final int hospitalId;
  final String hospitalName;
  final String? hospitalProfileImage;
  final String? hospitalAddress;
  final String? note;
  final String status;
  final int? chatRoomId;
  final String createdAt;
  final bool isPremium;
  final String? doctorInfo;
  final List<String>? treatmentCases;
  // Premium 확장 필드
  final List<String>? hospitalImageUrls;
  final int? caseCount;

  factory CoordinatorMatch.fromJson(Map<String, dynamic> json) {
    final treatmentCasesList = (json['treatmentCases'] as List<dynamic>?)
        ?.map((e) => e as String)
        .toList();
    final imageUrlsList = (json['hospitalImageUrls'] as List<dynamic>? ??
            json['hospital_image_urls'] as List<dynamic>? ??
            [])
        .map((e) => e as String)
        .toList();

    return CoordinatorMatch(
      id: (json['id'] as num).toInt(),
      requestId: (json['requestId'] as num).toInt(),
      hospitalId: (json['hospitalId'] as num).toInt(),
      hospitalName: json['hospitalName'] as String,
      hospitalProfileImage: json['hospitalProfileImage'] as String?,
      hospitalAddress: json['hospitalAddress'] as String?,
      note: json['note'] as String?,
      status: json['status'] as String? ?? 'matched',
      chatRoomId: (json['chatRoomId'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String? ?? '',
      isPremium: json['isPremium'] as bool? ?? false,
      doctorInfo: json['doctorInfo'] as String?,
      treatmentCases: treatmentCasesList,
      hospitalImageUrls: imageUrlsList.isNotEmpty ? imageUrlsList : null,
      caseCount: (json['caseCount'] as num? ?? json['case_count'] as num?)
          ?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'requestId': requestId,
        'hospitalId': hospitalId,
        'hospitalName': hospitalName,
        'hospitalProfileImage': hospitalProfileImage,
        'hospitalAddress': hospitalAddress,
        'note': note,
        'status': status,
        'chatRoomId': chatRoomId,
        'createdAt': createdAt,
        'isPremium': isPremium,
        'doctorInfo': doctorInfo,
        'treatmentCases': treatmentCases,
        'hospitalImageUrls': hospitalImageUrls,
        'caseCount': caseCount,
      };
}
