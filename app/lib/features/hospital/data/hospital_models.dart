// lib/features/hospital/data/hospital_models.dart
//
// Manual fromJson/toJson — no build_runner required.

// ──────────────────────────────────────────────
// ProcedureDetailModel
// ──────────────────────────────────────────────

class ProcedureDetailModel {
  const ProcedureDetailModel({
    required this.id,
    required this.name,
  });

  final int id;
  final String name;

  factory ProcedureDetailModel.fromJson(Map<String, dynamic> json) {
    return ProcedureDetailModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
      };
}

// ──────────────────────────────────────────────
// ProcedureCategoryModel
// ──────────────────────────────────────────────

class ProcedureCategoryModel {
  const ProcedureCategoryModel({
    required this.id,
    required this.name,
    required this.icon,
    required this.details,
  });

  final int id;
  final String name;
  final String icon;
  final List<ProcedureDetailModel> details;

  factory ProcedureCategoryModel.fromJson(Map<String, dynamic> json) {
    final detailsList = (json['details'] as List<dynamic>? ?? [])
        .map((e) => ProcedureDetailModel.fromJson(e as Map<String, dynamic>))
        .toList();
    return ProcedureCategoryModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      icon: json['icon'] as String? ?? '',
      details: detailsList,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'icon': icon,
        'details': details.map((d) => d.toJson()).toList(),
      };
}

// ──────────────────────────────────────────────
// SpecialtyModel  (used inside HospitalModel)
// ──────────────────────────────────────────────

class SpecialtyModel {
  const SpecialtyModel({
    required this.id,
    required this.name,
  });

  final int id;
  final String name;

  factory SpecialtyModel.fromJson(Map<String, dynamic> json) {
    return SpecialtyModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
      };
}

// ──────────────────────────────────────────────
// HospitalDoctor  (premium only)
// ──────────────────────────────────────────────

class HospitalDoctor {
  const HospitalDoctor({
    required this.id,
    required this.name,
    this.specialty,
    this.profileImage,
    this.career,
  });

  final int id;
  final String name;
  final String? specialty;
  final String? profileImage;
  final String? career;

