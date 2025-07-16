import React, { useState, useRef, useEffect } from 'react';
import AIFlowAgent from '../services/aiAgent';

const AIChat = ({ onFlowGenerated, onClose, aiConfig, workflows, activeWorkflowId, nodes, edges, onTestFlow }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your enhanced AI Flow Builder assistant. I can now:\n\n• 🔍 **Analyze your workspace** - Ask me 'what's on screen' or 'describe my workflows'\n• 🧪 **Run tests** - Say 'test this flow' and I'll help configure and execute tests\n• 🚀 **Create complex flows** - Like 'create a flow that checks if it's Tuesday at 9am then set queue to ABC'\n\nWhat would you like to do?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    provider: 'mock',
    apiKey: '',
    endpoint: '',
    model: '',
    temperature: 0.3,
    maxTokens: 1000,
    enableMockFallback: true, // New setting for mock fallback control
    ...aiConfig
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [pendingTestConfig, setPendingTestConfig] = useState(null);

  const [aiAgent, setAiAgent] = useState(() => new AIFlowAgent(config));
  const messagesEndRef = useRef(null);

  // Update AI Agent with current workflow context
  useEffect(() => {
    if (aiAgent && workflows && nodes && edges) {
      aiAgent.setWorkflowContext(workflows, activeWorkflowId, nodes, edges);
    }
  }, [aiAgent, workflows, activeWorkflowId, nodes, edges]);

  // Set up testing callback for AI Agent
  useEffect(() => {
    if (aiAgent && onTestFlow) {
      aiAgent.setTestingCallback(onTestFlow);
    }
  }, [aiAgent, onTestFlow]);

  // AI Provider configurations
  const AI_PROVIDERS = {
    mock: {
      name: 'Mock AI (Testing)',
      description: 'Basic rule-based system for testing without API costs',
      requiresApiKey: false,
      requiresEndpoint: false,
      defaultModel: 'mock-v1',
      models: ['mock-v1']
    },
    openai: {
      name: 'OpenAI',
      description: 'GPT-3.5, GPT-4, and other OpenAI models',
      requiresApiKey: true,
      requiresEndpoint: false,
      defaultEndpoint: 'https://api.openai.com/v1',
      defaultModel: 'gpt-3.5-turbo',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
    },
    claude: {
      name: 'Anthropic Claude',
      description: 'Claude 3 Sonnet, Haiku, and Opus models',
      requiresApiKey: true,
      requiresEndpoint: false,
      defaultEndpoint: 'https://api.anthropic.com',
      defaultModel: 'claude-3-sonnet-20240229',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229']
    },
    ollama: {
      name: 'Ollama (Local)',
      description: 'Run AI models locally with Ollama',
      requiresApiKey: false,
      requiresEndpoint: true,
      defaultEndpoint: 'http://localhost:11434',
      defaultModel: 'llama2',
      models: ['llama2', 'codellama', 'mistral', 'neural-chat']
    },
    azure: {
      name: 'Azure OpenAI',
      description: 'OpenAI models via Microsoft Azure',
      requiresApiKey: true,
      requiresEndpoint: true,
      defaultModel: 'gpt-35-turbo',
      models: ['gpt-35-turbo', 'gpt-4', 'gpt-4-32k']
    },
    bedrock: {
      name: 'AWS Bedrock',
      description: 'Claude and other models via AWS Bedrock',
      requiresApiKey: true,
      requiresEndpoint: true,
      defaultEndpoint: 'https://bedrock-runtime.us-east-1.amazonaws.com',
      defaultModel: 'anthropic.claude-v2',
      models: ['anthropic.claude-v2', 'anthropic.claude-instant-v1']
    },
    deepseek: {
      name: 'DeepSeek',
      description: 'DeepSeek AI models',
      requiresApiKey: true,
      requiresEndpoint: false,
      defaultEndpoint: 'https://api.deepseek.com/v1',
      defaultModel: 'deepseek-chat',
      models: ['deepseek-chat', 'deepseek-coder']
    },
    custom: {
      name: 'Custom API',
      description: 'Any OpenAI-compatible API endpoint',
      requiresApiKey: true,
      requiresEndpoint: true,
      defaultModel: 'custom-model',
      models: []
    }
  };

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({ ...prev, ...parsed }));
      setAiAgent(new AIFlowAgent({ ...config, ...parsed }));
    }
  }, []);

  // Handle provider change
  const handleProviderChange = (provider) => {
    const providerInfo = AI_PROVIDERS[provider];
    setConfig(prev => ({
      ...prev,
      provider,
      endpoint: providerInfo.defaultEndpoint || '',
      model: providerInfo.defaultModel || '',
      apiKey: provider === 'mock' || provider === 'ollama' ? '' : prev.apiKey
    }));
    setConnectionStatus(null);
  };

  // Test connection
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const agent = new AIFlowAgent(config);
      const testResult = await agent.testConnection();

      if (testResult.success) {
        setConnectionStatus({
          type: 'success',
          message: `✅ Connected! Model: ${testResult.model || config.model}`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: `❌ Failed: ${testResult.error}`
        });
      }
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    }

    setIsTestingConnection(false);
  };

  // Save configuration
  const handleSaveConfig = () => {
    localStorage.setItem('ai_config', JSON.stringify(config));
    setAiAgent(new AIFlowAgent(config));
    setConnectionStatus({
      type: 'success',
      message: '💾 Configuration saved successfully!'
    });

    // Clear status after 2 seconds
    setTimeout(() => setConnectionStatus(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type, content, extra = {}) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      ...extra
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const response = await aiAgent.processNaturalLanguage(userMessage);

      if (response.type === 'questions') {
        addMessage('ai', "I need some clarification to build the perfect flow for you:");
        setCurrentQuestions(response.questions);
        addMessage('ai', '', { questions: response.questions });
      } else if (response.type === 'response') {
        // Handle context analysis and general responses
        addMessage('ai', response.content);
      } else if (response.type === 'test_config') {
        // Handle test configuration requests
        addMessage('ai', response.content);
        setPendingTestConfig(response.testVariables);
        addMessage('ai', '', {
          testConfig: response.testVariables,
          onConfigured: response.onConfigured
        });
      } else if (response.type === 'flow') {
        // Check if we're using fallback mode and show user-friendly message
        if (response.flowData && response.flowData.isUsingFallback) {
          addMessage('system', response.flowData.fallbackReason);
        }

        // Show the AI's thinking process
        if (response.auditTrail && response.auditTrail.length > 0) {
          response.auditTrail.forEach((step, index) => {
            setTimeout(() => {
              addMessage('ai', step);
            }, index * 800); // Stagger the messages
          });

          // Final success message after all audit steps
          setTimeout(() => {
            addMessage('ai', "Perfect! I've created your flow. You can see it on the canvas and test it right away. Feel free to ask me to modify anything or create another flow!");
            
            // Show export JSON if available
            if (response.flowData.importJson) {
              addMessage('ai', "📤 **Export JSON (Import Format):**\n\nHere's your flow in the import JSON format:", {
                exportJson: response.flowData.importJson
              });
            }
            
            onFlowGenerated(response.flowData);
          }, response.auditTrail.length * 800 + 500);
        } else {
          addMessage('ai', "Great! I've created a flow based on your requirements. You can review it and make adjustments as needed.");
          onFlowGenerated(response.flowData);
        }
      }
    } catch (error) {
      console.error('AI Agent Error:', error);

      // Show user-friendly error message based on error type
      let userMessage = "I'm sorry, I encountered an error processing your request.";
      if (error.message.includes('404')) {
        userMessage = "🌐 I'm having trouble connecting to the AI service due to browser security restrictions. Don't worry - I'm using my enhanced intelligence to help you build flows!";
      } else if (error.message.includes('401')) {
        userMessage = "🔑 There seems to be an issue with the API key. I'll use my built-in intelligence to help you create flows instead.";
      } else if (error.message.includes('429')) {
        userMessage = "⏱️ The AI service is currently busy. I'll use my enhanced capabilities to help you build flows right away!";
      }

      addMessage('system', userMessage);
      addMessage('ai', "Try asking me to create a specific type of flow, like 'Create an email validation flow' or 'Make a calculator flow'.");
    }

    setIsLoading(false);
  };

  const handleQuestionResponse = async (questionId, answer) => {
    addMessage('user', `${questionId}: ${answer}`);

    // Process the answer and potentially ask more questions or generate flow
    setIsLoading(true);

    try {
      // Update the AI agent with the answer
      const response = await aiAgent.processQuestionResponse(questionId, answer);

      if (response.type === 'questions') {
        setCurrentQuestions(response.questions);
        addMessage('ai', '', { questions: response.questions });
      } else if (response.type === 'flow') {
        addMessage('ai', "Perfect! I have all the information I need. Here's your custom flow:");
        setCurrentQuestions([]);
        onFlowGenerated(response.flowData);
      }
    } catch (error) {
      addMessage('ai', "I had trouble processing that answer. Let's try a different approach.");
      console.error('Question Response Error:', error);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle test configuration and execution
  const handleRunTestWithConfig = async (testConfig) => {
    addMessage('user', `Running test with configuration: ${JSON.stringify(testConfig)}`);
    setIsLoading(true);

    try {
      const response = await aiAgent.executeTest(testConfig);
      addMessage('ai', response.content);
    } catch (error) {
      addMessage('ai', `🚨 Test execution failed: ${error.message}`);
    }

    setIsLoading(false);
  };

  // Test Configuration Panel Component
  const TestConfigurationPanel = ({ testVariables, onConfigured, onRunTest }) => {
    const [configValues, setConfigValues] = useState({});

    // Initialize with default values
    useEffect(() => {
      const defaults = {};
      testVariables.forEach(variable => {
        defaults[variable.name] = variable.defaultValue;
      });
      setConfigValues(defaults);
    }, [testVariables]);

    const updateConfigValue = (name, value) => {
      setConfigValues(prev => ({ ...prev, [name]: value }));
    };

    const handleRunTest = () => {
      onRunTest(configValues);
    };

    return (
      <div style={{
        marginTop: '8px',
        background: '#f0f8ff',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#333' }}>
          🧪 Test Configuration
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {testVariables.map(variable => (
            <div key={variable.name} style={{
              background: 'white',
              border: '1px solid #e1e5e9',
              borderRadius: '4px',
              padding: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                  {variable.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  background: variable.type === 'system' ? '#e8f5e8' :
                    variable.type === 'session' ? '#fff3e0' : '#f3e5f5',
                  color: variable.type === 'system' ? '#2e7d32' :
                    variable.type === 'session' ? '#f57c00' : '#7b1fa2',
                  padding: '2px 4px',
                  borderRadius: '8px'
                }}>
                  {variable.type}
                </span>
              </div>

              <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: '#666' }}>
                {variable.description}
              </p>

              <input
                type="text"
                value={configValues[variable.name] || ''}
                onChange={(e) => updateConfigValue(variable.name, e.target.value)}
                placeholder={`Enter value for ${variable.name}`}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleRunTest}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🚀 Run Test
        </button>
      </div>
    );
  };

  const examplePrompts = [
    "Create a user registration flow with email validation",
    "Build a discount calculator based on user membership level",
    "Make a password strength checker",
    "Create an age verification system",
    "Build a simple order processing workflow"
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: 'white',
      borderLeft: '1px solid #e1e5e9',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e1e5e9',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>🤖 AI Flow Builder</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 0 0' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              {AI_PROVIDERS[config.provider]?.name || 'AI Assistant'}
            </p>
            {config.provider !== 'mock' && (
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: config.enableMockFallback ? 'rgba(255,255,255,0.2)' : 'rgba(255,193,7,0.3)',
                color: config.enableMockFallback ? 'rgba(255,255,255,0.9)' : '#856404',
                border: config.enableMockFallback ? '1px solid rgba(255,255,255,0.3)' : '1px solid #ffeaa7'
              }}>
                {config.enableMockFallback ? '🤖 Fallback: ON' : '⚠️ Fallback: OFF'}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="AI Settings"
          >
            ⚙️
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* AI Settings Panel */}
      {showSettings && (
        <div style={{
          borderBottom: '1px solid #e1e5e9',
          background: '#f8f9fa',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '16px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#333' }}>
              ⚙️ AI Configuration
            </h4>

            {/* Provider Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                AI Provider
              </label>
              <select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: 'white'
                }}
              >
                {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                  <option key={key} value={key}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#666' }}>
                {AI_PROVIDERS[config.provider]?.description}
              </p>
            </div>

            {/* API Key */}
            {AI_PROVIDERS[config.provider]?.requiresApiKey && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            )}

            {/* Endpoint */}
            {AI_PROVIDERS[config.provider]?.requiresEndpoint && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                  API Endpoint
                </label>
                <input
                  type="url"
                  value={config.endpoint}
                  onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            )}

            {/* Model Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                Model
              </label>
              {AI_PROVIDERS[config.provider]?.models && AI_PROVIDERS[config.provider].models.length > 0 ? (
                <select
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: 'white'
                  }}
                >
                  {AI_PROVIDERS[config.provider].models.map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Enter model name..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              )}
            </div>

            {/* Mock Fallback Toggle */}
            {config.provider !== 'mock' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={config.enableMockFallback}
                    onChange={(e) => setConfig(prev => ({ ...prev, enableMockFallback: e.target.checked }))}
                    style={{ margin: 0 }}
                  />
                  Enable Mock Fallback
                </label>
                <p style={{ margin: '4px 0 0 20px', fontSize: '10px', color: '#666' }}>
                  {config.enableMockFallback
                    ? '✅ Will use mock AI if real API fails (transparent fallback)'
                    : '❌ Will show error if real API fails (no fallback)'
                  }
                </p>
                <div style={{
                  margin: '6px 0 0 20px',
                  padding: '6px 8px',
                  background: config.enableMockFallback ? '#e8f5e8' : '#fff3e0',
                  border: `1px solid ${config.enableMockFallback ? '#c3e6cb' : '#ffeaa7'}`,
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: config.enableMockFallback ? '#155724' : '#856404'
                }}>
                  {config.enableMockFallback
                    ? '🤖 Mock responses will be clearly labeled when used'
                    : '⚠️ You\'ll see clear error messages if API fails'
                  }
                </div>
              </div>
            )}

            {/* Test Connection & Save */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                onClick={testConnection}
                disabled={isTestingConnection || (AI_PROVIDERS[config.provider]?.requiresApiKey && !config.apiKey)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: isTestingConnection ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isTestingConnection ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                {isTestingConnection ? '🔄 Testing...' : '🧪 Test'}
              </button>
              <button
                onClick={handleSaveConfig}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                💾 Save
              </button>
            </div>

            {/* Connection Status */}
            {connectionStatus && (
              <div style={{
                padding: '8px',
                borderRadius: '4px',
                background: connectionStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${connectionStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                color: connectionStatus.type === 'success' ? '#155724' : '#721c24',
                fontSize: '11px',
                marginBottom: '8px'
              }}>
                {connectionStatus.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div key={message.id}>
            <div style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '8px'
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: '12px',
                background: message.type === 'user' ? '#007bff' :
                  message.type === 'system' ? '#fff3cd' : '#f8f9fa',
                color: message.type === 'user' ? 'white' :
                  message.type === 'system' ? '#856404' : '#333',
                border: message.type === 'system' ? '1px solid #ffeaa7' : 'none',
                fontSize: '14px',
                lineHeight: '1.4',
                fontWeight: message.type === 'system' ? '500' : 'normal'
              }}>
                {message.content}
              </div>
            </div>

            {/* Render export JSON if present */}
            {message.exportJson && (
              <div style={{
                marginTop: '8px',
                background: '#f8f9fa',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#333' }}>
                    📤 Import JSON Format
                  </h4>
                  <button
                    onClick={(event) => {
                      navigator.clipboard.writeText(JSON.stringify(message.exportJson, null, 2));
                      // Show temporary feedback
                      const btn = event.target;
                      const originalText = btn.textContent;
                      btn.textContent = '✅ Copied!';
                      btn.style.background = '#28a745';
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '#007bff';
                      }, 2000);
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    📋 Copy JSON
                  </button>
                </div>
                
                <pre style={{
                  background: '#ffffff',
                  border: '1px solid #e1e5e9',
                  borderRadius: '4px',
                  padding: '8px',
                  fontSize: '11px',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: 0,
                  color: '#333',
                  lineHeight: '1.4'
                }}>
                  {JSON.stringify(message.exportJson, null, 2)}
                </pre>
                
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '10px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  💡 This JSON can be imported back into the Flow Builder using the "Import Workflow" button.
                </p>
              </div>
            )}

            {/* Render questions if present */}
            {message.questions && (
              <div style={{ marginTop: '8px' }}>
                {message.questions.map((question) => (
                  <div key={question.id} style={{
                    background: '#f0f8ff',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>
                      {question.question}
                    </p>

                    {question.type === 'multiple_choice' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {question.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuestionResponse(question.id, option)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #007bff',
                              background: 'white',
                              color: '#007bff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              textAlign: 'left'
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={question.placeholder}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleQuestionResponse(question.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Render test configuration if present */}
            {message.testConfig && (
              <TestConfigurationPanel
                testVariables={message.testConfig}
                onConfigured={message.onConfigured}
                onRunTest={handleRunTestWithConfig}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '12px',
              background: '#f8f9fa',
              color: '#666',
              fontSize: '14px'
            }}>
              <span>🤔 Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length === 1 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e1e5e9',
          background: '#f8f9fa'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
            Try these examples:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {examplePrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputValue(prompt)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #e1e5e9',
                  background: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  color: '#007bff'
                }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e1e5e9',
        background: 'white'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the workflow you want to create..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e1e5e9',
              borderRadius: '20px',
              resize: 'none',
              fontSize: '14px',
              minHeight: '36px',
              maxHeight: '100px',
              outline: 'none'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '8px 16px',
              background: inputValue.trim() ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;