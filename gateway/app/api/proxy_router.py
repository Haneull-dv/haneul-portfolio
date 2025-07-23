from fastapi import APIRouter, Request, UploadFile, File, Query, Depends
from typing import List, Optional
import logging

from app.domain.controller.proxy_controller import ProxyController

logger = logging.getLogger("proxy-router")
router = APIRouter()

# 서비스 정보 엔드포인트
@router.get("/services")
async def get_available_services():
    """사용 가능한 서비스 목록과 상태 조회"""
    from app.domain.service.proxy_service import ProxyService
    
    proxy_service = ProxyService()
    services = proxy_service.get_supported_services()
    
    # 각 서비스의 사용 가능 여부 확인
    service_status = {}
    for service in services:
        service_status[service] = {
            "available": proxy_service.is_service_available(service),
            "name": service
        }
    
    return {
        "services": service_status,
        "total": len(services),
        "available_count": sum(1 for s in service_status.values() if s["available"])
    }

# Dependency Injection
def get_proxy_controller() -> ProxyController:
    """프록시 컨트롤러 의존성 주입"""
    return ProxyController()

# GET 요청 프록시
@router.get("/{service}/{path:path}")
async def proxy_get(
    service: str,
    path: str,
    request: Request,
    controller: ProxyController = Depends(get_proxy_controller)
):
    """GET 요청을 대상 서비스로 프록시"""
    logger.info(f"GET 프록시 요청: 서비스={service}, 경로={path}")
    
    return await controller.handle_get_request(
        service=service,
        path=path,
        request=request
    )

# POST 요청 프록시 (파일 업로드 및 일반 요청 지원)
@router.post("/{service}/{path:path}")
async def proxy_post(
    service: str,
    path: str,
    request: Request,
    controller: ProxyController = Depends(get_proxy_controller),
    file: Optional[UploadFile] = File(None),
    sheet_names: Optional[List[str]] = Query(None, alias="sheet_name")
):
    """POST 요청을 대상 서비스로 프록시 (파일 업로드 지원)"""
    logger.info(f"POST 프록시 요청: 서비스={service}, 경로={path}")
    
    if file:
        logger.info(f"파일 업로드: {file.filename}, 시트명: {sheet_names}")
    
    return await controller.handle_post_request(
        service=service,
        path=path,
        request=request,
        file=file,
        sheet_names=sheet_names
    )

# PUT 요청 프록시
@router.put("/{service}/{path:path}")
async def proxy_put(
    service: str,
    path: str,
    request: Request,
    controller: ProxyController = Depends(get_proxy_controller)
):
    """PUT 요청을 대상 서비스로 프록시"""
    logger.info(f"PUT 프록시 요청: 서비스={service}, 경로={path}")
    
    return await controller.handle_put_request(
        service=service,
        path=path,
        request=request
    )

# DELETE 요청 프록시
@router.delete("/{service}/{path:path}")
async def proxy_delete(
    service: str,
    path: str,
    request: Request,
    controller: ProxyController = Depends(get_proxy_controller)
):
    """DELETE 요청을 대상 서비스로 프록시"""
    logger.info(f"DELETE 프록시 요청: 서비스={service}, 경로={path}")
    
    return await controller.handle_delete_request(
        service=service,
        path=path,
        request=request
    )

# PATCH 요청 프록시
@router.patch("/{service}/{path:path}")
async def proxy_patch(
    service: str,
    path: str,
    request: Request,
    controller: ProxyController = Depends(get_proxy_controller)
):
    """PATCH 요청을 대상 서비스로 프록시"""
    logger.info(f"PATCH 프록시 요청: 서비스={service}, 경로={path}")
    
    return await controller.handle_patch_request(
        service=service,
        path=path,
        request=request
    )
