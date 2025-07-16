# AI Assistant System

## Overview

The Flow Builder includes a powerful AI Assistant that can generate workflows from natural language descriptions, analyze existing workflows, and help with testing. The system supports multiple AI providers and includes intelligent fallback mechanisms.

## Core Features

### 🤖 Natural Language Flow Generation
- **Intelligent Pattern Recognition**: Recognizes complex patterns like "Tuesday before 9am"
- **Sequential Condition Flows**: Creates properly connected multi-condition workflows
- **Time-Based Logic**: Specialized handling for date/time conditions
- **Perfect Edge Connections**: Ensures all nodes are properly connected with appropriate TRUE/FALSE paths

### 📤 Export Integration
- **Automatic Export JSON**: Generated flows include import-compatible JSON format
- **Copy to Clipboard**: One-click copy functionality for export JSON
- **Round-Trip Compatible**: Exported flows can be imported back perfectly

### 🧠 Context Analysis
- **Workspace Analysis**: Can describe current workflows and tabs
- **Flow Explanation**: Explains what workflows do and how they work
- **Smart Suggestions**: Provides recommendations based on current context

### 🧪 Testing Integration
- **Test Configuration**: Helps configure test values for complex expressions
- **Test Execution**: Can run tests and interpret results
- **Result Analysis**: Provides detailed explanations of test outcomes

## Supported AI Providers

### OpenAI
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Configuration**: API key required
- **Features**: Full natural language processing capabilities

### Anthropic Claude
- **Models**: Claude-3-haiku, Claude-3-sonnet, Claude-3-opus
- **Configuration**: API key required
- **Features**: Advanced reasoning and code generation

