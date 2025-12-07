
import { User, Permission, Role, Delegation, ProjectRoleDefinition } from '../types';
import { MOCK_PERMISSIONS, MOCK_ROLES, MOCK_DELEGATIONS, MOCK_PROJECT_ROLE_DEFINITIONS } from './mockData';

export const permissionService = {
  
  /**
   * Core Logic: Check if a user has a specific permission.
   * Handles Global Roles, Delegations, and Scope Hierarchy.
   * 
   * @param user The current user context
   * @param permissionSlug The required permission slug (e.g., 'salary:view:dept')
   * @param resourceId Optional: The ID of the resource being accessed (for ownership checks)
   */
  hasPermission: (user: User | null, permissionSlug: string, resourceId?: string): boolean => {
    if (!user) return false;

    // 1. Superuser Check (Global Admin always passes)
    if (user.roles.includes('admin')) return true;

    // 2. Parse the requested permission
    // Convention: resource:action:scope (e.g. salary:view:dept)
    const [resource, action, scope] = permissionSlug.split(':');

    // 3. Get all active roles for the user (including Delegations)
    const activeRoleKeys = permissionService.getUserActiveRoles(user);

    // 4. Check if any active role has the permission
    // We need to find the Role objects matching the keys
    const userRoles = MOCK_ROLES.filter(r => activeRoleKeys.includes(r.key));
    
    // Flatten all permission IDs from all roles
    const userPermissionIds = userRoles.flatMap(r => r.permissionIds);
    
    // Find the Permission objects
    const userPermissions = MOCK_PERMISSIONS.filter(p => userPermissionIds.includes(p.id));

    // 5. Check for Exact Match or Higher Scope
    // e.g. If user has salary:view:all, they satisfy salary:view:dept
    return userPermissions.some(p => {
        const [pRes, pAct, pScope] = p.slug.split(':');
        
        if (pRes !== resource || pAct !== action) return false;

        // Scope Hierarchy Logic
        // all > dept > own
        const scopeWeight: Record<string, number> = { 'all': 3, 'dept': 2, 'own': 1 };
        const userScopeWeight = scopeWeight[pScope] || 0;
        const requiredScopeWeight = scopeWeight[scope] || 0;

        return userScopeWeight >= requiredScopeWeight;
    });
  },

  /**
   * Helper: Get all active roles including temporary delegations
   */
  getUserActiveRoles: (user: User): string[] => {
    const roles = [...user.roles];
    
    // Check Delegations
    const now = new Date();
    const activeDelegations = MOCK_DELEGATIONS.filter(d => 
      d.to_user_id === user.id &&
      d.is_active &&
      new Date(d.start_at) <= now &&
      new Date(d.end_at) >= now
    );

    activeDelegations.forEach(d => {
      if (!roles.includes(d.role_key)) {
        roles.push(d.role_key);
      }
    });

    return roles;
  },

  /**
   * Project Scope Logic: Check if user has capability within a specific project
   * @param user 
   * @param projectId 
   * @param capability e.g. 'view_cost', 'edit_tasks'
   */
  hasProjectCapability: (user: User | null, projectId: string, capability: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('admin')) return true; // Admin overrides

    const roleKey = user.project_roles[projectId];
    if (!roleKey) return false;

    const roleDef = MOCK_PROJECT_ROLE_DEFINITIONS.find(def => def.key === roleKey);
    if (!roleDef) return false;

    return !!roleDef.capabilities[capability];
  },

  // --- Delegation Management ---

  getDelegations: async (): Promise<Delegation[]> => {
    // Return mock delegations
    return [...MOCK_DELEGATIONS];
  },

  createDelegation: async (delegation: Partial<Delegation>): Promise<Delegation> => {
    const newDel: Delegation = {
      id: 'del-' + Date.now(),
      is_active: true,
      ...delegation as any
    };
    MOCK_DELEGATIONS.push(newDel);
    return newDel;
  },

  revokeDelegation: async (id: string): Promise<void> => {
    const idx = MOCK_DELEGATIONS.findIndex(d => d.id === id);
    if (idx !== -1) {
      MOCK_DELEGATIONS[idx].is_active = false;
    }
  }
};
