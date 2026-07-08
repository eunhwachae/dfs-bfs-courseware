const baseGraph = {
  nodes: [
    { id: 1, x: 380, y: 58 },
    { id: 2, x: 210, y: 165 },
    { id: 3, x: 550, y: 165 },
    { id: 4, x: 120, y: 305 },
    { id: 5, x: 300, y: 305 },
    { id: 6, x: 470, y: 305 },
    { id: 7, x: 650, y: 305 },
    { id: 8, x: 300, y: 420 }
  ],
  edges: [
    [1, 2], [1, 3],
    [2, 4], [2, 5],
    [5, 8],
    [3, 6], [3, 7]
  ]
};

const challengeGraph = {
  nodes: [
    { id: 1, x: 380, y: 58 },
    { id: 2, x: 190, y: 165 },
    { id: 3, x: 570, y: 165 },
    { id: 4, x: 100, y: 305 },
    { id: 5, x: 280, y: 305 },
    { id: 6, x: 480, y: 305 },
    { id: 7, x: 670, y: 305 },
    { id: 8, x: 280, y: 420 },
    { id: 9, x: 480, y: 420 },
    { id: 10, x: 670, y: 420 }
  ],
  edges: [
    [1, 2], [1, 3],
    [2, 4], [2, 5],
    [3, 6], [3, 7],
    [5, 8], [6, 9], [7, 10]
  ]
};

const guidedState = {
  dfs: [],
  bfs: []
};

const challengeState = {
  mode: "dfs",
  selected: [],
  showAnswer: false,
  structureGuess: [],
  structurePending: false,
  structureHistory: [],
  needsRetry: false
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function nodeById(graph, id) {
  return graph.nodes.find((node) => String(node.id) === String(id));
}

function sortedNeighbors(graph, id) {
  return graph.edges
    .filter(([a, b]) => String(a) === String(id) || String(b) === String(id))
    .map(([a, b]) => String(a) === String(id) ? b : a)
    .sort((a, b) => {
      const nodeA = nodeById(graph, a);
      const nodeB = nodeById(graph, b);
      if (nodeA.x !== nodeB.x) return nodeA.x - nodeB.x;
      return String(a).localeCompare(String(b), "ko");
    });
}

function dfsOrder(graph, start) {
  const visited = new Set();
  const order = [];

  function visit(id) {
    visited.add(String(id));
    order.push(id);
    for (const next of sortedNeighbors(graph, id)) {
      if (!visited.has(String(next))) visit(next);
    }
  }

  visit(start);
  return order;
}

function bfsOrder(graph, start) {
  const visited = new Set([String(start)]);
  const queue = [start];
  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    for (const next of sortedNeighbors(graph, current)) {
      if (!visited.has(String(next))) {
        visited.add(String(next));
        queue.push(next);
      }
    }
  }

  return order;
}

function orderFor(graph, mode, start) {
  return mode === "dfs" ? dfsOrder(graph, start) : bfsOrder(graph, start);
}

function pathBetween(graph, start, target) {
  const queue = [[start]];
  const seen = new Set([String(start)]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (String(current) === String(target)) return path;

    for (const next of sortedNeighbors(graph, current)) {
      if (seen.has(String(next))) continue;
      seen.add(String(next));
      queue.push([...path, next]);
    }
  }

  return [];
}

function structureForGuide(mode, selected) {
  if (selected.length === 0) return [1];

  if (mode === "dfs") {
    return pathBetween(baseGraph, 1, selected[selected.length - 1]);
  }

  const queue = [1];
  const discovered = new Set(["1"]);
  let processed = 0;

  while (queue.length > 0 && processed < selected.length) {
    const current = queue.shift();
    processed += 1;

    for (const next of sortedNeighbors(baseGraph, current)) {
      if (discovered.has(String(next))) continue;
      discovered.add(String(next));
      queue.push(next);
    }
  }

  return queue;
}

