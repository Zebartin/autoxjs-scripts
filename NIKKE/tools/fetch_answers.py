import os
import sys
import re
import zhconv
import json
import requests
from collections import defaultdict
from bs4 import BeautifulSoup as bs

def getFromGamekee():
    r = requests.get('https://nikke.gamekee.com/v1/content/detail/575965', headers={
        'game-alias': 'nikke'
    })
    soup = bs(r.json()['data']['content'], 'html.parser')
    pattern = re.compile(r"[，…？、!！「」～☆【】。.—{}'\"“”♪\s]")
    ret = {}
    person = None
    answers = []
    for div in soup.contents[-1].find_all('div'):
        if div.find('div') != None:
            continue
        line = div.text.strip()
        if len(line) == 0:
            continue
        if line.startswith('50') or line.startswith('- question'):
            continue
        if line.startswith('100'):
            if line.find('AccountData') != -1:
                continue
            a = pattern.sub('', line[5:])
            if len(a) == 0:
                continue
            answers.append(a)
        else:
            if person is not None and len(answers) > 0:
                ret[person] = answers
                answers = []
            person = line[:-1]
    if len(answers) > 0:
        ret[person] = answers
    return ret

def getFromGoogleSheet(apiKey):
    ret = defaultdict(list)
    # 定义要访问的google表格的ID和范围
    spreadsheetId = '1K_oGZWL4uvuqYM9JL2l5Kb-L0IXIuyrDI347b6rurho'
    # 构造请求的URL，附加API 密钥作为查询参数
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values:batchGet'

    # 发送GET请求，获取第一列和第三列的内容
    response = requests.get(url, params={
        'key': apiKey,
        'ranges': ['角色排序查詢!A2:A','角色排序查詢!C2:C']
    })
    result = response.json()
    valueRanges = result.get('valueRanges', [])
    # 整理结果
    punctuation_pattern = re.compile(r"[，…？、!！「」～☆【】。.—{}'\"“”♪\s]")
    excluded_pattern = re.compile(r'[<＜]指挥官名[>＞]')
    if not valueRanges:
        print('No data found.')
    else:
        nikke_names = []
        answers = []
        for valueRange in valueRanges:
            content = valueRange.get('values', [])
            content = [zhconv.convert(row[0], 'zh-sg') for row in content]
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
            ret[n].append(cleaned_a)
    return ret

if __name__ == '__main__':
    zh_cn_data = getFromGamekee()
    zh_tw_data = getFromGoogleSheet(sys.argv[1])
    # 在gamekee数据基础上，补充繁中服的数据
    for k in zh_tw_data:
        if k in zh_cn_data:
            continue
        print(f'补充：{k}')
        zh_cn_data[k] = zh_tw_data[k]
    with open(os.path.join(os.path.dirname(__file__), '..', 'nikke.json'),'w') as f:
        json.dump(zh_cn_data, f, ensure_ascii=False, indent=2)
        