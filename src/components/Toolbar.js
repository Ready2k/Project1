import React, { useState, useRef, useEffect } from 'react';

const Toolbar = ({ nodes, edges, onLoadFlow, onImportWorkflows, onTestFlow, currentFlowInfo, validation, showValidation, setShowValidation, onShowAIChat, workflows, activeWorkflowId }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [exportFileName, setExportFileName] = useState('');
  const [exportScope, setExportScope] = useState('current'); // 'current' or 'all'
  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);

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

  const importWorkflows = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        onImportWorkflows(jsonData);
      } catch (error) {
        alert('Error importing workflows: ' + error.message);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };



  const performExport = () => {
    if (!exportFileName.trim()) {
      alert('Please enter a filename for your export');
      return;
    }

    let exportData;
    let successMessage;

    if (exportScope === 'current') {
      // Export current workflow only - find the current workflow object
      const currentWorkflow = workflows.find(w => w.id === activeWorkflowId) || {
        name: currentFlowInfo?.name || 'Current Workflow',
        nodes: nodes,
        edges: edges,
        originalData: null
      };

      exportData = convertFlowToImportFormat(currentWorkflow);
      successMessage = `✅ Current workflow exported successfully!`;
    } else {
      // Export all workflows
      const workflowsWithContent = workflows.filter(workflow => workflow.nodes && workflow.nodes.length > 0);

      if (workflowsWithContent.length === 0) {
        alert('No workflows with content found to export.');
        return;
      }

      exportData = workflowsWithContent.map(workflow => convertFlowToImportFormat(workflow));
      successMessage = `✅ All workflows exported successfully!\n\nExported ${exportData.length} workflow${exportData.length !== 1 ? 's' : ''}`;
    }

    // Create and download the JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);

    // Generate filename
    const sanitizedName = exportFileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `${sanitizedName}_export_${timestamp}.json`;

    link.click();

    // Close dialog and reset
    setShowExportDialog(false);
    setExportFileName('');

    // Show success message
    alert(`${successMessage}\n\nFile: ${link.download}\nFormat: Import JSON\n\nYou can import this file using the "Import Workflows" button.`);
  };

  const convertFlowToImportFormat = (workflow) => {
    // If this workflow has original import data, preserve it exactly
    if (workflow.originalData) {
      console.log('📤 Preserving original import data for:', workflow.name);
      return workflow.originalData;
    }

    // For manually created workflows, create a clean export format
    console.log('📤 Creating export format for manually created workflow:', workflow.name);

    // Generate a unique ID for the workflow
    const workflowId = generateWorkflowId(workflow.name || 'Exported_Workflow');

    // Analyze the flow structure
    const conditionNodes = workflow.nodes?.filter(n => n.type === 'condition') || [];
    const functionNodes = workflow.nodes?.filter(n => n.type === 'function') || [];

    if (conditionNodes.length > 0) {
      // Decision type workflow - preserve actual conditions
      const expressions = conditionNodes.map(node => node.data.condition || 'true');

      return {
        id: workflowId,
        type: "decision",
        label: workflow.name || 'Exported Decision Flow',
        details: {
          expressions: expressions,
          resultType: "endpoint"
        }
      };
    } else if (functionNodes.length > 0) {
      // Endpoint type workflow
      const functionNode = functionNodes[0];

      // Extract queue information if present in the function code
      let queueName = "DefaultQueue";
      let isDefault = false;

      if (functionNode.data.code) {
        const queueMatch = functionNode.data.code.match(/queueName:\s*["']([^"']+)["']/);
        if (queueMatch) {
          queueName = queueMatch[1];
        }

        const defaultMatch = functionNode.data.code.match(/isDefault:\s*(true|false)/);
        if (defaultMatch) {
          isDefault = defaultMatch[1] === 'true';
        }
      }

      return {
        id: workflowId,
        type: "endpoint",
        label: functionNode.data.label || workflow.name || 'Exported Function Flow',
        details: {
          queueName: queueName,
          isDefault: isDefault
        }
      };
    } else {
      // Default to endpoint type for simple workflows
      return {
        id: workflowId,
        type: "endpoint",
        label: workflow.name || 'Exported Flow',
        details: {
          queueName: "DefaultQueue",
          isDefault: false
        }
      };
    }
  };

  const generateWorkflowId = (flowName) => {
    // Convert flow name to a valid ID format
    const baseId = flowName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp

    return `${baseId}_${timestamp}`;
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

        {/* Export Workflow Button */}
        <button
          onClick={() => setShowExportDialog(true)}
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
          title="Export current workflow as import JSON"
        >
          📤 Export Workflow
        </button>

        {/* Import Workflow Button */}
        <button
          onClick={() => importFileInputRef.current?.click()}
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
          title="Import workflows from JSON"
        >
          📥 Import Workflows
        </button>



        {/* Test Panel Button */}
        <button
          onClick={() => setShowTestPanel(!showTestPanel)}
          style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
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
          title="Configure and run tests"
        >
          🧪 Test {showTestPanel ? '▼' : '▶'}
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

        <input
          ref={importFileInputRef}
          type="file"
          accept=".json"
          onChange={importWorkflows}
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

      {/* Export Dialog Modal */}
      {showExportDialog && (
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
            minWidth: '450px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
              📤 Export Workflow
            </h3>

            {/* Export Scope Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Export Scope:
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  border: `2px solid ${exportScope === 'current' ? '#667eea' : '#e1e5e9'}`,
                  borderRadius: '6px',
                  background: exportScope === 'current' ? '#f0f4ff' : 'white',
                  fontSize: '13px'
                }}>
                  <input
                    type="radio"
                    name="exportScope"
                    value="current"
                    checked={exportScope === 'current'}
                    onChange={(e) => {
                      setExportScope(e.target.value);
                      setExportFileName(currentFlowInfo?.name || 'Exported_Workflow');
                    }}
                    style={{ margin: 0 }}
                  />
                  📄 Current Tab Only
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  border: `2px solid ${exportScope === 'all' ? '#667eea' : '#e1e5e9'}`,
                  borderRadius: '6px',
                  background: exportScope === 'all' ? '#f0f4ff' : 'white',
                  fontSize: '13px'
                }}>
                  <input
                    type="radio"
                    name="exportScope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={(e) => {
                      setExportScope(e.target.value);
                      setExportFileName('All_Workflows');
                    }}
                    style={{ margin: 0 }}
                  />
                  📑 All Tabs
                </label>
              </div>
            </div>

            {/* Filename Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#666',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Export Filename:
              </label>
              <input
                type="text"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="Enter filename for export..."
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
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                File will be saved as: {exportFileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_{new Date().toISOString().split('T')[0]}.json
              </div>
            </div>

            {/* Export Info */}
            <div style={{
              background: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#666'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                📊 Export Summary:
              </div>

              {exportScope === 'current' ? (
                <>
                  <div><strong>📄 Current Tab:</strong> {currentFlowInfo?.name || 'Untitled'}</div>
                  <div><strong>📊 Nodes:</strong> {nodes.length}</div>
                  <div><strong>🔗 Connections:</strong> {edges.length}</div>
                </>
              ) : (
                <>
                  <div><strong>📑 Total Tabs:</strong> {workflows?.length || 0}</div>
                  <div><strong>📊 Tabs with Content:</strong> {workflows?.filter(w => w.nodes && w.nodes.length > 0).length || 0}</div>
                  <div><strong>📄 Tab Names:</strong> {workflows?.filter(w => w.nodes && w.nodes.length > 0).map(w => w.name).join(', ') || 'None'}</div>
                </>
              )}

              <div><strong>📅 Export Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>📤 Format:</strong> Import JSON (compatible with Import Workflows)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowExportDialog(false);
                  setExportFileName('');
                  setExportScope('current');
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
                onClick={performExport}
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
                📤 Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Panel Modal */}
      {showTestPanel && (
        <TestPanel 
          nodes={nodes}
          edges={edges}
          onTestFlow={onTestFlow}
          onClose={() => setShowTestPanel(false)}
        />
      )}
    </div>
  );
};

// Test Panel Component - Complete testing functionality in toolbar
const TestPanel = ({ nodes, edges, onTestFlow, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [testConfig, setTestConfig] = useState({});
  const [detectedVariables, setDetectedVariables] = useState([]);

  // Analyze nodes to detect system variables and session variables used in conditions
  useEffect(() => {
    console.log('Test Panel analyzing nodes:', nodes.length);
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
    const detected = [
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

    setDetectedVariables(detected);
    
    // Auto-populate default values
    if (detected.length > 0) {
      const defaultConfig = {};
      detected.forEach(variable => {
        if (variable.type === 'system') {
          defaultConfig[variable.name] = '1';
        } else if (variable.type === 'session') {
          defaultConfig[variable.name] = 'test_value';
        }
      });
      
      if (Object.keys(defaultConfig).length > 0) {
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
    setTestConfig(newConfig);
  };

  // Run test with current configuration
  const runTest = () => {
    console.log('Running test with config:', testConfig);
    const results = onTestFlow(testConfig);
    setTestResults(results);
  };

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
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
            🧪 Test Configuration & Execution
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {/* Configuration Section */}
        {detectedVariables.length > 0 ? (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚙️ Test Configuration
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                ({detectedVariables.length} variables detected)
              </span>
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gap: '12px', 
              marginBottom: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
              {detectedVariables.map(variable => (
                <div key={variable.name} style={{
                  background: '#f8f9fa',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  padding: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {variable.name}
                      </span>
                      {variable.description && (
                        <div style={{
                          fontSize: '11px',
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
                                variable.type === 'session' ? '#fff3e0' : '#f3e5f5',
                      color: variable.type === 'system' ? '#2e7d32' : 
                             variable.type === 'session' ? '#f57c00' : '#7b1fa2',
                      padding: '3px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
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
                    placeholder={`Enter ${variable.dataType} value`}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#856404',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            No test variables detected in this workflow
            <div style={{ fontSize: '11px', marginTop: '4px', color: '#999' }}>
              Analyzed {nodes.length} nodes
            </div>
          </div>
        )}

        {/* Test Execution Button */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button 
            onClick={runTest}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🚀 Run Test
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div>
            <h4 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#333' }}>
              📊 Test Results & Workings:
            </h4>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e1e5e9'
            }}>
              {testResults.map((result, index) => (
                <div key={index} style={{ 
                  marginBottom: '12px',
                  padding: '8px',
                  borderRadius: '4px',
                  background: result.message.includes('❌') ? 'rgba(220, 53, 69, 0.1)' :
                             result.message.includes('⚠️') ? 'rgba(255, 193, 7, 0.1)' :
                             'rgba(248, 249, 250, 0.8)',
                  border: '1px solid ' + (result.message.includes('❌') ? 'rgba(220, 53, 69, 0.2)' :
                                         result.message.includes('⚠️') ? 'rgba(255, 193, 7, 0.2)' :
                                         'rgba(0, 0, 0, 0.1)')
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    <strong>{result.nodeId}:</strong> {result.message}
                  </div>
                  
                  {result.conditionDetails && (
                    <div style={{ 
                      marginLeft: '12px', 
                      fontSize: '11px', 
                      color: '#666',
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '6px',
                      borderRadius: '3px',
                      marginTop: '6px'
                    }}>
                      <div><strong>Original:</strong> <code style={{ fontSize: '10px', background: '#e9ecef', padding: '1px 3px', borderRadius: '2px' }}>{result.conditionDetails.original}</code></div>
                      <div><strong>Evaluated:</strong> <code style={{ fontSize: '10px', background: '#e9ecef', padding: '1px 3px', borderRadius: '2px' }}>{result.conditionDetails.evaluated}</code></div>
                      <div><strong>Result:</strong> <span style={{ 
                        color: result.conditionDetails.result ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {result.conditionDetails.result ? 'TRUE' : 'FALSE'}
                      </span></div>
                    </div>
                  )}
                  
                  {result.suggestion && (
                    <div style={{ 
                      marginLeft: '12px', 
                      fontSize: '11px', 
                      color: '#856404',
                      background: 'rgba(255, 193, 7, 0.15)',
                      padding: '4px 6px',
                      borderRadius: '3px',
                      marginTop: '6px'
                    }}>
                      💡 {result.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div style={{
          marginTop: '16px',
          padding: '8px',
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#0c5460'
        }}>
          💡 Configure test values above, then click "Run Test" to execute the workflow and see detailed results
        </div>
      </div>
    </div>
  );
};

export default Toolbar;