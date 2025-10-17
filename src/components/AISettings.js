import React, { useState, useEffect } from 'react';

const AISettings = ({ onClose, onSave }) => {
  const [config, setConfig] = useState({
    provider: 'mock',
    apiKey: '',
    endpoint: '',
    model: '',
    temperature: 0.3,
    maxTokens: 1000
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

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

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('ai_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({ ...prev, ...parsed }));
    }
  }, []);

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

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Import the AI agent and test the connection
      const { default: AIFlowAgent } = await import('../services/aiAgent');
      const agent = new AIFlowAgent(config);
      
      const testResult = await agent.testConnection();
      
      if (testResult.success) {
        setConnectionStatus({
          type: 'success',
          message: `✅ Connected successfully! Model: ${testResult.model || config.model}`
        });
      } else {
        setConnectionStatus({
          type: 'error',
          message: `❌ Connection failed: ${testResult.error}`
        });
      }
    } catch (error) {
      setConnectionStatus({
        type: 'error',
        message: `❌ Connection failed: ${error.message}`
      });
    }

    setIsTestingConnection(false);
  };

  const handleSave = () => {
    // Save configuration to localStorage
    localStorage.setItem('ai_config', JSON.stringify(config));
    onSave(config);
    onClose();
  };

  const currentProvider = AI_PROVIDERS[config.provider];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        width: '600px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e1e5e9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
              🤖 AI Configuration
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              Configure your AI provider for natural language flow creation
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Provider Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              AI Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                <option key={key} value={key}>
                  {provider.name}
                </option>
              ))}
            </select>
            <p style={{
              margin: '6px 0 0 0',
              fontSize: '12px',
              color: '#666'
            }}>
              {currentProvider.description}
            </p>
          </div>

          {/* API Key */}
          {currentProvider.requiresApiKey && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your API key..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <p style={{
                margin: '6px 0 0 0',
                fontSize: '12px',
                color: '#666'
              }}>
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
          )}

          {/* Endpoint */}
          {currentProvider.requiresEndpoint && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                API Endpoint
              </label>
              <input
                type="url"
                value={config.endpoint}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api.example.com/v1"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          {/* Model Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Model
            </label>
            {currentProvider.models && currentProvider.models.length > 0 ? (
              <select
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {currentProvider.models.map(model => (
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
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            )}
          </div>

          {/* Advanced Settings */}
          <details style={{ marginBottom: '20px' }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px'
            }}>
              Advanced Settings
            </summary>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  Temperature ({config.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0 0' }}>
                  Lower = more focused, Higher = more creative
                </p>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={config.maxTokens}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </details>

          {/* Test Connection */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={testConnection}
              disabled={isTestingConnection || (currentProvider.requiresApiKey && !config.apiKey)}
              style={{
                padding: '10px 20px',
                background: isTestingConnection ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isTestingConnection ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {isTestingConnection ? '🔄 Testing...' : '🧪 Test Connection'}
            </button>

            {connectionStatus && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '6px',
                background: connectionStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${connectionStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                color: connectionStatus.type === 'success' ? '#155724' : '#721c24',
                fontSize: '14px'
              }}>
                {connectionStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e1e5e9',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ccc',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#28a745',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;