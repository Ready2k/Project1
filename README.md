# Flow Builder 🔄

A visual workflow creation tool built with React and ReactFlow. Create, test, and validate logical flows using an intuitive drag-and-drop interface.

![Flow Builder Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Flow+Builder+Interface)

## ✨ Features

- **🎨 Visual Flow Design**: Drag-and-drop interface for creating workflows
- **⚡ Real-time Validation**: Automatic validation with error/warning reporting
- **🧪 Flow Execution**: Test flows with variable tracking and execution path visualization
- **💾 Save/Load Flows**: Export flows as JSON files and import them back
- **📚 Template System**: Pre-built example flows and condition templates
- **🎯 Interactive Testing**: Step-by-step execution with variable inspection

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ready2k/Project1.git
   cd Project1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to see the application.

## 🎮 How to Use

### Creating Your First Flow

1. **Start with the basics**: Every flow needs a Start node and at least one End node
2. **Drag nodes from the sidebar**: Choose from Start, Input, Condition, Function, and End nodes
3. **Connect nodes**: Click and drag from one node's handle to another to create connections
4. **Configure nodes**: Click on any node to edit its properties

### Node Types

| Node Type | Purpose | Configuration |
|-----------|---------|---------------|
| 🚀 **Start** | Entry point for flow execution | Label only |
| 📝 **Input** | Define variables and values | Variable name and value |
| ❓ **Condition** | Branching logic with TRUE/FALSE paths | JavaScript condition expression |
| ⚙️ **Function** | Execute JavaScript code | JavaScript code block |
| 🏁 **End** | Terminal points for completion | Label only |

### Example Workflows

The application includes several pre-built examples:

- **🎯 Age Verification**: Check if user meets age requirements
- **📧 Email Validator**: Validate email format using regex
- **🔢 Grade Calculator**: Convert numeric scores to letter grades
- **🧮 Math Calculator**: Process numbers with functions
- **🔐 Password Strength**: Check password requirements

### Testing Your Flow

1. **Click "Run Test"** in the sidebar to execute your flow
2. **Watch the execution**: Nodes light up as they're processed
3. **Review results**: Check the test results panel for detailed output
4. **Debug issues**: Use validation warnings to fix flow problems

### Saving and Loading

- **Save**: Click the "Save Flow" button in the toolbar, enter a name, and download the JSON file
- **Load**: Click "Load Flow" and select a previously saved JSON file

## 🛠️ Development

### Project Structure

```
src/
├── App.js              # Main application component
├── components/         # UI components
│   ├── Sidebar.js      # Node palette and controls
│   ├── Toolbar.js      # Top navigation bar
│   └── ValidationPanel.js # Validation display
├── nodes/              # Flow node components
│   ├── StartNode.js    # Flow entry point
│   ├── InputNode.js    # Variable input
│   ├── ConditionNode.js # Conditional branching
│   ├── FunctionNode.js # Code execution
│   └── EndNode.js      # Flow termination
└── utils/              # Utility functions
    └── validation.js   # Flow validation logic
```

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

### Technology Stack

- **React 18.2** - UI framework
- **ReactFlow 11.10** - Visual node editor
- **Create React App** - Build tooling
- **JavaScript ES6+** - Programming language

## 📖 Usage Examples

### Simple Age Check Flow

```
[Start] → [Input: age=25] → [Condition: age >= 18] → [End: Adult ✓]
                                     ↓
                              [End: Minor ✗]
```

### Email Validation Flow

```
[Start] → [Input: email] → [Condition: regex test] → [End: Valid ✓]
                                    ↓
                            [End: Invalid ✗]
```

## 🎯 Use Cases

- **Logic Flow Validation**: Test business rules and decision trees
- **Educational Tool**: Learn conditional logic and programming concepts
- **Prototyping**: Quickly mock up workflow ideas
- **Visual Programming**: Create logic without traditional coding

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Ready2k/Project1/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build folder will contain the optimized production files.

### Deploy to GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://Ready2k.github.io/Project1",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy: `npm run deploy`

---

**Made with ❤️ using React and ReactFlow**

*Happy flow building! 🎉*