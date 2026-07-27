const ALLOWED_ORIGINS = new Set([
  "https://gordyar.ir",
  "http://gordyar.ir",
  "https://www.gordyar.ir",
  "http://www.gordyar.ir",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const VALID_ROLES = new Set(["gym_owner", "athlete", "coach", "nutritionist", "partner"]);
const MAX_BODY_SIZE = 16_384;
const RATE_LIMIT_PER_HOUR = 10;

const roleLabels = {
  gym_owner: "مدیر باشگاه",
  athlete: "ورزشکار",
  coach: "مربی",
  nutritionist: "مشاور تغذیه",
  partner: "همکار تجاری",
};

const json = (data, status = 200, origin = "") =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    },
  });

const corsHeaders = (origin) => ({
  ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const normalizeDigits = (value) => {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)));
};

const cleanText = (value, maxLength) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const validatePayload = (input) => {
  const payload = {
    role: cleanText(input.role, 30),
    fullName: cleanText(input.fullName, 80),
    mobile: normalizeDigits(input.mobile).replace(/\D/g, "").slice(0, 11),
    province: cleanText(input.province, 60),
    city: cleanText(input.city, 60),
    gymName: cleanText(input.gymName, 100),
    message: cleanText(input.message, 500),
    source: cleanText(input.source, 30) || "landing",
    website: cleanText(input.website, 100),
    consent: input.consent === true,
    formStartedAt: Number(input.formStartedAt),
  };
  const fields = {};

  if (!VALID_ROLES.has(payload.role)) fields.role = "نوع درخواست معتبر نیست.";
  if (payload.fullName.length < 3) fields.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
  if (!/^09\d{9}$/.test(payload.mobile)) fields.mobile = "شماره موبایل معتبر نیست.";
  if (payload.province.length < 2) fields.province = "استان را انتخاب کنید.";
  if (payload.city.length < 2) fields.city = "شهرستان را وارد کنید.";
  if (payload.role === "gym_owner" && payload.gymName.length < 2) fields.gymName = "نام باشگاه را وارد کنید.";
  if (!payload.consent) fields.consent = "تأیید رضایت برای ثبت درخواست لازم است.";

  const elapsed = Date.now() - payload.formStartedAt;
  if (!Number.isFinite(elapsed) || elapsed < 1_200 || elapsed > 86_400_000) {
    fields.form = "زمان ارسال فرم معتبر نیست. صفحه را تازه‌سازی کنید.";
  }

  return { payload, fields };
};

const randomTrackingCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `GY-${new Date().getUTCFullYear()}-${suffix}`;
};

