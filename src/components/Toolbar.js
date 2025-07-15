import React, { useState, useRef } from 'react';

const Toolbar = ({ nodes, edges, onLoadFlow, currentFlowInfo, validation, showValidation, setShowValidation, onShowAIChat, onShowAISettings }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [flowName, setFlowName] = useState('');
  const fileInputRef = useRef(null);

  const saveFlow = () => {
    if (!flowName.trim()) {
      alert('Please enter a name for your flow');
      return;
    }

    // Check for validation errors before saving
    if (validation && validation.errors.length > 0) {
      const confirmSave = window.confirm(
        `⚠️ WARNING: This flow has ${validation.errors.length} validation error${validation.errors.length !== 1 ? 's' : ''}:\n\n` +
        validation.errors.map(e => `• ${e.message}`).join('\n') +
        '\n\nDo you want to save it anyway? The flow may not execute properly.'
      );
      
      if (!confirmSave) {
        return;
      }
    }

    const flowData = {
      name: flowName,
      nodes: nodes,
      edges: edges,
      createdAt: new Date().toISOString(),
      version: '1.0',
      validation: validation // Include validation status in saved file
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${flowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    setShowSaveDialog(false);
    setFlowName('');
  };

  const loadFlow = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target.result);
        
        // Validate the flow data structure
        if (!flowData.nodes || !flowData.edges) {
          alert('Invalid flow file format');
          return;
        }

        onLoadFlow(flowData);
      } catch (error) {
        alert('Error loading flow file: ' + error.message);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Left side - Title and Flow Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #fff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔄 Flow Builder
        </h1>
        
        {currentFlowInfo && (
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontWeight: 'bold' }}>📄 {currentFlowInfo.name}</span>
            <span style={{ opacity: 0.8 }}>
              💾 {formatDate(currentFlowInfo.createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Right side - Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Node Count */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          📊 {nodes.length} nodes
        </div>

        {/* Save Button */}
        <button
          onClick={() => setShowSaveDialog(true)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          💾 Save Flow
        </button>

        {/* Load Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          📂 Load Flow
        </button>

        {/* AI Settings Button */}
        <button
          onClick={onShowAISettings}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(0)';
          }}
          title="Configure AI Provider"
        >
          ⚙️ AI
        </button>

        {/* AI Chat Button */}
        <button
          onClick={onShowAIChat}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          🤖 AI Assistant
        </button>

        {/* Validation Status */}
        {validation && (
          <button
            onClick={() => setShowValidation(!showValidation)}
            style={{
              background: validation.isValid 
                ? 'rgba(40, 167, 69, 0.2)' 
                : validation.errors.length > 0 
                  ? 'rgba(220, 53, 69, 0.2)'
                  : 'rgba(255, 193, 7, 0.2)',
              border: `1px solid ${validation.isValid 
                ? 'rgba(40, 167, 69, 0.4)' 
                : validation.errors.length > 0 
                  ? 'rgba(220, 53, 69, 0.4)'
                  : 'rgba(255, 193, 7, 0.4)'}`,
              color: validation.isValid 
                ? '#28a745' 
                : validation.errors.length > 0 
                  ? '#dc3545'
                  : '#856404',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {validation.isValid ? '✅' : validation.errors.length > 0 ? '🚨' : '⚠️'}
            {validation.isValid 
              ? 'Valid' 
              : `${validation.errors.length} Error${validation.errors.length !== 1 ? 's' : ''}`}
            {validation.warnings.length > 0 && `, ${validation.warnings.length} Warning${validation.warnings.length !== 1 ? 's' : ''}`}
            {showValidation ? ' ▼' : ' ▶'}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={loadFlow}
          style={{ display: 'none' }}
        />
      </div>

      {/* Save Dialog Modal */}
      {showSaveDialog && (
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
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            minWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
              💾 Save Your Flow
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#666',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Flow Name:
              </label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Enter a name for your flow..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                autoFocus
              />
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#666'
            }}>
              <div><strong>📊 Nodes:</strong> {nodes.length}</div>
              <div><strong>🔗 Connections:</strong> {edges.length}</div>
              <div><strong>📅 Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>⏰ Time:</strong> {new Date().toLocaleTimeString()}</div>
              
              {/* Validation Status in Save Dialog */}
              {validation && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px',
                  borderRadius: '4px',
                  background: validation.isValid 
                    ? 'rgba(40, 167, 69, 0.1)' 
                    : validation.errors.length > 0 
                      ? 'rgba(220, 53, 69, 0.1)'
                      : 'rgba(255, 193, 7, 0.1)',
                  border: `1px solid ${validation.isValid 
                    ? 'rgba(40, 167, 69, 0.2)' 
                    : validation.errors.length > 0 
                      ? 'rgba(220, 53, 69, 0.2)'
                      : 'rgba(255, 193, 7, 0.2)'}`
                }}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: validation.isValid 
                      ? '#28a745' 
                      : validation.errors.length > 0 
                        ? '#dc3545'
                        : '#856404'
                  }}>
                    {validation.isValid ? '✅ Flow is Valid' : 
                     validation.errors.length > 0 ? '🚨 Flow has Errors' : '⚠️ Flow has Warnings'}
                  </div>
                  {validation.errors.length > 0 && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#dc3545' }}>
                      {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''} detected
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#856404' }}>
                      {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''} detected
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setFlowName('');
                }}
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
                onClick={saveFlow}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💾 Save Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;