import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1); // Enable if you're behind a proxy (e.g., Heroku, Nginx)

// Define rate limiter config to prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Default to 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // Default to 100 requests
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate Limiter to all requests
app.use(limiter);

// Middleware for security headers
app.use(helmet());

// Middleware for enabling CORS
app.use(cors());

// Middleware for logging requests
app.use(morgan('combined'));

// Middleware for parsing JSON bodies
app.use(express.json()); 

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Mounts the api from the separate routes file
app.use(routes);

// Serves static Files from the public folder
app.use(express.static('public'));

// Root endpoint with styled HTML response
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>S.I.R.I.U.S.</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #000;
          color: #fff;
          font-family: Arial, sans-serif;
          text-align: center;
          overflow: hidden;
        }

        .title {
          display: inline-flex;
          overflow: hidden;
          white-space: nowrap;
          font-size: 3rem;
          font-weight: bold;
          letter-spacing: 3px;
        }

        .title span {
          opacity: 0;
          animation: fadeIn 1.5s ease forwards;
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 20px 0;
          color: #000;
          background-color: #00c6ff;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          font-size: 1.2rem;
          text-decoration: none;
          transition: background 0.3s ease;
        }

        .button:hover {
          background-color: #0073b1;
        }

        .integrations {
          display: flex;
          gap: 25px;
          margin-top: 20px;
          overflow: hidden;
          align-items: center;
          animation: scroll 15s linear infinite;
        }

        .integration {
          display: flex;
          align-items: center;
          color: #00c6ff;
        }

        .integration img {
          width: 40px;
          height: 40px;
          margin-right: 8px;
          filter: drop-shadow(0 0 5px #00c6ff);
          transition: transform 0.2s ease;
        }

        .integration img:hover {
          transform: scale(1.1);
        }

        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

      </style>
    </head>
    <body>
      <h1 class="title">
        <span>A</span><span>I</span> <span>A</span><span>s</span><span>s</span><span>i</span><span>s</span><span>t</span><span>a</span><span>n</span><span>t</span> 
        <span>S</span><span>i</span><span>r</span><span>i</span>
      </h1>
      <p>The API is up and running smoothly.</p>
      <a href="https://github.com/Devjosef/Ai-Assistant-Siri" target="_blank" class="button">Guide</a>

      <!-- Integrations Banner with SVG icons -->
      <div class="integrations">
        <div class="integration">
          <img src="/icons/trello.svg" alt="Trello" title="Trello">
        </div>
        <div class="integration">
          <img src="/icons/notion.svg" alt="Notion" title="Notion">
        </div>
        <div class="integration">
          <img src="/icons/google-calendar.svg" alt="Google Calendar" title="Google Calendar">
        </div>
        <div class="integration">
          <img src="/icons/pinecone.svg" alt="Pinecone" title="Pinecone">
        </div>
        <div class="integration">
          <img src="/icons/openai.svg" alt="OpenAI" title="OpenAI">
        </div>
      </div>

    </body>
   </html>
  `);
});


// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Set up server to listen on port 3000 or the environment's port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
 
