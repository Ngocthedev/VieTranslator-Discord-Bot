# Tài Liệu API - VieTranslator Bot v2.0

Ứng dụng cung cấp các HTTP Web API để tích hợp tính năng dịch vụ vào website và các nền tảng thứ ba. Mọi request mặc định chạy trên Port `3000`.

## 1. Xác thực (Authentication)
Trừ endpoint `GET /api/v1/status`, các API khác đều yêu cầu cấp Token để giao tiếp nhằm mục đích phân bổ băng thông (Limits). Bạn cần truyền khóa API vào Header của mỗi Request qua phương thức sau:

```http
Authorization: Bearer <API_KEY_CUA_BAN>
```
*Hoặc:*
```http
X-API-Key: <API_KEY_CUA_BAN>
```

---

## 2. Các Endpoints

### 2.1 Dịch Tệp (Translate File Content)
*Sử dụng để dịch các đoạn tệp cấu hình dài có định dạng (như yaml, json, properties, v.v).*

* **URL:** `/api/v1/translate`
* **Method:** `POST`
* **Body parameters (JSON):**
    * `content` (string, required): Nội dung toàn bộ nội dung text cần dịch.
    * `format` (string, optional): Định dạng dịch, ảnh hưởng đến cách AI xử lý ký tự đặc biệt. Hỗ trợ: `yaml` (mặc định), `json`, `properties`, `config`, `sk`, `text`.
    * `target_lang` (string, optional): Mặc định `vi`.
    * `user_id` (string, required): Mã nhận diện người dùng gọi API để giới hạn quota ngày/người dùng.

**Response (Thành công):**
```json
{
  "success": true,
  "data": {
    "translated": "Nội dung sau khi dịch...",
    "cached": false,
    "warnings": [
       "Chunk 3 (giữ nguyên tiếng Anh vì AI làm hỏng cấu trúc dòng)"
    ],
    "format": "yaml",
    "originalSize": 14022,
    "translatedSize": 13955,
    "translationTimeMs": 10542
  },
  "usage": {
    "remaining": 9,
    "limit": 10,
    "used": 1
  }
}
```
*Lưu ý: Nếu mảng `warnings` có dữ liệu, web chủ quản nên thông báo cho người dùng biết một số đoạn tiếng Anh bị giữ nguyên để bảo vệ an toàn cho cấu trúc file gốc.*

---

### 2.2 Dịch Cụm Từ (Translate Short Text)
*Dùng để dịch các tin nhắn hoặc câu chữ thông thường (giới hạn <5000 ký tự).*

* **URL:** `/api/v1/translate/text`
* **Method:** `POST`
* **Body parameters (JSON):**
    * `text` (string, required): Cụm văn bản cần dịch.
    * `user_id` (string, required): Mã nhận diện người dùng.

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "A sword forged in fire.",
    "translated": "Một thanh kiếm được rèn trong lửa.",
    "translationTimeMs": 1420
  },
  "usage": {
    "remaining": 9,
    "limit": 10,
    "used": 1
  }
}
```

---

### 2.3 Xem Trạng Thái Chung (Health Check)
*Kiểm tra xem hệ thống Bot AI có đang "sống", bao gồm tổng tỷ lệ hit-cache trên toàn server.*

* **URL:** `/api/v1/status`
* **Method:** `GET`
* **Authentication:** Không yêu cầu

**Response:**
```json
{
  "status": "online",
  "version": "2.0.0",
  "uptime": 125634,
  "stats": {
    "today": 145,
    "cache": {
      "entries": 52,
      "hitRate": "45%"
    }
  }
}
```

---

### 2.4 Xem Thông Tin Giới Hạn Của API Key
*Rút xuất chi tiết dung lượng và giới hạn được cấp cho API Key của Website đang cầm.*

* **URL:** `/api/v1/key/info`
* **Method:** `GET`

**Response:**
```json
{
  "success": true,
  "key": {
    "name": "Website Chính",
    "createdAt": "2026-04-01T00:00:00.000Z",
    "expiresAt": null,
    "isActive": true,
    "config": {
      "maxFileSize": 5242880,
      "dailyLimitPerUser": 10
    }
  },
  "usage": {
    "today": 4,
    "total": 124
  }
}
```

---

### 2.5 Kiểm Tra Quota Người Dùng
*Lọc thông tin cụ thể xem một End User còn được phép dùng Bot dịch bao nhiêu lượt nữa trong ngày.*

* **URL:** `/api/v1/user/:userId/usage`
* **Method:** `GET`

**Ví dụ URL:** `/api/v1/user/ZenCheap4048/usage`

**Response:**
```json
{
  "success": true,
  "userId": "ZenCheap4048",
  "usage": {
    "remaining": 8,
    "limit": 10,
    "used": 2
  },
  "detailed": {
    "requests": 2,
    "items": [
      {
        "timestamp": "2026-04-05T08:00:00.000Z",
        "format": "yaml",
        "contentSize": 1234
      }
    ]
  }
}
```
