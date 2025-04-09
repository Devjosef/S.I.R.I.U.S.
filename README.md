# S.I.R.I.U.S.

Hey there! Welcome to S.I.R.I.U.S. (SMART, INTELLIGENT, RESPONSIVE, INTEGRATIVE, USER-FRIENDLY, SYSTEM) - my little project to make life easier by bringing together all the tools we use daily.

## What's this all about?

S.I.R.I.U.S. connects your favorite productivity apps like Trello, Notion, Google Calendar, and Pinecone in one place. No more jumping between tabs and apps - just one interface to rule them all.

## Cool stuff it can do

- **Trello**: Create boards right from the app
- **Notion**: Generate templates without the hassle
- **Google Calendar**: Add events without opening another tab
- **Pinecone**: Store and search vector embeddings if you're into that AI stuff

## What's on the roadmap?

I've got big dreams for this project. Here are some ideas I'm playing with:

- Personal task manager (Todoist/Asana integration)
- Better calendar tools (including Meetup events)
- Email stuff (Gmail, etc.)
- News and info grabber
- Health tracking
- Smart home controls
- Money management
- Travel planning
- Learning resources
- Media and entertainment

## Getting this up and running

### What you'll need

- **Node.js**: Grab it from [nodejs.org](https://nodejs.org) (I built this on Node v20.12.2)

### Setup

1. **Grab the code**

   ```bash
   git clone https://github.com/Devjosef/S.I.R.I.U.S..git
   cd S.I.R.I.U.S.
   npm install
   npm start
   ```

2. **Set up your secrets**

   Make a `.env` file in the project folder with your API keys:

   ```
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_pinecone_index_name
   TRELLO_API_KEY=your_trello_api_key
   TRELLO_TOKEN=your_trello_token
   NOTION_API_KEY=your_notion_api_key
   NOTION_DATABASE_ID=your_notion_database_id
   GOOGLE_API_KEY=your_google_api_key
   ```

## API Endpoints

Here's how to talk to S.I.R.I.U.S.:

### Create a Trello Board: `/create-trello-board`

**POST** with:
```json
{
  "boardName": "My New Board",
  "templateId": "template_id_here"
}
```

You'll get back:
```json
{
  "id": "board_id",
  "name": "My New Board"
}
```

### Create a Notion Template: `/create-notion-template`

**POST** with:
```json
{
  "templateName": "Template Title",
  "templateContent": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "text": [
          {
            "type": "text",
            "text": {
              "content": "Template content here"
            }
          }
        ]
      }
    }
  ]
}
```

### Add a Google Calendar Event: `/create-calendar-event`

**POST** with:
```json
{
  "summary": "Meeting with Team",
  "location": "Office",
  "description": "Discuss project milestones",
  "startDateTime": "2024-07-21T09:00:00",
  "endDateTime": "2024-07-21T10:00:00"
}
```

## Apple Shortcuts Integration

Want to control S.I.R.I.U.S. with Apple's Shortcuts app? Here's how:

### What you need
- iPhone or iPad with iOS 12+
- Shortcuts app installed
- Your server running and accessible

### Setting it up

1. Open the Shortcuts app on your iOS device
2. Tap + to create a new shortcut
3. Add "Get Contents of URL" action
4. Enter your server URL (like `https://your-server-url/api/create-trello-board`)
5. Switch method to POST
6. Add your parameters as JSON
7. Name your shortcut something snappy
8. Add the shortcut to Siri with a custom phrase like "Create Trello Board"
9. Try it out!

## Help me make this better!

I'd love your help improving S.I.R.I.U.S.! Here's how:

1. Fork the repo
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/S.I.R.I.U.S..git
   cd S.I.R.I.U.S.
   ```
3. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-cool-idea
   ```
4. Make your changes
5. Test to make sure nothing breaks
6. Commit and push:
   ```bash
   git add .
   git commit -m "Added this awesome thing"
   git push origin feature/your-cool-idea
   ```
7. Open a pull request

Found a bug? Open an issue and let me know!

## License

This project is under the MIT License. See the LICENSE file for details.

## Thanks to

- OpenAI for their amazing APIs
- Pinecone for vector storage
- Trello, Notion, and Google for their platforms
- You for checking this out!

# How it's organized

The project structure looks like this:

```
S.I.R.I.U.S/
├── public/                 # Static files
│   ├── icons/              # SVG icons
│   └── index.html          # Main HTML page
├── src/                    # Code
│   ├── config/             # Settings
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Helper functions
├── index.js                # Entry point
└── package.json            # Dependencies
```

## What's improved in this version

1. Modular code that's easier to maintain
2. Better error handling
3. Proper config management
4. Better security
5. Modern responsive design
6. Works offline as a PWA
7. Improved type safety
8. RESTful API design

# Running in different places

## On Replit

1. Fork to your Replit account
2. Set secrets in the Replit Secrets tab
3. Hit Run

## On your computer

1. Clone the repo
2. Run setup:
   ```bash
   ./setup.sh
   ```
3. Start it up:
   ```bash
   # Recommended way:
   ./run.sh
   
   # Or with npm:
   npm run local
   
   # For production:
   npm start
   ```

## Environment Variables

Required variables for `.env`:
```
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```

Optional variables (defaults shown):
```
PORT=3000
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100
```

## Troubleshooting

- If you see `nodemon: command not found`, run `npm install -g nodemon`
- Check the logs if the app won't start
- Double-check your API keys if you're getting authentication errors


