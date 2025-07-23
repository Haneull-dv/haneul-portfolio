from fastapi import Request, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging

from app.domain.service.proxy_service import ProxyService

logger = logging.getLogger("proxy-controller")

class ProxyController:
    """프록시 요청을 처리하는 컨트롤러"""
    
    def __init__(self):
        self.proxy_service = ProxyService()
        logger.info("프록시 컨트롤러 초기화 완료")
    
    async def handle_get_request(
        self,
        service: str,
        path: str,
        request: Request
    ) -> JSONResponse:
        """GET 요청 처리"""
        try:
            logger.info(f"GET 요청 처리 시작: {service}/{path}")
            
            response = await self.proxy_service.forward_request(
                method="GET",
                service=service,
                path=path,
                headers=request.headers.raw,
                query_params=dict(request.query_params)
            )
            
            return self._create_response(response)
            
        except Exception as e:
            logger.error(f"GET 요청 처리 중 오류: {str(e)}")
            return self._create_error_response(str(e), 500)
    
    async def handle_post_request(
        self,
        service: str,
        path: str,
        request: Request,
        file: Optional[UploadFile] = None,
        sheet_names: Optional[List[str]] = None
    ) -> JSONResponse:
        """POST 요청 처리 (파일 업로드 지원)"""
        try:
            logger.info(f"POST 요청 처리 시작: {service}/{path}")
            
            # 요청 본문 읽기
            body = None
            if not file:
                try:
                    body = await request.body()
                    if not body:
                        logger.info("요청 본문이 비어 있습니다")
                except Exception as e:
                    logger.warning(f"요청 본문 읽기 실패: {str(e)}")
            
            # 파일 처리
            files_data = None
            if file:
                file_content = await file.read()
                files_data = {
                    'file': (file.filename, file_content, file.content_type)
                }
                await file.seek(0)  # 파일 포인터 리셋
            
            # 파라미터 처리
            params = None
            if sheet_names:
                params = {'sheet_name': sheet_names}
            
            response = await self.proxy_service.forward_request(
                method="POST",
                service=service,
                path=path,
                headers=request.headers.raw,
                body=body,
                files=files_data,
                params=params,
                query_params=dict(request.query_params)
            )
            
            return self._create_response(response)
            
        except Exception as e:
            logger.error(f"POST 요청 처리 중 오류: {str(e)}")
            return self._create_error_response(str(e), 500)
    
    async def handle_put_request(
        self,
        service: str,
        path: str,
        request: Request
    ) -> JSONResponse:
        """PUT 요청 처리"""
        try:
            logger.info(f"PUT 요청 처리 시작: {service}/{path}")
            
            body = await request.body()
            
            response = await self.proxy_service.forward_request(
                method="PUT",
                service=service,
                path=path,
                headers=request.headers.raw,
                body=body,
                query_params=dict(request.query_params)
            )
            
            return self._create_response(response)
            
        except Exception as e:
            logger.error(f"PUT 요청 처리 중 오류: {str(e)}")
            return self._create_error_response(str(e), 500)
    
    async def handle_delete_request(
        self,
        service: str,
        path: str,
        request: Request
    ) -> JSONResponse:
        """DELETE 요청 처리"""
        try:
            logger.info(f"DELETE 요청 처리 시작: {service}/{path}")
            
            body = await request.body()
            
            response = await self.proxy_service.forward_request(
                method="DELETE",
                service=service,
                path=path,
                headers=request.headers.raw,
                body=body,
                query_params=dict(request.query_params)
            )
            
            return self._create_response(response)
            
        except Exception as e:
            logger.error(f"DELETE 요청 처리 중 오류: {str(e)}")
            return self._create_error_response(str(e), 500)
    
    async def handle_patch_request(
        self,
        service: str,
        path: str,
        request: Request
    ) -> JSONResponse:
        """PATCH 요청 처리"""
        try:
            logger.info(f"PATCH 요청 처리 시작: {service}/{path}")
            
            body = await request.body()
            
            response = await self.proxy_service.forward_request(
                method="PATCH",
                service=service,
                path=path,
                headers=request.headers.raw,
                body=body,
                query_params=dict(request.query_params)
            )
            
            return self._create_response(response)
            
        except Exception as e:
            logger.error(f"PATCH 요청 처리 중 오류: {str(e)}")
            return self._create_error_response(str(e), 500)
    
    def _create_response(self, response) -> JSONResponse:
        """서비스 응답을 JSONResponse로 변환"""
        try:
            if response.status_code == 200:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code
                )
            else:
                return JSONResponse(
                    content={"detail": f"Service error: {response.text}"},
                    status_code=response.status_code
                )
        except Exception as e:
            logger.error(f"응답 생성 중 오류: {str(e)}")
            return JSONResponse(
                content={"detail": "응답 처리 중 오류가 발생했습니다"},
                status_code=500
            )
    
    def _create_error_response(self, error_message: str, status_code: int) -> JSONResponse:
        """에러 응답 생성"""
        return JSONResponse(
            content={"detail": error_message},
            status_code=status_code
        ) 