import datetime
import json
import re
import sys
import time
from collections import defaultdict
from pathlib import Path

import requests
import zhconv
from bs4 import BeautifulSoup

session = requests.Session()

# ord('⋯') = 8943
# ord('…') = 8230
punctuation_pattern = re.compile(r"[，⋯…？?、!！「」～☆【】。.—{}'\"“”♪\s]")


def get_from_gamekee_netcut():
    note_id = '38b3472ea9d95306'
    resp = session.post(
        'https://netcut.txtbin.cn/api/note2/info/',
        data={'note_id': note_id}
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
            a = punctuation_pattern.sub('', line[5:])
            a = a.replace('AccountDataNickName', '')
            if not a:
                continue
            ret[person].append(a)
        else:
            person = line[:-1]
    print('Gamekee Netcut:')
    keys = list(ret.keys())
    for i in range(0, len(keys), 5):
        print(', '.join(keys[i:i+5]))
    return ret


def get_from_gamekee_wiki(skip_names: set[str]):
    ret = dict()
    game_header = {'game-alias': 'nikke'}
    entry_url = 'https://nikke.gamekee.com/v1/wiki/entry'
    entry_json = session.get(entry_url, headers=game_header).json()
    characters = None
    entry_id = None
    for d in entry_json['data']['entry_list']:
        if d.get('name', None) == '游戏图鉴':
            for l in d['child']:
                if l.get('name', None) == '角色图鉴':
                    characters = l['child']
                    entry_id = l['id']
                    break
            break
    if characters == None:
        print('获取gamekee角色图鉴失败')
        return ret
    entry_filter = session.get(
        'https://nikke.gamekee.com/v1/entryFilter/getEntryFilter',
        headers=game_header,
        params={'entry_id': entry_id}
    ).json()
    invalid_pair = set()
    for f in entry_filter['data']['entry_filter']:
        if f['name'] == '企业':
            for c in f['children']:
                if c['name'] == '反常':
                    invalid_pair.add((f['id'], c['id']))
        elif f['name'] == '稀有度':
            for c in f['children']:
                if c['name'] == 'R':
                    invalid_pair.add((f['id'], c['id']))

    def is_valid(nikke_entry):
        for attr in entry_filter['data']['entry_filter_attr'].get(str(nikke_entry['id']), []):
            if (attr['input_id'], attr['value']) in invalid_pair:
                return False
        return True

    def get_single(content_id):
        data_json = session.get(
            f'https://nikke.gamekee.com/v1/content/detail/{content_id}',
            headers=game_header
        ).json()
        soup = None
        for model in reversed(data_json['data']['model_list']):
            soup = BeautifulSoup(model['html'], 'html.parser')
            title = soup.select_one('tbody > tr:nth-child(1) > td > div')
            if title != None and next(title.stripped_strings) == '好感度对话':
                break
        else:
            print(f'无法获取到好感度对话: content_id={content_id}')
            return
        for line in soup.select('tbody > tr'):
            line_strs = list(line.stripped_strings)
            if len(line_strs) != 4:
                continue
            answer = ''
            if line_strs[0] == '100':
                answer = line_strs[1]
            elif line_strs[-1] == '50':
                answer = line_strs[-2]
            else:
                print(f'无法解析：{line_strs}')
                continue
            answer = punctuation_pattern.sub('', answer)
            answer = answer.replace('AccountDataNickName', '')
            if answer:
                yield answer

    for nikke in characters:
        # gamekee首页误写为“诺薇尔”
        if nikke['name'] == '诺薇尔' or nikke['name'] in skip_names:
            continue
        # 编辑中词条
        if nikke['content_id'] == 0:
            continue
        if not is_valid(nikke):
            ret[nikke['name']] = []
            continue
        ret[nikke['name']] = list(get_single(nikke['content_id']))
        time.sleep(0.5)
    print('Gamekee Wiki:')
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
            cleaned_a = punctuation_pattern.sub('', a)
            cleaned_a = excluded_pattern.sub('', cleaned_a)
            if len(cleaned_a) == 0:
                continue
            if n == 'Ｄ':
                n = 'D'
            ret[n].append(cleaned_a)
    return ret


if __name__ == '__main__':
    zh_cn_data = get_from_gamekee_netcut()
    zh_cn_data_extra = get_from_gamekee_wiki(set(zh_cn_data.keys()))
    zh_cn_data.update(zh_cn_data_extra)
    if len(sys.argv) > 1:
        zh_tw_data = get_from_google_sheet(sys.argv[1])
    else:
        print('No google api provided')
        zh_tw_data = dict()
    # 在gamekee数据基础上，补充繁中服的数据
    for k in zh_tw_data:
        if len(zh_cn_data.get(k, [])) > 0:
            continue
        print(f'补充：{k}')
        zh_cn_data[k] = zh_tw_data[k]
    for k in zh_cn_data:
        zh_cn_data[k] = sorted(zh_cn_data[k])
    for old_name, new_name in []:
        if old_name not in zh_cn_data:
            continue
        if new_name in zh_cn_data:
            continue
        zh_cn_data[new_name] = zh_cn_data[old_name]

    nikke_json_path = Path(__file__).parent.parent / 'nikke.json'
    with nikke_json_path.open('r', encoding='utf-8') as f:
        old_data = json.load(f)
    change_texts = []
    for k in zh_cn_data.keys():
        count = len(zh_cn_data[k]) - len(old_data.get(k, []))
        if count > 0:
            change_texts.append(f'新增【{k}】{count}条')
        elif count < 0:
            change_texts.append(f'删除【{k}】{-count}条')
    zh_cn_data['$meta'] = old_data.get('$meta', {'changelogs': []})
    changelogs: list = zh_cn_data['$meta']['changelogs']
    if change_texts:
        print(f'Changes: {"，".join(change_texts)}')
        today_date = datetime.datetime.now().strftime('%Y-%m-%d')
        changelogs.insert(0, f'{today_date}\t{"，".join(change_texts)}')
    while len(changelogs) > 5:
        changelogs.pop()
    with nikke_json_path.open('w', encoding='utf-8') as f:
        json.dump(
            dict(sorted(zh_cn_data.items())),
            f, ensure_ascii=False, indent=2
        )
