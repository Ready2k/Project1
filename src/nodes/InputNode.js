import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

const InputNode = ({ data, id }) => {
  const { deleteElements } = useReactFlow();
  const [variable, setVariable] = useState(data.variable || 'value');
  const [value, setValue] = useState(data.value || '10');
  const [isEditingVar, setIsEditingVar] = useState(false);
  const [isEditingVal, setIsEditingVal] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'Input');

  const handleVariableChange = (e) => {
    setVariable(e.target.value);
    data.variable = e.target.value;
  };

  const handleValueChange = (e) => {
    setValue(e.target.value);
    data.value = e.target.value;
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
      background: '#17a2b8',
      color: 'white',
      border: '2px solid #138496',
      minWidth: '150px',
      position: 'relative'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#138496' }}
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
          justifyContent: 'center'
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
      
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>Variable:</div>
        {isEditingVar ? (
          <input
            type="text"
            value={variable}
            onChange={handleVariableChange}
            onBlur={() => setIsEditingVar(false)}
            onKeyPress={(e) => e.key === 'Enter' && setIsEditingVar(false)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setIsEditingVar(true)}
            style={{
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              minHeight: '20px'
            }}
          >
            {variable}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>Value:</div>
        {isEditingVal ? (
          <input
            type="text"
            value={value}
            onChange={handleValueChange}
            onBlur={() => setIsEditingVal(false)}
            onKeyPress={(e) => e.key === 'Enter' && setIsEditingVal(false)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setIsEditingVal(true)}
            style={{
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              minHeight: '20px'
            }}
          >
            {value}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#138496' }}
      />
    </div>
  );
};

export default InputNode;