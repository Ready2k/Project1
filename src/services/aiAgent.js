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
    
    console.log('🧠 AI Context updated:', {
      totalWorkflows: this.workflowContext.workflows.length,
      activeWorkflow: this.workflowContext.workflows.find(w => w.id === activeWorkflowId)?.name,
      currentNodeCount: this.workflowContext.currentNodes.length
    });
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

      await response.json(); // Parse response but don't need the data
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
    // Check if user is asking for context analysis
    if (this.isContextAnalysisRequest(userInput)) {
      return await this.analyzeCurrentContext(userInput);
    }

    // Check if user wants to run tests
    if (this.isTestRequest(userInput)) {
      return await this.handleTestRequest(userInput);
    }

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
    if (!this.workflowContext) {
      return {
        type: 'response',
        content: "I don't have access to your current workflow context yet. Please make sure I'm connected to your workspace."
      };
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

    // Analyze what needs to be tested
    const testAnalysis = this.analyzeTestRequirements();
    
    if (testAnalysis.needsConfiguration) {
      return {
        type: 'test_config',
        content: `🧪 **Ready to test your workflow!**\n\n${testAnalysis.description}\n\n**Test Configuration Needed:**`,
        testVariables: testAnalysis.variables,
        onConfigured: 'run_test'
      };
    }

    // Run the test directly if no configuration needed
    return await this.executeTest();
  }

  // Analyze what's needed for testing
  analyzeTestRequirements() {
    const ctx = this.workflowContext;
    const conditions = ctx.currentNodes.filter(n => n.type === 'condition' && n.condition);
    const inputs = ctx.currentNodes.filter(n => n.type === 'input');
    
    let description = `I found ${conditions.length} condition(s) and ${inputs.length} input(s) in your workflow.`;
    let needsConfiguration = false;
    let variables = [];

    // Analyze conditions for system variables
    conditions.forEach(node => {
      const condition = node.condition;
      
      // Check for system variables like ${...}
      const systemVars = condition.match(/\$\{([^}]+)\}/g);
      if (systemVars) {
        systemVars.forEach(match => {
          const varName = match.slice(2, -1);
          variables.push({
            name: varName,
            type: 'system',
            description: `System variable: ${match}`,
            defaultValue: '1'
          });
          needsConfiguration = true;
        });
      }

      // Check for session variables
      const sessionVars = condition.match(/session\[['"]([^'"]+)['"]\]/g);
      if (sessionVars) {
        sessionVars.forEach(match => {
          const key = match.match(/session\[['"]([^'"]+)['"]\]/)[1];
          variables.push({
            name: key,
            type: 'session',
            description: `Session variable: session['${key}']`,
            defaultValue: 'test_value'
          });
          needsConfiguration = true;
        });
      }
    });

    // Add input variables
    inputs.forEach(node => {
      if (node.variable) {
        variables.push({
          name: node.variable,
          type: 'input',
          description: `Input variable: ${node.variable}`,
          defaultValue: node.value || '10'
        });
      }
    });

    return {
      description,
      needsConfiguration,
      variables: variables.filter((v, i, arr) => arr.findIndex(x => x.name === v.name) === i) // Remove duplicates
    };
  }

  // Execute test with current configuration
  async executeTest(testConfig = {}) {
    try {
      const results = await this.testingCallback(testConfig);
      return this.interpretTestResults(results, testConfig);
    } catch (error) {
      return {
        type: 'response',
        content: `🚨 **Test execution failed:**\n\n${error.message}\n\nPlease check your workflow configuration and try again.`
      };
    }
  }

  // Interpret and explain test results
  interpretTestResults(results, testConfig) {
    let interpretation = "🧪 **Test Results Analysis:**\n\n";
    
    const successCount = results.filter(r => !r.message.includes('❌') && !r.message.includes('⚠️')).length;
    const errorCount = results.filter(r => r.message.includes('❌')).length;
    const warningCount = results.filter(r => r.message.includes('⚠️')).length;

    // Summary
    interpretation += `📊 **Summary:**\n`;
    interpretation += `✅ Successful steps: ${successCount}\n`;
    if (errorCount > 0) interpretation += `❌ Errors: ${errorCount}\n`;
    if (warningCount > 0) interpretation += `⚠️ Warnings: ${warningCount}\n`;
    interpretation += `\n`;

    // Test configuration used
    if (Object.keys(testConfig).length > 0) {
      interpretation += `⚙️ **Test Configuration:**\n`;
      Object.entries(testConfig).forEach(([key, value]) => {
        interpretation += `• ${key} = ${value}\n`;
      });
      interpretation += `\n`;
    }

    // Detailed results
    interpretation += `📋 **Execution Flow:**\n`;
    results.forEach((result, index) => {
      if (result.conditionDetails) {
        const emoji = result.conditionDetails.result ? '✅' : '❌';
        interpretation += `${index + 1}. ${emoji} **${result.nodeId}**: ${result.conditionDetails.original}\n`;
        interpretation += `   → Evaluated to: ${result.conditionDetails.result ? 'TRUE' : 'FALSE'}\n`;
      } else {
        const emoji = result.message.includes('❌') ? '❌' : 
                     result.message.includes('⚠️') ? '⚠️' : '✅';
        interpretation += `${index + 1}. ${emoji} **${result.nodeId}**: ${result.message}\n`;
      }
    });

    // Suggestions
    interpretation += `\n💡 **Suggestions:**\n`;
    if (errorCount > 0) {
      interpretation += `• Fix the errors above to ensure proper workflow execution\n`;
    }
    if (warningCount > 0) {
      interpretation += `• Review the warnings to improve workflow reliability\n`;
    }
    interpretation += `• Try different test values to verify all workflow paths\n`;
    interpretation += `• Ask me to "create a flow" if you need help building new workflows\n`;

    return {
      type: 'response',
      content: interpretation,
      testResults: results,
      testConfig: testConfig
    };
  }

  // Generate conversational audit trail showing AI's thinking process
  generateAuditTrail(intent) {
    const trail = [];
    
    // Step 1: Understanding the request
    trail.push(`🧠 I understand you want to create a ${intent.flowType} flow. Let me analyze the requirements...`);
    
    // Step 2: Identifying inputs
    if (intent.entities.inputs && intent.entities.inputs.length > 0) {
      const inputNames = intent.entities.inputs.map(input => input.name).join(', ');
      trail.push(`📝 I've identified these inputs: ${inputNames}. Setting up input nodes...`);
    }
    
    // Step 3: Flow type specific logic
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
    
    // Step 4: Flow structure
    const nodeCount = this.estimateNodeCount(intent.flowType, intent.entities);
    trail.push(`🔗 Connecting ${nodeCount} nodes together to create your complete workflow...`);
    
    // Step 5: Final setup
    trail.push(`🎯 Adding start and end points to make your flow ready for testing...`);
    
    return trail;
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
    
    // Enhanced naming for complex time/date/queue scenarios
    if (lowerInput.includes('tuesday') && lowerInput.includes('9am') && lowerInput.includes('queue')) {
      return 'Tuesday 9AM Queue Routing';
    }
    if (lowerInput.includes('day') && lowerInput.includes('time') && lowerInput.includes('queue')) {
      return 'Time-Based Queue Routing';
    }
    if (lowerInput.includes('queue') && (lowerInput.includes('abc') || lowerInput.includes('routing'))) {
      return 'Queue Assignment Flow';
    }
    
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
      case 'time_queue_routing': return 'Time-Based Queue Routing';
      case 'date_queue_routing': return 'Date-Based Queue Routing';
      case 'queue_routing': return 'Queue Routing Flow';
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
      
      // Check if mock fallback is enabled
      if (this.config.enableMockFallback !== false) {
        console.log('🤖 Using mock fallback (enabled in settings)');
        
        // Fallback to enhanced mock implementation
        const mockResult = this.parseIntentMock(input);
        
        // Add clear fallback info to the result
        return {
          ...mockResult,
          fallbackReason: `🤖 **Using Mock AI Fallback**\n\n${userMessage}\n\n✨ You can disable this fallback in AI Settings if you prefer to see error messages instead.`,
          isUsingFallback: true
        };
      } else {
        // Mock fallback is disabled, throw the original error
        console.log('❌ Mock fallback disabled, throwing error');
        throw new Error(`${this.config.provider} API failed: ${error.message}\n\nMock fallback is disabled in AI Settings. Enable it if you want automatic fallback to mock AI.`);
      }
    }
  }

  // Create a comprehensive system prompt with tool capabilities
  createIntentPrompt(input) {
    const systemContext = this.buildSystemContext();
    
    return `# Flow Builder AI Assistant

You are an expert AI assistant for a visual workflow creation tool called Flow Builder. You help users create, test, and analyze complex workflows using natural language.

## Your Capabilities & Tool Knowledge:

### Flow Builder Features:
- **Visual Workflow Design**: Drag-and-drop interface with multiple node types
- **Multi-Tab System**: Users can have multiple workflows (Rule1, Rule2, etc.) in separate tabs
- **JSON Import**: Complex routing workflows can be imported from JSON with system variables
- **Real-time Testing**: Workflows can be tested with configurable values
- **Rule Linking**: Workflows can reference and navigate to other workflows

### Node Types You Can Create:
1. **Start Node**: Entry point (always needed)
2. **Input Node**: Define variables (name, value) - e.g., age=25, email="user@test.com"
3. **Condition Node**: Branching logic with TRUE/FALSE paths
   - Simple: \`age >= 18\`, \`email.includes("@")\`
   - Complex: \`queue.AgentStaffed('QueueName')>0\`
   - Time-based: \`now.After('09:00')\`, \`today.Equals('TUE')\`
   - System variables: \`session['key']=='value'\`
4. **Function Node**: Execute JavaScript code, transform data
5. **End Node**: Terminal points with labels

### Advanced Capabilities:
- **System Variables**: Handle \${QueueNameToARN/ServiceName} patterns
- **Session Variables**: Process session['key'] expressions  
- **Queue Operations**: queue.AgentStaffed(), queue.QueueDepth(), queue.LongestWaitTime()
- **Time/Date Logic**: now.After('09:00'), today.Equals('MON','WED','FRI'), date.After('2021-03-07')
- **Testing Integration**: Configure test values and execute workflows
- **Context Analysis**: Describe current workspace and workflows

### Current Workspace Context:
${systemContext}

## Your Role:
Act as a knowledgeable human assistant who understands workflows deeply. When users ask you to:
- **Create flows**: Design complete workflows with proper node connections
- **Test flows**: Help configure test values and interpret results  
- **Describe flows**: Explain what workflows do and how they work
- **Analyze workspace**: Describe current tabs, conditions, and structure

## User Request:
"${input}"

## Response Format:
Respond with a JSON object containing your analysis and recommendations:

{
  "flowType": "validation|calculation|decision|time_routing|queue_routing|workflow",
  "entities": {
    "inputs": [{"name": "variableName", "defaultValue": "value", "description": "what this input represents"}],
    "conditions": ["condition expressions with explanations"],
    "systemVariables": ["system variables needed like QueueNameToARN/ServiceName"],
    "sessionVariables": ["session variables like OECachedServiceIdentifier"],
    "timeLogic": ["time/date conditions if applicable"],
    "queueOperations": ["queue operations if applicable"],
    "validationRule": "condition if validation type",
    "formula": "calculation if calculation type"
  },
  "flowName": "descriptive name for the workflow",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation of your analysis and design decisions",
  "testingGuidance": "suggestions for testing this workflow",
  "humanExplanation": "explain what this workflow does in plain English"
}

Be thorough, knowledgeable, and helpful. Think like an expert who understands both the technical implementation and the business logic behind workflows.`;
  }

  // Build comprehensive system context
  buildSystemContext() {
    if (!this.workflowContext) {
      return "No workspace context available - user hasn't loaded any workflows yet.";
    }

    const ctx = this.workflowContext;
    let context = `**Current Workspace:**\n`;
    context += `- Total workflows: ${ctx.workflows.length}\n`;
    context += `- Active workflow: ${ctx.workflows.find(w => w.id === ctx.activeWorkflowId)?.name || 'None'}\n`;
    context += `- Current nodes: ${ctx.currentNodes.length}\n\n`;

    // Workflow details
    context += `**Available Workflows:**\n`;
    ctx.workflows.forEach(workflow => {
      const isActive = workflow.id === ctx.activeWorkflowId;
      context += `- ${workflow.name}${isActive ? ' (ACTIVE)' : ''}: ${workflow.nodeCount} nodes`;
      if (workflow.isImported) context += ` (Imported from JSON)`;
      if (workflow.hasConditions) {
        const conditionCount = workflow.conditions.filter(c => c).length;
        context += ` - ${conditionCount} conditions`;
      }
      context += `\n`;
    });

    // Current workflow details
    if (ctx.currentNodes.length > 0) {
      context += `\n**Active Workflow Details:**\n`;
      const conditions = ctx.currentNodes.filter(n => n.type === 'condition' && n.condition);
      if (conditions.length > 0) {
        context += `**Conditions:**\n`;
        conditions.forEach((node, index) => {
          context += `${index + 1}. ${node.condition}\n`;
        });
      }

      const inputs = ctx.currentNodes.filter(n => n.type === 'input');
      if (inputs.length > 0) {
        context += `**Input Variables:**\n`;
        inputs.forEach(node => {
          context += `- ${node.variable || 'variable'} = ${node.value || 'value'}\n`;
        });
      }
    }

    return context;
  }

  // Parse AI response for intent analysis
  parseAIIntentResponse(aiResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the enhanced response
        return {
          flowType: parsed.flowType || 'workflow',
          entities: {
            inputs: parsed.entities?.inputs || [],
            conditions: parsed.entities?.conditions || [],
            systemVariables: parsed.entities?.systemVariables || [],
            sessionVariables: parsed.entities?.sessionVariables || [],
            timeLogic: parsed.entities?.timeLogic || [],
            queueOperations: parsed.entities?.queueOperations || [],
            validationRule: parsed.entities?.validationRule,
            formula: parsed.entities?.formula
          },
          flowName: parsed.flowName || 'AI Generated Flow',
          confidence: Math.min(Math.max(parsed.confidence || 0.9, 0), 1),
          reasoning: parsed.reasoning || 'AI analysis completed',
          testingGuidance: parsed.testingGuidance || 'Test with various input values',
          humanExplanation: parsed.humanExplanation || 'This workflow processes your inputs and provides results based on the defined logic.'
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('AI Response was:', aiResponse);
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
    
    const flowData = {
      name: intent.flowName || 'AI Generated Flow',
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      version: '1.0',
      aiGenerated: true,
      originalPrompt: intent.originalInput
    };
    
    // Also generate the import JSON format
    flowData.importJson = this.convertToImportFormat(intent, nodes, edges);
    
    return flowData;
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
      decision: ['decide', 'choose', 'if', 'condition', 'tuesday', 'monday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'before', 'after', 'time', 'am', 'pm'],
      time_routing: ['tuesday', 'monday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'time', 'am', 'pm', 'before', 'after'],
      queue_routing: ['queue', 'routing', 'route'],
      workflow: ['process', 'workflow', 'steps', 'sequence']
    };
    
    // Check for time-based routing first (more specific)
    if (keywords.some(word => ['tuesday', 'monday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(word)) &&
        keywords.some(word => ['am', 'pm', 'time', 'before', 'after'].includes(word))) {
      return 'time_routing';
    }
    
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
    
    console.log('🔍 Extracting entities from:', input);
    
    // Enhanced time/date/condition extraction for Tuesday 9am scenario
    const conditions = [];
    
    // Check for Tuesday + 9am pattern specifically
    if (lowerInput.includes('tuesday') && (lowerInput.includes('9am') || lowerInput.includes('9:00') || lowerInput.includes('before 9'))) {
      console.log('🔍 Detected Tuesday + 9am pattern');
      
      // Create two conditions for sequential checking
      conditions.push("today.Equals('TUE')");
      
      if (lowerInput.includes('before 9')) {
        conditions.push("now.Before('09:00')");
      } else {
        conditions.push("now.After('09:00')");
      }
      
      entities.conditions = conditions;
      entities.timeLogic = ['Tuesday check', '9AM time check'];
      
      // Set up inputs for testing
      entities.inputs = [
        { name: 'today', defaultValue: 'TUE' },
        { name: 'currentTime', defaultValue: '08:30' }
      ];
    }
    // Check for other day + time patterns
    else if (lowerInput.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/) && 
             lowerInput.match(/\b(\d{1,2})(am|pm|:\d{2})\b/)) {
      console.log('🔍 Detected day + time pattern');
      
      const dayMatch = lowerInput.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
      const timeMatch = lowerInput.match(/\b(\d{1,2})(am|pm|:\d{2})\b/);
      
      if (dayMatch && timeMatch) {
        const dayCode = {
          'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED',
          'thursday': 'THU', 'friday': 'FRI', 'saturday': 'SAT', 'sunday': 'SUN'
        }[dayMatch[1]];
        
        conditions.push(`today.Equals('${dayCode}')`);
        
        let timeCondition = '';
        if (lowerInput.includes('before')) {
          timeCondition = `now.Before('${timeMatch[1].padStart(2, '0')}:00')`;
        } else {
          timeCondition = `now.After('${timeMatch[1].padStart(2, '0')}:00')`;
        }
        conditions.push(timeCondition);
        
        entities.conditions = conditions;
        entities.timeLogic = [`${dayMatch[1]} check`, `${timeMatch[0]} time check`];
      }
    }
    
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
    
    // Only extract variables if we don't already have time-based inputs
    if (!entities.inputs) {
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
    
    console.log('🔧 Generating logic nodes for intent:', intent);
    console.log('🔧 Flow type:', intent.flowType);
    console.log('🔧 Entities:', intent.entities);
    
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
        
      case 'decision':
      case 'time_routing':
      case 'date_routing':
        // Use AI-provided conditions for sophisticated decision logic
        const conditions = intent.entities.conditions || [];
        const timeLogic = intent.entities.timeLogic || [];
        const queueOperations = intent.entities.queueOperations || [];
        
        console.log('🔧 Creating decision nodes with conditions:', conditions);
        console.log('🔧 Time logic:', timeLogic);
        console.log('🔧 Queue operations:', queueOperations);
        
        if (conditions.length > 0) {
          // Create condition nodes for each AI-provided condition
          conditions.forEach((condition, index) => {
            nodes.push({
              id: String(nodeId++),
              type: 'condition',
              position: { x: 200, y: yPosition },
              data: {
                label: `Check ${index + 1}`,
                condition: condition
              }
            });
            yPosition += 180;
          });
        } else {
          // Fallback: create a basic condition node
          nodes.push({
            id: String(nodeId++),
            type: 'condition',
            position: { x: 200, y: yPosition },
            data: {
              label: 'Decision Check',
              condition: 'value > 0'
            }
          });
        }
        break;
        
      case 'queue_routing':
        // Handle queue routing with system variables
        const systemVars = intent.entities.systemVariables || [];
        const sessionVars = intent.entities.sessionVariables || [];
        
        console.log('🔧 Creating queue routing with system vars:', systemVars);
        console.log('🔧 Session vars:', sessionVars);
        
        // Create condition for queue routing
        let queueCondition = 'queue.AgentStaffed("QueueName") > 0';
        if (intent.entities.conditions && intent.entities.conditions.length > 0) {
          queueCondition = intent.entities.conditions[0];
        }
        
        nodes.push({
          id: String(nodeId++),
          type: 'condition',
          position: { x: 200, y: yPosition },
          data: {
            label: 'Queue Check',
            condition: queueCondition
          }
        });
        break;
        
      default:
        // Enhanced default: try to use AI-provided conditions or create a function
        if (intent.entities.conditions && intent.entities.conditions.length > 0) {
          nodes.push({
            id: String(nodeId++),
            type: 'condition',
            position: { x: 200, y: yPosition },
            data: {
              label: 'Logic Check',
              condition: intent.entities.conditions[0]
            }
          });
        } else {
          nodes.push({
            id: String(nodeId++),
            type: 'function',
            position: { x: 200, y: yPosition },
            data: {
              label: 'Process Data',
              code: intent.entities.formula || 'return variables;'
            }
          });
        }
        break;
    }
    
    return { nodes, nextId: nodeId, nextY: yPosition + 150 };
  }

  generateEndNodes(intent, startId, startY) {
    const nodes = [];
    let nodeId = startId;
    
    console.log('🏁 Generating end nodes for flow type:', intent.flowType);
    console.log('🏁 Intent entities:', intent.entities);
    
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
    } else if (intent.flowType === 'decision' || intent.flowType === 'time_routing' || intent.flowType === 'date_routing') {
      // For decision flows (like Tuesday + 9am check), create TRUE/FALSE end nodes
      const conditions = intent.entities.conditions || [];
      
      if (conditions.length > 1) {
        // Multiple conditions - create TRUE/FALSE end nodes
        nodes.push(
          {
            id: String(nodeId++),
            type: 'end',
            position: { x: 350, y: startY },
            data: { label: 'True ✓' }
          },
          {
            id: String(nodeId++),
            type: 'end',
            position: { x: 50, y: startY },
            data: { label: 'False ✗' }
          }
        );
      } else {
        // Single condition - still create TRUE/FALSE paths
        nodes.push(
          {
            id: String(nodeId++),
            type: 'end',
            position: { x: 350, y: startY },
            data: { label: 'True ✓' }
          },
          {
            id: String(nodeId++),
            type: 'end',
            position: { x: 50, y: startY },
            data: { label: 'False ✗' }
          }
        );
      }
    } else if (intent.flowType === 'queue_routing') {
      // Queue routing flows - create specific end nodes
      nodes.push(
        {
          id: String(nodeId++),
          type: 'end',
          position: { x: 350, y: startY },
          data: { label: 'Route to Queue' }
        },
        {
          id: String(nodeId++),
          type: 'end',
          position: { x: 50, y: startY },
          data: { label: 'Default Route' }
        }
      );
    } else {
      // Default single end node
      nodes.push({
        id: String(nodeId++),
        type: 'end',
        position: { x: 200, y: startY },
        data: { label: 'Complete' }
      });
    }
    
    console.log('🏁 Generated end nodes:', nodes.map(n => ({ id: n.id, label: n.data.label })));
    return { nodes, nextId: nodeId };
  }

  generateEdges(nodes, intent) {
    const edges = [];
    
    console.log('🔗 Generating edges for nodes:', nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label })));
    
    // Get different node types
    const startNodes = nodes.filter(n => n.type === 'start');
    const inputNodes = nodes.filter(n => n.type === 'input');
    const conditionNodes = nodes.filter(n => n.type === 'condition');
    const functionNodes = nodes.filter(n => n.type === 'function');
    const endNodes = nodes.filter(n => n.type === 'end');
    
    console.log('🔗 Node breakdown:', {
      start: startNodes.length,
      input: inputNodes.length,
      condition: conditionNodes.length,
      function: functionNodes.length,
      end: endNodes.length
    });
    
    // Connect start to first input or first logic node
    if (startNodes.length > 0) {
      const startNode = startNodes[0];
      let nextNode = null;
      
      if (inputNodes.length > 0) {
        nextNode = inputNodes[0];
      } else if (conditionNodes.length > 0) {
        nextNode = conditionNodes[0];
      } else if (functionNodes.length > 0) {
        nextNode = functionNodes[0];
      } else if (endNodes.length > 0) {
        nextNode = endNodes[0];
      }
      
      if (nextNode) {
        edges.push({
          id: `e${startNode.id}-${nextNode.id}`,
          source: startNode.id,
          target: nextNode.id
        });
        console.log('🔗 Connected start to:', nextNode.data.label);
      }
    }
    
    // Connect input nodes in sequence
    for (let i = 0; i < inputNodes.length - 1; i++) {
      edges.push({
        id: `e${inputNodes[i].id}-${inputNodes[i + 1].id}`,
        source: inputNodes[i].id,
        target: inputNodes[i + 1].id
      });
      console.log('🔗 Connected input nodes:', inputNodes[i].data.label, '->', inputNodes[i + 1].data.label);
    }
    
    // Connect last input to first logic node
    if (inputNodes.length > 0) {
      const lastInput = inputNodes[inputNodes.length - 1];
      let nextLogicNode = null;
      
      if (conditionNodes.length > 0) {
        nextLogicNode = conditionNodes[0];
      } else if (functionNodes.length > 0) {
        nextLogicNode = functionNodes[0];
      } else if (endNodes.length > 0) {
        nextLogicNode = endNodes[0];
      }
      
      if (nextLogicNode) {
        edges.push({
          id: `e${lastInput.id}-${nextLogicNode.id}`,
          source: lastInput.id,
          target: nextLogicNode.id
        });
        console.log('🔗 Connected last input to logic:', lastInput.data.label, '->', nextLogicNode.data.label);
      }
    }
    
    // Handle condition nodes - this is the key fix!
    if (conditionNodes.length > 0) {
      if (intent.flowType === 'validation' && endNodes.length === 2) {
        // Validation flow: single condition with TRUE/FALSE paths
        const condition = conditionNodes[0];
        const trueNode = endNodes.find(n => n.data.label.includes('✓') || n.data.label.includes('Valid'));
        const falseNode = endNodes.find(n => n.data.label.includes('✗') || n.data.label.includes('Invalid'));
        
        if (trueNode) {
          edges.push({
            id: `e${condition.id}-${trueNode.id}`,
            source: condition.id,
            target: trueNode.id,
            sourceHandle: 'true'
          });
          console.log('🔗 Connected condition TRUE to:', trueNode.data.label);
        }
        
        if (falseNode) {
          edges.push({
            id: `e${condition.id}-${falseNode.id}`,
            source: condition.id,
            target: falseNode.id,
            sourceHandle: 'false'
          });
          console.log('🔗 Connected condition FALSE to:', falseNode.data.label);
        }
      } else {
        // Sequential condition flow (like Tuesday + 9am check)
        for (let i = 0; i < conditionNodes.length; i++) {
          const currentCondition = conditionNodes[i];
          
          if (i < conditionNodes.length - 1) {
            // Connect to next condition on TRUE path
            const nextCondition = conditionNodes[i + 1];
            edges.push({
              id: `e${currentCondition.id}-${nextCondition.id}`,
              source: currentCondition.id,
              target: nextCondition.id,
              sourceHandle: 'true'
            });
            console.log('🔗 Connected condition TRUE to next condition:', currentCondition.data.label, '->', nextCondition.data.label);
            
            // Connect FALSE path to end node
            if (endNodes.length > 0) {
              const falseEndNode = endNodes.find(n => n.data.label.includes('False') || n.data.label.includes('✗')) || endNodes[endNodes.length - 1];
              edges.push({
                id: `e${currentCondition.id}-${falseEndNode.id}`,
                source: currentCondition.id,
                target: falseEndNode.id,
                sourceHandle: 'false'
              });
              console.log('🔗 Connected condition FALSE to end:', currentCondition.data.label, '->', falseEndNode.data.label);
            }
          } else {
            // Last condition - connect both paths to end nodes
            if (endNodes.length >= 2) {
              const trueEndNode = endNodes.find(n => n.data.label.includes('True') || n.data.label.includes('✓')) || endNodes[0];
              const falseEndNode = endNodes.find(n => n.data.label.includes('False') || n.data.label.includes('✗')) || endNodes[1];
              
              edges.push({
                id: `e${currentCondition.id}-${trueEndNode.id}`,
                source: currentCondition.id,
                target: trueEndNode.id,
                sourceHandle: 'true'
              });
              console.log('🔗 Connected last condition TRUE to:', trueEndNode.data.label);
              
              edges.push({
                id: `e${currentCondition.id}-${falseEndNode.id}`,
                source: currentCondition.id,
                target: falseEndNode.id,
                sourceHandle: 'false'
              });
              console.log('🔗 Connected last condition FALSE to:', falseEndNode.data.label);
            } else if (endNodes.length === 1) {
              // Single end node - connect TRUE path
              edges.push({
                id: `e${currentCondition.id}-${endNodes[0].id}`,
                source: currentCondition.id,
                target: endNodes[0].id,
                sourceHandle: 'true'
              });
              console.log('🔗 Connected last condition TRUE to single end:', endNodes[0].data.label);
            }
          }
        }
      }
    }
    
    // Connect function nodes to end nodes
    if (functionNodes.length > 0 && endNodes.length > 0) {
      functionNodes.forEach(funcNode => {
        edges.push({
          id: `e${funcNode.id}-${endNodes[0].id}`,
          source: funcNode.id,
          target: endNodes[0].id
        });
        console.log('🔗 Connected function to end:', funcNode.data.label, '->', endNodes[0].data.label);
      });
    }
    
    console.log('🔗 Generated edges:', edges);
    return edges;
  }

  // Convert generated flow to import JSON format
  convertToImportFormat(intent, nodes, edges) {
    console.log('📤 Converting flow to import JSON format');
    console.log('📤 Intent:', intent);
    console.log('📤 Flow type:', intent.flowType);
    
    // Generate a unique ID for the workflow
    const workflowId = this.generateWorkflowId(intent.flowName || 'AI_Generated_Flow');
    
    // Determine the workflow type and structure based on the flow
    const conditionNodes = nodes.filter(n => n.type === 'condition');
    const functionNodes = nodes.filter(n => n.type === 'function');
    
    if (conditionNodes.length > 0) {
      // Decision type workflow
      const expressions = conditionNodes.map(node => node.data.condition);
      
      return {
        id: workflowId,
        type: "decision",
        label: intent.flowName || 'AI Generated Decision',
        details: {
          expressions: expressions,
          resultType: "endpoint"
        }
      };
    } else if (functionNodes.length > 0) {
      // Endpoint type workflow
      const functionNode = functionNodes[0];
      
      // Extract queue information if present in the function code
      let queueName = "DefaultQueue";
      let isDefault = false;
      
      if (functionNode.data.code) {
        const queueMatch = functionNode.data.code.match(/queueName:\s*["']([^"']+)["']/);
        if (queueMatch) {
          queueName = queueMatch[1];
        }
        
        const defaultMatch = functionNode.data.code.match(/isDefault:\s*(true|false)/);
        if (defaultMatch) {
          isDefault = defaultMatch[1] === 'true';
        }
      }
      
      return {
        id: workflowId,
        type: "endpoint",
        label: functionNode.data.label || intent.flowName || 'AI Generated Function',
        details: {
          queueName: queueName,
          isDefault: isDefault
        }
      };
    } else {
      // Default to endpoint type for simple workflows
      return {
        id: workflowId,
        type: "endpoint",
        label: intent.flowName || 'AI Generated Flow',
        details: {
          queueName: "DefaultQueue",
          isDefault: false
        }
      };
    }
  }

  // Generate a unique workflow ID
  generateWorkflowId(flowName) {
    // Convert flow name to a valid ID format
    const baseId = flowName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    
    return `${baseId}_${timestamp}`;
  }
}

export default AIFlowAgent;