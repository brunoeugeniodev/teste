package io.github.brunoeugeniodev.marketplace.config;

import io.github.brunoeugeniodev.marketplace.service.UsuarioService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ACCESS_TOKEN_COOKIE = "ACCESS_TOKEN"; // Constante para uso futuro

    private final JwtUtil jwtUtil;
    private final UsuarioService usuarioService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String requestURI = request.getRequestURI();
        log.debug("Processando requisição para: {} {}", request.getMethod(), requestURI);

        try {
            // Extrai o JWT do Header ou do Cookie (se usado)
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                log.debug("JWT encontrado na requisição");

                if (jwtUtil.validateToken(jwt)) {
                    log.debug("JWT válido");

                    String username = jwtUtil.extractUsername(jwt);
                    log.debug("Username extraído: {}", username);

                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                        UserDetails userDetails = usuarioService.loadUserByUsername(username);
                        log.debug("UserDetails carregado: {}", userDetails.getUsername());

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities()
                                );

                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);

                        log.info("Usuário '{}' autenticado via JWT para {}", username, requestURI);
                    }
                } else {
                    log.warn("JWT inválido ou expirado");
                    // O Spring Security tratará o 401/403 se a URL for .authenticated()
                }
            } else {
                log.debug("Nenhum JWT encontrado na requisição");
            }
        } catch (Exception e) {
            log.error("Falha ao autenticar usuário para {}: {}", requestURI, e.getMessage(), e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);

        // 1. Tenta extrair do cabeçalho Authorization (para chamadas AJAX do frontend)
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }

        // 2. Tenta extrair de um Cookie (para navegação direta - opcional no seu caso, mas adicionado)
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(ACCESS_TOKEN_COOKIE)) {
                    log.debug("Token encontrado no cookie '{}'", ACCESS_TOKEN_COOKIE);
                    return cookie.getValue();
                }
            }
        }

        // 3. Tenta verificar no parâmetro (para testes)
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }

        return null;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();

        // Não filtrar recursos estáticos e URLs públicas
        boolean isPublicResource = path.startsWith("/css/") ||
                path.startsWith("/js/") ||
                path.startsWith("/images/") ||
                path.startsWith("/estilos/") ||
                path.startsWith("/scripts/") ||
                path.startsWith("/imagens/") ||
                path.startsWith("/webjars/") ||
                path.startsWith("/favicon.ico");

        // Não filtrar endpoints públicos de API
        boolean isPublicApi = path.startsWith("/api/auth/") &&
                (method.equals("POST") || method.equals("GET"));

        // Páginas públicas
        boolean isPublicPage = path.equals("/") ||
                path.equals("/login") ||
                path.equals("/registro") ||
                path.startsWith("/loja/") ||
                path.equals("/lojas");

        // Nota: Removida a URL /cadastro-loja daqui para ser segura.
        // Com a Opção 1, ela pode ser adicionada aqui sem problemas se quiser ignorar o filtro

        return isPublicResource || isPublicApi || isPublicPage;
    }
}