// lib/features/auction/data/auction_models.dart
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
// ConsultationResponse
// ──────────────────────────────────────────────

class ConsultationResponse {
  const ConsultationResponse({
    required this.id,
    required this.hospitalId,
    required this.hospitalName,
    this.hospitalImage,
    required this.specialties,
    this.intro,
    this.experience,
    required this.message,
    required this.consultMethods,
    this.consultHours,
    required this.createdAt,
  });

  final int id;
  final int hospitalId;
  final String hospitalName;
  final String? hospitalImage;
  final List<String> specialties;
  final String? intro;
  final String? experience;
  final String message;
  final List<String> consultMethods;
  final String? consultHours;
  final DateTime createdAt;

  factory ConsultationResponse.fromJson(Map<String, dynamic> json) {
    final specialtiesList = (json['specialties'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    final consultMethodsList =
        (json['consultMethods'] as List<dynamic>? ?? [])
            .map((e) => e as String)
            .toList();
    return ConsultationResponse(
      id: (json['id'] as num).toInt(),
      hospitalId: (json['hospitalId'] as num).toInt(),
      hospitalName: json['hospitalName'] as String,
      hospitalImage: json['hospitalImage'] as String?,
      specialties: specialtiesList,
      intro: json['intro'] as String?,
      experience: json['experience'] as String?,
      message: json['message'] as String,
      consultMethods: consultMethodsList,
      consultHours: json['consultHours'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'hospitalId': hospitalId,
        'hospitalName': hospitalName,
        'hospitalImage': hospitalImage,
        'specialties': specialties,
        'intro': intro,
        'experience': experience,
        'message': message,
        'consultMethods': consultMethods,
        'consultHours': consultHours,
        'createdAt': createdAt.toIso8601String(),
      };
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
  final List<ConsultationResponse> responses;
  final List<String>? photoUrls;

  factory ConsultationRequest.fromJson(Map<String, dynamic> json) {
    final detailIdsList = (json['detailIds'] as List<dynamic>? ?? [])
        .map((e) => (e as num).toInt())
        .toList();
    final detailNamesList = (json['detailNames'] as List<dynamic>? ?? [])
        .map((e) => e as String)
        .toList();
    final responsesList = (json['responses'] as List<dynamic>? ?? [])
        .map((e) =>
            ConsultationResponse.fromJson(e as Map<String, dynamic>))
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
      responses: responsesList,
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
        'responses': responses.map((r) => r.toJson()).toList(),
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
