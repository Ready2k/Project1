import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const ConditionNode = ({ data, id }) => {
  const { deleteElements, getNodes } = useReactFlow();
  const [condition, setCondition] = useState(data.condition || 'value > 0');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'Condition');
  const [showTemplates, setShowTemplates] = useState(false);
  const [availableVariables, setAvailableVariables] = useState([]);
  const [conditionError, setConditionError] = useState('');
  const [previewResult, setPreviewResult] = useState('');

  // Common condition templates
  const conditionTemplates = [
    { label: 'Number Comparison', value: 'value > 10' },
    { label: 'Text Equals', value: 'name === "John"' },
    { label: 'Text Contains', value: 'email.includes("@gmail.com")' },
    { label: 'Range Check', value: 'age >= 18 && age <= 65' },
    { label: 'Not Empty', value: 'text && text.length > 0' },
    { label: 'Email Validation', value: '/^[^@]+@[^@]+\\.[^@]+$/.test(email)' },
    { label: 'Password Strength', value: 'password.length >= 8 && /[A-Z]/.test(password)' },
    { label: 'Multiple Conditions', value: 'score > 80 || attempts < 3' },
    { label: 'Array Check', value: 'Array.isArray(data) && data.length > 0' },
    { label: 'Date Comparison', value: 'new Date(date) > new Date("2023-01-01")' }
  ];

  // Get available variables from input nodes
  useEffect(() => {
    const nodes = getNodes();
    const inputNodes = nodes.filter(node => node.type === 'input');
    const variables = inputNodes.map(node => node.data.variable || 'value');
    setAvailableVariables([...new Set(variables)]);
  }, [getNodes]);

  const handleConditionChange = (e) => {
    const newCondition = e.target.value;
    setCondition(newCondition);
    data.condition = newCondition;
    
    // Validate and preview condition
    validateCondition(newCondition);
  };

  const validateCondition = (conditionText) => {
    try {
      // Create a test environment with sample variables
      const testVars = {};
      availableVariables.forEach(varName => {
        testVars[varName] = varName === 'age' ? 25 : 
                           varName === 'score' ? 85 :
                           varName === 'name' ? 'John' :
                           varName === 'email' ? 'test@example.com' :
                           varName === 'password' ? 'Password123' :
                           10; // default number
      });

      // Replace variables in condition
      const testCondition = conditionText.replace(/(\w+)/g, (match) => {
        return testVars.hasOwnProperty(match) ? JSON.stringify(testVars[match]) : match;
      });

      const result = eval(testCondition);
      setConditionError('');
      setPreviewResult(`Preview: ${result} (with test data)`);
    } catch (error) {
      setConditionError(`Error: ${error.message}`);
      setPreviewResult('');
    }
  };

  const selectTemplate = (template) => {
    setCondition(template.value);
    data.condition = template.value;
    setShowTemplates(false);
    validateCondition(template.value);
  };

  const onDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    data.label = e.target.value;
  };

  return (
    <div style={{
      padding: '15px',
      borderRadius: '8px',
      background: '#ffc107',
      color: '#856404',
      border: '2px solid #e0a800',
      minWidth: '150px',
      position: 'relative'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#e0a800' }}
      />
      
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}
      >
        ×
      </button>
      
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        {isEditingLabel ? (
          <input
            type="text"
            value={label}
            onChange={handleLabelChange}
            onBlur={() => setIsEditingLabel(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(0,0,0,0.3)',
              color: '#856404',
              textAlign: 'center',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '14px',
              fontWeight: 'bold',
              width: '100%'
            }}
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setIsEditingLabel(true)}
            style={{ cursor: 'pointer' }}
          >
            {label}
          </div>
        )}
      </div>
      
      {/* Available Variables */}
      {availableVariables.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', marginBottom: '2px', color: '#666' }}>
            Available: {availableVariables.join(', ')}
          </div>
        </div>
      )}

      {/* Templates Button */}
      <div style={{ marginBottom: '8px' }}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '3px',
            cursor: 'pointer',
            color: '#856404'
          }}
        >
          📋 Templates
        </button>
      </div>

      {/* Template Dropdown */}
      {showTemplates && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {conditionTemplates.map((template, index) => (
            <div
              key={index}
              onClick={() => selectTemplate(template)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '11px',
                color: '#333'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {template.label}
              </div>
              <div style={{ fontFamily: 'monospace', color: '#666' }}>
                {template.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Condition Input with Syntax Highlighting */}
      {isEditing ? (
        <div>
          <textarea
            value={condition}
            onChange={handleConditionChange}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
            style={{
              width: '100%',
              padding: '6px',
              border: conditionError ? '2px solid #dc3545' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              minHeight: '40px',
              resize: 'vertical'
            }}
            placeholder="Enter condition (e.g., value > 10)"
            autoFocus
          />
          
          {/* Error Message */}
          {conditionError && (
            <div style={{
              fontSize: '10px',
              color: '#dc3545',
              marginTop: '2px',
              padding: '2px 4px',
              background: 'rgba(220, 53, 69, 0.1)',
              borderRadius: '2px'
            }}>
              {conditionError}
            </div>
          )}
          
          {/* Preview Result */}
          {previewResult && (
            <div style={{
              fontSize: '10px',
              color: '#28a745',
              marginTop: '2px',
              padding: '2px 4px',
              background: 'rgba(40, 167, 69, 0.1)',
              borderRadius: '2px'
            }}>
              {previewResult}
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => {
            setIsEditing(true);
            validateCondition(condition);
          }}
          style={{
            fontSize: '12px',
            cursor: 'pointer',
            padding: '6px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '4px',
            minHeight: '40px',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {condition}
        </div>
      )}
      
      {/* True output */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ 
          background: '#28a745',
          top: '60%',
          right: '-8px'
        }}
      />
      <div style={{
        position: 'absolute',
        right: '15px',
        top: '55%',
        fontSize: '10px',
        color: '#28a745',
        fontWeight: 'bold'
      }}>
        TRUE
      </div>
      
      {/* False output */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ 
          background: '#dc3545',
          bottom: '-8px'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: '#dc3545',
        fontWeight: 'bold'
      }}>
        FALSE
      </div>
    </div>
  );
};

export default ConditionNode;