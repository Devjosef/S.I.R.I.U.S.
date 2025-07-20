# Memory and Learning in S.I.R.I.U.S.

## What is Stored in `data/memory/`?
- Each user has a separate JSON file in `data/memory/`.
- These files store:
  - Task and event history
  - Circadian rhythm patterns (when you are most active)
  - Preferences and context
  - Performance and interaction metrics
- No data is ever sent to the cloud—everything stays local.

## How Does S.I.R.I.U.S. Learn?
- The system observes your real usage: when you complete tasks, check emails, or interact with the app.
- It builds a profile of your habits, such as:
  - Are you a morning or evening person?
  - What times are you most productive?
  - What types of tasks do you prefer?
- This learning is ongoing and adapts as your patterns change.

## How is This Data Used?
- S.I.R.I.U.S. uses your memory data to:
  - Recommend the best times for tasks and meetings
  - Predict your next likely action
  - Generate daily digests and summaries
  - Personalize notifications and suggestions
- All recommendations are based on your real, local data—never generic or cloud-based.

## Resetting or Clearing Your Memory
- To reset your learning, simply delete or clear your user file(s) in `data/memory/`.
- The system will start fresh and learn from your new activity.

## Privacy Notes
- All memory data is stored locally and never leaves your device.
- You have full control: delete, edit, or back up your memory files at any time.
- No third-party analytics or tracking is used.

---

For more details, see `src/services/memoryService.js` and the main README. 