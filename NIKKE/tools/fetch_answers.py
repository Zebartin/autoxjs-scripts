import os
import sys
import re
import zhconv
import json
import requests
from collections import defaultdict
from bs4 import BeautifulSoup as bs

session = requests.Session()

# ord('⋯') = 8943
# ord('…') = 8230
punctuation_pattern = re.compile(r"[，⋯…？?、!！「」～☆【】。.—{}'\"“”♪\s]")

def get_from_gamekee():
    detail_url = 'https://nikke.gamekee.com/v1/content/detail/{detail_id}'
    detail_ids = ['575965']
    page = 0
    ret = {}
    while page < len(detail_ids):
        print(f'https://nikke.gamekee.com/{detail_ids[page]}.html')
        r = session.get(detail_url.format(detail_id=detail_ids[page]), headers={
            'game-alias': 'nikke'
        })
        soup = bs(r.json()['data']['content'], 'html.parser')
        result = {}
        person = None
        answers = []
        # 需要获取其他分页
        if len(detail_ids) == 1:
            detail_ids.extend(re.findall('nikke.gamekee.com/(\d+).html', str(soup)))
        for content in soup.contents:
            for div in content.find_all('div'):
                if div.find('div') != None:
                    continue
                line = div.text.strip()
                if len(line) == 0:
                    continue
                if line.startswith('50') or 'question' in line:
                    continue
                if line.startswith('100'):
                    if line.find('AccountData') != -1:
                        continue
                    a = punctuation_pattern.sub('', line[5:])
                    if len(a) == 0:
                        continue
                    answers.append(a)
                else:
                    if person is not None and '角色名' not in person and len(answers) > 0:
                        result[person] = answers
                    person = line[:-1]
                    answers = []
        if len(answers) > 0:
            result[person] = answers
        print(', '.join(list(result.keys())))
        ret.update(result)
        page += 1
    return ret


def get_from_google_sheet(apiKey):
    ret = defaultdict(list)
    # 定义要访问的google表格的ID和范围
    spreadsheetId = '1K_oGZWL4uvuqYM9JL2l5Kb-L0IXIuyrDI347b6rurho'
    # 构造请求的URL，附加API 密钥作为查询参数
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchGet'

    # 发送GET请求，获取第一列和第三列的内容
    response = session.get(url, params={
        'key': apiKey,
        'ranges': ['角色排序查詢!A2:A', '角色排序查詢!C2:C']
    })
    result = response.json()
    valueRanges = result.get('valueRanges', [])
    # 整理结果
    excluded_pattern = re.compile(r'[<＜]指挥官名[>＞]')
    if not valueRanges:
        print('No data found.')
    else:
        nikke_names = []
        answers = []
        for valueRange in valueRanges:
            content = valueRange.get('values', [])
            content = [zhconv.convert(row[0] if row else '', 'zh-sg')
                       for row in content]
            if 'A2' in valueRange.get('range'):
                nikke_names = content
            else:
                answers = content
        for n, a in zip(nikke_names, answers):
            if excluded_pattern.search(a) is not None:
                continue
            cleaned_a = punctuation_pattern.sub('', a)
            if len(cleaned_a) == 0:
                continue
            if n == 'Ｄ':
                n = 'D'
            ret[n].append(cleaned_a)
    return ret


if __name__ == '__main__':
    zh_cn_data = get_from_gamekee()
    zh_tw_data = get_from_google_sheet(sys.argv[1])
    # 在gamekee数据基础上，补充繁中服的数据
    for k in zh_tw_data:
        if k in zh_cn_data:
            continue
        print(f'补充：{k}')
        zh_cn_data[k] = zh_tw_data[k]
    with open(os.path.join(os.path.dirname(__file__), '..', 'nikke.json'), 'w') as f:
        json.dump(zh_cn_data, f, ensure_ascii=False, indent=2)
