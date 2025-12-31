import google.generativeai as genai
import os
from typing import List, TypedDict

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel("gemini-flash-latest")

class Message(TypedDict):
    role: str
    content: str

def ask_gemini(previous_messages: List[Message], prompt: str):
    """
    Call Gemini API to get a response to `prompt` with context `previous_messages`
    
    :param previous_messages: Message class is {"role": either "user" or "model", "content": "..."}
    :type previous_messages: List[Message]
    :param prompt: The current prompt to ask LLM
    :type prompt: str
    """
    
    contents = []

    # Previous messages
    for m in previous_messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": m["content"]}]
        })

    # Current prompt
    contents.append({
        "role": "user",
        "parts": [{
            "text": f"Answer in plain text (paragraphs): {prompt}"
        }]
    })

    response = model.generate_content(contents)
    return response.text