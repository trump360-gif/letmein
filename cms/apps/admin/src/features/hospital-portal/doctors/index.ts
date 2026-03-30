export type { Doctor, DoctorsResponse, CreateDoctorData, UpdateDoctorData, OrderItem } from './api'
export {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorOrder,
} from './api'
export {
  doctorKeys,
  useDoctorsQuery,
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useUpdateDoctorOrderMutation,
} from './queries'
