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

## Export System

### Overview
The Flow Builder includes a comprehensive export system that creates import-compatible JSON files, supporting both individual workflows and bulk exports.

### Export Features

#### Export Dialog
- **Professional Interface**: Modal dialog with export options
- **Filename Customization**: Enter custom filenames with automatic sanitization
- **Export Scope Selection**: Choose between current tab or all tabs
- **Real-time Preview**: Shows export summary and filename preview

#### Export Scopes

**Current Tab Export:**
- Exports only the active workflow tab
- Preserves original import data if available
- Creates single workflow JSON object

**All Tabs Export:**
- Exports all workflows with content
- Filters out empty workflows automatically
- Creates JSON array of workflow objects
- Maintains individual workflow integrity

#### Data Preservation

**Original Data Priority:**
- Imported workflows: Preserves exact original JSON structure
- Manual workflows: Creates proper import format from current structure
- Mixed exports: Handles both types correctly in same export

**Lossless Round-Trip:**
- Export → Import → Export produces identical results
- Rule names, expressions, and metadata preserved
- No data corruption or loss during export/import cycles

### Export Process

1. **Click "📤 Export Workflow"** in toolbar
2. **Select Export Scope**: Current tab or all tabs
3. **Enter Filename**: Custom name with automatic timestamp
4. **Review Summary**: Preview of export contents
5. **Download**: JSON file ready for import

### Export JSON Structure

**Single Workflow Export:**
```json
{
  "id": "workflow_identifier",
  "type": "decision|endpoint",
  "label": "Workflow_Name",
  "details": {
    "expressions": ["condition1", "condition2"],
    "resultType": "endpoint"
  }
}
```

**Multiple Workflows Export:**
```json
[
  {
    "id": "workflow1_id",
    "type": "decision",
    "label": "First_Workflow",
    "details": { ... }
  },
  {
    "id": "workflow2_id", 
    "type": "endpoint",
    "label": "Second_Workflow",
    "details": { ... }
  }
]
```

### Technical Implementation

#### Export Logic
- `convertFlowToImportFormat()`: Main export conversion function
- Original data preservation for imported workflows
- Smart format generation for manual workflows
- Unique ID generation with timestamps

#### File Management
- Automatic filename sanitization
- Timestamp-based unique naming
- Browser download integration
- Success feedback with file details