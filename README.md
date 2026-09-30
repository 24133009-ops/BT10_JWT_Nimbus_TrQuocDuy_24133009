# BÀI TẬP VÍ DỤ JWT VỚI SPRING BOOT 3 & SPRING SECURITY 6
## SỬ DỤNG THƯ VIỆN NIMBUS JOSE + JWT THAY THẾ JJWT

---

### THÔNG TIN SINH VIÊN & HỌC PHẦN
* **Trường**: Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh (HCMUTE)
* **Khoa**: Công nghệ Thông tin
* **Môn học**: Lập trình Web (WEBPR330479)
* **Giảng viên hướng dẫn**: ThS. Nguyễn Hữu Trung
* **Sinh viên thực hiện**: **Trương Quốc Duy**
* **Mã số sinh viên (MSSV)**: **24133009**
* **Email sinh viên**: `24133009@student.hcmute.edu.vn`

---

## 1. TỔNG QUAN ĐỀ TÀI & YÊU CẦU

Dự án thực hiện bài tập ví dụ trong bài giảng **JSON Web Token (JWT) trên Spring Boot 3 – Security 6** của ThS. Nguyễn Hữu Trung.

### Điểm cải tiến cốt lõi theo yêu cầu:
Thay thế thư viện `io.jsonwebtoken` (JJWT) ở bài giảng bằng **Nimbus JOSE + JWT (`com.nimbusds:nimbus-jose-jwt`)** - thư viện Java chuẩn công nghiệp được sử dụng chính thức bên dưới Spring Security Resource Server, Spring Authorization Server, OAuth2 và OpenID Connect.

### Các tiêu chuẩn RFC tuân thủ:
* **RFC 7515 (JWS)**: JSON Web Signature - Ký số bảo vệ tính toàn vẹn của token bằng thuật toán đối xứng HMAC SHA-256 (`HS256`).
* **RFC 7519 (JWT)**: JSON Web Token - Chuẩn biểu diễn các claims an toàn dạng JSON.
* **RFC 7807**: Problem Details for HTTP APIs (Xử lý ngoại lệ bảo mật chuẩn hóa qua `ProblemDetail`).

---

## 2. SO SÁNH GIỮA JJWT VÀ NIMBUS JOSE + JWT

| Tiêu chí | JJWT (`io.jsonwebtoken`) | Nimbus JOSE + JWT (`com.nimbusds`) |
| :--- | :--- | :--- |
| **Phạm vi chuẩn** | Tập trung chủ yếu vào JWT | Hỗ trợ toàn diện bộ JOSE: JWS, JWE, JWK, JWKS, JWT |
| **Sự chấp nhận trong hệ sinh thái** | Dự án cộng đồng độc lập | Là thư viện nền tảng được Spring Security OAuth2 và OpenID Connect chính thức sử dụng |
| **Cơ chế ký (Sign)** | `Jwts.builder().signWith(...)` | Tách biệt rõ ràng: `JWSHeader` + `JWTClaimsSet` + `SignedJWT` + `JWSSigner` (ví dụ `MACSigner`) |
| **Cơ chế xác thực (Verify)** | `Jwts.parser().verifyWith(...)` | `SignedJWT.parse(token)` + `signedJWT.verify(new MACVerifier(key))` |
| **Kiểm soát chi tiết** | Trừu tượng hóa cao | Minh bạch từng tầng (Header, Payload/ClaimsSet, Signature), chuẩn RFC 7515 / 7519 |

---

## 3. KIẾN TRÚC VÀ CÁC THÀNH PHẦN HỆ THỐNG

