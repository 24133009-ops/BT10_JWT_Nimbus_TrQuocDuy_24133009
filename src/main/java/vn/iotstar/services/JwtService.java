package vn.iotstar.services;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service xử lý tạo (Sign), trích xuất thông tin (Extract Claims) và xác thực (Verify)
 * JSON Web Token sử dụng thư viện Nimbus JOSE + JWT thay thế JJWT (io.jsonwebtoken).
 */
@Service
public class JwtService {

    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.expiration-time}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, JWTClaimsSet::getSubject);
    }

    public <T> T extractClaim(String token, Function<JWTClaimsSet, T> claimsResolver) {
        final JWTClaimsSet claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    /**
     * Tạo JWT với Nimbus JOSE + JWT:
     * 1. Xây dựng JWTClaimsSet (sub, iat, exp, extraClaims)
     * 2. Tạo JWSHeader với thuật toán HS256 và typ: JWT
     * 3. Khởi tạo SignedJWT
     * 4. Ký token bằng MACSigner(secretKey)
     * 5. Serialize thành chuỗi compact: Header.Payload.Signature
     */
    public String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        try {
            long nowMillis = System.currentTimeMillis();
            Date issueTime = new Date(nowMillis);
            Date expirationTime = new Date(nowMillis + expiration);

            JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                    .subject(userDetails.getUsername())
                    .issueTime(issueTime)
                    .expirationTime(expirationTime);

            if (extraClaims != null) {
                for (Map.Entry<String, Object> entry : extraClaims.entrySet()) {
                    claimsBuilder.claim(entry.getKey(), entry.getValue());
                }
            }

            JWTClaimsSet claimsSet = claimsBuilder.build();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
                    .type(JOSEObjectType.JWT)
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);

            JWSSigner signer = new MACSigner(getSigningKeyBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Lỗi khi ký JWT token bằng Nimbus JOSE: " + e.getMessage(), e);
        }
    }

    /**
     * Xác thực tính hợp lệ của token: chữ ký chuẩn + username trùng khớp + chưa hết hạn
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            // Xác thực chữ ký HMAC SHA-256
            JWSVerifier verifier = new MACVerifier(getSigningKeyBytes());
            if (!signedJWT.verify(verifier)) {
                return false;
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            String username = claims.getSubject();
            Date expiration = claims.getExpirationTime();

            boolean isUserMatch = (username != null && username.equals(userDetails.getUsername()));
            boolean isNotExpired = (expiration != null && expiration.after(new Date()));

            return isUserMatch && isNotExpired;
        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, JWTClaimsSet::getExpirationTime);
    }

    /**
     * Trích xuất toàn bộ claims sau khi đã verify chữ ký
     */
    public JWTClaimsSet extractAllClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(getSigningKeyBytes());
            if (!signedJWT.verify(verifier)) {
                throw new RuntimeException("Chữ ký JWT không hợp lệ (Invalid signature)");
            }
            return signedJWT.getJWTClaimsSet();
        } catch (ParseException e) {
            throw new RuntimeException("Chuỗi JWT không đúng định dạng: " + e.getMessage(), e);
        } catch (JOSEException e) {
            throw new RuntimeException("Lỗi xác thực chữ ký JWT: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy mảng byte secret key:
     * Hỗ trợ định dạng Hex 64 ký tự (256 bits), Base64 hoặc UTF-8 chuẩn.
     */
    private byte[] getSigningKeyBytes() {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw new IllegalStateException("Secret key JWT không được để trống!");
        }
        String trimmed = secretKey.trim();

        // Trường hợp Hex 64 ký tự (như chuỗi trong slide: 3cfa76ef14937c1c0ea519f8fc057a80fcd04a7420f8e8bcd0a7567c272e007b)
        if (trimmed.matches("^[0-9a-fA-F]{64}$")) {
            byte[] keyBytes = new byte[32];
            for (int i = 0; i < 32; i++) {
                keyBytes[i] = (byte) Integer.parseInt(trimmed.substring(i * 2, i * 2 + 2), 16);
            }
            return keyBytes;
        }

        // Thử giải mã Base64 nếu có thể
        try {
            byte[] decoded = java.util.Base64.getDecoder().decode(trimmed);
            if (decoded.length >= 32) {
                return decoded;
            }
        } catch (IllegalArgumentException ignored) {
        }

        // Fallback UTF-8 bytes (HS256 yêu cầu tối thiểu 256 bits = 32 bytes)
        byte[] utf8Bytes = trimmed.getBytes(StandardCharsets.UTF_8);
        if (utf8Bytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(utf8Bytes, 0, padded, 0, utf8Bytes.length);
            return padded;
        }
        return utf8Bytes;
    }
}
