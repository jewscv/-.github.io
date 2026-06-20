// KBO 10개 구단 기본 목록
const KBO_TEAMS = [
  "KIA 타이거즈",
  "삼성 라이온즈",
  "LG 트윈스",
  "두산 베어스",
  "SSG 랜더스",
  "KT 위즈",
  "롯데 자이언츠",
  "한화 이글스",
  "NC 다이노스",
  "키움 히어로즈"
];

// 결과별 상징 기호 (달력 표기용)
const RESULT_EMOJI = {
  "승": "★ 승",
  "패": "▼ 패",
  "무": "─ 무",
  "취소": "✕ 취소"
};

// 애플리케이션 상태 (State)
let data = {};
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-indexed (1 ~ 12)
let selectedDateKey = null;

// DOM 요소 캐싱
const calendarDaysContainer = document.getElementById("calendar-days");
const prevMonthBtn = document.getElementById("prev-month-btn");
const nextMonthBtn = document.getElementById("next-month-btn");
const todayBtn = document.getElementById("today-btn");
const yearSelect = document.getElementById("year-select");
const monthSelect = document.getElementById("month-select");

// 대시보드 요소
const winRateValue = document.getElementById("win-rate-value");
const statTotal = document.getElementById("stat-total");
const statWin = document.getElementById("stat-win");
const statDraw = document.getElementById("stat-draw");
const statLose = document.getElementById("stat-lose");
const statCancel = document.getElementById("stat-cancel");
const winRateCircle = document.querySelector(".win-rate-circle");

// 모달 요소
const recordModal = document.getElementById("record-modal");
const modalDateTitle = document.getElementById("modal-date-title");
const opponentSelect = document.getElementById("opponent-select");
const recordForm = document.getElementById("record-form");
const deleteRecordBtn = document.getElementById("delete-record-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");

// 1. 데이터 로드 및 저장
function loadData() {
  const storedData = localStorage.getItem("baseball_records");
  if (storedData) {
    try {
      data = JSON.parse(storedData);
    } catch (e) {
      data = {};
    }
  } else {
    data = {};
  }
}

function saveData() {
  localStorage.setItem("baseball_records", JSON.stringify(data));
}

// 2. 통계 계산 및 대시보드 갱신
function calcStats() {
  const records = Object.values(data);
  let win = 0, draw = 0, lose = 0, cancel = 0;

  records.forEach(r => {
    if (r.result === "승") win++;
    else if (r.result === "무") draw++;
    else if (r.result === "패") lose++;
    else if (r.result === "취소") cancel++;
  });

  const totalAll = records.length;
  const totalPlayed = win + draw + lose;
  const winRate = totalPlayed > 0 ? Math.round((win / totalPlayed) * 100 * 10) / 10 : 0.0;

  return { win, draw, lose, cancel, totalAll, winRate };
}

function updateDashboard() {
  const stats = calcStats();
  
  // 수치 업데이트
  winRateValue.textContent = `${stats.winRate.toFixed(1)}%`;
  statTotal.textContent = stats.totalAll;
  statWin.textContent = stats.win;
  statDraw.textContent = stats.draw;
  statLose.textContent = stats.lose;
  statCancel.textContent = stats.cancel;

  // 원형 게이지 차트 효과 (CSS conic-gradient 변경)
  const angle = (stats.winRate / 100) * 360;
  winRateCircle.style.background = `radial-gradient(var(--bg-secondary) 65%, transparent 66%), conic-gradient(var(--color-win) ${angle}deg, var(--bg-tertiary) ${angle}deg)`;
}

