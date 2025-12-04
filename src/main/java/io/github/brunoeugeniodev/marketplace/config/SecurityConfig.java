package io.github.brunoeugeniodev.marketplace.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // URLs COMPLETAMENTE PÚBLICAS (sem autenticação)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // PÁGINAS PÚBLICAS (qualquer um pode acessar)
                        .requestMatchers(
                                "/",
                                "/index",
                                "/login",
                                "/registro",
                                "/lojas",
                                "/loja/**",
                                "/busca-resultado",
                                "/ofertas",
                                "/lancamentos",
                                "/destaques",
                                "/api/debug/**",
                                "/debug/**"
                        ).permitAll()

                        // APIS PÚBLICAS - AUTENTICAÇÃO
                        .requestMatchers("/api/auth/**").permitAll()

                        // APIS PÚBLICAS GET (todos podem ler)
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()

                        // RECURSOS ESTÁTICOS
                        .requestMatchers(
                                "/estilos/**",
                                "/scripts/**",
                                "/imagens/**",
                                "/css/**",
                                "/js/**",
                                "/assets/**",
                                "/webjars/**",
                                "/favicon.ico"
                        ).permitAll()

                        // ========== IMPORTANTE: CADASTRO LOJA (REVERSÃO PARA PERMITALL) ==========
                        // A página deve ser acessível para que o Thymeleaf/JS trate o acesso restrito.
                        .requestMatchers(HttpMethod.GET, "/cadastro-loja").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/lojas").authenticated()

                        // URLs AUTENTICADAS (precisa de login)
                        .requestMatchers("/minha-conta/**").authenticated()
                        .requestMatchers("/minha-loja/**").authenticated()
                        .requestMatchers("/carrinho/**").authenticated()

                        // APIs AUTENTICADAS (todos os métodos exceto GET)
                        .requestMatchers(HttpMethod.POST, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/**").authenticated()

                        // Demais requisições - NECESSITA AUTENTICAÇÃO
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Mantendo o CORS, mas como o CSRF está desabilitado, ele não deve ser um problema para você.
        configuration.setAllowedOrigins(List.of("http://localhost:8080", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}