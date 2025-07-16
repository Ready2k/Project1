import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const StartNode = ({ data, id }) => {
  const { deleteElements } = useReactFlow();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'Start');

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
      background: data.isHighlighted ? '#ffc107' : '#28a745',
      color: data.isHighlighted ? '#000' : 'white',
      border: data.isHighlighted ? '3px solid #ff6b35' : '2px solid #1e7e34',
      minWidth: '100px',
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
          background: '#dc3545',
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
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {label}
          </div>
          {data.idLabel && (
            <div style={{ 
              fontSize: '10px', 
              marginTop: '4px', 
              opacity: 0.9,
              fontWeight: 'normal',
              wordBreak: 'break-all',
              lineHeight: '1.2'
            }}>
              ID: {data.idLabel}
            </div>
          )}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#1e7e34' }}
      />
    </div>
  );
};

export default StartNode;