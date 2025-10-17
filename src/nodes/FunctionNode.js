import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const FunctionNode = ({ data, id }) => {
  const { deleteElements } = useReactFlow();
  const [code, setCode] = useState(data.code || 'return value * 2;');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'Function');

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    data.code = e.target.value;
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
      background: '#6f42c1',
      color: 'white',
      border: '2px solid #5a32a3',
      minWidth: '180px',
      position: 'relative'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#5a32a3' }}
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
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: 'white',
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
      
      <div style={{ fontSize: '10px', marginBottom: '2px' }}>Code:</div>
      {isEditing ? (
        <textarea
          value={code}
          onChange={handleCodeChange}
          onBlur={() => setIsEditing(false)}
          style={{
            width: '100%',
            padding: '4px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '12px',
            minHeight: '60px',
            fontFamily: 'monospace'
          }}
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          style={{
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            minHeight: '60px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}
        >
          {code}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#5a32a3' }}
      />
    </div>
  );
};

export default FunctionNode;