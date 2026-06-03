import type { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import type { TransactionUpdateInput } from '../types/transaction.types.js';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction.validator.js';
import { linkTagsSchema } from '../validators/tag.validator.js';
import { handleControllerError } from '../utils/errors.js';
import { ExportService } from '../services/export.service.js';
import { ImportService } from '../services/import.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';

export const TransactionController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const validated = createTransactionSchema.parse(req.body);
      const userId = req.user.id;
      const orgId = req.user.organizationId;
      const transactionData = {
        categoryId: validated.categoryId,
        description: validated.description,
        amount: validated.amount,
        type: validated.type,
        date: validated.date ? new Date(validated.date) : new Date(),
      };
      const transaction = await TransactionService.create(userId, transactionData, orgId);
      
      res.status(201).json(transaction);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = transactionQuerySchema.parse(req.query);
      const userId = req.user!.id;
      const orgId = req.user!.organizationId;
      const offset = (parsed.page - 1) * parsed.limit;
      const tagIds = parsed.tags ? parsed.tags.split(',').filter(Boolean) : undefined;

      const { rows, total } = await TransactionService.findByUser(
        userId, { offset, limit: parsed.limit }, parsed.categoryId, parsed.startDate, parsed.endDate, parsed.search, tagIds, orgId
      );
      
      res.status(200).json({
        data: rows,
        pagination: { page: parsed.page, limit: parsed.limit, total, totalPages: Math.ceil(total / parsed.limit) },
      });
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user.id;
      const orgId = req.user.organizationId;
      const transaction = await TransactionService.findByIdAndUser(id, userId, orgId);
      
      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found or unauthorized' });
        return;
      }
      
      res.status(200).json(transaction);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const validated = updateTransactionSchema.parse(req.body);
      const id = req.params.id as string;
      const userId = req.user.id;
      const orgId = req.user.organizationId;
      const updateData: TransactionUpdateInput = {};
      if (validated.categoryId) updateData.categoryId = validated.categoryId;
      if (validated.description) updateData.description = validated.description;
      if (validated.amount !== undefined) updateData.amount = validated.amount;
      if (validated.type) updateData.type = validated.type;
      if (validated.date) updateData.date = new Date(validated.date);
      const updated = await TransactionService.update(id, userId, updateData, orgId);
      
      res.status(200).json(updated);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user.id;
      const orgId = req.user.organizationId;
      await TransactionService.delete(id, userId, orgId);
      
      res.status(204).send();
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  exportCSV: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const categoryId = req.query.categoryId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;

      const { content, filename } = await ExportService.exportTransactionsCSV(
        req.user.id,
        { categoryId, startDate, endDate, search },
        req.user.organizationId
      );

      setCsvHeaders(res, filename);
      res.status(200).send(content);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  exportTemplate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, filename } = ExportService.getTransactionCSVTemplate();
      setCsvHeaders(res, filename);
      res.status(200).send(content);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  importCSV: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded. Send a CSV file in the "file" field.' });
        return;
      }

      const result = await ImportService.importTransactions(req.user.id, file.buffer, req.user.organizationId);

      if (result.errors.length > 0 && result.imported === 0) {
        res.status(422).json(result);
        return;
      }

      res.status(result.errors.length > 0 ? 207 : 200).json(result);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  exportPDF: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const categoryId = req.query.categoryId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;

      const { buffer, filename } = await ExportService.exportTransactionsPDF(
        req.user.id,
        { categoryId, startDate, endDate, search },
        req.user.organizationId
      );

      res
        .contentType('application/pdf')
        .set('Content-Disposition', `inline; filename="${filename}"`)
        .status(200)
        .send(buffer);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  addTags: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const transactionId = req.params.id as string;
      const { tagIds } = linkTagsSchema.parse(req.body);

      await TransactionService.linkTags(transactionId, req.user.id, tagIds, req.user.organizationId);

      const transaction = await TransactionService.findByIdAndUser(transactionId, req.user.id, req.user.organizationId);
      res.status(200).json(transaction);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  removeTag: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const transactionId = req.params.id as string;
      const tagId = req.params.tagId as string;

      await TransactionService.unlinkTag(transactionId, req.user.id, tagId, req.user.organizationId);

      const transaction = await TransactionService.findByIdAndUser(transactionId, req.user.id, req.user.organizationId);
      res.status(200).json(transaction);
    } catch (error) {
      handleControllerError(res, error);
    }
  },
};
