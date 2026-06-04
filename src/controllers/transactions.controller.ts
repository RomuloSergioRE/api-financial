import type { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import type { TransactionUpdateInput } from '../types/transaction.types.js';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction.validator.js';
import { linkTagsSchema } from '../validators/tag.validator.js';
import { ExportService } from '../services/export.service.js';
import { ImportService } from '../services/import.service.js';
import { setCsvHeaders } from '../utils/csv.util.js';

export const TransactionController = {
  create: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = createTransactionSchema.parse(req.body);
    const transactionData = {
      categoryId: validated.categoryId,
      description: validated.description,
      amount: validated.amount,
      type: validated.type,
      date: validated.date ? new Date(validated.date) : new Date(),
    };
    const transaction = await TransactionService.create(req.user.id, transactionData, req.user.organizationId);
    res.status(201).json(transaction);
  },

  getAll: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const parsed = transactionQuerySchema.parse(req.query);
    const offset = (parsed.page - 1) * parsed.limit;
    const tagIds = parsed.tags ? parsed.tags.split(',').filter(Boolean) : undefined;

    const { rows, total } = await TransactionService.findByUser(
      req.user.id, { offset, limit: parsed.limit }, parsed.categoryId, parsed.startDate, parsed.endDate, parsed.search, tagIds, req.user.organizationId
    );

    res.status(200).json({
      data: rows,
      pagination: { page: parsed.page, limit: parsed.limit, total, totalPages: Math.ceil(total / parsed.limit) },
    });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    const transaction = await TransactionService.findByIdAndUser(id, req.user.id, req.user.organizationId);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found or unauthorized' });
      return;
    }
    res.status(200).json(transaction);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const validated = updateTransactionSchema.parse(req.body);
    const id = req.params.id as string;
    const updateData: TransactionUpdateInput = {};
    if (validated.categoryId) updateData.categoryId = validated.categoryId;
    if (validated.description) updateData.description = validated.description;
    if (validated.amount !== undefined) updateData.amount = validated.amount;
    if (validated.type) updateData.type = validated.type;
    if (validated.date) updateData.date = new Date(validated.date);
    const updated = await TransactionService.update(id, req.user.id, updateData, req.user.organizationId);
    res.status(200).json(updated);
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const id = req.params.id as string;
    await TransactionService.delete(id, req.user.id, req.user.organizationId);
    res.status(204).send();
  },

  exportCSV: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const { content, filename } = await ExportService.exportTransactionsCSV(
      req.user.id,
      {
        categoryId: req.query.categoryId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
      },
      req.user.organizationId
    );
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  exportTemplate: async (req: Request, res: Response): Promise<void> => {
    const { content, filename } = ExportService.getTransactionCSVTemplate();
    setCsvHeaders(res, filename);
    res.status(200).send(content);
  },

  importCSV: async (req: Request, res: Response): Promise<void> => {
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
  },

  exportPDF: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const { buffer, filename } = await ExportService.exportTransactionsPDF(
      req.user.id,
      {
        categoryId: req.query.categoryId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
      },
      req.user.organizationId
    );
    res
      .contentType('application/pdf')
      .set('Content-Disposition', `inline; filename="${filename}"`)
      .status(200)
      .send(buffer);
  },

  addTags: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const transactionId = req.params.id as string;
    const { tagIds } = linkTagsSchema.parse(req.body);
    await TransactionService.linkTags(transactionId, req.user.id, tagIds, req.user.organizationId);
    const transaction = await TransactionService.findByIdAndUser(transactionId, req.user.id, req.user.organizationId);
    res.status(200).json(transaction);
  },

  removeTag: async (req: Request, res: Response): Promise<void> => {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized: User missing' });
      return;
    }
    const transactionId = req.params.id as string;
    const tagId = req.params.tagId as string;
    await TransactionService.unlinkTag(transactionId, req.user.id, tagId, req.user.organizationId);
    const transaction = await TransactionService.findByIdAndUser(transactionId, req.user.id, req.user.organizationId);
    res.status(200).json(transaction);
  },
};
