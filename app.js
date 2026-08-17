/* ================= 캐릭터 옵션 ================= */
const SKINS = ['#ffe0bd','#f1c27d','#c68642','#8d5524'];
const HAIR_COLORS = ['#2c2c2c','#6b4423','#d4a373','#e63946','#457b9d'];
const HAIR_STYLES = ['short','long','bun'];
const TOP_COLORS = ['#3b6ef5','#22c55e','#f97316','#ef4444','#a855f7','#111827'];
const BOTTOM_COLORS = ['#1f2937','#374151','#78716c','#0f766e','#7c2d12'];

function hairMarkup(style, color) {
  if (style === 'long') {
    return `<path d="M28 30 Q50 5 72 30 L72 20 Q50 8 28 20 Z" fill="${color}"/>
            <rect x="24" y="25" width="8" height="42" rx="4" fill="${color}"/>
            <rect x="68" y="25" width="8" height="42" rx="4" fill="${color}"/>`;
  }
  if (style === 'bun') {
    return `<path d="M28 30 Q50 5 72 30 L72 20 Q50 8 28 20 Z" fill="${color}"/>
            <circle cx="50" cy="7" r="8" fill="${color}"/>`;
  }
  return `<path d="M28 30 Q50 5 72 30 L72 20 Q50 8 28 20 Z" fill="${color}"/>`;
}

function avatarSVG(c, size = 64) {
  return `<svg viewBox="0 0 100 140" width="${size}" height="${size * 1.4}">
    <ellipse cx="50" cy="128" rx="28" ry="6" fill="#00000012"/>
    <rect x="35" y="90" width="12" height="34" rx="4" fill="${c.bottom}"/>
    <rect x="53" y="90" width="12" height="34" rx="4" fill="${c.bottom}"/>
    <rect x="30" y="55" width="40" height="38" rx="10" fill="${c.top}"/>
    <rect x="18" y="58" width="12" height="30" rx="6" fill="${c.top}"/>
    <rect x="70" y="58" width="12" height="30" rx="6" fill="${c.top}"/>
    <circle cx="24" cy="90" r="6" fill="${c.skin}"/>
    <circle cx="76" cy="90" r="6" fill="${c.skin}"/>
    <circle cx="50" cy="35" r="22" fill="${c.skin}"/>
    ${hairMarkup(c.hairStyle, c.hairColor)}
  </svg>`;
}

function defaultChar(id) {
  return {
    id: id || crypto.randomUUID(),
    name: '이름없는 작가',
    skin: SKINS[0],
    hairStyle: 'short',
    hairColor: HAIR_COLORS[0],
    top: TOP_COLORS[0],
    bottom: BOTTOM_COLORS[0]
  };
}

let myChar = JSON.parse(localStorage.getItem('myChar') || 'null');

/* ================= 작업 타이머 ================= */
let timerInterval = null;
let elapsed = parseInt(localStorage.getItem('sessionElapsed') || '0');
function fmt(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}
document.getElementById('timerDisplay').textContent = fmt(elapsed);

document.getElementById('startBtn').onclick = () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    elapsed++;
    localStorage.setItem('sessionElapsed', elapsed);
    document.getElementById('timerDisplay').textContent = fmt(elapsed);
  }, 1000);
  document.getElementById('startBtn').disabled = true;
  document.getElementById('pauseBtn').disabled = false;
};
document.getElementById('pauseBtn').onclick = () => {
  clearInterval(timerInterval); timerInterval = null;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
};
document.getElementById('resetBtn').onclick = () => {
  clearInterval(timerInterval); timerInterval = null;
  elapsed = 0;
  localStorage.setItem('sessionElapsed', 0);
  document.getElementById('timerDisplay').textContent = fmt(0);
  document.getElementById('startBtn').disabled = false;
  document.getElementById('pauseBtn').disabled = true;
};

/* ================= 뽀모도로 ================= */
const pomoToggle = document.getElementById('pomoToggle');
const pomoDisplay = document.getElementById('pomoDisplay');
const pomoStart = document.getElementById('pomoStart');
const pomoPause = document.getElementById('pomoPause');
let pomoInterval = null, pomoSeconds = 25 * 60, isFocus = true;

