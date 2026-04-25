const BaseAgent = require('./BaseAgent');
const aiService = require('../ai.service');

class WriterAgent extends BaseAgent {
  async run(input) {
    const result = await aiService.call({
      systemPrompt: this.doc.systemPrompt,
      userPrompt: `Using the following research data, write a clear, well-structured and engaging response:\n\n${input}`,
      provider: this.doc.aiProvider,
    });
    return result.text;
  }
}

module.exports = WriterAgent;
