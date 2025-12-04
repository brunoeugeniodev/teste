package io.github.brunoeugeniodev.marketplace.controller;

import io.github.brunoeugeniodev.marketplace.dto.LojaCreateDTO;
import io.github.brunoeugeniodev.marketplace.dto.LojaDTO;
import io.github.brunoeugeniodev.marketplace.dto.ProdutoDTO;
import io.github.brunoeugeniodev.marketplace.models.Loja;
import io.github.brunoeugeniodev.marketplace.models.Produto;
import io.github.brunoeugeniodev.marketplace.models.Usuario;
import io.github.brunoeugeniodev.marketplace.service.LojaService;
import io.github.brunoeugeniodev.marketplace.service.ProdutoService;
import io.github.brunoeugeniodev.marketplace.service.UsuarioService;
import io.github.brunoeugeniodev.marketplace.util.MapperUtil;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/lojas")
@RequiredArgsConstructor
public class LojaController {

    private final LojaService lojaService;
    private final UsuarioService usuarioService;
    private final ProdutoService produtoService;
    private final MapperUtil mapperUtil;

    // -----------------------------
    // MÉTODO AUXILIAR PADRONIZADO
    // -----------------------------
    private Optional<Usuario> getUsuario(@AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return Optional.empty();
        }
        return usuarioService.buscarPorEmail(userDetails.getUsername());
    }

    // -----------------------------
    // CRIAR LOJA
    // -----------------------------
    @PostMapping
    public ResponseEntity<?> criarLoja(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @Valid @RequestBody LojaCreateDTO lojaCreateDTO) {

        Optional<Usuario> usuarioOpt = getUsuario(userDetails);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        try {
            Loja loja = mapperUtil.toLojaEntity(lojaCreateDTO);
            Loja lojaSalva = lojaService.criarLoja(loja, usuarioOpt.get());
            LojaDTO lojaDTO = mapperUtil.toLojaDTO(lojaSalva);

            return ResponseEntity.status(HttpStatus.CREATED).body(lojaDTO);

        } catch (Exception e) {
            log.error("Erro ao criar loja: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------
    // LISTAR LOJAS
    // -----------------------------
    @GetMapping
    public ResponseEntity<List<LojaDTO>> listarLojas() {
        List<Loja> lojas = lojaService.listarLojasAtivas();
        return ResponseEntity.ok(mapperUtil.mapList(lojas, LojaDTO.class));
    }

    // -----------------------------
    // LISTAR LOJA POR ID
    // -----------------------------
    @GetMapping("/{id}")
    public ResponseEntity<LojaDTO> listarPorId(@PathVariable Long id) {
        return lojaService.buscarPorIdAtiva(id)
                .map(loja -> ResponseEntity.ok(mapperUtil.toLojaDTO(loja)))
                .orElse(ResponseEntity.notFound().build());
    }

    // -----------------------------
    // LISTAR PRODUTOS DA LOJA
    // -----------------------------
    @GetMapping("/{id}/produtos")
    public ResponseEntity<List<ProdutoDTO>> listarProdutosDaLoja(@PathVariable Long id) {
        List<Produto> produtos = produtoService.listarProdutosPorLoja(id);
        return ResponseEntity.ok(mapperUtil.mapList(produtos, ProdutoDTO.class));
    }

    // -----------------------------
    // BUSCAR LOJAS POR NOME
    // -----------------------------
    @GetMapping("/buscar")
    public ResponseEntity<List<LojaDTO>> buscarLojas(@RequestParam String nome) {
        List<Loja> lojas = lojaService.buscarPorNome(nome);
        return ResponseEntity.ok(mapperUtil.mapList(lojas, LojaDTO.class));
    }

    // -----------------------------
    // LISTAR RECOMENDADAS
    // -----------------------------
    @GetMapping("/recomendadas")
    public ResponseEntity<List<LojaDTO>> listarRecomendadas() {
        Pageable pageable = PageRequest.of(0, 5);
        List<Loja> lojas = lojaService.listarLojasRecomendadas(pageable).getContent();
        return ResponseEntity.ok(mapperUtil.mapList(lojas, LojaDTO.class));
    }

    // -----------------------------
    // LISTAR LOJAS DO USUÁRIO
    // -----------------------------
    @GetMapping("/minhas-lojas")
    public ResponseEntity<?> listarMinhasLojas(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        Optional<Usuario> usuarioOpt = usuarioService.buscarPorEmail(authentication.getName());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuário não encontrado."));
        }

        try {
            List<Loja> lojas = lojaService.listarLojasDoUsuario(usuarioOpt.get());
            return ResponseEntity.ok(mapperUtil.mapList(lojas, LojaDTO.class));

        } catch (Exception e) {
            log.error("Erro ao buscar lojas do usuário: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", "Erro interno ao buscar lojas."));
        }
    }

    // -----------------------------
    // ATUALIZAR LOJA
    // -----------------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarLoja(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody LojaCreateDTO request) {

        Optional<Usuario> usuarioOpt = getUsuario(userDetails);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        try {
            Loja loja = mapperUtil.toLojaEntity(request);
            Loja lojaEditada = lojaService.atualizarLoja(id, loja, usuarioOpt.get());
            return ResponseEntity.ok(mapperUtil.toLojaDTO(lojaEditada));

        } catch (Exception e) {
            log.error("Erro ao atualizar loja: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------
    // ATUALIZAR FOTO DA LOJA
    // -----------------------------
    @PutMapping("/{id}/foto")
    public ResponseEntity<?> atualizarFotoLoja(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam String fotoUrl) {

        Optional<Usuario> usuarioOpt = getUsuario(userDetails);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        try {
            Loja loja = lojaService.atualizarFotoLoja(id, fotoUrl, usuarioOpt.get());
            return ResponseEntity.ok(mapperUtil.toLojaDTO(loja));

        } catch (Exception e) {
            log.error("Erro ao atualizar foto da loja: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------
    // DESATIVAR LOJA
    // -----------------------------
    @PutMapping("/{id}/desativar")
    public ResponseEntity<?> desativarLoja(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @PathVariable Long id) {

        Optional<Usuario> usuarioOpt = getUsuario(userDetails);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        try {
            Loja loja = lojaService.desativarLoja(id, usuarioOpt.get());
            return ResponseEntity.ok(mapperUtil.toLojaDTO(loja));

        } catch (Exception e) {
            log.error("Erro ao desativar loja: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------
    // DELETAR LOJA
    // -----------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarLoja(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @PathVariable Long id) {

        Optional<Usuario> usuarioOpt = getUsuario(userDetails);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuário não autenticado."));
        }

        try {
            lojaService.deletarLoja(id, usuarioOpt.get());
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            log.error("Erro ao deletar loja: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }
}
