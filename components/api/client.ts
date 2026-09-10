import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[DEPLOYMENT ERROR] NEXT_PUBLIC_API_URL environment variable is required for production deployment.');
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Domain Entity Interfaces
export interface AcademicSessionRecord {
  id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'CONCLUDED';
  description?: string | null;
  lecture_sessions_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentRecord {
  id: number;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface CourseRecord {
  id: number;
  name: string;
  code: string;
  department_id: number;
  lecturer_id?: number | null;
  level: number;
  credit_unit: number;
  semester: string;
  status: 'ACTIVE' | 'INACTIVE';
  department?: DepartmentRecord;
  lecturer?: { id: number; name: string; email: string };
}

export interface StaffRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  staff_id: string;
  department_id?: number;
  department?: DepartmentRecord;
}

export interface StudentRecord {
  id: number;
  name: string;
  email: string;
  matric_number: string;
  department_id: number;
  level: number;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
  status: string;
  department?: DepartmentRecord;
}

export interface LectureSessionRecord {
  id: number;
  course_id: number;
  lecturer_id: number;
  start_time: string;
  end_time?: string;
  location?: string;
  date?: string;
  status: 'ACTIVE' | 'ENDED';
  course?: CourseRecord;
  lecturer?: { id: number; name: string; email: string };
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  lecture_session_id: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  scanned_at?: string;
  method?: string;
  student?: StudentRecord;
  session?: LectureSessionRecord;
}

export interface StudentRegisterPayload {
  name: string;
  email: string;
  password: string;
  matric_number: string;
  department_id: number;
  level: number;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface SessionCreatePayload {
  course_id: number;
  title?: string;
  notes?: string;
}

// Request Interceptor to inject Token
apiClient.interceptors.request.use((config) => {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error: unknown) => {
  console.error('[API REQUEST ERROR]', error);
  return Promise.reject(error);
});

export interface NormalizedApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Helper function to extract and normalize error responses
export const extractErrorMessage = (error: unknown): string => {
  const normalized = normalizeApiError(error);
  if (normalized.errors) {
    const firstKey = Object.keys(normalized.errors)[0];
    if (firstKey && Array.isArray(normalized.errors[firstKey]) && normalized.errors[firstKey].length > 0) {
      return normalized.errors[firstKey][0];
    }
  }
  return normalized.message;
};

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (!error) {
    return {
      success: false,
      message: "An unexpected error occurred.",
      status: 500,
    };
  }

  const errObj = error as { response?: { status?: number; data?: { message?: string; error?: string; errors?: Record<string, string[]> } }; message?: string };
  const response = errObj.response;
  if (response) {
    const status = response.status || 500;
    const data = response.data || {};
    let message = data.message || data.error || "";
    const errors: Record<string, string[]> | undefined = data.errors || undefined;

    // Sanitize any raw SQL/PDO/Exception dumps
    if (
      typeof message === 'string' && (
        message.includes('SQLSTATE') ||
        message.includes('QueryException') ||
        message.includes('PDOException') ||
        message.includes('Illuminate\\Database') ||
        message.includes('Integrity constraint violation')
      )
    ) {
      message = (status === 409 || message.includes('Duplicate entry'))
        ? "Record already exists in the system."
        : "A database constraint issue occurred. Please check input values.";
    }

    // Default status messages if empty
    if (!message) {
      switch (status) {
        case 400: message = "Bad request. Please check input parameters."; break;
        case 401: message = "Unauthorized. Session expired or invalid credentials."; break;
        case 403: message = "Forbidden. You do not have permission for this action."; break;
        case 404: message = "Requested resource not found."; break;
        case 409: message = "Conflict. Record already exists in the database."; break;
        case 422: message = "Validation failed. Please fill all required fields correctly."; break;
        case 429: message = "Too many requests. Please wait a moment before trying again."; break;
        case 500: message = "Internal server error. Please try again later."; break;
        case 502: message = "Bad gateway. Server is temporarily unreachable."; break;
        case 503: message = "Service unavailable. System maintenance in progress."; break;
        case 504: message = "Gateway timeout. Server response timed out."; break;
        default: message = `Request failed with status ${status}`; break;
      }
    }

    return {
      success: false,
      message,
      errors: typeof errors === 'object' ? errors : undefined,
      status,
    };
  }

  // Network / Offline errors
  const isNetworkErr = errObj?.message === "Network Error";
  return {
    success: false,
    message: isNetworkErr
      ? "Network error. Please check your internet connection."
      : errObj?.message || "Unable to reach server. Please try again.",
    status: isNetworkErr ? 0 : 500,
  };
};

// Interceptor to handle API response errors cleanly and normalize error payload
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const normalized = normalizeApiError(error);

    // Normalize error.response.data in-place so all consumers receive unified { success: false, message, errors } payload
    if (error.response) {
      error.response.data = {
        success: false,
        message: normalized.message,
        errors: normalized.errors,
      };
    } else {
      error.message = normalized.message;
    }

    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    return Promise.reject(error);
  }
);

/* ==========================================================================
   AUTHENTICATION HOOKS
   ========================================================================== */

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.user) {
        queryClient.setQueryData(['authenticated-user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      }
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/admin/login';
      }
      queryClient.clear();
    },
    onError: () => {
      // Force logout on error anyway
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/admin/login';
      }
      queryClient.clear();
    }
  });
};

