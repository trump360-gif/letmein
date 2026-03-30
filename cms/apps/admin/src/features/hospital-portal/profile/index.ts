export type {
  HospitalProfile,
  ProfileUpdateData,
  HospitalSpecialty,
  SpecialtyCategory,
  SpecialtiesResponse,
} from './api'

export {
  fetchProfile,
  updateProfile,
  fetchImages,
  updateImages,
  fetchSpecialties,
  addSpecialty,
  removeSpecialty,
} from './api'

export {
  profileKeys,
  useProfileQuery,
  useUpdateProfileMutation,
  useImagesQuery,
  useUpdateImagesMutation,
  useSpecialtiesQuery,
  useAddSpecialtyMutation,
  useRemoveSpecialtyMutation,
} from './queries'
