import React, { useState } from 'react';

const Sidebar = ({ nodes, edges, onTestFlow, testCases, onLoadTestCase }) => {
  const [testResults, setTestResults] = useState(null);
  const [showTestCases, setShowTestCases] = useState(false);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const runTest = () => {
    const results = onTestFlow();
    setTestResults(results);
  };

  return (
    <div className="sidebar">
      <h3>Node Types</h3>
      
      <div
        className="node-item start"
        onDragStart={(event) => onDragStart(event, 'start')}
        draggable
      >
        Start Node
      </div>
      
      <div
        className="node-item input"
        onDragStart={(event) => onDragStart(event, 'input')}
        draggable
      >
        Input Node
      </div>
      
      <div
        className="node-item condition"
        onDragStart={(event) => onDragStart(event, 'condition')}
        draggable
      >
        Condition Node
      </div>
      
      <div
        className="node-item function"
        onDragStart={(event) => onDragStart(event, 'function')}
        draggable
      >
        Function Node
      </div>
      
      <div
        className="node-item end"
        onDragStart={(event) => onDragStart(event, 'end')}
        draggable
      >
        End Node
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Actions</h3>
        
        {/* Test Flow Button */}
        <button 
          onClick={runTest}
          style={{
            width: '100%',
            padding: '10px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '10px'
          }}
        >
          🧪 Run Test
        </button>

        {/* Showcase Examples Button */}
        <button 
          onClick={() => setShowTestCases(!showTestCases)}
          style={{
            width: '100%',
            padding: '10px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '10px'
          }}
        >
          🎯 Examples {showTestCases ? '▼' : '▶'}
        </button>

        {/* Clear Canvas Button */}
        <button 
          onClick={() => {
            onLoadTestCase({ 
              nodes: [
                { id: '1', type: 'start', position: { x: 200, y: 100 }, data: { label: 'Start' } },
                { id: '2', type: 'end', position: { x: 200, y: 250 }, data: { label: 'End' } }
              ], 
              edges: [
                { id: 'e1-2', source: '1', target: '2' }
              ] 
            });
            setTestResults(null);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginBottom: '15px'
          }}
        >
          🗑️ Clear Canvas
        </button>

        {/* Test Cases Dropdown */}
        {showTestCases && testCases && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            marginBottom: '15px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {testCases.map((testCase, index) => (
              <div
                key={index}
                onClick={() => {
                  onLoadTestCase(testCase);
                  setTestResults(null);
                  setShowTestCases(false);
                }}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderBottom: index < testCases.length - 1 ? '1px solid #dee2e6' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                  {testCase.name}
                </div>
                <div style={{ fontSize: '11px', color: '#6c757d' }}>
                  {testCase.description}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {testResults && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>Results:</h4>
            <div style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ 
                  marginBottom: '8px',
                  padding: '6px',
                  borderRadius: '4px',
                  background: result.message.includes('❌') ? 'rgba(220, 53, 69, 0.1)' :
                             result.message.includes('⚠️') ? 'rgba(255, 193, 7, 0.1)' :
                             'rgba(248, 249, 250, 0.5)'
                }}>
                  <strong>{result.nodeId}:</strong> {result.message}
                  
                  {result.conditionDetails && (
                    <div style={{ marginLeft: '10px', fontSize: '10px', color: '#666' }}>
                      <div>Original: <code>{result.conditionDetails.original}</code></div>
                      <div>Evaluated: <code>{result.conditionDetails.evaluated}</code></div>
                      <div>Result: <strong style={{ color: result.conditionDetails.result ? '#28a745' : '#dc3545' }}>
                        {result.conditionDetails.result ? 'TRUE' : 'FALSE'}
                      </strong></div>
                    </div>
                  )}
                  
                  {result.suggestion && (
                    <div style={{ 
                      marginLeft: '10px', 
                      fontSize: '10px', 
                      color: '#856404',
                      background: 'rgba(255, 193, 7, 0.1)',
                      padding: '4px',
                      borderRadius: '2px',
                      marginTop: '4px'
                    }}>
                      💡 {result.suggestion}
                    </div>
                  )}
                  
                  {result.variables && Object.keys(result.variables).length > 0 && (
                    <div style={{ marginLeft: '10px', color: '#666', fontSize: '10px' }}>
                      Variables: {JSON.stringify(result.variables, null, 1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;