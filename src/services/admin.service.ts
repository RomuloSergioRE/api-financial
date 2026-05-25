import { AdminRepository } from '../repositories/admin.repository.js';
import { AnalyticsService } from './analytics.service.js';
import { AuditService } from './audit.service.js';
import type { UserInterface, Role, Status } from '../types/user.types.js';
import type { CategoryInterface, CategoryCreateInput, CategoryUpdateInput } from '../types/category.types.js';
import type { CategoryShareDTO } from '../types/analytics.types.js';

type UserDTO = Omit<UserInterface, 'password' | 'deletedAt'>;

const mapUserDTO = (user: UserInterface): UserDTO => {
  const { password, deletedAt, ...dto } = user;
  return dto;
};

function assertNotSelf(targetId: string, adminId: string, action: string): void {
  if (targetId === adminId) {
    throw new Error(`Cannot ${action} your own account.`);
  }
}

export const AdminService = {
  listUsers: async (
    filters: { role?: string; status?: string; search?: string },
    pagination: { offset: number; limit: number }
  ): Promise<{ rows: UserDTO[]; total: number }> => {
    const { rows, total } = await AdminRepository.listUsers(filters, pagination);
    return { rows: rows.map(mapUserDTO), total };
  },

  getUserDetails: async (userId: string): Promise<{
    user: UserDTO;
    totalTransactions: number;
    totalIncome: number;
    totalOutcome: number;
    netBalance: number;
  } | null> => {
    const result = await AdminRepository.getUserWithStats(userId);
    if (!result.user) return null;
    return {
      user: mapUserDTO(result.user),
      totalTransactions: result.totalTransactions,
      totalIncome: result.totalIncome,
      totalOutcome: result.totalOutcome,
      netBalance: result.totalIncome - result.totalOutcome,
    };
  },

  updateUserStatus: async (targetId: string, status: Status, adminId: string): Promise<UserDTO> => {
    assertNotSelf(targetId, adminId, 'update your own status');
    const updated = await AdminRepository.updateUser(targetId, { status });
    if (!updated) throw new Error('User not found');
    await AuditService.log(adminId, 'update_user_status', targetId, 'user', `Status changed to ${status}`);
    return mapUserDTO(updated);
  },

  updateUserRole: async (targetId: string, role: Role, adminId: string): Promise<UserDTO> => {
    assertNotSelf(targetId, adminId, 'update your own role');
    const updated = await AdminRepository.updateUser(targetId, { role });
    if (!updated) throw new Error('User not found');
    await AuditService.log(adminId, 'update_user_role', targetId, 'user', `Role changed to ${role}`);
    return mapUserDTO(updated);
  },

  deleteUser: async (targetId: string, adminId: string): Promise<void> => {
    assertNotSelf(targetId, adminId, 'delete');
    const success = await AdminRepository.deleteUser(targetId);
    if (!success) throw new Error('User not found');
    await AuditService.log(adminId, 'delete_user', targetId, 'user', 'User soft deleted');
  },

  createGlobalCategory: async (data: CategoryCreateInput): Promise<CategoryInterface> => {
    const category = await AdminRepository.createGlobalCategory(data);
    return category;
  },

  updateGlobalCategory: async (id: string, data: CategoryUpdateInput): Promise<CategoryInterface | null> => {
    const category = await AdminRepository.updateGlobalCategory(id, data);
    return category;
  },

  deleteGlobalCategory: async (id: string): Promise<void> => {
    const deleted = await AdminRepository.deleteGlobalCategory(id);
    if (!deleted) throw new Error('Global category not found');
  },

  getOverview: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalIncome: number;
    totalOutcome: number;
    netPlatformBalance: number;
  }> => {
    const overview = await AdminRepository.getOverview();
    return {
      ...overview,
      netPlatformBalance: overview.totalIncome - overview.totalOutcome,
    };
  },

  getUserAnalytics: async (userId: string): Promise<{
    balance: { totalIncome: number; totalOutcome: number; netBalance: number };
    categories: CategoryShareDTO[];
  } | null> => {
    const user = await AdminRepository.getUserWithStats(userId);
    if (!user.user) return null;

    const balance = await AnalyticsService.getBalanceSummary(userId, {});
    const categories = await AnalyticsService.getCategoryDistribution(userId, {});

    return { balance, categories };
  },
};
