const contentDiv = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");
const enablePushBtn = document.getElementById("enable-push");
const disablePushBtn = document.getElementById("disable-push");
const socketStatus = document.getElementById("socket-status");
const clientId = crypto.randomUUID();
const localReminderTimers = new Map();
let reminderWatcherStarted = false;
const socket = window.io
  ? io({
      autoConnect: navigator.onLine
    })
  : {
      connected: false,
      on() {},
      emit() {},
      connect() {},
      disconnect() {}
    };

let pushPublicKey = "";

const CONTENT_FALLBACKS = {
  home: `
    <div class="page-grid">
      <section class="panel hero-panel">
        <div>
          <p class="panel-kicker">Обзор</p>
          <h2 class="section-title">Управляй задачами без перегруза</h2>
          <p class="panel-text">Добавляй обычные заметки, планируй напоминания и продолжай работать даже офлайн.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Всего заметок</span>
            <strong id="notes-count" class="stat-value">0</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">С напоминанием</span>
            <strong id="reminders-count" class="stat-value">0</strong>
          </div>
        </div>
      </section>

      <section class="panel forms-panel">
        <div class="form-card">
          <h3 class="form-title">Быстрая заметка</h3>
          <form id="note-form" class="stack-form">
            <label class="field-label" for="note-input">Текст заметки</label>
            <input type="text" id="note-input" placeholder="Например: проверить контрольную работу" required>
            <button class="button button-primary" type="submit">Добавить заметку</button>
          </form>
        </div>

        <div class="form-card">
          <h3 class="form-title">Напоминание</h3>
          <form id="reminder-form" class="stack-form">
            <label class="field-label" for="reminder-text">Текст напоминания</label>
            <input type="text" id="reminder-text" placeholder="Например: отправить отчёт" required>
            <label class="field-label" for="reminder-time">Дата и время</label>
            <input type="datetime-local" id="reminder-time" required>
            <button class="button button-secondary" type="submit">Сохранить с напоминанием</button>
          </form>
        </div>
      </section>

      <section class="panel notes-panel">
        <div class="notes-header">
          <div>
            <p class="panel-kicker">Список</p>
            <h3 class="form-title">Текущие заметки</h3>
          </div>
          <span id="notes-summary" class="notes-summary">Пока пусто</span>
        </div>
        <ul id="notes-list" class="notes-list"></ul>
      </section>
    </div>
  `,
  about: `
    <div class="panel about-panel">
      <p class="panel-kicker">О проекте</p>
      <h2 class="section-title">Контрольная работа №3</h2>
      <p class="panel-text">Проект объединяет практики 13-18 в одно приложение для заметок с современным интерфейсом и рабочей PWA-логикой.</p>

      <div class="about-grid">
        <article class="about-card">
          <h3 class="form-title">Что уже есть</h3>
          <ul class="about-list">
            <li>Оффлайн-доступ через Service Worker</li>
            <li>Установка как PWA через manifest.json</li>
            <li>WebSocket-уведомления между вкладками</li>
            <li>Push-уведомления и snooze на 5 минут</li>
          </ul>
        </article>

        <article class="about-card">
          <h3 class="form-title">Как использовать</h3>
          <ul class="about-list">
            <li>Открой главную страницу и добавь заметку</li>
            <li>Для напоминания выбери дату и время</li>
            <li>Включи уведомления в боковой панели</li>
            <li>Проверь работу второй вкладкой или офлайн-режимом</li>
          </ul>
        </article>
      </div>
    </div>
  `
};

