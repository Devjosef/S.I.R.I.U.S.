# Ai Assistant Siri

Ai Assistant Siri is an open-source web application designed to enhance productivity by integrating with multiple services such as Trello, Notion, Google Calendar, and Pinecone. This application allows users to manage tasks and events seamlessly across different platforms through a unified interface.

## Features

- **Trello Integration**: Create and manage Trello boards via API.
- **Notion Integration**: Generate and manage Notion templates.
- **Google Calendar Integration**: Add and organize events in Google Calendar.
- **Pinecone Integration**: Store and query vector embeddings for advanced applications.

## Additional Features

While the current implementation includes the integrations listed above, there are numerous other functionalities that could be integrated to further enhance the capabilities of Ai Assistant Siri:

- **Personal Task Management**: Integration with task management tools like Todoist or Asana to handle personal tasks and reminders.
- **Calendar and Scheduling**: Advanced scheduling features, such as syncing with multiple calendar platforms or automated reminders. Including events on MEETUP.
- **Email and Communication**: Connect with email services like Gmail, MailChimp, or Outlook to manage communications and automate responses.
- **Information Retrieval**: Use APIs to fetch and organize information from various sources, such as news or knowledge bases.
- **Personalized Health and Fitness**: Integration with health apps or fitness trackers to monitor and manage health data.
- **Home Automation**: Connect with smart home devices and platforms for home automation and control.
- **Finance and Budgeting**: Tools for managing personal finances, tracking expenses, and budgeting.
- **Travel and Navigation**: Integrate with travel services and navigation tools for planning and managing travel itineraries.
- **Learning and Development**: Features for accessing educational resources, courses, or tracking learning progress.
- **Entertainment and Media**: Integration with media services for managing and enjoying entertainment content.

## Getting Started

Follow these steps to set up and run Ai Assistant Siri on your local machine.

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org). (Important note: this project was written on Replit, where the current version for Node is v20.12.2)

### Installation

#### Clone the Repository

Open your terminal and clone the repository. Run the commands separately:

  ```bash
   git clone https://github.com/Devjosef/Ai-Assistant-Siri.git
   cd Ai-Assistant-Siri
   npm install
   npm start
   ```

#### Set Up Environment Variables

Create a `.env` file in the root directory of the project. This file will store your API keys and configuration settings. Use the following template and replace the placeholders with your actual keys:
```bash
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

### API Endpoints

#### Create Trello Board Endpoint: `/create-trello-board`

- **Method**: POST
- **Request Body**:

  ```json
  {
    "boardName": "My New Board",
    "templateId": "template_id_here"
  }
  ```

- **Response**:

  ```json
  {
    "id": "board_id",
    "name": "My New Board"
  }
  ```

#### Create Notion Template Endpoint: `/create-notion-template`

- **Method**: POST
- **Request Body**:

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

- **Response**:

  ```json
  {
    "id": "page_id",
    "object": "page",
    "properties": {
      "title": [
        {
          "type": "text",
          "text": {
            "content": "Template Title"
          }
        }
      ]
    }
  }
  ```

#### Create Google Calendar Event Endpoint: `/create-calendar-event`

- **Method**: POST
- **Request Body**:

  ```json
  {
    "summary": "Meeting with Team",
    "location": "Office",
    "description": "Discuss project milestones",
    "startDateTime": "2024-07-21T09:00:00",
    "endDateTime": "2024-07-21T10:00:00"
  }
  ```

- **Response**:

  ```json
  {
    "id": "event_id",
    "summary": "Meeting with Team",
    "start": {
      "dateTime": "2024-07-21T09:00:00"
    },
    "end": {
      "dateTime": "2024-07-21T10:00:00"
    }
  }
  ```

## Integration with Siri Shortcuts

To integrate this AI Assistant with Siri Shortcuts, follow these steps:

### Prerequisites

- **Apple Device**: Ensure you have an iPhone or iPad with iOS 12 or later.
- **Shortcuts App**: Make sure the Shortcuts app is installed on your device.
- **Server Running**: Ensure your server is running and accessible from your device.

### Steps to Create a Siri Shortcut

1. **Open the Shortcuts App**:
   - On your iPhone or iPad, open the Shortcuts app.

2. **Create a New Shortcut**:
   - Tap the + icon in the top-right corner to create a new shortcut.

3. **Add a Web Request Action**:
   - Tap Add Action. Search for Web and select Get Contents of URL.
   - In the URL field, enter the endpoint you want to interact with from your server (e.g., `https://your-server-url/api/create-trello-board`).

4. **Configure the Request**:
   - Change the method to POST if it’s not already.
   - Add necessary Request Body parameters, such as `boardName` and `templateId` for creating a Trello board.
   - Set the Content Type to `application/json` if required.

5. **Add Input Data**:
   - If your API requires user input, tap Show More and add Text Fields or Ask for Input actions to collect data.

6. **Handle Response**:
   - You can add additional actions to handle the response from your API, such as displaying results or saving data.

7. **Name Your Shortcut**:
   - Tap on the Settings icon at the top-right corner and give your shortcut a name, like “Create Trello Board”.

8. **Add to Siri**:
   - Tap Add to Siri. Record a custom phrase that will trigger this shortcut.

9. **Test Your Shortcut**:
   - Use Siri with the custom phrase to ensure it interacts with your API as expected.

### Example Integration

Here’s an example of integrating the Create Trello Board endpoint:

- **Shortcut Setup**:
  - URL: `https://your-server-url/api/create-trello-board`
  - Method: POST
  - Body: `{ "boardName": "My New Board", "templateId": "template123" }`

- **Use Siri**:
  - Say: "Create Trello Board" to trigger the shortcut.

## Troubleshooting

- **Server Not Accessible**: Ensure your server is publicly accessible and running.
- **Invalid Response**: Check the API documentation and ensure the request is correctly formatted.
- **Shortcut Not Triggering**: Verify the shortcut setup and test with different phrases.

## Contributing to Ai-Assistant-Siri

Thank you for considering contributing to Ai-Assistant-Siri! I welcome contributions from the community.

### How to Contribute

1. **Fork the Repository**:
   - Click the Fork button at the top-right corner of this repository to create your copy.

2. **Clone Your Fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/Ai-Assistant-Siri.git
   cd Ai-Assistant-Siri
   ```

3. **Create a Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**: Implement your changes or fixes. Write clear commit messages.

5. **Test Your Changes**: Ensure your changes work and pass all tests.

6. **Commit and Push**:

   ```bash
   git add .
   git commit -m "message"
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**: Open a pull request in the original repository and describe your changes.

### Reporting Issues

Please report any bugs or feature requests in the Issues section.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- **OpenAI**: For providing the powerful GPT-4 API.
- **Pinecone**: For their vector database service.
- **Trello**: For their project management tool.
- **Notion**: For their versatile workspace platform.
- **Google Calendar API**: For enabling calendar event management.

    

