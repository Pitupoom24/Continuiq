import google.generativeai as genai
import os
from typing import List, TypedDict

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel("gemini-flash-latest")

class MessageDict(TypedDict):
    role: str
    content: str

def ask_gemini(previous_messages: List[MessageDict], prompt: str):
    """
    Call Gemini API to get a response to `prompt` with context `previous_messages`
    
    :param previous_messages: Message class is {"role": either "user" or "model", "content": "..."}
    :type previous_messages: List[Message]
    :param prompt: The current prompt to ask LLM
    :type prompt: str
    """
    # Industry Standard: Trim history to 10 messages to maintain focus and stay within limits
    context = previous_messages[-10:] if len(previous_messages) > 10 else previous_messages
    
    contents = []
    for m in context:
        contents.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}]
        })

    # Add the final instruction
    contents.append({
        "role": "user", 
        "parts": [{"text": f"Instruction: Answer in plain text (paragraphs): {prompt}"}]
    })

    try:
        response = model.generate_content(contents)
        return response.text
    except Exception as e:
        return f"AI Service Error: {str(e)}"