# Reinforcement Learning in S.I.R.I.U.S.

## What is Reinforcement Learning?
- Reinforcement Learning (RL) is a type of machine learning where an AI system learns to make decisions by trying different actions and learning from the results.
- Think of it like training a dog: when the dog does something good, you give it a treat (positive reward). When it does something bad, you don't give a treat (negative reward). Over time, the dog learns which behaviors get rewards.
- In S.I.R.I.U.S., the AI learns from your interactions and feedback to become more helpful and personalized over time.

## What is RLVR (Reinforcement Learning from Visual Reward)?
- RLVR is a breakthrough approach that lets AI learn from **just a single example** instead of needing thousands of examples.
- It's based on research from Yiping Wang et al. (paper: [arXiv:2504.20571](https://arxiv.org/abs/2504.20571))
- The "Visual" part means it learns from what it "sees" - your interface, current context, and how you interact with it.
- This makes S.I.R.I.U.S. much smarter with very little training data.

## How Does S.I.R.I.U.S. Use Reinforcement Learning?
- S.I.R.I.U.S. uses RLVR to learn your preferences and optimize its behavior automatically.
- When you interact with S.I.R.I.U.S. (clicking buttons, providing feedback, using features), it learns from these interactions.
- The system gets "rewards" based on your satisfaction, task completion, and efficiency.
- Over time, S.I.R.I.U.S. becomes more personalized and helpful without you having to explicitly configure anything.

## Benefits
- **Personalization**: S.I.R.I.U.S. learns your preferences and adapts to your workflow.
- **Efficiency**: The system gets better at suggesting helpful actions and avoiding unhelpful ones.
- **Minimal Training**: Learns from single examples instead of needing lots of data.
- **Real-time Adaptation**: Continuously improves as you use it.

## Trade-Offs
- **Learning Time**: Takes a few interactions to start seeing improvements.
- **Initial Behavior**: May not be perfectly optimized until it learns your patterns.
- **Memory Usage**: Stores learning data to improve over time.

## Technical Details: How RLVR Works in S.I.R.I.U.S.

### 1. Visual State Capture
- S.I.R.I.U.S. captures the current "state" of your interface and context:
  - What components are active (task manager, calendar, etc.)
  - Your current focus and energy level
  - Time of day and urgency
  - Recent actions and their results

```js
// Example of what S.I.R.I.U.S. captures
const visualState = {
  interface: {
    activeComponents: ['task-manager', 'calendar'],
    userFocus: 'deep-work',
    taskQueue: ['meeting prep', 'email review']
  },
  context: {
    timeBlock: 'morning',
    energy: 'high',
    urgency: 'normal'
  }
};
```

### 2. Action Selection and Execution
- Based on the current state, S.I.R.I.U.S. chooses an action from available options:
  - Focus mode activation
  - Break reminders
  - Meeting preparation
  - Task prioritization

```js
// S.I.R.I.U.S. selects the best action for the current situation
const possibleActions = [
  { type: 'focus_mode', title: 'Enable Focus Mode' },
  { type: 'break_reminder', title: 'Take a Break' },
  { type: 'meeting_prep', title: 'Prepare for Meeting' }
];

const optimalAction = RLVRService.getOptimalAction(visualState, possibleActions);
```

### 3. Reward Calculation
- After an action is taken, S.I.R.I.U.S. calculates a "reward" based on:
  - **Your feedback** (40% weight): Did you find it helpful?
  - **Task completion** (30% weight): Did it help complete a task?
  - **Efficiency** (20% weight): Did it save time or effort?
  - **Novelty** (10% weight): Was it a new, useful action?

```js
// Example reward calculation
const userFeedback = {
  positive: true,    // You clicked "👍 Useful"
  helpful: true,     // It actually helped
  efficient: true,   // It saved time
  neutral: false
};

const reward = calculateReward(userFeedback, taskCompletion, efficiency, novelty);
```

### 4. Learning and Policy Updates
- S.I.R.I.U.S. uses Q-learning to update its "policy" (decision-making strategy):
  - If an action got a high reward, it's more likely to choose similar actions in similar situations
  - If an action got a low reward, it's less likely to choose it again
  - The system balances exploration (trying new things) with exploitation (using what works)

```js
// The learning process updates the policy
await RLVRService.learnFromVisualFeedback(
  visualState,
  action,
  userFeedback
);
```

### 5. Integration with Autonomous Actions
- RLVR works with S.I.R.I.U.S.'s autonomous action system:
  - When autonomous actions succeed, they get positive rewards
  - When they fail, they get negative rewards
  - The system adjusts trigger sensitivity based on success patterns

