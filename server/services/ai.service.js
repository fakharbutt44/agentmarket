const axios = require('axios');

class AIService {
  constructor() {
    this.geminiModel = null;
    this.gemini = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1',
      params: { key: process.env.GEMINI_API_KEY },
      timeout: 30000,
    });
    this.featherless = axios.create({
      baseURL: 'https://api.featherless.ai/v1',
      headers: { Authorization: `Bearer ${process.env.FEATHERLESS_API_KEY}` },
      timeout: 30000,
    });
  }

  async call({ systemPrompt, userPrompt, provider = 'gemini' }) {
    if (provider === 'featherless') return this._featherless(systemPrompt, userPrompt);
    return this._gemini(systemPrompt, userPrompt);
  }

  async listGeminiModels() {
    const res = await axios.get('https://generativelanguage.googleapis.com/v1/models', {
      params: { key: process.env.GEMINI_API_KEY },
      timeout: 30000,
    });

    console.log('Gemini models response:', res.data);
    return res.data?.models || [];
  }

  async getGeminiModel() {
    if (this.geminiModel) return this.geminiModel;

    const models = await this.listGeminiModels();
    const modelNames = models
      .filter((model) => model.name && (model.supportedGenerationMethods || []).includes('generateContent'))
      .map((model) => model.name);

    const configuredModel = process.env.GEMINI_MODEL;
    if (configuredModel && !modelNames.includes(configuredModel)) {
      throw new Error(`Configured GEMINI_MODEL is not available for this API key: ${configuredModel}`);
    }

    this.geminiModel = configuredModel || modelNames[0] || null;

    if (!this.geminiModel) {
      throw new Error('No Gemini model with generateContent support was found for this API key');
    }

    console.log('Gemini model selected:', this.geminiModel);
    return this.geminiModel;
  }

  async _gemini(systemPrompt, userPrompt) {
    const modelName = await this.getGeminiModel();
    const response = await this.gemini.post(`/${modelName}:generateContent`, {
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    });
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = response.data?.usageMetadata || {};
    return { text, promptTokens: usage.promptTokenCount || 0, responseTokens: usage.candidatesTokenCount || 0 };
  }

  async _featherless(systemPrompt, userPrompt) {
    const response = await this.featherless.post('/chat/completions', {
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    const text = response.data?.choices?.[0]?.message?.content || '';
    const usage = response.data?.usage || {};
    return { text, promptTokens: usage.prompt_tokens || 0, responseTokens: usage.completion_tokens || 0 };
  }
}

module.exports = new AIService();
