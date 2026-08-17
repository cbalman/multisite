import re

from fastapi import HTTPException

PHONE_RE = re.compile(r"^\d{8,15}$")


def normalize_phone(value: str | None, field: str = "teléfono") -> str | None:
    if value is None:
        return None
    digits = re.sub(r"\D", "", value.strip())
    if not digits:
        return None
    if not PHONE_RE.fullmatch(digits):
        raise HTTPException(status_code=400, detail=f"{field.capitalize()} inválido")
    return digits