### Local Ollama
- **Models**: Any Ollama-compatible model (llama2, codellama, etc.)
- **Configuration**: Local endpoint (default: http://localhost:11434)
- **Features**: Privacy-focused local AI processing

### Azure OpenAI
- **Models**: Deployed Azure OpenAI models
- **Configuration**: Endpoint URL and API key required
- **Features**: Enterprise-grade AI with Azure integration

### AWS Bedrock
- **Models**: Claude, Titan, Jurassic models
- **Configuration**: AWS credentials and region
- **Features**: Serverless AI with AWS integration

### DeepSeek
- **Models**: DeepSeek-coder, DeepSeek-chat
- **Configuration**: API key and endpoint
- **Features**: Code-focused AI capabilities

### Custom APIs
- **Compatibility**: OpenAI-compatible API endpoints
- **Configuration**: Custom endpoint URL and API key
- **Features**: Flexible integration with custom AI services

## Enhanced Mock AI System

### Intelligent Fallback
- **Automatic Activation**: Triggers when external AI providers fail
- **Pattern Recognition**: Advanced pattern matching for common workflow types
- **Smart Defaults**: Provides reasonable defaults based on input analysis

### Supported Patterns
- **Time-Based Flows**: "Tuesday before 9am", "Monday after 5pm"
- **Validation Flows**: Email validation, password strength, age verification
- **Calculation Flows**: Math operations, grade calculations, discount calculations
- **Decision Flows**: Multi-condition branching logic

## Flow Generation Capabilities

### Time-Based Workflows
**Input**: "Create a flow to check if it's a Tuesday before 9am"
**Generated**:
- Start node
- Input nodes for date/time variables
- Sequential condition nodes: `today.Equals('TUE')` → `now.Before('09:00')`
- TRUE/FALSE end nodes with proper connections

### Validation Workflows
**Input**: "Create an email validation flow"
**Generated**:
- Start node
- Input node for email variable
- Condition node with regex validation
- Valid/Invalid end nodes

### Complex Decision Workflows
**Input**: "Create a flow that checks age and email, then processes payment"
**Generated**:
- Multiple input nodes
- Sequential condition checks
- Function nodes for processing
- Multiple end paths

## Edge Connection Intelligence

### Sequential Conditions
- **TRUE Path**: Connects to next condition in sequence
- **FALSE Path**: Connects to appropriate failure end node
- **Final Condition**: Both paths connect to respective end nodes

### Branching Logic
- **Parallel Conditions**: Creates separate branches for independent checks
- **Nested Logic**: Handles complex nested conditional structures
- **Error Handling**: Ensures all paths lead to valid end nodes

## Export JSON Integration

### Automatic Generation
Every AI-generated flow includes:
```json
{
  "id": "AI_Generated_Flow_123456",
  "type": "decision",
  "label": "Tuesday 9AM Check",
  "details": {
    "expressions": [
      "today.Equals('TUE')",
      "now.Before('09:00')"
    ],
    "resultType": "endpoint"
  }
}
```

### Copy Functionality
- **One-Click Copy**: Copy button in AI chat interface
- **Formatted JSON**: Pretty-printed with proper indentation
- **Import Ready**: Can be imported directly using Import Workflows

## Context Analysis Features

### Workspace Description
**User**: "What's on screen?"
**AI Response**:
- Total workflows and active workflow
- Node counts and types
- Condition summaries
- Input variable listings
- Suggestions for improvements

### Flow Explanation
**User**: "Explain this workflow"
**AI Response**:
- Step-by-step flow description
- Condition logic explanation
- Input/output analysis
- Potential issues or improvements

## Testing Integration

### Test Configuration
- **Variable Detection**: Automatically identifies test variables
- **Value Suggestions**: Provides appropriate default test values
- **Complex Expressions**: Handles system variables and object methods

### Test Execution
- **Result Interpretation**: Explains test outcomes in plain English
- **Error Analysis**: Identifies and explains test failures
- **Optimization Suggestions**: Recommends improvements based on test results

## Usage Examples

### Basic Flow Creation
```
User: "Create a simple age verification flow"
AI: Creates flow with age input → condition (age >= 18) → Adult/Minor end nodes
```

### Complex Time-Based Flow
```
User: "Check if it's Tuesday before 9am, if so route to ABC queue"
AI: Creates sequential conditions for day and time with proper queue routing
```

### Context Analysis
```
User: "Describe my current workflows"
AI: Analyzes all tabs, provides summary of nodes, conditions, and structure
```

### Test Assistance
```
User: "Test this flow"
AI: Configures test variables, runs test, explains results
```

## Technical Implementation

### Flow Generation Pipeline
1. **Intent Parsing**: Analyze natural language input
2. **Pattern Recognition**: Identify workflow type and requirements
3. **Node Generation**: Create appropriate nodes with proper configuration
4. **Edge Creation**: Connect nodes with intelligent routing logic
5. **Export Integration**: Generate import-compatible JSON
6. **UI Integration**: Display in chat with copy functionality

### Error Handling
- **Provider Failures**: Automatic fallback to enhanced mock AI
- **Invalid Inputs**: Clear error messages with suggestions
- **Connection Issues**: Graceful degradation with user feedback

### Performance Optimization
- **Caching**: Cache common patterns and responses
- **Streaming**: Support for streaming responses from AI providers
- **Rate Limiting**: Respect API rate limits with intelligent queuing

## Configuration

### AI Provider Setup
1. **Open AI Assistant**: Click 🤖 AI Assistant button
2. **Access Settings**: Click ⚙️ gear icon in chat interface
3. **Select Provider**: Choose from available AI providers
4. **Configure Credentials**: Enter API keys and endpoints
5. **Test Connection**: Verify configuration with test call

### Mock Fallback Settings
- **Enable/Disable**: Toggle mock fallback in settings
- **Fallback Behavior**: Configure when to use mock AI
- **Pattern Customization**: Add custom patterns for mock recognition

## Best Practices

### Effective Prompts
- **Be Specific**: "Check if Tuesday before 9am" vs "Check day and time"
- **Include Context**: Mention variables, conditions, and expected outcomes
- **Use Examples**: Reference similar workflows or patterns

### Flow Optimization
- **Test Early**: Use AI testing integration to validate flows
- **Iterate**: Ask AI to modify or improve generated flows
- **Export/Import**: Use export functionality to save and share flows

### Provider Selection
- **OpenAI**: Best for general natural language understanding
- **Claude**: Excellent for complex reasoning and code generation
- **Ollama**: Privacy-focused local processing
- **Mock AI**: Reliable fallback with good pattern recognition