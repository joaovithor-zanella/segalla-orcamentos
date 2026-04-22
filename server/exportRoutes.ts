/**
 * Rotas Express para exportação de orçamentos.
 * Endpoints:
 *   GET /api/export/quote/:id/pdf   → Exporta em PDF
 *   GET /api/export/quote/:id/xlsx  → Exporta em Excel
 *   GET /api/export/quote/:id/docx  → Exporta em Word
 */

import { Router, Request, Response } from "express";
import { loadQuoteExportData, exportQuotePDF, exportQuoteXLSX, exportQuoteDOCX } from "./export";
import { sdk } from "./_core/sdk";

export function registerExportRoutes(app: Router) {
  const router = Router();

  // Middleware: verify authentication
  const requireAuth = async (req: Request, res: Response, next: () => void) => {
    try {
      await sdk.authenticateRequest(req);
      next();
    } catch {
      res.status(401).json({ error: "Não autenticado." });
    }
  };

  // PDF
  router.get("/quote/:id/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      const data = await loadQuoteExportData(quoteId);
      if (!data) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      const buffer = await exportQuotePDF(data);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="orcamento-${data.number}.pdf"`);
      res.send(buffer);
    } catch (err) {
      console.error("[Export PDF]", err);
      res.status(500).json({ error: "Erro ao gerar PDF." });
    }
  });

  // Excel
  router.get("/quote/:id/xlsx", requireAuth, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      const data = await loadQuoteExportData(quoteId);
      if (!data) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      const buffer = await exportQuoteXLSX(data);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="orcamento-${data.number}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      console.error("[Export XLSX]", err);
      res.status(500).json({ error: "Erro ao gerar Excel." });
    }
  });

  // Word
  router.get("/quote/:id/docx", requireAuth, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id);
      const data = await loadQuoteExportData(quoteId);
      if (!data) {
        res.status(404).json({ error: "Orçamento não encontrado." });
        return;
      }
      const buffer = await exportQuoteDOCX(data);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="orcamento-${data.number}.docx"`);
      res.send(buffer);
    } catch (err) {
      console.error("[Export DOCX]", err);
      res.status(500).json({ error: "Erro ao gerar Word." });
    }
  });

  app.use("/api/export", router);
}
