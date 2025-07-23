# app/api/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

logger = logging.getLogger("auth-router")
router = APIRouter()
security = HTTPBearer()

@router.get("/health")
async def auth_health():
    """인증 서비스 헬스체크"""
    return {"status": "healthy", "service": "auth"}

@router.post("/verify")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """토큰 검증 (향후 구현 예정)"""
    # TODO: 실제 토큰 검증 로직 구현
    logger.info("토큰 검증 요청")
    
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 제공되지 않았습니다"
        )
    
    # 임시 응답
    return {
        "valid": True,
        "message": "토큰 검증 기능은 향후 구현 예정입니다"
    }

@router.get("/services")
async def get_available_services():
    """사용 가능한 서비스 목록 반환"""
    from app.domain.service.proxy_service import ProxyService
    
    proxy_service = ProxyService()
    services = proxy_service.get_supported_services()
    
    return {
        "services": services,
        "total": len(services)
    }
