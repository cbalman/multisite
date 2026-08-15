from tests.conftest import auth_header, login_superadmin_2fa, login_user


def test_create_site_requires_superadmin(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    res = client.post(
        "/api/admin/sites",
        headers=auth_header(token),
        json={
            "name": "Juan",
            "email": "juan@test.com",
            "password": "password123",
            "site_name": "Juan Electricista",
            "slug": "juan",
        },
    )
    assert res.status_code == 403


def test_create_site_requires_2fa_enabled(client, superadmin):
    # Password login alone is not enough: only setup/pre_2fa temp tokens exist,
    # and admin routes require a full access token with totp_enabled.
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin-test-password"},
    ).json()
    assert login["status"] == "setup_2fa"
    # Using temp setup token on admin endpoint must fail (not access type)
    res = client.get("/api/admin/sites", headers=auth_header(login["temp_token"]))
    assert res.status_code == 401


def test_superadmin_creates_site(client, superadmin_with_2fa):
    _user, secret = superadmin_with_2fa
    token = login_superadmin_2fa(client, secret)

    res = client.post(
        "/api/admin/sites",
        headers=auth_header(token),
        json={
            "name": "Juan",
            "email": "juan@test.com",
            "password": "password123",
            "site_name": "Juan Electricista",
            "slug": "juan-electricista",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["site"]["slug"] == "juan-electricista"
    assert body["user"]["email"] == "juan@test.com"
    assert "panel" in body["message"]

    # New client can login
    client_login = client.post(
        "/api/auth/login",
        json={"email": "juan@test.com", "password": "password123"},
    )
    assert client_login.status_code == 200
    assert client_login.json()["status"] == "ok"


def test_slug_available_admin_only(client, superadmin_with_2fa, site_owner):
    _user, secret = superadmin_with_2fa
    # anonymous
    assert client.get("/api/admin/slug-available/nuevo").status_code == 401

    # owner
    owner_token = login_user(client, "maria@test.com", "password123")
    assert (
        client.get(
            "/api/admin/slug-available/nuevo",
            headers=auth_header(owner_token),
        ).status_code
        == 403
    )

    admin_token = login_superadmin_2fa(client, secret)
    taken = client.get(
        "/api/admin/slug-available/maria",
        headers=auth_header(admin_token),
    )
    assert taken.status_code == 200
    assert taken.json()["available"] is False

    free = client.get(
        "/api/admin/slug-available/tienda-nueva",
        headers=auth_header(admin_token),
    )
    assert free.json()["available"] is True


def test_list_sites(client, superadmin_with_2fa, site_owner):
    _user, secret = superadmin_with_2fa
    token = login_superadmin_2fa(client, secret)
    res = client.get("/api/admin/sites", headers=auth_header(token))
    assert res.status_code == 200
    slugs = {s["slug"] for s in res.json()}
    assert "maria" in slugs
