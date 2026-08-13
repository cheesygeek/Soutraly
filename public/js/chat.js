const STORAGE_KEY = "soutraly_phone";

const phoneScreen = document.getElementById("phone-screen");
const chatScreen = document.getElementById("chat-screen");
const phoneInput = document.getElementById("phone-input");
const phoneSubmit = document.getElementById("phone-submit");
const switchNumberBtn = document.getElementById("switch-number");
const chatPhoneLabel = document.getElementById("chat-phone-label");
const messagesEl = document.getElementById("messages");
const quickRepliesEl = document.getElementById("quick-replies");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let currentPhone = null;

function showPhoneScreen() {
  phoneScreen.classList.remove("hidden");
  chatScreen.classList.add("hidden");
}

function showChatScreen() {
  phoneScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}

function bubbleFor(direction, text) {
  const div = document.createElement("div");
  div.className = "bubble " + (direction === "inbound" ? "out" : "in");
  div.textContent = text;
  return div;
}

function renderMessages(messages) {
  messagesEl.innerHTML = "";
  for (const m of messages) {
    messagesEl.appendChild(bubbleFor(m.direction, m.body));
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderQuickReplies(quickReplies) {
  quickRepliesEl.innerHTML = "";
  if (!quickReplies || quickReplies.length === 0) {
    quickRepliesEl.classList.add("hidden");
    return;
  }
  quickRepliesEl.classList.remove("hidden");
  for (const qr of quickReplies) {
    const btn = document.createElement("button");
    btn.className = "quick-reply-btn";
    btn.textContent = qr;
    btn.addEventListener("click", () => sendMessage(qr));
    quickRepliesEl.appendChild(btn);
  }
}

async function openChat(phone) {
  currentPhone = phone;
  localStorage.setItem(STORAGE_KEY, phone);
  chatPhoneLabel.textContent = phone;
  showChatScreen();

  const res = await fetch(`/api/chat/${encodeURIComponent(phone)}/history`);
  const data = await res.json();
  renderMessages(data.messages);
  renderQuickReplies(data.quickReplies);
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || !currentPhone) return;

  messagesEl.appendChild(bubbleFor("inbound", trimmed));
  messagesEl.scrollTop = messagesEl.scrollHeight;
  messageInput.value = "";
  renderQuickReplies(undefined);

  const res = await fetch(`/api/chat/${encodeURIComponent(currentPhone)}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed }),
  });
  const data = await res.json();

  messagesEl.appendChild(bubbleFor("outbound", data.reply.lines.join("\n")));
  messagesEl.scrollTop = messagesEl.scrollHeight;
  renderQuickReplies(data.reply.quickReplies);
}

phoneSubmit.addEventListener("click", () => {
  const phone = phoneInput.value.trim();
  if (!phone) return;
  openChat(phone);
});

phoneInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") phoneSubmit.click();
});

switchNumberBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  currentPhone = null;
  phoneInput.value = "";
  showPhoneScreen();
});

sendButton.addEventListener("click", () => sendMessage(messageInput.value));
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage(messageInput.value);
});

const savedPhone = localStorage.getItem(STORAGE_KEY);
if (savedPhone) {
  openChat(savedPhone);
} else {
  showPhoneScreen();
}
