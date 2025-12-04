// Código corrigido e organizado conforme solicitado
// Agrupado por classes exatamente como enviado pelo usuário.

// CarrinhoService.java
package io.github.brunoeugeniodev.marketplace.service;

import io.github.brunoeugeniodev.marketplace.exception.ResourceNotFoundException;
import io.github.brunoeugeniodev.marketplace.models.*;
import io.github.brunoeugeniodev.marketplace.repository.CarrinhoRepository;
import io.github.brunoeugeniodev.marketplace.repository.ItemCarrinhoRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarrinhoService {

    private final CarrinhoRepository carrinhoRepository;
    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final ProdutoService produtoService;
    private final UsuarioService usuarioService;

    public Carrinho obterCarrinho(Usuario usuario) {
        return carrinhoRepository.findByUsuario(usuario)
                .orElseGet(() -> criarCarrinho(usuario));
    }

    public Carrinho obterCarrinhoCompleto(Usuario usuario) {
        return carrinhoRepository.findByUsuarioIdComItens(usuario.getId())
                .orElseGet(() -> criarCarrinho(usuario));
    }

    @Transactional
    public Carrinho adicionarItem(Usuario usuario, Long produtoId, Integer quantidade) {
        if (quantidade <= 0) {
            throw new ValidationException("Quantidade deve ser maior que zero");
        }

        Carrinho carrinho = obterCarrinho(usuario);
        Produto produto = produtoService.buscarProdutoAtivoPorId(produtoId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado ou indisponível"));

        if (produto.getQuantidade() < quantidade) {
            throw new ValidationException(
                    String.format("Estoque insuficiente. Disponível: %d", produto.getQuantidade())
            );
        }

        ItemCarrinho itemExistente = itemCarrinhoRepository
                .findByCarrinhoIdAndProdutoId(carrinho.getId(), produtoId)
                .orElse(null);

        if (itemExistente != null) {
            int novaQuantidade = itemExistente.getQuantidade() + quantidade;
            if (produto.getQuantidade() < novaQuantidade) {
                throw new ValidationException(
                        String.format("Estoque insuficiente. Disponível: %d", produto.getQuantidade() - itemExistente.getQuantidade())
                );
            }
            itemExistente.setQuantidade(novaQuantidade);
            itemExistente.setPrecoUnitario(produto.getPreco());
            itemExistente.setDataAtualizacao(LocalDateTime.now());
            itemCarrinhoRepository.save(itemExistente);
        } else {
            ItemCarrinho novoItem = ItemCarrinho.builder()
                    .carrinho(carrinho)
                    .produto(produto)
                    .quantidade(quantidade)
                    .precoUnitario(produto.getPreco())
                    .build();
            itemCarrinhoRepository.save(novoItem);
        }

        return obterCarrinhoCompleto(usuario);
    }

    @Transactional
    public Carrinho removerItem(Usuario usuario, Long itemId) {
        Carrinho carrinho = obterCarrinho(usuario);

        ItemCarrinho item = itemCarrinhoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));

        if (!item.getCarrinho().getId().equals(carrinho.getId())) {
            throw new ValidationException("Item não pertence ao seu carrinho");
        }

        itemCarrinhoRepository.delete(item);
        return obterCarrinhoCompleto(usuario);
    }

    @Transactional
    public Carrinho atualizarQuantidade(Usuario usuario, Long itemId, Integer quantidade) {
        if (quantidade <= 0) {
            return removerItem(usuario, itemId);
        }

        Carrinho carrinho = obterCarrinho(usuario);

        ItemCarrinho item = itemCarrinhoRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));

        if (!item.getCarrinho().getId().equals(carrinho.getId())) {
            throw new ValidationException("Item não pertence ao seu carrinho");
        }

        if (item.getProduto().getQuantidade() < quantidade) {
            throw new ValidationException(
                    String.format("Estoque insuficiente. Disponível: %d", item.getProduto().getQuantidade())
            );
        }

        item.setQuantidade(quantidade);
        item.setDataAtualizacao(LocalDateTime.now());
        itemCarrinhoRepository.save(item);

        return obterCarrinhoCompleto(usuario);
    }

    @Transactional
    public Carrinho limparCarrinho(Usuario usuario) {
        Carrinho carrinho = obterCarrinho(usuario);
        itemCarrinhoRepository.deleteAllByCarrinhoId(carrinho.getId());
        return obterCarrinhoCompleto(usuario);
    }

    @Transactional
    public Carrinho finalizarCompra(Usuario usuario) {
        Carrinho carrinho = obterCarrinhoCompleto(usuario);

        if (carrinho.getItens().isEmpty()) {
            throw new ValidationException("Carrinho vazio");
        }

        carrinho.getItens().forEach(item -> {
            Produto produto = item.getProduto();
            if (produto.getQuantidade() < item.getQuantidade()) {
                throw new ValidationException(
                        String.format("Produto '%s' sem estoque suficiente", produto.getNome())
                );
            }

            produtoService.atualizarEstoque(produto.getId(), item.getQuantidade().longValue());
        });

        log.info("Compra finalizada para usuário: {}", usuario.getEmail());

        return limparCarrinho(usuario);
    }

    private Carrinho criarCarrinho(Usuario usuario) {
        Carrinho carrinho = Carrinho.builder()
                .usuario(usuario)
                .build();
        return carrinhoRepository.save(carrinho);
    }

    @Transactional
    public Integer contarItensNoCarrinho(Usuario usuario) {
        Carrinho carrinho = obterCarrinho(usuario);
        return itemCarrinhoRepository.countTotalItensNoCarrinho(carrinho.getId());
    }
}

// EnderecoService.java
// (continua no próximo bloco)
