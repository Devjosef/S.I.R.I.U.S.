import re
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, validator

# Empirical Types
class FinancialMetric(BaseModel):
    type: Literal["spend", "income"]
    amount: float = Field(..., gt=0.0, description="Amount must be a positive number")
    category: str = Field(..., min_length=1)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CalendarEvent(BaseModel):
    title: str = Field(..., min_length=1)
    date_str: str 
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Santizing inputs
class AssistantParser:
    @staticmethod
    def parse_text(raw_text: str):
        text = raw_text.strip().lower()
        if text.startswith(("spend:", "income:")):
            match = re.match(r"^(spend|income):\s*([\d\.]+)\s+(.+)$", text)
            if not match:
                raise ValueError("Improper financial format. Use: 'spend: [amount] [category]'")
            
            action_type, amount_str, category = match.groups()
            
            return FinancialMetric(
                type=action_type,
                amount=float(amount_str),
                category=category.strip()
            )

        # Calendar Tracking (Format: "cal: 2026-07-25 dentist checkup")
        elif text.startswith("cal:"):
            # Regex captures YYYY-MM-DD followed by the event title
            match = re.match(r"^cal:\s*(\d{4}-\d{2}-\d{2})\s+(.+)$", text)
            if not match:
                raise ValueError("Improper calendar format. Use: 'cal: [YYYY-MM-DD] [event title]'")
            
            date_target, title = match.groups()
            
            try:
                datetime.strptime(date_target, "%Y-%m-%d")
            except ValueError:
                raise ValueError(f"Invalid calendar date value: {date_target}")

            return CalendarEvent(
                title=title.strip(),
                date_str=date_target
            )

        raise ValueError("Input text did not match any known automation routing rules.")