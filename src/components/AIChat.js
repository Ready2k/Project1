import React, { useState, useRef, useEffect } from 'react';
import AIFlowAgent from '../services/aiAgent';

const AIChat = ({ onFlowGenerated, onClose, aiConfig }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI Flow Builder assistant. Describe the workflow you'd like to create, and I'll help you build it step by step.",
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
    ...aiConfig
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const [aiAgent, setAiAgent] = useState(() => new AIFlowAgent(config));
  const messagesEndRef = useRef(null);

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
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            {AI_PROVIDERS[config.provider]?.name || 'AI Assistant'}
          </p>
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