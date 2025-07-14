# Project Structure & Organization

## Directory Layout

```
src/
├── App.js              # Main application component with flow logic
├── App.css             # Application-wide styles
├── index.js            # React app entry point
├── index.css           # Global styles
├── components/         # Reusable UI components
│   ├── Sidebar.js      # Node palette and test controls
│   ├── Toolbar.js      # Top navigation with save/load/validation
│   └── ValidationPanel.js # Flow validation display
├── nodes/              # ReactFlow node type definitions
│   ├── StartNode.js    # Flow entry point node
│   ├── EndNode.js      # Flow termination node
│   ├── InputNode.js    # Variable input node
│   ├── ConditionNode.js # Conditional branching node
│   └── FunctionNode.js # JavaScript execution node
└── utils/              # Utility functions and helpers
    └── validation.js   # Flow validation logic
```

## File Naming Conventions

- **Components**: PascalCase (e.g., `ValidationPanel.js`)
- **Utilities**: camelCase (e.g., `validation.js`)
- **Styles**: Match component name (e.g., `App.css`)

## Component Organization

- **App.js**: Central state management, flow execution, and layout
- **components/**: UI components that don't represent flow nodes
- **nodes/**: ReactFlow-specific node components with drag/drop and editing
- **utils/**: Pure functions for validation, layout, and data processing

## State Management Pattern

- Local component state using React hooks
- Props drilling for component communication
- No global state management library
- ReactFlow handles node/edge state with custom hooks

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