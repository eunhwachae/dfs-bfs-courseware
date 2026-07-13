const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const seqGuide = {
  array: [14, 7, 21, 3, 18, 9, 25, 12],
  target: 18,
  selected: [],
  done: false
};

const binGuide = {
  array: [3, 7, 9, 12, 14, 18, 21, 25, 30],
  target: 18,
  selected: [],
  done: false
};

const challenges = {
  sequential: {
    array: [32, 14, 27, 8, 41, 19, 5, 36],
    target: 19,
    intro: "순차 탐색은 앞에서부터 한 칸씩 이동합니다."
  },
  binary: {
    array: [4, 9, 12, 17, 23, 28, 31, 37, 45, 52],
    target: 31,
    intro: "이진 탐색은 현재 범위의 가운데 값을 비교합니다."
  }
};

const challengeState = {
  mode: "sequential",
  selected: [],
  showAnswer: false,
  needsRetry: false
};

function pill(values) {
  return values.length > 0
    ? values.map((value) => `<span class="pill">${value}</span>`).join("")
    : `<span class="pill ghost">대기</span>`;
}

function sequentialOrder(array, target) {
  const foundIndex = array.findIndex((value) => value === target);
  const end = foundIndex === -1 ? array.length - 1 : foundIndex;
  return Array.from({ length: end + 1 }, (_, index) => index);
}

function binarySteps(array, target) {
  const steps = [];
  let low = 0;
  let high = array.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = array[mid];
    const step = { low, high, mid, value };
    steps.push(step);
    if (value === target) break;
    if (value < target) low = mid + 1;
    else high = mid - 1;
  }

  return steps;
}

function orderFor(mode, array, target) {
  return mode === "binary"
    ? binarySteps(array, target).map((step) => step.mid)
    : sequentialOrder(array, target);
}

function currentBinaryRange(array, target, selectedLength) {
  const steps = binarySteps(array, target);
  if (steps.length === 0) return null;
  const index = Math.min(selectedLength, steps.length - 1);
  return steps[index];
}

function renderArray(container, array, options = {}) {
  const {
    selected = [],
    foundIndex = -1,
    range = null,
    nextIndex = null,
    disabled = false,
    onClick = null
  } = options;

  container.innerHTML = array.map((value, index) => {
    const classes = ["array-cell"];
    if (selected.includes(index)) classes.push("is-checked");
    if (index === foundIndex) classes.push("is-found");
    if (range && index >= range.low && index <= range.high) classes.push("is-range");
    if (index === nextIndex) classes.push("is-active");
    if (range && (index < range.low || index > range.high)) classes.push("is-disabled");
    return `
      <button class="${classes.join(" ")}" data-index="${index}" type="button" ${disabled ? "disabled" : ""}>
        ${value}
        <small>${index}번</small>
      </button>
    `;
  }).join("");

  if (onClick) {
    container.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => onClick(Number(button.dataset.index)));
    });
  }
}

function renderSeqGuide() {
  const order = sequentialOrder(seqGuide.array, seqGuide.target);
  const nextIndex = seqGuide.done ? null : order[seqGuide.selected.length];
  const foundIndex = seqGuide.done ? seqGuide.array.indexOf(seqGuide.target) : -1;

  renderArray($("#seqArray"), seqGuide.array, {
    selected: seqGuide.selected,
    foundIndex,
    nextIndex,
    disabled: seqGuide.done,
    onClick: handleSeqClick
  });

  $("#seqTrace").innerHTML = pill(seqGuide.selected.map((index) => seqGuide.array[index]));
}

function handleSeqClick(index) {
  if (seqGuide.done) return;
  const order = sequentialOrder(seqGuide.array, seqGuide.target);
  const expected = order[seqGuide.selected.length];

  if (index !== expected) {
    $("#seqFeedback").textContent = `순차 탐색은 아직 ${seqGuide.array[expected]}을(를) 비교할 차례입니다. 앞에서부터 차례대로 확인하세요.`;
    return;
  }

  seqGuide.selected.push(index);
  if (seqGuide.array[index] === seqGuide.target) {
    seqGuide.done = true;
    $("#seqFeedback").textContent = `찾았습니다. ${seqGuide.selected.length}번 비교해서 ${seqGuide.target}을(를) 발견했습니다.`;
  } else {
    $("#seqFeedback").textContent = `${seqGuide.array[index]}은(는) 목표값이 아닙니다. 다음 칸으로 이동합니다.`;
  }

  renderSeqGuide();
}

function resetSeqGuide() {
  seqGuide.selected = [];
  seqGuide.done = false;
  $("#seqFeedback").textContent = "가장 왼쪽 값부터 클릭하세요.";
  renderSeqGuide();
}

