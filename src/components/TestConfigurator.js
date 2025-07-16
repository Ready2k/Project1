import React, { useState, useEffect } from 'react';

const TestConfigurator = ({ nodes, onConfigChange, currentConfig = {} }) => {
  const [config, setConfig] = useState(currentConfig);
  const [detectedVariables, setDetectedVariables] = useState([]);

  // Analyze nodes to detect variables and objects used in conditions
  useEffect(() => {
    const variables = new Set();
    const objects = new Set();
    
    nodes.forEach(node => {
      if (node.type === 'condition' && node.data.condition) {
        const condition = node.data.condition;
        
        // Extract object method calls like queue.AgentStaffed, date.After, etc.
        const objectMatches = condition.match(/(\w+)\.(\w+)/g);
        if (objectMatches) {
          objectMatches.forEach(match => {
            const [objectName] = match.split('.');
            objects.add(objectName);
          });
        }
        
        // Extract simple variables
        const variableMatches = condition.match(/\b(\w+)\b/g);
        if (variableMatches) {
          variableMatches.forEach(variable => {
            // Skip common JavaScript keywords and functions
            if (!['true', 'false', 'null', 'undefined', 'return', 'function', 'var', 'let', 'const'].includes(variable.toLowerCase())) {
              variables.add(variable);
            }
          });
        }
      }
    });
    
    // Convert to array and create configuration structure
    const detected = [
      ...Array.from(objects).map(obj => ({
        name: obj,
        type: 'object',
        methods: getMethodsForObject(obj, nodes)
      })),
      ...Array.from(variables).filter(v => !objects.has(v)).map(variable => ({
        name: variable,
        type: 'variable',
        dataType: guessDataType(variable, nodes)
      }))
    ];
    
    setDetectedVariables(detected);
  }, [nodes]);

  // Get methods used for a specific object
  const getMethodsForObject = (objectName, nodes) => {
    const methods = new Set();
    nodes.forEach(node => {
      if (node.type === 'condition' && node.data.condition) {
        const regex = new RegExp(`${objectName}\\.(\\w+)`, 'g');
        let match;
        while ((match = regex.exec(node.data.condition)) !== null) {
          methods.add(match[1]);
        }
      }
    });
    return Array.from(methods);
  };

  // Guess data type based on variable name and usage
  const guessDataType = (variable, nodes) => {
    const name = variable.toLowerCase();
    if (name.includes('date') || name.includes('time')) return 'date';
    if (name.includes('count') || name.includes('number') || name.includes('age')) return 'number';
    if (name.includes('email')) return 'email';
    if (name.includes('phone')) return 'phone';
    if (name.includes('url')) return 'url';
    return 'string';
  };

  // Update configuration
  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Get default value for object methods
  const getDefaultObjectValue = (objectName, method) => {
    const defaults = {
      queue: {
        AgentStaffed: 2,
        QueueDepth: 5,
        LongestWaitTime: 15
      },
      date: {
        After: new Date().toISOString().split('T')[0],
        Before: new Date().toISOString().split('T')[0],
        Equals: new Date().toISOString().split('T')[0]
      },
      now: {
        After: '09:00',
        Before: '17:00'
      },
      today: {
        Equals: 'MON'
      },
      session: {}
    };
    
    return defaults[objectName]?.[method] || '';
  };

  if (detectedVariables.length === 0) {
    return (
      <div style={{
        padding: '12px',
        background: '#f8f9fa',
        border: '1px solid #e1e5e9',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        No test variables detected in this workflow
      </div>
    );
  }

  return (
    <div style={{
      background: '#f8f9fa',
      border: '1px solid #e1e5e9',
      borderRadius: '6px',
      padding: '12px'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '13px', 
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        🧪 Test Configuration
        <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
          ({detectedVariables.length} variables detected)
        </span>
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {detectedVariables.map(variable => (
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
              marginBottom: '6px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>
                {variable.name}
              </span>
              <span style={{
                fontSize: '10px',
                background: variable.type === 'object' ? '#e3f2fd' : '#f3e5f5',
                color: variable.type === 'object' ? '#1976d2' : '#7b1fa2',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {variable.type}
              </span>
            </div>
            
            {variable.type === 'object' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {variable.methods.map(method => (
                  <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#666', minWidth: '80px' }}>
                      .{method}()
                    </span>
                    <input
                      type="text"
                      value={config[`${variable.name}.${method}`] || getDefaultObjectValue(variable.name, method)}
                      onChange={(e) => updateConfig(`${variable.name}.${method}`, e.target.value)}
                      placeholder={`Value for ${variable.name}.${method}`}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <input
                type={variable.dataType === 'number' ? 'number' : 
                      variable.dataType === 'date' ? 'date' :
                      variable.dataType === 'email' ? 'email' : 'text'}
                value={config[variable.name] || ''}
                onChange={(e) => updateConfig(variable.name, e.target.value)}
                placeholder={`Enter ${variable.dataType} value`}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '10px',
        padding: '6px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '3px',
        fontSize: '10px',
        color: '#856404'
      }}>
        💡 These values will be used when testing conditions in this workflow
      </div>
    </div>
  );
};

export default TestConfigurator;