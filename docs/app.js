const STORAGE_KEY = "christmas-lottery-pages-state-v1";

const state = loadState();
const ui = {
    selectedEventId: state.events[0]?.id ?? null,
    verifiedReveal: null
};

const els = {
    statsEvents: document.querySelector("#stats-events"),
    statsParticipants: document.querySelector("#stats-participants"),
    statsDrawn: document.querySelector("#stats-drawn"),
    flashStack: document.querySelector("#flash-stack"),
    eventForm: document.querySelector("#event-form"),
    eventList: document.querySelector("#event-list"),
    eventEmpty: document.querySelector("#event-empty"),
    detailSection: document.querySelector("#event-detail-section"),
    detailName: document.querySelector("#detail-name"),
    detailDescription: document.querySelector("#detail-description"),
    detailSummary: document.querySelector("#detail-summary"),
    participantForm: document.querySelector("#participant-form"),
    participantList: document.querySelector("#participant-list"),
    participantEmpty: document.querySelector("#participant-empty"),
    drawButton: document.querySelector("#draw-button"),
    resetDrawButton: document.querySelector("#reset-draw-button"),
    deleteEventButton: document.querySelector("#delete-event-button"),
    revealForm: document.querySelector("#reveal-form"),
    revealEventSelect: document.querySelector("#reveal-event-select"),
    revealParticipantSelect: document.querySelector("#reveal-participant-select"),
    revealAccessCode: document.querySelector("#reveal-access-code"),
    revealStatus: document.querySelector("#reveal-status"),
    rollingNames: document.querySelector("#rolling-names"),
    revealResult: document.querySelector("#reveal-result"),
    revealName: document.querySelector("#reveal-name"),
    revealHint: document.querySelector("#reveal-hint"),
    giftBoxButton: document.querySelector("#gift-box-button"),
    eventCardTemplate: document.querySelector("#event-card-template"),
    participantCardTemplate: document.querySelector("#participant-card-template")
};

bindEvents();
render();

function bindEvents() {
    els.eventForm.addEventListener("submit", handleCreateEvent);
    els.participantForm.addEventListener("submit", handleAddParticipant);
    els.drawButton.addEventListener("click", handleDraw);
    els.resetDrawButton.addEventListener("click", handleResetDraw);
    els.deleteEventButton.addEventListener("click", handleDeleteEvent);
    els.revealForm.addEventListener("submit", handleRevealVerify);
    els.revealEventSelect.addEventListener("change", renderRevealParticipantOptions);
    els.giftBoxButton.addEventListener("click", handleGiftReveal);
}

function loadState() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { events: [] };
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.events)) {
            return { events: [] };
        }

        return parsed;
    } catch {
        return { events: [] };
    }
}