```js
// Autonomous actions also learn from RLVR
async function learnFromAction(result, context, userId) {
  if (result.success) {
    // Positive reward for successful autonomous action
    await RLVRService.learnFromVisualFeedback(visualState, action, positiveFeedback);
  }
}
```

## Example: Learning from User Interaction

### Scenario: Meeting Preparation
1. **State**: You have a meeting in 15 minutes, you're in the task manager
2. **Action**: S.I.R.I.U.S. suggests "Prepare for Meeting"
3. **Your Response**: You click "👍 Perfect"
4. **Learning**: S.I.R.I.U.S. learns that meeting prep suggestions are valuable when you have upcoming meetings
5. **Future**: S.I.R.I.U.S. will be more likely to suggest meeting prep in similar situations

### Scenario: Focus Mode
1. **State**: You're working on a complex task, it's morning, high energy
2. **Action**: S.I.R.I.U.S. suggests "Enable Focus Mode"
3. **Your Response**: You click "👎 Not Helpful"
4. **Learning**: S.I.R.I.U.S. learns that focus mode isn't helpful in this context
5. **Future**: S.I.R.I.U.S. will be less likely to suggest focus mode in similar situations

## API Endpoints

### Learn from Feedback
```http
POST /api/rlvr/learn
Content-Type: application/json

{
  "visualState": { /* current interface and context */ },
  "action": { "type": "focus_mode", "title": "Focus Mode" },
  "userFeedback": { "positive": true, "helpful": true }
}
```

### Get Optimal Action
```http
POST /api/rlvr/optimal-action
Content-Type: application/json

{
  "visualState": { /* current state */ },
  "possibleActions": [
    { "type": "focus_mode", "title": "Focus Mode" },
    { "type": "break_reminder", "title": "Take Break" }
  ]
}
```

### Check Learning Stats
```http
GET /api/rlvr/stats
```

## Configuration

### RLVR Settings (`src/services/rlvrService.js`)
```js
const RLVR_CONFIG = {
  // Reward weights (how much each factor matters)
  rewardFunction: {
    userSatisfaction: 0.4,  // Your feedback (40%)
    taskCompletion: 0.3,    // Task completion (30%)
    efficiency: 0.2,        // Time/effort saved (20%)
    novelty: 0.1           // New useful actions (10%)
  },
  
  // Learning parameters
  learning: {
    learningRate: 0.001,    // How fast it learns
    discountFactor: 0.95,   // How much future rewards matter
    explorationRate: 0.1,   // How often to try new things
    memorySize: 1000        // How many experiences to remember
  }
};
```

## Demo and Testing

### Live Demo
- **Main Demo**: http://localhost:3000/live-rlvr-demo.html
- **Original Demo**: http://localhost:3000/rlvr-demo.html

### What to Try
1. Click on different scenarios (Weather, News, Calendar, Productivity)
2. Provide feedback (👍 Useful, 😐 Okay, 👎 Not Helpful)
3. Watch the learning statistics update in real-time
4. Notice how the system adapts its suggestions

### Expected Results
- **Experience Count**: Increases with each interaction
- **Policy Size**: Grows as the system learns more patterns
- **Exploration Rate**: Decreases as it becomes more confident
- **Action Suggestions**: Become more relevant over time

## CLI Commands and Debugging

### Check Learning Status
```bash
curl http://localhost:3000/api/rlvr/stats
```

### Test Learning
```bash
curl -X POST http://localhost:3000/api/rlvr/test \
  -H "Content-Type: application/json" \
  -d '{"testScenario": "debug-test"}'
```

### Monitor Server Logs
```bash
# Watch for RLVR learning activity
tail -f logs/sirius.log | grep "RLVR"
```

## Example: Creating a Custom Learning Scenario
```js
import { RLVRService } from './src/services/rlvrService.js';

// Create a visual state
const visualState = RLVRService.createVisualState(
  { timeBlock: 'morning', energy: 'high' },
  { activeComponents: ['task-manager'], userFocus: 'coding' }
);

// Learn from user feedback
await RLVRService.learnFromVisualFeedback(
  visualState,
  { type: 'focus_mode', title: 'Focus Mode' },
  { positive: true, helpful: true, efficient: true }
);

// Get optimal action for similar situation
const optimalAction = RLVRService.getOptimalAction(visualState, possibleActions);
```

---

For more details, see the RLVR service code, run the demos, or check the research paper at arXiv:2504.20571! 