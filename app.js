// ✅ ضع رابط Apps Script Web App هنا فقط (بدون parameters)
const API_URL = "https://script.google.com/macros/s/AKfycbwWWPhS53amwIR50R3jWu9oqrwHhOAA738Mo_Qk2aHmxJgEAJAzZB3E-Bg_e6IRKClbmg/exec";

/*************** SESSION ***************/
function setToken(token) { localStorage.setItem("token", token); }
function getToken() { return localStorage.getItem("token") || ""; }
function logout() { localStorage.removeItem("token"); window.location.href = "./index.html"; }

function protect() {
  if (!getToken()) window.location.href = "./index.html";
}

/*************** LOGIN ***************/
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");
  msg.textContent = "جاري التحقق...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password })
    });

    const data = await res.json();

    if (!data.ok) {
      msg.textContent = data.message || "فشل تسجيل الدخول";
      return;
    }

    setToken(data.token);
    window.location.href = "./dashboard.html";
  } catch (err) {
    console.error(err);
    msg.textContent = "خطأ اتصال (تحقق من API_URL أو النشر)";
  }
}

/*************** LOAD REQUESTS ***************/
async function loadRequests() {
  const token = getToken();
  const q = document.getElementById("q").value.trim();
  const status = document.getElementById("status").value.trim();

  const url = new URL(API_URL);
  url.searchParams.set("action", "getRequests");
  url.searchParams.set("token", token);
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url.toString());
  const data = await res.json();

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

/*************** UPDATE STATUS ***************/
async function saveStatus(rowNumber) {
  const token = getToken();
  const select = document.querySelector(`select[data-row="${rowNumber}"]`);
  const newStatus = select.value;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateStatus", token, rowNumber, newStatus })
  });

  const data = await res.json();
  if (!data.ok) {
    alert(data.message || "فشل التحديث");
    return;
  }

  loadRequests();
}
