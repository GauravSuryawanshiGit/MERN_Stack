const toggle = document.getElementById("chatToggle");
const windowBox = document.getElementById("chatWindow");
const closeBtn = document.getElementById("closeChat");

if (toggle && windowBox && closeBtn) {

    toggle.onclick = () => {
        windowBox.style.display = "flex";
    };

    closeBtn.onclick = () => {
        windowBox.style.display = "none";
    };

    document.addEventListener("click", (e) => {

        if (
            !windowBox.contains(e.target) &&
            !toggle.contains(e.target)
        ) {
            windowBox.style.display = "none";
        }

    });

}

async function sendMessage() {

    const input = document.getElementById("userMessage");
    const box = document.getElementById("messages");

    const message = input.value.trim();

    if (!message) return;


    box.innerHTML += `
        <div class="user-msg">
            ${message}
        </div>
    `;

    input.value = "";

    box.scrollTop = box.scrollHeight;


    const typing = document.createElement("div");

    typing.className = "ai-msg typing";

    typing.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    box.appendChild(typing);

    box.scrollTop = box.scrollHeight;

    try {

        const res = await fetch("/ai", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message
            })

        });

        const data = await res.json();

        typing.remove();

        box.innerHTML += `
            <div class="ai-msg">
                ${data.reply.replace(/\n/g, "<br>")}
            </div>
        `;

        box.scrollTop = box.scrollHeight;

    } catch (err) {

        typing.remove();

        box.innerHTML += `
            <div class="ai-msg">
                Something went wrong.
            </div>
        `;

    }

}
const input = document.getElementById("userMessage");

if (input) {

    input.addEventListener("keypress", function (e) {

        if (e.key === "Enter") {

            sendMessage();

        }

    });

}