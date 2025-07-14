// Flow validation utilities

export const validateFlow = (nodes, edges) => {
  const errors = [];
  const warnings = [];

  // Rule 1: Must have at least one start node
  const startNodes = nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      type: 'missing_start',
      message: 'Flow must have at least one Start node',
      severity: 'error'
    });
  } else if (startNodes.length > 1) {
    warnings.push({
      type: 'multiple_starts',
      message: 'Multiple Start nodes found - only one will be used for execution',
      severity: 'warning',
      nodeIds: startNodes.map(n => n.id)
    });
  }

  // Rule 2: Must have at least one end node
  const endNodes = nodes.filter(node => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      type: 'missing_end',
      message: 'Flow must have at least one End node',
      severity: 'error'
    });
  }

  // Rule 3: Start node must be connected (have outgoing edges)
  startNodes.forEach(startNode => {
    const hasOutgoing = edges.some(edge => edge.source === startNode.id);
    if (!hasOutgoing) {
      errors.push({
        type: 'disconnected_start',
        message: `Start node "${startNode.data.label}" is not connected to any other nodes`,
        severity: 'error',
        nodeId: startNode.id
      });
    }
  });

  // Rule 4: No orphaned nodes (all nodes must be connected)
  nodes.forEach(node => {
    const hasIncoming = edges.some(edge => edge.target === node.id);
    const hasOutgoing = edges.some(edge => edge.source === node.id);
    
    // Start nodes only need outgoing, End nodes only need incoming
    if (node.type === 'start' && !hasOutgoing) {
      // Already handled above
    } else if (node.type === 'end' && !hasIncoming) {
      errors.push({
        type: 'orphaned_end',
        message: `End node "${node.data.label}" is not connected from any other nodes`,
        severity: 'error',
        nodeId: node.id
      });
    } else if (node.type !== 'start' && node.type !== 'end' && (!hasIncoming || !hasOutgoing)) {
      errors.push({
        type: 'orphaned_node',
        message: `${node.type} node "${node.data.label}" is not properly connected`,
        severity: 'error',
        nodeId: node.id
      });
    }
  });

  // Rule 5: Condition nodes must have both TRUE and FALSE paths
  const conditionNodes = nodes.filter(node => node.type === 'condition');
  conditionNodes.forEach(condNode => {
    const trueEdge = edges.find(edge => edge.source === condNode.id && edge.sourceHandle === 'true');
    const falseEdge = edges.find(edge => edge.source === condNode.id && edge.sourceHandle === 'false');
    
    if (!trueEdge) {
      warnings.push({
        type: 'missing_true_path',
        message: `Condition node "${condNode.data.label}" is missing TRUE path`,
        severity: 'warning',
        nodeId: condNode.id
      });
    }
    
    if (!falseEdge) {
      warnings.push({
        type: 'missing_false_path',
        message: `Condition node "${condNode.data.label}" is missing FALSE path`,
        severity: 'warning',
        nodeId: condNode.id
      });
    }
  });

  // Rule 6: Check for unreachable nodes
  const reachableNodes = findReachableNodes(nodes, edges);
  const unreachableNodes = nodes.filter(node => 
    node.type !== 'start' && !reachableNodes.has(node.id)
  );
  
  unreachableNodes.forEach(node => {
    warnings.push({
      type: 'unreachable_node',
      message: `${node.type} node "${node.data.label}" is unreachable from Start node`,
      severity: 'warning',
      nodeId: node.id
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalNodes: nodes.length,
      startNodes: startNodes.length,
      endNodes: endNodes.length,
      connectedNodes: nodes.length - unreachableNodes.length,
      totalEdges: edges.length
    }
  };
};

// Find all nodes reachable from start nodes
const findReachableNodes = (nodes, edges) => {
  const reachable = new Set();
  const startNodes = nodes.filter(node => node.type === 'start');
  
  const traverse = (nodeId) => {
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach(edge => traverse(edge.target));
  };
  
  startNodes.forEach(startNode => traverse(startNode.id));
  return reachable;
};

// Check for overlapping nodes
export const detectOverlappingNodes = (nodes) => {
  const overlaps = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];
      
      // Estimate node dimensions
      const getNodeDimensions = (node) => {
        switch (node.type) {
          case 'start':
          case 'end':
            return { width: 120, height: 50 };
          case 'input':
          case 'condition':
            return { width: 150, height: 120 };
          case 'function':
            return { width: 180, height: 160 };
          default:
            return { width: 120, height: 80 };
        }
      };
      
      const dim1 = getNodeDimensions(node1);
      const dim2 = getNodeDimensions(node2);
      
      // Check for overlap with some padding
      const padding = 20;
      const overlap = !(
        node1.position.x + dim1.width + padding < node2.position.x ||
        node2.position.x + dim2.width + padding < node1.position.x ||
        node1.position.y + dim1.height + padding < node2.position.y ||
        node2.position.y + dim2.height + padding < node1.position.y
      );
      
      if (overlap) {
        overlaps.push({
          node1: node1.id,
          node2: node2.id,
          message: `Nodes "${node1.data.label}" and "${node2.data.label}" are overlapping`
        });
      }
    }
  }
  
  return overlaps;
};

// Auto-layout to prevent overlaps
export const autoLayout = (nodes, edges) => {
  const layoutNodes = [...nodes];
  const startNodes = layoutNodes.filter(node => node.type === 'start');
  
  if (startNodes.length === 0) return layoutNodes;
  
  // Start with the first start node at origin
  const visited = new Set();
  const positioned = new Map();
  
  // Position start node
  const startNode = startNodes[0];
  startNode.position = { x: 100, y: 100 };
  positioned.set(startNode.id, { x: 100, y: 100 });
  
  // BFS layout from start node
  const queue = [{ nodeId: startNode.id, level: 0, branch: 0 }];
  const levelNodes = new Map(); // level -> nodes at that level
  
  while (queue.length > 0) {
    const { nodeId, level, branch } = queue.shift();
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    if (!levelNodes.has(level)) {
      levelNodes.set(level, []);
    }
    levelNodes.get(level).push(nodeId);
    
    // Find connected nodes
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    outgoingEdges.forEach((edge, index) => {
      if (!visited.has(edge.target)) {
        queue.push({ 
          nodeId: edge.target, 
          level: level + 1, 
          branch: index 
        });
      }
    });
  }
  
  // Position nodes level by level
  const levelHeight = 200;
  const nodeSpacing = 200;
  
  levelNodes.forEach((nodeIds, level) => {
    const y = 100 + level * levelHeight;
    const totalWidth = (nodeIds.length - 1) * nodeSpacing;
    const startX = 100 - totalWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const node = layoutNodes.find(n => n.id === nodeId);
      if (node) {
        node.position = {
          x: Math.max(50, startX + index * nodeSpacing),
          y: y
        };
      }
    });
  });
  
  // Position any remaining unvisited nodes
  const unvisited = layoutNodes.filter(node => !visited.has(node.id));
  unvisited.forEach((node, index) => {
    node.position = {
      x: 100 + (index % 3) * 200,
      y: 100 + Math.floor(index / 3) * 150
    };
  });
  
  return layoutNodes;
};