from io import BytesIO

from sqlalchemy import select

from app.models import Category
from tests.conftest import auth_header, login_user

TINY_JPEG = b"\xff\xd8\xff\xd9hello-jpeg"
TINY_MP4 = b"fake-mp4-bytes"


def test_update_profile_and_contact(client, site_owner, categories, db):
    token = login_user(client, "maria@test.com", "password123")
    gastronomia = db.scalar(select(Category).where(Category.slug == "gastronomia"))

    res = client.patch(
        "/api/me/site",
        headers=auth_header(token),
        json={
            "name": "María Repostería",
            "description": "Tortas y cosas ricas hechas en casa",
            "city": "Rosario",
            "category_id": gastronomia.id,
            "whatsapp": "+54 341 555 1234",
            "phone1": "3414445566",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["name"] == "María Repostería"
    assert body["city"] == "Rosario"
    assert body["category_name"] == "Gastronomía"
    assert body["whatsapp"] == "543415551234"
    assert body["phone1"] == "3414445566"
    assert "wa.me" in body["whatsapp_url"]
    assert "consulta" in body["whatsapp_url"]


def test_invalid_whatsapp_rejected(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.patch(
        "/api/me/site",
        headers=auth_header(token),
        json={"whatsapp": "123"},
    )
    assert res.status_code == 400


def test_socials_only_configured_ones(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.put(
        "/api/me/site/socials",
        headers=auth_header(token),
        json={
            "socials": [
                {"platform": "instagram", "url": "https://instagram.com/maria"},
                {"platform": "facebook", "url": ""},
                {"platform": "tiktok", "url": "https://tiktok.com/@maria"},
            ]
        },
    )
    assert res.status_code == 200, res.text
    platforms = {s["platform"] for s in res.json()["socials"]}
    assert platforms == {"instagram", "tiktok"}


def test_unknown_social_rejected(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.put(
        "/api/me/site/socials",
        headers=auth_header(token),
        json={"socials": [{"platform": "myspace", "url": "https://x.com/a"}]},
    )
    assert res.status_code == 400


def test_create_list_hide_delete_publication(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    created = client.post(
        "/api/me/publications",
        headers=auth_header(token),
        json={
            "title": "Torta de chocolate",
            "description": "Porción o entera",
            "price": 25000,
            "price_visible": True,
            "price_on_request": False,
            "status": "published",
            "images": ["/media/site_1/torta.jpg"],
        },
    )
    assert created.status_code == 201, created.text
    pub = created.json()
    assert pub["title"] == "Torta de chocolate"
    assert pub["price"] == 25000
    assert pub["images"] == ["/media/site_1/torta.jpg"]
    assert pub["cover_image_url"] == "/media/site_1/torta.jpg"
    assert "Torta" in pub["whatsapp_url"]
    assert "consultar" in pub["whatsapp_url"]

    listed = client.get("/api/me/publications", headers=auth_header(token))
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    hidden = client.patch(
        f"/api/me/publications/{pub['id']}",
        headers=auth_header(token),
        json={"status": "hidden"},
    )
    assert hidden.status_code == 200
    assert hidden.json()["status"] == "hidden"

    public = client.get("/api/public/sites/maria/publications")
    assert public.status_code == 200
    assert public.json() == []

    shown = client.patch(
        f"/api/me/publications/{pub['id']}",
        headers=auth_header(token),
        json={"status": "published"},
    )
    assert shown.status_code == 200
    public = client.get("/api/public/sites/maria/publications")
    assert len(public.json()) == 1

    deleted = client.delete(f"/api/me/publications/{pub['id']}", headers=auth_header(token))
    assert deleted.status_code == 200
    listed = client.get("/api/me/publications", headers=auth_header(token))
    assert listed.json() == []
    public = client.get("/api/public/sites/maria/publications")
    assert public.json() == []


def test_draft_not_public(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    created = client.post(
        "/api/me/publications",
        headers=auth_header(token),
        json={"title": "Borrador", "status": "draft"},
    )
    assert created.status_code == 201
    public = client.get("/api/public/sites/maria/publications")
    assert public.json() == []


def test_tenant_cannot_edit_other_publication(client, site_owner, other_owner):
    maria = login_user(client, "maria@test.com", "password123")
    ricardo = login_user(client, "ricardo@test.com", "password123")
    created = client.post(
        "/api/me/publications",
        headers=auth_header(maria),
        json={"title": "Lemon Pie", "status": "published"},
    ).json()

    res = client.patch(
        f"/api/me/publications/{created['id']}",
        headers=auth_header(ricardo),
        json={"title": "Hackeado"},
    )
    assert res.status_code == 404

    res = client.delete(
        f"/api/me/publications/{created['id']}",
        headers=auth_header(ricardo),
    )
    assert res.status_code == 404


def test_too_many_images(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.post(
        "/api/me/publications",
        headers=auth_header(token),
        json={"title": "Muchas fotos", "images": [f"/media/{i}.jpg" for i in range(9)]},
    )
    assert res.status_code == 400


def test_one_video_field(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    created = client.post(
        "/api/me/publications",
        headers=auth_header(token),
        json={"title": "Con video", "video_url": "/media/a.mp4"},
    )
    assert created.status_code == 201
    updated = client.patch(
        f"/api/me/publications/{created.json()['id']}",
        headers=auth_header(token),
        json={"video_url": "/media/b.mp4"},
    )
    assert updated.status_code == 200
    assert updated.json()["video_url"] == "/media/b.mp4"


def test_upload_image_and_video(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    image = client.post(
        "/api/me/upload?kind=image",
        headers=auth_header(token),
        files={"file": ("foto.jpg", BytesIO(TINY_JPEG), "image/jpeg")},
    )
    assert image.status_code == 200, image.text
    assert image.json()["url"].startswith("/media/site_")
    assert image.json()["kind"] == "image"

    video = client.post(
        "/api/me/upload?kind=video",
        headers=auth_header(token),
        files={"file": ("clip.mp4", BytesIO(TINY_MP4), "video/mp4")},
    )
    assert video.status_code == 200, video.text
    assert video.json()["kind"] == "video"


def test_upload_rejects_bad_type(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.post(
        "/api/me/upload?kind=image",
        headers=auth_header(token),
        files={"file": ("notes.txt", BytesIO(b"hello"), "text/plain")},
    )
    assert res.status_code == 400


def test_categories_list(client, categories):
    res = client.get("/api/categories")
    assert res.status_code == 200
    slugs = {c["slug"] for c in res.json()}
    assert "gastronomia" in slugs
    assert "otros" in slugs


def test_new_site_needs_onboarding(client, fresh_owner):
    token = login_user(client, "ana@test.com", "password123")
    res = client.get("/api/me/site", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["onboarding_completed"] is False


def test_complete_onboarding(client, fresh_owner):
    token = login_user(client, "ana@test.com", "password123")
    res = client.post("/api/me/site/onboarding/complete", headers=auth_header(token))
    assert res.status_code == 200, res.text
    assert res.json()["onboarding_completed"] is True

    again = client.get("/api/me/site", headers=auth_header(token))
    assert again.json()["onboarding_completed"] is True


def test_existing_client_onboarding_already_done(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.get("/api/me/site", headers=auth_header(token))
    assert res.json()["onboarding_completed"] is True


def test_cannot_set_onboarding_via_patch(client, fresh_owner):
    token = login_user(client, "ana@test.com", "password123")
    client.patch("/api/me/site", headers=auth_header(token), json={"onboarding_completed": True})
    res = client.get("/api/me/site", headers=auth_header(token))
    assert res.json()["onboarding_completed"] is False
