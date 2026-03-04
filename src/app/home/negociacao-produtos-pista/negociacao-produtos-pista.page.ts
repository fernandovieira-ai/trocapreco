import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController, IonAccordionGroup } from "@ionic/angular";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Alert } from "src/app/class/alert";
import { AuthService } from "src/app/services/auth.service";
import { MovimentoService } from "src/app/services/movimento.service";
import { DataloadService } from "src/app/services/dataload.service";
import { formaPagto, pessoaNegociacao } from "src/app/class/user";
import * as moment from "moment";
import { timeout } from "rxjs";

@Component({
  selector: "app-negociacao-produtos-pista",
  templateUrl: "./negociacao-produtos-pista.page.html",
  styleUrls: ["./negociacao-produtos-pista.page.scss"],
  standalone: false,
})
export class NegociacaoProdutosPistaPage implements OnInit, OnDestroy {
  @ViewChild("accordionGroup", { static: false })
  accordionGroup: IonAccordionGroup;
  private destroy$ = new Subject<void>();

  // Controle de steps
  currentStep = 1;
  totalSteps = 4;

  // Step 1: Clientes
  clientesBusca = "";
  dataCadastroInicial: string = "";
  dataCadastroFinal: string = "";
  clientesSelecionados: any[] = [];
  clientesFiltrados: any[] = [];
  private clientesSelecionadosSet = new Set<number>();

  // Step 2: Produtos (ao invés de Combustíveis)
  produtosBusca = "";
  produtosFiltro = "todos";
  produtosSelecionados: any[] = [];
  produtosDisponiveis: any[] = [];
  produtosFiltrados: any[] = [];
  groupedProdutos: {
    nom_fantasia: string;
    cod_empresa: number;
    items: any[];
  }[] = [];
  private produtosSelecionadosSet = new Set<number>();

  // Controle de subgrupos
  subgruposDisponiveis: Array<{ cod_subgrupo: number; des_subgrupo: string }> =
    [];
  subgrupoSelecionado: number | null = null;

  // Modal de produtos selecionados
  isModalProdutosSelecionados = false;
  precosEditaveis: Map<number, number> = new Map();

  // Cache para nomes
  private tipoPrecoNomeCache = new Map<string, string>();
  private formaPagamentoNomeCache = new Map<string, string>();

  // Step 3: Negociação
  tipoNegociacao: "desconto" | "acrescimo" | "fixo" | null = null;
  valorReais: number | null = null;
  valorPercentual: number | null = null;
  precosFixosPorItem: Map<number, number> = new Map();
  tipoPrecoSelecionado: string[] = [];
  formasPagamentoSelecionadas: string[] = [];
  dataInicio: string = moment().format("YYYY-MM-DD");
  dataFim: string = moment().add(30, "days").format("YYYY-MM-DD");
  volumeMinimo: number | null = null;
  volumeMaximo: number | null = null;
  duracaoNegociacao: number = 30;

  // Modal de formas de pagamento
  isModalFormaPagto = false;
  formaPagtoFiltrada: formaPagto[] = [];
  tiposSelecionadosFiltro: formaPagto[] = [];

  // Listas de opções
  tiposPreco = [
    { codigo: "A", nome: "Preço A", descricao: "Preço padrão - varejo" },
    { codigo: "B", nome: "Preço B", descricao: "Preço atacado" },
    { codigo: "C", nome: "Preço C", descricao: "Preço promocional" },
    { codigo: "D", nome: "Preço D", descricao: "Preço especial" },
    { codigo: "E", nome: "Preço E", descricao: "Preço customizado" },
  ];

  formasPagamento = [
    { codigo: "dinheiro", nome: "Dinheiro", icone: "💵" },
    { codigo: "debito", nome: "Débito", icone: "💳" },
    { codigo: "credito", nome: "Crédito", icone: "💳" },
    { codigo: "pix", nome: "PIX", icone: "📱" },
    { codigo: "boleto", nome: "Boleto", icone: "📄" },
    { codigo: "faturado", nome: "Faturado", icone: "🏢" },
  ];

  constructor(
    public movimento: MovimentoService,
    public auth: AuthService,
    public dataLoad: DataloadService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alert: Alert,
  ) {
    // Pré-popular cache de nomes
    this.tiposPreco.forEach((t) =>
      this.tipoPrecoNomeCache.set(t.codigo, t.nome),
    );
    this.formasPagamento.forEach((f) =>
      this.formaPagamentoNomeCache.set(f.codigo, f.nome),
    );
  }

  ngOnInit() {
    console.log("NegociacaoProdutosPistaPage initialized");

    if (!this.dataLoad || !this.dataLoad.pessoa) {
      console.error("DataLoad não inicializado. Redirecionando...");
      this.alert.presentToast(
        "Erro ao carregar dados. Retornando ao menu.",
        3000,
      );
      setTimeout(() => this.router.navigate(["/home"]), 1000);
      return;
    }
  }

