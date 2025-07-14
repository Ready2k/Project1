import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const EndNode = ({ data, id }) => {
  const { deleteElements } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'End');

  const onDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    data.label = e.target.value;
  };

  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '50px',
      background: '#dc3545',
      color: 'white',
      border: '2px solid #c82333',
      minWidth: '80px',
      textAlign: 'center',
      fontWeight: 'bold',
      position: 'relative'
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
          onClick={() => setIsEditingLabel(true)}
          style={{ cursor: 'pointer' }}
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