const sha256 = async (value) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const enforceRateLimit = async (request, env) => {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const hour = new Date().toISOString().slice(0, 13);
  const bucket = await sha256(`${ip}:${hour}:${env.RATE_LIMIT_SALT || "gordyar"}`);
  const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO request_limits (bucket, request_count, expires_at)
     VALUES (?1, 1, ?2)
     ON CONFLICT(bucket) DO UPDATE SET request_count = request_count + 1
     RETURNING request_count`,
  )
    .bind(bucket, expiresAt)
    .first();

  if (Math.random() < 0.02) {
    await env.DB.prepare("DELETE FROM request_limits WHERE expires_at < ?1")
      .bind(new Date().toISOString())
      .run();
  }

  return Number(row?.request_count ?? 1) <= RATE_LIMIT_PER_HOUR;
};

const register = async (request, env, origin) => {
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ message: "مبدأ درخواست مجاز نیست." }, 403, origin);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_SIZE) return json({ message: "حجم درخواست بیش از حد مجاز است." }, 413, origin);
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return json({ message: "نوع درخواست معتبر نیست." }, 415, origin);
  }
  if (!(await enforceRateLimit(request, env))) {
    return json({ message: "تعداد درخواست‌ها زیاد است. لطفاً یک ساعت دیگر تلاش کنید." }, 429, origin);
  }

  let input;
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) return json({ message: "حجم درخواست بیش از حد مجاز است." }, 413, origin);
    input = JSON.parse(rawBody);
  } catch {
    return json({ message: "اطلاعات ارسال‌شده قابل خواندن نیست." }, 400, origin);
  }

  const { payload, fields } = validatePayload(input);
  if (payload.website) {
    return json({ ok: true, trackingCode: randomTrackingCode() }, 201, origin);
  }
  if (Object.keys(fields).length) {
    return json({ message: "لطفاً موارد مشخص‌شده را اصلاح کنید.", fields }, 422, origin);
  }

  const existing = await env.DB.prepare(
    "SELECT tracking_code FROM preregistrations WHERE mobile = ?1 AND role = ?2",
  )
    .bind(payload.mobile, payload.role)
    .first();

  if (existing) {
    return json(
      {
        ok: true,
        duplicate: true,
        trackingCode: existing.tracking_code,
        message: "این شماره قبلاً برای همین نقش ثبت شده است.",
      },
      200,
      origin,
    );
  }

  const trackingCode = randomTrackingCode();
  try {
    await env.DB.prepare(
      `INSERT INTO preregistrations
       (tracking_code, full_name, mobile, role, province, city, gym_name, message, consent, source)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)`,
    )
      .bind(
        trackingCode,
        payload.fullName,
        payload.mobile,
        payload.role,
        payload.province,
        payload.city,
        payload.gymName || null,
        payload.message || null,
        payload.source,
      )
      .run();
  } catch (error) {
    if (String(error?.message).includes("UNIQUE")) {
      const duplicate = await env.DB.prepare(
        "SELECT tracking_code FROM preregistrations WHERE mobile = ?1 AND role = ?2",
      )
        .bind(payload.mobile, payload.role)
        .first();
      if (duplicate) return json({ ok: true, duplicate: true, trackingCode: duplicate.tracking_code }, 200, origin);
    }
    throw error;
  }

  return json({ ok: true, trackingCode, message: "پیش‌ثبت‌نام با موفقیت انجام شد." }, 201, origin);
};

const isAdmin = (request, env) => {
  if (!env.ADMIN_TOKEN) return false;
  const authorization = request.headers.get("Authorization") || "";
  return authorization === `Bearer ${env.ADMIN_TOKEN}`;
};

const listRegistrations = async (request, env, origin) => {
  if (!isAdmin(request, env)) return json({ message: "دسترسی غیرمجاز است." }, 401, origin);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 200);
  const before = Math.max(Number(url.searchParams.get("before")) || Number.MAX_SAFE_INTEGER, 1);
  const result = await env.DB.prepare(
    `SELECT id, tracking_code, full_name, mobile, role, province, city, gym_name, message, status, created_at
     FROM preregistrations
     WHERE id < ?1
     ORDER BY id DESC
     LIMIT ?2`,
  )
    .bind(before, limit)
    .all();

  return json(
    {
      items: result.results,
      nextBefore: result.results.length === limit ? result.results.at(-1)?.id : null,
    },
    200,
    origin,
  );
};

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const exportRegistrations = async (request, env, origin) => {
  if (!isAdmin(request, env)) return json({ message: "دسترسی غیرمجاز است." }, 401, origin);
  const result = await env.DB.prepare(
    `SELECT tracking_code, full_name, mobile, role, province, city, gym_name, message, status, created_at
     FROM preregistrations
     ORDER BY id DESC
     LIMIT 10000`,
  ).all();
  const headers = ["کد پیگیری", "نام", "موبایل", "نقش", "استان", "شهرستان", "باشگاه", "توضیحات", "وضعیت", "تاریخ ثبت"];
  const rows = result.results.map((row) =>
    [
      row.tracking_code,
      row.full_name,
      row.mobile,
      roleLabels[row.role] || row.role,
      row.province,
      row.city,
      row.gym_name,
      row.message,
      row.status,
      row.created_at,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = `\uFEFF${headers.map(csvCell).join(",")}\n${rows.join("\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gordyar-preregistrations.csv"',
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
    },
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "gordyar-preregistration" }, 200, origin);
      }
      if (request.method === "POST" && url.pathname === "/v1/pre-registrations") {
        return await register(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/v1/admin/pre-registrations") {
        return await listRegistrations(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/v1/admin/export.csv") {
        return await exportRegistrations(request, env, origin);
      }
      return json({ message: "مسیر موردنظر پیدا نشد." }, 404, origin);
    } catch (error) {
      console.error("Unhandled preregistration error", error);
      return json({ message: "خطای موقت در سامانه رخ داد. لطفاً دوباره تلاش کنید." }, 500, origin);
    }
  },
};
