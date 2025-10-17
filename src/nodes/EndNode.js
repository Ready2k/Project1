import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const EndNode = ({ data, id }) => {
  const { deleteElements } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'End');
  
  // Check if this end node is linkable (has a decision reference)
  const isLinkable = data.label && data.label.includes('TRUE: → ');
  const linkedRuleName = isLinkable ? data.label.split('TRUE: → ')[1] : null;

  const onDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    data.label = e.target.value;
  };

  const handleLinkClick = (e) => {
    e.stopPropagation(); // Prevent label editing
    if (isLinkable && linkedRuleName && data.onNavigateToRule) {
      data.onNavigateToRule(linkedRuleName);
    }
  };

  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '50px',
      background: data.isHighlighted ? '#ffc107' : '#dc3545',
      color: data.isHighlighted ? '#000' : 'white',
      border: data.isHighlighted ? '3px solid #ff6b35' : '2px solid #c82333',
      minWidth: '80px',
      textAlign: 'center',
      fontWeight: 'bold',
      position: 'relative',
      boxShadow: data.isHighlighted ? '0 0 20px rgba(255, 107, 53, 0.6)' : 'none',
      transform: data.isHighlighted ? 'scale(1.1)' : 'scale(1)',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={onDelete}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
      {/* Link icon for linkable nodes */}
      {isLinkable && (
        <div
          onClick={handleLinkClick}
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#007bff',
            color: 'white',
            border: '2px solid white',
            cursor: 'pointer',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            title: `Navigate to ${linkedRuleName}`
          }}
        >
          🔗
        </div>
      )}
      
      {isEditingLabel ? (
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={() => setIsEditingLabel(false)}
          onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.5)',
            color: 'white',
            textAlign: 'center',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          autoFocus
        />
      ) : (
        <div 
          onClick={isLinkable ? handleLinkClick : () => setIsEditingLabel(true)}
          style={{ 
            cursor: isLinkable ? 'pointer' : 'text',
            textDecoration: isLinkable ? 'underline' : 'none'
          }}
          title={isLinkable ? `Click to navigate to ${linkedRuleName}` : 'Click to edit label'}
        >
          {label}
        </div>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#c82333' }}
      />
    </div>
  );
};

export default EndNode;