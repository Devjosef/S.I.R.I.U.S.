import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Retry Requests
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retrying request... (${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
};

// Initialize OpenAI Client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone Client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY, 
});

// Prepare the Pinecone index
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// Function to log errors using axios
const logError = async (error) => {
  try {
    await axios.post('https://example.com/log', {
      error: error.message,
      stack: error.stack,
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

// Function to get embedding from OpenAI
export const getEmbedding = async (text) => {
  return retryRequest(async () => {
    try {
      const response = await client.createEmbedding({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data.data[0].embedding;
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Network Error:', error.message);
      } else {
        console.error('Unexpected Error:', error.message);
      }
      await logError(error); // Log the error using axios
      throw error;
    }
  });
};

// Function to store embedding in Pinecone
export const storeEmbedding = async (text, metadata) => {
  try {
    const embedding = await getEmbedding(text);
    await pineconeIndex.upsert([{ id: metadata.id, values: embedding }]);
  } catch (error) {
    console.error('Error storing embedding:', error);
    await logError(error); // Log the error using axios
    throw error;
  }
};

// Function to query embedding in Pinecone
export const queryEmbedding = async (text) => {
  try {
    const embedding = await getEmbedding(text);
    const result = await pineconeIndex.query({ vector: embedding, topK: 5 });
    return result.matches;
  } catch (error) {
    console.error('Error querying embedding:', error);
    await logError(error); // Log the error using axios
    const defaultEmbedding = new Array(512).fill(0); // A simple zero vector of the length 512
    return defaultEmbedding;
  }
};


