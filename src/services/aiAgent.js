// AI Agent Service for Flow Builder
// This service handles natural language processing and flow generation

class AIFlowAgent {
  constructor(config = null) {
    this.conversationHistory = [];
    this.currentFlowContext = null;
    this.config = config || this.loadConfig();
    
    console.log('🤖 AIFlowAgent initialized with config:', {
      provider: this.config.provider,
      hasApiKey: !!this.config.apiKey,
      model: this.config.model,
      configSource: config ? 'provided' : 'localStorage'
    });
  }

  loadConfig() {
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    // Default to mock provider
    return {
      provider: 'mock',
      apiKey: '',
      endpoint: '',
      model: 'mock-v1',
      temperature: 0.3,
      maxTokens: 1000
    };
  }

  // Test connection to the AI provider
  async testConnection() {
    try {
      switch (this.config.provider) {
        case 'mock':
          return { success: true, model: 'mock-v1' };
          
        case 'openai':
          return await this.testOpenAI();
          
        case 'claude':
          return await this.testClaude();
          
        case 'ollama':
          return await this.testOllama();
          
        case 'azure':
          return await this.testAzureOpenAI();
          
        case 'bedrock':
          return await this.testBedrock();
          
        case 'deepseek':
          return await this.testDeepSeek();
          
        case 'custom':
          return await this.testCustomAPI();
          
        default:
          throw new Error('Unknown AI provider');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testOpenAI() {
    console.log('🤖 Testing OpenAI connection...');
    console.log('🤖 API Key format:', this.config.apiKey ? `${this.config.apiKey.substring(0, 7)}...` : 'MISSING');
    
    try {
      // First try the models endpoint
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🤖 Models endpoint response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🤖 Models endpoint error:', errorText);
        
        // If models endpoint fails, try a simple chat completion as fallback
        return await this.testOpenAIWithChat();
      }
      
      const data = await response.json();
      console.log('🤖 Available models:', data.data?.length || 0);
      
      return { 
        success: true, 
        model: this.config.model,
        availableModels: data.data?.length || 0
      };
    } catch (error) {
      console.error('🤖 OpenAI test error:', error);
      // Fallback to chat completion test
      return await this.testOpenAIWithChat();
    }
  }

  async testOpenAIWithChat() {
    console.log('🤖 Fallback: Testing with chat completion...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5
        })
      });

      console.log('🤖 Chat completion test status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 Chat completion error:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🤖 Chat completion test successful');
      