pomoToggle.checked = localStorage.getItem('pomoOn') === 'true';
[pomoDisplay, pomoStart, pomoPause].forEach(el => el.classList.toggle('hidden', !pomoToggle.checked));
pomoToggle.onchange = () => {
  localStorage.setItem('pomoOn', pomoToggle.checked);
  [pomoDisplay, pomoStart, pomoPause].forEach(el => el.classList.toggle('hidden', !pomoToggle.checked));
};
function renderPomo() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
  const s = String(pomoSeconds % 60).padStart(2, '0');
  pomoDisplay.textContent = `${m}:${s}`;
}
pomoStart.onclick = () => {
  if (pomoInterval) return;
  pomoInterval = setInterval(() => {
    pomoSeconds--;
    if (pomoSeconds < 0) {
      isFocus = !isFocus;
      pomoSeconds = (isFocus ? 25 : 5) * 60;
      alert(isFocus ? '휴식 끝, 다시 집중해볼까요?' : '집중 끝, 잠깐 쉬어가요');
    }
    renderPomo();
  }, 1000);
  pomoStart.disabled = true; pomoPause.disabled = false;
};
pomoPause.onclick = () => {
  clearInterval(pomoInterval); pomoInterval = null;
  pomoStart.disabled = false; pomoPause.disabled = true;
};
renderPomo();

/* ================= 방(Room) 렌더링 - 여러 명 동시 표시 ================= */
function renderRoom(presenceData) {
  const room = document.getElementById('roomArea');
  const users = Object.values(presenceData || {});
  document.getElementById('onlineCount').textContent = `${users.length}명 접속 중`;
  document.getElementById('roomEmpty').classList.toggle('hidden', users.length > 0);
  room.querySelectorAll('.avatar-item').forEach(el => el.remove());

  users.forEach(u => {
    const div = document.createElement('div');
    div.className = 'avatar-item';
    div.innerHTML = avatarSVG(u, 64) + `<span class="name">${u.name}</span>`;
    div.onclick = () => openCharPanel(u, myChar && u.id === myChar.id);
    room.appendChild(div);
  });
}

function updatePresence() {
  if (!myChar) return;
  const ref = db.ref('presence/' + myChar.id);
  ref.set({ ...myChar, at: Date.now() });
  ref.onDisconnect().remove();
}
db.ref('presence').on('value', snap => renderRoom(snap.val()));
if (myChar) updatePresence();

/* ================= 캐릭터 패널 (같은 화면 슬라이드) ================= */
const charPanel = document.getElementById('charPanel');
const overlay = document.getElementById('overlay');
const panelBody = document.getElementById('charPanelBody');

function closePanel() {
  charPanel.classList.remove('open');
  overlay.classList.add('hidden');
}
document.getElementById('closePanelBtn').onclick = closePanel;
overlay.onclick = closePanel;
document.getElementById('myCharBtn').onclick = () => openCharPanel(myChar || defaultChar(), true);

