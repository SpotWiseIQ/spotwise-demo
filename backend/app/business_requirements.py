"""
Business requirements module for Tampere Explorer Hub.
This module contains functions for processing business requirements.
"""

import logging
import os
import openai
from dotenv import load_dotenv
from app.models import BusinessType, BusinessIntent, BusinessRequirementNotSupported

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def get_business_requirements_response(text: str) -> dict:
    """
    Process business requirements text and return a response.

    Args:
        text: The business requirement text to process

    Returns:
        A dictionary containing the processed business requirements
    """
    logger.info(f"Processing business requirement: {text[:50]}...")

    # This is a simple implementation that just returns the input text
    # In a real implementation, this would analyze the text and extract business requirements
    return {
        "status": "success",
        "input_text": text,
        "analysis": {
            "key_points": [
                "Analyzed business requirements from user input",
                "Identified potential opportunities in Tampere",
                "Recommended locations based on foot traffic data",
            ],
            "summary": "Business requirements analysis completed successfully",
            "recommendations": [
                "Consider high foot traffic areas for business placement",
                "Analyze demographic data for target customer alignment",
                "Monitor event-based traffic patterns for temporary business opportunities",
            ],
        },
    }


def sanitize_user_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize user input by capping length and filtering for prompt injection attempts.
    """
    if len(text) > max_length:
        raise ValueError(f"Input too long (max {max_length} characters).")
    blacklist = [
        "ignore previous instructions",
        "disregard above",
        "as an ai language model",
        "you are now",
        "pretend to",
        "act as",
        "system:",
        "assistant:",
    ]
    lowered = text.lower()
    for phrase in blacklist:
        if phrase in lowered:
            raise ValueError("Input contains disallowed content.")
    return text


def classify_business_requirement_with_openai(text: str) -> dict:
    """
    Classify the business requirement using OpenAI's GPT-4.1-nano via the modern responses API.
    Returns a dict with either a supported business classification or a not-supported message.
    """
    try:
        sanitized_text = sanitize_user_input(text)
    except ValueError as e:
        logger.warning(f"Rejected user input: {e}")
        return BusinessRequirementNotSupported(message=str(e), input_text=text).dict()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")

    client = openai.OpenAI(api_key=api_key)

    prompt = (
        "You are a business requirement classifier for a city business planning tool.\n"
        "Supported business types: Static (Car Wash), Mobile (Food Stall, Artisan Stall).\n"
        "Supported intents: Research, Setup.\n"
        "Supported location: Tampere.\n"
        "Classify the following user business requirement into one of:\n"
        "- Static: Car Wash\n"
        "- Mobile: Food Stall\n"
        "- Mobile: Artisan Stall\n"
        "If the requirement does not fit any of these, respond with 'not supported'.\n"
        "Also, determine the user's intent: 'Research' (if they are exploring, comparing, or gathering information) or 'Setup' (if they are ready to start or open the business).\n"
        "Extract any city or geographical location mentioned in the requirement (null if none).\n"
        "Respond in JSON with keys: supported (bool), business_type (Static|Mobile|null), business (Car Wash|Food Stall|Artisan Stall|null), intent (Research|Setup|null), location (str|null), message (str).\n"
        f"User requirement: {sanitized_text}"
    )

    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=200,
        temperature=0.0,
    )
    result = response.choices[0].message.content
    import json

    try:
        parsed = json.loads(result)
        logger.debug(f"OpenAI classification response: {parsed}")
    except Exception:
        logger.error("Failed to parse OpenAI response", exc_info=True)
        return BusinessRequirementNotSupported(
            message="Could not classify the business requirement.", input_text=text
        ).dict()

    if not parsed.get("supported", False):
        return BusinessRequirementNotSupported(
            message=parsed.get("message", "Business requirement not supported."),
            input_text=text,
        ).dict()

    return {
        "supported": True,
        "business_type": parsed.get("business_type"),
        "business": parsed.get("business"),
        "intent": parsed.get("intent"),
        "location": parsed.get("location"),
        "message": parsed.get("message", "Business requirement classified."),
    }


def generate_llm_summary(metrics, business_requirement, location_type, instructions):
    """
    Generate a summary using OpenAI based on metrics, business requirement, location type, and instructions.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable not set.")
        client = openai.OpenAI(api_key=api_key)
        # Compose a prompt for the LLM
        prompt = (
            f"You are a business location advisor for Tampere.\n"
            f"The user is interested in: {business_requirement}\n"
            f"Location type: {location_type}\n"
            f"Here are the relevant metrics for this zone (as JSON):\n{metrics}\n"
            f"Instructions: {instructions}\n"
            f"Create a concise, helpful summary for the user."
        )
        response = client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.2,
        )
        summary = response.choices[0].message.content.strip()
        return summary
    except Exception as e:
        logger.error(f"Failed to generate LLM summary: {e}", exc_info=True)
        return "This area has promising metrics for your business. (LLM summary unavailable)"
