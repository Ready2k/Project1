# Project Structure & Organization

## Directory Layout

```
src/
├── App.js              # Main application component with multi-tab workflow system
├── App.css             # Application-wide styles
├── index.js            # React app entry point
├── index.css           # Global styles
├── components/         # Reusable UI components
│   ├── Sidebar.js      # Node palette, test controls, and dynamic test configurator
│   ├── Toolbar.js      # Top navigation with save/load/import/validation
│   ├── ValidationPanel.js # Flow validation display
│   ├── TestConfigurator.js # Dynamic test configuration for complex expressions
│   └── AIChat.js       # AI-powered flow generation with integrated settings
├── nodes/              # ReactFlow node type definitions
│   ├── StartNode.js    # Flow entry point node with ID label support
│   ├── EndNode.js      # Flow termination node
│   ├── InputNode.js    # Variable input node
│   ├── ConditionNode.js # Conditional branching node
│   └── FunctionNode.js # JavaScript execution node
├── services/           # Business logic and external integrations
│   └── aiAgent.js      # AI flow generation service with multiple providers
└── utils/              # Utility functions and helpers
    └── validation.js   # Flow validation logic
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `ValidationPanel.js`)
- **Utilities**: camelCase (e.g., `validation.js`)
- **Styles**: Match component name (e.g., `App.css`)

## Component Organization

- **App.js**: Central state management, multi-tab workflow system, flow execution, rule navigation, and layout
- **components/**: UI components that don't represent flow nodes
  - **Sidebar.js**: Node palette, test controls, and integrated test configurator
  - **Toolbar.js**: Enhanced with workflow import functionality
  - **ValidationPanel.js**: Flow validation display with node highlighting
  - **TestConfigurator.js**: Dynamic test configuration for complex expressions and object methods
  - **AIChat.js**: Natural language flow generation with integrated AI provider settings
- **nodes/**: ReactFlow-specific node components with drag/drop, editing, and navigation
  - **StartNode.js**: Enhanced with ID label display and highlighting for imported workflows
  - **EndNode.js**: Enhanced with rule linking and navigation functionality
  - **ConditionNode.js**: Conditional branching with complex expression support
  - **FunctionNode.js**: JavaScript execution node
  - **InputNode.js**: Variable input node
- **services/**: Business logic and external service integrations
  - **aiAgent.js**: AI-powered flow generation with multiple provider support
- **utils/**: Pure functions for validation, layout, and data processing
  - **validation.js**: Flow validation logic with enhanced error reporting

## Multi-Tab Workflow System

- **Tab Management**: Create, switch, and delete workflow tabs
- **Independent State**: Each tab maintains its own nodes and edges
- **Import Support**: JSON workflow import creates separate tabs
- **Tab Naming**: Auto-generated names (Rule1, Rule2, etc.) for imported workflows

## State Management Pattern

- Local component state using React hooks
- Multi-tab workflow state with active workflow tracking
- Props drilling for component communication
- No global state management library
- ReactFlow handles node/edge state with custom hooks
- Workflow synchronization between tabs and canvas state

## Styling Approach

- CSS files co-located with components
- Inline styles for dynamic/conditional styling
- CSS classes for static component styles
- Consistent color scheme across node types

## Import Conventions

- React imports first
- Third-party libraries second
- Local components and utilities last
- Relative imports for local files