function showToast(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `toast toast-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2600);
}

function showSystemNotification(title, body, reminderId = null) {
  if (Notification.permission !== "granted") return;

  navigator.serviceWorker.ready
    .then((registration) =>
      registration.showNotification(title, {
        body,
        icon: "/icons/favicon-128x128.png",
        badge: "/icons/favicon-48x48.png",
        data: { reminderId }
      })
    )
    .catch((error) => console.error("Ошибка локального уведомления:", error));
}

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

function formatReminder(timestamp) {
  return new Date(timestamp).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getNotes() {
  const raw = JSON.parse(localStorage.getItem("notes") || "[]");
  return raw.map((note) => ({
    id: Number(note.id) || Date.now(),
    text: String(note.text || "").trim(),
    reminder: note.reminder ? Number(note.reminder) : null,
    notified: Boolean(note.notified)
  }));
}

function setNotes(notes) {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function updateNoteById(noteId, patch) {
  const nextNotes = getNotes().map((note) => (note.id === noteId ? { ...note, ...patch } : note));
  setNotes(nextNotes);
  return nextNotes;
}

function updateSocketStatus(state) {
  socketStatus.textContent = state;
  socketStatus.classList.toggle("status-offline", state !== "Сервер подключен");
}

function updatePushButtons(subscription = null) {
  const permission = Notification.permission;
  const hasSubscription = Boolean(subscription);

  if (permission === "granted" && hasSubscription) {
    enablePushBtn.style.display = "none";
    disablePushBtn.style.display = "inline-flex";
    enablePushBtn.textContent = "Включить системные уведомления";
    return;
  }

  enablePushBtn.style.display = "inline-flex";
  disablePushBtn.style.display = "none";
  enablePushBtn.textContent =
    permission === "granted"
      ? "Подключить системные уведомления"
      : "Разрешить системные уведомления";
}

function syncConnectionState() {
  if (!navigator.onLine) {
    updateSocketStatus("Офлайн режим");
    if (socket.connected) {
      socket.disconnect();
    }
    return;
  }

  if (!socket.connected) {
    updateSocketStatus("Подключение к серверу...");
    socket.connect();
    return;
  }

  updateSocketStatus("Сервер подключен");
}

function startReminderWatcher() {
  if (reminderWatcherStarted) return;
  reminderWatcherStarted = true;
  checkDueReminders();
  setInterval(checkDueReminders, 5000);
}

function scheduleLocalReminder(note) {
  if (!note.reminder || note.notified || note.reminder <= Date.now()) return;

  if (localReminderTimers.has(note.id)) {
    clearTimeout(localReminderTimers.get(note.id));
  }

  const timeoutId = setTimeout(() => {
    showSystemNotification("Напоминание", note.text, note.id);
    localReminderTimers.delete(note.id);
  }, note.reminder - Date.now());

  localReminderTimers.set(note.id, timeoutId);
}

function rescheduleLocalReminders(notes) {
  for (const timeoutId of localReminderTimers.values()) {
    clearTimeout(timeoutId);
  }

  localReminderTimers.clear();
  notes.forEach(scheduleLocalReminder);
}

function deliverReminder(note) {
  if (!note || !note.reminder || note.notified) return;

  if (Notification.permission === "granted") {
    showSystemNotification("Напоминание", note.text, note.id);
  } else {
    showToast(`Напоминание: ${note.text}`, "info");
  }

  const nextNotes = updateNoteById(note.id, { notified: true });
  rescheduleLocalReminders(nextNotes);
  renderNotes();
}

function checkDueReminders() {
  const now = Date.now();
  const dueReminder = getNotes().find((note) => note.reminder && !note.notified && note.reminder <= now);
  if (dueReminder) {
    deliverReminder(dueReminder);
  }
}

async function createReminderOnServer(note) {
  if (!navigator.onLine) return;

  await fetch("/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: note.id,
      text: note.text,
      reminderTime: note.reminder
    })
  });
}

async function syncPendingRemindersWithServer() {
  if (!navigator.onLine) return;

  const notes = getNotes().filter((note) => note.reminder && !note.notified && note.reminder > Date.now());
  await Promise.all(notes.map((note) => createReminderOnServer(note).catch(() => null)));
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    if (!response.ok) throw new Error("Не удалось загрузить страницу");
    const html = await response.text();
    contentDiv.innerHTML = html;

    if (page === "home") {
      initNotes();
    }
  } catch (err) {
    if (CONTENT_FALLBACKS[page]) {
      contentDiv.innerHTML = CONTENT_FALLBACKS[page];
      if (page === "home") {
        initNotes();
      }
      showToast("Открыта офлайн-версия страницы", "info");
      return;
    }

    contentDiv.innerHTML = `
      <section class="panel error-panel">
        <p class="panel-kicker">Ошибка</p>
        <h2 class="section-title">Не удалось загрузить страницу</h2>
        <p class="panel-text">Проверь, что сервер запущен и файлы доступны.</p>
      </section>
    `;
    console.error(err);
  }
}

function renderNotes() {
  const list = document.getElementById("notes-list");
  const notesCount = document.getElementById("notes-count");
  const remindersCount = document.getElementById("reminders-count");
  const notesSummary = document.getElementById("notes-summary");

  if (!list) return;

  const notes = getNotes();
  const reminders = notes.filter((note) => note.reminder).length;
  rescheduleLocalReminders(notes);

  if (notesCount) notesCount.textContent = String(notes.length);
  if (remindersCount) remindersCount.textContent = String(reminders);

  if (!notes.length) {
    list.innerHTML = `
      <li class="empty-state">
        <strong>Заметок пока нет</strong>
        <span>Добавь первую заметку или напоминание через форму выше.</span>
      </li>
    `;
    if (notesSummary) notesSummary.textContent = "0 заметок";
    return;
  }

  list.innerHTML = notes
    .sort((a, b) => b.id - a.id)
    .map((note) => {
      const reminderMarkup = note.reminder
        ? `<p class="note-reminder">${note.notified ? "Напоминание выполнено" : `Напоминание: ${formatReminder(note.reminder)}`}</p>`
        : `<p class="note-meta">Обычная заметка</p>`;

      return `
        <li class="note-item" data-note-id="${note.id}">
          <div class="note-item-header">
            <span class="note-badge">${note.reminder ? "Reminder" : "Note"}</span>
            <button class="icon-button delete-note-button" type="button" data-note-id="${note.id}">Удалить</button>
          </div>
          <p class="note-text">${note.text}</p>
          ${reminderMarkup}
        </li>
      `;
    })
    .join("");

  if (notesSummary) {
    notesSummary.textContent = `${notes.length} заметок, ${reminders} с напоминанием`;
  }
}

function addNote(text, reminderTimestamp = null) {
  const notes = getNotes();
  const newNote = {
    id: Date.now(),
    text,
    reminder: reminderTimestamp,
    notified: false
  };

  notes.push(newNote);
  setNotes(notes);
  renderNotes();
  showToast(reminderTimestamp ? "Напоминание добавлено" : "Заметка добавлена", "success");

  if (reminderTimestamp) {
    createReminderOnServer(newNote).catch((error) => {
      console.error("Не удалось зарегистрировать напоминание на сервере:", error);
    });
  } else {
    socket.emit("newTask", { text, timestamp: Date.now(), senderId: clientId });
  }
}

function deleteNote(noteId) {
  if (localReminderTimers.has(noteId)) {
    clearTimeout(localReminderTimers.get(noteId));
    localReminderTimers.delete(noteId);
  }

  const nextNotes = getNotes().filter((note) => note.id !== noteId);
  setNotes(nextNotes);
  renderNotes();
  showToast("Заметка удалена", "info");
}

function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const reminderForm = document.getElementById("reminder-form");
  const reminderText = document.getElementById("reminder-text");
  const reminderTime = document.getElementById("reminder-time");
  const list = document.getElementById("notes-list");

  if (!form || !input || !reminderForm || !reminderText || !reminderTime || !list) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addNote(text);
    input.value = "";
    input.focus();
  });

  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = reminderText.value.trim();
    const timestamp = new Date(reminderTime.value).getTime();

    if (!text || Number.isNaN(timestamp)) return;
    if (timestamp <= Date.now()) {
      showToast("Дата напоминания должна быть в будущем", "error");
      return;
    }

    addNote(text, timestamp);
    reminderText.value = "";
    reminderTime.value = "";
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-note-button");
    if (!button) return;
    deleteNote(Number(button.dataset.noteId));
  });

  renderNotes();
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !pushPublicKey) return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pushPublicKey)
  });

  await fetch("/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });

  return subscription;
}

async function syncSubscriptionWithServer(subscription) {
  if (!subscription) return;

  await fetch("/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription)
  });
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch("/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint })
  });

  await subscription.unsubscribe();
}

socket.on("connect", () => updateSocketStatus("Сервер подключен"));
socket.on("disconnect", () => {
  updateSocketStatus(navigator.onLine ? "Подключение к серверу..." : "Офлайн режим");
});
socket.on("taskAdded", (task) => {
  if (task.senderId === clientId) return;
  showToast(`Новая задача в другой вкладке: ${task.text}`, "info");
});
socket.on("reminderDue", (reminder) => {
  const note = getNotes().find((item) => item.id === Number(reminder.id));
  if (!note || note.notified) return;
  deliverReminder(note);
});

homeBtn.addEventListener("click", () => {
  setActiveButton("home-btn");
  loadContent("home");
});

aboutBtn.addEventListener("click", () => {
  setActiveButton("about-btn");
  loadContent("about");
});

enablePushBtn.addEventListener("click", async () => {
  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Разреши уведомления в браузере", "error");
        return;
      }
    }

    if (Notification.permission === "denied") {
      showToast("Уведомления запрещены в браузере", "error");
      return;
    }

    const subscription = await subscribeToPush();
    updatePushButtons(subscription);
    showToast("Push-уведомления включены", "success");
  } catch (err) {
    console.error(err);
    showToast("Не удалось включить push", "error");
  }
});

disablePushBtn.addEventListener("click", async () => {
  try {
    await unsubscribeFromPush();
    updatePushButtons(null);
    showToast("Push-уведомления отключены", "info");
  } catch (err) {
    console.error(err);
    showToast("Не удалось отключить push", "error");
  }
});

loadContent("home");
startReminderWatcher();
syncConnectionState();

window.addEventListener("online", () => {
  showToast("Интернет снова доступен", "success");
  syncConnectionState();
  syncPendingRemindersWithServer().catch(() => null);
});

window.addEventListener("offline", () => {
  showToast("Приложение перешло в офлайн режим", "info");
  syncConnectionState();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const response = await fetch("/vapid-public-key");
      const data = await response.json();
      pushPublicKey = data.publicKey || "";

      await navigator.serviceWorker.register("/sw.js");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await syncSubscriptionWithServer(subscription);
      }
      updatePushButtons(subscription);
      await syncPendingRemindersWithServer();
      checkDueReminders();
      syncConnectionState();
    } catch (err) {
      console.error("Ошибка инициализации SW/Push:", err);
      updatePushButtons(null);
      showToast("Service Worker или push не инициализировались", "error");
    }
  });
}
