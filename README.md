# Đảo Đèn Lồng — Phase 1

Game web góc nhìn thứ ba, chạy trên macOS/Linux bằng Node.js và Python 3, không cần thư viện ngoài.

## Chạy

1. Cài Node.js 18+ và Python 3.
2. `npm run build`
3. `python3 -m http.server 8000`, rồi mở http://localhost:8000

Trên Windows dùng `py -m http.server 8000`. Chạy game trên trình duyệt hiện đại.

## Điều khiển

WASD / phím mũi tên: đi; Space: nhảy; E: nạp đom đóm vào đèn gần nhất; Q: xung sáng; kéo chuột: xoay camera. Thu thập tối đa 5 đom đóm; mỗi đèn cần 3. Đom đóm +10, thắp đèn +100, làm choáng Bóng Mực +5, cộng điểm theo số giây và số ngọn lửa còn lại khi thắng.

## Headless

`node src/headless.js --seed 7 --night 1 --ticks 600 --out proof.jsonl`
Thêm `--scenario file.json`, `--inputs file.json` hoặc `--snapshot-every 10`. Đầu ra JSONL theo Test Contract 1.0; lỗi dữ liệu trả mã 2.

## Sáng tạo của tôi

Đom đóm có ánh vàng cam; ánh sáng toàn đảo tăng dần mỗi khi một Đèn Lồng Lớn được thắp. Bằng chứng hồi quy headless nằm trong `docs/proof/phase-1.md`.

## Giả định

Xem `docs/notes/phase-1-assumptions.md`. Thông tin MSSV/tên nhóm trong contract hiện để placeholder và cần thay trước khi nộp.
