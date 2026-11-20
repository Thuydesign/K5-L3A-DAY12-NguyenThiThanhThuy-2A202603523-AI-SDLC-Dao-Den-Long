# Đảo Đèn Lồng — v1.0.0

Game sinh tồn 3D chạy trên trình duyệt. Giữ đủ đèn sáng tới bình minh; dầu đèn cạn dần, còn Bóng Mực có thể hút dầu ở đèn yếu. Node.js 18+ là yêu cầu duy nhất; không cần cài thư viện ngoài. Đã tham chiếu trên Windows 10/11 và Firefox/Chromium hiện đại.

![Ảnh benchmark Canvas 2D](docs/demo/bench.png)

## Chạy game

```sh
npm start
```

Mở http://127.0.0.1:8000. Máy sạch: cài Node.js 18+, giải nén/clone repo, chạy `npm start`, mở URL trên. Leaderboard được lưu trong `data/leaderboard.json`.

## Điều khiển và trợ năng

Mặc định: WASD/mũi tên di chuyển, Space nhảy, Shift lướt, E tương tác, Q Tỏa Sáng, Esc tạm dừng. Tùy chỉnh phím, màu dễ phân biệt, giảm chuyển động, chữ lớn và xem bảng xếp hạng trong menu. Có chỉ báo trực quan cho Bóng Mực, gió, 10 giây cuối và dầu thấp. Giao diện có thể chơi ở 1280×720.

## Kiểm tra và chạy không giao diện

```sh
npm test
npm run build
node src/headless.js --seed 7 --night 2 --ticks 600 --out proof.jsonl
```

Các lệnh benchmark và soak đầy đủ (cần Firefox cài sẵn; có thể đặt biến `BROWSER` để chọn trình duyệt):

```sh
npm run bench -- --seed 42 --duration 30 --out bench.json
npm run soak -- --seed 7 --nights 10 --out soak.json
npm run demo:record
```

Benchmark dùng cửa sổ headless 1280×720, 200 Bóng Mực và 100 đom đóm; có 3 giây khởi động rồi đo đủ thời lượng yêu cầu. Firefox được cấu hình `gfx.vsync.force-disable`; trình duyệt không cung cấp RSS tiến trình cho JavaScript nên `peak_mem_mb` là `null`. Renderer là Canvas 2D, không dùng engine/native GPU API; FPS phụ thuộc máy. `bench.json` ghi kết quả đo tham khảo trên máy phát triển, không thay thế phép đo trên máy chấm. `soak.json` là kết quả chạy 10 Đêm cùng tiến trình.

Xuất bảng xếp hạng: `node src/server.js --export-leaderboard out.json`.

`npm run demo:record` cần Firefox và FFmpeg; lệnh quay gameplay trực tiếp kèm số liệu kiểm tra, rồi ghi `docs/demo/demo.mp4` (dưới 5 phút).

## Phát hành và tài liệu

Hợp đồng headless nằm ở `game.contract.json`; các quyết định Phase 3 trong `docs/adr/`; bằng chứng phase trong `docs/`. Nhật ký thay đổi: [CHANGELOG.md](CHANGELOG.md), ghi nhận nguồn nội dung: [CREDITS.md](CREDITS.md), giấy phép: [LICENSE](LICENSE). Phản tư bốn phase: [docs/RETRO.md](docs/RETRO.md).
