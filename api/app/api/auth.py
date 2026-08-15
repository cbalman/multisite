from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import (
    get_2fa_pending_superadmin,
    get_2fa_setup_superadmin,
    get_current_user,
)
from app.core.security import (
    create_access_token,
    create_temp_token,
    generate_totp_secret,
    qr_data_url,
    totp_uri,
    verify_password,
    verify_totp,
)
from app.models import User, UserRole
from app.schemas import LoginRequest, LoginResponse, TotpCodeRequest, TotpSetupOut, UserOut

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario suspendido")

    # Super Admin always goes through 2FA (setup or verify)
    if user.role == UserRole.SUPERADMIN:
        if not user.totp_enabled:
            temp = create_temp_token(str(user.id), "setup_2fa", {"role": user.role.value})
            return LoginResponse(
                status="setup_2fa",
                temp_token=temp,
                role=user.role.value,
                name=user.name,
                message="Configurá Google Authenticator para continuar.",
            )
        temp = create_temp_token(str(user.id), "pre_2fa", {"role": user.role.value})
        return LoginResponse(
            status="need_2fa",
            temp_token=temp,
            role=user.role.value,
            name=user.name,
            message="Ingresá el código de Google Authenticator.",
        )

    token = create_access_token(str(user.id), {"role": user.role.value})
    return LoginResponse(
        status="ok",
        access_token=token,
        role=user.role.value,
        name=user.name,
    )


@router.get("/2fa/setup", response_model=TotpSetupOut)
def totp_setup(
    user: User = Depends(get_2fa_setup_superadmin),
    db: Session = Depends(get_db),
):
    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya está activado")

    secret = generate_totp_secret()
    user.totp_secret = secret
    db.commit()

    uri = totp_uri(secret, user.email)
    return TotpSetupOut(
        secret=secret,
        otpauth_url=uri,
        qr_data_url=qr_data_url(uri),
        message="Escaneá el QR con Google Authenticator y confirmá con el código de 6 dígitos.",
    )


@router.post("/2fa/confirm", response_model=LoginResponse)
def totp_confirm(
    payload: TotpCodeRequest,
    user: User = Depends(get_2fa_setup_superadmin),
    db: Session = Depends(get_db),
):
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero pedí el QR de configuración")
    if not verify_totp(user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Código inválido. Probá de nuevo.")

    user.totp_enabled = True
    db.commit()

    token = create_access_token(str(user.id), {"role": user.role.value})
    return LoginResponse(
        status="ok",
        access_token=token,
        role=user.role.value,
        name=user.name,
        message="Google Authenticator activado.",
    )


@router.post("/2fa/verify", response_model=LoginResponse)
def totp_verify(
    payload: TotpCodeRequest,
    user: User = Depends(get_2fa_pending_superadmin),
):
    if not user.totp_secret or not verify_totp(user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Código inválido. Probá de nuevo.")

    token = create_access_token(str(user.id), {"role": user.role.value})
    return LoginResponse(
        status="ok",
        access_token=token,
        role=user.role.value,
        name=user.name,
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