### Cấu trúc thư mục mã nguồn:
```text
Bài 10/
├── pom.xml                               # Quản lý dependency & build (Spring Boot 3, Nimbus JWT)
├── mvnw & mvnw.cmd                       # Maven Wrapper hỗ trợ chạy dự án ngay lập tức
├── src/
│   ├── main/
│   │   ├── java/vn/iotstar/
│   │   │   ├── Jwtspringboot3Application.java    # Class khởi chạy Spring Boot
│   │   │   ├── configs/
│   │   │   │   ├── ApplicationConfiguration.java # Beans: PasswordEncoder, UserDetailsService, AuthProvider
│   │   │   │   ├── SecurityConfiguration.java    # Cấu hình Spring Security 6, CORS, Stateless Filter Chain
│   │   │   │   └── GlobalExceptionHandler.java   # Xử lý ngoại lệ tập trung (401, 403, 500)
│   │   │   ├── controllers/
│   │   │   │   ├── AuthenticationController.java # Endpoints: /auth/signup, /auth/login
│   │   │   │   ├── UserController.java           # Endpoints: /users/me, /users/ (Bảo vệ bằng JWT)
│   │   │   │   └── AuthController.java           # Controller trả về view Thymeleaf: /login, /user/profile
│   │   │   ├── entity/
│   │   │   │   └── User.java                     # Entity Người dùng implements UserDetails
│   │   │   ├── filter/
│   │   │   │   └── JwtAuthenticationFilter.java  # OncePerRequestFilter bắt Bearer Token và chứng thực
│   │   │   ├── models/
│   │   │   │   ├── LoginResponse.java            # DTO trả về token và thời hạn expiresIn
│   │   │   │   ├── LoginUserModel.java           # DTO nhận email & password đăng nhập
│   │   │   │   └── RegisterUserModel.java        # DTO nhận thông tin đăng ký tài khoản
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java           # JPA Repository truy vấn User theo email
│   │   │   └── services/
│   │   │       ├── AuthenticationService.java    # Logic nghiệp vụ đăng ký & đăng nhập
│   │   │       ├── JwtService.java               # THAY THẾ BẰNG NIMBUS JOSE + JWT
│   │   │       └── UserService.java              # Lấy danh sách toàn bộ người dùng
│   │   └── resources/
│   │       ├── application.properties            # Cấu hình SQL Server / MySQL & Secret Key
│   │       ├── application-mysql.properties      # Cấu hình riêng cho MySQL (Slide 21)
│   │       ├── static/
│   │       │   ├── js/mainjs.js                  # AJAX gọi API REST với Bearer Token
│   │       │   └── images/                       # Thư mục chứa avatar (default-avatar.png, u1.jpg)
│   │       └── templates/
│   │           ├── login.html                    # Giao diện Đăng nhập / Đăng ký hiện đại
│   │           └── profile.html                  # Giao diện xem thông tin cá nhân qua AJAX
│   └── test/
│       ├── java/vn/iotstar/
│       │   ├── JwtServiceNimbusTest.java         # 7 Unit Tests kiểm thử toàn diện Nimbus JOSE
│       │   └── Jwtspringboot3ApplicationTests.java # Kiểm thử Spring Boot Context
│       └── resources/
│           └── application-test.properties       # Cấu hình H2 in-memory DB phục vụ Unit Test
└── README.md
```

---

## 4. CHI TIẾT CÀI ĐẶT NIMBUS JOSE + JWT TRONG `JwtService.java`

### 4.1 Dependency Maven (`pom.xml`):
```xml
<!-- Thay thế cho io.jsonwebtoken (jjwt-api, jjwt-impl, jjwt-jackson) -->
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>nimbus-jose-jwt</artifactId>
    <version>9.37.2</version>
</dependency>
```

### 4.2 Luồng sinh Token (Sign) bằng Nimbus:
```java
// 1. Chuẩn bị Claims
JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
        .subject(userDetails.getUsername())
        .issueTime(new Date(nowMillis))
        .expirationTime(new Date(nowMillis + expiration))
        .build();

// 2. Chuẩn bị Header theo chuẩn RFC 7515 (HS256)
JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
        .type(JOSEObjectType.JWT)
        .build();

// 3. Khởi tạo SignedJWT
SignedJWT signedJWT = new SignedJWT(header, claimsSet);

// 4. Ký token bằng MACSigner và Secret Key 256-bit
JWSSigner signer = new MACSigner(getSigningKeyBytes());
signedJWT.sign(signer);

// 5. Chuỗi token trả về (Compact format: Header.Payload.Signature)
return signedJWT.serialize();
```

