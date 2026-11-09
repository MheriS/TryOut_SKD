import {
  User,
  PublicPackageListItem,
  PackageListItem,
  TryoutPackage,
  ValidationReport,
  UserAttempt,
  SanitizedQuestion,
  ReviewData,
  DashboardStats,
  PassingGrades
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const currentUserId = localStorage.getItem('cat_user_id') || 'admin_1';
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-user-id', currentUserId);

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `HTTP Error ${res.status}`);
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth & Settings
  async getUsers(): Promise<User[]> {
    return fetchJson<User[]>('/auth/users');
  },
  async getCurrentUser(): Promise<User> {
    return fetchJson<User>('/auth/me');
  },
  async getSettings(): Promise<{ hasGeminiApiKey: boolean; maskedKey: string }> {
    return fetchJson<{ hasGeminiApiKey: boolean; maskedKey: string }>('/auth/settings');
  },
  async updateSettings(geminiApiKey: string): Promise<void> {
    await fetchJson('/auth/settings', {
      method: 'POST',
      body: JSON.stringify({ geminiApiKey })
    });
  },

  // Public / Student Packages
  async getPublicPackages(): Promise<PublicPackageListItem[]> {
    return fetchJson<PublicPackageListItem[]>('/packages');
  },
  async getPublicPackageDetail(id: string): Promise<any> {
    return fetchJson(`/packages/${id}`);
  },

  // Admin Packages
  async getAdminPackages(): Promise<PackageListItem[]> {
    return fetchJson<PackageListItem[]>('/admin/packages');
  },
  async getAdminPackageById(id: string): Promise<TryoutPackage & { versionAttempts: number; isLocked: boolean }> {
    return fetchJson(`/admin/packages/${id}`);
  },
  async createPackage(payload: {
    code?: string;
    title: string;
    description?: string;
    durationMinutes?: number;
    passingGrades?: PassingGrades;
    generateWithAi?: boolean;
    aiConfig?: {
      twk: number;
      tiu: number;
      tkp: number;
      difficulty: string;
      specificTopics?: string;
      geminiApiKey?: string;
    };
  }): Promise<{ message?: string; package: TryoutPackage }> {
    const currentUserId = localStorage.getItem('cat_user_id') || 'admin_1';
    const res = await fetch(`${API_BASE}/admin/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Gagal membuat paket tryout.');
    }
    return { message: data.message, package: data.data };
  },
  async updatePackage(id: string, payload: any): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async validatePackage(id: string, targetVersion?: string): Promise<ValidationReport> {
    return fetchJson<ValidationReport>(`/admin/packages/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion })
    });
  },
  async approvePackage(id: string, targetVersion?: string, approvedBy?: string): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion, approvedBy })
    });
  },
  async publishPackage(id: string, targetVersion?: string): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion })
    });
  },
  async archivePackage(id: string): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}/archive`, {
      method: 'POST'
    });
  },
  async restorePackage(id: string): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}/restore`, {
      method: 'POST'
    });
  },
  async createNewVersion(id: string, changelog: string): Promise<TryoutPackage> {
    return fetchJson<TryoutPackage>(`/admin/packages/${id}/new-version`, {
      method: 'POST',
      body: JSON.stringify({ changelog })
    });
  },
  async deletePackage(id: string): Promise<void> {
    await fetchJson(`/admin/packages/${id}`, {
      method: 'DELETE'
    });
  },

  // Student Attempt Operations (ZERO AI calls!)
  async startAttempt(packageId: string, userId: string): Promise<{
    attemptId: string;
    packageId: string;
    packageCode: string;
    packageTitle: string;
    packageVersion: string;
    attemptNumber: number;
    durationMinutes: number;
    totalQuestions: number;
  }> {
    return fetchJson('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ packageId, userId })
    });
  },
  async getAttemptQuestions(attemptId: string): Promise<{
    attempt: UserAttempt;
    durationMinutes: number;
    remainingSeconds: number;
    passingGrades: PassingGrades;
    questions: SanitizedQuestion[]; // SANITIZED: NO answers or explanations!
  }> {
    return fetchJson(`/attempts/${attemptId}/questions`);
  },
  async saveAttemptProgress(attemptId: string, answers: any, durationSeconds: number): Promise<void> {
    await fetchJson(`/attempts/${attemptId}/save`, {
      method: 'PUT',
      body: JSON.stringify({ answers, durationSeconds })
    });
  },
  async submitAttempt(attemptId: string, payload?: { answers?: any; durationSeconds?: number }): Promise<any> {
    return fetchJson(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload || {})
    });
  },
  async getAttemptReview(attemptId: string): Promise<ReviewData> {
    return fetchJson<ReviewData>(`/attempts/${attemptId}/review`);
  },
  async getUserAttempts(userId: string): Promise<UserAttempt[]> {
    return fetchJson<UserAttempt[]>(`/attempts/user/${userId}`);
  },
  async getPackageAttempts(packageId: string): Promise<UserAttempt[]> {
    return fetchJson<UserAttempt[]>(`/attempts/package/${packageId}`);
  },

  // Analytics
  async getAnalyticsDashboard(): Promise<{ stats: DashboardStats; recentAttempts: UserAttempt[] }> {
    return fetchJson('/analytics/dashboard');
  }
};
