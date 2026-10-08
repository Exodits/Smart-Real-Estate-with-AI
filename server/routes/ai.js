import express from 'express';
import { analyzeInvestmentEvidence, answerUserQueryRAG } from '../services/ai.js';

const router = express.Router();

// 1. Evidence-Grounded Investment Evaluation
router.post('/investment', async (req, res) => {
  try {
    const evidence = req.body;
    if (!evidence || typeof evidence !== 'object') {
      return res.status(400).json({ error: 'Valid evidence object is required' });
    }

    const report = await analyzeInvestmentEvidence(evidence);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'AI Investment Advisor analysis failed', message: err.message });
  }
});

// 2. Section 28 & 31: Retrieval-Augmented Grounded Natural Language Query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query text is required (e.g. "I have 60 lakh, work near MIHAN and want a 2BHK")' });
    }

    const response = await answerUserQueryRAG(query);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'RAG Query processing failed', message: err.message });
  }
});

export default router;
