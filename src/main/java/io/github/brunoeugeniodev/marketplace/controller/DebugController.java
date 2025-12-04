// Crie esta classe no seu projeto
package io.github.brunoeugeniodev.marketplace.controller.debug;

import io.github.brunoeugeniodev.marketplace.config.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Slf4j
public class DebugController {

    private final JwtUtil jwtUtil;

    @GetMapping("/jwt-test")
    public ResponseEntity<Map<String, Object>> jwtTest(@RequestParam(required = false) String token) {
        if (token != null) {
            try {
                Map<String, Object> decoded = jwtUtil.decodeTokenForDebug(token);
                boolean isValid = jwtUtil.validateToken(token);
                String username = jwtUtil.extractUsername(token);

                return ResponseEntity.ok(Map.of(
                        "token", token,
                        "isValid", isValid,
                        "username", username,
                        "decoded", decoded
                ));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", e.getMessage(),
                        "token", token
                ));
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Endpoint de debug JWT",
                "endpoints", Map.of(
                        "POST /api/auth/login", "Realizar login",
                        "POST /api/auth/registro", "Registrar usuário",
                        "GET /api/auth/me", "Obter dados do usuário logado",
                        "GET /api/debug/jwt-test?token=XYZ", "Testar um token JWT"
                )
        ));
    }
}