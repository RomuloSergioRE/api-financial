import type { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';

export const TransactionController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      if (!req.body.categoryId) {
        res.status(400).json({ error: 'categoryId is required to link this transaction' });
        return;
      }

      const userId = req.user.id as string;
      const transaction = await TransactionService.create(userId, req.body);
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const userId = req.user.id as string;
      const transactions = await TransactionService.findByUser(userId);
      
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user.id as string;
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
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user.id as string;
      const updated = await TransactionService.update(id, userId, req.body);
      
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: 'Unauthorized: User missing' });
        return;
      }

      const id = req.params.id as string;
      const userId = req.user.id as string;
      await TransactionService.delete(id, userId);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};