import pytest

from app.core.security import generate_totp_secret, hash_password, verify_password, verify_totp
from app.schemas import validate_slug
import pyotp


def test_password_hash_roundtrip():
    hashed = hash_password("password123")
    assert hashed != "password123"
    assert verify_password("password123", hashed)
    assert not verify_password("wrong", hashed)


def test_validate_slug_ok():
    assert validate_slug("maria") == "maria"
    assert validate_slug("Maria-Shop") == "maria-shop"
    assert validate_slug("ab") == "ab"


@pytest.mark.parametrize("slug", ["www", "admin", "API", "-bad", "bad-", "has space", "a" * 64])
def test_validate_slug_rejects(slug):
    with pytest.raises(ValueError):
        validate_slug(slug)


def test_totp_verify():
    secret = generate_totp_secret()
    code = pyotp.TOTP(secret).now()
    assert verify_totp(secret, code)
    assert not verify_totp(secret, "000000")
