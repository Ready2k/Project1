# Flow Builder 🔄

A powerful visual workflow creation tool built with React and ReactFlow. Create, test, and validate complex logical flows using an intuitive drag-and-drop interface with advanced AI-powered features and enterprise workflow management capabilities.

![Flow Builder Screenshot](https://via.placeholder.com/800x400/667eea/ffffff?text=Flow+Builder+Interface)

## ✨ Features

### 🤖 AI-Powered Workflow Creation
- **🧠 Enhanced AI Assistant**: Natural language workflow generation with intelligent pattern recognition
- **🔗 Perfect Node Connections**: AI automatically creates properly connected sequential condition flows
- **📤 Smart Export Integration**: AI-generated flows include export-ready JSON format with copy functionality
- **🎯 Time-Based Flow Recognition**: Specialized handling for date/time conditions like "Tuesday before 9am"
- **⚙️ Multiple AI Providers**: Support for OpenAI, Claude, Ollama, Azure OpenAI, AWS Bedrock, DeepSeek, and custom APIs
- **🔄 Intelligent Mock Fallback**: Enhanced mock AI with pattern recognition when external providers fail
- **🧠 Context Analysis**: AI can analyze current workspace and describe workflows
- **🧪 Testing Integration**: AI-powered test configuration and execution assistance

### 📤 Advanced Export/Import System
- **📋 Export Workflow Dialog**: Professional export interface with filename customization
- **🎯 Flexible Export Scope**: Choose between current tab or all tabs export
- **🔄 Perfect Round-Trip**: Preserves original import data for lossless export/import cycles
- **📊 Export Summary**: Real-time preview of what will be exported
- **📁 Smart File Naming**: Automatic filename generation with timestamps
- **💾 One-Click Copy**: Copy export JSON directly to clipboard

### Core Workflow Features
- **🎨 Visual Flow Design**: Drag-and-drop interface for creating workflows
- **⚡ Real-time Validation**: Automatic validation with error/warning reporting
- **🧪 Flow Execution**: Test flows with variable tracking and execution path visualization
- **💾 Save/Load Flows**: Export flows as JSON files and import them back
- **📚 Template System**: Pre-built example flows and condition templates

### Advanced Features
- **📑 Multi-Tab Workflow System**: Manage multiple workflows simultaneously with independent tabs
- **📥 JSON Workflow Import**: Import complex routing workflows from JSON with automatic conversion
- **🔗 Rule Linking & Navigation**: Click-to-jump between related workflows with visual link indicators
- **🧪 Dynamic Test Configurator**: Context-aware test configuration for complex expressions
- **🎯 Context Analysis**: AI can analyze and describe your current workspace and workflows

### Enterprise-Ready
- **🏢 Complex Routing Support**: Handle enterprise routing rules with evaluations and decision trees
- **🔍 Smart Variable Detection**: Automatically detect and configure test values for complex expressions
- **📊 Enhanced Debugging**: Detailed execution traces with variable inspection and error suggestions
- **🎯 Context-Aware Testing**: Per-workflow test configurations with object method mocking
- **🔄 Workflow Management**: Complete import/export workflow lifecycle with data preservation

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

   **For Corporate Environments** (if you encounter blocked packages):
   ```bash
   # Option 1: Use the corporate install script
   node install-corporate.js
   
   # Option 2: Install with corporate-friendly flags
   npm install --legacy-peer-deps --no-optional
   
   # Option 3: Use Yarn if available
   yarn install
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

### Multi-Tab Workflow Management

1. **Create New Tabs**: Click the "+" button to add new workflow tabs
2. **Switch Between Workflows**: Click on tab names to switch between different workflows
3. **Independent State**: Each tab maintains its own nodes, edges, and configuration
4. **Import Multiple Workflows**: JSON import automatically creates separate tabs for each workflow

### JSON Workflow Import

1. **Click "Import Workflows"** in the toolbar
2. **Select JSON file** containing workflow definitions
3. **Automatic Conversion**: Complex routing rules are converted to visual flows
4. **Tab Creation**: Each workflow becomes a separate tab (Rule1, Rule2, etc.)

**Supported JSON Format:**
```json
[
  {
    "Id": "TBC_Routing",
    "Name": "MyWorkflow",
    "Evaluations": [
      {
        "Expression": "queue.AgentStaffed('QueueName')>0",
        "Order": 0,
        "Result": {
          "ResultType": "endpoint",
          "ResultValue": { "EndPoint": { "Qname": "TargetQueue" } }
        }
      }
    ],
    "DefaultResult": {
      "ResultType": "endpoint", 
      "ResultValue": { "EndPoint": { "Qname": "DefaultQueue" } }
    }
  }
]
```

### Rule Linking & Navigation

- **Visual Link Icons**: End nodes with references to other rules show 🔗 link icons
- **Click to Navigate**: Click on linked end nodes to jump to the referenced rule
- **Smart Highlighting**: Target start nodes are highlighted when navigating
- **Automatic Matching**: Links are created based on decision names in your workflows

### Dynamic Test Configuration

1. **Click "⚙️ Test Config"** in the sidebar to expand the configuration panel
2. **Auto-Detection**: Variables and object methods are automatically detected from conditions
3. **Configure Values**: Set test values for detected variables:
   - `queue.AgentStaffed()` → Number input
   - `date.After()` → Date input  
   - `session['key']` → Text input
   - `now.Before()` → Time input
4. **Context-Aware**: Each workflow tab has its own test configuration
5. **Run Tests**: Click "🧪 Run Test" to execute with your configured values

### AI-Powered Flow Generation

1. **Click "🤖 AI Assistant"** in the toolbar
2. **Configure AI Provider**: Click the ⚙️ gear icon to set up your AI provider:
   - OpenAI (GPT-3.5, GPT-4)
   - Anthropic Claude
   - Local Ollama
   - Azure OpenAI
   - AWS Bedrock
   - DeepSeek
   - Custom APIs
3. **Natural Language Input**: Describe your workflow in plain English
   - Example: "Create a flow to check if it's a Tuesday before 9am, if so then set a value to True, if not then False"
4. **Enhanced Features**:
   - **🔗 Perfect Connections**: AI creates properly connected sequential condition flows
   - **🎯 Time Recognition**: Specialized handling for date/time conditions
   - **📤 Export Integration**: Generated flows include export JSON with copy functionality
   - **🧠 Context Analysis**: Ask AI to "describe my workflows" or "what's on screen"
   - **🧪 Test Integration**: AI can help configure and run tests on generated flows
5. **Interactive Questions**: AI may ask clarifying questions for complex flows
6. **Automatic Generation**: Generated flows appear on the canvas ready for testing

### Advanced Export/Import Workflow

1. **Export Current or All Tabs**:
   - Click "📤 Export Workflow" in the toolbar
   - Choose between "📄 Current Tab Only" or "📑 All Tabs"
   - Enter custom filename
   - Review export summary
   - Click "📤 Export" to download

2. **Perfect Round-Trip**:
   - Exported workflows preserve original import data
   - No data loss during export/import cycles
   - Rule names and expressions remain identical
   - Original metadata is maintained

3. **Smart Export Features**:
   - Real-time filename preview with timestamps
   - Export summary showing nodes, connections, and tab information
   - One-click JSON copy to clipboard from AI-generated flows
   - Automatic filtering of empty workflows

### Testing Your Flow

#### Basic Testing
1. **Click "🧪 Run Test"** in the sidebar to execute your flow
2. **Watch the execution**: Nodes light up as they're processed
3. **Review results**: Check the test results panel for detailed output
4. **Debug issues**: Use validation warnings to fix flow problems

#### Advanced Testing (for Complex Workflows)
1. **Configure Test Values**: Use "⚙️ Test Config" to set values for complex expressions
2. **Object Method Mocking**: Configure return values for `queue.AgentStaffed()`, `date.After()`, etc.
3. **Session Variable Testing**: Set test values for `session['key']` expressions
4. **Per-Tab Configuration**: Each workflow tab can have different test configurations

### Saving and Loading

- **Save**: Click the "Save Flow" button in the toolbar, enter a name, and download the JSON file
- **Load**: Click "Load Flow" and select a previously saved JSON file
- **Import**: Click "Import Workflows" to import complex JSON workflow definitions

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