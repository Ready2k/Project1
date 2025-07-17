import React, { useState } from 'react';

const Sidebar = ({ nodes, edges, testCases, onLoadTestCase }) => {
  const [showTestCases, setShowTestCases] = useState(false);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
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
        
        {/* Testing moved to top toolbar */}

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
        

      </div>
    </div>
  );
};

export default Sidebar;