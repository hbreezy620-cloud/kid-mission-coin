(() => {
  /* 영단어 개편 검증: 브라우저 콘솔에 붙여 넣으면 결과를 돌려줍니다.
     사용법) console.log(__kmcWordsTest())   또는   await copy(__kmcWordsTest())
     화면·저장 기록을 초기화하므로 아이가 쓰는 기기에서는 돌리지 마세요. */
  const A = window.__kmc;
  if (!A || !A.words) return { error: 'no words hook' };
  const W = A.words, S0 = () => A.state();
  const R = [];
  const ok = (name, cond, detail) => R.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
  const addD = (s, n) => {
    const [y, m, d] = s.split('-').map(Number);
    const t = new Date(y, m - 1, d + n, 12);
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  };
  const D = '2026-11-18';

  /* ===== 1. 단어 데이터 2,000 (초등 800 + 중등 1,200) ===== */
  const L = W.all();
  ok('단어 2,000개', L.length === 2000, L.length);
  ok('초등 800 + 중등 1,200', L.filter(w => w.stage === 0).length === 800 && L.filter(w => w.stage === 1).length === 1200,
     L.filter(w => w.stage === 0).length + ' + ' + L.filter(w => w.stage === 1).length);
  ok('중복 단어 없음', new Set(L.map(w => w.word.toLowerCase())).size === 2000, new Set(L.map(w => w.word.toLowerCase())).size);
  ok('스펠링·뜻 누락 없음', L.every(w => w.word && w.meaning));
  ok('스펠링이 영문', L.every(w => /^[A-Za-z][A-Za-z' /]*$/.test(w.word)));
  ok('뜻에 한글 포함', L.every(w => /[가-힣]/.test(w.meaning)));
  ok('뜻이 서로 겹치지 않음', new Set(L.map(w => w.meaning)).size === 2000, new Set(L.map(w => w.meaning)).size);
  ok('뜻에 정답 스펠링 노출 없음', L.every(w => w.meaning.indexOf(w.word) < 0));

  /* ===== 2. 하루 7단어 · 286일 ===== */
  A.reset(); A.setDate(D);
  ok('286일', W.days === 286, W.days);
  ok('하루 7개', W.perDay === 7, W.perDay);
  ok('시작일 = 1일차', W.lessonOf(D) === 1, W.lessonOf(D));
  ok('다음 날 = 2일차', W.lessonOf(addD(D, 1)) === 2, W.lessonOf(addD(D, 1)));
  ok('285일차', W.lessonOf(addD(D, 284)) === 285, W.lessonOf(addD(D, 284)));
  ok('286일차', W.lessonOf(addD(D, 285)) === 286, W.lessonOf(addD(D, 285)));
  ok('287일째는 다시 1일차', W.lessonOf(addD(D, 286)) === 1, W.lessonOf(addD(D, 286)));
  ok('1일차 7단어', W.ofDate(D).length === 7, W.ofDate(D).length);
  ok('마지막 286일차는 5단어', W.ofDate(addD(D, 285)).length === 5, W.ofDate(addD(D, 285)).length);
  const covered = new Set();
  for (let n = 0; n < 286; n++) W.ofDate(addD(D, n)).forEach(w => covered.add(w.word));
  ok('286일이면 2,000단어 모두 만남', covered.size === 2000, covered.size);
  ok('1일차는 초등 필수', W.stage(1) === 0);
  ok('115일차는 초등→중등', W.stage(115) === 2);
  ok('116일차부터 중등 필수', W.stage(116) === 1 && W.stage(286) === 1);

  /* ===== 3. 채점 규칙 ===== */
  ok('대소문자 무시', W.check('Apple', 'apple'));
  ok('마침표 무시', W.check('apple.', 'apple'));
  ok('앞뒤 공백 무시', W.check('  apple  ', 'apple'));
  ok('틀린 철자는 오답', !W.check('aple', 'apple'));
  ok('빈 답은 오답', !W.check('   ', 'apple'));
  ok('a / an 은 a·an 모두 정답', W.checkWord('a', { word: 'a / an', accept: ['a', 'an', 'a/an'] }) &&
     W.checkWord('AN', { word: 'a / an', accept: ['a', 'an', 'a/an'] }));

  /* ===== 4. 오늘의 7문제 · 코인 ===== */
  A.reset(); A.setDate(D);
  let S = S0();
  const list = W.ofDate(D);
  ok('시작 코인 0', A.Logic.balance(S) === 0, A.Logic.balance(S));
  W.go('quiz', D);
  for (let i = 0; i < 6; i++) { W.startAt(i); W.setInput(list[i].word.toUpperCase()); W.submit(); }
  ok('6문제 정답 처리', W.correctCount(D) === 6, W.correctCount(D));
  ok('6문제만으로는 코인 없음', A.Logic.balance(S) === 0, A.Logic.balance(S));
  W.startAt(6); W.setInput('zzz'); W.submit();
  ok('오답은 정답으로 세지 않음', W.correctCount(D) === 6, W.correctCount(D));
  ok('오답 시도 기록', W.day(D).tries[6] === 1, W.day(D).tries[6]);
  W.startAt(6); W.setInput('zzz'); W.submit();
  ok('두 번 틀리면 힌트 조건 충족', W.day(D).tries[6] === 2, W.day(D).tries[6]);
  W.startAt(6); W.setInput(list[6].word); W.submit();
  ok('7문제 모두 정답', W.correctCount(D) === 7, W.correctCount(D));
  ok('모두 맞히면 코인 +1', A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('코인 장부에 words 기록 1건', S.ledger.filter(e => e.type === 'words').length === 1);
  ok('장부 금액 +1', S.ledger.filter(e => e.type === 'words')[0].amount === 1);
  ok('장부 날짜가 오늘', S.ledger.filter(e => e.type === 'words')[0].dateKey === D);
  ok('장부 문구가 7개', S.ledger.filter(e => e.type === 'words')[0].label === '오늘의 영단어 7개 완성');
  ok('같은 날 다시 지급 없음', W.award(D) === false && A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('완료 표시 저장', W.day(D).done === true && W.day(D).coin === true);

  /* ===== 5. 날짜별 저장 · 복습은 코인 없음 ===== */
  const T3 = addD(D, 3), R2 = addD(D, 2);
  A.setDate(T3);
  const rList = W.ofDate(R2);
  W.go('quiz', R2);
  for (let i = 0; i < rList.length; i++) { W.startAt(i); W.setInput(rList[i].word); W.submit(); }
  ok('복습 날짜 7문제 기록', W.correctCount(R2) === 7, W.correctCount(R2));
  ok('오늘 기록은 그대로', W.correctCount(D) === 7, W.correctCount(D));
  ok('복습 날짜는 코인 없음', W.day(R2).coin === false && A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('날짜마다 다른 단어', rList.map(w => w.word).join(',') !== list.map(w => w.word).join(','));

  /* ===== 6. 기존 코인·미션 기록과 함께 ===== */
  const before = A.Logic.balance(S);
  A.setDate(D);
  const Sm = S0();
  const mon = '2026-11-16';
  A.Logic.addMission(Sm, mon, D, '양치하기', '🪥');
  const mid = Sm.weeks[mon].dayMissions[D][0].id;
  A.Logic.toggle(Sm, D, mid, D);
  ok('미션 완료 코인도 그대로 붙음', A.Logic.balance(Sm) === before + 1, A.Logic.balance(Sm));
  ok('코인 종류 구분', Sm.ledger.filter(e => e.type === 'daily').length === 1 && Sm.ledger.filter(e => e.type === 'words').length === 1);

  /* ===== 7. 저장 ===== */
  ok('localStorage에 words 저장', !!JSON.parse(localStorage.getItem('kidMissionCoin.v1') || '{}').words);
  ok('저장 키는 kidMissionCoin.v1 그대로', !!localStorage.getItem('kidMissionCoin.v1'));

  return { failed: R.filter(r => !r.pass).length, total: R.length, results: R };
})()