  ionViewWillEnter() {
    console.log(
      "NegociacaoProdutosPistaPage Will Enter - Limpando estado anterior",
    );
    // Limpar todos os dados ao entrar na página para evitar estado residual
    this.limparDados();
    this.currentStep = 1;
    this.clientesBusca = "";
    this.produtosBusca = "";
    this.dataCadastroInicial = "";
    this.dataCadastroFinal = "";
    this.clientesFiltrados = [];
    this.produtosFiltrados = [];
    this.subgrupoSelecionado = null;

    // Carregar dados frescos
    this.carregarDados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== CARREGAMENTO DE DADOS ==========

  async carregarDados() {
    const loading = await this.loadingCtrl.create({
      message: "Carregando produtos...",
    });
    await loading.present();

    try {
      // Carregar produtos pista filtrados por subgrupos
      if (!this.produtosDisponiveis || this.produtosDisponiveis.length === 0) {
        console.log("=== DEBUG CARREGAMENTO DE PRODUTOS ===");
        console.log(
          "Empresas selecionadas pelo usuário:",
          this.auth.userLogado.cod_empresa_sel,
        );
        console.log(
          "Total de empresas selecionadas:",
          this.auth.userLogado.cod_empresa_sel?.length,
        );

        // Executar sp_custo_preco de forma assíncrona (não espera terminar)
        // Isso atualiza custos e preços em background para não deixar lento
        console.log(
          "Iniciando atualização de custos e preços em background...",
        );
        this.movimento
          .atualizarCustosPrecoPista(
            this.auth.userLogado.schema,
            this.auth.userLogado.cod_empresa_sel,
          )
          .subscribe({
            next: (response) => {
              console.log(
                "✓ Custos e preços atualizados com sucesso",
                response,
              );
            },
            error: (error) => {
              console.warn(
                "Erro ao atualizar custos e preços (não bloqueia):",
                error,
              );
            },
          });

        // Buscar estrutura hierárquica Empresa → Subgrupo → Produtos
        const subgruposData = await this.movimento
          .buscaSubgruposPista(
            this.auth.userLogado.schema,
            this.auth.userLogado.cod_empresa_sel,
          )
          .toPromise();

        const empresas = subgruposData?.empresas || [];
        console.log("=== DEBUG CARREGAMENTO ===");
        console.log("DEBUG - Empresas retornadas do backend:", empresas.length);
        console.log(
          "DEBUG - Códigos das empresas retornadas:",
          empresas.map((e) => ({ cod: e.cod_empresa, nome: e.nom_fantasia })),
        );

        if (empresas.length > 0) {
          console.log(
            "DEBUG - Primeira empresa completa:",
            JSON.stringify(empresas[0], null, 2),
          );
        }

        // Achatar a estrutura hierárquica para lista de produtos
        const produtosFiltrados = [];
        empresas.forEach((empresa) => {
          console.log(
            `Processando empresa: ${empresa.cod_empresa} - ${empresa.nom_fantasia}`,
          );
          console.log(`  Subgrupos: ${empresa.subgrupos?.length || 0}`);

          let produtosEmpresa = 0;
          empresa.subgrupos.forEach((subgrupo) => {
            subgrupo.itens.forEach((item) => {
              produtosFiltrados.push({
                ...item,
                cod_subgrupo: subgrupo.cod_subgrupo,
                des_subgrupo: subgrupo.des_subgrupo,
                cod_empresa: empresa.cod_empresa,
                nom_fantasia: empresa.nom_fantasia,
              });
              produtosEmpresa++;
            });
          });
          console.log(`  Total produtos desta empresa: ${produtosEmpresa}`);
        });

        this.produtosDisponiveis = produtosFiltrados;
        console.log(
          "DEBUG - Total produtos pista disponíveis:",
          this.produtosDisponiveis.length,
        );

        // Verificar distribuição de produtos por empresa
        const distribuicao = new Map();
        this.produtosDisponiveis.forEach((p) => {
          const key = `${p.cod_empresa} - ${p.nom_fantasia}`;
          distribuicao.set(key, (distribuicao.get(key) || 0) + 1);
        });
        console.log("DEBUG - Distribuição de produtos por empresa:");
        distribuicao.forEach((count, empresa) => {
          console.log(`  ${empresa}: ${count} produtos`);
        });

        // Extrair lista única de subgrupos
        const subgruposMap = new Map<number, string>();
        produtosFiltrados.forEach((p) => {
          if (p.cod_subgrupo && !subgruposMap.has(p.cod_subgrupo)) {
            subgruposMap.set(
              p.cod_subgrupo,
              p.des_subgrupo || `Subgrupo ${p.cod_subgrupo}`,
            );
          }
        });

        this.subgruposDisponiveis = Array.from(subgruposMap.entries())
          .map(([cod_subgrupo, des_subgrupo]) => ({
            cod_subgrupo,
            des_subgrupo,
          }))
          .sort((a, b) => a.des_subgrupo.localeCompare(b.des_subgrupo));

        console.log(
          "DEBUG - Subgrupos disponíveis:",
          this.subgruposDisponiveis.length,
        );

        // Buscar formas de pagamento
        const data = await this.movimento
          .buscaFiltroItem(
            this.auth.userLogado.schema,
            this.auth.userLogado.cod_empresa_sel,
          )
          .toPromise();

        this.movimento.formaPagto = data.formaPagto || [];
        this.movimento.tipoFormaPagto = data.tipoFormaPagto || [];
      }

      if (!this.dataLoad.pessoa || this.dataLoad.pessoa.length === 0) {
        console.error("Nenhum cliente carregado");
        this.clientesFiltrados = [];
      }

      // Não filtrar produtos inicialmente - só quando houver busca/filtro
      this.produtosFiltrados = [];
      this.clientesFiltrados = [];

      this.formaPagtoFiltrada = [...(this.movimento.formaPagto || [])];
      this.formaPagtoFiltrada.sort((a, b) => {
        const nomeA = (a.des_forma_pagto || "").toLowerCase();
        const nomeB = (b.des_forma_pagto || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });

      console.log("✓ Produtos disponíveis:", this.produtosFiltrados.length);

      await loading.dismiss();

      if (this.dataLoad.pessoa.length === 0) {
        this.alert.presentToast(
          "Nenhum cliente disponível. Verifique sua conexão ou tente novamente.",
          3000,
        );
      }
    } catch (error) {
      await loading.dismiss();
      console.error("Erro ao carregar dados:", error);
      this.alert.presentToast(
        "Erro ao carregar dados. Verifique sua conexão e tente novamente.",
        3000,
      );
    }
  }

  // ========== NAVEGAÇÃO ENTRE STEPS ==========

  goNext() {
    if (!this.canAdvance()) return;

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;

      if (this.currentStep === 3) {
        console.log("=== STEP 3: Produtos Selecionados ===");
        console.log("Total:", this.produtosSelecionados.length);
        console.log("Dados:", this.produtosSelecionados.slice(0, 2));
      }
    } else if (this.currentStep === this.totalSteps) {
      this.enviarNegociacao();
    }
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canAdvance(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.clientesSelecionados.length > 0;
      case 2:
        return this.produtosSelecionados.length > 0;
      case 3:
        if (this.tipoNegociacao === null) return false;
        if (this.tipoPrecoSelecionado.length === 0) return false;
        if (this.getFormasSelecionadas().length === 0) return false;

        if (this.tipoNegociacao === "fixo") {
          return this.precosFixosPorItem.size > 0;
        }

        return (
          (this.valorReais !== null && this.valorReais > 0) ||
          (this.valorPercentual !== null && this.valorPercentual > 0)
        );
      case 4:
        return true;
      default:
        return false;
    }
  }

  get progressPercent(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // ========== STEP 1: CLIENTES ==========

  filtrarClientes() {
    if (
      !this.dataLoad ||
      !this.dataLoad.pessoa ||
      !Array.isArray(this.dataLoad.pessoa)
    ) {
      console.warn("Dados de clientes não disponíveis");
      this.clientesFiltrados = [];
      return;
    }

    const temFiltroTexto =
      this.clientesBusca && this.clientesBusca.trim().length >= 3;
    const temFiltroData = this.dataCadastroInicial || this.dataCadastroFinal;

    if (!temFiltroTexto && !temFiltroData) {
      console.log(
        "Nenhum filtro aplicado. Use a busca (mín. 3 caracteres) ou filtro de data.",
      );
      this.clientesFiltrados = [];
      return;
    }

    let clientes = [...this.dataLoad.pessoa];

    if (this.clientesBusca && this.clientesBusca.trim()) {
      const busca = this.clientesBusca.toLowerCase().trim();
      clientes = clientes.filter(
        (c) =>
          c.nom_pessoa?.toLowerCase().includes(busca) ||
          c.num_cnpj_cpf?.includes(busca) ||
          c.cod_pessoa?.toString().includes(busca),
      );
    }

    if (this.dataCadastroInicial || this.dataCadastroFinal) {
      clientes = clientes.filter((c) => {
        if (!c.dta_cadastro) return false;

        const dataCadastro = moment(c.dta_cadastro);
        if (!dataCadastro.isValid()) return false;

        if (this.dataCadastroInicial && this.dataCadastroFinal) {
          const dataInicio = moment(this.dataCadastroInicial).startOf("day");
          const dataFim = moment(this.dataCadastroFinal).endOf("day");
          return dataCadastro.isBetween(dataInicio, dataFim, null, "[]");
        } else if (this.dataCadastroInicial) {
          const dataInicio = moment(this.dataCadastroInicial).startOf("day");
          return dataCadastro.isSameOrAfter(dataInicio);
        } else if (this.dataCadastroFinal) {
          const dataFim = moment(this.dataCadastroFinal).endOf("day");
          return dataCadastro.isSameOrBefore(dataFim);
        }

        return false;
      });
    }

    clientes.sort((a, b) => {
      const nomeA = (a.nom_pessoa || "").toLowerCase();
      const nomeB = (b.nom_pessoa || "").toLowerCase();
      return nomeA.localeCompare(nomeB);
    });

    const totalClientes = clientes.length;
    this.clientesFiltrados = clientes.slice(0, 500);

    if (totalClientes === 0) {
      this.alert.presentToast(
        "Nenhum cliente encontrado com os filtros aplicados",
        3000,
      );
    }
  }

  toggleCliente(cliente: any) {
    const codPessoa = cliente.cod_pessoa;
    if (this.clientesSelecionadosSet.has(codPessoa)) {
      this.clientesSelecionadosSet.delete(codPessoa);
      const index = this.clientesSelecionados.findIndex(
        (c) => c.cod_pessoa === codPessoa,
      );
      if (index >= 0) {
        this.clientesSelecionados.splice(index, 1);
      }
    } else {
      this.clientesSelecionadosSet.add(codPessoa);
      this.clientesSelecionados.push(cliente);
    }
  }

  isClienteSelecionado(cliente: any): boolean {
    return this.clientesSelecionadosSet.has(cliente.cod_pessoa);
  }

  onClienteBuscaChange() {
    this.filtrarClientes();
  }

  aplicarFiltroData() {
    this.filtrarClientes();
  }

  limparFiltroData() {
    this.dataCadastroInicial = "";
    this.dataCadastroFinal = "";
    this.clientesBusca = "";
    this.clientesSelecionados = [];
    this.clientesSelecionadosSet.clear();
    this.filtrarClientes();
  }

  // ========== STEP 2: PRODUTOS ==========

  filtrarProdutos() {
    // Só filtrar se houver busca ou filtro de subgrupo
    const temFiltroAtivo =
      this.produtosBusca?.trim() || this.subgrupoSelecionado !== null;

    if (!temFiltroAtivo) {
      // Sem filtros ativos - não mostrar produtos
      console.log("=== DEBUG filtrarProdutos ===");
      console.log("Nenhum filtro ativo - não mostrando produtos");
      this.produtosFiltrados = [];
      this.groupedProdutos = [];
      return;
    }

    let produtos = this.produtosDisponiveis || [];

    // Filtrar por subgrupo selecionado
    if (this.subgrupoSelecionado !== null) {
      produtos = produtos.filter(
        (p: any) => p.cod_subgrupo === this.subgrupoSelecionado,
      );
    }

    // Filtrar por busca de texto
    if (this.produtosBusca) {
      const busca = this.produtosBusca.toLowerCase();
      produtos = produtos.filter(
        (p: any) =>
          p.des_item?.toLowerCase().includes(busca) ||
          p.nom_item?.toLowerCase().includes(busca) ||
          p.cod_item?.toString().includes(busca) ||
          p.cod_barra?.toString().includes(busca),
      );
    }

    console.log("=== DEBUG filtrarProdutos ===");
    console.log("Total produtos filtrados:", produtos.length);

    // Check unique companies in filtered products
    const empresasUnicas = new Set(
      produtos.map((p) => p.cod_empresa).filter((c) => c),
    );
    console.log(
      "Empresas únicas nos produtos filtrados:",
      Array.from(empresasUnicas),
    );
    console.log(
      "Amostra de produtos (primeiros 3):",
      produtos.slice(0, 3).map((p) => ({
        nome: p.des_item || p.nom_item,
        cod_empresa: p.cod_empresa,
        nom_fantasia: p.nom_fantasia,
      })),
    );

    this.produtosFiltrados = produtos;
    this.groupedProdutos = this.groupProdutosByCodEmpresa(produtos);
  }

  groupProdutosByCodEmpresa(
    items: any[],
  ): { nom_fantasia: string; cod_empresa: number; items: any[] }[] {
    const groupedItems: {
      nom_fantasia: string;
      cod_empresa: number;
      items: any[];
    }[] = [];

    items.forEach((item) => {
      const foundGroup = groupedItems.find(
        (group) => group.cod_empresa === item.cod_empresa,
      );
      if (foundGroup) {
        foundGroup.items.push(item);
      } else {
        groupedItems.push({
          nom_fantasia: item.nom_fantasia,
          cod_empresa: item.cod_empresa,
          items: [item],
        });
      }
    });

    // Ordenar grupos por cod_empresa
    groupedItems.sort((a, b) => a.cod_empresa - b.cod_empresa);

    // Ordenar itens dentro de cada grupo por des_item
    groupedItems.forEach((group) => {
      group.items.sort((a, b) => {
        const desA = (a.des_item || "").toLowerCase();
        const desB = (b.des_item || "").toLowerCase();
        return desA.localeCompare(desB);
      });
    });

    return groupedItems;
  }

  toggleProduto(produto: any) {
    const codItem = produto.cod_item;

    if (this.produtosSelecionadosSet.has(codItem)) {
      // Remover TODAS as variações deste produto (de todas as empresas)
      this.produtosSelecionadosSet.delete(codItem);

      // Filtrar removendo todas as ocorrências do cod_item
      this.produtosSelecionados = this.produtosSelecionados.filter(
        (p) => p.cod_item !== codItem,
      );

      console.log(
        `Produto removido de todas as empresas: ${produto.des_item || produto.nom_item}`,
      );
    } else {
      this.produtosSelecionadosSet.add(codItem);
      this.produtosSelecionados.push(produto);
      console.log(`=== PRODUTO ADICIONADO ===`);
      console.log(`Nome: ${produto.des_item || produto.nom_item}`);
      console.log(`Código Item: ${produto.cod_item}`);
      console.log(`Código Empresa: ${produto.cod_empresa}`);
      console.log(`Nome Empresa: ${produto.nom_fantasia}`);
      console.log(`Possui cod_empresa?`, !!produto.cod_empresa);
      console.log(`Possui nom_fantasia?`, !!produto.nom_fantasia);
      console.log(
        `Total produtos selecionados agora:`,
        this.produtosSelecionados.length,
      );

      // Verificar distribuição por empresa
      const empresasCount = new Map<number, number>();
      this.produtosSelecionados.forEach((p) => {
        if (p.cod_empresa) {
          empresasCount.set(
            p.cod_empresa,
            (empresasCount.get(p.cod_empresa) || 0) + 1,
          );
        }
      });
      console.log(
        `Distribuição por empresa:`,
        Array.from(empresasCount.entries()).map(
          ([cod, qtd]) => `Empresa ${cod}: ${qtd} produto(s)`,
        ),
      );
    }
  }

  isProdutoSelecionado(produto: any): boolean {
    return this.produtosSelecionadosSet.has(produto.cod_item);
  }

  setFiltroProduto(filtro: string) {
    this.produtosFiltro = filtro;
    this.filtrarProdutos();
  }

  onProdutoBuscaChange() {
    this.filtrarProdutos();
  }

  onSubgrupoChange() {
    console.log("Subgrupo selecionado:", this.subgrupoSelecionado);
    this.produtosBusca = "";
    this.filtrarProdutos();
  }

  limparFiltroSubgrupo() {
    this.subgrupoSelecionado = null;
    this.filtrarProdutos();
  }

  getSubgrupoNome(cod_subgrupo: number | null): string {
    if (!cod_subgrupo) return "";
    const subgrupo = this.subgruposDisponiveis.find(
      (s) => s.cod_subgrupo === cod_subgrupo,
    );
    return subgrupo?.des_subgrupo || "";
  }

  abrirModalProdutosSelecionados() {
    this.isModalProdutosSelecionados = true;
  }

  fecharModalProdutosSelecionados() {
    this.isModalProdutosSelecionados = false;
  }

  // Métodos do modal de produtos por empresa
  // Método para contar produtos selecionados por empresa
  contarProdutosSelecionadosEmpresa(codEmpresa: number): number {
    return this.produtosSelecionados.filter(
      (produto) => produto.cod_empresa === codEmpresa,
    ).length;
  }

  // Getter para produtos não selecionados (disponíveis)
  get produtosNaoSelecionados(): any[] {
    return this.produtosFiltrados.filter(
      (produto) => !this.isProdutoSelecionado(produto),
    );
  }

  // Getter para produtos disponíveis únicos (sem duplicação)
  get produtosDisponiveisUnicos(): any[] {
    const produtosUnicos = new Map<number, any>();

    this.produtosFiltrados.forEach((produto) => {
      // Se o produto não está selecionado e ainda não foi adicionado ao mapa
      if (
        !this.isProdutoSelecionado(produto) &&
        !produtosUnicos.has(produto.cod_item)
      ) {
        produtosUnicos.set(produto.cod_item, produto);
      }
    });

    return Array.from(produtosUnicos.values());
  }

  // Método para selecionar produto único (adiciona de todas as empresas)
  selecionarProdutoUnico(produtoExemplo: any) {
    const codItem = produtoExemplo.cod_item;

    // Buscar todas as variações deste produto em diferentes empresas
    const variacoesProduto = this.produtosDisponiveis.filter(
      (p) => p.cod_item === codItem,
    );

    console.log(`=== SELECIONANDO PRODUTO ÚNICO ===`);
    console.log(
      `Produto: ${produtoExemplo.des_item || produtoExemplo.nom_item}`,
    );
    console.log(`Código: ${codItem}`);
    console.log(
      `Encontradas ${variacoesProduto.length} variação(ões) em empresas diferentes`,
    );

    // Adicionar todas as variações
    variacoesProduto.forEach((variacao) => {
      if (!this.produtosSelecionadosSet.has(codItem)) {
        this.produtosSelecionadosSet.add(codItem);
      }

      // Verificar se esta variação específica já foi adicionada
      const jaAdicionado = this.produtosSelecionados.some(
        (p) =>
          p.cod_item === variacao.cod_item &&
          p.cod_empresa === variacao.cod_empresa,
      );

      if (!jaAdicionado) {
        this.produtosSelecionados.push(variacao);
        console.log(
          `  → Adicionado: Empresa ${variacao.cod_empresa} - ${variacao.nom_fantasia}`,
        );
      }
    });

    console.log(
      `Total produtos selecionados agora: ${this.produtosSelecionados.length}`,
    );
  }

  // Getter para empresas com produtos selecionados
  get empresasComProdutosSelecionados(): {
    nom_fantasia: string;
    cod_empresa: number;
    items: any[];
  }[] {
    const empresasMap = new Map<
      number,
      { nom_fantasia: string; cod_empresa: number; items: any[] }
    >();

    console.log("=== DEBUG empresasComProdutosSelecionados ===");
    console.log(
      "Total de produtos selecionados:",
      this.produtosSelecionados.length,
    );

    this.produtosSelecionados.forEach((produto) => {
      // Verificar se o produto tem as propriedades necessárias
      if (!produto.cod_empresa) {
        console.warn(`[AVISO] Produto sem cod_empresa:`, produto);
        return; // Pular este produto
      }

      if (!produto.nom_fantasia) {
        console.warn(`[AVISO] Produto sem nom_fantasia:`, produto);
      }

      console.log(
        `Produto: ${produto.des_item || produto.nom_item}, Empresa: ${produto.cod_empresa} - ${produto.nom_fantasia}`,
      );

      if (!empresasMap.has(produto.cod_empresa)) {
        empresasMap.set(produto.cod_empresa, {
          nom_fantasia: produto.nom_fantasia || "Empresa Desconhecida",
          cod_empresa: produto.cod_empresa,
          items: [],
        });
      }
      empresasMap.get(produto.cod_empresa)!.items.push(produto);
    });

    const result = Array.from(empresasMap.values()).sort(
      (a, b) => a.cod_empresa - b.cod_empresa,
    );
    console.log("Total de empresas com produtos selecionados:", result.length);
    console.log(
      "Empresas:",
      result.map((e) => ({
        cod: e.cod_empresa,
        nome: e.nom_fantasia,
        qtd: e.items.length,
      })),
    );

    return result;
  }

  // Getter para produtos selecionados ordenados (para o resumo)
  get produtosSelecionadosOrdenados(): any[] {
    return [...this.produtosSelecionados].sort((a, b) => {
      // Primeiro ordena por empresa
      if (a.cod_empresa !== b.cod_empresa) {
        return a.cod_empresa - b.cod_empresa;
      }

      // Depois ordena por descrição do item
      const desA = (a.des_item || a.nom_item || "").toLowerCase();
      const desB = (b.des_item || b.nom_item || "").toLowerCase();
      return desA.localeCompare(desB);
    });
  }

  // Métodos para expandir/colapsar accordions
  expandirTodos() {
    if (this.accordionGroup) {
      const values = this.empresasComProdutosSelecionados.map(
        (e) => `empresa_${e.cod_empresa}`,
      );
      this.accordionGroup.value = values;
    }
  }

  colapsarTodos() {
    if (this.accordionGroup) {
      this.accordionGroup.value = undefined;
    }
  }

  getPrecoEditavel(cod_item: number): number {
    return this.precosEditaveis.get(cod_item) || 0;
  }

  setPrecoEditavel(cod_item: number, valor: any) {
    const valorNumerico = parseFloat(valor) || 0;
    this.precosEditaveis.set(cod_item, valorNumerico);
  }

  removerProdutoSelecionado(produto: any) {
    this.toggleProduto(produto);
  }

  // ========== STEP 3: NEGOCIAÇÃO ==========

  setTipoNegociacao(tipo: "desconto" | "acrescimo" | "fixo") {
    this.tipoNegociacao = tipo;

    if (tipo === "fixo") {
      this.valorReais = null;
      this.valorPercentual = null;
    } else {
      this.limparPrecosFixos();
    }
  }

  onValorReaisChange() {
    if (this.valorReais && this.valorReais > 0) {
      this.valorPercentual = null;
    }
  }

  onValorPercentualChange() {
    if (this.valorPercentual && this.valorPercentual > 0) {
      this.valorReais = null;
    }
  }

  getPrecoFixoItem(cod_item: number): number | null {
    return this.precosFixosPorItem.get(cod_item) || null;
  }

  setPrecoFixoItem(cod_item: number, preco: any) {
    const precoString = String(preco).replace(",", ".");
    const precoNumerico = parseFloat(precoString);

    if (!isNaN(precoNumerico) && precoNumerico > 0) {
      this.precosFixosPorItem.set(cod_item, precoNumerico);
    } else if (preco === "" || preco === null || preco === undefined) {
      this.precosFixosPorItem.delete(cod_item);
    }
  }

  formatarPrecoFixo(cod_item: number, evento: any) {
    const valor = this.precosFixosPorItem.get(cod_item);
    if (valor) {
      const precoFormatado = Math.round(valor * 100) / 100;
      this.precosFixosPorItem.set(cod_item, precoFormatado);

      const input = evento.target as HTMLInputElement;
      input.value = precoFormatado.toFixed(2);
    }
  }

  getPrecoAtualItem(item: any): number | null {
    return item?.val_preco_venda || item?.val_custo_medio || null;
  }

  limparPrecosFixos() {
    this.precosFixosPorItem.clear();
  }

  toggleTipoPreco(codigo: string) {
    const index = this.tipoPrecoSelecionado.indexOf(codigo);
    if (index >= 0) {
      this.tipoPrecoSelecionado.splice(index, 1);
    } else {
      this.tipoPrecoSelecionado.push(codigo);
    }
  }

  toggleFormaPagamento(codigo: string) {
    const index = this.formasPagamentoSelecionadas.indexOf(codigo);
    if (index >= 0) {
      this.formasPagamentoSelecionadas.splice(index, 1);
    } else {
      this.formasPagamentoSelecionadas.push(codigo);
    }
  }

  // ========== MODAL DE FORMAS DE PAGAMENTO ==========

  setOpenModalFormaPagto(isOpen: boolean) {
    this.isModalFormaPagto = isOpen;

    if (isOpen) {
      this.formaPagtoFiltrada = [...(this.movimento.formaPagto || [])];
      this.formaPagtoFiltrada.sort((a, b) => {
        const nomeA = (a.des_forma_pagto || "").toLowerCase();
        const nomeB = (b.des_forma_pagto || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });
      this.tiposSelecionadosFiltro = [];
    }
  }

  addFormaPagto(cod_forma_pagto: number, ev: any) {
    const isChecked = ev.detail.checked;

    const forma = this.formaPagtoFiltrada.find(
      (f) => f.cod_forma_pagto === cod_forma_pagto,
    );
    if (forma) {
      forma.ind_selecionado = isChecked;
    }

    const formaMovimento = this.movimento.formaPagto.find(
      (f) => f.cod_forma_pagto === cod_forma_pagto,
    );
    if (formaMovimento) {
      formaMovimento.ind_selecionado = isChecked;
    }

    if (isChecked) {
      if (
        !this.formasPagamentoSelecionadas.includes(cod_forma_pagto.toString())
      ) {
        this.formasPagamentoSelecionadas.push(cod_forma_pagto.toString());
      }
    } else {
      const index = this.formasPagamentoSelecionadas.indexOf(
        cod_forma_pagto.toString(),
      );
      if (index >= 0) {
        this.formasPagamentoSelecionadas.splice(index, 1);
      }
    }
  }

  filtrarFormaPagto(ev: any) {
    const busca = ev.target.value?.toLowerCase() || "";

    if (!busca) {
      this.formaPagtoFiltrada = [...(this.movimento.formaPagto || [])];
    } else {
      this.formaPagtoFiltrada = (this.movimento.formaPagto || []).filter(
        (forma) =>
          forma.des_forma_pagto?.toLowerCase().includes(busca) ||
          forma.cod_forma_pagto?.toString().includes(busca),
      );
    }

    this.formaPagtoFiltrada.sort((a, b) => {
      const nomeA = (a.des_forma_pagto || "").toLowerCase();
      const nomeB = (b.des_forma_pagto || "").toLowerCase();
      return nomeA.localeCompare(nomeB);
    });
  }

  getFormasSelecionadas() {
    return (this.movimento.formaPagto || []).filter((f) => f.ind_selecionado);
  }

  selecionarTodasFormas() {
    this.formaPagtoFiltrada.forEach((forma) => {
      forma.ind_selecionado = true;
    });
  }

  desmarcarTodasFormas() {
    this.formaPagtoFiltrada.forEach((forma) => {
      forma.ind_selecionado = false;
    });
  }

  marcarFormasPagto(ev: any) {
    const tiposSelecionados = ev.detail.value || [];
    this.tiposSelecionadosFiltro = tiposSelecionados;

    if (tiposSelecionados.length === 0) {
      this.formaPagtoFiltrada = [...this.movimento.formaPagto];
    } else {
      this.formaPagtoFiltrada = this.movimento.formaPagto.filter((forma) => {
        return tiposSelecionados.some(
          (tipo: formaPagto) => tipo.ind_tipo === forma.ind_tipo,
        );
      });
    }

    this.formaPagtoFiltrada.sort((a, b) => {
      const nomeA = (a.des_forma_pagto || "").toLowerCase();
      const nomeB = (b.des_forma_pagto || "").toLowerCase();
      return nomeA.localeCompare(nomeB);
    });
  }

  calcularDuracao(): number {
    if (!this.dataInicio || !this.dataFim) return 0;
    const inicio = moment(this.dataInicio);
    const fim = moment(this.dataFim);
    this.duracaoNegociacao = fim.diff(inicio, "days");
    return this.duracaoNegociacao;
  }

  onDataChange() {
    this.calcularDuracao();
  }

  // ========== STEP 4: ENVIAR ==========

  async enviarNegociacao() {
    if (!this.clientesSelecionados || this.clientesSelecionados.length === 0) {
      this.alert.presentToast("Selecione pelo menos um cliente", 3000);
      return;
    }

    if (!this.produtosSelecionados || this.produtosSelecionados.length === 0) {
      this.alert.presentToast("Selecione pelo menos um produto", 3000);
      return;
    }

    const negociacaoNova: pessoaNegociacao[] = [];
    const dataDeHoje = moment();
    const dataInicioFormatada = moment(this.dataInicio).format("YYYY-MM-DD");

    // Determinar se é Valor (V) ou Percentual (P)
    // Preço Fixo sempre é Valor (V)
    const percentualValor =
      this.tipoNegociacao === "fixo"
        ? "V"
        : this.valorReais
          ? "V"
          : this.valorPercentual
            ? "P"
            : "V"; // Default: Valor

    const formasSelecionadas = this.movimento.formaPagto
      .filter((row) =>
        this.formasPagamentoSelecionadas.includes(
          row.cod_forma_pagto.toString(),
        ),
      )
      .map((forma) => ({
        cod_condicao_pagamento: forma.cod_forma_pagto,
        des_forma_pagto: forma.des_forma_pagto,
      }));

    if (formasSelecionadas.length === 0) {
      this.alert.presentToast(
        "Selecione pelo menos uma forma de pagamento",
        3000,
      );
      return;
    }

    this.produtosSelecionados.forEach((item) => {
      formasSelecionadas.forEach((forma) => {
        let valorCalculado = 0;
        const precoAtual = this.getPrecoAtualItem(item) || 0;

        if (this.tipoNegociacao === "fixo") {
          valorCalculado =
            this.precosFixosPorItem.get(item.cod_item) || precoAtual;
        } else {
          valorCalculado = this.calculaValor(
            this.tipoNegociacao === "acrescimo" ? "A" : "D",
            this.valorReais || 0,
            this.valorPercentual || 0,
            precoAtual,
          );
        }

        const custoMedio = item.val_custo_medio || 0;
        const valorValido = valorCalculado >= custoMedio;

        const negociacao: pessoaNegociacao = {
          cod_item: item.cod_item,
          des_item: item.des_item || item.nom_item || `Item ${item.cod_item}`,
          dta_inicio: dataInicioFormatada,
          val_preco_venda_a: 0,
          val_preco_venda_b: 0,
          val_preco_venda_c: 0,
          val_preco_venda_d: 0,
          val_preco_venda_e: 0,
          val_custo_medio: custoMedio,
          cod_pessoa: 0,
          ...forma,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao:
            this.tipoNegociacao === "acrescimo"
              ? "A"
              : this.tipoNegociacao === "desconto"
                ? "D"
                : "P",
          ind_percentual_valor: percentualValor,
          ind_tipo_preco_base: "A",
          nom_pessoa: "",
          ind_adicionado: true,
          val_preco_venda: precoAtual,
          valor_calculado: valorCalculado,
          valor_valido: valorValido,
          valor: this.valorReais || this.valorPercentual || 0,
          nom_fantasia: item.nom_fantasia || "",
          cod_empresa: item.cod_empresa || this.auth.userLogado.cod_empresa_sel,
          margem: this.calculaMargem(valorCalculado, custoMedio),
          margem_valor: this.calculaMargemValor(valorCalculado, custoMedio),
          percentual_alteracao: this.calculaPercentualAlteracao(
            precoAtual,
            valorCalculado,
          ),
        };

        this.tipoPrecoSelecionado.forEach((tp) => {
          const campo = `val_preco_venda_${tp.toLowerCase()}`;
          // Para Preço Fixo (P), salva o valor calculado
          // Para Desconto (D) ou Acréscimo (A), salva o valor informado
          if (negociacao.ind_tipo_negociacao === "P") {
            negociacao[campo] = valorCalculado;
          } else {
            negociacao[campo] = this.valorReais || this.valorPercentual || 0;
          }
        });

        negociacaoNova.push(negociacao);
      });
    });

    const regrasValidas = negociacaoNova.filter((r) => r.valor_valido);

    if (regrasValidas.length === 0) {
      const regrasInvalidas = negociacaoNova.filter((r) => !r.valor_valido);
      const itensComProblema = regrasInvalidas
        .map(
          (r) =>
            `• ${r.des_item} (Custo: R$ ${r.val_custo_medio?.toFixed(2) || "0,00"} - Novo Preço: R$ ${r.valor_calculado?.toFixed(2) || "0,00"})`,
        )
        .join("\n");

      this.alert.presentAlert(
        "⚠️ Negociação com Margem Inválida",
        "Novo preço abaixo do custo",
        `Os seguintes itens possuem o novo preço ABAIXO do custo:\n\n${itensComProblema}`,
      );
      return;
    }

    const totalRegistros =
      regrasValidas.length * this.clientesSelecionados.length;
    if (totalRegistros > 5000) {
      this.alert.presentAlert(
        "⚠️ Limite Excedido",
        "Máximo de 5.000 Registros",
        `O total de negociações (${totalRegistros.toLocaleString()}) excede o limite permitido.`,
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: "Enviando negociação...",
      duration: 50000,
    });
    await loading.present();

    this.movimento
      .novaNegociacao(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
        this.auth.userLogado.nom_usuario,
        this.auth.userLogado.cod_usuario,
        this.clientesSelecionados,
        regrasValidas,
      )
      .pipe(timeout(30000))
      .subscribe({
        next: () => {
          loading.dismiss();

          this.limparDados();
          this.currentStep = 5;

          setTimeout(() => {
            this.router.navigate(["/home"]);
          }, 3000);
        },
        error: (error) => {
          loading.dismiss();

          if (error.name === "TimeoutError") {
            this.alert.presentToast(
              "⏱️ Tempo esgotado ao enviar negociações. Verifique sua conexão",
              4000,
            );
          } else {
            this.alert.presentAlert(
              "Erro",
              "Falha ao enviar",
              error.message || "Erro ao processar negociações",
            );
          }
        },
      });
  }

  limparDados() {
    this.clientesSelecionados = [];
    this.clientesSelecionadosSet.clear();
    this.produtosSelecionados = [];
    this.produtosSelecionadosSet.clear();
    this.precosFixosPorItem.clear();
    this.tipoPrecoSelecionado = [];
    this.formasPagamentoSelecionadas = [];
    this.tipoNegociacao = null;
    this.valorReais = null;
    this.valorPercentual = null;
  }

  // ========== MÉTODOS DE CÁLCULO ==========

  calculaValor(
    tipo: string,
    valor: number,
    percentual: number,
    valorVenda: number,
  ): number {
    let valorCalculado = 0;

    if (tipo === "A") {
      valorCalculado =
        valor > 0
          ? valorVenda + valor
          : valorVenda + (percentual / 100) * valorVenda;
    } else if (tipo === "D") {
      valorCalculado =
        valor > 0
          ? valorVenda - valor
          : valorVenda - (percentual / 100) * valorVenda;
    } else if (tipo === "P") {
      valorCalculado = valor > 0 ? valor : valorVenda;
    }

    return valorCalculado;
  }

  calculaMargem(precoVenda: number, custo: number): number {
    if (!custo || custo === 0) return 0;
    return ((precoVenda - custo) / precoVenda) * 100;
  }

  calculaMargemValor(precoVenda: number, custo: number): number {
    return precoVenda - custo;
  }

  calculaPercentualAlteracao(precoAtual: number, precoNovo: number): number {
    if (!precoAtual || precoAtual === 0) return 0;
    return ((precoNovo - precoAtual) / precoAtual) * 100;
  }

  voltar() {
    this.router.navigate(["/home"]);
  }

  // ========== HELPERS ==========

  getTipoPrecoNome(codigo: string): string {
    return this.tipoPrecoNomeCache.get(codigo) || "";
  }

  getFormaPagamentoNome(codigo: string): string {
    return this.formaPagamentoNomeCache.get(codigo) || "";
  }

  formatarData(data: string): string {
    return moment(data).format("DD/MM/YYYY");
  }

  getProdutoNome(produto: any): string {
    return produto.des_item || produto.nom_item || `Item ${produto.cod_item}`;
  }

  // ========== CÁLCULOS PARA RESUMO ==========

  calcularNovoPreco(item: any): number {
    const precoAtual = this.getPrecoAtualItem(item) || 0;

    if (this.tipoNegociacao === "fixo") {
      return this.precosFixosPorItem.get(item.cod_item) || precoAtual;
    } else if (this.tipoNegociacao === "desconto") {
      if (this.valorReais) {
        return precoAtual - this.valorReais;
      } else if (this.valorPercentual) {
        return precoAtual - (precoAtual * this.valorPercentual) / 100;
      }
    } else if (this.tipoNegociacao === "acrescimo") {
      if (this.valorReais) {
        return precoAtual + this.valorReais;
      } else if (this.valorPercentual) {
        return precoAtual + (precoAtual * this.valorPercentual) / 100;
      }
    }

    return precoAtual;
  }

  calcularDiferencaPreco(item: any): number {
    const precoAtual = this.getPrecoAtualItem(item) || 0;
    const novoPreco = this.calcularNovoPreco(item);
    return novoPreco - precoAtual;
  }

  getCustoItem(item: any): number {
    return item?.val_custo_medio || 0;
  }

  calcularMargem(item: any): number {
    const novoPreco = this.calcularNovoPreco(item);
    const custo = this.getCustoItem(item);
    return novoPreco - custo;
  }

  calcularMargemPercentual(item: any): number {
    const custo = this.getCustoItem(item);
    if (custo === 0) return 0;

    const margem = this.calcularMargem(item);
    return (margem / custo) * 100;
  }

  // ========== TRACKBY FUNCTIONS ==========

  trackByCliente(index: number, cliente: any): number {
    return cliente.cod_pessoa;
  }

  trackByProduto(index: number, produto: any): number {
    return produto.cod_item;
  }

  trackByTipoPreco(index: number, tipo: any): string {
    return tipo.codigo;
  }

  trackByFormaPagamento(index: number, forma: any): string {
    return forma.codigo;
  }

  trackByString(index: number, item: string): string {
    return item;
  }

  trackByEmpresaGroup(index: number, group: any): number {
    return group.cod_empresa;
  }
}
