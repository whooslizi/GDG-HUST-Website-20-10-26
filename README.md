# GDG-HUST-Website-20-10-26

girls plz keep your eyes away

```mermaid
flowchart TD
    %% 1. BAN TỔ CHỨC Ở TRÊN CÙNG
    subgraph G1 ["1. Ban Tổ Chức Chuẩn Bị (Dashboard)"]
        direction TB
        A1["Nhập danh sách Nam (Nhóm) & Nữ"] --> A2["Soạn 5 câu hỏi Đúng/Sai hoặc 1 trong 4"]
        A2 --> A3["Xem trước Preview HTML Email"]
        A3 --> A4["Bấm nút Gửi Email Tự Động (Nodemailer)"]
    end

    A4 -->|Email: /boy?token=...| B1
    A4 -->|Email: /play?token=...| C1

    subgraph TWO_COLUMNS [" "]
        direction LR

        %% CỘT TRÁI: BẠN NAM
        subgraph G2 ["2. Phía Các Bạn Nam (/boy?token=...)"]
            direction TB
            B1["Nhận email & mở web ở nhà"] --> B2["Xem bạn nữ được phân công"]
            B2 --> B3["Tự tay viết lời chúc ấm áp"]
            B3 --> B4["Giữ Secret_Code để đọc offline"]
        end

        %% CỘT PHẢI: BẠN NỮ
        subgraph G3 ["3. Phía Bạn Nữ (/play?token=...)"]
            direction TB
            C1["Nhận email & mở minigame"] --> C2["Giải 5 câu hỏi Đúng/Sai hoặc 1/4"]
            C2 --> C3{"Kiểm tra đáp án"}
            C3 -->|Sai 1 lần| C4["Báo đỏ, cho chọn lại"]
            C3 -->|Sai 2 lần| C5["Thử thách phạt / Trợ giúp để qua"]
            C4 --> C2
            C5 --> C6["Thu thập manh mối về nhóm Nam"]
            C3 -->|Đúng| C6
        end
    end

    %% 4. KẾT HỢP OFFLINE Ở DƯỚI CÙNG
    subgraph G4 ["4. Tương Tác Thực Tế & Mở Quà (Offline)"]
        direction TB
        D1["Bạn Nữ đi tìm nhóm Bạn Nam ngoài đời"] --> D2["Nữ điền Secret_Code vào web"]
        D2 --> D3{"Mã chính xác?"}
        D3 -->|Đúng| D4["Mở Thư"]
        D4 --> D5["Các bạn Nam trao quà tận tay!"]
        D5 --> D6["Lưu trạng thái COMPLETED (F5 không mất)"]
        D3 -->|Sai| D7["Báo sai -> Nhập lại"]
        D7 --> D2
    end

    C6 --> D1
    B4 -.->|Nam đọc mã cho Nữ| D2
```

## Architecture & Files

| File / Path | Purpose |
| --- | --- |
| src/routes/__root.tsx | Root layout, header, and global providers |
| src/routes/index.tsx | Main page with interactive wish tree |
| src/routes/boy.tsx | Boy portal to write wishes and generate secret codes |
| src/routes/play.tsx | Girl quiz minigame page |
| src/routes/dashboard.tsx | Organizer dashboard for rosters, quiz configs, email previews |
| src/features/wish-garden/ViralTree2010.tsx | SVG wish tree renderer and animations |
| src/features/wish-garden/WishGarden.tsx | Wish garden controller and token handler |
| src/features/wish-garden/BoyWishPage.tsx | Wish writing view |
| src/features/wish-garden/BoyWishComposerModal.tsx | Wish creation modal |
| src/features/wish-garden/SecretCodeModal.tsx | Secret code input modal |
| src/features/wish-garden/WishLetterRevealModal.tsx | Unlocked letter viewer modal |
| src/features/quiz/QuizPlay.tsx | Minigame logic and question transitions |
| src/features/admin/Dashboard.tsx | Admin management panel |
| src/services/app-database.ts | Database client (Supabase sync with localStorage fallback) |
| src/services/email-template.ts | Email generator and CSV/JSON roster exports |
| src/services/supabase.ts | Supabase client initialization |
| supabase/setup.sql | Database schema, tables, public RLS policies, replication |
| .github/workflows/deploy.yml | GitHub Actions build and Pages deployment workflow |
| vite.config.ts | Vite build config and static environment variable bindings |

## Build from GitHub Pages (Supabase)

1. Run `supabase/setup.sql` in your Supabase project SQL Editor.
2. In GitHub repo Settings > Secrets and variables > Actions, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
3. Push to `main` to trigger automatic build and deploy.

## Build Locally (npm)

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev

# Run tests, typecheck, lint
npm test
npm run typecheck
npm run lint

# Build for production
npm run build
```
