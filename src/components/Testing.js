import React, { useState, useEffect } from 'react';

const Testing = ({ nodes, edges, onTestFlow }) => {
  const [testResults, setTestResults] = useState(null);
  const [testConfig, setTestConfig] = useState({});
  const [detectedVariables, setDetectedVariables] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Analyze nodes to detect system variables and session variables used in conditions
  useEffect(() => {
    console.log('Testing component analyzing nodes:', nodes.length);
    console.log('Nodes data:', nodes.map(n => ({ id: n.id, type: n.type, condition: n.data?.condition })));
    const systemVariables = new Set();
    const sessionVariables = new Set();
    const simpleVariables = new Set();

    nodes.forEach(node => {
      if (node.type === 'condition' && node.data.condition) {
        const condition = node.data.condition;
        console.log('Analyzing condition:', condition);

        // Extract system variables like ${QueueNameToARN/BI_ISS_CustServe}
        const systemVarMatches = condition.match(/\$\{([^}]+)\}/g);
        if (systemVarMatches) {
          console.log('Found system variable matches:', systemVarMatches);
          systemVarMatches.forEach(match => {
            const variableName = match.slice(2, -1); // Remove ${ and }
            systemVariables.add(variableName);
            console.log('Added system variable:', variableName);
          });
        }

        // Extract session variables like session['OECachedServiceIdentifier']
        const sessionMatches = condition.match(/session\[['"]([^'"]+)['"]\]/g);
        if (sessionMatches) {
          console.log('Found session variable matches:', sessionMatches);
          sessionMatches.forEach(match => {
            const sessionKey = match.match(/session\[['"]([^'"]+)['"]\]/)[1];
            sessionVariables.add(sessionKey);
            console.log('Added session variable:', sessionKey);
          });
        }

        // Extract simple variables (but skip common keywords and system/session vars)
        const variableMatches = condition.match(/\b(\w+)\b/g);
        if (variableMatches) {
          variableMatches.forEach(variable => {
            // Skip common JavaScript keywords, object names, and already detected vars
            const skipWords = ['true', 'false', 'null', 'undefined', 'return', 'function', 'var', 'let', 'const', 
                             'queue', 'date', 'now', 'today', 'session', 'After', 'Before', 'Equals', 'AgentStaffed', 
                             'QueueDepth', 'LongestWaitTime'];
            if (!skipWords.includes(variable) && !variable.match(/^\d+$/)) {
              simpleVariables.add(variable);
              console.log('Added simple variable:', variable);
            }
          });
        }
      }
    });

    // Convert to array and create configuration structure
    const detected = [
      // System variables (highest priority)
      ...Array.from(systemVariables).map(variable => ({
        name: variable,
        type: 'system',
        dataType: guessDataType(variable),
        description: `System variable: \${${variable}}`
      })),
      // Session variables
      ...Array.from(sessionVariables).map(variable => ({
        name: variable,
        type: 'session',
        dataType: 'string',
        description: `Session variable: session['${variable}']`
      })),
      // Simple variables
      ...Array.from(simpleVariables).map(variable => ({
        name: variable,
        type: 'variable',
        dataType: guessDataType(variable),
        description: `Variable: ${variable}`
      }))
    ];

    console.log('Final detected variables:', detected);
    setDetectedVariables(detected);
    
    // Auto-populate default values for system variables
    if (detected.length > 0) {
      const defaultConfig = {};
      detected.forEach(variable => {
        if (variable.type === 'system') {
          // Set default value for system variables
          defaultConfig[variable.name] = '1'; // Default queue name/ID
        } else if (variable.type === 'session') {
          // Set default value for session variables
          defaultConfig[variable.name] = 'test_value';
        }
      });
      
      if (Object.keys(defaultConfig).length > 0) {
        console.log('Setting default test config:', defaultConfig);
        setTestConfig(defaultConfig);
      }
    }
  }, [nodes]);

  // Guess data type based on variable name
  const guessDataType = (variable) => {
    const name = variable.toLowerCase();
    if (name.includes('date') || name.includes('time')) return 'date';
    if (name.includes('count') || name.includes('number') || name.includes('age')) return 'number';
    if (name.includes('email')) return 'email';
    if (name.includes('phone')) return 'phone';
    if (name.includes('url')) return 'url';
    return 'string';
  };

  // Update test configuration
  const updateTestConfig = (key, value) => {
    const newConfig = { ...testConfig, [key]: value };
    console.log('Updating test config:', newConfig);
    setTestConfig(newConfig);
  };

  // Re-analyze nodes to detect any changes in conditions
  const reAnalyzeNodes = () => {
    console.log('Re-analyzing nodes for changes before test...');
    console.log('Current nodes received by Testing component:', nodes.map(n => ({ 
      id: n.id, 
      type: n.type, 
      condition: n.data?.condition 
    })));
    
    const systemVariables = new Set();
    const sessionVariables = new Set();
    const simpleVariables = new Set();

    nodes.forEach(node => {
      if (node.type === 'condition' && node.data.condition) {
        const condition = node.data.condition;
        console.log('Re-analyzing condition:', condition);

        // Extract system variables like ${QueueNameToARN/BI_ISS_CustServe}
        const systemVarMatches = condition.match(/\$\{([^}]+)\}/g);
        if (systemVarMatches) {
          systemVarMatches.forEach(match => {
            const variableName = match.slice(2, -1); // Remove ${ and }
            systemVariables.add(variableName);
          });
        }

        // Extract session variables like session['OECachedServiceIdentifier']
        const sessionMatches = condition.match(/session\[['"]([^'"]+)['"]\]/g);
        if (sessionMatches) {
          sessionMatches.forEach(match => {
            const sessionKey = match.match(/session\[['"]([^'"]+)['"]\]/)[1];
            sessionVariables.add(sessionKey);
          });
        }

        // Extract simple variables
        const variableMatches = condition.match(/\b(\w+)\b/g);
        if (variableMatches) {
          variableMatches.forEach(variable => {
            const skipWords = ['true', 'false', 'null', 'undefined', 'return', 'function', 'var', 'let', 'const', 
                             'queue', 'date', 'now', 'today', 'session', 'After', 'Before', 'Equals', 'AgentStaffed', 
                             'QueueDepth', 'LongestWaitTime'];
            if (!skipWords.includes(variable) && !variable.match(/^\d+$/)) {
              simpleVariables.add(variable);
            }
          });
        }
      }
    });

    // Convert to array and create configuration structure
    const currentlyDetected = [
      ...Array.from(systemVariables).map(variable => ({
        name: variable,
        type: 'system',
        dataType: guessDataType(variable),
        description: `System variable: \${${variable}}`
      })),
      ...Array.from(sessionVariables).map(variable => ({
        name: variable,
        type: 'session',
        dataType: 'string',
        description: `Session variable: session['${variable}']`
      })),
      ...Array.from(simpleVariables).map(variable => ({
        name: variable,
        type: 'variable',
        dataType: guessDataType(variable),
        description: `Variable: ${variable}`
      }))
    ];

    console.log('Currently detected variables:', currentlyDetected);

    // Check if we have new variables that aren't in our current config
    const newVariables = currentlyDetected.filter(detected => 
      !detectedVariables.some(existing => existing.name === detected.name && existing.type === detected.type)
    );

    if (newVariables.length > 0) {
      console.log('Found new variables:', newVariables);
      
      // Update detected variables
      setDetectedVariables(currentlyDetected);
      
      // Add default values for new variables
      const updatedConfig = { ...testConfig };
      newVariables.forEach(variable => {
        if (variable.type === 'system') {
          updatedConfig[variable.name] = '1';
        } else if (variable.type === 'session') {
          updatedConfig[variable.name] = 'test_value';
        }
      });
      
      if (Object.keys(updatedConfig).length !== Object.keys(testConfig).length) {
        console.log('Updating test config with new variables:', updatedConfig);
        setTestConfig(updatedConfig);
        return updatedConfig;
      }
    }

    return testConfig;
  };

  // Run test with current configuration
  const runTest = () => {
    // Re-analyze nodes to catch any changes in conditions
    const currentConfig = reAnalyzeNodes();
    console.log('Running test with config:', currentConfig);
    const results = onTestFlow(currentConfig);
    setTestResults(results);
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      {/* Testing Header Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '10px',
          background: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>🧪 Testing</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Testing Panel */}
      {isExpanded && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e1e5e9',
          borderRadius: '0 0 4px 4px',
          padding: '12px'
        }}>
          {/* Configuration Section */}
          {detectedVariables.length > 0 ? (
            <div style={{ marginBottom: '12px' }}>
              <h5 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '12px', 
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚙️ Test Configuration
                <span style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
                  ({detectedVariables.length} variables detected)
                </span>
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
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
                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333'
                        }}>
                          {variable.name}
                        </span>
                        {variable.description && (
                          <div style={{
                            fontSize: '9px',
                            color: '#666',
                            marginTop: '2px'
                          }}>
                            {variable.description}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '9px',
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
                    
                    <input
                      type={variable.dataType === 'number' ? 'number' :
                          variable.dataType === 'date' ? 'date' :
                              variable.dataType === 'email' ? 'email' : 'text'}
                      value={testConfig[variable.name] || ''}
                      onChange={(e) => updateTestConfig(variable.name, e.target.value)}
                      placeholder={`Enter ${variable.dataType} value for ${variable.type} variable`}
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
            </div>
          ) : (
            <div style={{
              padding: '8px',
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '3px',
              fontSize: '11px',
              color: '#856404',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              No test variables detected in this workflow
              <div style={{ fontSize: '9px', marginTop: '2px', color: '#999' }}>
                Analyzed {nodes.length} nodes
              </div>
            </div>
          )}

          {/* Test Button */}
          <button 
            onClick={runTest}
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

          {/* Test Results */}
          {testResults && (
            <div style={{ marginTop: '12px' }}>
              <h5 style={{ fontSize: '12px', margin: '0 0 8px 0', color: '#333' }}>📊 Test Results:</h5>
              <div style={{
                background: 'white',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #e1e5e9'
              }}>
                {testResults.map((result, index) => (
                  <div key={index} style={{ 
                    marginBottom: '6px',
                    padding: '4px',
                    borderRadius: '3px',
                    background: result.message.includes('❌') ? 'rgba(220, 53, 69, 0.1)' :
                               result.message.includes('⚠️') ? 'rgba(255, 193, 7, 0.1)' :
                               'rgba(248, 249, 250, 0.5)'
                  }}>
                    <strong style={{ fontSize: '10px' }}>{result.nodeId}:</strong> 
                    <span style={{ fontSize: '10px' }}> {result.message}</span>
                    
                    {result.conditionDetails && (
                      <div style={{ marginLeft: '8px', fontSize: '9px', color: '#666', marginTop: '2px' }}>
                        <div>Original: <code style={{ fontSize: '8px' }}>{result.conditionDetails.original}</code></div>
                        <div>Evaluated: <code style={{ fontSize: '8px' }}>{result.conditionDetails.evaluated}</code></div>
                        <div>Result: <strong style={{ 
                          color: result.conditionDetails.result ? '#28a745' : '#dc3545',
                          fontSize: '9px'
                        }}>
                          {result.conditionDetails.result ? 'TRUE' : 'FALSE'}
                        </strong></div>
                      </div>
                    )}
                    
                    {result.suggestion && (
                      <div style={{ 
                        marginLeft: '8px', 
                        fontSize: '9px', 
                        color: '#856404',
                        background: 'rgba(255, 193, 7, 0.1)',
                        padding: '2px',
                        borderRadius: '2px',
                        marginTop: '2px'
                      }}>
                        💡 {result.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            marginTop: '8px',
            padding: '4px',
            background: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '3px',
            fontSize: '9px',
            color: '#0c5460'
          }}>
            💡 Configure test values above, then click "Run Test" to execute the workflow
          </div>
        </div>
      )}
    </div>
  );
};

export default Testing;