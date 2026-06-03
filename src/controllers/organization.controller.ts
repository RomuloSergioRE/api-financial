import type { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInviteSchema,
  fiscalReportQuerySchema,
} from '../validators/organization.validator.js';
import { handleControllerError } from '../utils/errors.js';

export const OrganizationController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = createOrganizationSchema.parse(req.body);
      const { organization, token } = await OrganizationService.create(req.user!.id, req.user!.role, name);
      res.status(201).json({ organization, token });
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  list: async (req: Request, res: Response): Promise<void> => {
    try {
      const organizations = await OrganizationService.list(req.user!.id);
      res.status(200).json(organizations);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const org = await OrganizationService.getById(orgId, req.user!.id);
      res.status(200).json(org);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const { name } = updateOrganizationSchema.parse(req.body);
      const org = await OrganizationService.update(orgId, req.user!.id, { name });
      res.status(200).json(org);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      await OrganizationService.delete(orgId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  select: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const { organization, token } = await OrganizationService.select(req.user!.id, req.user!.role, orgId);
      res.status(200).json({ organization, token });
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  selectNone: async (req: Request, res: Response): Promise<void> => {
    try {
      const token = await OrganizationService.clearContext(req.user!.id, req.user!.role);
      res.status(200).json({ token });
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  listMembers: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const members = await OrganizationService.listMembers(orgId, req.user!.id);
      res.status(200).json(members);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  inviteMember: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const { email, role } = inviteMemberSchema.parse(req.body);
      const result = await OrganizationService.inviteMember(orgId, req.user!.id, email, role);
      res.status(201).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  acceptInvite: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      acceptInviteSchema.parse(req.body);
      const result = await OrganizationService.acceptInvite(orgId, req.user!.id);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  updateMemberRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const targetUserId = req.params.memberId as string;
      const { role } = updateMemberRoleSchema.parse(req.body);
      const result = await OrganizationService.updateMemberRole(orgId, req.user!.id, targetUserId, role);
      res.status(200).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  removeMember: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const targetUserId = req.params.memberId as string;
      await OrganizationService.removeMember(orgId, req.user!.id, targetUserId);
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getFiscalReport: async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.params.id as string;
      const { year } = fiscalReportQuerySchema.parse(req.query);
      const report = await OrganizationService.getFiscalReport(orgId, req.user!.id, year);
      res.status(200).json(report);
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