  factory HospitalDoctor.fromJson(Map<String, dynamic> json) {
    return HospitalDoctor(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String? ?? '',
      specialty: json['specialty'] as String?,
      profileImage:
          json['profileImage'] as String? ?? json['profile_image'] as String?,
      career: json['career'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'specialty': specialty,
        'profileImage': profileImage,
        'career': career,
      };
}

// ──────────────────────────────────────────────
// HospitalListItem  (compact — for search results)
// ──────────────────────────────────────────────

class HospitalListItem {
  const HospitalListItem({
    required this.id,
    required this.name,
    this.profileImage,
    required this.specialties,
    required this.address,
    required this.reviewCount,
    this.isPremium = false,
    this.premiumTier,
    this.imageUrls = const [],
  });

  final int id;
  final String name;
  final String? profileImage;
  final List<SpecialtyModel> specialties;
  final String address;
  final int reviewCount;
  // Premium fields
  final bool isPremium;
  final String? premiumTier; // basic, pro
  final List<String> imageUrls;

  factory HospitalListItem.fromJson(Map<String, dynamic> json) {
    final rawSpecialties = json['specialties'] as List<dynamic>? ??
        json['specialty_names'] as List<dynamic>? ??
        [];
    final specialtiesList = rawSpecialties.map((e) {
      if (e is Map<String, dynamic>) {
        return SpecialtyModel.fromJson(e);
      }
      // Server returns specialty_names as string array
      return SpecialtyModel(id: 0, name: e.toString());
    }).toList();
    final urls = (json['imageUrls'] as List<dynamic>? ??
            json['image_urls'] as List<dynamic>? ??
            [])
        .map((e) => e as String)
        .toList();
    return HospitalListItem(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      profileImage: json['profileImage'] as String? ?? json['profile_image'] as String?,
      specialties: specialtiesList,
      address: json['address'] as String? ?? '',
      reviewCount: (json['reviewCount'] as num?)?.toInt() ??
          (json['review_count'] as num?)?.toInt() ?? 0,
      isPremium:
          json['isPremium'] as bool? ?? json['is_premium'] as bool? ?? false,
      premiumTier: json['premiumTier'] as String? ??
          json['premium_tier'] as String?,
      imageUrls: urls,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'profileImage': profileImage,
        'specialties': specialties.map((s) => s.toJson()).toList(),
        'address': address,
        'reviewCount': reviewCount,
        'isPremium': isPremium,
        'premiumTier': premiumTier,
        'imageUrls': imageUrls,
      };
}

// ──────────────────────────────────────────────
// HospitalModel  (full detail)
// ──────────────────────────────────────────────

class HospitalModel {
  const HospitalModel({
    required this.id,
    required this.name,
    this.description,
    required this.address,
    this.phone,
    this.operatingHours,
    this.profileImage,
    required this.specialties,
    required this.reviewCount,
    // Premium fields
    this.isPremium = false,
    this.premiumTier,
    this.introVideoUrl,
    this.detailedDescription,
    this.caseCount,
    this.doctors,
    this.imageUrls = const [],
  });

  final int id;
  final String name;
  final String? description;
  final String address;
  final String? phone;
  final String? operatingHours;
  final String? profileImage;
  final List<SpecialtyModel> specialties;
  final int reviewCount;
  // Premium fields
  final bool isPremium;
  final String? premiumTier; // basic, pro
  final String? introVideoUrl;
  final String? detailedDescription;
  final int? caseCount;
  final List<HospitalDoctor>? doctors;
  final List<String> imageUrls;

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    final rawSpecialties = json['specialties'] as List<dynamic>? ??
        json['specialty_names'] as List<dynamic>? ??
        [];
    final specialtiesList = rawSpecialties.map((e) {
      if (e is Map<String, dynamic>) {
        return SpecialtyModel.fromJson(e);
      }
      // Server returns specialty_names as string array
      return SpecialtyModel(id: 0, name: e.toString());
    }).toList();
    final doctorsList = (json['doctors'] as List<dynamic>?)
        ?.map((e) => HospitalDoctor.fromJson(e as Map<String, dynamic>))
        .toList();
    final urls = (json['imageUrls'] as List<dynamic>? ??
            json['image_urls'] as List<dynamic>? ??
            [])
        .map((e) => e as String)
        .toList();
    return HospitalModel(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String? ?? '',
      phone: json['phone'] as String?,
      operatingHours: json['operatingHours'] as String?,
      profileImage: json['profileImage'] as String? ?? json['profile_image'] as String?,
      specialties: specialtiesList,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ??
          (json['review_count'] as num?)?.toInt() ?? 0,
      isPremium:
          json['isPremium'] as bool? ?? json['is_premium'] as bool? ?? false,
      premiumTier: json['premiumTier'] as String? ??
          json['premium_tier'] as String?,
      introVideoUrl: json['introVideoUrl'] as String? ??
          json['intro_video_url'] as String?,
      detailedDescription: json['detailedDescription'] as String? ??
          json['detailed_description'] as String?,
      caseCount: (json['caseCount'] as num? ?? json['case_count'] as num?)
          ?.toInt(),
      doctors: doctorsList,
      imageUrls: urls,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'address': address,
        'phone': phone,
        'operatingHours': operatingHours,
        'profileImage': profileImage,
        'specialties': specialties.map((s) => s.toJson()).toList(),
        'reviewCount': reviewCount,
        'isPremium': isPremium,
        'premiumTier': premiumTier,
        'introVideoUrl': introVideoUrl,
        'detailedDescription': detailedDescription,
        'caseCount': caseCount,
        'doctors': doctors?.map((d) => d.toJson()).toList(),
        'imageUrls': imageUrls,
      };
}

// ──────────────────────────────────────────────
// PaginatedResult<T>
// ──────────────────────────────────────────────

class PaginatedResult<T> {
  const PaginatedResult({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<T> items;
  final int total;
  final int page;
  final int limit;

  bool get hasMore => page * limit < total;
}

// ──────────────────────────────────────────────
// DashboardStats
// ──────────────────────────────────────────────

class DashboardStats {
  const DashboardStats({
    required this.totalConsultations,
    required this.pendingConsultations,
    required this.totalReviews,
    required this.averageRating,
  });

  final int totalConsultations;
  final int pendingConsultations;
  final int totalReviews;
  final double averageRating;

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalConsultations:
          (json['totalConsultations'] as num?)?.toInt() ?? 0,
      pendingConsultations:
          (json['pendingConsultations'] as num?)?.toInt() ?? 0,
      totalReviews: (json['totalReviews'] as num?)?.toInt() ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
