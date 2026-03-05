from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from groq import Groq
from pydantic import BaseModel
from typing import Optional
import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ----------- Model Constants -----------

TEXT_MODEL   = "llama-3.3-70b-versatile"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


# ----------- Pydantic Models -----------

class AnalyzeRequest(BaseModel):
    text: str

class ExtractRequest(BaseModel):
    text: str

class RouteRequest(BaseModel):
    child_id: int

# /chat accepts text messages + optional base64 image
class ChatRequest(BaseModel):
    messages:     list
    image_base64: Optional[str] = None
    image_mime:   Optional[str] = "image/jpeg"


# ----------- Category Taxonomy -----------

PARENT_CATEGORIES = {
    100: {"name": "Metro",                  "authority_code": "DMRC",          "authority_full": "Delhi Metro Rail Corporation"},
    101: {"name": "Roads & Infrastructure", "authority_code": "PWD",           "authority_full": "Public Works Department"},
    102: {"name": "Water & Sewage",         "authority_code": "DJB",           "authority_full": "Delhi Jal Board"},
    103: {"name": "Electricity",            "authority_code": "DISCOM",        "authority_full": "BSES / Tata Power Delhi"},
    104: {"name": "Sanitation & Waste",     "authority_code": "MCD",           "authority_full": "Municipal Corporation of Delhi"},
    105: {"name": "Parks & Public Spaces",  "authority_code": "MCD",           "authority_full": "Municipal Corporation of Delhi"},
    106: {"name": "Law & Safety",           "authority_code": "DELHI_POLICE",  "authority_full": "Delhi Police"},
    107: {"name": "Environment",            "authority_code": "DPCC",          "authority_full": "Delhi Pollution Control Committee"},
    108: {"name": "Lighting",               "authority_code": "MCD",           "authority_full": "Municipal Corporation of Delhi"},
    109: {"name": "Government Property",    "authority_code": "PWD",           "authority_full": "Public Works Department"},
    110: {"name": "NDMC Zone",              "authority_code": "NDMC",          "authority_full": "New Delhi Municipal Council"},
}

