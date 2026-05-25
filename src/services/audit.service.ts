import AuditLog from '../models/audit.model.js';

export const AuditService = {
  log: async (adminId: string, action: string, targetId: string, targetType: string, details?: string): Promise<void> => {
    await AuditLog.create({ adminId, action, targetId, targetType, details: details || null });
  },
};