### 4.3 Luồng xác thực Token (Verify) bằng Nimbus:
```java
// 1. Phân tích chuỗi Token
SignedJWT signedJWT = SignedJWT.parse(token);

// 2. Xác thực tính toàn vẹn của chữ ký bằng MACVerifier
JWSVerifier verifier = new MACVerifier(getSigningKeyBytes());
if (!signedJWT.verify(verifier)) {
    return false; // Chữ ký không khớp hoặc bị chỉnh sửa
}

// 3. Kiểm tra các claims (chủ thể và thời hạn hiệu lực)
JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
Date exp = claims.getExpirationTime();
return claims.getSubject().equals(userDetails.getUsername()) 
       && exp != null && exp.after(new Date());
```

---

## 5. CẤU HÌNH HỆ THỐNG & CƠ SỞ DỮ LIỆU

File `application.properties` được thiết lập tối ưu hỗ trợ cả **Microsoft SQL Server** (đang chạy local) và **MySQL** (theo đúng Slide 21):

```properties
spring.application.name=JWT_springboot3
server.port=8005

# ========================================================
# 1. Cấu hình Microsoft SQL Server (Mặc định máy local)
# ========================================================
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=jwt_springboot3;encrypt=false;trustServerCertificate=true;sslProtocol=TLSv1.2;characterEncoding=UTF-8
spring.datasource.username=sa
spring.datasource.password=123
spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver

# ========================================================
# 2. Cấu hình MySQL (Theo đúng slide 21 bài giảng của Thầy Trung)
# ========================================================
# spring.datasource.url=jdbc:mysql://localhost:3306/jwt_springboot3?serverTimezone=UTC&allowPublicKeyRetrieval=true&useSSL=false
# spring.datasource.username=root
# spring.datasource.password=1234567@a$

# Hibernate & JPA Properties
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false

# Cấu hình Secret Key (64 hex characters = 256 bits) và Expiration (1h = 3600000 ms)
security.jwt.secret-key=3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b
security.jwt.expiration-time=3600000
```

---

## 6. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Bước 1: Yêu cầu môi trường
* Java SDK 17 LTS trở lên
* Maven 3.8+ (hoặc dùng trực tiếp `mvnw.cmd` có sẵn trong thư mục)
* Microsoft SQL Server hoặc MySQL

### Bước 2: Chạy kiểm thử tự động (Unit Test)
Kiểm tra toàn bộ 8 bài test (bao gồm 7 test case kiểm thử Nimbus JOSE + JWT):
```powershell
./mvnw clean test
```
*Kết quả:* `Tests run: 8, Failures: 0, Errors: 0, Skipped: 0` -> **BUILD SUCCESS**

### Bước 3: Khởi chạy ứng dụng
Chạy ứng dụng bằng lệnh:
```powershell
./mvnw spring-boot:run
```
Ứng dụng sẽ khởi động thành công trên cổng: **`http://localhost:8005`**

---

## 7. HƯỚNG DẪN KIỂM THỬ API & GIAO DIỆN (TESTING GUIDE)

### Cách 1: Kiểm thử trên Giao diện Web (Thymeleaf & AJAX)
1. Mở trình duyệt truy cập: `http://localhost:8005/login`
2. Nhập thông tin:
   * **Email**: `trungnh@hcmute.edu.vn`
   * **Mật khẩu**: `123456`
   *(Nếu chưa có tài khoản, chuyển qua tab **Đăng ký** để tạo tài khoản mới)*
3. Nhấn **Đăng nhập (Login)**:
   * Mã JWT được sinh từ Server qua Nimbus JOSE và lưu vào `localStorage.token`.
   * Tự động điều hướng sang trang `http://localhost:8005/user/profile`.