CHILD_CATEGORIES = {
    1:  {"name": "Metro Station Issue",             "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    2:  {"name": "Metro Track / Safety",            "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    3:  {"name": "Escalator / Lift",                "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    4:  {"name": "Metro Parking",                   "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    5:  {"name": "Metro Station Hygiene",           "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    6:  {"name": "Metro Property Damage",           "parent_id": 100, "authority_code": "DMRC",           "authority_full": "Delhi Metro Rail Corporation"},
    7:  {"name": "National Highway Damage",         "parent_id": 101, "authority_code": "NHAI",           "authority_full": "National Highways Authority of India"},
    8:  {"name": "Toll Plaza Issue",                "parent_id": 101, "authority_code": "NHAI",           "authority_full": "National Highways Authority of India"},
    9:  {"name": "Expressway Problem",              "parent_id": 101, "authority_code": "NHAI",           "authority_full": "National Highways Authority of India"},
    10: {"name": "Highway Bridge Damage",           "parent_id": 101, "authority_code": "NHAI",           "authority_full": "National Highways Authority of India"},
    11: {"name": "State Highway / City Road",       "parent_id": 101, "authority_code": "PWD",            "authority_full": "Public Works Department"},
    12: {"name": "Flyover / Overbridge",            "parent_id": 101, "authority_code": "PWD",            "authority_full": "Public Works Department"},
    13: {"name": "Government Building Issue",       "parent_id": 109, "authority_code": "PWD",            "authority_full": "Public Works Department"},
    14: {"name": "Large Drainage System",           "parent_id": 101, "authority_code": "PWD",            "authority_full": "Public Works Department"},
    15: {"name": "Colony Road / Lane",              "parent_id": 101, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    16: {"name": "Garbage Collection",              "parent_id": 104, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    17: {"name": "Street Sweeping",                 "parent_id": 104, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    18: {"name": "Park Maintenance",                "parent_id": 105, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    19: {"name": "Public Toilet",                   "parent_id": 104, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    20: {"name": "Local Drain / Sewage",            "parent_id": 102, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    21: {"name": "Stray Animals",                   "parent_id": 104, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    22: {"name": "Street Light (MCD zone)",         "parent_id": 108, "authority_code": "MCD",            "authority_full": "Municipal Corporation of Delhi"},
    23: {"name": "Connaught Place / Lutyens Issue", "parent_id": 110, "authority_code": "NDMC",           "authority_full": "New Delhi Municipal Council"},
    24: {"name": "NDMC Road / Infrastructure",      "parent_id": 110, "authority_code": "NDMC",           "authority_full": "New Delhi Municipal Council"},
    25: {"name": "NDMC Street Light",               "parent_id": 108, "authority_code": "NDMC",           "authority_full": "New Delhi Municipal Council"},
    26: {"name": "Central Govt Residential Zone",   "parent_id": 109, "authority_code": "NDMC",           "authority_full": "New Delhi Municipal Council"},
    27: {"name": "Water Supply Failure",            "parent_id": 102, "authority_code": "DJB",            "authority_full": "Delhi Jal Board"},
    28: {"name": "Water Pipe Leakage",              "parent_id": 102, "authority_code": "DJB",            "authority_full": "Delhi Jal Board"},
    29: {"name": "Sewer Line Blockage",             "parent_id": 102, "authority_code": "DJB",            "authority_full": "Delhi Jal Board"},
    30: {"name": "Contaminated Water",              "parent_id": 102, "authority_code": "DJB",            "authority_full": "Delhi Jal Board"},
    31: {"name": "Power Outage",                    "parent_id": 103, "authority_code": "DISCOM",         "authority_full": "BSES / Tata Power Delhi"},
    32: {"name": "Transformer Issue",               "parent_id": 103, "authority_code": "DISCOM",         "authority_full": "BSES / Tata Power Delhi"},
    33: {"name": "Exposed / Fallen Wire",           "parent_id": 103, "authority_code": "DISCOM",         "authority_full": "BSES / Tata Power Delhi"},
    34: {"name": "Electricity Pole Damage",         "parent_id": 103, "authority_code": "DISCOM",         "authority_full": "BSES / Tata Power Delhi"},
    35: {"name": "Crime / Safety Issue",            "parent_id": 106, "authority_code": "DELHI_POLICE",   "authority_full": "Delhi Police"},
    36: {"name": "Traffic Signal Problem",          "parent_id": 106, "authority_code": "TRAFFIC_POLICE", "authority_full": "Traffic Police"},
    37: {"name": "Illegal Parking",                 "parent_id": 106, "authority_code": "TRAFFIC_POLICE", "authority_full": "Traffic Police"},
    38: {"name": "Road Accident Black Spot",        "parent_id": 106, "authority_code": "TRAFFIC_POLICE", "authority_full": "Traffic Police"},
    39: {"name": "Illegal Tree Cutting",            "parent_id": 107, "authority_code": "FOREST_DEPT",    "authority_full": "Delhi Forest Department"},
    40: {"name": "Air Pollution / Burning",         "parent_id": 107, "authority_code": "DPCC",           "authority_full": "Delhi Pollution Control Committee"},
    41: {"name": "Noise Pollution",                 "parent_id": 107, "authority_code": "DPCC",           "authority_full": "Delhi Pollution Control Committee"},
    42: {"name": "Industrial Waste Dumping",        "parent_id": 107, "authority_code": "DPCC",           "authority_full": "Delhi Pollution Control Committee"},
}

CATEGORY_LIST_FOR_PROMPT = "\n".join(
    [f"{cid}: {info['name']}" for cid, info in CHILD_CATEGORIES.items()]
)

SEVERITY_RULES = """
Severity calibration:
- Low:      Minor issue, no immediate risk (small pothole, single dim light)
- Medium:   Affects daily life (garbage not collected 1 day, one broken light)
- High:     Significant disruption or health risk (no water 2+ days, multiple potholes with water)
- Critical: Danger to life or property (exposed live wire, open manhole, sewage overflow on road)
"""


# ----------- Helpers -----------

def enrich(data: dict) -> dict:
    """Add parent + authority info from local taxonomy map."""
    try:
        child_id = int(data.get("child_id", 0))
    except (TypeError, ValueError):
        child_id = 0

    if child_id in CHILD_CATEGORIES:
        child_info  = CHILD_CATEGORIES[child_id]
        parent_info = PARENT_CATEGORIES[child_info["parent_id"]]
        data["child_id"]       = child_id
        data["parent_id"]      = child_info["parent_id"]
        data["parent_name"]    = parent_info["name"]
        data["authority_code"] = child_info["authority_code"]
        data["authority_full"] = child_info["authority_full"]
    else:
        data["parent_id"]      = None
        data["parent_name"]    = "Unknown"
        data["authority_code"] = "UNKNOWN"
        data["authority_full"] = "Unknown Authority"
    return data


def safe_parse(response: str, fallback_text: str = "") -> dict:
    """Parse JSON from LLM response, stripping markdown fences if present."""
    try:
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
    except Exception:
        return {
            "child_id":     None,
            "category_name": "Unknown",
            "severity":     "Medium",
            "description":  fallback_text,
            "location":     "unknown",
        }


def detect_complaint(text: str) -> bool:
    completion = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": """Determine if the user message describes a civic or public infrastructure problem.
Understand English, Hindi and Hinglish.
Return only YES or NO — nothing else."""
            },
            {"role": "user", "content": text}
        ]
    )
    return completion.choices[0].message.content.strip().upper() == "YES"


def extract_from_text(text: str) -> dict:
    completion = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"""
Extract civic complaint information. Understand English, Hindi and Hinglish.

Pick the best matching category ID:
{CATEGORY_LIST_FOR_PROMPT}

{SEVERITY_RULES}

Return ONLY valid JSON, no extra text:
{{
  "child_id": <integer>,
  "category_name": "<name>",
  "severity": "<Low|Medium|High|Critical>",
  "description": "<one-line English summary>",
  "location": "<location if mentioned, else unknown>"
}}
"""
            },
            {"role": "user", "content": text}
        ]
    )
    data = safe_parse(completion.choices[0].message.content, text)
    return enrich(data)


def extract_from_image(base64_image: str, mime_type: str = "image/jpeg", user_text: str = "") -> dict:
    text_hint = f'\nThe user also wrote: "{user_text}"' if user_text.strip() else ""
    completion = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"""
You are a civic complaint extraction AI for Delhi, India.
Analyze the image and any accompanying user text to identify the civic issue.

Pick the best matching category ID:
{CATEGORY_LIST_FOR_PROMPT}

{SEVERITY_RULES}

Return ONLY valid JSON, no extra text:
{{
  "child_id": <integer>,
  "category_name": "<name>",
  "severity": "<Low|Medium|High|Critical>",
  "description": "<one-line English summary of what you see>",
  "location": "<location from image or user text, else unknown>",
  "visual_evidence": "<what in the image indicates this complaint>"
}}
"""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                    },
                    {
                        "type": "text",
                        "text": f"Analyze this civic issue image and extract complaint details.{text_hint}"
                    }
                ]
            }
        ]
    )
    data = safe_parse(completion.choices[0].message.content)
    return enrich(data)


# ----------- Endpoints -----------

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    """Quick classify — child_id, parent_id, authority_code, severity only."""
    completion = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": f"""
Classify this civic complaint. Understand English, Hindi, Hinglish.

Pick the best matching category ID:
{CATEGORY_LIST_FOR_PROMPT}

{SEVERITY_RULES}

Return ONLY valid JSON:
{{
  "child_id": <integer>,
  "severity": "<Low|Medium|High|Critical>"
}}
"""
            },
            {"role": "user", "content": request.text}
        ]
    )
    try:
        data     = safe_parse(completion.choices[0].message.content)
        child_id = int(data.get("child_id", 0))
        if child_id in CHILD_CATEGORIES:
            child_info = CHILD_CATEGORIES[child_id]
            return {
                "child_id":       child_id,
                "category_name":  child_info["name"],
                "parent_id":      child_info["parent_id"],
                "parent_name":    PARENT_CATEGORIES[child_info["parent_id"]]["name"],
                "authority_code": child_info["authority_code"],
                "severity":       data.get("severity", "Medium")
            }
        return {"child_id": None, "category_name": "Unknown", "severity": "Medium"}
    except Exception:
        return {"child_id": None, "category_name": "Unknown", "severity": "Medium"}


@app.post("/extract")
def extract(request: ExtractRequest):
    """Full extraction from text."""
    return extract_from_text(request.text)


@app.post("/extract-image")
async def extract_image_endpoint(
    file: UploadFile = File(...),
    text: str = Form(default="")
):
    """Full extraction from image + optional text."""
    contents = await file.read()
    b64      = base64.b64encode(contents).decode("utf-8")
    mime     = file.content_type or "image/jpeg"
    return extract_from_image(b64, mime, text)


@app.post("/route")
def route(request: RouteRequest):
    """Given child_id, return full routing info."""
    if request.child_id not in CHILD_CATEGORIES:
        return {"error": f"Unknown child_id: {request.child_id}"}
    child_info  = CHILD_CATEGORIES[request.child_id]
    parent_info = PARENT_CATEGORIES[child_info["parent_id"]]
    return {
        "child_id":       request.child_id,
        "category_name":  child_info["name"],
        "parent_id":      child_info["parent_id"],
        "parent_name":    parent_info["name"],
        "authority_code": child_info["authority_code"],
        "authority_full": child_info["authority_full"]
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming conversational endpoint (Seva bot).

    Logic:
    ┌─────────────────────────────────────────────────────────┐
    │ Image uploaded?                                         │
    │   YES → extract via vision (image + text combined)     │
    │         → Seva acknowledges + confirms department       │
    │   NO  → Is it a complaint?                             │
    │           YES → extract from text                       │
    │                 → Seva acknowledges + asks for photo    │
    │           NO  → Normal Seva conversation                │
    └─────────────────────────────────────────────────────────┘
    """

    last_msg  = request.messages[-1]
    user_text = last_msg.get("content", "") if isinstance(last_msg, dict) else str(last_msg)

    has_image    = bool(request.image_base64)
    is_complaint = detect_complaint(user_text)

    extracted       = None
    ask_for_image   = False

    if has_image:
        extracted = extract_from_image(
            request.image_base64,
            request.image_mime or "image/jpeg",
            user_text
        )
    elif is_complaint:
        extracted     = extract_from_text(user_text)
        ask_for_image = True   # no image yet — will ask

    def stream():

        # ── Build dynamic system context ──
        extraction_context = ""
        image_instruction  = ""

        if extracted and extracted.get("child_id"):
            visual_line = ""
            if has_image and extracted.get("visual_evidence"):
                visual_line = f"\n- Visual Evidence : {extracted['visual_evidence']}"

            extraction_context = f"""
The user's complaint has been automatically classified:
- Category  : {extracted.get('category_name')} (ID: {extracted.get('child_id')})
- Department: {extracted.get('parent_name')}
- Authority : {extracted.get('authority_full')}
- Severity  : {extracted.get('severity')}
- Location  : {extracted.get('location')}{visual_line}

In your response:
1. Acknowledge you have noted the complaint
2. Tell them exactly which department will handle it: {extracted.get('authority_full')}
3. Mention the severity level
{"4. Thank them for the photo — it makes the complaint stronger and faster to resolve." if has_image else ""}
"""

            if ask_for_image:
                image_instruction = """
After acknowledging the complaint, ask the user to upload a photo of the issue.
Be natural and warm — not robotic. Match their language (Hindi/Hinglish/English).

Example (Hinglish): "Ek photo bhi upload kar dein toh complaint aur strong ho jaati hai aur jaldi resolve hoti hai 📸"
Example (English):  "If you can share a photo of the issue, it really helps speed up the resolution!"
"""

        system_prompt = f"""
You are Seva (सेवा), a warm and professional civic assistant helping citizens of Delhi report public issues.

You are fluent in English, Hindi, and Hinglish. Always reply in the same language the user wrote in.

You understand Hinglish naturally:
"mere yha street light nhi chl rhi" → street light not working
"road pe bada gadda hai"            → big pothole on road
"pani supply band hai"              → water supply cut off
"kachra nahi utha 3 din se"        → garbage not collected for 3 days

Your personality:
- Warm, helpful, patient — like a trusted government helpdesk
- Never make up complaint IDs or ticket numbers
- Always tell the user which authority handles their complaint
- For non-complaint messages (greetings, questions), respond naturally

{extraction_context}
{image_instruction}
"""

        # ── Build messages list, injecting image into last message if present ──
        messages_to_send = []
        for i, msg in enumerate(request.messages):
            if i == len(request.messages) - 1 and has_image:
                messages_to_send.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{request.image_mime};base64,{request.image_base64}"
                            }
                        },
                        {"type": "text", "text": user_text}
                    ]
                })
            else:
                messages_to_send.append(msg)

        model = VISION_MODEL if has_image else TEXT_MODEL

        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_prompt}] + messages_to_send,
            stream=True
        )

        for chunk in completion:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return StreamingResponse(stream(), media_type="text/plain")