# Technology Stack & Build System

## Core Technologies

- **React 18.2.0**: Main UI framework with hooks (useState, useCallback, useEffect)
- **ReactFlow 11.10.1**: Visual node-based editor library for flow creation
- **Create React App**: Build system and development environment
- **JavaScript (ES6+)**: Primary language with modern syntax

## Key Dependencies

- **react-dom**: React DOM rendering
- **react-scripts**: CRA build tools and configuration

## Development Dependencies

- **@types/react** & **@types/react-dom**: TypeScript definitions for better IDE support

## Build Commands

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Eject from CRA (not recommended)
npm run eject
```

## Code Patterns

- **Functional Components**: All components use function syntax with hooks
- **Custom Hooks**: ReactFlow hooks (useNodesState, useEdgesState, useReactFlow)
- **State Management**: Local component state with useState, no external state library
- **Event Handling**: useCallback for performance optimization
- **Inline Styles**: Extensive use of style objects for component styling

## Architecture Principles

- Component-based architecture with clear separation of concerns
- Utility functions in separate modules (validation.js)
- Node types as separate components for modularity
- Real-time validation and execution capabilities