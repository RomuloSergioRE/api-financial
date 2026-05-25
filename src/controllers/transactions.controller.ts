import type { Request, Response } from 'express';
import { z } from 'zod';
import { TransactionService } from '../services/transaction.service.js';
import type { TransactionUpdateInput } from '../types/transaction.types.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator.js';

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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      res.status(400).json({ error: error.message });
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
      const offset = (page - 1) * limit;

      const { rows, total } = await TransactionService.findByUser(userId, { offset, limit });
      
      res.status(200).json({
        data: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      res.status(400).json({ error: error.message }); 
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.issues });
        return;
      }
      res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};