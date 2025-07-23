import httpx
import logging
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum

from app.domain.model.service_type import ServiceType, SERVICE_URLS

logger = logging.getLogger("proxy-service")

class ProxyService:
    """실제 서비스 통신을 담당하는 프록시 서비스"""
    
    # 파일 업로드가 필요한 서비스들
    FILE_REQUIRED_SERVICES = {ServiceType.DART_CONVERTER}
    
    def __init__(self):
        self.timeout = 30
        logger.info("프록시 서비스 초기화 완료")
    
    async def forward_request(
        self,
        method: str,
        service: str,
        path: str,
        headers: Optional[List[Tuple[bytes, bytes]]] = None,
        body: Optional[bytes] = None,
        files: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, Any]] = None
    ) -> httpx.Response:
        """대상 서비스로 요청을 전달"""
        
        try:
            # 1. 서비스 타입 검증 및 URL 가져오기
            service_type = self._get_service_type(service)
            base_url = self._get_service_url(service_type)
            
            # 2. 요청 URL 구성
            url = f"{base_url}/{path}"
            if query_params:
                # 기존 쿼리 파라미터가 있다면 추가
                if params:
                    params.update(query_params)
                else:
                    params = query_params
            
            # 3. 헤더 처리
            clean_headers = self._process_headers(headers)
            
            # 4. 파일 업로드 검증
            self._validate_file_upload(service_type, path, files)
            
            logger.info(f"요청 전달: {method} {url}")
            
            # 5. HTTP 요청 실행
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=clean_headers,
                    content=body,
                    files=files,
                    params=params
                )
                
                logger.info(f"응답 수신: {response.status_code}")
                return response
                
        except ValueError as e:
            # 서비스 타입 오류
            logger.error(f"서비스 타입 오류: {str(e)}")
            return self._create_error_response(400, str(e))
            
        except httpx.TimeoutException:
            # 타임아웃 오류
            logger.error(f"서비스 요청 타임아웃: {service}/{path}")
            return self._create_error_response(504, f"서비스 {service} 요청 타임아웃")
            
        except httpx.ConnectError:
            # 연결 오류
            logger.error(f"서비스 연결 실패: {service}/{path}")
            return self._create_error_response(503, f"서비스 {service}에 연결할 수 없습니다")
            
        except Exception as e:
            # 기타 오류
            logger.error(f"요청 전달 중 오류: {str(e)}")
            return self._create_error_response(500, f"요청 처리 중 오류: {str(e)}")
    
    def _get_service_type(self, service: str) -> ServiceType:
        """문자열 서비스명을 ServiceType으로 변환"""
        service_upper = service.upper()
        
        # ServiceType enum에서 매칭되는 항목 찾기
        for service_type in ServiceType:
            if service_type.value.upper() == service_upper:
                return service_type
        
        # 매칭되지 않으면 오류
        available_services = [s.value for s in ServiceType]
        raise ValueError(f"지원하지 않는 서비스: {service}. 사용 가능한 서비스: {available_services}")
    
    def _get_service_url(self, service_type: ServiceType) -> str:
        """서비스 타입에 해당하는 URL 가져오기"""
        base_url = SERVICE_URLS.get(service_type)
        
        if not base_url:
            raise ValueError(f"서비스 {service_type.value}에 대한 URL이 구성되지 않았습니다.")
        
        return base_url
    
    def _process_headers(self, headers: Optional[List[Tuple[bytes, bytes]]]) -> Dict[str, str]:
        """요청 헤더를 처리하여 필요한 헤더만 추출"""
        clean_headers = {}
        
        if headers:
            for name_bytes, value_bytes in headers:
                name = name_bytes.decode().lower()
                value = value_bytes.decode()
                
                # 프록시에서 제거해야 할 헤더들
                if name not in ['host', 'content-length', 'connection']:
                    clean_headers[name] = value
        
        return clean_headers
    
    def _validate_file_upload(self, service_type: ServiceType, path: str, files: Optional[Dict[str, Any]]):
        """파일 업로드 요청 검증"""
        
        # 파일이 필요한 서비스에서 upload 경로인데 파일이 없는 경우
        if (service_type in self.FILE_REQUIRED_SERVICES and 
            "upload" in path and 
            not files):
            raise ValueError(f"서비스 {service_type.value}의 {path} 엔드포인트에는 파일 업로드가 필요합니다.")
    
    def _create_error_response(self, status_code: int, error_message: str) -> httpx.Response:
        """에러 응답 생성"""
        error_content = f'{{"detail": "{error_message}"}}'.encode()
        
        return httpx.Response(
            status_code=status_code,
            content=error_content,
            headers={"content-type": "application/json"}
        )
    
    def get_supported_services(self) -> List[str]:
        """지원하는 서비스 목록 반환"""
        return [service.value for service in ServiceType]
    
    def is_service_available(self, service: str) -> bool:
        """서비스 사용 가능 여부 확인"""
        try:
            service_type = self._get_service_type(service)
            base_url = SERVICE_URLS.get(service_type)
            return base_url is not None
        except ValueError:
            return False 