const BaseAgent = require('./BaseAgent');
const aiService = require('../ai.service');

class ResearchAgent extends BaseAgent {
  async run(input) {
    const result = await aiService.call({
      systemPrompt: this.doc.systemPrompt,
      userPrompt: `Research the following topic and return structured key facts, context, and relevant data points:\n\n${input}`,
      provider: this.doc.aiProvider,
    });
    return result.text;
  }
}

module.exports = ResearchAgent;
