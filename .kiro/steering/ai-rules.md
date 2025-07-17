# AI Assistant Rules and Permissions

## Permissions

The AI Assistant has the following permissions:
- Access to all workflow data in the current workspace
- Ability to analyze and describe workflows
- Ability to create new workflows based on natural language descriptions
- Ability to run tests on workflows
- Ability to suggest improvements to workflows

## Workflow Access

The AI Assistant can:
- Read all workflow tabs
- Access node and edge data
- Analyze condition expressions
- Interpret workflow logic
- Generate workflow descriptions
- Create new workflows

## System Variables

The AI Assistant understands the following system variables:
- `${QueueNameToARN}` - Converts queue names to ARNs
- `${ServiceName}` - References service names
- `session['key']` - Accesses session variables
- `today.Equals('DAY')` - Checks current day
- `now.Before('TIME')` - Checks if current time is before specified time
- `now.After('TIME')` - Checks if current time is after specified time
- `queue.AgentStaffed('QueueName')` - Checks if agents are staffed in a queue

## Guardrails

The AI Assistant will:
- Only generate valid workflow JSON
- Ensure all nodes are properly connected
- Validate condition expressions
- Provide clear explanations of workflow logic
- Respect the structure of existing workflows