import json
import os
import re
import sys
from collections import defaultdict

import requests
import zhconv

session = requests.Session()

# ord('⋯') = 8943
# ord('…') = 8230
punctuation_pattern = re.compile(r"[，⋯…？?、!！「」～☆【】。.—{}'\"“”♪\s]")


def get_from_gamekee():
    note_id = '38b3472ea9d95306'
    resp = session.get(
        'https://netcut.cn/api/note2/info/',
        params={'note_id': note_id}
    )
    note_content = resp.json()['data']['note_content']
    note_content = note_content.replace('\\n', '\n').replace('\\t', '\t')
    ret = defaultdict(list)
    person = None
    for line in note_content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('50') or 'question' in line:
            continue
        if line.startswith('100'):
            if 'AccountData' in line:
                continue
            a = punctuation_pattern.sub('', line[5:])
            if not a:
                continue
            ret[person].append(a)
        else:
            person = line[:-1]
    keys = list(ret.keys())
    for i in range(0, len(keys), 5):
        print(', '.join(keys[i:i+5]))
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
    for k in zh_cn_data:
        zh_cn_data[k] = sorted(zh_cn_data[k])
    with open(os.path.join(os.path.dirname(__file__), '..', 'nikke.json'), 'w', encoding='utf-8') as f:
        json.dump(
            dict(sorted(zh_cn_data.items())),
            f, ensure_ascii=False, indent=2
        )
