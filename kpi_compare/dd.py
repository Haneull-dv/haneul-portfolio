import xml.etree.ElementTree as ET

# 1. 기업명 리스트 (한글)
target_names = [
    '네이버', '카카오', '크래프톤', '엔씨소프트', '넷마블', '펄어비스', '카카오게임즈',
    '넥슨게임즈', '위메이드', '네오위즈', 'NHN', '조이시티', '미투젠', '위메이드플레이',
    '미투온', '모비릭스', '액토즈소프트', '밸로프', '썸에이지', '시프트업', '컴투스홀딩스',
    '스마일게이트엔터테인먼트'
]

# 2. corpCode.xml 파일 경로 (압축 해제해서 사용)
xml_path = "corpCode.xml"  # 압축파일 풀어서 같은 폴더에 둘 것

tree = ET.parse(xml_path)
root = tree.getroot()

found = []
for item in root.findall('list'):
    corp_name = item.findtext('corp_name')
    corp_code = item.findtext('corp_code')
    if corp_name in target_names:
        found.append({'corp_name': corp_name, 'corp_code': corp_code})

print("SUPPORTED_COMPANIES = [")
for comp in found:
    print(f"    {{'corp_name': '{comp['corp_name']}', 'corp_code': '{comp['corp_code']}'}}," )
print("]")
