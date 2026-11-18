(() => {
  const A = window.__kmc;
  if (!A) return { error: 'no hook' };
  const L = A.Logic;
  const R = [];
  const ok = (name, cond, detail) => R.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const addD = (s,n) => { const [y,m,d] = s.split('-').map(Number); const t = new Date(y,m-1,d+n,12); return iso(t); };
  const week = mon => [0,1,2,3,4,5,6].map(i => addD(mon,i));
  const playWeek = (S, mon, list) => {
    list.forEach(([t,e]) => L.addMission(S, mon, t, e));
    const ids = S.weeks[mon].missions.map(m => m.id);
    week(mon).forEach(d => ids.forEach(id => L.toggle(S, d, id, d)));
    return ids;
  };

  /* ===== 1주차 ===== */
  A.reset();
  let S = A.state();
  A.setDate('2026-11-16');
  const M1 = '2026-11-16', D1 = week(M1);

  ok('처음 코인 0개', L.balance(S) === 0, L.balance(S));
  L.addMission(S, M1, '양치하기', '🪥');
  L.addMission(S, M1, '숙제하기', '✏️');
  L.addMission(S, M1, '방 정리하기', '🧹');
  const ids = S.weeks[M1].missions.map(m => m.id);
  ok('미션 3개 등록', ids.length === 3, ids.length);
  ok('같은 이름 미션 거부', L.addMission(S, M1, '양치하기', '🪥').ok === false);
  ok('미션만으로는 코인 0', L.balance(S) === 0, L.balance(S));

  L.toggle(S, D1[0], ids[0], D1[0]);
  L.toggle(S, D1[0], ids[1], D1[0]);
  ok('2/3 완료 시 코인 0', L.balance(S) === 0, L.balance(S));
  L.toggle(S, D1[0], ids[2], D1[0]);
  ok('모두 완료 시 +1코인', L.balance(S) === 1, L.balance(S));
  ok('1일차 awarded=true', S.weeks[M1].days[D1[0]].awarded === true);

  L.toggle(S, D1[0], ids[0], D1[0]);
  ok('체크 해제해도 이미 받은 코인 유지', L.balance(S) === 1, L.balance(S));
  L.toggle(S, D1[0], ids[0], D1[0]);
  ok('다시 체크해도 중복 지급 없음', L.balance(S) === 1, L.balance(S));
  ok('일일 지급 기록 1건', S.ledger.filter(e => e.type === 'daily').length === 1, S.ledger.filter(e => e.type === 'daily').length);

  for (let i = 1; i < 7; i++) ids.forEach(id => L.toggle(S, D1[i], id, D1[6]));
  ok('7일치 일일 코인 7건', S.ledger.filter(e => e.type === 'daily').length === 7, S.ledger.filter(e => e.type === 'daily').length);
  ok('개근 보너스 +3 → 총 10코인', L.balance(S) === 10, L.balance(S));
  ok('주간 보너스는 1건만', S.ledger.filter(e => e.type === 'weekly').length === 1, S.ledger.filter(e => e.type === 'weekly').length);
  ok('주간 bonus 플래그', S.weeks[M1].bonus === true);

  L.toggle(S, D1[6], ids[0], D1[6]);
  L.toggle(S, D1[6], ids[0], D1[6]);
  ok('개근 후 재토글에도 보너스 중복 없음', L.balance(S) === 10, L.balance(S));

  ok('10코인은 현금 사용 불가', L.redeem(S, 5, D1[6]).ok === false);
  ok('canRedeem=false (10코인)', L.canRedeem(S) === false);

  /* ===== 2·3주차 개근 → 30코인 ===== */
  playWeek(S, '2026-11-23', [['양치하기','🪥'],['숙제하기','✏️'],['방 정리하기','🧹']]);
  ok('2주차 후 20코인', L.balance(S) === 20, L.balance(S));
  playWeek(S, '2026-11-30', [['양치하기','🪥'],['숙제하기','✏️'],['방 정리하기','🧹']]);
  ok('3주 개근 후 30코인', L.balance(S) === 30, L.balance(S));
  ok('30코인 이상이면 사용 가능', L.canRedeem(S) === true);

  ok('가진 코인보다 많이 사용 불가', L.redeem(S, 31, '2026-12-06').ok === false);
  ok('0코인 사용 불가', L.redeem(S, 0, '2026-12-06').ok === false);

  const r30 = L.redeem(S, 30, '2026-12-06');
  ok('30코인 사용 성공 = 3,000원', r30.ok === true && r30.won === 3000, JSON.stringify(r30));
  ok('사용 후 잔액 0', L.balance(S) === 0, L.balance(S));
  ok('사용 기록 1건', S.ledger.filter(e => e.type === 'redeem').length === 1);
  ok('잔액 0이면 다시 잠김', L.canRedeem(S) === false);

  /* ===== 부분 사용 (35코인 → 5코인 사용) ===== */
  A.reset(); S = A.state();
  playWeek(S, '2026-11-16', [['a','⭐'],['b','⭐']]);
  playWeek(S, '2026-11-23', [['a','⭐'],['b','⭐']]);
  playWeek(S, '2026-11-30', [['a','⭐'],['b','⭐']]);
  playWeek(S, '2026-12-07', [['a','⭐'],['b','⭐']]);
  const four = L.balance(S);
  ok('4주 개근 = 40코인', four === 40, four);
  const part = L.redeem(S, 5, '2026-12-13');
  ok('5코인만 사용 가능 = 500원', part.ok === true && part.won === 500, JSON.stringify(part));
  ok('사용 후 35코인', L.balance(S) === 35, L.balance(S));
  ok('35코인은 사용 가능 상태 유지', L.canRedeem(S) === true);

  /* ===== 미션 수정 / 미래 날짜 / 빈 주 ===== */
  A.reset(); S = A.state();
  ok('빈 주는 코인 없음', L.balance(S) === 0);
  ok('미션 없는 날 토글 무시', L.toggle(S, '2026-11-17', 'nope', '2026-11-17') === null);
  L.addMission(S, '2026-11-16', 'x', '⭐');
  const xid = S.weeks['2026-11-16'].missions[0].id;
  ok('미래 날짜 체크 불가', L.toggle(S, '2026-11-20', xid, '2026-11-17') === null);

  // 미션 삭제로 오늘 조건이 채워지면 지급
  L.addMission(S, '2026-11-16', 'y', '⭐');
  const w = S.weeks['2026-11-16'];
  L.toggle(S, '2026-11-17', xid, '2026-11-17');
  const beforeDel = L.balance(S);
  L.removeMission(S, '2026-11-16', w.missions[1].id, '2026-11-17');
  ok('미션 삭제로 오늘 모두 완료되면 +1', L.balance(S) === beforeDel + 1, beforeDel + ' → ' + L.balance(S));

  return {
    failed: R.filter(r => !r.pass).length,
    total: R.length,
    results: R
  };
})()