// 3. 셀렉트 박스(연도, 월) 초기 구성
function setupDropdowns() {
  yearSelect.innerHTML = "";
  monthSelect.innerHTML = "";

  // 현재 연도 기준 -5년 ~ +5년 선택 기능
  const startYear = currentYear - 5;
  const endYear = currentYear + 5;
  for (let y = startYear; y <= endYear; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  // 1월 ~ 12월
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    if (m === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }
}

// 4. 캘린더 렌더링 기능
function renderCalendar() {
  calendarDaysContainer.innerHTML = "";
  yearSelect.value = currentYear;
  monthSelect.value = currentMonth;

  // 특정 월의 1일 요일 구하기 (월요일 시작 기준으로 조정: 일요일=6, 월요일=0, ..., 토요일=5)
  const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
  const mondayFirstIndex = firstDay === 0 ? 6 : firstDay - 1;

  // 특정 월의 총 일수 구하기
  const totalDays = new Date(currentYear, currentMonth, 0).getDate();

  // 1일 이전의 빈 공간(이전 달의 끝 요일들) 채우기
  for (let i = 0; i < mondayFirstIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell empty";
    calendarDaysContainer.appendChild(emptyCell);
  }

  // 일자별 셀 렌더링
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "day-cell";
    
    // 토요일 / 일요일 텍스트 컬러 지정을 위한 클래스 추가
    const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
    if (dayOfWeek === 6) dayCell.classList.add("is-sat");
    else if (dayOfWeek === 0) dayCell.classList.add("is-sun");

    // 날짜 번호 레이블
    const numLabel = document.createElement("span");
    numLabel.className = "day-number";
    numLabel.textContent = day;
    dayCell.appendChild(numLabel);

    // 기록 존재 여부 매칭 및 뱃지 추가
    const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = data[dateKey];

    if (record) {
      dayCell.classList.add("has-record");
      // 결과 타입별(승/패/무/취소)로 CSS 색상 반영을 위해 클래스 분기 추가
      if (record.result === "승") dayCell.classList.add("res-win");
      else if (record.result === "패") dayCell.classList.add("res-lose");
      else if (record.result === "무") dayCell.classList.add("res-draw");
      else if (record.result === "취소") dayCell.classList.add("res-cancel");

      const badge = document.createElement("div");
      badge.className = "game-badge";
      
      const resText = document.createElement("strong");
      resText.textContent = RESULT_EMOJI[record.result];
      badge.appendChild(resText);
      
      const oppText = document.createElement("span");
      oppText.textContent = record.opponent.split(" ")[0]; // 구단명 약칭 표기 (예: 'KIA 타이거즈' -> 'KIA')
      badge.appendChild(oppText);

      dayCell.appendChild(badge);
    }

    // 일자 클릭 시 경기 결과 입력 팝업 활성화
    dayCell.addEventListener("click", () => openModal(day, dateKey));
    calendarDaysContainer.appendChild(dayCell);
  }
}

// 5. 모달 제어 함수
function openModal(day, dateKey) {
  selectedDateKey = dateKey;
  modalDateTitle.textContent = `${currentYear}년 ${currentMonth}월 ${day}일 경기 기록`;

  const record = data[dateKey];
  if (record) {
    opponentSelect.value = record.opponent;
    // 해당 결과 라디오 체크
    document.querySelector(`input[name="match-result"][value="${record.result}"]`).checked = true;
    deleteRecordBtn.classList.remove("hidden");
  } else {
    opponentSelect.selectedIndex = 0;
    document.getElementById("res-win").checked = true; // 기본값: '승'
    deleteRecordBtn.classList.add("hidden");
  }

  recordModal.classList.add("active");
}

function closeModal() {
  recordModal.classList.remove("active");
  selectedDateKey = null;
}

// 6. 폼 제출 및 삭제 이벤트 핸들러
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!selectedDateKey) return;

  const opponent = opponentSelect.value;
  const result = document.querySelector('input[name="match-result"]:checked').value;

  data[selectedDateKey] = { opponent, result };
  saveData();
  closeModal();
  renderCalendar();
  updateDashboard();
}

function handleDeleteRecord() {
  if (!selectedDateKey || !data[selectedDateKey]) return;

  if (confirm("해당 날짜의 직관 경기 기록을 삭제하시겠습니까?")) {
    delete data[selectedDateKey];
    saveData();
    closeModal();
    renderCalendar();
    updateDashboard();
  }
}

// 7. 내비게이션 이벤트 핸들러
function toPrevMonth() {
  if (currentMonth === 1) {
    currentMonth = 12;
    currentYear -= 1;
  } else {
    currentMonth -= 1;
  }
  renderCalendar();
}

function toNextMonth() {
  if (currentMonth === 12) {
    currentMonth = 1;
    currentYear += 1;
  } else {
    currentMonth += 1;
  }
  renderCalendar();
}

function toToday() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth() + 1;
  renderCalendar();
}

// 8. 초기 설정 호출
function init() {
  // 상대팀 콤보박스 아이템 로드
  opponentSelect.innerHTML = "";
  KBO_TEAMS.forEach(team => {
    const opt = document.createElement("option");
    opt.value = team;
    opt.textContent = team;
    opponentSelect.appendChild(opt);
  });

  loadData();
  setupDropdowns();
  renderCalendar();
  updateDashboard();

  // 이벤트 바인딩
  prevMonthBtn.addEventListener("click", toPrevMonth);
  nextMonthBtn.addEventListener("click", toNextMonth);
  todayBtn.addEventListener("click", toToday);

  yearSelect.addEventListener("change", (e) => {
    currentYear = parseInt(e.target.value);
    renderCalendar();
  });
  monthSelect.addEventListener("change", (e) => {
    currentMonth = parseInt(e.target.value);
    renderCalendar();
  });

  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);
  recordForm.addEventListener("submit", handleFormSubmit);
  deleteRecordBtn.addEventListener("click", handleDeleteRecord);

  // 모달 영역 바깥 클릭 시 닫기
  recordModal.addEventListener("click", (e) => {
    if (e.target === recordModal) closeModal();
  });
}

// 앱 실행
document.addEventListener("DOMContentLoaded", init);
