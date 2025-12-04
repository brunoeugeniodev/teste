package io.github.brunoeugeniodev.marketplace.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret:mySecretKeyForJWTGenerationInMarketplaceApplication2024}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private Long refreshExpiration;

    @Value("${jwt.issuer:marketplace-api}")
    private String issuer;

    private Key getSigningKey() {
        String key = secret;

        while (key.length() < 32) {
            key += "0";
        }

        return Keys.hmacShaKeyFor(key.getBytes());
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .requireIssuer(issuer)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

        } catch (JwtException e) {
            log.warn("Token inválido: {}", e.getMessage());
            throw e;
        }
    }

    // TOKEN DE ACESSO - CORRIGIDO PARA INCLUIR MAIS INFORMAÇÕES
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();

        // Adiciona roles
        claims.put("roles", userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));

        claims.put("type", "access");

        // Adiciona informações extras importantes
        claims.put("auth_time", new Date().getTime());
        claims.put("token_type", "Bearer");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // REFRESH TOKEN
    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("auth_time", new Date().getTime());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException e) {
            log.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    // Método para verificar se token está prestes a expirar
    public Long getTimeUntilExpiration(String token) {
        try {
            Date exp = extractExpiration(token);
            long now = System.currentTimeMillis();
            return Math.max(0, exp.getTime() - now);
        } catch (JwtException e) {
            return 0L;
        }
    }

    // Método para decodificar token sem validação (apenas para debug)
    public Map<String, Object> decodeTokenForDebug(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new JwtException("Token format invalid");
            }

            String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            return new ObjectMapper().readValue(payload, Map.class);
        } catch (Exception e) {
            log.error("Error decoding token for debug: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }
}