import { AuthResponse, User, Role, Permission } from '../types';
import { MOCK_USERS, MOCK_ROLES, MOCK_PERMISSIONS } from './mockData';

// Simulate Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock "Redis" in localStorage for Lockout logic
const LOCK_KEY_PREFIX = 'nexus_lock_';
const FAIL_COUNT_PREFIX = 'nexus_fail_';

export const authService = {
  // FUNC_AUTH_01: Login Logic
  login: async (email: string, password: string, rememberMe: boolean): Promise<AuthResponse> => {
    await delay(800); // Simulate API latency

    // 2. Format Validation (Basic)
    if (!email || !password) {
      throw { code: 'E-AUTH-001', message: '欄位空或格式錯誤' };
    }

    // 4. Status Check (Lockout)
    const lockKey = `${LOCK_KEY_PREFIX}${email}`;
    const failKey = `${FAIL_COUNT_PREFIX}${email}`;
    
    const lockExpiresAt = localStorage.getItem(lockKey);
    if (lockExpiresAt && parseInt(lockExpiresAt) > Date.now()) {
      throw { code: 'E-AUTH-004', message: '帳號已鎖定，請於 15 分鐘後再試' };
    }

    // 3. User Query & 5. Password Verify
    const userRecord = MOCK_USERS[email];
    
    // Simulate invalid credential or user not found
    if (!userRecord || userRecord.passwordHash !== password) {
      // Increment Fail Count
      const currentFail = parseInt(localStorage.getItem(failKey) || '0') + 1;
      localStorage.setItem(failKey, currentFail.toString());

      if (currentFail >= 5) {
        // Lock for 15 minutes
        localStorage.setItem(lockKey, (Date.now() + 15 * 60 * 1000).toString());
        throw { code: 'E-AUTH-004', message: '錯誤次數 >= 5，帳號已鎖定' };
      }

      throw { code: 'E-AUTH-002', message: '帳號或密碼錯誤' };
    }

    // 6. Success Handling
    localStorage.removeItem(failKey);
    localStorage.removeItem(lockKey);

    const { passwordHash, ...userInfo } = userRecord;

    return {
      access_token: 'mock_jwt_access_' + Math.random().toString(36),
      refresh_token: 'mock_jwt_refresh_' + Math.random().toString(36),
      user: userInfo
    };
  },

  getMe: async (): Promise<User> => {
    // In a real app, we would parse the token from headers
    // Here we just return a mocked logged in user for simplicity if we were persisting session
    // For this demo, we rely on the returned User object from Login
    throw new Error("Not implemented in mock - use context");
  },

  // FUNC_AUTH_03 Helper: Get Roles
  getRoles: async (): Promise<Role[]> => {
    await delay(500);
    // Deep copy to prevent reference issues in mock
    return JSON.parse(JSON.stringify(MOCK_ROLES));
  },

  // FUNC_AUTH_03 Helper: Get Permissions
  getAllPermissions: async (): Promise<Permission[]> => {
    await delay(300);
    return MOCK_PERMISSIONS;
  },

  // FUNC_AUTH_03: Update Role Permissions
  updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<void> => {
    await delay(800);
    
    if (roleId === 'role_admin') {
       // Prevent locking out superuser (Logic #2 in 2.3.3)
       // Just a soft check here for demo
    }
    
    const roleIndex = MOCK_ROLES.findIndex(r => r.id === roleId);
    if (roleIndex > -1) {
      MOCK_ROLES[roleIndex].permissionIds = permissionIds;
    }
  }
};