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
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [executionPath, setExecutionPath] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentFlowInfo, setCurrentFlowInfo] = useState(null);
    const [validation, setValidation] = useState(null);
    const [showValidation, setShowValidation] = useState(false);
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
                currentFlowInfo={currentFlowInfo}
                validation={validation}
                showValidation={showValidation}
                setShowValidation={setShowValidation}
            />
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
        </div>
    );
}

export default App;