export const useProfile = () => {
  const { user, isLoading, refetchUser } = useAuth();
  return {
    data: user,
    isLoading,
    isError: !user && !isLoading,
    refetch: refetchUser,
  };
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/auth/change-password', payload);
      return data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/auth/forgot-password', payload);
      return data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/auth/reset-password', payload);
      return data;
    },
  });
};

/* ==========================================================================
   DASHBOARD STATS HOOKS
   ========================================================================== */

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/stats');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

/* ==========================================================================
   ACADEMIC SESSIONS CRUD HOOKS
   ========================================================================== */

export const useAcademicSessions = (params: { search?: string; status?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['academic-sessions', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/academic-sessions', { params });
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCurrentAcademicSession = () => {
  return useQuery<AcademicSessionRecord>({
    queryKey: ['current-academic-session'],
    queryFn: async () => {
      const { data } = await apiClient.get('/academic-sessions/current');
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateAcademicSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; start_date?: string; end_date?: string; is_current?: boolean; status?: string; description?: string }) => {
      const { data } = await apiClient.post('/academic-sessions', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-session'] });
    },
  });
};

export const useUpdateAcademicSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<AcademicSessionRecord> }) => {
      const { data } = await apiClient.put(`/academic-sessions/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-session'] });
    },
  });
};

export const useActivateAcademicSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/academic-sessions/${id}/activate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-session'] });
    },
  });
};

export const useDeleteAcademicSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/academic-sessions/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-session'] });
    },
  });
};

/* ==========================================================================
   DEPARTMENTS CRUD HOOKS
   ========================================================================== */

export const useDepartments = (params: { search?: string; status?: string; archived?: boolean; page?: number; per_page?: number } = {}, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/departments', { params });
      return data;
    },
    enabled: (options.enabled ?? true) && typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/departments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await apiClient.put(`/departments/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/departments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useArchiveDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/departments/${id}/archive`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useRestoreDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/departments/${id}/restore`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

/* ==========================================================================
   COURSES CRUD HOOKS
   ========================================================================== */

export const useCourses = (params: { search?: string; department_id?: string; lecturer_id?: string; level?: string; semester?: string; status?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/courses', { params });
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/courses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await apiClient.put(`/courses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/courses/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/* ==========================================================================
   STAFF CRUD HOOKS
   ========================================================================== */

export const useStaffList = (params: { search?: string; department_id?: string; role?: string; status?: string; page?: number; per_page?: number } = {}, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/staff', { params });
      return data;
    },
    enabled: (options.enabled ?? true) && typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/staff', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await apiClient.put(`/staff/${id}`, payload);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staff-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const currentUser = JSON.parse(storedUser);
            if (currentUser && (currentUser.id === variables.id || currentUser.id === data.id)) {
              const updatedUser = {
                ...currentUser,
                name: data.name || currentUser.name,
                email: data.email || currentUser.email,
                role: data.role || currentUser.role,
                status: data.status || currentUser.status,
                profile: data.staff_profile || data.profile || currentUser.profile,
              };
              localStorage.setItem('auth_user', JSON.stringify(updatedUser));
              queryClient.setQueryData(['authenticated-user'], updatedUser);
            }
          } catch {
            // Ignore
          }
        }
      }
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/staff/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

/* ==========================================================================
   STUDENTS CRUD HOOKS
   ========================================================================== */

export const useStudents = (params: { search?: string; department_id?: string; course_id?: string; level?: string; status?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/students', { params });
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/students', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const { data } = await apiClient.put(`/students/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(`/students/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

/* ==========================================================================
   LECTURE SESSIONS CRUD HOOKS
   ========================================================================== */

export const useSessions = (params: { search?: string; department_id?: string; course_id?: string; lecturer_id?: string; date?: string; status?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sessions', { params });
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/sessions', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useGenerateQrToken = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/sessions/${id}/qr-token`);
      return data;
    },
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/sessions/${id}/end`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

/* ==========================================================================
   ATTENDANCE & REPORT HOOKS
   ========================================================================== */

export const useScanQr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { token: string; latitude?: number; longitude?: number }) => {
      const { data } = await apiClient.post('/attendance/scan', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      queryClient.invalidateQueries({ queryKey: ['live-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useAttendanceHistory = (params: { student_id?: string; course_id?: string; department_id?: string; status?: string; date?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: ['attendance-history', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/attendance/history', { params });
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token'),
  });
};

export const useLiveAttendance = (sessionId: number) => {
  return useQuery({
    queryKey: ['live-attendance', sessionId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/attendance/live/${sessionId}`);
      return data;
    },
    refetchInterval: 5000, // Autorefresh every 5 seconds for live attendance monitoring
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !!sessionId,
  });
};

export const useStaffDetails = (id: number) => {
  return useQuery({
    queryKey: ['staff-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/staff/${id}`);
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !!id,
  });
};

export const useStudentDetails = (id: number) => {
  return useQuery({
    queryKey: ['student-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/students/${id}`);
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !!id,
  });
};

export const useDepartmentDetails = (id: number) => {
  return useQuery({
    queryKey: ['department-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/departments/${id}`);
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !!id,
  });
};

export const useSessionDetails = (id: number) => {
  return useQuery({
    queryKey: ['session-detail', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sessions/${id}`);
      return data;
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !!id,
  });
};

export const useStudentRegister = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/auth/student-register', payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
      return data;
    },
  });
};
