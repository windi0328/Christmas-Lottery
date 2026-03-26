const rollingNames = document.querySelector("[data-rolling-names]");
const giftBox = document.querySelector("[data-gift-box]");
const revealButton = document.querySelector("[data-reveal-trigger]");
const revealPanel = document.querySelector("[data-reveal-panel]");
const revealName = document.querySelector("[data-reveal-name]");

function playBellSound() {
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
}

if (revealButton && giftBox && revealPanel && revealName) {
    revealButton.addEventListener("click", () => {
        const finalName = revealButton.dataset.receiverName || "";
        if (!finalName) {
            return;
        }

        revealButton.disabled = true;
        let ticks = 0;
        const namePool = (rollingNames?.dataset.names || finalName)
            .split("|")
            .map((value) => value.trim())
            .filter(Boolean);

        const spinTimer = window.setInterval(() => {
            if (rollingNames && namePool.length > 0) {
                rollingNames.textContent = namePool[ticks % namePool.length];
            }

            ticks += 1;
            if (ticks > 20) {
                window.clearInterval(spinTimer);
                giftBox.classList.add("opened");
                revealName.textContent = finalName;
                if (rollingNames) {
                    rollingNames.textContent = finalName;
                }
                revealPanel.hidden = false;
                playBellSound();
            }
        }, 120);
    });
}
