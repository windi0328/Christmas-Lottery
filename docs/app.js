const STORAGE_KEY = "christmas-lottery-pages-state-v2";

const state = loadState();
const ui = {
    selectedEventId: state.events[0]?.id ?? null,
    activeTab: "settings",
    pendingReveal: null
};

const els = {
    statsEvents: document.querySelector("#stats-events"),
    statsParticipants: document.querySelector("#stats-participants"),
    statsDrawn: document.querySelector("#stats-drawn"),
    flashStack: document.querySelector("#flash-stack"),
    activeEventSelect: document.querySelector("#active-event-select"),
    createSampleButton: document.querySelector("#create-sample-button"),
    tabLinks: Array.from(document.querySelectorAll("[data-tab-target]")),
    tabSections: Array.from(document.querySelectorAll(".tab-section")),
    eventForm: document.querySelector("#event-form"),
    eventList: document.querySelector("#event-list"),
    eventEmpty: document.querySelector("#event-empty"),
    participantForm: document.querySelector("#participant-form"),
    participantList: document.querySelector("#participant-list"),
    participantEmpty: document.querySelector("#participant-empty"),
    drawButton: document.querySelector("#draw-button"),
    resetDrawButton: document.querySelector("#reset-draw-button"),
    deleteEventButton: document.querySelector("#delete-event-button"),
    detailSummary: document.querySelector("#detail-summary"),
    revealList: document.querySelector("#reveal-list"),
    revealEmpty: document.querySelector("#reveal-empty"),
    revealStatus: document.querySelector("#reveal-status"),
    rollingNames: document.querySelector("#rolling-names"),
    revealResult: document.querySelector("#reveal-result"),
    revealName: document.querySelector("#reveal-name"),
    giftBoxButton: document.querySelector("#gift-box-button"),
    eventCardTemplate: document.querySelector("#event-card-template"),
    participantCardTemplate: document.querySelector("#participant-card-template"),
    revealCardTemplate: document.querySelector("#reveal-card-template")
};

bindEvents();
render();

