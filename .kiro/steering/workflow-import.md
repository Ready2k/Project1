# Workflow Import System

## Overview

The Flow Builder supports importing workflows from JSON files, automatically creating separate tabs for each workflow. The system handles multiple workflow types and converts them to ReactFlow format.

## Supported Workflow Types

### Endpoint Type
Represents a simple workflow with a function execution.

**JSON Structure:**
```json
{
  "id": "unique_workflow_identifier",
  "type": "endpoint", 
  "label": "Function_Name",
  "details": {
    "queueName": "queue_identifier",
    "isDefault": true|false
  }
}
```

**Generated Flow:**
- Start node: "Start" + ID label
- Function node: Uses `label` as function name, `details` as code content
- End node: "End"

### Decision Type
Represents a workflow with conditional logic and branching.

**JSON Structure:**
```json
{
  "id": "unique_workflow_identifier",
  "type": "decision",
  "label": "Decision_Name", 
  "details": {
    "expressions": ["condition_expression_1", "condition_expression_2"],
    "resultType": "endpoint"
  }
}
```

**Generated Flow:**
- Start node: "Start" + ID label
- Condition nodes: One per expression, connected in sequence
- End nodes: TRUE path for each condition, FALSE path for final fallback

## Import Process

### File Format
- **Input**: JSON array of workflow objects
- **Single workflows**: Also supported (wrapped in array automatically)
- **File extension**: `.json`

### Tab Creation
- Each workflow object creates a separate tab
- Tab names: Auto-generated as "Rule1", "Rule2", etc.
- Original workflow ID preserved in Start node ID label

### Node Generation
1. **Parse JSON**: Extract workflow type and details
2. **Convert to ReactFlow**: Generate nodes and edges based on type
3. **Create Tab**: Add to multi-tab system with unique ID
4. **Switch Tab**: Automatically switch to first imported workflow

## Usage Examples

### Import Button
Located in the main toolbar next to "Load Flow" button.

### Example JSON Files

**Single Endpoint:**
```json
[{
  "id": "MyEndpoint_Process",
  "type": "endpoint",
  "label": "ProcessQueue", 
  "details": {
    "queueName": "MainQueue",
    "isDefault": false
  }
}]
```

**Multiple Workflows:**
```json
[
  {
    "id": "Validation_Check",
    "type": "decision",
    "label": "EmailValidator",
    "details": {
      "expressions": ["email.includes('@')", "email.length > 5"],
      "resultType": "endpoint"
    }
  },
  {
    "id": "Default_Handler", 
    "type": "endpoint",
    "label": "DefaultProcessor",
    "details": {
      "queueName": "DefaultQueue",
      "isDefault": true
    }
  }
]
```

## Node Identification

### Start Nodes
- **Main Label**: Always "Start" for consistency
- **ID Label**: Shows original workflow ID below main label
- **Format**: "ID: original_workflow_identifier"

### Function Nodes (Endpoint Type)
- **Label**: Uses workflow `label` field
- **Code**: Generated from `details` object with queue information

### Condition Nodes (Decision Type)  
- **Label**: Uses workflow `label` field
- **Condition**: Uses expressions from `details.expressions` array
- **Paths**: TRUE/FALSE branching for each condition

## Error Handling

### Invalid JSON
- Shows error alert with specific message
- Does not create any tabs
- Preserves existing workflow state

### Unsupported Types
- Falls back to mock implementation
- Creates basic workflow structure
- Logs warning in console

### Import Conflicts
- New tabs always created (no overwriting)
- Unique IDs prevent conflicts
- Original data preserved in workflow metadata

## Technical Implementation

### State Management
- Uses existing multi-tab workflow system
- Leverages `addWorkflow` and `switchWorkflow` functions
- Maintains workflow independence between tabs

### Conversion Logic
- `convertWorkflowToReactFlow()`: Main conversion function
- Type-specific handlers for endpoint and decision workflows
- Node positioning and edge creation automated

### Tab Integration
- Seamless integration with existing tab system
- Tab creation, switching, and deletion all supported
- Import workflows marked with `imported: true` flag