      return { 
        success: true, 
        model: this.config.model || 'gpt-3.5-turbo'
      };
    } catch (error) {
      console.error('🤖 Chat completion test failed:', error);
      throw error;
    }
  }

  async testClaude() {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    return { success: true, model: this.config.model };
  }

  async testOllama() {
    const endpoint = this.config.endpoint || 'http://localhost:11434';
    const response = await fetch(`${endpoint}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama connection error: ${response.status}`);
    }
    
    const data = await response.json();
    return { 
      success: true, 
      model: this.config.model,
      availableModels: data.models?.length || 0
    };
  }

  async testAzureOpenAI() {
    // Azure OpenAI test implementation
    const response = await fetch(`${this.config.endpoint}/openai/deployments?api-version=2023-05-15`, {
      headers: {
        'api-key': this.config.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Azure OpenAI error: ${response.status}`);
    }
    
    return { success: true, model: this.config.model };
  }

  async testBedrock() {
    // AWS Bedrock test - would need AWS SDK integration
    return { success: true, model: this.config.model };
  }

  async testDeepSeek() {
    const response = await fetch(`${this.config.endpoint || 'https://api.deepseek.com/v1'}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    return { success: true, model: this.config.model };
  }

  async testCustomAPI() {
    // Test custom OpenAI-compatible API
    const response = await fetch(`${this.config.endpoint}/models`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status}`);
    }
    
    return { success: true, model: this.config.model };
  }

  // Main entry point for natural language input
  async processNaturalLanguage(userInput) {
    const intent = await this.parseIntent(userInput);
    const questions = this.generateClarifyingQuestions(intent);
    
    if (questions.length > 0) {
      return {
        type: 'questions',
        questions: questions,
        partialFlow: intent.partialFlow
      };
    }
    
    const flowData = await this.generateFlow(intent);
    
    // Pass through fallback information if present
    if (intent.isUsingFallback) {
      flowData.isUsingFallback = true;
      flowData.fallbackReason = intent.fallbackReason;
    }
    
    return {
      type: 'flow',
      flowData: flowData
    };
  }

  // Enhanced mock implementation for better intelligence
  parseIntentMock(input) {
    console.log('🤖 Using enhanced mock AI for parsing:', input);
    
    const keywords = this.extractKeywords(input);
    const flowType = this.identifyFlowType(keywords);
    const entities = this.extractEntities(input);
    
    // Enhanced flow name generation
    const flowName = this.generateFlowName(input, flowType);
    
    // Enhanced entity extraction with better defaults
    this.enhanceEntities(entities, input, flowType);
    
    return {
      flowType,
      entities,
      keywords,
      confidence: 0.85, // Higher confidence for enhanced mock
      originalInput: input,
      flowName,
      partialFlow: this.createPartialFlow(flowType, entities)
    };
  }

  generateFlowName(input, flowType) {
    const lowerInput = input.toLowerCase();
    
    // Extract key concepts for naming
    if (lowerInput.includes('email')) return 'Email Validation Flow';
    if (lowerInput.includes('password')) return 'Password Strength Check';
    if (lowerInput.includes('age')) return 'Age Verification Flow';
    if (lowerInput.includes('calculator') || lowerInput.includes('calculate')) return 'Calculator Flow';
    if (lowerInput.includes('grade')) return 'Grade Calculator';
    if (lowerInput.includes('discount')) return 'Discount Calculator';
    if (lowerInput.includes('tax')) return 'Tax Calculator';
    if (lowerInput.includes('login')) return 'Login Validation';
    if (lowerInput.includes('registration')) return 'Registration Flow';
    
    // Fallback based on flow type
    switch (flowType) {
      case 'validation': return 'Validation Flow';
      case 'calculation': return 'Calculation Flow';
      case 'decision': return 'Decision Flow';
      default: return 'Custom Workflow';
    }
  }

  enhanceEntities(entities, input, flowType) {
    const lowerInput = input.toLowerCase();
    
    // Add specific validation rules based on context
    if (flowType === 'validation') {
      if (lowerInput.includes('email')) {
        entities.validationRule = '/^[^@]+@[^@]+\\.[^@]+$/.test(email)';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'email', defaultValue: 'user@example.com' });
      } else if (lowerInput.includes('password')) {
        entities.validationRule = 'password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'password', defaultValue: 'MyPassword123!' });
      } else if (lowerInput.includes('age')) {
        entities.validationRule = 'age >= 18';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'age', defaultValue: '25' });
      }
    }
    
    // Add specific formulas based on context
    if (flowType === 'calculation') {
      if (lowerInput.includes('discount')) {
        entities.formula = 'return price * (1 - discount / 100);';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'price', defaultValue: '100' });
        entities.inputs.push({ name: 'discount', defaultValue: '10' });
      } else if (lowerInput.includes('tax')) {
        entities.formula = 'return price * (1 + taxRate / 100);';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'price', defaultValue: '100' });
        entities.inputs.push({ name: 'taxRate', defaultValue: '8.5' });
      } else if (lowerInput.includes('grade')) {
        entities.formula = 'return score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";';
        if (!entities.inputs) entities.inputs = [];
        entities.inputs.push({ name: 'score', defaultValue: '85' });
      }
    }
    
    // Ensure we have at least one input if none detected
    if (!entities.inputs || entities.inputs.length === 0) {
      entities.inputs = [{ name: 'value', defaultValue: '10' }];
    }
  }

  // Parse user intent from natural language
  async parseIntent(input) {
    if (this.config.provider === 'mock') {
      // Use enhanced mock implementation
      return this.parseIntentMock(input);
    }

    // Use real AI for intent parsing
    try {
      console.log('🤖 Using real AI for intent parsing, provider:', this.config.provider);
      const aiResponse = await this.callAI(this.createIntentPrompt(input));
      console.log('🤖 AI response received:', aiResponse?.substring(0, 100) + '...');
      
      const parsedIntent = this.parseAIIntentResponse(aiResponse);
      console.log('🤖 Parsed intent:', parsedIntent);
      
      return {
        ...parsedIntent,
        originalInput: input,
        confidence: parsedIntent.confidence || 0.9,
        partialFlow: this.createPartialFlow(parsedIntent.flowType, parsedIntent.entities)
      };
    } catch (error) {
      console.error('🤖 AI parsing failed, falling back to mock:', error);
      console.error('🤖 Error details:', error.message, error.stack);
      
      // Create user-friendly error message
      let userMessage = '';
      if (error.message.includes('404')) {
        userMessage = '🌐 CORS Issue: Direct API calls to OpenAI are blocked by your browser for security. Using enhanced mock AI instead - it works great for flow building!';
      } else if (error.message.includes('401')) {
        userMessage = '🔑 API Key Issue: Your OpenAI API key appears to be invalid. Using enhanced mock AI instead.';
      } else if (error.message.includes('429')) {
        userMessage = '⏱️ Rate Limit: OpenAI API rate limit reached. Using enhanced mock AI instead.';
      } else {
        userMessage = `🤖 API Error: ${error.message}. Using enhanced mock AI instead.`;
      }
      
      // Fallback to enhanced mock implementation
      const mockResult = this.parseIntentMock(input);
      
      // Add error info to the result so the UI can display it
      return {
        ...mockResult,
        fallbackReason: userMessage,
        isUsingFallback: true
      };
    }
  }

  // Create a structured prompt for intent analysis
  createIntentPrompt(input) {
    return `Analyze this user request for creating a workflow and extract structured information:

User Request: "${input}"

Please analyze and respond with a JSON object containing:
{
  "flowType": "validation|calculation|decision|workflow",
  "entities": {
    "inputs": [{"name": "variableName", "defaultValue": "defaultVal"}],
    "validationRule": "condition if validation type",
    "formula": "calculation if calculation type",
    "conditions": ["list of conditions if decision type"]
  },
  "flowName": "suggested name for the flow",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of the analysis"
}

Focus on identifying:
1. What type of workflow this is (validation, calculation, decision, or general workflow)
2. What inputs/variables are needed
3. What logic or conditions should be applied
4. What the expected outputs are

Be specific and practical in your analysis.`;
  }

  // Parse AI response for intent analysis
  parseAIIntentResponse(aiResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        return {
          flowType: parsed.flowType || 'workflow',
          entities: {
            inputs: parsed.entities?.inputs || [],
            validationRule: parsed.entities?.validationRule,
            formula: parsed.entities?.formula,
            conditions: parsed.entities?.conditions || []
          },
          flowName: parsed.flowName || 'AI Generated Flow',
          confidence: Math.min(Math.max(parsed.confidence || 0.8, 0), 1),
          reasoning: parsed.reasoning || 'AI analysis completed'
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }
    
    // Fallback parsing if JSON extraction fails
    return this.fallbackParseAIResponse(aiResponse);
  }

  // Fallback parsing method
  fallbackParseAIResponse(response) {
    const flowType = this.extractFlowTypeFromText(response);
    const entities = this.extractEntitiesFromText(response);
    
    return {
      flowType,
      entities,
      confidence: 0.7,
      reasoning: 'Parsed from AI text response'
    };
  }

  // Call the configured AI provider
  async callAI(prompt) {
    switch (this.config.provider) {
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'claude':
        return await this.callClaude(prompt);
      case 'ollama':
        return await this.callOllama(prompt);
      case 'azure':
        return await this.callAzureOpenAI(prompt);
      case 'deepseek':
        return await this.callDeepSeek(prompt);
      case 'custom':
        return await this.callCustomAPI(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  // OpenAI API call
  async callOpenAI(prompt) {
    console.log('🤖 Calling OpenAI API for parsing...');
    console.log('🤖 URL: https://api.openai.com/v1/chat/completions');
    console.log('🤖 Model:', this.config.model);
    console.log('🤖 API Key format:', this.config.apiKey ? `${this.config.apiKey.substring(0, 7)}...` : 'MISSING');
    console.log('🤖 Prompt length:', prompt.length);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });

      console.log('🤖 Response status:', response.status);
      console.log('🤖 Response URL:', response.url);
      console.log('🤖 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 API Error Response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🤖 API Success! Response:', data);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('🤖 callOpenAI failed:', error);
      throw error;
    }
  }

  // Claude API call
  async callClaude(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Ollama API call
  async callOllama(prompt) {
    const endpoint = this.config.endpoint || 'http://localhost:11434';
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  // Azure OpenAI API call
  async callAzureOpenAI(prompt) {
    const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // DeepSeek API call
  async callDeepSeek(prompt) {
    const endpoint = this.config.endpoint || 'https://api.deepseek.com/v1';
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Custom API call (OpenAI-compatible)
  async callCustomAPI(prompt) {
    const response = await fetch(`${this.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Helper methods for fallback parsing
  extractFlowTypeFromText(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('validat') || lowerText.includes('check') || lowerText.includes('verify')) {
      return 'validation';
    }
    if (lowerText.includes('calculat') || lowerText.includes('math') || lowerText.includes('formula')) {
      return 'calculation';
    }
    if (lowerText.includes('decision') || lowerText.includes('condition') || lowerText.includes('if')) {
      return 'decision';
    }
    return 'workflow';
  }

  extractEntitiesFromText(text) {
    // Basic entity extraction from AI response text
    const entities = { inputs: [] };
    
    // Look for input mentions
    const inputMatches = text.match(/input[s]?[:\s]+([^.]+)/gi);
    if (inputMatches) {
      inputMatches.forEach(match => {
        const variables = match.replace(/input[s]?[:\s]+/gi, '').split(',');
        variables.forEach(variable => {
          const trimmed = variable.trim();
          if (trimmed) {
            entities.inputs.push({
              name: trimmed.replace(/[^a-zA-Z0-9_]/g, ''),
              defaultValue: this.getDefaultValueForVariable(trimmed)
            });
          }
        });
      });
    }
    
    return entities;
  }

  getDefaultValueForVariable(variableName) {
    const name = variableName.toLowerCase();
    if (name.includes('email')) return 'user@example.com';
    if (name.includes('age')) return '25';
    if (name.includes('password')) return 'MyPassword123!';
    if (name.includes('price') || name.includes('cost')) return '100';
    if (name.includes('name')) return 'John Doe';
    return '10';
  }

  // Create a partial flow structure for preview
  createPartialFlow(flowType, entities) {
    return {
      type: flowType,
      estimatedNodes: this.estimateNodeCount(flowType, entities),
      suggestedInputs: entities.potentialVariables || [],
      complexity: this.assessComplexity(flowType, entities)
    };
  }

  // Estimate how many nodes the flow will have
  estimateNodeCount(flowType, entities) {
    let count = 2; // Start + End
    
    if (entities.potentialVariables && entities.potentialVariables.length > 0) {
      count += Math.min(entities.potentialVariables.length, 3); // Max 3 input nodes
    }
    
    switch (flowType) {
      case 'validation':
        count += 1; // Condition node
        count += 1; // Extra end node for validation
        break;
      case 'calculation':
        count += 1; // Function node
        break;
      case 'decision':
        count += 2; // Multiple condition nodes
        break;
      default:
        count += 1; // Default workflow node
        break;
    }
    
    return count;
  }

  // Assess the complexity of the intended flow
  assessComplexity(flowType, entities) {
    let complexity = 'simple';
    
    if (entities.potentialVariables && entities.potentialVariables.length > 3) {
      complexity = 'medium';
    }
    
    if (flowType === 'decision' || (entities.potentialVariables && entities.potentialVariables.length > 5)) {
      complexity = 'complex';
    }
    
    return complexity;
  }

  // Generate clarifying questions based on ambiguous intent
  generateClarifyingQuestions(intent) {
    const questions = [];
    
    console.log('Generating questions for intent:', intent); // Debug log
    
    // Check for missing critical information based on flow type
    if (intent.flowType === 'validation') {
      if (!intent.entities.validationRule && !intent.entities.validationRules) {
        questions.push({
          id: 'validation_rules',
          question: 'What specific validation rules should be applied?',
          type: 'multiple_choice',
          options: ['Email format', 'Password strength', 'Age verification', 'Custom condition']
        });
      }
    }
    
    if (intent.flowType === 'calculation') {
      if (!intent.entities.formula) {
        questions.push({
          id: 'calculation_formula',
          question: 'What calculation should be performed?',
          type: 'text',
          placeholder: 'e.g., price * discount_rate, age * 2, total + tax'
        });
      }
    }
    
    if (intent.flowType === 'decision') {
      if (!intent.entities.conditions || intent.entities.conditions.length === 0) {
        questions.push({
          id: 'decision_conditions',
          question: 'What conditions should the flow check?',
          type: 'text',
          placeholder: 'e.g., age >= 18, score > 80, status === "active"'
        });
      }
    }
    
    // Always ask for inputs if we don't have any and haven't detected them
    if (!intent.entities.inputs || intent.entities.inputs.length === 0) {
      // Only ask if we haven't already inferred some inputs from the text
      const hasInferredInputs = intent.entities.potentialVariables && intent.entities.potentialVariables.length > 0;
      
      if (!hasInferredInputs) {
        questions.push({
          id: 'required_inputs',
          question: 'What inputs does your flow need?',
          type: 'text',
          placeholder: 'e.g., user age, email address, product price'
        });
      } else {
        // We have potential variables, ask for confirmation
        questions.push({
          id: 'confirm_inputs',
          question: `I detected these potential inputs: ${intent.entities.potentialVariables.join(', ')}. Are these correct, or would you like to specify different inputs?`,
          type: 'text',
          placeholder: 'Enter inputs or type "yes" to confirm'
        });
      }
    }
    
    console.log('Generated questions:', questions); // Debug log
    return questions;
  }

  // Process user responses to clarifying questions
  async processQuestionResponse(questionId, answer) {
    // Update the current flow context with the answer
    if (!this.currentFlowContext) {
      this.currentFlowContext = {
        flowType: 'workflow',
        entities: {},
        answers: {}
      };
    }
    
    this.currentFlowContext.answers[questionId] = answer;
    
    // Process specific question types
    switch (questionId) {
      case 'validation_rules':
        this.currentFlowContext.entities.validationRule = this.getValidationRule(answer);
        this.currentFlowContext.flowType = 'validation';
        break;
        
      case 'calculation_formula':
        this.currentFlowContext.entities.formula = `return ${answer};`;
        this.currentFlowContext.flowType = 'calculation';
        break;
        
      case 'required_inputs':
        this.currentFlowContext.entities.inputs = this.parseInputs(answer);
        break;
        
      case 'confirm_inputs':
        if (answer.toLowerCase() === 'yes') {
          // Use the detected inputs
          this.currentFlowContext.entities.inputs = this.currentFlowContext.entities.potentialVariables.map(variable => ({
            name: variable,
            defaultValue: this.getDefaultValueForVariable(variable)
          }));
        } else {
          // Parse the new inputs provided
          this.currentFlowContext.entities.inputs = this.parseInputs(answer);
        }
        break;
        
      case 'decision_conditions':
        this.currentFlowContext.entities.conditions = [answer];
        this.currentFlowContext.flowType = 'decision';
        break;
      default:
        // Handle unknown question types
        console.warn(`Unknown question ID: ${questionId}`);
        break;
    }
    
    // Check if we have enough information to generate the flow
    const remainingQuestions = this.generateClarifyingQuestions(this.currentFlowContext);
    
    if (remainingQuestions.length === 0) {
      // Generate the flow
      const flowData = await this.generateFlow(this.currentFlowContext);
      this.currentFlowContext = null; // Reset context
      return {
        type: 'flow',
        flowData: flowData
      };
    } else {
      // Ask more questions
      return {
        type: 'questions',
        questions: remainingQuestions,
        partialFlow: this.currentFlowContext
      };
    }
  }

  // Helper method to convert validation rule selection to condition
  getValidationRule(selection) {
    const rules = {
      'Email format': '/^[^@]+@[^@]+\\.[^@]+$/.test(email)',
      'Password strength': 'password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)',
      'Age verification': 'age >= 18',
      'Custom condition': 'value > 0'
    };
    return rules[selection] || 'value > 0';
  }

  // Helper method to parse input string into input objects
  parseInputs(inputString) {
    const inputs = inputString.split(',').map(input => {
      const trimmed = input.trim();
      const parts = trimmed.split(' ');
      
      // Try to extract variable name and type
      let name = parts[parts.length - 1]; // Last word is usually the variable name
      let defaultValue = '10';
      
      // Set appropriate default values based on context
      if (name.toLowerCase().includes('email')) {
        defaultValue = 'user@example.com';
      } else if (name.toLowerCase().includes('age')) {
        defaultValue = '25';
      } else if (name.toLowerCase().includes('password')) {
        defaultValue = 'MyPassword123!';
      } else if (name.toLowerCase().includes('price') || name.toLowerCase().includes('cost')) {
        defaultValue = '100';
      }
      
      return {
        name: name,
        defaultValue: defaultValue
      };
    });
    
    return inputs;
  }

  // Generate complete flow JSON
  async generateFlow(intent) {
    const nodes = [];
    const edges = [];
    let nodeId = 1;
    let yPosition = 100;
    
    // Always start with a Start node
    nodes.push({
      id: String(nodeId++),
      type: 'start',
      position: { x: 200, y: yPosition },
      data: { label: 'Start' }
    });
    yPosition += 150;
    
    // Add input nodes based on required inputs
    const inputNodes = this.generateInputNodes(intent.entities.inputs, nodeId, yPosition);
    nodes.push(...inputNodes.nodes);
    nodeId = inputNodes.nextId;
    yPosition = inputNodes.nextY;
    
    // Add logic nodes based on flow type
    const logicNodes = this.generateLogicNodes(intent, nodeId, yPosition);
    nodes.push(...logicNodes.nodes);
    nodeId = logicNodes.nextId;
    yPosition = logicNodes.nextY;
    
    // Add end nodes
    const endNodes = this.generateEndNodes(intent, nodeId, yPosition);
    nodes.push(...endNodes.nodes);
    
    // Generate edges to connect nodes
    edges.push(...this.generateEdges(nodes, intent));
    
    return {
      name: intent.flowName || 'AI Generated Flow',
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      version: '1.0',
      aiGenerated: true,
      originalPrompt: intent.originalInput
    };
  }

  // Helper methods for flow generation
  extractKeywords(input) {
    const keywords = input.toLowerCase().match(/\b\w+\b/g) || [];
    return keywords.filter(word => word.length > 2);
  }

  identifyFlowType(keywords) {
    const patterns = {
      validation: ['validate', 'check', 'verify', 'confirm'],
      calculation: ['calculate', 'compute', 'math', 'formula'],
      decision: ['decide', 'choose', 'if', 'condition'],
      workflow: ['process', 'workflow', 'steps', 'sequence']
    };
    
    for (const [type, words] of Object.entries(patterns)) {
      if (words.some(word => keywords.includes(word))) {
        return type;
      }
    }
    
    return 'workflow';
  }

  extractEntities(input) {
    const entities = {};
    const lowerInput = input.toLowerCase();
    
    // Smart variable detection based on common patterns
    const potentialVariables = [];
    const inputPatterns = [
      // Direct mentions
      /\b(?:user\s+)?(\w+)\s+(?:input|field|value)/gi,
      /\b(?:enter|input|provide)\s+(?:the\s+)?(\w+)/gi,
      /\b(\w+)\s+(?:validation|check|verification)/gi,
      
      // Common variable names
      /\b(email|password|age|name|price|cost|total|amount|score|rating|username|phone|address)\b/gi,
      
      // "with X" patterns
      /\bwith\s+(\w+)\s+(?:validation|check|input)/gi,
      
      // "based on X" patterns
      /\bbased\s+on\s+(?:user\s+)?(\w+)/gi,
      
      // "X and Y" patterns for multiple inputs
      /\b(\w+)\s+and\s+(\w+)(?:\s+(?:validation|check|input))?/gi
    ];
    
    inputPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        if (match[1] && match[1].length > 2 && !this.isCommonWord(match[1])) {
          potentialVariables.push(match[1].toLowerCase());
        }
        if (match[2] && match[2].length > 2 && !this.isCommonWord(match[2])) {
          potentialVariables.push(match[2].toLowerCase());
        }
      }
    });
    
    // Remove duplicates and common words
    entities.potentialVariables = [...new Set(potentialVariables)]
      .filter(word => !this.isCommonWord(word));
    
    // Convert potential variables to input objects if we found any
    if (entities.potentialVariables.length > 0) {
      entities.inputs = entities.potentialVariables.map(variable => ({
        name: variable,
        defaultValue: this.getDefaultValueForVariable(variable)
      }));
    }
    
    // Extract validation rules for validation flows
    if (lowerInput.includes('email') && (lowerInput.includes('valid') || lowerInput.includes('check'))) {
      entities.validationRule = '/^[^@]+@[^@]+\\.[^@]+$/.test(email)';
    } else if (lowerInput.includes('password') && (lowerInput.includes('strength') || lowerInput.includes('strong'))) {
      entities.validationRule = 'password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)';
    } else if (lowerInput.includes('age') && (lowerInput.includes('adult') || lowerInput.includes('18'))) {
      entities.validationRule = 'age >= 18';
    }
    
    // Extract calculation formulas
    const calcPatterns = [
      /(\w+)\s*\*\s*(\w+)/gi,
      /(\w+)\s*\+\s*(\w+)/gi,
      /(\w+)\s*-\s*(\w+)/gi,
      /(\w+)\s*\/\s*(\w+)/gi,
      /calculate\s+([^.]+)/gi,
      /multiply\s+(\w+)\s+by\s+(\w+)/gi,
      /add\s+(\w+)\s+to\s+(\w+)/gi
    ];
    
    calcPatterns.forEach(pattern => {
      const match = pattern.exec(input);
      if (match) {
        if (pattern.source.includes('multiply')) {
          entities.formula = `return ${match[1]} * ${match[2]};`;
        } else if (pattern.source.includes('add')) {
          entities.formula = `return ${match[1]} + ${match[2]};`;
        } else if (pattern.source.includes('calculate')) {
          entities.formula = `return ${match[1]};`;
        } else {
          entities.formula = `return ${match[0]};`;
        }
      }
    });
    
    // Extract numbers for context
    const numbers = input.match(/\b\d+\b/g) || [];
    entities.numbers = numbers;
    
    // Set flags for common patterns
    entities.hasEmail = lowerInput.includes('email');
    entities.hasPassword = lowerInput.includes('password');
    entities.hasAge = lowerInput.includes('age');
    entities.hasPrice = lowerInput.includes('price') || lowerInput.includes('cost');
    
    console.log('Extracted entities:', entities); // Debug log
    return entities;
  }

  // Helper method to filter out common English words
  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'under', 'over', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'create',
      'make', 'build', 'flow', 'workflow', 'system', 'tool', 'application', 'app',
      'need', 'want', 'like', 'user', 'users', 'check', 'validate', 'verification',
      'validation', 'registration', 'login', 'form', 'field', 'input', 'output'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  generateInputNodes(inputs, startId, startY) {
    const nodes = [];
    let nodeId = startId;
    let yPosition = startY;
    
    if (inputs && inputs.length > 0) {
      inputs.forEach(input => {
        nodes.push({
          id: String(nodeId++),
          type: 'input',
          position: { x: 200, y: yPosition },
          data: {
            label: `Input: ${input.name}`,
            variable: input.name,
            value: input.defaultValue || '10'
          }
        });
        yPosition += 150;
      });
    }
    
    return { nodes, nextId: nodeId, nextY: yPosition };
  }

  generateLogicNodes(intent, startId, startY) {
    const nodes = [];
    let nodeId = startId;
    let yPosition = startY;
    
    switch (intent.flowType) {
      case 'validation':
        nodes.push({
          id: String(nodeId++),
          type: 'condition',
          position: { x: 200, y: yPosition },
          data: {
            label: 'Validation Check',
            condition: intent.entities.validationRule || 'value > 0'
          }
        });
        break;
        
      case 'calculation':
        nodes.push({
          id: String(nodeId++),
          type: 'function',
          position: { x: 200, y: yPosition },
          data: {
            label: 'Calculate Result',
            code: intent.entities.formula || 'return value * 2;'
          }
        });
        break;
      default:
        // Default workflow - add a function node
        nodes.push({
          id: String(nodeId++),
          type: 'function',
          position: { x: 200, y: yPosition },
          data: {
            label: 'Process Data',
            code: 'return variables;'
          }
        });
        break;
    }
    
    return { nodes, nextId: nodeId, nextY: yPosition + 150 };
  }

  generateEndNodes(intent, startId, startY) {
    const nodes = [];
    let nodeId = startId;
    
    // Generate appropriate end nodes based on flow type
    if (intent.flowType === 'validation') {
      nodes.push(
        {
          id: String(nodeId++),
          type: 'end',
          position: { x: 350, y: startY },
          data: { label: 'Valid ✓' }
        },
        {
          id: String(nodeId++),
          type: 'end',
          position: { x: 50, y: startY },
          data: { label: 'Invalid ✗' }
        }
      );
    } else {
      nodes.push({
        id: String(nodeId++),
        type: 'end',
        position: { x: 200, y: startY },
        data: { label: 'Complete' }
      });
    }
    
    return { nodes, nextId: nodeId };
  }

  generateEdges(nodes, intent) {
    const edges = [];
    
    // Simple linear connection for now
    for (let i = 0; i < nodes.length - 1; i++) {
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1];
      
      if (currentNode.type === 'condition') {
        // Handle condition node branching
        const trueNode = nodes.find(n => n.data.label.includes('✓'));
        const falseNode = nodes.find(n => n.data.label.includes('✗'));
        
        if (trueNode) {
          edges.push({
            id: `e${currentNode.id}-${trueNode.id}`,
            source: currentNode.id,
            target: trueNode.id,
            sourceHandle: 'true'
          });
        }
        
        if (falseNode) {
          edges.push({
            id: `e${currentNode.id}-${falseNode.id}`,
            source: currentNode.id,
            target: falseNode.id,
            sourceHandle: 'false'
          });
        }
      } else if (nextNode.type !== 'end' || nodes.filter(n => n.type === 'end').length === 1) {
        edges.push({
          id: `e${currentNode.id}-${nextNode.id}`,
          source: currentNode.id,
          target: nextNode.id
        });
      }
    }
    
    return edges;
  }
}

export default AIFlowAgent;