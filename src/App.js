import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ConditionNode from './nodes/ConditionNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import InputNode from './nodes/InputNode';
import FunctionNode from './nodes/FunctionNode';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ValidationPanel from './components/ValidationPanel';
import AIChat from './components/AIChat';
import AISettings from './components/AISettings';
import { validateFlow, detectOverlappingNodes } from './utils/validation';
import './App.css';

const nodeTypes = {
    condition: ConditionNode,
    start: StartNode,
    end: EndNode,
    input: InputNode,
    function: FunctionNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'start',
        position: { x: 200, y: 100 },
        data: { label: 'Start' },
    },
    {
        id: '2',
        type: 'end',
        position: { x: 200, y: 250 },
        data: { label: 'End' },
    },
];

const initialEdges = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
    },
];

let nodeId = 3;

function App() {
    // Multi-tab workflow system
    const [workflows, setWorkflows] = useState([
        {
            id: 'default',
            name: 'Main Flow',
            nodes: initialNodes,
            edges: initialEdges,
            isActive: true
        }
    ]);
    const [activeWorkflowId, setActiveWorkflowId] = useState('default');

    // Get current workflow
    const currentWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];
    const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflow.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflow.edges);

    // Sync current workflow state when nodes/edges change
    useEffect(() => {
        setWorkflows(prev => prev.map(workflow => 
            workflow.id === activeWorkflowId 
                ? { ...workflow, nodes, edges }
                : workflow
        ));
    }, [nodes, edges, activeWorkflowId]);

    // Switch to a different workflow tab
    const switchWorkflow = useCallback((workflowId) => {
        console.log(`Switching to workflow ID: "${workflowId}"`);
        const workflow = workflows.find(w => w.id === workflowId);
        if (workflow) {
            console.log(`Found workflow:`, workflow);
            console.log(`Workflow name: "${workflow.name}"`);
            console.log(`Workflow nodes:`, workflow.nodes);
            setActiveWorkflowId(workflowId);
            setNodes(workflow.nodes);
            setEdges(workflow.edges);
            setCurrentFlowInfo(null); // Clear flow info when switching
            setExecutionPath([]); // Clear execution path
        } else {
            console.error(`Workflow with ID "${workflowId}" not found in:`, workflows);
        }
    }, [workflows, setNodes, setEdges]);

    // Add new workflow tab
    const addWorkflow = useCallback((name = 'New Tab') => {
        const newId = `workflow_${Date.now()}`;
        const newWorkflow = {
            id: newId,
            name: name,
            nodes: [...initialNodes], // Fresh copy
            edges: [...initialEdges], // Fresh copy
            isActive: false
        };
        
        console.log(`Creating new tab: "${name}" with ID: ${newId}`);
        
        setWorkflows(prev => {
            const updated = [...prev, newWorkflow];
            console.log('Updated workflows:', updated.map(w => ({ name: w.name, id: w.id })));
            return updated;
        });
        
        // Switch to the new tab
        setTimeout(() => {
            switchWorkflow(newId);
        }, 50);
        
        return newId;
    }, [switchWorkflow]);

    // Remove workflow tab
    const removeWorkflow = useCallback((workflowId) => {
        if (workflows.length <= 1) {
            alert('Cannot remove the last workflow tab.');
            return;
        }
        
        setWorkflows(prev => {
            const filtered = prev.filter(w => w.id !== workflowId);
            // If removing active workflow, switch to first remaining
            if (workflowId === activeWorkflowId) {
                const firstWorkflow = filtered[0];
                setActiveWorkflowId(firstWorkflow.id);
                setNodes(firstWorkflow.nodes);
                setEdges(firstWorkflow.edges);
            }
            return filtered;
        });
    }, [workflows, activeWorkflowId, setNodes, setEdges]);

    // Import workflows from JSON - SIMPLE approach
    // eslint-disable-next-line no-use-before-define
    const importWorkflows = useCallback((jsonData) => {
        try {
            let workflowsData = [];
            
            // Handle both single workflow and array of workflows
            if (Array.isArray(jsonData)) {
                workflowsData = jsonData;
            } else if (jsonData.Id || jsonData.id) {
                // Single workflow object
                workflowsData = [jsonData];
            } else {
                throw new Error('Invalid workflow format');
            }

            console.log(`Importing ${workflowsData.length} workflows as separate tabs`);
            
            // Create all new workflows at once
            const newWorkflows = [];
            
            workflowsData.forEach((workflowData, index) => {
                console.log(`\n=== Processing Workflow ${index + 1} ===`);
                
                // Handle different ID field names (id vs Id)
                const workflowId = workflowData.id || workflowData.Id || `unknown_${index}`;
                const workflowType = workflowData.type || (workflowData.Evaluations ? 'evaluation' : 'unknown');
                
                console.log(`Workflow ID: "${workflowId}"`);
                console.log(`Workflow Type: "${workflowType}"`);
                
                // Generate nodes and edges for this workflow
                const { nodes: workflowNodes, edges: workflowEdges } = convertWorkflowToReactFlow(workflowData);
                
                console.log(`Generated nodes:`, workflowNodes);
                const startNode = workflowNodes.find(n => n.type === 'start');
                console.log(`Start node ID label: "${startNode?.data?.idLabel}"`);
                
                // Create workflow object directly
                const newWorkflow = {
                    id: `imported_${index}_${Date.now()}`,
                    name: `Rule${index + 1}`,
                    nodes: workflowNodes,
                    edges: workflowEdges,
                    isActive: false,
                    imported: true,
                    originalData: workflowData
                };
                
                console.log(`Created workflow: "${newWorkflow.name}" with start node ID: "${startNode?.data?.idLabel}"`);
                newWorkflows.push(newWorkflow);
            });
            
            // Add all new workflows to state at once and store the first workflow ID for switching
            const firstWorkflowId = newWorkflows.length > 0 ? newWorkflows[0].id : null;
            
            setWorkflows(prev => {
                const updatedWorkflows = [...prev, ...newWorkflows];
                console.log('Updated workflows state:', updatedWorkflows.map(w => ({ name: w.name, id: w.id })));
                
                // Switch to first imported workflow immediately after state update
                if (firstWorkflowId) {
                    setTimeout(() => {
                        console.log('Attempting to switch to:', firstWorkflowId);
                        const targetWorkflow = updatedWorkflows.find(w => w.id === firstWorkflowId);
                        if (targetWorkflow) {
                            console.log('Found target workflow:', targetWorkflow.name);
                            setActiveWorkflowId(firstWorkflowId);
                            setNodes(targetWorkflow.nodes);
                            setEdges(targetWorkflow.edges);
                        }
                    }, 100);
                }
                
                return updatedWorkflows;
            });
            
            console.log(`\n=== IMPORT COMPLETE ===`);
            console.log(`Created ${newWorkflows.length} tabs:`, newWorkflows.map(w => w.name));
            
            alert(`Successfully imported ${workflowsData.length} workflow(s) as separate tabs!\n\nTabs created: ${newWorkflows.map(w => w.name).join(', ')}`);
            
        } catch (error) {
            console.error('Import error:', error);
            alert(`Failed to import workflows: ${error.message}`);
        }
        // eslint-disable-next-line no-use-before-define
    }, [convertWorkflowToReactFlow, setNodes, setEdges]);



    // Convert your workflow format to ReactFlow format
    const convertWorkflowToReactFlow = useCallback((workflowData) => {
        const nodes = [];
        const edges = [];
        let nodeIdCounter = 1;
        
        // Handle endpoint type objects
        if (workflowData.type === 'endpoint') {
            // Create start node with standard "Start" label
            const startNodeId = `start_${nodeIdCounter++}`;
            nodes.push({
                id: startNodeId,
                type: 'start',
                position: { x: 200, y: 50 },
                data: { 
                    label: 'Start',
                    idLabel: workflowData.id // Add ID label for identification
                }
            });
            
            // Create function node named after the label with details
            const functionNodeId = `function_${nodeIdCounter++}`;
            const functionCode = `// Queue: ${workflowData.details.queueName}\n// Is Default: ${workflowData.details.isDefault}\n\nreturn {\n  queueName: "${workflowData.details.queueName}",\n  isDefault: ${workflowData.details.isDefault}\n};`;
            
            nodes.push({
                id: functionNodeId,
                type: 'function',
                position: { x: 200, y: 200 },
                data: {
                    label: workflowData.label,
                    code: functionCode
                }
            });
            
            // Create end node
            const endNodeId = `end_${nodeIdCounter++}`;
            nodes.push({
                id: endNodeId,
                type: 'end',
                position: { x: 200, y: 350 },
                data: { label: 'End' }
            });
            
            // Connect the nodes
            edges.push({
                id: `edge_${startNodeId}_${functionNodeId}`,
                source: startNodeId,
                target: functionNodeId
            });
            
            edges.push({
                id: `edge_${functionNodeId}_${endNodeId}`,
                source: functionNodeId,
                target: endNodeId
            });
            
            return { nodes, edges };
        }

        // Handle decision type objects
        if (workflowData.type === 'decision') {
            // Create start node with standard "Start" label
            const startNodeId = `start_${nodeIdCounter++}`;
            nodes.push({
                id: startNodeId,
                type: 'start',
                position: { x: 200, y: 50 },
                data: { 
                    label: 'Start',
                    idLabel: workflowData.id // Add ID label for identification
                }
            });
            
            let previousNodeId = startNodeId;
            let yPosition = 200;
            let lastConditionNodeId = null;
            
            // Create condition nodes for each expression (Option A - in sequence)
            const expressions = workflowData.details.expressions || [];
            
            expressions.forEach((expression, index) => {
                const conditionNodeId = `condition_${nodeIdCounter++}`;
                lastConditionNodeId = conditionNodeId; // Track the last condition node
                
                nodes.push({
                    id: conditionNodeId,
                    type: 'condition',
                    position: { x: 200, y: yPosition },
                    data: {
                        label: workflowData.label, // Remove the (${index + 1}) part to match expected output
                        condition: expression
                    }
                });
                
                // Connect from previous node
                edges.push({
                    id: `edge_${previousNodeId}_${conditionNodeId}`,
                    source: previousNodeId,
                    target: conditionNodeId
                });
                
                // Create TRUE end node for this condition
                const trueEndNodeId = `end_true_${nodeIdCounter++}`;
                nodes.push({
                    id: trueEndNodeId,
                    type: 'end',
                    position: { x: 400, y: yPosition },
                    data: { label: `TRUE: Condition ${index + 1}` }
                });
                
                // Connect TRUE path
                edges.push({
                    id: `edge_${conditionNodeId}_${trueEndNodeId}`,
                    source: conditionNodeId,
                    target: trueEndNodeId,
                    sourceHandle: 'true'
                });
                
                previousNodeId = conditionNodeId;
                yPosition += 150;
            });
            
            // Create final FALSE end node (if all conditions fail)
            const falseEndNodeId = `end_false_${nodeIdCounter++}`;
            nodes.push({
                id: falseEndNodeId,
                type: 'end',
                position: { x: 200, y: yPosition },
                data: { label: 'FALSE: All conditions failed' }
            });
            
            // Connect FALSE path from last condition
            if (expressions.length > 0 && lastConditionNodeId) {
                edges.push({
                    id: `edge_${lastConditionNodeId}_${falseEndNodeId}`,
                    source: lastConditionNodeId,
                    target: falseEndNodeId,
                    sourceHandle: 'false'
                });
            } else {
                // If no expressions, connect directly from start
                edges.push({
                    id: `edge_${startNodeId}_${falseEndNodeId}`,
                    source: startNodeId,
                    target: falseEndNodeId
                });
            }
            
            return { nodes, edges };
        }
        
        // Handle evaluation-based workflow objects (complex routing workflows)
        if (workflowData.Id && workflowData.Evaluations) {
            console.log('Processing evaluation-based workflow:', workflowData.Id);
            
            // Create start node with standard "Start" label and ID
            const startNodeId = `start_${nodeIdCounter++}`;
            nodes.push({
                id: startNodeId,
                type: 'start',
                position: { x: 200, y: 50 },
                data: { 
                    label: 'Start',
                    idLabel: workflowData.Id // Use Id field for identification
                }
            });
            
            let previousNodeId = startNodeId;
            let yPosition = 200;
            let lastConditionNodeId = null;
            
            // Process evaluations in order
            const evaluations = workflowData.Evaluations || [];
            evaluations.sort((a, b) => (a.Order || 0) - (b.Order || 0));
            
            console.log(`Processing ${evaluations.length} evaluations`);
            
            evaluations.forEach((evaluation, index) => {
                const conditionNodeId = `condition_${nodeIdCounter++}`;
                lastConditionNodeId = conditionNodeId;
                
                console.log(`Creating condition ${index + 1}: "${evaluation.Expression}"`);
                
                // Create condition node
                nodes.push({
                    id: conditionNodeId,
                    type: 'condition',
                    position: { x: 200, y: yPosition },
                    data: {
                        label: `${workflowData.Name} (${evaluation.Order})`,
                        condition: evaluation.Expression || 'true'
                    }
                });
                
                // Connect from previous node
                edges.push({
                    id: `edge_${previousNodeId}_${conditionNodeId}`,
                    source: previousNodeId,
                    target: conditionNodeId
                });
                
                // Create TRUE path endpoint
                if (evaluation.Result && evaluation.Result.ResultValue && evaluation.Result.ResultValue.EndPoint) {
                    const trueEndNodeId = `end_true_${nodeIdCounter++}`;
                    const queueName = evaluation.Result.ResultValue.EndPoint.Qname || 'Endpoint';
                    
                    nodes.push({
                        id: trueEndNodeId,
                        type: 'end',
                        position: { x: 450, y: yPosition },
                        data: { 
                            label: `TRUE: ${queueName}` 
                        }
                    });
                    
                    edges.push({
                        id: `edge_${conditionNodeId}_${trueEndNodeId}`,
                        source: conditionNodeId,
                        target: trueEndNodeId,
                        sourceHandle: 'true'
                    });
                }
                
                previousNodeId = conditionNodeId;
                yPosition += 180;
            });
            
            // Create default result endpoint (FALSE path from last condition)
            if (workflowData.DefaultResult && workflowData.DefaultResult.ResultValue && workflowData.DefaultResult.ResultValue.EndPoint) {
                const defaultEndNodeId = `end_default_${nodeIdCounter++}`;
                const defaultQueueName = workflowData.DefaultResult.ResultValue.EndPoint.Qname || 'Default Endpoint';
                
                nodes.push({
                    id: defaultEndNodeId,
                    type: 'end',
                    position: { x: 200, y: yPosition },
                    data: { 
                        label: `DEFAULT: ${defaultQueueName}` 
                    }
                });
                
                // Connect from last condition's FALSE path
                if (lastConditionNodeId) {
                    edges.push({
                        id: `edge_${lastConditionNodeId}_${defaultEndNodeId}`,
                        source: lastConditionNodeId,
                        target: defaultEndNodeId,
                        sourceHandle: 'false'
                    });
                } else {
                    // If no evaluations, connect directly from start
                    edges.push({
                        id: `edge_${startNodeId}_${defaultEndNodeId}`,
                        source: startNodeId,
                        target: defaultEndNodeId
                    });
                }
            }
            
            console.log(`Created evaluation workflow with ${nodes.length} nodes and ${edges.length} edges`);
            return { nodes, edges };
        }
        
        // Fallback for unknown formats
        throw new Error(`Unsupported workflow format. Expected 'endpoint' type or workflow with 'Id' and 'Evaluations'.`);
    }, []);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [executionPath, setExecutionPath] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentFlowInfo, setCurrentFlowInfo] = useState(null);
    const [validation, setValidation] = useState(null);
    const [showValidation, setShowValidation] = useState(false);
  
    const [showAIChat, setShowAIChat] = useState(false);
    const [showAISettings, setShowAISettings] = useState(false);
    const [aiConfig, setAiConfig] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [highlightedNode, setHighlightedNode] = useState(null);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = event.target.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            const newNode = {
                id: `${nodeId++}`,
                type,
                position,
                data: {
                    label: type === 'condition' ? 'New Condition' :
                        type === 'end' ? 'End' :
                            type === 'input' ? 'Input' :
                                type === 'function' ? 'Function' : 'Node',
                    condition: type === 'condition' ? 'value > 0' : undefined,
                    variable: type === 'input' ? 'value' : undefined,
                    value: type === 'input' ? '10' : undefined,
                    code: type === 'function' ? 'return value * 2;' : undefined
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const testFlow = useCallback(() => {
        const results = [];
        const variables = {};
        const pathTrace = [];

        // Find start node
        const startNode = nodes.find(node => node.type === 'start');
        if (!startNode) {
            return [{ nodeId: 'system', message: 'No start node found' }];
        }

        // Execute flow starting from start node
        const executeNode = (nodeId, currentVars) => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            // Add to path trace
            pathTrace.push({
                nodeId: node.id,
                timestamp: Date.now(),
                position: node.position
            });

            results.push({
                nodeId: node.id,
                message: `Executing ${node.type} node: ${node.data.label}`,
                variables: { ...currentVars },
                position: node.position
            });

            if (node.type === 'input') {
                // Set variable value
                currentVars[node.data.variable] = parseFloat(node.data.value) || node.data.value;
                results.push({
                    nodeId: node.id,
                    message: `Set ${node.data.variable} = ${node.data.value}`,
                    variables: { ...currentVars }
                });
            } else if (node.type === 'condition') {
                // Evaluate condition
                try {
                    const originalCondition = node.data.condition;
                    // Better variable replacement - only replace whole words that are variables
                    const condition = originalCondition.replace(/\b(\w+)\b/g, (match) => {
                        if (currentVars.hasOwnProperty(match)) {
                            const value = currentVars[match];
                            return typeof value === 'string' ? `"${value}"` : value;
                        }
                        return match;
                    });

                    // eslint-disable-next-line no-eval
                    const result = eval(condition);
                    results.push({
                        nodeId: node.id,
                        message: `Condition "${originalCondition}" → "${condition}" = ${result}`,
                        variables: { ...currentVars },
                        conditionDetails: {
                            original: originalCondition,
                            evaluated: condition,
                            result: result
                        }
                    });

                    // Find next node based on condition result
                    const outgoingEdges = edges.filter(edge =>
                        edge.source === nodeId && edge.sourceHandle === (result ? 'true' : 'false')
                    );

                    if (outgoingEdges.length === 0) {
                        results.push({
                            nodeId: node.id,
                            message: `⚠️ No ${result ? 'TRUE' : 'FALSE'} path connected from this condition`,
                            variables: { ...currentVars }
                        });
                    }

                    outgoingEdges.forEach(edge => executeNode(edge.target, currentVars));
                    return;
                } catch (error) {
                    results.push({
                        nodeId: node.id,
                        message: `❌ Error evaluating condition: ${error.message}`,
                        variables: { ...currentVars },
                        suggestion: getSuggestionForError(error.message, node.data.condition, currentVars)
                    });
                }
            } else if (node.type === 'function') {
                // Execute function code
                try {
                    // eslint-disable-next-line no-new-func
                    const func = new Function(...Object.keys(currentVars), node.data.code);
                    const result = func(...Object.values(currentVars));

                    // If function returns an object, merge it with variables
                    if (typeof result === 'object' && result !== null) {
                        Object.assign(currentVars, result);
                    } else {
                        // Otherwise, store result in 'result' variable
                        currentVars.result = result;
                    }

                    results.push({
                        nodeId: node.id,
                        message: `Function executed, result: ${JSON.stringify(result)}`,
                        variables: { ...currentVars }
                    });
                } catch (error) {
                    results.push({
                        nodeId: node.id,
                        message: `Error executing function: ${error.message}`,
                        variables: { ...currentVars }
                    });
                }
            } else if (node.type === 'end') {
                results.push({
                    nodeId: node.id,
                    message: 'Flow completed',
                    variables: { ...currentVars }
                });
                return;
            }

            // Find next nodes (for non-condition nodes)
            if (node.type !== 'condition') {
                const outgoingEdges = edges.filter(edge => edge.source === nodeId);
                outgoingEdges.forEach(edge => executeNode(edge.target, currentVars));
            }
        };

        executeNode(startNode.id, variables);

        // Set execution path for visualization
        setExecutionPath(pathTrace);

        return results;
    }, [nodes, edges]);

    const getSuggestionForError = (errorMessage, condition, variables) => {
        const availableVars = Object.keys(variables).join(', ');

        if (errorMessage.includes('is not defined')) {
            const undefinedVar = errorMessage.match(/(\w+) is not defined/)?.[1];
            return `Variable "${undefinedVar}" not found. Available variables: ${availableVars}`;
        }

        if (errorMessage.includes('Unexpected token')) {
            return 'Syntax error. Check for missing quotes around text values or incorrect operators.';
        }

        if (errorMessage.includes('Cannot read property')) {
            return 'Trying to access property of undefined variable. Check variable names.';
        }

        return `Available variables: ${availableVars}. Try using templates for common patterns.`;
    };

    const animateExecution = useCallback(async (pathTrace) => {
        setIsExecuting(true);
        setExecutionPath([]);

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        for (let i = 0; i < pathTrace.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setExecutionPath(prev => [...prev, pathTrace[i]]);
        }

        // Clear path after 3 seconds
        setTimeout(() => {
            setExecutionPath([]);
            setIsExecuting(false);
        }, 3000);
    }, []);

    // Validate flow whenever nodes or edges change
    useEffect(() => {
        if (nodes.length > 0) {
            const flowValidation = validateFlow(nodes, edges);
            const overlaps = detectOverlappingNodes(nodes);

            if (overlaps.length > 0) {
                flowValidation.warnings.push(...overlaps.map(overlap => ({
                    type: 'overlapping_nodes',
                    message: overlap.message,
                    severity: 'warning'
                })));
            }

            setValidation(flowValidation);
            setShowValidation(!flowValidation.isValid || flowValidation.warnings.length > 0);
        }
    }, [nodes, edges]);

    const testFlowWithAnimation = useCallback(() => {
        // Check validation before running
        if (validation && !validation.isValid) {
            alert('Cannot run test: Flow has validation errors. Please fix them first.');
            return [];
        }

        const results = testFlow();
        const pathTrace = results.filter(r => r.position).map((r, index) => ({
            nodeId: r.nodeId,
            timestamp: Date.now() + (index * 800),
            position: r.position
        }));

        if (pathTrace.length > 0) {
            animateExecution(pathTrace);
        }

        return results;
    }, [testFlow, animateExecution, validation]);



    const handleHighlightNode = useCallback((nodeId) => {
        setHighlightedNode(nodeId);

        // Find and center the node
        const node = nodes.find(n => n.id === nodeId);
        if (node && reactFlowInstance) {
            reactFlowInstance.setCenter(node.position.x + 75, node.position.y + 50, { zoom: 1.2 });
        }

        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedNode(null), 3000);
    }, [nodes, reactFlowInstance]);

    // Load flow from file or test case
    const loadFlow = useCallback((flowData) => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
        nodeId = Math.max(...flowData.nodes.map(n => parseInt(n.id))) + 1;

        // Set flow info if it's a saved flow (has name and createdAt)
        if (flowData.name && flowData.createdAt) {
            setCurrentFlowInfo({
                name: flowData.name,
                createdAt: flowData.createdAt,
                version: flowData.version || '1.0'
            });
        } else {
            // Clear flow info for test cases
            setCurrentFlowInfo(null);
        }
    }, [setNodes, setEdges]);

    // Handle AI-generated flow
    const handleAIFlowGenerated = useCallback((flowData) => {
        loadFlow(flowData);
        // Don't auto-close the AI chat - let user close it manually
        // setShowAIChat(false);
        
        // Show a success message
        setTimeout(() => {
            alert(`✨ AI Flow "${flowData.name}" has been created! You can now test and modify it as needed.`);
        }, 500);
    }, [loadFlow]);

    // Showcase test cases
    const loadTestCase = useCallback((testCase) => {
        loadFlow(testCase);
    }, [loadFlow]);

    const testCases = [
        {
            name: "🎯 Age Verification",
            description: "Check if user is adult (18+)",
            nodes: [
                { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } },
                { id: '2', type: 'input', position: { x: 100, y: 150 }, data: { label: 'User Age', variable: 'age', value: '25' } },
                { id: '3', type: 'condition', position: { x: 100, y: 250 }, data: { label: 'Adult Check', condition: 'age >= 18' } },
                { id: '4', type: 'end', position: { x: 250, y: 350 }, data: { label: 'Adult ✓' } },
                { id: '5', type: 'end', position: { x: 100, y: 400 }, data: { label: 'Minor ✗' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true' },
                { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false' }
            ]
        },
        {
            name: "📧 Email Validator",
            description: "Validate email format",
            nodes: [
                { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } },
                { id: '2', type: 'input', position: { x: 100, y: 150 }, data: { label: 'Email Input', variable: 'email', value: 'user@example.com' } },
                { id: '3', type: 'condition', position: { x: 100, y: 250 }, data: { label: 'Email Check', condition: '/^[^@]+@[^@]+\\.[^@]+$/.test(email)' } },
                { id: '4', type: 'end', position: { x: 250, y: 350 }, data: { label: 'Valid Email ✓' } },
                { id: '5', type: 'end', position: { x: 100, y: 400 }, data: { label: 'Invalid Email ✗' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true' },
                { id: 'e3-5', source: '3', target: '5', sourceHandle: 'false' }
            ]
        },
        {
            name: "🔢 Grade Calculator",
            description: "Calculate letter grade from score",
            nodes: [
                { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } },
                { id: '2', type: 'input', position: { x: 100, y: 150 }, data: { label: 'Test Score', variable: 'score', value: '85' } },
                { id: '3', type: 'condition', position: { x: 100, y: 250 }, data: { label: 'A Grade?', condition: 'score >= 90' } },
                { id: '4', type: 'condition', position: { x: 100, y: 350 }, data: { label: 'B Grade?', condition: 'score >= 80' } },
                { id: '5', type: 'condition', position: { x: 100, y: 450 }, data: { label: 'C Grade?', condition: 'score >= 70' } },
                { id: '6', type: 'end', position: { x: 300, y: 250 }, data: { label: 'Grade A ⭐' } },
                { id: '7', type: 'end', position: { x: 300, y: 350 }, data: { label: 'Grade B 👍' } },
                { id: '8', type: 'end', position: { x: 300, y: 450 }, data: { label: 'Grade C 👌' } },
                { id: '9', type: 'end', position: { x: 100, y: 550 }, data: { label: 'Grade F 😞' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-6', source: '3', target: '6', sourceHandle: 'true' },
                { id: 'e3-4', source: '3', target: '4', sourceHandle: 'false' },
                { id: 'e4-7', source: '4', target: '7', sourceHandle: 'true' },
                { id: 'e4-5', source: '4', target: '5', sourceHandle: 'false' },
                { id: 'e5-8', source: '5', target: '8', sourceHandle: 'true' },
                { id: 'e5-9', source: '5', target: '9', sourceHandle: 'false' }
            ]
        },
        {
            name: "🧮 Math Calculator",
            description: "Process numbers with functions",
            nodes: [
                { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } },
                { id: '2', type: 'input', position: { x: 100, y: 150 }, data: { label: 'Number Input', variable: 'number', value: '5' } },
                { id: '3', type: 'function', position: { x: 100, y: 250 }, data: { label: 'Square It', code: 'return number * number;' } },
                { id: '4', type: 'condition', position: { x: 100, y: 370 }, data: { label: 'Big Number?', condition: 'result > 20' } },
                { id: '5', type: 'function', position: { x: 300, y: 470 }, data: { label: 'Add Bonus', code: 'return result + 10;' } },
                { id: '6', type: 'end', position: { x: 300, y: 570 }, data: { label: 'Big Result!' } },
                { id: '7', type: 'end', position: { x: 100, y: 470 }, data: { label: 'Small Result' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4' },
                { id: 'e4-5', source: '4', target: '5', sourceHandle: 'true' },
                { id: 'e4-7', source: '4', target: '7', sourceHandle: 'false' },
                { id: 'e5-6', source: '5', target: '6' }
            ]
        },
        {
            name: "🔐 Password Strength",
            description: "Check password requirements",
            nodes: [
                { id: '1', type: 'start', position: { x: 100, y: 50 }, data: { label: 'Start' } },
                { id: '2', type: 'input', position: { x: 100, y: 150 }, data: { label: 'Password', variable: 'password', value: 'MyPass123!' } },
                { id: '3', type: 'condition', position: { x: 100, y: 250 }, data: { label: 'Length Check', condition: 'password.length >= 8' } },
                { id: '4', type: 'condition', position: { x: 100, y: 370 }, data: { label: 'Has Uppercase', condition: '/[A-Z]/.test(password)' } },
                { id: '5', type: 'condition', position: { x: 100, y: 490 }, data: { label: 'Has Number', condition: '/[0-9]/.test(password)' } },
                { id: '6', type: 'condition', position: { x: 100, y: 610 }, data: { label: 'Has Special', condition: '/[!@#$%^&*]/.test(password)' } },
                { id: '7', type: 'end', position: { x: 350, y: 610 }, data: { label: 'Strong 💪' } },
                { id: '8', type: 'end', position: { x: 100, y: 750 }, data: { label: 'Weak 😟' } }
            ],
            edges: [
                { id: 'e1-2', source: '1', target: '2' },
                { id: 'e2-3', source: '2', target: '3' },
                { id: 'e3-4', source: '3', target: '4', sourceHandle: 'true' },
                { id: 'e3-8', source: '3', target: '8', sourceHandle: 'false' },
                { id: 'e4-5', source: '4', target: '5', sourceHandle: 'true' },
                { id: 'e4-8', source: '4', target: '8', sourceHandle: 'false' },
                { id: 'e5-6', source: '5', target: '6', sourceHandle: 'true' },
                { id: 'e5-8', source: '5', target: '8', sourceHandle: 'false' },
                { id: 'e6-7', source: '6', target: '7', sourceHandle: 'true' },
                { id: 'e6-8', source: '6', target: '8', sourceHandle: 'false' }
            ]
        }
    ];

    return (
        <div className="app">
            <Toolbar
                nodes={nodes}
                edges={edges}
                onLoadFlow={loadFlow}
                onImportWorkflows={importWorkflows}
                currentFlowInfo={currentFlowInfo}
                validation={validation}
                showValidation={showValidation}
                setShowValidation={setShowValidation}
                onShowAIChat={() => setShowAIChat(true)}
                onShowAISettings={() => setShowAISettings(true)}
            />

            {/* Workflow Tabs - Always show */}
            {true && (
                <div style={{
                    display: 'flex',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #e1e5e9',
                    padding: '0 10px',
                    overflowX: 'auto',
                    minHeight: '40px',
                    alignItems: 'center'
                }}>
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: workflow.id === activeWorkflowId ? 'white' : 'transparent',
                                border: workflow.id === activeWorkflowId ? '1px solid #e1e5e9' : '1px solid transparent',
                                borderBottom: workflow.id === activeWorkflowId ? '1px solid white' : '1px solid transparent',
                                borderRadius: '6px 6px 0 0',
                                padding: '6px 12px',
                                margin: '0 2px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: workflow.id === activeWorkflowId ? 'bold' : 'normal',
                                color: workflow.id === activeWorkflowId ? '#333' : '#666',
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                position: 'relative',
                                marginBottom: workflow.id === activeWorkflowId ? '-1px' : '0'
                            }}
                            onClick={() => switchWorkflow(workflow.id)}
                            title={workflow.name}
                        >
                            <span style={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                marginRight: workflows.length > 1 ? '8px' : '0'
                            }}>
                                {workflow.imported ? '📥 ' : ''}
                                {workflow.name}
                            </span>
                            
                            {workflows.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeWorkflow(workflow.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#999',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '0',
                                        marginLeft: '4px',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#ff4757';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'none';
                                        e.target.style.color = '#999';
                                    }}
                                    title="Close tab"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {/* Add New Tab Button */}
                    <button
                        onClick={() => {
                            const tabName = prompt('Enter tab name:', 'New Tab');
                            if (tabName && tabName.trim()) {
                                addWorkflow(tabName.trim());
                            }
                        }}
                        style={{
                            background: 'none',
                            border: '1px solid #e1e5e9',
                            color: '#666',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginLeft: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#f8f9fa';
                            e.target.style.borderColor = '#007bff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                            e.target.style.borderColor = '#e1e5e9';
                        }}
                        title="Add new workflow tab"
                    >
                        + New Tab
                    </button>
                </div>
            )}

            <div className="app-content">
                <Sidebar
                    nodes={nodes}
                    edges={edges}
                    onTestFlow={testFlowWithAnimation}
                    testCases={testCases}
                    onLoadTestCase={loadTestCase}
                />
                <div className="reactflow-wrapper">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Controls />
                        <MiniMap />
                        <Background variant="dots" gap={12} size={1} />

                        {/* Execution Path Visualization */}
                        {executionPath.map((pathNode, index) => {
                            const node = nodes.find(n => n.id === pathNode.nodeId);
                            if (!node) return null;

                            // Use React Flow's coordinate system with proper transforms
                            const transform = reactFlowInstance?.getViewport();
                            if (!transform) return null;

                            // Calculate the screen position accounting for zoom and pan
                            const screenX = node.position.x * transform.zoom + transform.x;
                            const screenY = node.position.y * transform.zoom + transform.y;

                            // More accurate node dimensions based on actual rendered sizes
                            const nodeWidth = node.type === 'start' ? 120 :
                                node.type === 'end' ? 100 :
                                    node.type === 'input' ? 150 :
                                        node.type === 'condition' ? 150 :
                                            node.type === 'function' ? 180 : 120;
                            const nodeHeight = node.type === 'start' ? 50 :
                                node.type === 'end' ? 50 :
                                    node.type === 'input' ? 120 :
                                        node.type === 'condition' ? 140 :
                                            node.type === 'function' ? 160 : 80;

                            const centerX = screenX + (nodeWidth * transform.zoom) / 2;
                            const centerY = screenY + (nodeHeight * transform.zoom) / 2;

                            return (
                                <div
                                    key={`${pathNode.nodeId}-${index}`}
                                    className="react-flow__node-execution-dot"
                                    style={{
                                        position: 'absolute',
                                        left: centerX - 12,
                                        top: centerY - 12,
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                                        border: '3px solid white',
                                        boxShadow: '0 0 20px rgba(255, 107, 107, 0.9)',
                                        zIndex: 1000,
                                        animation: 'pulse 1.5s infinite',
                                        pointerEvents: 'none',
                                        transform: 'scale(1)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            );
                        })}

                        {isExecuting && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                zIndex: 1001,
                                pointerEvents: 'none'
                            }}>
                                🔄 Executing Flow...
                            </div>
                        )}
                    </ReactFlow>

                    {/* Validation Panel */}
                    {showValidation && validation && (
                        <ValidationPanel
                            validation={validation}
                            onHighlightNode={handleHighlightNode}
                        />
                    )}
                </div>
            </div>

            {/* AI Settings Modal */}
            {showAISettings && (
                <AISettings
                    onClose={() => setShowAISettings(false)}
                    onSave={(config) => {
                        setAiConfig(config);
                        setShowAISettings(false);
                    }}
                />
            )}

            {/* AI Chat Panel */}
            {showAIChat && (
                <AIChat
                    onFlowGenerated={handleAIFlowGenerated}
                    onClose={() => setShowAIChat(false)}
                    aiConfig={aiConfig}
                />
            )}
        </div>
    );
}

export default App;