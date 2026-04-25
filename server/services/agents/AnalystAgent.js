const BaseAgent = require('./BaseAgent');
const aiService = require('../ai.service');

class AnalystAgent extends BaseAgent {
  async run(input) {
    const result = await aiService.call({
      systemPrompt: this.doc.systemPrompt,
      userPrompt: `Analyze the following content. Return JSON with keys: quality_score (1-10), strengths (array), improvements (array), confidence (0-1), summary (string).\n\nContent:\n${input}`,
      provider: this.doc.aiProvider,
    });

    // Try to parse JSON, fallback to raw text
    try {
      const clean = result.text.replace(/```json|```/g, '').trim();
      return JSON.stringify(JSON.parse(clean));
    } catch {
      return result.text;
    }
  }
}

module.exports = AnalystAgent;
