package io.github.brunoeugeniodev.marketplace.controller;

import io.github.brunoeugeniodev.marketplace.models.Usuario;
import io.github.brunoeugeniodev.marketplace.service.UsuarioService;
import io.github.brunoeugeniodev.marketplace.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class MinhaContaController {

    private final UsuarioService usuarioService;
    private final MapperUtil mapperUtil;

    @GetMapping("/minha-conta")
    public String minhaConta(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        if (userDetails == null) {
            return "redirect:/login";
        }

        Optional<Usuario> usuario = usuarioService.buscarPorEmail(userDetails.getUsername());
        if (usuario.isPresent()) {
            model.addAttribute("usuario", usuario.get());
            return "minha-conta";
        }

        return "redirect:/login";
    }
}