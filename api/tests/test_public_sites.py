from tests.conftest import auth_header, login_user


def test_public_site_by_slug(client, site_owner):
    res = client.get("/api/public/sites/maria")
    assert res.status_code == 200
    body = res.json()
    assert body["slug"] == "maria"
    assert body["name"] == "Maria Reposteria"
    assert body["whatsapp"] == "5493411111111"


def test_public_site_by_host(client, site_owner):
    res = client.get(
        "/api/public/sites/by-host",
        headers={"Host": "maria.localhost"},
    )
    assert res.status_code == 200
    assert res.json()["slug"] == "maria"


def test_public_site_not_found(client, site_owner):
    res = client.get("/api/public/sites/no-existe")
    assert res.status_code == 404


def test_public_publications_empty(client, site_owner):
    res = client.get("/api/public/sites/maria/publications")
    assert res.status_code == 200
    assert res.json() == []


def test_me_site_owner(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.get("/api/me/site", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["slug"] == "maria"