function renderBinGuide() {
  const steps = binarySteps(binGuide.array, binGuide.target);
  const current = binGuide.done ? steps[steps.length - 1] : steps[binGuide.selected.length];
  const nextIndex = binGuide.done ? null : current?.mid;
  const foundIndex = binGuide.done ? binGuide.array.indexOf(binGuide.target) : -1;

  renderArray($("#binArray"), binGuide.array, {
    selected: binGuide.selected,
    foundIndex,
    range: current,
    nextIndex,
    disabled: binGuide.done,
    onClick: handleBinClick
  });

  $("#binTrace").innerHTML = pill(binGuide.selected.map((index) => binGuide.array[index]));
  $("#binRange").textContent = current
    ? `현재 범위: ${current.low}번 ~ ${current.high}번, 가운데는 ${current.mid}번`
    : "탐색할 범위가 없습니다.";
}

function handleBinClick(index) {
  if (binGuide.done) return;
  const steps = binarySteps(binGuide.array, binGuide.target);
  const step = steps[binGuide.selected.length];

  if (!step || index !== step.mid) {
    $("#binFeedback").textContent = `현재 범위의 가운데 값은 ${binGuide.array[step.mid]}입니다. 가운데를 먼저 비교하세요.`;
    return;
  }

  binGuide.selected.push(index);
  if (step.value === binGuide.target) {
    binGuide.done = true;
    $("#binFeedback").textContent = `찾았습니다. ${binGuide.selected.length}번 비교해서 ${binGuide.target}을(를) 발견했습니다.`;
  } else if (step.value < binGuide.target) {
    $("#binFeedback").textContent = `${step.value}보다 목표값이 큽니다. 오른쪽 절반만 남깁니다.`;
  } else {
    $("#binFeedback").textContent = `${step.value}보다 목표값이 작습니다. 왼쪽 절반만 남깁니다.`;
  }

  renderBinGuide();
}

function resetBinGuide() {
  binGuide.selected = [];
  binGuide.done = false;
  $("#binFeedback").textContent = "현재 범위의 가운데 값부터 클릭하세요.";
  renderBinGuide();
}

function activeChallenge() {
  return challenges[challengeState.mode];
}

function renderChallenge() {
  const challenge = activeChallenge();
  const order = orderFor(challengeState.mode, challenge.array, challenge.target);
  const answerSelected = challengeState.showAnswer ? order : challengeState.selected;
  const foundIndex = answerSelected.length === order.length ? order[order.length - 1] : -1;
  const range = challengeState.mode === "binary"
    ? currentBinaryRange(challenge.array, challenge.target, challengeState.selected.length)
    : null;

  renderArray($("#challengeArray"), challenge.array, {
    selected: answerSelected,
    foundIndex,
    range,
    disabled: challengeState.showAnswer || challengeState.needsRetry,
    onClick: handleChallengeClick
  });

  $("#challengeTarget").textContent = challenge.target;
  $("#challengeCount").textContent = challengeState.showAnswer ? order.length : challengeState.selected.length;
  $("#challengeTrace").innerHTML = pill(answerSelected.map((index) => challenge.array[index]));
  $("#challengeRange").textContent = challengeState.showAnswer
    ? `정답 비교 순서: ${order.map((index) => challenge.array[index]).join(" → ")}`
    : challengeState.mode === "binary" && range
      ? `현재 범위: ${range.low}번 ~ ${range.high}번`
      : challenge.intro;
}

function handleChallengeClick(index) {
  if (challengeState.needsRetry) {
    $("#challengeFeedback").textContent = "순서가 한 번 달라졌습니다. 처음부터를 눌러 다시 도전하세요.";
    return;
  }

  const challenge = activeChallenge();
  const order = orderFor(challengeState.mode, challenge.array, challenge.target);
  const expected = order[challengeState.selected.length];

  if (challengeState.selected.includes(index)) {
    $("#challengeFeedback").textContent = "이미 비교한 값입니다. 다음 비교할 값을 선택하세요.";
    return;
  }

  if (index !== expected) {
    challengeState.needsRetry = true;
    $("#challengeFeedback").textContent = `${challengeState.selected.length + 1}번째 비교 위치가 ${challengeState.mode === "binary" ? "이진 탐색" : "순차 탐색"} 규칙과 다릅니다. 처음부터 다시 도전하세요.`;
    renderChallenge();
    return;
  }

  challengeState.selected.push(index);
  const value = challenge.array[index];
  if (value === challenge.target) {
    $("#challengeFeedback").textContent = `정답입니다. ${challengeState.selected.length}번 비교해서 ${challenge.target}을(를) 찾았습니다.`;
  } else if (challengeState.mode === "binary") {
    $("#challengeFeedback").textContent = value < challenge.target
      ? `${value}보다 목표값이 큽니다. 오른쪽 범위로 이동합니다.`
      : `${value}보다 목표값이 작습니다. 왼쪽 범위로 이동합니다.`;
  } else {
    $("#challengeFeedback").textContent = `${value}은(는) 목표값이 아닙니다. 다음 칸으로 이동합니다.`;
  }
  renderChallenge();
}