4. Trang Profile tự động đính kèm `Authorization: Bearer <token>` để gọi API `GET /users/me`:
   * Hiển thị họ tên, email, avatar, token hiện tại.
   * Có nút bấm xem danh sách tất cả người dùng hệ thống (`GET /users/`).
   * Nhấn nút **Logout**: Xóa token khỏi `localStorage` và chuyển về trang Login.

---

### Cách 2: Kiểm thử bằng Postman / cURL (Theo Slide 28, 29, 31)

#### 1. Đăng ký tài khoản (`POST /auth/signup`):
```bash
curl -X POST http://localhost:8005/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trungnh@hcmute.edu.vn",
    "password": "123456",
    "fullName": "Nguyễn Hữu Trung"
  }'
```
*Response: HTTP 200 OK*
```json
{
  "id": 1,
  "fullName": "Nguyễn Hữu Trung",
  "email": "trungnh@hcmute.edu.vn",
  "images": "default-avatar.png",
  "enabled": true,
  "authorities": []
}
```

#### 2. Đăng nhập để sinh JWT Token (`POST /auth/login`):
```bash
curl -X POST http://localhost:8005/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trungnh@hcmute.edu.vn",
    "password": "123456"
  }'
```
*Response: HTTP 200 OK*
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0cnVuZ25oQGhjbXV0ZS5lZHUudm4iLCJleHAiOjE3OTA3NDE3NDksImlhdCI6MTc5MDczODE0OX0.NkLggbN8WuJ3tG60me6nG28YVSf27gyX11nbb5IrCbk",
  "expiresIn": 3600000
}
```

#### 3. Lấy thông tin cá nhân kèm Bearer Token (`GET /users/me`):
```bash
curl -X GET http://localhost:8005/users/me \
  -H "Authorization: Bearer <token_o_tren>"
```
*Response: HTTP 200 OK với thông tin user xác thực.*

#### 4. Thử truy cập không có Token (Kiểm tra Security):
```bash
curl -X GET http://localhost:8005/users/me
```
*Response: HTTP 403 Forbidden*

#### 5. Thử truy cập với Token không hợp lệ / giả mạo chữ ký:
```bash
curl -X GET http://localhost:8005/users/me \
  -H "Authorization: Bearer invalid.token.signature"
```
*Response: Trả về ProblemDetail 401 Unauthorized / Invalid Signature theo đúng Slide 30, 31.*

---

## 8. HƯỚNG DẪN TẠO VÀ ĐẨY LÊN GITHUB RỒI NỘP LINK UTEXLMS

### Bước 1: Khởi tạo Git và Commit
Tại thư mục gốc dự án (`c:\Bài 10`), mở Terminal / PowerShell và thực hiện:
```bash
git init
git add .
git commit -m "feat: hoàn thành bài tập JWT Spring Boot 3 Security 6 sử dụng Nimbus JOSE + JWT thay thế JJWT"
```

### Bước 2: Tạo Repository trên GitHub
1. Truy cập vào GitHub: [https://github.com/new](https://github.com/new)
2. Đặt tên Repository, ví dụ: `SpringBoot3-Security6-Nimbus-JWT` hoặc `Bai10-JWT-Nimbus`
3. Chọn chế độ: **Public**
4. Không chọn thêm README hay .gitignore (vì dự án đã có sẵn).
5. Nhấn **Create repository**.

### Bước 3: Đẩy mã nguồn lên GitHub
Liên kết remote và đẩy code lên:
```bash
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/SpringBoot3-Security6-Nimbus-JWT.git
git push -u origin main
```

### Bước 4: Nộp link lên hệ thống UTExLMS
1. Đăng nhập vào trang đào tạo trực tuyến: [https://utexlms.hcmute.edu.vn](https://utexlms.hcmute.edu.vn)
2. Chọn khóa học **Lập trình Web (WEBPR330479)** của ThS. Nguyễn Hữu Trung.
3. Tìm đến mục nộp bài tập về **JSON Web Token (JWT)**.
4. Dán link GitHub Repository của bạn vào ô nộp bài và nhấn **Lưu / Nộp bài**.
