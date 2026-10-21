import re
from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class FinancialMetric(BaseModel):
    type: Literal["spend", "income"]
    amount: float = Field(..., gt=0.0)
    category: str = Field(..., min_length=1)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MultiFinancialMetric(BaseModel):
    items: List[FinancialMetric]

class CalendarEvent(BaseModel):
    title: str = Field(..., min_length=1)
    date_str: str 
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class QueryCommand(BaseModel):
    target: Literal["spend", "calendar", "all"]

class AssistantParser:
    @staticmethod
    def parse_text(raw_text: str):
        text = raw_text.strip().lower()
        
        # State queries
        if text in ["show spend", "show finances", "spend log"]:
            return QueryCommand(target="spend")
        if text in ["show cal", "show calendar", "reminders"]:
            return QueryCommand(target="calendar")
        if text in ["show all", "status"]:
            return QueryCommand(target="all")

        # Symbol & formatting cleanup
        text = re.sub(r'[$€£]|kr', '', text)
        text = re.sub(r'(\d+),(\d+)', r'\1.\2', text)
        text = re.sub(r"\s+", " ", text)

        # Multi-item lists (default to spend type)
        if "," in text:
            text = re.sub(r"^(spend|income|groceries|shopping):\s*", "", text)
            raw_items = text.split(",")
            parsed_items = []
            
            for part in raw_items:
                part = part.strip()
                match = re.match(r"^(.+?)\s+(\d+(?:\.\d+)?)$", part) or re.match(r"^(\d+(?:\.\d+)?)\s+(.+)$", part)
                if match:
                    g1, g2 = match.groups()
                    try:
                        amount = float(g1)
                        category = g2.strip()
                    except ValueError:
                        amount = float(g2)
                        category = g1.strip()
                    
                    parsed_items.append(FinancialMetric(type="spend", amount=amount, category=category))
            
            if parsed_items:
                return MultiFinancialMetric(items=parsed_items)

        # Explicit Income tracking: "inc: 1500 salary" or "income: 1500 salary"
        if text.startswith(("inc:", "income:")):
            match = re.match(r"^(inc|income):\s*(\d+(?:\.\d+)?)\s+(.+)$", text)
            if not match:
                raise ValueError("Format: 'inc [amount] [source]'")
            _, amount_str, source = match.groups()
            return FinancialMetric(
                type="income",
                amount=float(amount_str),
                category=source.strip()
            )

        # Single item spend parsing: amount-first ("12 water")
        num_first = re.match(r"^(\d+(?:\.\d+)?)\s+(.+)$", text)
        if num_first:
            return FinancialMetric(
                type="spend",
                amount=float(num_first.group(1)),
                category=num_first.group(2).strip()
            )
        
        # Single item spend parsing: category-first ("water 12")
        cat_first = re.match(r"^(.+?)\s+(\d+(?:\.\d+)?)$", text)
        if cat_first:
            return FinancialMetric(
                type="spend",
                amount=float(cat_first.group(2)),
                category=cat_first.group(1).strip()
            )

        # Calendar event parsing: "cal: 2026-11-01 meeting"
        if text.startswith("cal:"):
            match = re.match(r"^cal:\s*(\d{4}-\d{2}-\d{2})\s+(.+)$", text)
            if not match:
                raise ValueError("Format: 'cal [YYYY-MM-DD] [title]'")
            date_target, title = match.groups()
            return CalendarEvent(title=title.strip(), date_str=date_target)

        raise ValueError("Could not parse input.")