function setChallengeMode(mode) {
  challengeState.mode = mode;
  challengeState.selected = [];
  challengeState.showAnswer = false;
  challengeState.needsRetry = false;
  $("#challengeSeq").classList.toggle("is-selected", mode === "sequential");
  $("#challengeBin").classList.toggle("is-selected", mode === "binary");
  $("#challengeFeedback").textContent = mode === "binary"
    ? "이진 탐색입니다. 현재 범위의 가운데 값을 선택하세요."
    : "순차 탐색입니다. 첫 번째 비교할 값을 선택하세요.";
  renderChallenge();
}

function resetChallenge() {
  challengeState.selected = [];
  challengeState.showAnswer = false;
  challengeState.needsRetry = false;
  $("#challengeFeedback").textContent = challengeState.mode === "binary"
    ? "이진 탐색입니다. 현재 범위의 가운데 값을 선택하세요."
    : "순차 탐색입니다. 첫 번째 비교할 값을 선택하세요.";
  renderChallenge();
}

function showChallengeAnswer() {
  challengeState.showAnswer = true;
  challengeState.needsRetry = false;
  const challenge = activeChallenge();
  const order = orderFor(challengeState.mode, challenge.array, challenge.target);
  $("#challengeFeedback").textContent = `정답 비교 순서는 ${order.map((index) => challenge.array[index]).join(" → ")} 입니다.`;
  renderChallenge();
}

function checkChallenge() {
  const challenge = activeChallenge();
  const order = orderFor(challengeState.mode, challenge.array, challenge.target);
  const correct = order.length === challengeState.selected.length
    && order.every((index, step) => index === challengeState.selected[step]);

  if (challengeState.needsRetry) {
    $("#challengeFeedback").textContent = "오답이 있었습니다. 처음부터를 눌러 다시 도전하세요.";
    return;
  }

  if (!correct) {
    $("#challengeFeedback").textContent = `아직 ${order.length - challengeState.selected.length}번의 비교가 남았습니다. 끝까지 찾아 보세요.`;
    return;
  }

  $("#challengeFeedback").textContent = `완성했습니다. 비교 순서는 ${order.map((index) => challenge.array[index]).join(" → ")} 입니다.`;
}

function setupNavigation() {
  const steps = $$(".nav-step");
  const panels = $$(".panel");

  steps.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.step);
      steps.forEach((step) => step.classList.toggle("is-active", step === button));
      panels.forEach((panel) => panel.classList.toggle("is-active", Number(panel.dataset.panel) === index));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function setupReview() {
  $$("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-open");
    });
  });
}

function updateQuizScore() {
  const cards = $$(".quiz-card");
  const correct = cards.filter((card) => card.dataset.answered === "correct").length;
  $("#quizScore").textContent = `${correct} / ${cards.length}`;
}

function setupQuiz() {
  $$(".quiz-card").forEach((card) => {
    const result = card.querySelector(".quiz-result");
    card.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const isCorrect = button.dataset.choice === card.dataset.correct;
        card.querySelectorAll("[data-choice]").forEach((item) => {
          item.classList.remove("is-selected", "is-correct", "is-wrong");
        });
        button.classList.add("is-selected", isCorrect ? "is-correct" : "is-wrong");
        card.dataset.answered = isCorrect ? "correct" : "wrong";
        result.textContent = isCorrect ? "정답입니다." : `${card.dataset.hint} 다른 답으로 다시 도전해 보세요.`;
        updateQuizScore();
      });
    });
  });

  $("#resetQuiz").addEventListener("click", () => {
    $$(".quiz-card").forEach((card) => {
      delete card.dataset.answered;
      card.querySelector(".quiz-result").textContent = "";
      card.querySelectorAll("[data-choice]").forEach((button) => {
        button.classList.remove("is-selected", "is-correct", "is-wrong");
      });
    });
    updateQuizScore();
  });
}

setupNavigation();
setupReview();
setupQuiz();
$("#seqReset").addEventListener("click", resetSeqGuide);
$("#binReset").addEventListener("click", resetBinGuide);
$("#challengeSeq").addEventListener("click", () => setChallengeMode("sequential"));
$("#challengeBin").addEventListener("click", () => setChallengeMode("binary"));
$("#challengeReset").addEventListener("click", resetChallenge);
$("#challengeAnswer").addEventListener("click", showChallengeAnswer);
$("#challengeCheck").addEventListener("click", checkChallenge);
renderSeqGuide();
renderBinGuide();
renderChallenge();
updateQuizScore();
