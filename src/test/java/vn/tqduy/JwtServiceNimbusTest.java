package vn.tqduy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import vn.tqduy.services.JwtService;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Kiểm thử JWT Service sử dụng thư viện Nimbus JOSE + JWT")
class JwtServiceNimbusTest {

    private JwtService jwtService;
    private final String secretKeyHex = "3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b";
    private final long expirationTime = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKeyHex);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", expirationTime);
    }

    @Test
    @DisplayName("Tạo JWT token thành công bằng Nimbus JOSE + JWT")
    void testGenerateToken() {
        UserDetails userDetails = new User("trungnh@hcmute.edu.vn", "123456", Collections.emptyList());

        String token = jwtService.generateToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        // JWT phải gồm 3 phần tách bởi dấu chấm (Header.Payload.Signature)
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "JWT phải gồm đúng 3 phần: Header, Payload, Signature");
    }

    @Test
    @DisplayName("Trích xuất Username (Subject) chính xác từ token")
    void testExtractUsername() {
        String email = "trungnh@hcmute.edu.vn";
        UserDetails userDetails = new User(email, "password", Collections.emptyList());

        String token = jwtService.generateToken(userDetails);
        String extractedUsername = jwtService.extractUsername(token);

        assertEquals(email, extractedUsername);
    }

    @Test
    @DisplayName("Xác thực token hợp lệ trả về true")
    void testIsTokenValid_Success() {
        UserDetails userDetails = new User("trungnh@hcmute.edu.vn", "password", Collections.emptyList());

        String token = jwtService.generateToken(userDetails);
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        assertTrue(isValid, "Token hợp lệ phải được xác thực thành công");
    }

    @Test
    @DisplayName("Token không hợp lệ nếu UserDetails không khớp")
    void testIsTokenValid_WrongUser() {
        UserDetails userDetails1 = new User("user1@example.com", "password", Collections.emptyList());
        UserDetails userDetails2 = new User("user2@example.com", "password", Collections.emptyList());

        String token = jwtService.generateToken(userDetails1);
        boolean isValid = jwtService.isTokenValid(token, userDetails2);

        assertFalse(isValid, "Token của user1 không thể hợp lệ với user2");
    }

    @Test
    @DisplayName("Token với chữ ký giả mạo (tampered) phải bị từ chối")
    void testTamperedTokenRejected() {
        UserDetails userDetails = new User("admin@hcmute.edu.vn", "password", Collections.emptyList());
        String token = jwtService.generateToken(userDetails);

        // Giả mạo payload
        String[] parts = token.split("\\.");
        String tamperedToken = parts[0] + "." + parts[1] + "tampered" + "." + parts[2];

        boolean isValid = jwtService.isTokenValid(tamperedToken, userDetails);
        assertFalse(isValid, "Token bị can thiệp chữ ký phải không hợp lệ");
    }

    @Test
    @DisplayName("Kiểm tra thời gian hết hạn của token")
    void testTokenExpiration() {
        UserDetails userDetails = new User("test@example.com", "password", Collections.emptyList());
        String token = jwtService.generateToken(userDetails);

        Date expiration = jwtService.extractExpiration(token);
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()), "Thời gian hết hạn phải ở tương lai");
        assertFalse(jwtService.isTokenExpired(token), "Token vừa tạo không được hết hạn");
    }

    @Test
    @DisplayName("Tạo token kèm Extra Claims qua Nimbus JOSE")
    void testGenerateTokenWithExtraClaims() {
        UserDetails userDetails = new User("vip@hcmute.edu.vn", "password", Collections.emptyList());
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "ROLE_ADMIN");
        extraClaims.put("fullName", "Nguyen Huu Trung");

        String token = jwtService.generateToken(extraClaims, userDetails);
        assertNotNull(token);

        assertEquals("ROLE_ADMIN", jwtService.extractClaim(token, claims -> claims.getClaim("role")));
        assertEquals("Nguyen Huu Trung", jwtService.extractClaim(token, claims -> claims.getClaim("fullName")));
    }
}
