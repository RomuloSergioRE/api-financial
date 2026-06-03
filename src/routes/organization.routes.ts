import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { OrganizationController } from '../controllers/organization.controller.js';

const router = Router();

router.use(authMiddleware);

// Organization CRUD
router.post('/', OrganizationController.create);
router.get('/', OrganizationController.list);
router.get('/:id', OrganizationController.getById);
router.put('/:id', OrganizationController.update);
router.delete('/:id', OrganizationController.delete);

// Context selection
router.patch('/:id/select', OrganizationController.select);
router.patch('/select-none', OrganizationController.selectNone);

// Members
router.get('/:id/members', OrganizationController.listMembers);
router.post('/:id/members', OrganizationController.inviteMember);
router.patch('/:id/members/:memberId/accept', OrganizationController.acceptInvite);
router.put('/:id/members/:memberId/role', OrganizationController.updateMemberRole);
router.delete('/:id/members/:memberId', OrganizationController.removeMember);

// Fiscal report
router.get('/:id/fiscal-report', OrganizationController.getFiscalReport);

export default router;
