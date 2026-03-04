import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
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
  selector: "app-negociacao-combustivel",
  templateUrl: "./negociacao-combustivel.page.html",
  styleUrls: ["./negociacao-combustivel.page.scss"],
  standalone: false,
})
export class NegociacaoCombustivelPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Controle de steps
  currentStep = 1;
  totalSteps = 4;

  // Step 1: Clientes
  clientesBusca = "";
  dataCadastroInicial: string = "";
  dataCadastroFinal: string = "";
  clientesSelecionados: any[] = [];
  clientesFiltrados: any[] = []; // Cache da lista filtrada
  private clientesSelecionadosSet = new Set<number>(); // O(1) lookup!

  // Step 2: Combustíveis
  combustiveisBusca = "";
  combustiveisFiltro = "todos";
  combustiveisSelecionados: any[] = [];
  combustiveisDisponiveis: any[] = []; // Lista completa de combustíveis
  combustiveisFiltrados: any[] = []; // Cache da lista filtrada
  groupedCombustiveis: {
    nom_fantasia: string;
    cod_empresa: number;
    items: any[];
  }[] = []; // Combustíveis agrupados por empresa
  private combustiveisSelecionadosSet = new Set<number>(); // O(1) lookup!

  // Cache para nomes (memoização)
  private tipoPrecoNomeCache = new Map<string, string>();
  private formaPagamentoNomeCache = new Map<string, string>();

  // Step 3: Negociação
  tipoNegociacao: "desconto" | "acrescimo" | "fixo" | null = null;
  valorReais: number | null = null;
  valorPercentual: number | null = null;
  precosFixosPorItem: Map<number, number> = new Map(); // cod_item -> preço fixo
  tipoPrecoSelecionado: string[] = [];
  formasPagamentoSelecionadas: string[] = [];
  dataInicio: string = moment().format("YYYY-MM-DD");
  dataFim: string = moment().add(30, "days").format("YYYY-MM-DD");
  volumeMinimo: number | null = null;
  volumeMaximo: number | null = null;
  duracaoNegociacao: number = 30; // Cache da duração calculada

  // Modal de formas de pagamento
  isModalFormaPagto = false;
  formaPagtoFiltrada: formaPagto[] = [];
  tiposSelecionadosFiltro: formaPagto[] = []; // Tipos selecionados para filtro

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
    console.log("NegociacaoCombustivelPage initialized");

    // PROTEÇÃO: Verificar se dados estão disponíveis
    if (!this.dataLoad || !this.dataLoad.pessoa) {
      console.error("DataLoad não inicializado. Redirecionando...");
      this.alert.presentToast(
        "Erro ao carregar dados. Retornando ao menu.",
        3000,
      );
      setTimeout(() => this.router.navigate(["/home"]), 1000);
      return;
    }

    this.carregarDados();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== CARREGAMENTO DE DADOS ==========

  async carregarDados() {
    const loading = await this.loadingCtrl.create({
      message: "Carregando dados...",
    });
    await loading.present();

    try {
      // Carregar combustíveis se ainda não foram carregados
      if (
        !this.combustiveisDisponiveis ||
        this.combustiveisDisponiveis.length === 0
      ) {
        const data = await this.movimento
          .buscaFiltroItem(
            this.auth.userLogado.schema,
            this.auth.userLogado.cod_empresa_sel,
          )
          .toPromise();

        this.combustiveisDisponiveis = data.item || [];

        // Carregar formas de pagamento do backend
        this.movimento.formaPagto = data.formaPagto || [];
        this.movimento.tipoFormaPagto = data.tipoFormaPagto || [];

        console.log(
          "DEBUG - Estrutura dos combustíveis:",
          this.combustiveisDisponiveis.slice(0, 2),
        );
        console.log(
          "DEBUG - Formas de pagamento carregadas:",
          this.movimento.formaPagto.length,
        );
      }

      // Verificar novamente após carregamento
      if (!this.dataLoad.pessoa || this.dataLoad.pessoa.length === 0) {
        console.error("Nenhum cliente carregado");
        this.clientesFiltrados = [];
      }
      console.log("Clientes disponíveis:", this.dataLoad.pessoa?.length || 0);
      console.log(
        "Combustíveis carregados:",
        this.combustiveisDisponiveis.length,
      );

      // COMBUSTÍVEIS: Carregar todos automaticamente para mostrar no step 2
      this.filtrarCombustiveis();

      // CLIENTES: NÃO carregar automaticamente - usuário precisa buscar primeiro
      this.clientesFiltrados = [];

      // FORMAS DE PAGAMENTO: Carregar do movimento service
      this.formaPagtoFiltrada = [...(this.movimento.formaPagto || [])];
      // Ordenar alfabeticamente por nome
      this.formaPagtoFiltrada.sort((a, b) => {
        const nomeA = (a.des_forma_pagto || "").toLowerCase();
        const nomeB = (b.des_forma_pagto || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });

      console.log("✓ Clientes: Aguardando filtro do usuário");
      console.log(
        "✓ Combustíveis disponíveis:",
        this.combustiveisFiltrados.length,
      );
      console.log(
        "✓ Formas de pagamento carregadas:",
        this.formaPagtoFiltrada.length,
      );

      await loading.dismiss();

      // Verificar se não há dados disponíveis
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

      // Debug ao avançar para step 3 (negociação)
      if (this.currentStep === 3) {
        console.log("=== STEP 3: Combustíveis Selecionados ===");
        console.log("Total:", this.combustiveisSelecionados.length);
        console.log("Dados:", this.combustiveisSelecionados.slice(0, 2));
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
        return this.combustiveisSelecionados.length > 0;
      case 3:
        if (this.tipoNegociacao === null) return false;
        if (this.tipoPrecoSelecionado.length === 0) return false;

        // Validar formas de pagamento selecionadas (via modal)
        if (this.getFormasSelecionadas().length === 0) return false;

        // Para preço fixo, validar se há pelo menos um preço definido
        if (this.tipoNegociacao === "fixo") {
          return this.precosFixosPorItem.size > 0;
        }

        // Para desconto/acréscimo, validar se há valor em R$ ou %
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
    // PROTEÇÃO: Verificar se dados existem
    if (
      !this.dataLoad ||
      !this.dataLoad.pessoa ||
      !Array.isArray(this.dataLoad.pessoa)
    ) {
      console.warn("Dados de clientes não disponíveis");
      this.clientesFiltrados = [];
      return;
    }

    // IMPORTANTE: Só mostrar clientes se houver algum filtro aplicado
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
    console.log("Total de clientes disponíveis:", clientes.length);

    // Filtro de busca por texto
    if (this.clientesBusca && this.clientesBusca.trim()) {
      const busca = this.clientesBusca.toLowerCase().trim();
      clientes = clientes.filter(
        (c) =>
          c.nom_pessoa?.toLowerCase().includes(busca) ||
          c.num_cnpj_cpf?.includes(busca) ||
          c.cod_pessoa?.toString().includes(busca),
      );
      console.log(`Após filtro texto: ${clientes.length} clientes`);
    }

    // Filtro por data de cadastro
    if (this.dataCadastroInicial || this.dataCadastroFinal) {
      console.log("=== FILTRO DE DATA ===");
      console.log("Data Inicial:", this.dataCadastroInicial);
      console.log("Data Final:", this.dataCadastroFinal);

      const totalAntes = clientes.length;
      let exemplosIncluidos = 0;

      clientes = clientes.filter((c) => {
        // Se não tem data de cadastro, não inclui no resultado
        if (!c.dta_cadastro) {
          return false;
        }

        // Parsear a data de cadastro do cliente
        const dataCadastro = moment(c.dta_cadastro);

        // Se a data é inválida, não inclui
        if (!dataCadastro.isValid()) {
          console.warn(
            `Data inválida para cliente ${c.cod_pessoa}:`,
            c.dta_cadastro,
          );
          return false;
        }

        let incluir = false;

        // Filtro com ambas as datas
        if (this.dataCadastroInicial && this.dataCadastroFinal) {
          const dataInicio = moment(this.dataCadastroInicial).startOf("day");
          const dataFim = moment(this.dataCadastroFinal).endOf("day");

          incluir = dataCadastro.isBetween(dataInicio, dataFim, null, "[]");

          if (incluir && exemplosIncluidos < 3) {
            console.log(
              `✓ Cliente ${c.nom_pessoa} - Data: ${dataCadastro.format("DD/MM/YYYY")} está entre ${dataInicio.format("DD/MM/YYYY")} e ${dataFim.format("DD/MM/YYYY")}`,
            );
            exemplosIncluidos++;
          }
        }
        // Filtro apenas com data inicial
        else if (this.dataCadastroInicial) {
          const dataInicio = moment(this.dataCadastroInicial).startOf("day");
          incluir = dataCadastro.isSameOrAfter(dataInicio);

          if (incluir && exemplosIncluidos < 3) {
            console.log(
              `✓ Cliente ${c.nom_pessoa} - Data: ${dataCadastro.format("DD/MM/YYYY")} >= ${dataInicio.format("DD/MM/YYYY")}`,
            );
            exemplosIncluidos++;
          }
        }
        // Filtro apenas com data final
        else if (this.dataCadastroFinal) {
          const dataFim = moment(this.dataCadastroFinal).endOf("day");
          incluir = dataCadastro.isSameOrBefore(dataFim);

          if (incluir && exemplosIncluidos < 3) {
            console.log(
              `✓ Cliente ${c.nom_pessoa} - Data: ${dataCadastro.format("DD/MM/YYYY")} <= ${dataFim.format("DD/MM/YYYY")}`,
            );
            exemplosIncluidos++;
          }
        }

        return incluir;
      });

      console.log(
        `Após filtro data: ${clientes.length} de ${totalAntes} clientes`,
      );
    }

    // ORDENAÇÃO: Ordenar clientes alfabeticamente por nome
    clientes.sort((a, b) => {
      const nomeA = (a.nom_pessoa || "").toLowerCase();
      const nomeB = (b.nom_pessoa || "").toLowerCase();
      return nomeA.localeCompare(nomeB);
    });

    // LIMITE: Máximo 500 resultados para evitar travamento
    const totalClientes = clientes.length;
    this.clientesFiltrados = clientes.slice(0, 500);

    console.log(
      `✓ Resultado final: ${this.clientesFiltrados.length} clientes (ordenados alfabeticamente)`,
    );

    // Removido: Toast de aviso quando há muitos resultados
    // Para melhorar UX, não mostrar alertas durante filtragem
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

  // ========== STEP 2: COMBUSTÍVEIS ==========

  filtrarCombustiveis() {
    let combustiveis = this.combustiveisDisponiveis || [];

    if (this.combustiveisBusca) {
      const busca = this.combustiveisBusca.toLowerCase();
      combustiveis = combustiveis.filter(
        (c: any) =>
          c.des_item?.toLowerCase().includes(busca) ||
          c.nom_item?.toLowerCase().includes(busca) ||
          c.cod_item?.toString().includes(busca),
      );
    }

    console.log("Combustíveis filtrados:", combustiveis.length);
    this.combustiveisFiltrados = combustiveis;
    this.groupedCombustiveis = this.groupCombustiveisByCodEmpresa(combustiveis);
  }

  groupCombustiveisByCodEmpresa(
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

    return groupedItems;
  }

  toggleCombustivel(combustivel: any) {
    const codItem = combustivel.cod_item;
    if (this.combustiveisSelecionadosSet.has(codItem)) {
      this.combustiveisSelecionadosSet.delete(codItem);
      const index = this.combustiveisSelecionados.findIndex(
        (c) => c.cod_item === codItem,
      );
      if (index >= 0) {
        this.combustiveisSelecionados.splice(index, 1);
      }
    } else {
      this.combustiveisSelecionadosSet.add(codItem);
      this.combustiveisSelecionados.push(combustivel);
    }
  }

  isCombustivelSelecionado(combustivel: any): boolean {
    return this.combustiveisSelecionadosSet.has(combustivel.cod_item);
  }

  setFiltroCombustivel(filtro: string) {
    this.combustiveisFiltro = filtro;
    this.filtrarCombustiveis();
  }

  onCombustivelBuscaChange() {
    this.filtrarCombustiveis();
  }

  // ========== STEP 3: NEGOCIAÇÃO ==========

  setTipoNegociacao(tipo: "desconto" | "acrescimo" | "fixo") {
    this.tipoNegociacao = tipo;

    // Limpar valores ao trocar de tipo
    if (tipo === "fixo") {
      // Ao selecionar pre\u00e7o fixo, limpar valores de desconto/acr\u00e9scimo
      this.valorReais = null;
      this.valorPercentual = null;
    } else {
      // Ao selecionar desconto/acr\u00e9scimo, limpar pre\u00e7os fixos
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
  // ========== PREÇOS FIXOS POR ITEM ==========

  getPrecoFixoItem(cod_item: number): number | null {
    return this.precosFixosPorItem.get(cod_item) || null;
  }

  setPrecoFixoItem(cod_item: number, preco: any) {
    // Não processar durante a digitação, apenas armazenar o valor bruto
    const precoString = String(preco).replace(",", ".");
    const precoNumerico = parseFloat(precoString);

    if (!isNaN(precoNumerico) && precoNumerico > 0) {
      // Não arredondar durante a digitação, armazenar o valor digitado
      this.precosFixosPorItem.set(cod_item, precoNumerico);
    } else if (preco === "" || preco === null || preco === undefined) {
      this.precosFixosPorItem.delete(cod_item);
    }
  }

  formatarPrecoFixo(cod_item: number, evento: any) {
    // Formata o valor ao perder o foco (blur)
    const valor = this.precosFixosPorItem.get(cod_item);
    if (valor) {
      // Arredondar para 2 casas decimais
      const precoFormatado = Math.round(valor * 100) / 100;
      this.precosFixosPorItem.set(cod_item, precoFormatado);

      const input = evento.target as HTMLInputElement;
      input.value = precoFormatado.toFixed(2);

      console.log(
        `Preço fixo formatado: Item ${cod_item} = R$ ${precoFormatado.toFixed(2)}`,
      );
    }
  }

  getPrecoAtualItem(item: any): number | null {
    const preco = item?.val_preco_venda || item?.val_custo_medio || null;
    return preco;
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

    // Ao abrir o modal, atualizar lista filtrada com dados do movimento
    if (isOpen) {
      this.formaPagtoFiltrada = [...(this.movimento.formaPagto || [])];
      // Ordenar alfabeticamente por nome
      this.formaPagtoFiltrada.sort((a, b) => {
        const nomeA = (a.des_forma_pagto || "").toLowerCase();
        const nomeB = (b.des_forma_pagto || "").toLowerCase();
        return nomeA.localeCompare(nomeB);
      });
      this.tiposSelecionadosFiltro = []; // Limpar filtro de tipos
      console.log(
        "Modal aberto - Formas disponíveis:",
        this.formaPagtoFiltrada.length,
      );
    }
  }

  addFormaPagto(cod_forma_pagto: number, ev: any) {
    const isChecked = ev.detail.checked;

    // Atualizar o ind_selecionado do item
    const forma = this.formaPagtoFiltrada.find(
      (f) => f.cod_forma_pagto === cod_forma_pagto,
    );
    if (forma) {
      forma.ind_selecionado = isChecked;
    }

    // Atualizar também no movimento.formaPagto
    const formaMovimento = this.movimento.formaPagto.find(
      (f) => f.cod_forma_pagto === cod_forma_pagto,
    );
    if (formaMovimento) {
      formaMovimento.ind_selecionado = isChecked;
    }

    // Atualizar lista de selecionadas (apenas códigos)
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

    // Ordenar alfabeticamente por nome
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
    // Seleciona todas as formas visíveis na lista filtrada
    this.formaPagtoFiltrada.forEach((forma) => {
      forma.ind_selecionado = true;
    });
    console.log(
      "Selecionadas todas as formas visíveis:",
      this.formaPagtoFiltrada.length,
    );
  }

  desmarcarTodasFormas() {
    // Desmarca todas as formas visíveis na lista filtrada
    this.formaPagtoFiltrada.forEach((forma) => {
      forma.ind_selecionado = false;
    });
    console.log("Desmarcadas todas as formas visíveis");
  }

  marcarFormasPagto(ev: any) {
    const tiposSelecionados = ev.detail.value || [];
    this.tiposSelecionadosFiltro = tiposSelecionados;

    // Se nenhum tipo selecionado, mostrar todos
    if (tiposSelecionados.length === 0) {
      this.formaPagtoFiltrada = [...this.movimento.formaPagto];
    } else {
      // Filtrar formas de pagamento pelos tipos selecionados
      this.formaPagtoFiltrada = this.movimento.formaPagto.filter((forma) => {
        return tiposSelecionados.some(
          (tipo: formaPagto) => tipo.ind_tipo === forma.ind_tipo,
        );
      });
    }

    // Ordenar alfabeticamente por nome
    this.formaPagtoFiltrada.sort((a, b) => {
      const nomeA = (a.des_forma_pagto || "").toLowerCase();
      const nomeB = (b.des_forma_pagto || "").toLowerCase();
      return nomeA.localeCompare(nomeB);
    });

    console.log(
      `Filtrado por tipo: ${this.formaPagtoFiltrada.length} formas disponíveis`,
    );
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
    // 1. Validar se há dados suficientes
    if (!this.clientesSelecionados || this.clientesSelecionados.length === 0) {
      this.alert.presentToast("Selecione pelo menos um cliente", 3000);
      return;
    }

    if (
      !this.combustiveisSelecionados ||
      this.combustiveisSelecionados.length === 0
    ) {
      this.alert.presentToast("Selecione pelo menos um combustível", 3000);
      return;
    }

    // 2. Construir array de negociações
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

    // 3. Mapear formas de pagamento selecionadas
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

    // 4. Criar registros de negociação para cada combustível e forma de pagamento
    this.combustiveisSelecionados.forEach((item) => {
      formasSelecionadas.forEach((forma) => {
        // Calcular novo preço baseado no tipo de negociação
        let valorCalculado = 0;
        const precoAtual = this.getPrecoAtualItem(item) || 0;

        if (this.tipoNegociacao === "fixo") {
          // Preço fixo - pega o valor definido individualmente para este item
          valorCalculado =
            this.precosFixosPorItem.get(item.cod_item) || precoAtual;
        } else {
          // Desconto ou acréscimo
          valorCalculado = this.calculaValor(
            this.tipoNegociacao === "acrescimo" ? "A" : "D",
            this.valorReais || 0,
            this.valorPercentual || 0,
            precoAtual,
          );
        }

        const custoMedio = item.val_custo_medio || 0;
        const valorValido = valorCalculado >= custoMedio;

        // Criar objeto de negociação
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

        // Aplicar regras de preço para cada tipo selecionado
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

    // 5. Validar se há itens válidos
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
        `Os seguintes itens possuem o novo preço ABAIXO do custo:\n\n${itensComProblema}\n\nAjuste os valores para que o novo preço seja maior que o custo.`,
      );
      return;
    }

    // Avisar se há itens inválidos que serão ignorados
    const regrasInvalidas = negociacaoNova.filter((r) => !r.valor_valido);
    if (regrasInvalidas.length > 0) {
      this.alert.presentToast(
        `⚠️ ${regrasInvalidas.length} item(ns) com preço abaixo do custo foram ignorados`,
        3000,
      );
    }

    // 6. Validar limite de registros
    const totalRegistros =
      regrasValidas.length * this.clientesSelecionados.length;
    if (totalRegistros > 5000) {
      this.alert.presentAlert(
        "⚠️ Limite Excedido",
        "Máximo de 5.000 Registros",
        `O total de negociações (${totalRegistros.toLocaleString()}) excede o limite permitido. Reduza o número de clientes ou itens selecionados.`,
      );
      return;
    }

    // 7. Enviar negociação
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
              error.message ||
                "Erro ao processar negociações. Tente novamente ou contate o suporte",
            );
          }
        },
      });
  }

  limparDados() {
    this.clientesSelecionados = [];
    this.clientesSelecionadosSet.clear();
    this.combustiveisSelecionados = [];
    this.combustiveisSelecionadosSet.clear();
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
      // Acréscimo
      valorCalculado =
        valor > 0
          ? valorVenda + valor
          : valorVenda + (percentual / 100) * valorVenda;
    } else if (tipo === "D") {
      // Desconto
      valorCalculado =
        valor > 0
          ? valorVenda - valor
          : valorVenda - (percentual / 100) * valorVenda;
    } else if (tipo === "P") {
      // Preço fixo
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

  getCombustivelNome(combustivel: any): string {
    return (
      combustivel.des_item ||
      combustivel.nom_item ||
      `Item ${combustivel.cod_item}`
    );
  }

  // ========== CÁLCULOS PARA RESUMO ==========

  calcularNovoPreco(item: any): number {
    const precoAtual = this.getPrecoAtualItem(item) || 0;

    if (this.tipoNegociacao === "fixo") {
      // Para preço fixo, retorna o preço definido para este item
      return this.precosFixosPorItem.get(item.cod_item) || precoAtual;
    } else if (this.tipoNegociacao === "desconto") {
      // Desconto diminui o preço
      if (this.valorReais) {
        return precoAtual - this.valorReais;
      } else if (this.valorPercentual) {
        return precoAtual - (precoAtual * this.valorPercentual) / 100;
      }
    } else if (this.tipoNegociacao === "acrescimo") {
      // Acréscimo aumenta o preço
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

  // ========== TRACKBY FUNCTIONS PARA PERFORMANCE ==========

  trackByCliente(index: number, cliente: any): number {
    return cliente.cod_pessoa;
  }

  trackByCombustivel(index: number, combustivel: any): number {
    return combustivel.cod_item;
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
