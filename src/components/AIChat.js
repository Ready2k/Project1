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

  const [aiAgent, setAiAgent] = useState(() => new AIFlowAgent(aiConfig));

  // Update AI agent when config changes
  useEffect(() => {
    if (aiConfig) {
      setAiAgent(new AIFlowAgent(aiConfig));
    }
  }, [aiConfig]);
  const messagesEndRef = useRef(null);

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
      console.log('🤖 Processing user input:', userMessage);
      console.log('🤖 Current AI config:', aiConfig);
      console.log('🤖 AI Agent provider:', aiAgent.config?.provider);
      
      const response = await aiAgent.processNaturalLanguage(userMessage);

      if (response.type === 'questions') {
        addMessage('ai', "I need some clarification to build the perfect flow for you:");
        setCurrentQuestions(response.questions);
        addMessage('ai', '', { questions: response.questions });
      } else if (response.type === 'flow') {
        addMessage('ai', "Great! I've created a flow based on your requirements. You can review it and make adjustments as needed.");
        onFlowGenerated(response.flowData);
      }
    } catch (error) {
      console.error('🤖 AI Agent Error:', error);
      addMessage('ai', `❌ I encountered an error: ${error.message}. Please check your AI configuration and try again.`);
    }

    setIsLoading(false);
  };

  const testAIConnection = async () => {
    setIsLoading(true);
    addMessage('system', '🧪 Testing AI connection...');
    
    try {
      const testResult = await aiAgent.testConnection();
      
      if (testResult.success) {
        addMessage('system', `✅ AI connection successful! Using model: ${testResult.model}`);
        addMessage('ai', "Hi! I'm ready to help you create flows. Try asking me something like 'Create a flow to validate email addresses' or 'Make a calculator flow'.");
      } else {
        addMessage('system', `❌ AI connection failed: ${testResult.error}`);
      }
    } catch (error) {
      console.error('🤖 Connection test error:', error);
      addMessage('system', `❌ Connection test failed: ${error.message}`);
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
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>🤖 AI Flow Builder</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
              Describe your workflow in natural language
            </p>
          </div>
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
        
        {/* Test Connection Button */}
        <button
          onClick={testAIConnection}
          disabled={isLoading}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '🔄 Testing...' : '🧪 Test AI Connection'}
        </button>
      </div>

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
                background: message.type === 'user' ? '#007bff' : '#f8f9fa',
                color: message.type === 'user' ? 'white' : '#333',
                fontSize: '14px',
                lineHeight: '1.4'
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