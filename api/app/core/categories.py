from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category

DEFAULT_CATEGORIES = [
    ("Gastronomía", "gastronomia"),
    ("Ropa y accesorios", "ropa"),
    ("Hogar", "hogar"),
    ("Tecnología", "tecnologia"),
    ("Automotores", "automotores"),
    ("Servicios", "servicios"),
    ("Profesionales", "profesionales"),
    ("Artesanías", "artesanias"),
    ("Belleza", "belleza"),
    ("Deportes", "deportes"),
    ("Mascotas", "mascotas"),
    ("Inmuebles", "inmuebles"),
    ("Otros", "otros"),
]


def seed_categories(db: Session) -> None:
    existing = {row for row in db.scalars(select(Category.slug))}
    for order, (name, slug) in enumerate(DEFAULT_CATEGORIES):
        if slug in existing:
            continue
        db.add(Category(name=name, slug=slug, sort_order=order, is_active=True))
    db.flush()
