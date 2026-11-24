# shorten-lemo-opuscar — Crayon Book Video Studio

Công cụ dựng video kể chuyện phong cách **Crayon Picture Book** (*Sách tranh sáp màu*) hoàn toàn bằng code, được tinh gọn riêng cho quy trình sản xuất video của bạn (nền tảng từ `lemo-opuscar` — giữ lại toàn bộ công nghệ render WebGL2 sáp màu + màu nước *wax resist*, giọng đọc TTS, bộ 18 nhạc cụ CC0 sách tranh và master âm thanh −14 LUFS).

## Giao diện Web Studio tương tác (Không cần AI Agent)

Chạy máy chủ cục bộ để mở trình dựng video trực quan ngay trên trình duyệt:

```sh
npm run studio
```

Sau đó mở trình duyệt tại **http://127.0.0.1:4173/studio/** để:
- **✨ Tự động dựng video từ Kịch bản (`✨ Từ kịch bản`)**: Dán trực tiếp kịch bản hội thoại EN/VI (có 🐶 Little Dog, 🐱 Tabby Cat, 🐺 Gray Wolf, 👦 Leo, 👧 Maya...) → hệ thống tự phân vai giọng đọc (Song ngữ EN → VI, Chỉ EN offline hoặc Chỉ VI), tự đạo diễn dáng/biểu cảm/camera/thẻ từ vựng/nhạc CC0/foley và xuất thẳng ra file MP4 chuẩn `−14 LUFS` chỉ với 1 nút bấm.
- Chọn hoặc tạo mới/nhân bản dự án video trong `films/<ten-phim>/`.
- Sửa kịch bản lời thoại song ngữ EN–VI, thẻ từ vựng, chọn giọng đọc (Kokoro EN offline hoặc Edge-TTS VI/EN online).
- Kéo thả trực tiếp nhân vật, đạo cụ, tiêu đề và nhãn từ vựng trên khung hình WebGL2 sáp màu thật; xoay góc nhìn & bắt keyframe camera; đổi nhanh khung hình `16:9 Ngang` (1920×1080) ↔ `9:16 Dọc` (1080×1920).
- Tua và kéo thanh thời gian 4 track (Nhân vật, Thẻ từ, Phụ đề, Im lặng) kèm phát âm thanh đồng bộ.
- Chỉnh 12 màu sáp, bật/tắt lớp màu nước wax-resist, chọn giai điệu nhạc CC0 & độ lớn từng nhạc cụ.
- Bấm 1 nút để tạo giọng TTS, phối nhạc & foley, chạy kiểm tra tốc độ đọc (`readcheck`) và xuất file MP4 chuẩn `−14 LUFS`.

## Cấu trúc thư mục

```text
.
├── engine/                     # Engine WebGL2 sáp màu dùng chung, thư viện 15 nhân vật/đạo cụ, bộ sinh nhạc/mix dữ liệu
├── studio/                     # Giao diện Web Studio 3 vùng (index.html, app.js, styles.css) & server cục bộ (server.mjs)
├── core/
│   ├── lib.js                  # Hàm easing, seeded hash/noise
│   ├── render/                 # Render frame-by-frame (Playwright), readcheck, sheet, srt, mux (-14 LUFS)
│   ├── tts/                    # Kokoro offline (EN), edge-tts online (VI/đa ngôn ngữ), Whisper ASR check
│   └── audio/                  # sampler.py (18 nhạc cụ CC0 sách tranh), sfx.py (foley thủ tục)
├── styles/
│   └── crayon-book/            # Đặc tả phong cách chuẩn (STYLE.md) & tham khảo kỹ thuật engine
├── films/
│   └── one-little-seed/        # Phim mẫu hoàn chỉnh đầu tiên (tương thích Web Studio qua project.json)
├── DIRECTOR.md                 # Quy chuẩn đạo diễn (nhịp điệu, camera, âm thanh, tự kiểm tra)
├── TECHNIQUE.md                # Pipeline kỹ thuật render / âm thanh / phụ đề
├── AGENTS.md                   # Hướng dẫn ngắn gọn cho AI coding agent khi dựng video mới
└── LICENSE & LICENSES/         # Giấy phép mã nguồn & tài nguyên gốc
```

## 18 nhạc cụ CC0 có sẵn (`core/audio/instruments/`)
- **Gảy**: `ukulele`, `guitar_nylon`, `kalimba`
- **Hơi / Gỗ**: `recorder`, `ocarina`, `flute`, `flute_stac`, `clarinet`, `clarinet_stac`, `bassoon`, `bassoon_stac`
- **Gõ giai điệu & bộ gõ nhẹ**: `glockenspiel`, `xylophone`, `marimba`, `hand_chimes`, `woodblock`, `shaker`, `triangle`

## Lệnh dựng nhanh cho mỗi tập phim mới (`films/<ten-phim>/`)

```sh
# 1. Tạo giọng đọc tiếng Anh (Kokoro offline) và kiểm tra khớp lời Whisper
.venv/bin/python core/tts/tts.py films/<ten-phim>/lines.json films/<ten-phim>/voices
.venv/bin/python core/tts/asr_check.py films/<ten-phim>/lines.json films/<ten-phim>/voices --lang en

#    (Hoặc giọng tiếng Việt / song ngữ online qua Microsoft edge-tts)
.venv/bin/python core/tts/tts_zh.py films/<ten-phim>/lines.json films/<ten-phim>/voices --voice vi-VN-HoaiMyNeural

# 2. Xuất timeline & kiểm tra thời lượng đọc chữ
node core/render/events.mjs films/<ten-phim>
node core/render/readcheck.mjs films/<ten-phim>

# 3. Render thử khung hình tĩnh / model sheet / contact sheet
node core/render/still.mjs films/<ten-phim> 0.5 --q "test=model&page=leo"
node core/render/still.mjs films/<ten-phim> --range 0.5:55.5:2 --out films/<ten-phim>/stills/cs
.venv/bin/python core/render/sheet.py films/<ten-phim>/stills/contact_sheet.jpg films/<ten-phim>/stills/cs/*.jpg --cols 4

# 4. Soạn nhạc, trộn foley + voice, render 24 fps & master -14 LUFS
.venv/bin/python films/<ten-phim>/music/score.py
.venv/bin/python films/<ten-phim>/mix.py
node core/render/video.mjs films/<ten-phim> --fps 24 --workers 4 --out films/<ten-phim>/out/video.mp4
sh core/render/mux.sh films/<ten-phim>/out/video.mp4 films/<ten-phim>/out/mix.wav films/<ten-phim>/<ten-phim>.mp4 24 0
```

> Trên Windows, chạy các script `.sh` thông qua Git Bash (`"C:\Program Files\Git\bin\sh.exe"`).
