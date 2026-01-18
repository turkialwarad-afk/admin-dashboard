const API_URL = "https://script.google.com/macros/s/AKfycbyQsum5HIN7b3-U-bBAlkBjwi-0VgO7Mz6Bp4xfAFaU5Rc2p9dbbjeazh5XMcJ8695h-w/exec";

function setToken(token) { localStorage.setItem("token", token); }
function getToken() { return localStorage.getItem("token") || ""; }
function logout() { localStorage.removeItem("token"); window.location.href = "./index.html"; }
function protect() { if (!getToken()) window.location.href = "./index.html"; }

// ===== JSONP Helper =====
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Math.random().toString(36).slice(2);
    window[cbName] = (data) => {
      delete window[cbName];
      script.remove();
      resolve(data);
    };

    const script = document.createElement("script");
    script.src = url + (url.includes("?") ? "&" : "?") + "callback=" + cbName;
    script.onerror = () => reject(new Error("JSONP failed"));
    document.body.appendChild(script);
  });
}

// ===== LOGIN =====
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");
  msg.textContent = "جاري التحقق...";

  try {
    const url = `${API_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const data = await jsonp(url);

    if (!data.ok) {
      msg.textContent = data.message || "فشل تسجيل الدخول";
      return;
    }

    setToken(data.token);
    window.location.href = "./dashboard.html";
  } catch (e) {
    console.error(e);
    msg.textContent = "مشكلة اتصال";
  }
}

// ===== LOAD REQUESTS =====
async function loadRequests() {
  const token = getToken();
  const q = document.getElementById("q").value.trim();
  const status = document.getElementById("status").value.trim();

  let url = `${API_URL}?action=getRequests&token=${encodeURIComponent(token)}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;

  const data = await jsonp(url);

  if (!data.ok) {
    alert("انتهت الجلسة أو غير مصرح");
    logout();
    return;
  }

  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  data.data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.nationalId}</td>
      <td>${item.duration}</td>
      <td>${item.expiry}</td>
      <td><span class="badge bg-info text-dark">${item.status}</span></td>
      <td style="width:240px;">
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" data-row="${item.rowNumber}">
            <option ${item.status==="جديد"?"selected":""}>جديد</option>
            <option ${item.status==="تحت الإجراء"?"selected":""}>تحت الإجراء</option>
            <option ${item.status==="مكتمل"?"selected":""}>مكتمل</option>
            <option ${item.status==="مرفوض"?"selected":""}>مرفوض</option>
          </select>
          <button class="btn btn-sm btn-success" onclick="saveStatus(${item.rowNumber})">حفظ</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("count").textContent = `عدد الطلبات: ${data.data.length}`;
}

// ===== UPDATE STATUS =====
async function saveStatus(rowNumber) {
  const token = getToken();
  const select = document.querySelector(`select[data-row="${rowNumber}"]`);
  const newStatus = select.value;

  const url = `${API_URL}?action=updateStatus&token=${encodeURIComponent(token)}&rowNumber=${rowNumber}&newStatus=${encodeURIComponent(newStatus)}`;
  const data = await jsonp(url);

  if (!data.ok) {
    alert(data.message || "فشل التحديث");
    return;
  }

  loadRequests();
}
