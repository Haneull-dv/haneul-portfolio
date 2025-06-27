#!/usr/bin/env python3

import httpx
import asyncio

async def test_summarizer():
    """Test the summarizer with a simple request"""
    url = "http://localhost:8088/summarize"
    payload = {
        "news": {
            "title": "테스트 제목",
            "description": "테스트 내용입니다."
        }
    }
    
    print("🔍 Testing summarizer...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            print(f"📥 Status: {response.status_code}")
            result = response.json()
            print(f"📄 Response: {result}")
            
            if result.get("status") == "error":
                print(f"❌ Error found: {result.get('error')}")
                return False
            else:
                print("✅ Summarizer working!")
                return True
                
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_summarizer()) 