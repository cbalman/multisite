from urllib.parse import quote


def whatsapp_url(phone: str | None, text: str) -> str | None:
    if not phone:
        return None
    digits = "".join(ch for ch in phone if ch.isdigit())
    if not digits:
        return None
    return f"https://wa.me/{digits}?text={quote(text)}"


def profile_message(site_name: str) -> str:
    return f"Hola {site_name}, quiero hacer una consulta."


def publication_message(site_name: str, title: str) -> str:
    return f'Hola {site_name}, vi tu publicación "{title}" y quisiera consultar.'
