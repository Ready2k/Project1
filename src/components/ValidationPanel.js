import React from 'react';

const ValidationPanel = ({ validation, onHighlightNode }) => {
  if (!validation) return null;

  const { isValid, errors, warnings, summary } = validation;

  const getIcon = (severity) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getColor = (severity) => {
    switch (severity) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      default: return '#17a2b8';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      right: '20px',
      width: '320px',
      background: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #dee2e6',
        background: isValid ? '#d4edda' : '#f8d7da',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          color: isValid ? '#155724' : '#721c24'
        }}>
          {isValid ? '✅' : '🚨'} Flow Validation
        </div>
        

      </div>

      {/* Summary */}
      <div style={{
        padding: '12px 16px',
        background: '#f8f9fa',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><strong>📊 Nodes:</strong> {summary.totalNodes}</div>
          <div><strong>🔗 Edges:</strong> {summary.totalEdges}</div>
          <div><strong>🚀 Start:</strong> {summary.startNodes}</div>
          <div><strong>🏁 End:</strong> {summary.endNodes}</div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#dc3545',
            fontSize: '13px'
          }}>
            ❌ Errors ({errors.length})
          </div>
          {errors.map((error, index) => (
            <div
              key={index}
              style={{
                padding: '8px',
                marginBottom: '6px',
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: error.nodeId ? 'pointer' : 'default'
              }}
              onClick={() => error.nodeId && onHighlightNode(error.nodeId)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span>{getIcon(error.severity)}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: getColor(error.severity) }}>
                    {error.message}
                  </div>
                  {error.nodeId && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      Click to highlight node
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#856404',
            fontSize: '13px'
          }}>
            ⚠️ Warnings ({warnings.length})
          </div>
          {warnings.map((warning, index) => (
            <div
              key={index}
              style={{
                padding: '8px',
                marginBottom: '6px',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.2)',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: warning.nodeId ? 'pointer' : 'default'
              }}
              onClick={() => warning.nodeId && onHighlightNode(warning.nodeId)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span>{getIcon(warning.severity)}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: getColor(warning.severity) }}>
                    {warning.message}
                  </div>
                  {warning.nodeId && (
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      Click to highlight node
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {isValid && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#155724',
          fontSize: '14px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontWeight: 'bold' }}>Flow is Valid!</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Ready for execution
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;