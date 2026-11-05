from dotenv import load_dotenv
import os
import json

load_dotenv()


class AIProvider:
    """Groq-only AI adapter. Default model is `llama-3.1-8b-instant`.

    Uses the Groq SDK with chat.completions.create() API.
    """

    def __init__(self):
        self.provider = 'groq'
        self.client = None
        self.model_name = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')

        try:
            import groq
            GROQ_API_KEY = os.getenv('GROQ_API_KEY')
            if GROQ_API_KEY:
                self.client = groq.Groq(api_key=GROQ_API_KEY)
            else:
                self.client = None
        except Exception as e:
            print(f"Failed to initialize Groq: {e}")
            self.client = None

    def is_configured(self) -> bool:
        return self.client is not None

    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
        if not self.is_configured():
            raise RuntimeError('Groq client not configured. Set GROQ_API_KEY and install SDK')

        try:
            # Groq SDK uses chat.completions.create()
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract text from response
            return response.choices[0].message.content
            
        except Exception as e:
            raise RuntimeError(f"Groq API error: {str(e)}")


# Singleton instance
ai = AIProvider()
