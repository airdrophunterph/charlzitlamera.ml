# Printer Vending Machine Web Application

A web-based interface for printer vending machines that supports file uploads, ChatGPT content generation, and legal document templates.

## Features

- Machine ID-based access control
- File upload and printing
- ChatGPT-powered content generation
- Legal document templates
- Dynamic pricing per machine
- Token usage tracking

## Setup

1. Clone the repository
2. Create a `.env` file in the root directory with the following content:
```
OPENAI_API_KEY=your_api_key_here
MODEL_VERSION=gpt-3.5-turbo
```

3. Configure machine-specific settings in `js/config.js`

## Security Notes

- Never commit the `.env` file
- Each machine should have its own API key for billing purposes
- Token usage is tracked per machine ID
- API keys should be rotated periodically

## Machine Configuration

Each machine can have its own configuration for:
- Price per black & white page
- Price per color page
- Maximum tokens per request
- API key (for production)

## Development

The frontend is built using:
- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (Vanilla)

## Production Deployment

For production:
1. Replace the test API key with machine-specific keys
2. Set up proper environment variable management
3. Implement secure API key storage
4. Set up monitoring for token usage
