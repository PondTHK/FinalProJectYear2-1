# AI Service

This service provides a unified interface for multiple AI providers: Gemini, OpenAI, Groq, and Mistral.

## Setup

1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

2.  Configure environment variables:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and set `AI_PROVIDER` to one of: `gemini`, `openai`, `groq`, `mistral`.
    Add the corresponding API key.

3.  Run the server:
    ```bash
    python main.py
    ```

## Features

-   **Personality Analysis**: `/analyze-personality`
-   **Chat**: `/chat`
-   **Resume Parsing**: `/parse-resume` (Supports PDF and Images)

## Providers

-   **Gemini**: Uses `gemini-2.5-pro` (or configured model). Native file support.
-   **OpenAI**: Uses `gpt-4o`. Supports PDF (text extraction) and Images (Vision).
-   **Groq**: Uses `llama-3.3-70b` for text and `llama-3.2-90b-vision` for images. PDF uses text extraction.
-   **Mistral**: Uses `mistral-large` for text and `pixtral-12b` for images. PDF uses text extraction.
