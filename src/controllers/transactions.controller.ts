import type { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import type { TransactionUpdateInput } from '../types/transaction.types.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator.js';
import { handleControllerError } from '../utils/errors.js';
import { ExportService } from '../services/export.service.js';
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
      const transactionData = {
        categoryId: validated.categoryId,
        description: validated.description,
        amount: validated.amount,
        type: validated.type,
        date: validated.date ? new Date(validated.date) : new Date(),
      };
      const transaction = await TransactionService.create(userId, transactionData);
      
      res.status(201).json(transaction);
    } catch (error) {
      handleControllerError(res, error);
    }
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const userId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const categoryId = req.query.categoryId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const search = req.query.search as string | undefined;
      const offset = (page - 1) * limit;

      const { rows, total } = await TransactionService.findByUser(userId, { offset, limit }, categoryId, startDate, endDate, search);
      
      res.status(200).json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      const transaction = await TransactionService.findByIdAndUser(id, userId);
      
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
      const updateData: TransactionUpdateInput = {};
      if (validated.categoryId) updateData.categoryId = validated.categoryId;
      if (validated.description) updateData.description = validated.description;
      if (validated.amount !== undefined) updateData.amount = validated.amount;
      if (validated.type) updateData.type = validated.type;
      if (validated.date) updateData.date = new Date(validated.date);
      const updated = await TransactionService.update(id, userId, updateData);
      
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
      await TransactionService.delete(id, userId);
      
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
        { categoryId, startDate, endDate, search }
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
        { categoryId, startDate, endDate, search }
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
};