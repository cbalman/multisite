from tests.conftest import auth_header, login_user


def test_owner_cannot_see_other_admin_routes(client, site_owner, other_owner):
    maria_token = login_user(client, "maria@test.com", "password123")
    ricardo_token = login_user(client, "ricardo@test.com", "password123")

    maria_site = client.get("/api/me/site", headers=auth_header(maria_token)).json()
    ricardo_site = client.get("/api/me/site", headers=auth_header(ricardo_token)).json()

    assert maria_site["slug"] == "maria"
    assert ricardo_site["slug"] == "ricardo"
    assert maria_site["id"] != ricardo_site["id"]


def test_suspended_site_not_public(client, db, site_owner):
    _user, site = site_owner
    from app.models import SiteStatus

    site.status = SiteStatus.SUSPENDED
    db.flush()

    res = client.get("/api/public/sites/maria")
    assert res.status_code == 404


def test_owner_me_still_works_when_public_hidden(client, db, site_owner):
    """Owner can still load /me/site even if we later suspend public view."""
    token = login_user(client, "maria@test.com", "password123")
    res = client.get("/api/me/site", headers=auth_header(token))
    assert res.status_code == 200
