const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const navigation = document.querySelector("[data-navigation]");
const year = document.querySelector("[data-year]");
const registrationDialog = document.querySelector("[data-registration-dialog]");
const registrationForm = document.querySelector("[data-registration-form]");
const registrationSuccess = document.querySelector("[data-registration-success]");
const openRegistrationButtons = document.querySelectorAll("[data-open-preregister]");
const closeRegistrationButtons = document.querySelectorAll("[data-close-preregister]");
const roleField = registrationForm?.elements.namedItem("role");
const gymField = document.querySelector("[data-gym-field]");
const gymNameInput = registrationForm?.elements.namedItem("gymName");
const formStartedAt = document.querySelector("[data-form-started-at]");
const formStatus = document.querySelector("[data-form-status]");
const submitLabel = document.querySelector("[data-submit-label]");
const submitLoader = document.querySelector("[data-submit-loader]");
const trackingCode = document.querySelector("[data-tracking-code]");

const apiBaseUrl = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:8787"
  : "https://gordyar-preregistration-api.shafie391.workers.dev";

const syncHeader = () => {
  header?.classList.toggle("scrolled", window.scrollY > 24);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const isOpen = navigation?.classList.toggle("open") ?? false;
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

if (year) year.textContent = new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(new Date().getFullYear());

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

const digitMap = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const normalizeDigits = (value) =>
  String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => digitMap[digit] ?? digit);

const setGymFieldVisibility = () => {
  const isGymOwner = roleField?.value === "gym_owner";
  if (gymField) gymField.hidden = !isGymOwner;
  if (gymNameInput) {
    gymNameInput.required = isGymOwner;
    if (!isGymOwner) gymNameInput.value = "";
  }
};

const clearFormErrors = () => {
  registrationForm?.querySelectorAll(".field.is-invalid").forEach((field) => field.classList.remove("is-invalid"));
  registrationForm?.querySelectorAll("[data-error-for]").forEach((error) => {
    error.textContent = "";
  });
  if (formStatus) formStatus.textContent = "";
};

const showFieldError = (name, message) => {
  const error = registrationForm?.querySelector(`[data-error-for="${name}"]`);
  const input = registrationForm?.elements.namedItem(name);
  error?.closest(".field")?.classList.add("is-invalid");
  if (error) error.textContent = message;
  input?.setAttribute?.("aria-invalid", "true");
};

const validateRegistration = (values) => {
  const errors = {};
  const mobile = normalizeDigits(values.mobile).replace(/\D/g, "");

  if (!values.role) errors.role = "نوع درخواست را انتخاب کنید.";
  if (values.fullName.trim().length < 3) errors.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
  if (!/^09\d{9}$/.test(mobile)) errors.mobile = "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.";
  if (!values.province) errors.province = "استان را انتخاب کنید.";
  if (values.city.trim().length < 2) errors.city = "نام شهرستان را وارد کنید.";
  if (values.role === "gym_owner" && values.gymName.trim().length < 2) {
    errors.gymName = "نام باشگاه را وارد کنید.";
  }
  if (!values.consent) errors.consent = "برای ثبت درخواست، تأیید این گزینه لازم است.";

  return { errors, mobile };
};

const setSubmitting = (submitting) => {
  const button = registrationForm?.querySelector('button[type="submit"]');
  if (button) button.disabled = submitting;
  if (submitLabel) submitLabel.textContent = submitting ? "در حال ثبت..." : "ثبت پیش‌ثبت‌نام";
  if (submitLoader) submitLoader.hidden = !submitting;
};

const resetRegistrationDialog = () => {
  registrationForm?.reset();
  clearFormErrors();
  setSubmitting(false);
  setGymFieldVisibility();
  if (registrationForm) registrationForm.hidden = false;
  if (registrationSuccess) registrationSuccess.hidden = true;
};

const openRegistrationDialog = () => {
  resetRegistrationDialog();
  if (formStartedAt) formStartedAt.value = String(Date.now());
  registrationDialog?.showModal();
  window.setTimeout(() => roleField?.focus(), 80);
};

openRegistrationButtons.forEach((button) => button.addEventListener("click", openRegistrationDialog));
closeRegistrationButtons.forEach((button) => {
  button.addEventListener("click", () => registrationDialog?.close());
});

registrationDialog?.addEventListener("click", (event) => {
  if (event.target === registrationDialog) registrationDialog.close();
});

roleField?.addEventListener("change", setGymFieldVisibility);

registrationForm?.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return;
  input.removeAttribute("aria-invalid");
  const error = registrationForm.querySelector(`[data-error-for="${input.name}"]`);
  error?.closest(".field")?.classList.remove("is-invalid");
  if (error) error.textContent = "";
});

registrationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormErrors();

  const formData = new FormData(registrationForm);
  const values = {
    role: String(formData.get("role") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    mobile: String(formData.get("mobile") ?? ""),
    province: String(formData.get("province") ?? ""),
    city: String(formData.get("city") ?? "").trim(),
    gymName: String(formData.get("gymName") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    website: String(formData.get("website") ?? ""),
    formStartedAt: Number(formData.get("formStartedAt") ?? Date.now()),
    consent: formData.get("consent") === "true",
  };
  const { errors, mobile } = validateRegistration(values);

  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([name, message]) => showFieldError(name, message));
    registrationForm.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  setSubmitting(true);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${apiBaseUrl}/v1/pre-registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, mobile, source: "landing" }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (result.fields) {
        Object.entries(result.fields).forEach(([name, message]) => showFieldError(name, message));
      }
      throw new Error(result.message || "ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.");
    }

    if (trackingCode) trackingCode.textContent = result.trackingCode || "GORDYAR";
    if (registrationForm) registrationForm.hidden = true;
    if (registrationSuccess) registrationSuccess.hidden = false;
  } catch (error) {
    if (formStatus) {
      formStatus.textContent =
        error.name === "AbortError"
          ? "ارتباط با سامانه طول کشید. اتصال اینترنت را بررسی و دوباره تلاش کنید."
          : error.message || "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
    }
  } finally {
    window.clearTimeout(timeout);
    setSubmitting(false);
  }
});