function queueAfterBfsVisits(graph, visitCount) {
  const order = bfsOrder(graph, 1);
  const queue = [1];
  const discovered = new Set(["1"]);
  let processed = 0;

  while (queue.length > 0 && processed < visitCount) {
    const current = queue.shift();
    processed += 1;

    for (const next of sortedNeighbors(graph, current)) {
      if (discovered.has(String(next))) continue;
      discovered.add(String(next));
      queue.push(next);
    }
  }

  return queue.filter((id) => order.some((value) => String(value) === String(id)));
}

function structureForChallenge() {
  const selected = challengeState.selected;
  if (selected.length === 0) return [];

  if (challengeState.mode === "dfs") {
    const current = selected[selected.length - 1];
    return pathBetween(challengeGraph, 1, current).slice().reverse();
  }

  return queueAfterBfsVisits(challengeGraph, selected.length);
}

function structureName() {
  return challengeState.mode === "dfs" ? "스택(위→아래)" : "큐(앞→뒤)";
}

function comparableStructure(values) {
  return values.length === 0 ? ["empty"] : values.map(String);
}

function displayStructureValue(value) {
  return value === "empty" ? "비어 있음" : value;
}

function resetStructureGuess(message = true) {
  if (!challengeState.structurePending) {
    if (message && $("#structureFeedback")) {
      $("#structureFeedback").textContent = "먼저 노드를 하나 선택하세요.";
    }
    return;
  }
  challengeState.structureGuess = [];
  if (message && $("#structureFeedback")) {
    $("#structureFeedback").textContent = "순서를 다시 눌러 보세요.";
  }
  renderChallenge();
}

function createSvgElement(name, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
}