function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function commitState(message, type = "success") {
    saveState();
    render();
    flash(message, type);
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

function render() {
    renderStats();
    renderEventList();
    renderSelectedEvent();
    renderRevealEventOptions();
}

function renderStats() {
    const participantCount = state.events.reduce((total, event) => total + event.participants.length, 0);
    const drawnCount = state.events.filter(event => event.assignments.length > 0).length;
    els.statsEvents.textContent = String(state.events.length);
    els.statsParticipants.textContent = String(participantCount);
    els.statsDrawn.textContent = String(drawnCount);
}

function renderEventList() {
    els.eventList.innerHTML = "";
    const hasEvents = state.events.length > 0;
    els.eventEmpty.classList.toggle("hidden", hasEvents);

    state.events.forEach(event => {
        const fragment = els.eventCardTemplate.content.cloneNode(true);
        fragment.querySelector(".badge").textContent = event.assignments.length > 0 ? "驚喜已封存" : "尚未抽籤";
        fragment.querySelector(".event-date").textContent = formatDate(event.eventDate);
        fragment.querySelector(".event-name").textContent = event.name;
        fragment.querySelector(".event-description").textContent = event.description || "還沒有補充活動描述。";

        const meta = fragment.querySelector(".event-meta");
        meta.appendChild(createMetaItem("地點", event.location || "未設定"));
        meta.appendChild(createMetaItem("截止", formatDate(event.registrationDeadline)));
        meta.appendChild(createMetaItem("預算", `NT$ ${Number(event.budget || 0).toLocaleString("zh-TW")}`));
        meta.appendChild(createMetaItem("人數", `${event.participants.length} 位`));

        fragment.querySelector(".select-event").addEventListener("click", () => {
            ui.selectedEventId = event.id;
            renderSelectedEvent();
            document.querySelector("#event-detail-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        fragment.querySelector(".open-reveal").addEventListener("click", () => {
            ui.selectedEventId = event.id;
            renderSelectedEvent();
            els.revealEventSelect.value = event.id;
            renderRevealParticipantOptions();
            document.querySelector("#reveal")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        els.eventList.appendChild(fragment);
    });
}

function renderSelectedEvent() {
    const event = getSelectedEvent();
    const hasEvent = Boolean(event);
    els.detailSection.classList.toggle("hidden", !hasEvent);
    if (!event) {
        return;
    }

    els.detailName.textContent = event.name;
    els.detailDescription.textContent = event.description || "管理參與者、執行抽籤，並查看每位參與者的專屬通關碼。";
    els.detailSummary.innerHTML = "";

    [
        ["活動日期", formatDate(event.eventDate)],
        ["報名截止", formatDate(event.registrationDeadline)],
        ["活動地點", event.location || "未設定"],
        ["預算", `NT$ ${Number(event.budget || 0).toLocaleString("zh-TW")}`],
        ["目前狀態", event.assignments.length > 0 ? "已完成抽籤" : "等待抽籤"],
        ["參與人數", `${event.participants.length} 位`]
    ].forEach(([label, value]) => {
        els.detailSummary.appendChild(createMetaItem(label, value));
    });

    els.drawButton.disabled = event.participants.length < 2 || event.assignments.length > 0;
    els.resetDrawButton.disabled = event.assignments.length === 0;

    renderParticipantList(event);
}

function renderParticipantList(event) {
    els.participantList.innerHTML = "";
    const hasParticipants = event.participants.length > 0;
    els.participantEmpty.classList.toggle("hidden", hasParticipants);

    event.participants
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
        .forEach(participant => {
            const fragment = els.participantCardTemplate.content.cloneNode(true);
            fragment.querySelector(".participant-name").textContent = participant.name;
            fragment.querySelector(".participant-email").textContent = participant.email || "未填寫 Email";
            fragment.querySelector(".participant-hint").textContent = participant.wishlistHint || "沒有額外提示";
            fragment.querySelector(".participant-code").textContent = `通關碼：${participant.accessCode}`;

            const matchText = fragment.querySelector(".participant-match");
            const assignment = event.assignments.find(item => item.giverId === participant.id);
            if (assignment) {
                const receiver = event.participants.find(item => item.id === assignment.receiverId);
                matchText.classList.remove("hidden");
                matchText.textContent = `已抽到：${receiver?.name ?? "未找到"}`;
            }

            fragment.querySelector(".delete-participant").addEventListener("click", () => {
                if (event.assignments.length > 0) {
                    flash("此活動已抽籤，請先重抽後再刪除參與者。", "error");
                    return;
                }

                event.participants = event.participants.filter(item => item.id !== participant.id);
                commitState(`已刪除參與者：${participant.name}`);
            });

            els.participantList.appendChild(fragment);
        });
}

function renderRevealEventOptions() {
    const previousValue = els.revealEventSelect.value;
    els.revealEventSelect.innerHTML = "";

    if (state.events.length === 0) {
        els.revealEventSelect.innerHTML = `<option value="">目前沒有活動</option>`;
        els.revealParticipantSelect.innerHTML = `<option value="">請先建立活動</option>`;
        updateRevealLockedState();
        return;
    }

    state.events.forEach(event => {
        const option = document.createElement("option");
        option.value = event.id;
        option.textContent = event.name;
        els.revealEventSelect.appendChild(option);
    });

    if (previousValue && state.events.some(event => event.id === previousValue)) {
        els.revealEventSelect.value = previousValue;
    } else if (ui.selectedEventId && state.events.some(event => event.id === ui.selectedEventId)) {
        els.revealEventSelect.value = ui.selectedEventId;
    }

    renderRevealParticipantOptions();
}

function renderRevealParticipantOptions() {
    const event = state.events.find(item => item.id === els.revealEventSelect.value);
    els.revealParticipantSelect.innerHTML = "";
    ui.verifiedReveal = null;
    resetRevealResult();

    if (!event) {
        els.revealParticipantSelect.innerHTML = `<option value="">請先選擇活動</option>`;
        updateRevealLockedState();
        return;
    }

    if (event.participants.length === 0) {
        els.revealParticipantSelect.innerHTML = `<option value="">目前沒有參與者</option>`;
        updateRevealLockedState();
        return;
    }

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "請選擇你的名字";
    els.revealParticipantSelect.appendChild(defaultOption);

    event.participants.forEach(participant => {
        const option = document.createElement("option");
        option.value = participant.id;
        option.textContent = participant.name;
        els.revealParticipantSelect.appendChild(option);
    });

    updateRevealLockedState();
}

function handleCreateEvent(event) {
    event.preventDefault();
    const formData = new FormData(els.eventForm);
    const newEvent = {
        id: crypto.randomUUID(),
        name: String(formData.get("name") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        eventDate: String(formData.get("eventDate") || ""),
        location: String(formData.get("location") || "").trim(),
        registrationDeadline: String(formData.get("registrationDeadline") || ""),
        budget: Number(formData.get("budget") || 0),
        participants: [],
        assignments: [],
        createdAt: new Date().toISOString()
    };

    if (!newEvent.name || !newEvent.eventDate || !newEvent.registrationDeadline) {
        flash("請先填好活動名稱、日期與截止時間。", "error");
        return;
    }

    if (newEvent.registrationDeadline > newEvent.eventDate) {
        flash("報名截止時間不能晚於活動時間。", "error");
        return;
    }

    state.events.unshift(newEvent);
    ui.selectedEventId = newEvent.id;
    els.eventForm.reset();
    commitState(`活動「${newEvent.name}」已建立。`);
}

function handleAddParticipant(event) {
    event.preventDefault();
    const selectedEvent = getSelectedEvent();
    if (!selectedEvent) {
        flash("請先選擇一個活動。", "error");
        return;
    }

    if (selectedEvent.assignments.length > 0) {
        flash("此活動已抽籤，請先重抽後再新增參與者。", "error");
        return;
    }

    const formData = new FormData(els.participantForm);
    const participant = {
        id: crypto.randomUUID(),
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        wishlistHint: String(formData.get("wishlistHint") || "").trim(),
        accessCode: generateAccessCode(selectedEvent)
    };

    if (!participant.name) {
        flash("請輸入參與者姓名。", "error");
        return;
    }

    selectedEvent.participants.push(participant);
    els.participantForm.reset();
    commitState(`參與者「${participant.name}」已加入。`);
}

function handleDraw() {
    const event = getSelectedEvent();
    if (!event) {
        return;
    }

    if (event.participants.length < 2) {
        flash("至少需要 2 位參與者才能抽籤。", "error");
        return;
    }

    if (event.assignments.length > 0) {
        flash("這個活動已經抽過籤，若要重抽請先按重抽。", "error");
        return;
    }

    startDrawCountdown(event);
}

function handleResetDraw() {
    const event = getSelectedEvent();
    if (!event) {
        return;
    }

    if (event.assignments.length === 0) {
        flash("目前沒有可重抽的結果。", "error");
        return;
    }

    if (!window.confirm(`確定要重抽活動「${event.name}」嗎？`)) {
        return;
    }

    event.assignments = [];
    resetRevealResult();
    commitState("抽籤結果已清除，可以重新抽籤。");
}

function handleDeleteEvent() {
    const event = getSelectedEvent();
    if (!event) {
        return;
    }

    if (!window.confirm(`確定要刪除活動「${event.name}」嗎？`)) {
        return;
    }

    state.events.splice(state.events.findIndex(item => item.id === event.id), 1);
    ui.selectedEventId = state.events[0]?.id ?? null;
    resetRevealResult();
    commitState(`活動「${event.name}」已刪除。`);
}

function handleRevealVerify(event) {
    event.preventDefault();
    const selectedEvent = state.events.find(item => item.id === els.revealEventSelect.value);
    const participantId = els.revealParticipantSelect.value;
    const accessCode = els.revealAccessCode.value.trim().toUpperCase();

    resetRevealResult();

    if (!selectedEvent) {
        flash("請先選擇活動。", "error");
        return;
    }

    if (selectedEvent.assignments.length === 0) {
        flash("這個活動還沒有抽籤結果。", "error");
        return;
    }

    const participant = selectedEvent.participants.find(item => item.id === participantId);
    if (!participant || participant.accessCode.toUpperCase() !== accessCode) {
        flash("名字與通關碼不正確。", "error");
        updateRevealLockedState();
        return;
    }

    const assignment = selectedEvent.assignments.find(item => item.giverId === participant.id);
    const receiver = selectedEvent.participants.find(item => item.id === assignment?.receiverId);
    if (!receiver) {
        flash("找不到抽籤結果，請重新抽籤。", "error");
        updateRevealLockedState();
        return;
    }

    ui.verifiedReveal = {
        eventId: selectedEvent.id,
        participantId: participant.id,
        participantName: participant.name,
        receiverName: receiver.name,
        hint: receiver.wishlistHint || "先偷偷觀察一下對方最近缺什麼吧。",
        pool: selectedEvent.participants
            .filter(item => item.id !== participant.id)
            .map(item => item.name)
    };

    els.revealStatus.textContent = `通關碼驗證成功，${participant.name} 可以拆開禮物盒了。`;
    els.giftBoxButton.disabled = false;
    flash("驗證成功，按下禮物盒開始揭曉。");
}

function handleGiftReveal() {
    if (!ui.verifiedReveal) {
        return;
    }

    const finalName = ui.verifiedReveal.receiverName;
    const namePool = ui.verifiedReveal.pool.length > 0 ? ui.verifiedReveal.pool : [finalName];
    els.giftBoxButton.disabled = true;
    els.giftBoxButton.classList.remove("opened");
    let ticks = 0;

    const timer = window.setInterval(() => {
        els.rollingNames.textContent = namePool[ticks % namePool.length];
        ticks += 1;
        if (ticks > 18) {
            window.clearInterval(timer);
            els.giftBoxButton.classList.add("opened");
            els.rollingNames.textContent = finalName;
            els.revealName.textContent = `你抽到的是 ${finalName}`;
            els.revealHint.textContent = `小提示：${ui.verifiedReveal.hint}`;
            els.revealResult.classList.remove("hidden");
            els.revealStatus.textContent = "揭曉完成，記得保密到交換當天。";
            playBellSound();
        }
    }, 120);
}

function startDrawCountdown(event) {
    const overlay = document.createElement("div");
    overlay.className = "flash success";
    overlay.style.position = "fixed";
    overlay.style.left = "50%";
    overlay.style.top = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.zIndex = "99";
    overlay.style.minWidth = "320px";
    overlay.style.textAlign = "center";
    overlay.style.background = "linear-gradient(180deg, #fffaf1, #f3ebdb)";
    overlay.style.color = "#1f2924";
    overlay.style.boxShadow = "0 30px 70px rgba(0,0,0,.26)";
    overlay.innerHTML = `
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#d2a22c;">Gift Draw</div>
        <div style="font-size:36px;font-weight:900;margin-top:12px;color:#b8263d;" id="draw-count-value">5</div>
        <div style="margin-top:10px;font-weight:800;">聖誕精靈正在交換禮物</div>
        <div style="margin-top:8px;color:rgba(31,41,36,.72);">倒數結束後自動完成公平抽籤</div>
    `;
    document.body.appendChild(overlay);

    const backdrop = document.createElement("div");
    backdrop.style.position = "fixed";
    backdrop.style.inset = "0";
    backdrop.style.background = "rgba(6, 20, 15, .7)";
    backdrop.style.backdropFilter = "blur(10px)";
    backdrop.style.zIndex = "98";
    document.body.appendChild(backdrop);

    let seconds = 5;
    const counter = overlay.querySelector("#draw-count-value");
    const tick = () => {
        seconds -= 1;
        counter.textContent = String(Math.max(seconds, 0));
        if (seconds > 0) {
            window.setTimeout(tick, 1000);
            return;
        }

        const assignments = generateAssignments(event.participants);
        event.assignments = assignments;
        saveState();
        render();
        backdrop.remove();
        overlay.remove();
        flash(`活動「${event.name}」已完成公平抽籤。`);
    };

    window.setTimeout(tick, 1000);
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

    throw new Error("無法建立有效抽籤結果。");
}

function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
}

function generateAccessCode(event) {
    let code = "";
    do {
        code = Math.random().toString(16).slice(2, 10).toUpperCase();
    } while (event.participants.some(item => item.accessCode === code));
    return code;
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
        // Ignore audio failures in browsers that block autoplay.
    }
}

function resetRevealResult() {
    ui.verifiedReveal = null;
    els.giftBoxButton.disabled = true;
    els.giftBoxButton.classList.remove("opened");
    els.rollingNames.textContent = "等待揭曉";
    els.revealStatus.textContent = "先完成名字與通關碼驗證，才能拆開禮物盒。";
    els.revealResult.classList.add("hidden");
}

function updateRevealLockedState() {
    els.giftBoxButton.disabled = true;
    els.revealStatus.textContent = "先完成名字與通關碼驗證，才能拆開禮物盒。";
}

function getSelectedEvent() {
    return state.events.find(item => item.id === ui.selectedEventId) ?? null;
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
