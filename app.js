// ضع رابط الـ Apps Script Web App هنا:
const API_URL = "https://script.google.com/macros/s/AKfycby_e-8q0dy9TLC2pLcy0otMXXgsMp5Lwcu2yVMM3T3IRtxQPp4YPc3mBmE4KjXIE9v1AA/exec";

function saveSession(token) {
  localStorage.setItem("token", token);
}
function getToken() {
  return localStorage.getItem("token") || "";
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  msg.textContent = "جاري التحقق...";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password })
  });

  const data = await res.json();
  if (!data.ok) {
    msg.textContent = data.message || "خطأ في تسجيل الدخول";
    return;
  }

  saveSession(data.token);
  window.location.href = "./dashboard.html";
}

function protect() {
  if (!getToken()) window.location.href = "./index.html";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "./index.html";
}

async function loadRequests() {
  const token = getToken();
  const q = document.getElementById("q")?.value.trim() || "";
  const status = document.getElementById("status")?.value.trim() || "";
  const source = document.getElementById("source")?.value.trim() || "";

  const url = new URL(API_URL);
  url.searchParams.set("action", "getRequests");
  url.searchParams.set("token", token);
  if (q) url.searchParams.set("q", q);
  if (status) url.searchParams.set("status", status);
  if (source) url.searchParams.set("source", source);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!data.ok) {
    alert("غير مصرح. سجل دخول مرة ثانية.");
    logout();
    return;
  }

  const tbody = document.getElementById("tbody");
  const count = document.getElementById("count");
  tbody.innerHTML = "";

  data.data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name ?? ""}</td>
      <td>${item.nationalId ?? ""}</td>
      <td>${item.duration ?? ""}</td>
      <td>${item.expiry ?? ""}</td>
      <td><span class="badge bg-info text-dark">${item.status ?? ""}</span></td>
      <td>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" data-row="${item.rowNumber}">
            <option ${item.status==="جديد"?"selected":""}>جديد</option>
            <option ${item.status==="تحت الإجراء"?"selected":""}>تحت الإجراء</option>
            <option ${item.status==="مكتمل"?"selected":""}>مكتمل</option>
            <option ${item.status==="مرفوض"?"selected":""}>مرفوض</option>
          </select>
          <button class="btn btn-sm btn-success" onclick="saveStatus(${item.rowNumber}, this)">حفظ</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  count.textContent = `عدد الطلبات: ${data.data.length}`;
}

async function saveStatus(rowNumber, btn) {
  const token = getToken();
  const select = document.querySelector(`select[data-row="${rowNumber}"]`);
  const newStatus = select.value;

  btn.disabled = true;
  btn.textContent = "جاري...";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateStatus", token, rowNumber, newStatus })
  });

  const data = await res.json();

  btn.disabled = false;
  btn.textContent = "حفظ";

  if (!data.ok) {
    alert(data.message || "فشل الحفظ");
    return;
  }

  loadRequests();
}