function bindEvents() {
    els.tabLinks.forEach(link => {
        link.addEventListener("click", () => {
            const target = link.dataset.tabTarget;
            if (target) {
                ui.activeTab = target;
                renderTabs();
                document.querySelector(`#tab-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    els.activeEventSelect.addEventListener("change", () => {
        ui.selectedEventId = els.activeEventSelect.value || null;
        resetReveal();
        render();
    });

    els.createSampleButton.addEventListener("click", createEmptyEvent);
    els.eventForm.addEventListener("submit", handleSaveEvent);
    els.participantForm.addEventListener("submit", handleAddParticipant);
    els.drawButton.addEventListener("click", handleDraw);
    els.resetDrawButton.addEventListener("click", handleResetDraw);
    els.deleteEventButton.addEventListener("click", handleDeleteEvent);
    els.giftBoxButton.addEventListener("click", handleGiftReveal);
}

function loadState() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { events: [] };
        }

        const parsed = JSON.parse(raw);
        return { events: Array.isArray(parsed.events) ? parsed.events : [] };
    } catch {
        return { events: [] };
    }
}

function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function flash(message, type = "success") {
    const item = document.createElement("div");
    item.className = `flash ${type}`;
    item.textContent = message;
    els.flashStack.innerHTML = "";
    els.flashStack.appendChild(item);

    window.setTimeout(() => {
        if (item.parentNode === els.flashStack) {
            item.remove();
        }
    }, 3600);
}

function commitState(message, type = "success") {
    saveState();
    render();
    if (message) {
        flash(message, type);
    }
}

function render() {
    renderTabs();
    renderStats();
    renderEventPicker();
    renderEventForm();
    renderEventList();
    renderParticipantSection();
    renderDrawSection();
}

function renderTabs() {
    els.tabLinks.forEach(link => {
        link.classList.toggle("active", link.dataset.tabTarget === ui.activeTab);
    });

    els.tabSections.forEach(section => {
        section.classList.toggle("active", section.id === `tab-${ui.activeTab}`);
    });
}

function renderStats() {
    const participantCount = state.events.reduce((total, event) => total + event.participants.length, 0);
    const drawnCount = state.events.filter(event => event.assignments.length > 0).length;
    els.statsEvents.textContent = String(state.events.length);
    els.statsParticipants.textContent = String(participantCount);
    els.statsDrawn.textContent = String(drawnCount);
}

function renderEventPicker() {
    els.activeEventSelect.innerHTML = "";

    if (state.events.length === 0) {
        els.activeEventSelect.innerHTML = `<option value="">請先建立活動</option>`;
        return;
    }

    state.events.forEach(event => {
        const option = document.createElement("option");
        option.value = event.id;
        option.textContent = event.name;
        els.activeEventSelect.appendChild(option);
    });

    if (!ui.selectedEventId || !state.events.some(event => event.id === ui.selectedEventId)) {
        ui.selectedEventId = state.events[0].id;
    }

    els.activeEventSelect.value = ui.selectedEventId;
}

function renderEventForm() {
    const event = getSelectedEvent();

    if (!event) {
        els.eventForm.reset();
        return;
    }

    els.eventForm.elements.name.value = event.name;
    els.eventForm.elements.description.value = event.description || "";
    els.eventForm.elements.eventDate.value = event.eventDate || "";
    els.eventForm.elements.location.value = event.location || "";
    els.eventForm.elements.budget.value = event.budget || "";
}

function renderEventList() {
    els.eventList.innerHTML = "";
    const hasEvents = state.events.length > 0;
    els.eventEmpty.classList.toggle("hidden", hasEvents);

    state.events.forEach(event => {
        const fragment = els.eventCardTemplate.content.cloneNode(true);
        fragment.querySelector(".badge").textContent = event.assignments.length > 0 ? "已完成抽籤" : "尚未抽籤";
        fragment.querySelector(".event-date").textContent = event.eventDate ? formatDate(event.eventDate) : "未設定日期";
        fragment.querySelector(".event-name").textContent = event.name;
        fragment.querySelector(".event-description").textContent = event.description || "尚未填寫活動描述。";

        const meta = fragment.querySelector(".event-meta");
        meta.appendChild(createMetaItem("地點", event.location || "未設定"));
        meta.appendChild(createMetaItem("預算", event.budget ? `NT$ ${Number(event.budget).toLocaleString("zh-TW")}` : "未設定"));
        meta.appendChild(createMetaItem("人數", `${event.participants.length} 位`));

        fragment.querySelector(".select-event").addEventListener("click", () => {
            ui.selectedEventId = event.id;
            render();
            flash(`已切換到活動「${event.name}」。`);
        });

        els.eventList.appendChild(fragment);
    });
}

function renderParticipantSection() {
    const event = getSelectedEvent();
    els.participantList.innerHTML = "";

    if (!event) {
        els.participantEmpty.classList.remove("hidden");
        return;
    }

    const hasParticipants = event.participants.length > 0;
    els.participantEmpty.classList.toggle("hidden", hasParticipants);

    event.participants
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
        .forEach(participant => {
            const fragment = els.participantCardTemplate.content.cloneNode(true);
            fragment.querySelector(".participant-name").textContent = participant.name;
            fragment.querySelector(".delete-participant").addEventListener("click", () => {
                if (event.assignments.length > 0) {
                    flash("此活動已經抽籤，請先重抽後再刪除參與者。", "error");
                    return;
                }

                event.participants = event.participants.filter(item => item.id !== participant.id);
                commitState(`已刪除參與者：${participant.name}`);
            });
            els.participantList.appendChild(fragment);
        });
}

function renderDrawSection() {
    const event = getSelectedEvent();
    els.detailSummary.innerHTML = "";
    els.revealList.innerHTML = "";

    if (!event) {
        els.drawButton.disabled = true;
        els.resetDrawButton.disabled = true;
        els.revealEmpty.classList.remove("hidden");
        resetReveal();
        return;
    }

    [
        ["活動名稱", event.name],
        ["活動日期", event.eventDate ? formatDate(event.eventDate) : "未設定"],
        ["活動地點", event.location || "未設定"],
        ["預算", event.budget ? `NT$ ${Number(event.budget).toLocaleString("zh-TW")}` : "未設定"],
        ["參與人數", `${event.participants.length} 位`],
        ["抽籤狀態", event.assignments.length > 0 ? "已完成抽籤" : "等待抽籤"]
    ].forEach(([label, value]) => {
        els.detailSummary.appendChild(createMetaItem(label, value));
    });

    els.drawButton.disabled = event.participants.length < 2 || event.assignments.length > 0;
    els.resetDrawButton.disabled = event.assignments.length === 0;

    if (event.assignments.length === 0) {
        els.revealEmpty.classList.remove("hidden");
        resetReveal();
        return;
    }

    els.revealEmpty.classList.add("hidden");
    event.participants.forEach(participant => {
        const fragment = els.revealCardTemplate.content.cloneNode(true);
        fragment.querySelector(".participant-name").textContent = participant.name;
        fragment.querySelector(".prepare-reveal").addEventListener("click", () => {
            ui.pendingReveal = participant.id;
            els.giftBoxButton.disabled = false;
            els.giftBoxButton.classList.remove("opened");
            els.revealResult.classList.add("hidden");
            els.rollingNames.textContent = "禮物盒準備中";
            els.revealStatus.textContent = `已選擇 ${participant.name}，按下禮物盒開始揭曉。`;
            flash(`準備揭曉 ${participant.name} 的抽籤結果。`);
        });
        els.revealList.appendChild(fragment);
    });
}

function createEmptyEvent() {
    const newEvent = {
        id: crypto.randomUUID(),
        name: "新的交換禮物活動",
        description: "",
        eventDate: "",
        location: "",
        budget: "",
        participants: [],
        assignments: []
    };

    state.events.unshift(newEvent);
    ui.selectedEventId = newEvent.id;
    commitState("已建立新的空白活動。");
}

function handleSaveEvent(event) {
    event.preventDefault();
    const formData = new FormData(els.eventForm);
    const name = String(formData.get("name") || "").trim();

    if (!name) {
        flash("活動名稱為必填。", "error");
        return;
    }

    let current = getSelectedEvent();
    if (!current) {
        current = {
            id: crypto.randomUUID(),
            participants: [],
            assignments: []
        };
        state.events.unshift(current);
        ui.selectedEventId = current.id;
    }

    current.name = name;
    current.description = String(formData.get("description") || "").trim();
    current.eventDate = String(formData.get("eventDate") || "");
    current.location = String(formData.get("location") || "").trim();
    current.budget = String(formData.get("budget") || "").trim();

    commitState(`活動「${current.name}」已儲存。`);
}

function handleAddParticipant(event) {
    event.preventDefault();
    const current = getSelectedEvent();
    if (!current) {
        flash("請先建立活動。", "error");
        return;
    }

    if (current.assignments.length > 0) {
        flash("此活動已抽籤，請先重抽後再新增參與者。", "error");
        return;
    }

    const formData = new FormData(els.participantForm);
    const name = String(formData.get("name") || "").trim();
    if (!name) {
        flash("參與者名稱為必填。", "error");
        return;
    }

    current.participants.push({
        id: crypto.randomUUID(),
        name
    });

    els.participantForm.reset();
    commitState(`參與者「${name}」已加入。`);
}

function handleDraw() {
    const current = getSelectedEvent();
    if (!current) {
        flash("請先建立活動。", "error");
        return;
    }

    if (current.participants.length < 2) {
        flash("至少需要 2 位參與者才能抽籤。", "error");
        return;
    }

    current.assignments = generateAssignments(current.participants);
    resetReveal();
    commitState(`活動「${current.name}」已完成公平抽籤。`);
}

function handleResetDraw() {
    const current = getSelectedEvent();
    if (!current || current.assignments.length === 0) {
        flash("目前沒有可重抽的結果。", "error");
        return;
    }

    if (!window.confirm(`確定要重抽活動「${current.name}」嗎？`)) {
        return;
    }

    current.assignments = [];
    resetReveal();
    commitState("抽籤結果已清除，可以重新抽籤。");
}

function handleDeleteEvent() {
    const current = getSelectedEvent();
    if (!current) {
        flash("目前沒有可刪除的活動。", "error");
        return;
    }

    if (!window.confirm(`確定要刪除活動「${current.name}」嗎？`)) {
        return;
    }

    state.events = state.events.filter(item => item.id !== current.id);
    ui.selectedEventId = state.events[0]?.id ?? null;
    resetReveal();
    commitState(`活動「${current.name}」已刪除。`);
}

function handleGiftReveal() {
    const current = getSelectedEvent();
    if (!current || !ui.pendingReveal) {
        return;
    }

    const giver = current.participants.find(item => item.id === ui.pendingReveal);
    const assignment = current.assignments.find(item => item.giverId === ui.pendingReveal);
    const receiver = current.participants.find(item => item.id === assignment?.receiverId);

    if (!giver || !receiver) {
        flash("找不到揭曉資料，請重新抽籤。", "error");
        return;
    }

    const namePool = current.participants
        .filter(item => item.id !== giver.id)
        .map(item => item.name);

    els.giftBoxButton.disabled = true;
    let ticks = 0;
    const timer = window.setInterval(() => {
        els.rollingNames.textContent = namePool[ticks % namePool.length] || receiver.name;
        ticks += 1;
        if (ticks > 18) {
            window.clearInterval(timer);
            els.giftBoxButton.classList.add("opened");
            els.rollingNames.textContent = receiver.name;
            els.revealName.textContent = `${giver.name} 抽到的是 ${receiver.name}`;
            els.revealResult.classList.remove("hidden");
            els.revealStatus.textContent = "揭曉完成，換下一位時記得先把畫面收起來。";
            playBellSound();
        }
    }, 120);
}

function resetReveal() {
    ui.pendingReveal = null;
    els.giftBoxButton.disabled = true;
    els.giftBoxButton.classList.remove("opened");
    els.rollingNames.textContent = "等待揭曉";
    els.revealStatus.textContent = "先點擊下方某位參與者，再拆開禮物盒揭曉。";
    els.revealResult.classList.add("hidden");
}

function getSelectedEvent() {
    return state.events.find(item => item.id === ui.selectedEventId) ?? null;
}

function generateAssignments(participants) {
    const ids = participants.map(item => item.id);
    let shuffled = ids.slice();
    let attempts = 0;

    while (attempts < 500) {
        shuffled = shuffle(ids.slice());
        if (shuffled.every((receiverId, index) => receiverId !== ids[index])) {
            return ids.map((giverId, index) => ({
                giverId,
                receiverId: shuffled[index]
            }));
        }

        attempts += 1;
    }

    throw new Error("無法產生有效抽籤結果。");
}

function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
}

function createMetaItem(label, value) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrapper.append(dt, dd);
    return wrapper;
}

function formatDate(value) {
    if (!value) {
        return "未設定";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function playBellSound() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.22);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
    } catch {
        // Ignore browsers that block autoplay audio.
    }
}
