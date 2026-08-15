import pyotp

from tests.conftest import auth_header, login_user


def test_login_owner_ok(client, site_owner):
    token = login_user(client, "maria@test.com", "password123")
    me = client.get("/api/auth/me", headers=auth_header(token))
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "maria@test.com"
    assert body["role"] == "user"


def test_login_wrong_password(client, site_owner):
    res = client.post(
        "/api/auth/login",
        json={"email": "maria@test.com", "password": "wrong-password"},
    )
    assert res.status_code == 401


def test_public_register_removed(client):
    res = client.post("/api/auth/register", json={})
    assert res.status_code == 404


def test_superadmin_first_login_requires_setup_2fa(client, superadmin):
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin-test-password"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "setup_2fa"
    assert data["temp_token"]


def test_superadmin_setup_and_verify_2fa(client, superadmin):
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin-test-password"},
    ).json()
    temp = login["temp_token"]

    setup = client.get("/api/auth/2fa/setup", headers=auth_header(temp))
    assert setup.status_code == 200
    secret = setup.json()["secret"]
    assert setup.json()["qr_data_url"].startswith("data:image/png;base64,")

    code = pyotp.TOTP(secret).now()
    confirm = client.post(
        "/api/auth/2fa/confirm",
        json={"code": code},
        headers=auth_header(temp),
    )
    assert confirm.status_code == 200
    assert confirm.json()["status"] == "ok"
    access = confirm.json()["access_token"]

    me = client.get("/api/auth/me", headers=auth_header(access))
    assert me.status_code == 200
    assert me.json()["role"] == "superadmin"
    assert me.json()["totp_enabled"] is True


def test_superadmin_login_need_2fa(client, superadmin_with_2fa):
    _user, secret = superadmin_with_2fa
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin-test-password"},
    ).json()
    assert login["status"] == "need_2fa"

    bad = client.post(
        "/api/auth/2fa/verify",
        json={"code": "000000"},
        headers=auth_header(login["temp_token"]),
    )
    assert bad.status_code == 400

    code = pyotp.TOTP(secret).now()
    ok = client.post(
        "/api/auth/2fa/verify",
        json={"code": code},
        headers=auth_header(login["temp_token"]),
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "ok"


def test_access_token_required(client, site_owner):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
