package vn.iotstar;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Kiểm tra khởi động ngữ cảnh ứng dụng Spring Boot 3")
class Jwtspringboot3ApplicationTests {

    @Test
    void contextLoads() {
    }
}
