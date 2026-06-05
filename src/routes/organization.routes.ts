import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { OrganizationController } from '../controllers/organization.controller.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInviteSchema,
  fiscalReportQuerySchema,
} from '../validators/organization.validator.js';

const router = Router();

router.use(authMiddleware);

// Organization CRUD
router.post('/', validate(createOrganizationSchema), OrganizationController.create);
router.get('/', OrganizationController.list);
router.get('/:id', OrganizationController.getById);
router.put('/:id', validate(updateOrganizationSchema), OrganizationController.update);
router.delete('/:id', OrganizationController.delete);

// Context selection
router.patch('/:id/select', OrganizationController.select);
router.patch('/select-none', OrganizationController.selectNone);

// Members
router.get('/:id/members', OrganizationController.listMembers);
router.post('/:id/members', validate(inviteMemberSchema), OrganizationController.inviteMember);
router.patch('/:id/accept', validate(acceptInviteSchema), OrganizationController.acceptInvite);
router.put('/:id/members/:memberId/role', validate(updateMemberRoleSchema), OrganizationController.updateMemberRole);
router.delete('/:id/members/:memberId', OrganizationController.removeMember);

// Fiscal report
router.get('/:id/fiscal-report', validate(fiscalReportQuerySchema, 'query'), OrganizationController.getFiscalReport);

export default router;