function curvePath(graph, from, to, index = 0) {
  const a = nodeById(graph, from);
  const b = nodeById(graph, to);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const bend = Math.max(24, Math.min(62, Math.abs(dx) * .13 + Math.abs(dy) * .08));
  const side = index % 2 === 0 ? -1 : 1;
  const cx = mx - side * dy * .08;
  const cy = my + side * dx * .08 - bend;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function pill(values) {
  return values.map((value) => `<span class="pill">${value}</span>`).join("");
}

function addMarkers(svg, key) {
  const defs = createSvgElement("defs");
  for (const style of ["dfs", "bfs", "challenge"]) {
    const marker = createSvgElement("marker", {
      id: `arrow-${key}-${style}`,
      markerWidth: "7",
      markerHeight: "7",
      refX: "6",
      refY: "3.5",
      orient: "auto",
      markerUnits: "strokeWidth"
    });
    marker.appendChild(createSvgElement("path", {
      d: "M 1 1 L 6 3.5 L 1 6 Z",
      class: `visit-arrow ${style}`
    }));
    defs.appendChild(marker);
  }
  svg.appendChild(defs);
}

function drawRoute(svg, graph, from, to, className, markerKey, markerStyle, index) {
  svg.appendChild(createSvgElement("path", {
    class: className,
    d: curvePath(graph, from, to, index),
    "marker-end": `url(#arrow-${markerKey}-${markerStyle})`
  }));
}

function renderGraph(svg, graph, options) {
  const {
    key,
    mode = "dfs",
    selected = [],
    next = null,
    routeStyle = mode,
    nodeClick = null,
    showNextRoute = false,
    answerOrder = []
  } = options;

  svg.innerHTML = "";
  addMarkers(svg, key);

  for (const [from, to] of graph.edges) {
    const a = nodeById(graph, from);
    const b = nodeById(graph, to);
    svg.appendChild(createSvgElement("line", {
      class: "edge",
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y
    }));
  }

  for (let i = 0; i < selected.length - 1; i += 1) {
    drawRoute(svg, graph, selected[i], selected[i + 1], `route ${routeStyle}`, key, routeStyle, i);
  }

  if (showNextRoute && selected.length > 0 && next) {
    drawRoute(svg, graph, selected[selected.length - 1], next, `route ${mode} next`, key, mode, selected.length);
  }

  if (answerOrder.length > 1) {
    for (let i = 0; i < answerOrder.length - 1; i += 1) {
      drawRoute(svg, graph, answerOrder[i], answerOrder[i + 1], `route ${mode} next`, key, mode, i);
    }
  }

  const selectedSet = new Set(selected.map(String));
  const current = selected[selected.length - 1];

  for (const node of graph.nodes) {
    const group = createSvgElement("g", { class: "node-group" });
    group.dataset.id = String(node.id);
    if (selectedSet.has(String(node.id))) group.classList.add("visited");
    if (String(node.id) === String(current)) group.classList.add("current");
    if (next && String(node.id) === String(next)) group.classList.add("next");

    group.appendChild(createSvgElement("circle", {
      class: "node-circle",
      cx: node.x,
      cy: node.y,
      r: "28"
    }));
    group.appendChild(createSvgElement("text", {
      class: "node-text",
      x: node.x,
      y: node.y
    }));
    group.lastChild.textContent = node.id;

    const orderIndex = selected.findIndex((id) => String(id) === String(node.id));
    if (orderIndex >= 0) {
      group.appendChild(createSvgElement("circle", {
        class: "order-badge",
        cx: node.x + 27,
        cy: node.y - 28,
        r: "14"
      }));
      group.appendChild(createSvgElement("text", {
        class: "order-text",
        x: node.x + 27,
        y: node.y - 28
      }));
      group.lastChild.textContent = orderIndex + 1;
    }

    if (nodeClick) {
      group.addEventListener("click", () => nodeClick(node.id));
    }
    svg.appendChild(group);
  }
}

function renderGuide(mode) {
  const svg = $(`#${mode}GuideSvg`);
  if (!svg) return;
  const selected = guidedState[mode];
  const order = orderFor(baseGraph, mode, 1);
  const next = order[selected.length] || null;

  renderGraph(svg, baseGraph, {
    key: `${mode}-guide`,
    mode,
    selected,
    next,
    routeStyle: mode,
    showNextRoute: true,
    nodeClick: (id) => handleGuideClick(mode, id)
  });

  $(`#${mode}GuideNext`).textContent = next ? `${next}번` : "완료";
  $(`#${mode}GuideVisited`).innerHTML = pill(selected);
  $(`#${mode}GuideStructure`).innerHTML = pill(structureForGuide(mode, selected));
}

function handleGuideClick(mode, id) {
  const order = orderFor(baseGraph, mode, 1);
  const expected = order[guidedState[mode].length];
  const feedback = $(`#${mode}GuideFeedback`);

  if (String(id) !== String(expected)) {
    feedback.textContent = `지금은 ${expected}번을 클릭할 차례입니다. ${mode.toUpperCase()}의 이동 규칙을 다시 확인해 보세요.`;
    return;
  }

  guidedState[mode].push(id);
  const next = order[guidedState[mode].length];
  feedback.textContent = next
    ? `좋습니다. ${id}번 방문 완료! 다음은 ${next}번입니다.`
    : `완성했습니다. ${mode.toUpperCase()} 방문 순서는 ${order.join(" → ")} 입니다.`;
  renderGuide(mode);
}

function resetGuide(mode) {
  guidedState[mode] = [];
  const feedback = $(`#${mode}GuideFeedback`);
  if (feedback) {
    feedback.textContent = mode === "dfs"
      ? "1번부터 클릭하세요. DFS는 갈 수 있는 한 깊게 내려갑니다."
      : "1번부터 클릭하세요. BFS는 가까운 깊이를 먼저 모두 봅니다.";
  }
  renderGuide(mode);
}

function renderChallenge() {
  const svg = $("#treeSvg");
  const selected = challengeState.selected;
  const order = orderFor(challengeGraph, challengeState.mode, 1);
  const answerOrder = challengeState.showAnswer ? order : [];
  const expectedStructure = structureForChallenge();
  const comparable = selected.length === 0 ? [] : comparableStructure(expectedStructure);
  const bankValues = ["empty", ...challengeGraph.nodes.map((node) => String(node.id))];

  renderGraph(svg, challengeGraph, {
    key: "challenge",
    mode: challengeState.mode,
    selected,
    routeStyle: "challenge",
    answerOrder,
    nodeClick: handleChallengeClick
  });

  $("#nextNode").textContent = challengeState.showAnswer
    ? "정답 표시"
    : challengeState.needsRetry
        ? "새로 도전"
        : selected.length === 0
          ? "1번부터"
          : selected.length === order.length
            ? "선택 완료"
            : "직접 선택";
  $("#visitedList").innerHTML = pill(selected);
  $("#structureLabel").textContent = structureName();

  const guide = $("#structureGuide");
  if (challengeState.showAnswer) {
    guide.textContent = "정답 경로를 확인하는 중입니다. 다시 풀려면 처음부터를 누르세요.";
  } else if (challengeState.needsRetry) {
    guide.textContent = "탐색 순서가 달라졌습니다. 처음부터 새로 도전하세요.";
  } else if (selected.length === 0) {
    guide.textContent = "노드를 선택하면 1~10 중 현재 스택 또는 큐에 들어 있는 번호만 골라 순서대로 나열합니다.";
  } else if (challengeState.structurePending) {
    guide.textContent = `${selected.length}번째 방문 뒤의 ${structureName()} 상태입니다. 다음 노드는 계속 클릭할 수 있고, 오른쪽에서 현재 상태를 맞혀 볼 수 있습니다.`;
  } else {
    guide.textContent = "자료 구조 상태까지 확인했습니다. 다음 노드를 선택하세요.";
  }

  $("#structureTarget").innerHTML = challengeState.structureGuess.length > 0
    ? pill(challengeState.structureGuess.map(displayStructureValue))
    : `<span class="ghost-pill">${challengeState.structurePending ? "현재 들어 있는 번호만 골라 순서대로 채우기" : "대기 중"}</span>`;

  $("#structureBank").innerHTML = bankValues.map((value) => {
    const used = challengeState.structureGuess.includes(value);
    return `<button data-structure-token="${value}" ${used || !challengeState.structurePending ? "disabled" : ""}>${displayStructureValue(value)}</button>`;
  }).join("");

  $("#structureHistory").innerHTML = challengeState.structureHistory.length > 0
    ? challengeState.structureHistory.map((item, index) => `
        <div>
          <b>${index + 1}. ${item.node}번 방문</b>
          <span>${item.label}: ${item.values.map(displayStructureValue).join(" → ")}</span>
        </div>
      `).join("")
    : `<span class="empty-history">아직 기록된 변화가 없습니다.</span>`;

  $$("[data-structure-token]").forEach((button) => {
    button.addEventListener("click", () => {
      challengeState.structureGuess.push(button.dataset.structureToken);
      $("#structureFeedback").textContent = "선택한 순서가 맞는지 확인해 보세요.";
      renderChallenge();
    });
  });
}

function handleChallengeClick(id) {
  if (challengeState.showAnswer) {
    challengeState.showAnswer = false;
  }

  if (challengeState.needsRetry) {
    $("#feedback").textContent = "탐색 순서가 한 번 달라졌습니다. 처음부터를 눌러 새로 도전하세요.";
    return;
  }

  if (challengeState.selected.some((value) => String(value) === String(id))) {
    $("#feedback").textContent = `${id} 노드는 이미 선택했습니다. 다른 노드를 고르세요.`;
    return;
  }

  if (challengeState.selected.length === 0 && String(id) !== "1") {
    $("#feedback").textContent = "이 문제는 1번에서 시작합니다. 먼저 1번을 클릭하세요.";
    return;
  }

  const expected = orderFor(challengeGraph, challengeState.mode, 1)[challengeState.selected.length];
  if (String(id) !== String(expected)) {
    challengeState.needsRetry = true;
    $("#feedback").textContent = `${challengeState.selected.length + 1}번째 선택이 ${challengeState.mode.toUpperCase()} 규칙과 맞지 않습니다. 정답을 바로 보지 말고 처음부터 새로 도전해 보세요.`;
    $("#structureFeedback").textContent = "새로 도전할 준비가 되면 처음부터를 누르세요.";
    renderChallenge();
    return;
  }

  challengeState.selected.push(id);
  challengeState.structurePending = true;
  challengeState.structureGuess = [];
  $("#feedback").textContent = `${id}번 선택 완료. 다음 노드를 계속 선택하면서, 오른쪽에서는 현재 ${structureName()} 상태도 맞혀 보세요.`;
  $("#structureFeedback").textContent = "";
  renderChallenge();
}

function resetChallenge(message = true) {
  challengeState.selected = [];
  challengeState.showAnswer = false;
  challengeState.structureGuess = [];
  challengeState.structurePending = false;
  challengeState.structureHistory = [];
  challengeState.needsRetry = false;
  if (message) {
    $("#feedback").textContent = "1번부터 시작하세요. 노드를 하나 고를 때마다 오른쪽에서 현재 스택 또는 큐 순서도 함께 점검합니다.";
    $("#structureFeedback").textContent = "";
  }
  renderChallenge();
}

function setChallengeMode(mode) {
  challengeState.mode = mode;
  $("#dfsMode").classList.toggle("is-selected", mode === "dfs");
  $("#bfsMode").classList.toggle("is-selected", mode === "bfs");
  resetChallenge(false);
  $("#structureFeedback").textContent = "";
  $("#feedback").textContent = mode === "dfs"
    ? "DFS 도전입니다. 1번에서 시작해 한 갈래를 깊게 따라가 보세요."
    : "BFS 도전입니다. 1번에서 시작해 가까운 깊이부터 넓게 방문해 보세요.";
}

function checkChallenge() {
  const expected = orderFor(challengeGraph, challengeState.mode, 1);
  const actual = challengeState.selected;

  if (challengeState.needsRetry) {
    $("#feedback").textContent = "오답이 있었습니다. 처음부터를 눌러 새로 도전하세요.";
    return;
  }

  if (actual.length < expected.length) {
    $("#feedback").textContent = `아직 ${expected.length - actual.length}개 노드가 남았습니다. 모든 노드를 선택한 뒤 채점하세요.`;
    return;
  }

  const mismatch = expected.findIndex((id, index) => String(id) !== String(actual[index]));
  if (mismatch === -1) {
    $("#feedback").textContent = `정답입니다. ${challengeState.mode.toUpperCase()} 순서는 ${expected.join(" → ")} 입니다.`;
  } else {
    $("#feedback").textContent = `${mismatch + 1}번째 선택부터 다릅니다. 정답은 ${expected.join(" → ")} 입니다.`;
  }
}

function showChallengeAnswer() {
  challengeState.showAnswer = true;
  challengeState.structurePending = false;
  challengeState.structureGuess = [];
  challengeState.needsRetry = false;
  $("#feedback").textContent = `${challengeState.mode.toUpperCase()} 정답 순서는 ${orderFor(challengeGraph, challengeState.mode, 1).join(" → ")} 입니다.`;
  $("#structureFeedback").textContent = "정답을 본 뒤에는 처음부터 다시 도전할 수 있습니다.";
  renderChallenge();
}

function checkStructureAnswer() {
  if (!challengeState.structurePending) {
    $("#structureFeedback").textContent = "먼저 노드를 하나 선택하세요.";
    return;
  }

  const expected = comparableStructure(structureForChallenge());
  const actual = challengeState.structureGuess;

  if (actual.length < expected.length) {
    $("#structureFeedback").textContent = `${expected.length - actual.length}개를 더 선택해야 합니다. 현재 들어 있는 번호만 고르세요.`;
    return;
  }

  const isCorrect = actual.length === expected.length && expected.every((value, index) => value === actual[index]);
  if (!isCorrect) {
    challengeState.structureGuess = [];
    $("#structureFeedback").textContent = `선택한 번호나 순서가 다릅니다. 1~10 중 현재 ${structureName()}에 들어 있는 번호만 골라 새로 도전하세요.`;
    renderChallenge();
    return;
  }

  const node = challengeState.selected[challengeState.selected.length - 1];
  challengeState.structurePending = false;
  challengeState.structureHistory.push({
    node,
    label: structureName(),
    values: expected
  });
  challengeState.structureGuess = [];

  const total = challengeGraph.nodes.length;
  $("#structureFeedback").textContent = "자료 구조 순서도 정답입니다.";
  $("#feedback").textContent = challengeState.selected.length === total
    ? "모든 노드와 자료 구조 변화를 완성했습니다. 채점하기를 눌러 마무리하세요."
    : "좋습니다. 다음 노드를 선택하세요.";
  renderChallenge();
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
      renderGuide("dfs");
      renderGuide("bfs");
      renderChallenge();
    });
  });
}

