#!/usr/bin/env python3
"""index.html의 WORDS_2000 데이터를 전수 검증한다.

    python3 tests/verify-words.py

- 총 2,000개 / 초등 800 + 중등 1,200
- 중복 단어 0, 스펠링·한글 뜻 누락 0, 뜻이 겹치는 단어 0
- 스펠링 표기(영문·공백·아포스트로피·/)와 한글 뜻 표기 검사
- 하루 7단어 · 286일 배분(마지막 날 5개), 단계(초등/중등) 이어짐 확인
"""
import json
import re
import sys
import unicodedata

HTML = 'index.html'
PER_DAY = 7


def main():
    s = open(HTML, encoding='utf-8').read()
    a = s.index('/* WORDS_DATA_START */')
    b = s.index('/* WORDS_DATA_END */')
    rows = json.loads('[' + s[a:b].split('[', 1)[1].rsplit(']', 1)[0] + ']')
    problems = []

    def check(name, cond, detail=''):
        print(('  OK   ' if cond else '  FAIL ') + name + ((' — ' + str(detail)) if detail != '' else ''))
        if not cond:
            problems.append(name)

    print('== 단어 데이터 ==')
    check('총 2,000개', len(rows) == 2000, len(rows))
    ele = [r for r in rows if (len(r) > 2 and r[2] == 0)]
    mid = [r for r in rows if (len(r) > 2 and r[2] == 1)]
    check('초등 800 + 중등 1,200', len(ele) == 800 and len(mid) == 1200, f'{len(ele)} + {len(mid)}')
    words = [r[0] for r in rows]
    low = [w.lower() for w in words]
    check('중복 단어 0', len(set(low)) == len(low), len(low) - len(set(low)))
    check('스펠링 누락 0', all(w.strip() for w in words))
    check('한글 뜻 누락 0', all(len(r) > 1 and r[1].strip() for r in rows))
    bad_spell = [w for w in words if not re.fullmatch(r"[A-Za-z][A-Za-z' /]*", w)]
    check('스펠링 표기 이상 0', not bad_spell, bad_spell)
    bad_hangul = [r[0] for r in rows if not re.search(r'[가-힣]', r[1])]
    check('한글 뜻 표기 이상 0', not bad_hangul, bad_hangul)
    bad_char = [r[0] for r in rows if re.search(r"[^\w가-힣 ,.~·()\[\]/\-']", r[1])]
    check('뜻에 이상한 문자 0', not bad_char, bad_char)
    leak = [r[0] for r in rows if r[0].lower() in r[1].lower() and r[0].lower() not in ('a / an',)]
    check('뜻에 정답 스펠링 노출 0 (a/an 제외)', not leak, leak)
    mean = [r[1] for r in rows]
    check('뜻이 서로 겹침 0', len(set(mean)) == len(mean), len(mean) - len(set(mean)))

    print('== 하루 7단어 · 286일 ==')
    days = (len(rows) + PER_DAY - 1) // PER_DAY
    check('286일', days == 286, days)
    check('마지막 286일차는 5개', len(rows) - (days - 1) * PER_DAY == 5, len(rows) - (days - 1) * PER_DAY)
    seen = set()
    collide = []
    for n in range(days):
        seg = rows[n * PER_DAY:(n + 1) * PER_DAY]
        seen.update(r[0] for r in seg)
        if len({r[1] for r in seg}) != len(seg):
            collide.append(n + 1)
    check('286일이면 2,000개 모두 등장', len(seen) == len(rows), len(seen))
    check('같은 날 뜻이 겹치는 날 0', not collide, collide)
    boundary = [n + 1 for n in range(days)
                if any(r[2] == 1 for r in rows[n * PER_DAY:(n + 1) * PER_DAY])
                and any(r[2] == 0 for r in rows[n * PER_DAY:(n + 1) * PER_DAY])]
    check('초등 → 중등 경계는 115일차 한 번뿐', boundary == [115], boundary)

    print('== 사전 대조(선택) ==')
    try:
        dict_words = {l.strip().lower() for l in open('work/ms/words_alpha.txt', encoding='utf-8')}
        unknown = [w for w in words if w.lower() not in dict_words]
        allow = {"o'clock", "ma'am", 'a / an', 'living room'}
        check('사전에 없는 스펠링은 표기 허용 목록뿐', set(unknown) <= allow, unknown)
    except FileNotFoundError:
        print('  (work/ms/words_alpha.txt 가 없어 건너뜀)')

    print()
    print('결과:', '전부 통과' if not problems else f'{len(problems)}개 실패 — {problems}')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