function openCharPanel(user, isMine) {
  charPanel.classList.add('open');
  overlay.classList.remove('hidden');

  if (!isMine) {
    panelBody.innerHTML = `
      <div class="char-preview">${avatarSVG(user, 110)}</div>
      <h3 style="text-align:center">${user.name}</h3>
      <p style="text-align:center;color:var(--text-light);font-size:13px">동료 작가예요</p>`;
    return;
  }

  const draft = { ...defaultChar(myChar?.id), ...(myChar || {}) };
  panelBody.innerHTML = `
    <div class="char-preview" id="previewBox">${avatarSVG(draft, 110)}</div>
    <input type="text" id="nameInput" class="name-input" placeholder="이름" value="${draft.name}">
    <p class="panel-section-title">피부색</p>
    <div class="swatch-row" data-key="skin"></div>
    <p class="panel-section-title">헤어 스타일</p>
    <div class="swatch-row" id="hairStyleRow"></div>
    <p class="panel-section-title">헤어 색상</p>
    <div class="swatch-row" data-key="hairColor"></div>
    <p class="panel-section-title">상의 색상</p>
    <div class="swatch-row" data-key="top"></div>
    <p class="panel-section-title">하의 색상</p>
    <div class="swatch-row" data-key="bottom"></div>
    <button id="saveCharBtn" class="btn" style="width:100%;margin-top:10px">저장</button>
  `;

  function buildSwatches(key, options) {
    const row = panelBody.querySelector(`.swatch-row[data-key="${key}"]`);
    options.forEach(color => {
      const s = document.createElement('span');
      s.className = 'swatch' + (draft[key] === color ? ' selected' : '');
      s.style.background = color;
      s.onclick = () => {
        draft[key] = color;
        row.querySelectorAll('.swatch').forEach(x => x.classList.remove('selected'));
        s.classList.add('selected');
        updatePreview();
      };
      row.appendChild(s);
    });
  }
  buildSwatches('skin', SKINS);
  buildSwatches('hairColor', HAIR_COLORS);
  buildSwatches('top', TOP_COLORS);
  buildSwatches('bottom', BOTTOM_COLORS);

  const styleRow = document.getElementById('hairStyleRow');
  HAIR_STYLES.forEach(style => {
    const b = document.createElement('span');
    b.className = 'style-btn' + (draft.hairStyle === style ? ' selected' : '');
    b.textContent = style === 'short' ? '단발' : style === 'long' ? '긴머리' : '묶음머리';
    b.onclick = () => {
      draft.hairStyle = style;
      styleRow.querySelectorAll('.style-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      updatePreview();
    };
    styleRow.appendChild(b);
  });

  function updatePreview() {
    document.getElementById('previewBox').innerHTML = avatarSVG(draft, 110);
  }

  document.getElementById('saveCharBtn').onclick = () => {
    draft.name = document.getElementById('nameInput').value.trim() || '이름없는 작가';
    myChar = draft;
    localStorage.setItem('myChar', JSON.stringify(myChar));
    updatePresence();
    closePanel();
  };
}

/* ================= 채팅 ================= */
db.ref('chat').limitToLast(50).on('value', snap => {
  const data = snap.val() || {};
  const box = document.getElementById('chatBox');
  box.innerHTML = '';
  Object.values(data).forEach(m => {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<b>${m.name}</b>: ${m.text}`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
});

document.getElementById('sendChatBtn').onclick = sendChat;
document.getElementById('chatInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendChat();
});
function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  if (!myChar) { alert('먼저 내 캐릭터를 만들어주세요.'); return; }
  db.ref('chat').push({ name: myChar.name, text, at: Date.now() });
  input.value = '';
}

/* ================= 음성 / 화면 공유 ================= */
const mediaToggle = document.getElementById('mediaToggle');
const voiceBtn = document.getElementById('voiceBtn');
const screenBtn = document.getElementById('screenBtn');
mediaToggle.checked = localStorage.getItem('mediaOn') === 'true';
[voiceBtn, screenBtn].forEach(el => el.classList.toggle('hidden', !mediaToggle.checked));
mediaToggle.onchange = () => {
  localStorage.setItem('mediaOn', mediaToggle.checked);
  [voiceBtn, screenBtn].forEach(el => el.classList.toggle('hidden', !mediaToggle.checked));
};

let peer = null, localStream = null;
function ensurePeer() {
  if (peer) return peer;
  peer = new Peer(myChar ? myChar.id : undefined);
  peer.on('call', call => {
    call.answer(localStream);
    call.on('stream', s => addRemoteVideo(call.peer, s));
  });
  return peer;
}
function addRemoteVideo(id, stream) {
  let v = document.getElementById('remote-' + id);
  if (!v) {
    v = document.createElement('video');
    v.id = 'remote-' + id;
    v.autoplay = true; v.playsInline = true;
    document.getElementById('remoteVideos').appendChild(v);
  }
  v.srcObject = stream;
}
function callAllOnline(stream) {
  db.ref('presence').once('value', snap => {
    const data = snap.val() || {};
    Object.keys(data).forEach(id => {
      if (myChar && id !== myChar.id) {
        const call = ensurePeer().call(id, stream);
        call.on('stream', s => addRemoteVideo(id, s));
      }
    });
  });
}
voiceBtn.onclick = async () => {
  if (!myChar) { alert('먼저 내 캐릭터를 만들어주세요.'); return; }
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  ensurePeer();
  callAllOnline(localStream);
};
screenBtn.onclick = async () => {
  if (!myChar) { alert('먼저 내 캐릭터를 만들어주세요.'); return; }
  localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  document.getElementById('localVideo').classList.remove('hidden');
  document.getElementById('localVideo').srcObject = localStream;
  ensurePeer();
  callAllOnline(localStream);
};
