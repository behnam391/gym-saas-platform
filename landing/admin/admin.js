const loginSection = document.querySelector("[data-admin-login]");
const contentSection = document.querySelector("[data-admin-content]");
const loginForm = document.querySelector("[data-admin-login-form]");
const loginMessage = document.querySelector("[data-admin-login-message]");
const rowsContainer = document.querySelector("[data-registration-rows]");
const loadingState = document.querySelector("[data-admin-loading]");
const emptyState = document.querySelector("[data-admin-empty]");
const totalCount = document.querySelector("[data-total-count]");
const searchInput = document.querySelector("[data-search]");
const roleFilter = document.querySelector("[data-role-filter]");
const exportButton = document.querySelector("[data-export]");
const logoutButton = document.querySelector("[data-logout]");

const apiBaseUrl = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:8787"
  : "https://gordyar-preregistration-api.shafie391.workers.dev";
const roleLabels = {
  gym_owner: "مدیر باشگاه",
  athlete: "ورزشکار",
  coach: "مربی",
  nutritionist: "مشاور تغذیه",
  partner: "همکار تجاری",
};

let adminToken = "";
let registrations = [];

const toPersianNumber = (value) => new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);
const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(`${value.replace(" ", "T")}Z`),
  );
};

const createCell = (text, className = "") => {
  const cell = document.createElement("td");
  cell.textContent = text || "—";
  if (className) cell.className = className;
  return cell;
};

const renderRows = () => {
  const query = searchInput.value.trim().toLowerCase();
  const selectedRole = roleFilter.value;
  const filtered = registrations.filter((item) => {
    const searchable = `${item.full_name} ${item.mobile} ${item.province} ${item.city} ${item.gym_name || ""}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!selectedRole || item.role === selectedRole);
  });

  rowsContainer.replaceChildren();
  filtered.forEach((item) => {
    const row = document.createElement("tr");
    const applicant = document.createElement("td");
    const applicantContent = document.createElement("span");
    const mobile = document.createElement("small");
    applicant.className = "applicant-cell";
    applicantContent.textContent = item.full_name;
    mobile.textContent = item.mobile;
    applicant.append(applicantContent, mobile);

    const role = document.createElement("td");
    const rolePill = document.createElement("span");
    rolePill.className = "role-pill";
    rolePill.textContent = roleLabels[item.role] || item.role;
    role.append(rolePill);

    row.append(
      applicant,
      role,
      createCell(`${item.province}، ${item.city}`),
      createCell(item.gym_name),
      createCell(item.tracking_code, "tracking-cell"),
      createCell(formatDate(item.created_at)),
    );
    rowsContainer.append(row);
  });

  totalCount.textContent = toPersianNumber(filtered.length);
  emptyState.hidden = filtered.length > 0;
};

const loadRegistrations = async () => {
  loadingState.hidden = false;
  emptyState.hidden = true;
  try {
    const response = await fetch(`${apiBaseUrl}/v1/admin/pre-registrations?limit=200`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (response.status === 401) throw new Error("رمز مدیریت صحیح نیست.");
    if (!response.ok) throw new Error("دریافت اطلاعات انجام نشد.");
    const result = await response.json();
    registrations = result.items || [];
    loginSection.hidden = true;
    contentSection.hidden = false;
    renderRows();
  } catch (error) {
    adminToken = "";
    loginMessage.textContent = error.message;
  } finally {
    loadingState.hidden = true;
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const button = loginForm.querySelector("button");
  adminToken = new FormData(loginForm).get("token")?.toString().trim() || "";
  if (!adminToken) return;
  button.disabled = true;
  button.textContent = "در حال بررسی...";
  await loadRegistrations();
  button.disabled = false;
  button.textContent = "ورود به فهرست";
});

searchInput.addEventListener("input", renderRows);
roleFilter.addEventListener("change", renderRows);

logoutButton.addEventListener("click", () => {
  adminToken = "";
  registrations = [];
  loginForm.reset();
  rowsContainer.replaceChildren();
  contentSection.hidden = true;
  loginSection.hidden = false;
});

exportButton.addEventListener("click", async () => {
  exportButton.disabled = true;
  exportButton.textContent = "در حال آماده‌سازی...";
  try {
    const response = await fetch(`${apiBaseUrl}/v1/admin/export.csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!response.ok) throw new Error("ساخت خروجی انجام نشد.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gordyar-preregistrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    window.alert(error.message);
  } finally {
    exportButton.disabled = false;
    exportButton.textContent = "دریافت فایل Excel";
  }
});