function setupWarmups() {
  $$(".warmup-card").forEach((card) => {
    const button = card.querySelector(".reveal-answer");
    if (!button) return;
    button.addEventListener("click", () => {
      card.classList.toggle("is-revealed");
      button.textContent = card.classList.contains("is-revealed") ? "답 숨기기" : "정답 보기";
    });
  });
}

function setupSubpages() {
  $$(".panel").forEach((panel) => {
    const pages = [...panel.querySelectorAll(".subpage")];
    if (pages.length === 0) return;
    let index = 0;
    const status = panel.querySelector("[data-sub-status]");
    const prev = panel.querySelector("[data-sub-prev]");
    const next = panel.querySelector("[data-sub-next]");

    function update() {
      pages.forEach((page, pageIndex) => page.classList.toggle("is-active", pageIndex === index));
      status.textContent = `${index + 1} / ${pages.length}`;
      prev.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      renderGuide("dfs");
      renderGuide("bfs");
    }

    prev.addEventListener("click", () => {
      index = Math.max(0, index - 1);
      update();
    });
    next.addEventListener("click", () => {
      index = Math.min(pages.length - 1, index + 1);
      update();
    });
    update();
  });
}

function setupQuiz() {
  const cards = $$(".quiz-card");
  const score = $("#quizScore");

  function updateScore() {
    const correct = cards.filter((card) => card.dataset.solved === "true").length;
    score.textContent = `${correct} / ${cards.length}`;
  }

  cards.forEach((card) => {
    const buttons = [...card.querySelectorAll("button[data-choice]")];
    const result = card.querySelector(".quiz-result");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const isCorrect = button.dataset.choice === card.dataset.correct;
        buttons.forEach((item) => {
          item.classList.remove("is-selected", "is-correct", "is-wrong");
        });
        button.classList.add("is-selected", isCorrect ? "is-correct" : "is-wrong");
        card.dataset.solved = isCorrect ? "true" : "false";
        result.textContent = isCorrect ? "정답입니다." : `${card.dataset.hint} 다른 답으로 다시 도전해 보세요.`;
        updateScore();
      });
    });
  });

  $("#resetQuiz").addEventListener("click", () => {
    cards.forEach((card) => {
      card.dataset.solved = "false";
      card.querySelector(".quiz-result").textContent = "";
      card.querySelectorAll("button").forEach((button) => {
        button.classList.remove("is-selected", "is-correct", "is-wrong");
      });
    });
    updateScore();
  });

  updateScore();
}

$("#dfsMode").addEventListener("click", () => setChallengeMode("dfs"));
$("#bfsMode").addEventListener("click", () => setChallengeMode("bfs"));
$("#resetActivity").addEventListener("click", () => resetChallenge());
$("#showAnswer").addEventListener("click", showChallengeAnswer);
$("#checkChallenge").addEventListener("click", checkChallenge);
$("#resetStructure").addEventListener("click", () => resetStructureGuess());
$("#checkStructure").addEventListener("click", checkStructureAnswer);

$$("[data-guide-reset]").forEach((button) => {
  button.addEventListener("click", () => resetGuide(button.dataset.guideReset));
});

setupNavigation();
setupSubpages();
setupWarmups();
setupQuiz();
renderGuide("dfs");
renderGuide("bfs");
renderChallenge();
