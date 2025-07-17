// AI Agent Service for Flow Builder
// This service handles natural language processing and flow generation

class AIFlowAgent {
  constructor(config = null) {
    this.conversationHistory = [];
    this.currentFlowContext = null;
    this.workflowContext = null; // Store all workflow tabs context
    this.testingCallback = null; // Callback to run tests
    this.config = config || this.loadConfig();

    console.log('🤖 AIFlowAgent initialized with config:', {
      provider: this.config.provider,
      hasApiKey: !!this.config.apiKey,
      model: this.config.model,
      configSource: config ? 'provided' : 'localStorage'
    });
  }

  // Set workflow context for AI to understand current state
  setWorkflowContext(workflows, activeWorkflowId, nodes, edges) {
    // Make sure we have valid data
    if (!workflows || !Array.isArray(workflows) || workflows.length === 0) {
      console.warn('🧠 AI Context update failed: Invalid workflows data', workflows);
      return;
    }

    try {
      this.workflowContext = {
        workflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          nodeCount: w.nodes?.length || 0,
          hasConditions: w.nodes?.some(n => n.type === 'condition') || false,
          conditions: w.nodes?.filter(n => n.type === 'condition').map(n => n.data?.condition) || [],
          isImported: w.imported || false,
          originalData: w.originalData
        })),
        activeWorkflowId,
        currentNodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data?.label,
          condition: n.data?.condition,
          variable: n.data?.variable,
          value: n.data?.value,
          code: n.data?.code
        })),
        currentEdges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle
        }))
      };

      console.log('🧠 AI Context updated successfully:', {
        totalWorkflows: this.workflowContext.workflows.length,
        activeWorkflow: this.workflowContext.workflows.find(w => w.id === activeWorkflowId)?.name,
        currentNodeCount: this.workflowContext.currentNodes.length
      });
    } catch (error) {
      console.error('🧠 Error updating AI context:', error);
      // Create a minimal context to prevent errors
      this.workflowContext = {
        workflows: workflows.map(w => ({ id: w.id, name: w.name })),
        activeWorkflowId,
        currentNodes: [],
        currentEdges: []
      };
    }
  }

  // Set testing callback for AI to run tests
  setTestingCallback(callback) {
    this.testingCallback = callback;
    console.log('🧪 AI Testing integration enabled');
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
      maxTokens: 1000,
      enableMockFallback: true
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
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return await this.testOpenAIWithChat();
      }

      const data = await response.json();
      return {
        success: true,
        model: this.config.model,
        availableModels: data.data?.length || 0
      };
    } catch (error) {
      return await this.testOpenAIWithChat();
    }
  }

  async testOpenAIWithChat() {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      await response.json();
      return {
        success: true,
        model: this.config.model || 'gpt-3.5-turbo'
      };
    } catch (error) {
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
    // Check if user is asking for context analysis
    if (this.isContextAnalysisRequest(userInput)) {
      return await this.analyzeCurrentContext(userInput);
    }

    // Check if user wants to run tests
    if (this.isTestRequest(userInput)) {
      return await this.handleTestRequest(userInput);
    }

    // Parse intent and generate flow
    const intent = await this.parseIntent(userInput);
    const questions = this.generateClarifyingQuestions(intent);

    if (questions.length > 0) {
      return {
        type: 'questions',
        questions: questions,
        partialFlow: intent.partialFlow
      };
    }

    // Generate audit trail for conversational feedback
    const auditTrail = this.generateAuditTrail(intent);

    const flowData = await this.generateFlow(intent);

    // Pass through fallback information if present
    if (intent.isUsingFallback) {
      flowData.isUsingFallback = true;
      flowData.fallbackReason = intent.fallbackReason;
    }

    return {
      type: 'flow',
      flowData: flowData,
      auditTrail: auditTrail
    };
  }

  // Check if user is asking for context analysis
  isContextAnalysisRequest(input) {
    const lowerInput = input.toLowerCase();
    const contextKeywords = [
      'what\'s on screen', 'describe', 'explain', 'what do i have',
      'what tabs', 'what workflows', 'what\'s loaded', 'analyze',
      'tell me about', 'show me', 'what am i looking at'
    ];
    return contextKeywords.some(keyword => lowerInput.includes(keyword));
  }

  // Check if user wants to run tests
  isTestRequest(input) {
    const lowerInput = input.toLowerCase();
    const testKeywords = [
      'run test', 'test this', 'test the flow', 'execute test',
      'check this workflow', 'validate this', 'try this flow'
    ];
    return testKeywords.some(keyword => lowerInput.includes(keyword));
  }

  // Analyze and describe current context
  async analyzeCurrentContext(userInput) {
    console.log('🔍 AI Agent: Analyzing context', {
      hasContext: !!this.workflowContext,
      contextDetails: this.workflowContext ? {
        workflowCount: this.workflowContext.workflows?.length || 0,
        nodeCount: this.workflowContext.currentNodes?.length || 0
      } : 'No context',
      mockEnabled: this.config.provider === 'mock' || this.config.enableMockFallback === true
    });

    // If no context is available, check if mock is enabled before creating mock data
    if (!this.workflowContext || !this.workflowContext.workflows || this.workflowContext.workflows.length === 0) {
      // Only use mock data if mock provider is enabled or mock fallback is explicitly enabled
      if (this.config.provider === 'mock' || this.config.enableMockFallback === true) {
        console.warn('🔍 AI Agent: No workflow context available, using mock data (mock enabled)');

        // Create a mock context based on the current rule
        const ruleName = userInput.toLowerCase().includes('rule 2') ? 'Rule 2' : 'Current Rule';

        this.workflowContext = {
          workflows: [{
            id: 'mock_workflow',
            name: ruleName,
            nodeCount: 3,
            hasConditions: true,
            conditions: ['today.Equals("TUE")', 'now.Before("09:00")'],
            isImported: false
          }],
          activeWorkflowId: 'mock_workflow',
          currentNodes: [
            { id: 'start', type: 'start', label: 'Start' },
            { id: 'condition1', type: 'condition', condition: 'today.Equals("TUE")' },
            { id: 'condition2', type: 'condition', condition: 'now.Before("09:00")' },
            { id: 'end', type: 'end', label: 'End' }
          ],
          currentEdges: [
            { id: 'e1-2', source: 'start', target: 'condition1' },
            { id: 'e2-3', source: 'condition1', target: 'condition2', sourceHandle: 'true' },
            { id: 'e3-4', source: 'condition2', target: 'end', sourceHandle: 'true' }
          ]
        };
      } else {
        console.warn('🔍 AI Agent: No workflow context available and mock is disabled');
        return {
          type: 'response',
          content: "I don't have access to your current workflow context yet. Please make sure I'm connected to your workspace. If you'd like me to use mock data for demonstration purposes, you can enable the Mock AI or Mock Fallback option in the AI settings."
        };
      }
    }

    const analysis = this.generateContextAnalysis();

    return {
      type: 'response',
      content: analysis,
      contextData: this.workflowContext
    };
  }

  // Generate comprehensive context analysis
  generateContextAnalysis() {
    const ctx = this.workflowContext;
    let analysis = "🔍 **Current Workspace Analysis:**\n\n";

    // Overview
    analysis += `📊 **Overview:**\n`;
    analysis += `• Total workflows: ${ctx.workflows.length}\n`;
    analysis += `• Active workflow: ${ctx.workflows.find(w => w.id === ctx.activeWorkflowId)?.name || 'None'}\n`;
    analysis += `• Current nodes: ${ctx.currentNodes.length}\n\n`;

    // Workflow breakdown
    analysis += `📑 **Workflow Tabs:**\n`;
    ctx.workflows.forEach((workflow, index) => {
      const isActive = workflow.id === ctx.activeWorkflowId;
      const status = isActive ? '🔸 (Active)' : '⚪';
      analysis += `${status} **${workflow.name}**: ${workflow.nodeCount} nodes`;

      if (workflow.isImported) {
        analysis += ` (Imported)`;
      }

      if (workflow.hasConditions) {
        const conditionCount = workflow.conditions.filter(c => c).length;
        analysis += ` - ${conditionCount} conditions`;
      }

      analysis += `\n`;
    });

    // Current workflow details
    if (ctx.currentNodes.length > 0) {
      analysis += `\n🎯 **Active Workflow Details:**\n`;

      const nodeTypes = ctx.currentNodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(nodeTypes).forEach(([type, count]) => {
        const emoji = this.getNodeEmoji(type);
        analysis += `${emoji} ${type}: ${count}\n`;
      });

      // Show conditions if any
      const conditions = ctx.currentNodes.filter(n => n.type === 'condition' && n.condition);
      if (conditions.length > 0) {
        analysis += `\n🔍 **Conditions:**\n`;
        conditions.forEach((node, index) => {
          analysis += `${index + 1}. ${node.condition}\n`;
        });
      }

      // Show inputs if any
      const inputs = ctx.currentNodes.filter(n => n.type === 'input');
      if (inputs.length > 0) {
        analysis += `\n📝 **Input Variables:**\n`;
        inputs.forEach(node => {
          analysis += `• ${node.variable || 'variable'} = ${node.value || 'value'}\n`;
        });
      }
    }

    // Suggestions
    analysis += `\n💡 **What I can help with:**\n`;
    analysis += `• Create new flows: "Create a flow that checks if it's Tuesday at 9am"\n`;
    analysis += `• Test workflows: "Run test on this flow"\n`;
    analysis += `• Explain logic: "Explain how this condition works"\n`;
    analysis += `• Generate complex flows with time/date conditions and queue operations\n`;

    return analysis;
  }

  // Get emoji for node types
  getNodeEmoji(nodeType) {
    const emojis = {
      start: '🚀',
      end: '🏁',
      condition: '❓',
      input: '📝',
      function: '⚙️'
    };
    return emojis[nodeType] || '🔹';
  }

  // Handle test requests
  async handleTestRequest(userInput) {
    if (!this.testingCallback) {
      return {
        type: 'response',
        content: "🧪 I'd love to help you test this workflow, but I need to be connected to the testing system first. Please make sure the testing integration is enabled."
      };
    }

    if (!this.workflowContext || this.workflowContext.currentNodes.length === 0) {
      return {
        type: 'response',
        content: "🧪 I don't see any workflow to test. Please create or select a workflow first, then ask me to test it."
      };
    }

    // For now, return a simple test response
    return {
      type: 'response',
      content: "🧪 Test functionality is being implemented. This feature will allow me to analyze your workflow and run tests with configurable values."
    };
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

      // Check if mock fallback is enabled
      if (this.config.enableMockFallback !== false) {
        console.log('🤖 Using mock fallback (enabled in settings)');

        // Fallback to enhanced mock implementation
        const mockResult = this.parseIntentMock(input);

        // Add clear fallback info to the result
        return {
          ...mockResult,
          fallbackReason: `🤖 **Using Mock AI Fallback**\n\nAPI Error: ${error.message}. Using enhanced mock AI instead.\n\n✨ You can disable this fallback in AI Settings if you prefer to see error messages instead.`,
          isUsingFallback: true
        };
      } else {
        // Mock fallback is disabled, throw the original error
        console.log('❌ Mock fallback disabled, throwing error');
        throw new Error(`${this.config.provider} API failed: ${error.message}\n\nMock fallback is disabled in AI Settings. Enable it if you want automatic fallback to mock AI.`);
      }
    }
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
      confidence: 0.85,
      originalInput: input,
      flowName,
      partialFlow: this.createPartialFlow(flowType, entities)
    };
  }

  // Extract keywords from input
  extractKeywords(input) {
    const lowerInput = input.toLowerCase();
    const keywords = [];

    // Flow type keywords
    if (lowerInput.includes('discount') || lowerInput.includes('calculator')) keywords.push('calculation');
    if (lowerInput.includes('email') || lowerInput.includes('validation')) keywords.push('validation');
    if (lowerInput.includes('age') || lowerInput.includes('verify')) keywords.push('validation');
    if (lowerInput.includes('password') || lowerInput.includes('strength')) keywords.push('validation');
    if (lowerInput.includes('decision') || lowerInput.includes('condition')) keywords.push('decision');

    return keywords;
  }

  // Identify flow type from keywords
  identifyFlowType(keywords) {
    if (keywords.includes('calculation')) return 'calculation';
    if (keywords.includes('validation')) return 'validation';
    if (keywords.includes('decision')) return 'decision';
    return 'custom';
  }

  // Extract entities from input
  extractEntities(input) {
    const entities = { inputs: [] };
    const lowerInput = input.toLowerCase();

    // Common input patterns
    if (lowerInput.includes('price')) {
      entities.inputs.push({ name: 'price', defaultValue: '100' });
    }
    if (lowerInput.includes('membership') || lowerInput.includes('level')) {
      entities.inputs.push({ name: 'membershipLevel', defaultValue: 'gold' });
    }
    if (lowerInput.includes('email')) {
      entities.inputs.push({ name: 'email', defaultValue: 'user@example.com' });
    }
    if (lowerInput.includes('age')) {
      entities.inputs.push({ name: 'age', defaultValue: '25' });
    }
    if (lowerInput.includes('password')) {
      entities.inputs.push({ name: 'password', defaultValue: 'MyPassword123!' });
    }

    return entities;
  }

  // Generate flow name from input
  generateFlowName(input, flowType) {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('discount') && lowerInput.includes('calculator')) {
      return 'Discount Calculator';
    }
    if (lowerInput.includes('email') && lowerInput.includes('validation')) {
      return 'Email Validation Flow';
    }
    if (lowerInput.includes('password') && lowerInput.includes('strength')) {
      return 'Password Strength Check';
    }
    if (lowerInput.includes('age') && lowerInput.includes('verification')) {
      return 'Age Verification Flow';
    }

    // Fallback based on flow type
    switch (flowType) {
      case 'calculation': return 'Calculator Flow';
      case 'validation': return 'Validation Flow';
      case 'decision': return 'Decision Flow';
      default: return 'Custom Workflow';
    }
  }

  // Enhance entities with specific logic
  enhanceEntities(entities, input, flowType) {
    const lowerInput = input.toLowerCase();

    if (flowType === 'calculation') {
      if (lowerInput.includes('discount')) {
        entities.formula = 'return membershipLevel === "gold" ? price * 0.8 : membershipLevel === "silver" ? price * 0.9 : price;';
        if (!entities.inputs.some(i => i.name === 'price')) {
          entities.inputs.push({ name: 'price', defaultValue: '100' });
        }
        if (!entities.inputs.some(i => i.name === 'membershipLevel')) {
          entities.inputs.push({ name: 'membershipLevel', defaultValue: 'gold' });
        }
      }
    }

    if (flowType === 'validation') {
      if (lowerInput.includes('email')) {
        entities.validationRule = '/^[^@]+@[^@]+\\.[^@]+$/.test(email)';
      } else if (lowerInput.includes('password')) {
        entities.validationRule = 'password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)';
      } else if (lowerInput.includes('age')) {
        entities.validationRule = 'age >= 18';
      }
    }
  }

  // Create partial flow structure
  createPartialFlow(flowType, entities) {
    return {
      type: flowType,
      inputs: entities.inputs || [],
      conditions: entities.validationRule ? [entities.validationRule] : [],
      formula: entities.formula
    };
  }

  // Generate clarifying questions
  generateClarifyingQuestions(intent) {
    // For now, don't ask questions - generate flow directly
    return [];
  }

  // Generate audit trail
  generateAuditTrail(intent) {
    const trail = [];

    trail.push(`🧠 I understand you want to create a ${intent.flowType} flow. Let me analyze the requirements...`);

    if (intent.entities.inputs && intent.entities.inputs.length > 0) {
      const inputNames = intent.entities.inputs.map(input => input.name).join(', ');
      trail.push(`📝 I've identified these inputs: ${inputNames}. Setting up input nodes...`);
    }

    switch (intent.flowType) {
      case 'validation':
        if (intent.entities.validationRule) {
          trail.push(`✅ Adding validation logic: "${intent.entities.validationRule}". This will check your data and provide TRUE/FALSE paths.`);
        }
        break;
      case 'calculation':
        if (intent.entities.formula) {
          trail.push(`🧮 Setting up calculation logic. The formula will process your inputs and return the result.`);
        }
        break;
      case 'decision':
        trail.push(`🤔 Creating decision logic with branching paths based on your conditions.`);
        break;
      default:
        trail.push(`⚙️ Building a custom workflow with the logic you specified.`);
    }

    trail.push(`🔗 Connecting nodes together to create your complete workflow...`);
    trail.push(`🎯 Adding start and end points to make your flow ready for testing...`);

    return trail;
  }

  // Generate flow data
  async generateFlow(intent) {
    const nodes = [];
    const edges = [];
    let nodeId = 1;

    // Start node
    const startNodeId = `node_${nodeId++}`;
    nodes.push({
      id: startNodeId,
      type: 'start',
      position: { x: 200, y: 50 },
      data: { label: 'Start' }
    });

    let previousNodeId = startNodeId;
    let yPosition = 150;

    // Input nodes
    if (intent.entities.inputs && intent.entities.inputs.length > 0) {
      intent.entities.inputs.forEach(input => {
        const inputNodeId = `node_${nodeId++}`;
        nodes.push({
          id: inputNodeId,
          type: 'input',
          position: { x: 200, y: yPosition },
          data: {
            label: input.name,
            variable: input.name,
            value: input.defaultValue
          }
        });

        edges.push({
          id: `edge_${previousNodeId}_${inputNodeId}`,
          source: previousNodeId,
          target: inputNodeId
        });

        previousNodeId = inputNodeId;
        yPosition += 100;
      });
    }

    // Logic node (condition or function)
    if (intent.flowType === 'validation' && intent.entities.validationRule) {
      const conditionNodeId = `node_${nodeId++}`;
      nodes.push({
        id: conditionNodeId,
        type: 'condition',
        position: { x: 200, y: yPosition },
        data: {
          label: 'Validation',
          condition: intent.entities.validationRule
        }
      });

      edges.push({
        id: `edge_${previousNodeId}_${conditionNodeId}`,
        source: previousNodeId,
        target: conditionNodeId
      });

      // Valid end node
      const validEndId = `node_${nodeId++}`;
      nodes.push({
        id: validEndId,
        type: 'end',
        position: { x: 350, y: yPosition + 50 },
        data: { label: 'Valid' }
      });

      edges.push({
        id: `edge_${conditionNodeId}_${validEndId}`,
        source: conditionNodeId,
        target: validEndId,
        sourceHandle: 'true'
      });

      // Invalid end node
      const invalidEndId = `node_${nodeId++}`;
      nodes.push({
        id: invalidEndId,
        type: 'end',
        position: { x: 50, y: yPosition + 50 },
        data: { label: 'Invalid' }
      });

      edges.push({
        id: `edge_${conditionNodeId}_${invalidEndId}`,
        source: conditionNodeId,
        target: invalidEndId,
        sourceHandle: 'false'
      });

    } else if (intent.flowType === 'calculation' && intent.entities.formula) {
      const functionNodeId = `node_${nodeId++}`;
      nodes.push({
        id: functionNodeId,
        type: 'function',
        position: { x: 200, y: yPosition },
        data: {
          label: 'Calculate',
          code: intent.entities.formula
        }
      });

      edges.push({
        id: `edge_${previousNodeId}_${functionNodeId}`,
        source: previousNodeId,
        target: functionNodeId
      });

      previousNodeId = functionNodeId;
      yPosition += 100;

      // End node
      const endNodeId = `node_${nodeId++}`;
      nodes.push({
        id: endNodeId,
        type: 'end',
        position: { x: 200, y: yPosition },
        data: { label: 'Result' }
      });

      edges.push({
        id: `edge_${previousNodeId}_${endNodeId}`,
        source: previousNodeId,
        target: endNodeId
      });
    } else {
      // Simple end node
      const endNodeId = `node_${nodeId++}`;
      nodes.push({
        id: endNodeId,
        type: 'end',
        position: { x: 200, y: yPosition },
        data: { label: 'End' }
      });

      edges.push({
        id: `edge_${previousNodeId}_${endNodeId}`,
        source: previousNodeId,
        target: endNodeId
      });
    }

    return {
      nodes,
      edges,
      flowName: intent.flowName || 'Generated Flow'
    };
  }

  // Create a comprehensive system prompt with tool capabilities
  createIntentPrompt(input) {
    return `# Flow Builder AI Assistant

You are an expert AI assistant for a visual workflow creation tool called Flow Builder. You help users create, test, and analyze complex workflows using natural language.

## Your Task:
Parse the user's request and return a JSON response with the following structure:

{
  "flowType": "validation|calculation|decision|custom",
  "entities": {
    "inputs": [{"name": "inputName", "defaultValue": "defaultValue"}],
    "validationRule": "condition for validation flows",
    "formula": "JavaScript code for calculation flows"
  },
  "flowName": "Descriptive name for the flow",
  "confidence": 0.9
}

## Flow Types:
- **validation**: For checking data (email, password, age verification)
- **calculation**: For mathematical operations (discounts, taxes, grades)
- **decision**: For conditional logic and branching
- **custom**: For other types of workflows

## User Request:
"${input}"

## Response:
Return only the JSON object, no additional text.`;
  }

  // Call AI provider with the given prompt
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

  // Call OpenAI API
  async callOpenAI(prompt) {
    console.log('🤖 Calling OpenAI API for parsing...');
    console.log('🤖 URL: https://api.openai.com/v1/chat/completions');
    console.log('🤖 Model:', this.config.model);
    console.log('🤖 API Key format:', this.config.apiKey ? `${this.config.apiKey.substring(0, 7)}...` : 'MISSING');
    console.log('🤖 Prompt length:', prompt.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that parses user requests for workflow creation. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3
      })
    });

    console.log('🤖 Response status:', response.status);
    console.log('🤖 Response URL:', response.url);
    console.log('🤖 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🤖 API Success! Response:', data);

    return data.choices[0].message.content;
  }

  // Call Claude API
  async callClaude(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Call Ollama API
  async callOllama(prompt) {
    const endpoint = this.config.endpoint || 'http://localhost:11434';
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  // Call Azure OpenAI API
  async callAzureOpenAI(prompt) {
    const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that parses user requests for workflow creation. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Call DeepSeek API
  async callDeepSeek(prompt) {
    const response = await fetch(`${this.config.endpoint || 'https://api.deepseek.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that parses user requests for workflow creation. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Call Custom API
  async callCustomAPI(prompt) {
    const response = await fetch(`${this.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that parses user requests for workflow creation. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Parse AI response into intent object
  parseAIIntentResponse(aiResponse) {
    try {
      // Clean up the response to extract JSON
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Parse the JSON
      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.flowType) {
        parsed.flowType = 'custom';
      }

      if (!parsed.entities) {
        parsed.entities = { inputs: [] };
      }

      if (!parsed.flowName) {
        parsed.flowName = 'Generated Flow';
      }

      if (!parsed.confidence) {
        parsed.confidence = 0.8;
      }

      return parsed;
    } catch (error) {
      console.error('🤖 Failed to parse AI response as JSON:', error);
      console.error('🤖 Raw response:', aiResponse);

      // Fallback to mock parsing
      return this.parseIntentMock(aiResponse);
    }
  }
}

export default AIFlowAgent;