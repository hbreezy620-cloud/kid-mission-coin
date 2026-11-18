(() => {
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
  const START = '2026-11-18';
  const D = START;

  /* ===== 1. 단어 데이터 800 ===== */
  const L = W.all();
  ok('단어 800개', L.length === 800, L.length);
  ok('중복 단어 없음', new Set(L.map(w => w.word.toLowerCase())).size === 800, new Set(L.map(w => w.word.toLowerCase())).size);
  ok('800개 모두 여섯 항목 채움', L.every(w => w.word && w.meaning && w.example && w.answer && w.hint && w.exampleKo));
  ok('모든 예문에 빈칸 _____ 정확히 1개', L.every(w => w.example.split('_____').length === 2));
  ok('모든 힌트에 안내 문구 있음', L.every(w => !!W.hint(w.hint)));
  ok('뜻이 한국어', L.every(w => /[가-힣]/.test(w.meaning)));
  ok('예문 해석이 한국어', L.every(w => /[가-힣]/.test(w.exampleKo)));

  /* ===== 2. 160일 분배 ===== */
  A.reset(); A.setDate(START);
  ok('시작일 = 1일차', W.lessonOf(START) === 1, W.lessonOf(START));
  ok('5일째까지 1일차', W.lessonOf(addD(START, 4)) === 1, W.lessonOf(addD(START, 4)));
  ok('6일째 = 2일차', W.lessonOf(addD(START, 5)) === 2, W.lessonOf(addD(START, 5)));
  ok('160일차', W.lessonOf(addD(START, 795)) === 160, W.lessonOf(addD(START, 795)));
  ok('161일째는 다시 1일차', W.lessonOf(addD(START, 800)) === 1, W.lessonOf(addD(START, 800)));
  const covered = new Set();
  for (let n = 0; n < 160; n++) W.ofDate(addD(START, n * 5)).forEach(w => covered.add(w.word));
  ok('160일이면 800단어 모두 만남', covered.size === 800, covered.size);
  const d0 = W.ofDate(START);
  ok('하루 5단어', d0.length === 5, d0.length);

  /* ===== 3. 채점 규칙 ===== */
  ok('대소문자 무시', W.check('Apple', 'apple'));
  ok('마침표 무시', W.check('apple.', 'apple'));
  ok('앞뒤 공백 무시', W.check('  apple  ', 'apple'));
  ok('틀린 철자는 오답', !W.check('aple', 'apple'));
  ok('빈 답은 오답', !W.check('   ', 'apple'));
  ok('복수형 답도 그대로 비교', W.check('LEAVES', 'leaves'));

  /* ===== 4. 오늘의 5문제 · 코인 ===== */
  A.reset(); A.setDate(D);
  let S = S0();
  const list = W.ofDate(D);
  ok('시작 코인 0', A.Logic.balance(S) === 0, A.Logic.balance(S));
  W.go('quiz', D);
  for (let i = 0; i < 4; i++) { W.startAt(i); W.setInput(list[i].answer.toUpperCase()); W.submit(); }
  ok('4문제 정답 처리', W.correctCount(D) === 4, W.correctCount(D));
  ok('4문제만으로는 코인 없음', A.Logic.balance(S) === 0, A.Logic.balance(S));
  W.startAt(4); W.setInput('zzz'); W.submit();
  ok('오답은 정답으로 세지 않음', W.correctCount(D) === 4, W.correctCount(D));
  ok('오답 시도 기록', W.day(D).tries[4] === 1, W.day(D).tries[4]);
  W.startAt(4); W.setInput(list[4].answer); W.submit();
  ok('5문제 모두 정답', W.correctCount(D) === 5, W.correctCount(D));
  ok('모두 맞히면 코인 +1', A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('코인 장부에 words 기록 1건', S.ledger.filter(e => e.type === 'words').length === 1);
  ok('장부 금액 +1', S.ledger.filter(e => e.type === 'words')[0].amount === 1);
  ok('장부 날짜가 오늘', S.ledger.filter(e => e.type === 'words')[0].dateKey === D);
  ok('같은 날 다시 지급 없음', W.award(D) === false && A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('완료 표시 저장', W.day(D).done === true && W.day(D).coin === true);

  /* ===== 5. 날짜별 저장 · 복습은 코인 없음 ===== */
  const T3 = addD(D, 3), R2 = addD(D, 2);
  A.setDate(T3);
  const rList = W.ofDate(R2);
  W.go('quiz', R2);
  for (let i = 0; i < rList.length; i++) { W.startAt(i); W.setInput(rList[i].answer); W.submit(); }
  ok('복습 날짜 5문제 기록', W.correctCount(R2) === 5, W.correctCount(R2));
  ok('오늘 기록은 그대로', W.correctCount(D) === 5, W.correctCount(D));
  ok('복습 날짜는 코인 없음', W.day(R2).coin === false && A.Logic.balance(S) === 1, A.Logic.balance(S));
  ok('날짜마다 다른 단어', rList.map(w => w.word).join(',') !== list.map(w => w.word).join(','), rList.map(w => w.word).join(','));

  /* ===== 6. 기존 코인·미션 기록과 함께 ===== */
  const before = A.Logic.balance(S);
  const mon = '2026-11-16';
  A.setDate('2026-11-18');
  const Sm = S0();
  A.Logic.addMission(Sm, mon, '2026-11-18', '양치하기', '🪥');
  const mid = Sm.weeks[mon].dayMissions['2026-11-18'][0].id;
  A.Logic.toggle(Sm, '2026-11-18', mid, '2026-11-18');
  ok('미션 완료 코인도 그대로 붙음', A.Logic.balance(Sm) === before + 1, A.Logic.balance(Sm));
  ok('코인 종류 구분', Sm.ledger.filter(e => e.type === 'daily').length === 1 && Sm.ledger.filter(e => e.type === 'words').length === 1);

  /* ===== 7. 저장/되불러오기 ===== */
  ok('localStorage에 words 저장', !!JSON.parse(localStorage.getItem('kidMissionCoin.v1') || '{}').words);

  return { failed: R.filter(r => !r.pass).length, total: R.length, results: R };
})()
