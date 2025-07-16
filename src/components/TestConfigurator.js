import React, { useState, useEffect } from 'react';

const TestConfigurator = ({ nodes, onConfigChange, currentConfig = {} }) => {
    const [config, setConfig] = useState(currentConfig);
    const [detectedVariables, setDetectedVariables] = useState([]);

    // Analyze nodes to detect system variables and session variables used in conditions
    useEffect(() => {
        console.log('TestConfigurator analyzing nodes:', nodes.length);
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
                console.log('Setting default config:', defaultConfig);
                setConfig(prev => ({ ...prev, ...defaultConfig }));
            }
        }
    }, [nodes]);

    // Separate useEffect to handle config changes
    useEffect(() => {
        if (Object.keys(config).length > 0) {
            console.log('Config changed, calling onConfigChange with:', config);
            onConfigChange(config);
        }
    }, [config, onConfigChange]);



    // Guess data type based on variable name and usage
    const guessDataType = (variable) => {
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
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#999' }}>
                    Analyzed {nodes.length} nodes
                </div>
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
                            <div>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#333'
                                }}>
                                    {variable.name}
                                </span>
                                {variable.description && (
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#666',
                                        marginTop: '2px'
                                    }}>
                                        {variable.description}
                                    </div>
                                )}
                            </div>
                            <span style={{
                                fontSize: '10px',
                                background: variable.type === 'system' ? '#e8f5e8' :
                                    variable.type === 'session' ? '#fff3e0' :
                                        variable.type === 'object' ? '#e3f2fd' : '#f3e5f5',
                                color: variable.type === 'system' ? '#2e7d32' :
                                    variable.type === 'session' ? '#f57c00' :
                                        variable.type === 'object' ? '#1976d2' : '#7b1fa2',
                                padding: '2px 6px',
                                borderRadius: '10px'
                            }}>
                                {variable.type}
                            </span>
                        </div>

                        <input
                            type={variable.dataType === 'number' ? 'number' :
                                variable.dataType === 'date' ? 'date' :
                                    variable.dataType === 'email' ? 'email' : 'text'}
                            value={config[variable.name] || ''}
                            onChange={(e) => updateConfig(variable.name, e.target.value)}
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