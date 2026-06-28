# Agent Rules & Security Guidelines

## Security & Sensitive File Protection
1. **DILARANG KERAS MENGUNGGAH FILE SENSITIF**: Jangan pernah mengunggah, me-staging (`git add`), atau mengomite berkas rahasia seperti `.env`, `.env.production`, `.env.secrets`, `google-credentials.json`, Kunci Privat (Private Keys), Token API, atau sesi otentikasi WhatsApp/Telegram (`creds.json`) ke repositori GitHub atau remote manapun.
2. **Kepatuhan .gitignore**: Pastikan setiap berkas konfigurasi lokal atau berkas rahasia terdaftar secara eksplisit di dalam berkas `.gitignore`.
3. **Penyaringan Log (Redaction)**: Pastikan seluruh output logger atau pesan kesalahan menyaring (redact) kata sandi, token JWT, dan API key sebelum dicetak ke log.
