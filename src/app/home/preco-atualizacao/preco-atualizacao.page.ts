import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { Subject } from "rxjs";
import { takeUntil, timeout, tap, catchError } from "rxjs/operators";
import * as moment from "moment";
import { Alert } from "src/app/class/alert";
import { AuthService } from "src/app/services/auth.service";
import { MovimentoService } from "src/app/services/movimento.service";
import { DataloadService } from "src/app/services/dataload.service";

interface PrecoEmsys {
  cod_empresa: number;
  nom_fantasia: string;
  cod_pessoa: number;
  nom_pessoa: string;
  cod_item: number;
  des_item: string;
  cod_forma_pagto: number;
  des_forma_pagto: string;
  dta_inicio: string;
  ind_tipo_negociacao: string;
  ind_percentual_valor: string;
  ind_tipo_preco_base: string;
  val_preco_venda_a: number;
  val_preco_venda_b: number;
  val_preco_venda_c: number;
  val_preco_venda_d: number;
  val_preco_venda_e: number;
  val_custo_medio: number;
  val_preco_venda: number; // Preço de venda da tabela tab_custo_preco (base para cálculo)
  cod_condicao_pagamento: number;
  des_observacao: string;
  num_chf: string;
  dta_inclusao: string;
  hra_inclusao: string;
  nom_usuario_inclusao: string;
  ind_diferencia_preco_unitario: string;
  seq_preco: number;
  ind_todas_empresas: string;
  id_preco: number;
  nom_usuario_replicacao: string;
  dta_replicacao: string;
  hra_replicacao: string;
  // Campos para edição
  val_novo_preco_a?: number;
  val_novo_preco_b?: number;
  val_novo_preco_c?: number;
  val_novo_preco_d?: number;
  val_novo_preco_e?: number;
  val_valor_informado?: number; // Valor informado pelo usuário (percentual ou valor fixo)
}

@Component({
  selector: "app-preco-atualizacao",
  templateUrl: "./preco-atualizacao.page.html",
  styleUrls: ["./preco-atualizacao.page.scss"],
  standalone: false,
})
export class PrecoAtualizacaoPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Controle de steps
  currentStep = 1;
  totalSteps = 2;

  // Step 1: Parâmetros
  empresasSelecionadas: number[] = []; // Vem do home
  itemsSelecionados: number[] = [];
  clientesSelecionados: number[] = [];
  formasPagtoSelecionadas: number[] = [];
  tipoNegociacao: string = ""; // 'A' Acréscimo, 'D' Desconto, 'P' Preço Fixo, '' Nenhum (opcional)
  precoMenorQue: number = 0; // Filtro de preço menor que (usado apenas quando tipoNegociacao = 'P')

  // Listas para seleção
  empresasDisponiveis: any[] = [];
  itemsDisponiveis: any[] = [];
  clientesDisponiveis: any[] = [];
  formasPagtoDisponiveis: any[] = [];

  // Listas filtradas (cache)
  itemsFiltrados: any[] = [];
  clientesFiltrados: any[] = [];
  formasPagtoFiltradas: any[] = [];

  // Filtros de busca
  buscaItem = "";
  buscaCliente = "";
  buscaFormaPagto = "";

  // Controle de modais
  isModalItemOpen = false;
  isModalClienteOpen = false;
  isModalFormaPagtoOpen = false;

  // Step 2: Resultados
  precosEncontrados: PrecoEmsys[] = [];
  precosAgrupados: { [key: number]: PrecoEmsys[] } = {};

  // Controle de seleção de negociações
  negociacoesSelecionadas: Set<number> = new Set(); // Armazena índices dos itens selecionados
  todasSelecionadas = false;

  // Controles de alteração em lote
  tipoCalculo: string = "percentual"; // 'valor' ou 'percentual'
  tipoOperacao: string = "fixo"; // 'fixo', 'acrescimo', 'desconto'
  valorAlteracao: number = 0;
  indDiferenciaPrecoUnitario: boolean = false;

  // Paginação - Tabela de Negociações (superior)
  paginaAtualNegociacoes = 1;
  itensPorPaginaNegociacoes = 10;
  opcoesItensPorPagina = [5, 10, 20, 50, 100];

  // Paginação - Tabela de Resultados (inferior)
  paginaAtualResultados = 1;
  itensPorPaginaResultados = 10;

  constructor(
    private router: Router,
    public auth: AuthService,
    private loadingCtrl: LoadingController,
    public movimento: MovimentoService,
    private alert: Alert,
    public dataLoad: DataloadService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.carregarDadosIniciais();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== TRACK BY FUNCTIONS (otimização de performance) ==========
  trackByItem(index: number, item: any): number {
    return item.cod_item;
  }

  trackByCliente(index: number, cliente: any): number {
    return cliente.cod_pessoa;
  }

  trackByFormaPagto(index: number, forma: any): number {
    return forma.cod_forma_pagto;
  }

  async carregarDadosIniciais() {
    // Pegar empresas selecionadas do home automaticamente
    if (
      this.auth.userLogado.cod_empresa_sel &&
      this.auth.userLogado.cod_empresa_sel.length > 0
    ) {
      this.empresasSelecionadas = [...this.auth.userLogado.cod_empresa_sel];
    }

    // Carregar nomes das empresas para exibição
    if (this.empresasSelecionadas.length > 0) {
      const loading = await this.loadingCtrl.create({
        message: "Carregando empresas...",
        duration: 30000,
      });
      await loading.present();

      this.movimento
        .buscaEmpresasBase(
          this.auth.userLogado.schema,
          this.auth.userLogado.cod_empresa_usuario,
        )
        .pipe(
          tap((data) => {
            this.empresasDisponiveis = data.message;
            loading.dismiss();
          }),
          timeout(31000),
          catchError((err) => {
            loading.dismiss();
            this.handleError(err);
            throw err;
          }),
          takeUntil(this.destroy$),
        )
        .subscribe();
    }
  }

  // ========== EMPRESAS (do home) ==========
  get empresasNomes(): string {
    if (this.empresasDisponiveis.length === 0) {
      return this.empresasSelecionadas.length + " empresa(s) selecionada(s)";
    }
    return this.empresasDisponiveis
      .filter((e) => this.empresasSelecionadas.includes(e.cod_empresa))
      .map((e) => e.nom_fantasia)
      .join(", ");
  }

  // ========== SELEÇÃO DE ITEMS ==========
  toggleItem(codItem: number) {
    const item = this.itemsDisponiveis.find((i) => i.cod_item === codItem);
    if (item) {
      item.ind_selecionado = !item.ind_selecionado;
      if (item.ind_selecionado) {
        if (!this.itemsSelecionados.includes(codItem)) {
          this.itemsSelecionados.push(codItem);
        }
      } else {
        this.itemsSelecionados = this.itemsSelecionados.filter(
          (i) => i !== codItem,
        );
      }
    }
  }

  // Método para filtrar items (otimizado para performance)
  filtrarItems() {
    if (!this.buscaItem || this.buscaItem.trim().length === 0) {
      this.itemsFiltrados = this.itemsDisponiveis.slice(0, 100);
      return;
    }

    const termo = this.buscaItem.toLowerCase();
    const termoNumerico = this.buscaItem.trim();
    const resultado: any[] = [];
    const maxResultados = 100;

    // Itera apenas até encontrar 100 resultados (muito mais rápido)
    for (
      let i = 0;
      i < this.itemsDisponiveis.length && resultado.length < maxResultados;
      i++
    ) {
      const item = this.itemsDisponiveis[i];

      if (
        item.des_item?.toLowerCase().includes(termo) ||
        item.cod_item?.toString().includes(termoNumerico) ||
        item.cod_barra?.includes(termoNumerico)
      ) {
        resultado.push(item);
      }
    }

    this.itemsFiltrados = resultado;
  }

  async abrirModalItem() {
    this.buscaItem = "";
    if (this.itemsDisponiveis.length === 0) {
      await this.carregarItems();
    }
    this.filtrarItems();
    this.isModalItemOpen = true;
  }

  fecharModalItem() {
    this.isModalItemOpen = false;
  }

  async carregarItems() {
    const loading = await this.loadingCtrl.create({
      message: "Carregando produtos...",
      duration: 30000,
    });
    await loading.present();

    this.movimento
      .buscaItensPrecoAtualizacao(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
      )
      .pipe(
        tap((data) => {
          this.itemsDisponiveis = (data.item || []).map((item: any) => ({
            ...item,
            ind_selecionado: this.itemsSelecionados.includes(item.cod_item),
          }));
          // Atualizar lista filtrada após carregar os dados
          this.filtrarItems();
          loading.dismiss();
        }),
        timeout(31000),
        catchError((err) => {
          loading.dismiss();
          this.handleError(err);
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  // ========== SELEÇÃO DE CLIENTES ==========
  toggleCliente(codPessoa: number) {
    const cliente = this.clientesDisponiveis.find(
      (c) => c.cod_pessoa === codPessoa,
    );
    if (cliente) {
      cliente.ind_selecionado = !cliente.ind_selecionado;
      if (cliente.ind_selecionado) {
        if (!this.clientesSelecionados.includes(codPessoa)) {
          this.clientesSelecionados.push(codPessoa);
        }
      } else {
        this.clientesSelecionados = this.clientesSelecionados.filter(
          (c) => c !== codPessoa,
        );
      }
    }
  }

  // Método auxiliar para limpar formatação de CNPJ/CPF
  private limparCnpjCpf(valor: string): string {
    return valor?.replace(/[.\-\/]/g, "") || "";
  }

  // Método para filtrar clientes (otimizado para evitar travamento)
  filtrarClientes() {
    // Se não há termo de busca, mostra no máximo 100 clientes
    if (!this.buscaCliente || this.buscaCliente.trim().length === 0) {
      this.clientesFiltrados = this.clientesDisponiveis.slice(0, 100);
      return;
    }

    const termo = this.buscaCliente.trim();

    // Só busca se tiver pelo menos 2 caracteres
    if (termo.length < 2) {
      this.clientesFiltrados = [];
      return;
    }

    const termoLimpo = this.limparCnpjCpf(termo);
    const termoLower = termo.toLowerCase();
    const resultado: any[] = [];
    const maxResultados = 100;

    // Itera apenas até encontrar 100 resultados (muito mais rápido)
    for (
      let i = 0;
      i < this.clientesDisponiveis.length && resultado.length < maxResultados;
      i++
    ) {
      const c = this.clientesDisponiveis[i];

      // Busca por nome
      const matchNome = c.nom_pessoa?.toLowerCase().includes(termoLower);

      // Busca por código
      const matchCodigo = c.cod_pessoa?.toString().includes(termo);

      // Busca por CNPJ/CPF (com e sem formatação)
      const cnpjCpfCliente = this.limparCnpjCpf(c.num_cnpj_cpf || "");
      const matchCnpjCpf =
        cnpjCpfCliente.includes(termoLimpo) || c.num_cnpj_cpf?.includes(termo);

      if (matchNome || matchCodigo || matchCnpjCpf) {
        resultado.push(c);
      }
    }

    this.clientesFiltrados = resultado;
  }

  async abrirModalCliente() {
    this.buscaCliente = "";
    if (this.clientesDisponiveis.length === 0) {
      await this.carregarClientes();
    }
    // Inicializar lista filtrada com os primeiros 500 clientes
    this.filtrarClientes();
    this.isModalClienteOpen = true;
  }

  fecharModalCliente() {
    this.isModalClienteOpen = false;
  }

  async carregarClientes() {
    const loading = await this.loadingCtrl.create({
      message: "Carregando clientes...",
      duration: 30000,
    });
    await loading.present();

    // Verificar se já temos dados de pessoa no dataLoad (carregados pelo home)
    if (this.dataLoad.pessoa && this.dataLoad.pessoa.length > 0) {
      this.clientesDisponiveis = this.dataLoad.pessoa.map((p: any) => ({
        ...p,
        ind_selecionado: this.clientesSelecionados.includes(p.cod_pessoa),
      }));
      // Atualizar lista filtrada após carregar os dados
      this.filtrarClientes();
      loading.dismiss();
      return;
    }

    // Se não tiver, buscar do backend usando buscaFiltroPreLoad
    this.movimento
      .buscaFiltroPreLoad(this.auth.userLogado.schema)
      .pipe(
        tap((data) => {
          this.clientesDisponiveis = (data.pessoa || []).map((p: any) => ({
            ...p,
            ind_selecionado: this.clientesSelecionados.includes(p.cod_pessoa),
          }));
          this.dataLoad.pessoa = this.clientesDisponiveis;
          // Atualizar lista filtrada após carregar os dados
          this.filtrarClientes();
          loading.dismiss();
        }),
        timeout(31000),
        catchError((err) => {
          loading.dismiss();
          this.handleError(err);
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  // ========== SELEÇÃO DE FORMAS DE PAGAMENTO ==========
  toggleFormaPagto(codFormaPagto: number) {
    const forma = this.formasPagtoDisponiveis.find(
      (f) => f.cod_forma_pagto === codFormaPagto,
    );
    if (forma) {
      forma.ind_selecionado = !forma.ind_selecionado;
      if (forma.ind_selecionado) {
        if (!this.formasPagtoSelecionadas.includes(codFormaPagto)) {
          this.formasPagtoSelecionadas.push(codFormaPagto);
        }
      } else {
        this.formasPagtoSelecionadas = this.formasPagtoSelecionadas.filter(
          (f) => f !== codFormaPagto,
        );
      }
    }
  }

  // Método para filtrar formas de pagamento (otimizado para performance)
  filtrarFormasPagto() {
    if (!this.buscaFormaPagto || this.buscaFormaPagto.trim().length === 0) {
      this.formasPagtoFiltradas = this.formasPagtoDisponiveis.slice(0, 100);
      return;
    }

    const termo = this.buscaFormaPagto.toLowerCase();
    const termoNumerico = this.buscaFormaPagto.trim();
    const resultado: any[] = [];
    const maxResultados = 100;

    // Itera apenas até encontrar 100 resultados (muito mais rápido)
    for (
      let i = 0;
      i < this.formasPagtoDisponiveis.length &&
      resultado.length < maxResultados;
      i++
    ) {
      const f = this.formasPagtoDisponiveis[i];

      if (
        f.des_forma_pagto?.toLowerCase().includes(termo) ||
        f.cod_forma_pagto?.toString().includes(termoNumerico)
      ) {
        resultado.push(f);
      }
    }

    this.formasPagtoFiltradas = resultado;
  }

  async abrirModalFormaPagto() {
    this.buscaFormaPagto = "";
    if (this.formasPagtoDisponiveis.length === 0) {
      await this.carregarFormasPagto();
    }
    this.filtrarFormasPagto();
    this.isModalFormaPagtoOpen = true;
  }

  fecharModalFormaPagto() {
    this.isModalFormaPagtoOpen = false;
  }

  async carregarFormasPagto() {
    const loading = await this.loadingCtrl.create({
      message: "Carregando formas de pagamento...",
      duration: 30000,
    });
    await loading.present();

    this.movimento
      .buscaItensPrecoAtualizacao(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
      )
      .pipe(
        tap((data) => {
          this.formasPagtoDisponiveis = (data.formaPagto || []).map(
            (fp: any) => ({
              ...fp,
              ind_selecionado: this.formasPagtoSelecionadas.includes(
                fp.cod_forma_pagto,
              ),
            }),
          );
          this.movimento.formaPagto = this.formasPagtoDisponiveis;
          // Atualizar lista filtrada após carregar os dados
          this.filtrarFormasPagto();
          loading.dismiss();
        }),
        timeout(31000),
        catchError((err) => {
          loading.dismiss();
          this.handleError(err);
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  // ========== NAVEGAÇÃO DE STEPS ==========
  onTipoNegociacaoChange() {
    // Resetar os valores dos filtros quando mudar o tipo de negociação
    this.precoMenorQue = 0;
  }

  canAdvance(): boolean {
    if (this.currentStep === 1) {
      // Validar que o Tipo de Negociação foi selecionado
      const hasTipoNegociacao =
        this.tipoNegociacao && this.tipoNegociacao.trim() !== "";

      return hasTipoNegociacao;
    }
    return false;
  }

  getMensagemValidacao(): string {
    if (!this.tipoNegociacao || this.tipoNegociacao.trim() === "") {
      return "Selecione o Tipo de Negociação";
    }
    return "";
  }

  async avancar() {
    if (this.currentStep === 1) {
      // Validar antes de buscar
      if (!this.canAdvance()) {
        this.alert.presentToast(`⚠️ ${this.getMensagemValidacao()}`, 3000);
        return;
      }

      await this.buscarPrecos();
      this.currentStep = 2;
    }
  }

  voltar() {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.router.navigate(["/home"]);
    }
  }

  // ========== BUSCA DE PREÇOS ==========
  async buscarPrecos() {
    console.log("=== Buscar Preços - Filtros aplicados ===");
    console.log("Empresas:", this.empresasSelecionadas);
    console.log("Items:", this.itemsSelecionados);
    console.log("Clientes:", this.clientesSelecionados);
    console.log("Formas Pagto:", this.formasPagtoSelecionadas);
    console.log(
      "Tipo Negociação:",
      this.tipoNegociacao,
      "| Tipo:",
      typeof this.tipoNegociacao,
    );

    const loading = await this.loadingCtrl.create({
      message: "Buscando preços...",
      duration: 60000,
    });
    await loading.present();

    // Converter arrays vazios para [0] conforme necessário pela procedure
    const items =
      this.itemsSelecionados.length > 0 ? this.itemsSelecionados : [0];
    const clientes =
      this.clientesSelecionados.length > 0 ? this.clientesSelecionados : [0];
    const formasPagto =
      this.formasPagtoSelecionadas.length > 0
        ? this.formasPagtoSelecionadas
        : [0];

    console.log("=== Valores convertidos para envio ao backend ===");
    console.log("Items:", items);
    console.log("Clientes:", clientes);
    console.log("Formas Pagto:", formasPagto);

    // Preço menor que só é usado quando tipo for 'P' (Preço Fixo)
    const precoMenorQue =
      this.tipoNegociacao === "P" ? this.precoMenorQue || 0 : 0;
    console.log("Preço Menor Que:", precoMenorQue);

    this.movimento
      .buscaPrecoEmsys(
        this.auth.userLogado.schema,
        this.empresasSelecionadas,
        items,
        clientes,
        formasPagto,
        this.tipoNegociacao,
        precoMenorQue,
      )
      .pipe(
        tap((data) => {
          console.log("=== Resposta completa da API ===", data);
          console.log("=== data.message ===", data.message);

          this.precosEncontrados = data.message || [];

          console.log("=== Preços encontrados (primeiros 3) ===");
          this.precosEncontrados.slice(0, 3).forEach((p, idx) => {
            console.log(`Preço ${idx}:`, {
              cod_empresa: p.cod_empresa,
              nom_fantasia: p.nom_fantasia,
              cod_item: p.cod_item,
              des_item: p.des_item,
              val_preco_venda_a: p.val_preco_venda_a,
              dta_inicio: p.dta_inicio,
              ind_tipo_negociacao: p.ind_tipo_negociacao,
              des_forma_pagto: p.des_forma_pagto,
            });
          });

          this.agruparPrecos();

          // Resetar paginação ao carregar novos dados
          this.paginaAtualNegociacoes = 1;
          this.paginaAtualResultados = 1;

          loading.dismiss();

          if (this.precosEncontrados.length === 0) {
            this.alert.presentAlert(
              "Atenção",
              "",
              "Nenhum preço encontrado com os parâmetros informados.",
            );
          }
        }),
        timeout(61000),
        catchError((err) => {
          loading.dismiss();
          this.handleError(err);
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  agruparPrecos() {
    this.precosAgrupados = {};
    this.precosEncontrados.forEach((preco) => {
      if (!this.precosAgrupados[preco.cod_empresa]) {
        this.precosAgrupados[preco.cod_empresa] = [];
      }
      this.precosAgrupados[preco.cod_empresa].push(preco);
    });
  }

  get empresasComPrecos(): number[] {
    return Object.keys(this.precosAgrupados).map((k) => parseInt(k));
  }

  getNomeEmpresa(codEmpresa: number): string {
    // Primeiro tenta pegar o nome da empresa diretamente dos preços retornados
    const precoComEmpresa = this.precosAgrupados[codEmpresa]?.[0];
    if (precoComEmpresa?.nom_fantasia) {
      return precoComEmpresa.nom_fantasia;
    }

    // Se não encontrar, busca da lista de empresas disponíveis
    const empresa = this.empresasDisponiveis.find(
      (e) => e.cod_empresa === codEmpresa,
    );
    return empresa?.nom_fantasia || `Empresa ${codEmpresa}`;
  }

  // ========== ATUALIZAÇÃO DE PREÇOS ==========
  setNovoPreco(preco: PrecoEmsys, tipo: string, event: any) {
    const valor =
      parseFloat(event.detail.value?.toString().replace(",", ".")) || 0;

    switch (tipo) {
      case "A":
        preco.val_novo_preco_a = valor;
        break;
      case "B":
        preco.val_novo_preco_b = valor;
        break;
      case "C":
        preco.val_novo_preco_c = valor;
        break;
      case "D":
        preco.val_novo_preco_d = valor;
        break;
      case "E":
        preco.val_novo_preco_e = valor;
        break;
    }
  }

  // ========== FUNÇÕES DE CÁLCULO (mesmas da tela de preços) ==========
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

  async salvarAlteracoes() {
    // Filtrar preços que tiveram alteração
    const precosAlterados = this.precosEncontrados.filter(
      (p) =>
        p.val_novo_preco_a ||
        p.val_novo_preco_b ||
        p.val_novo_preco_c ||
        p.val_novo_preco_d ||
        p.val_novo_preco_e,
    );

    if (precosAlterados.length === 0) {
      this.alert.presentAlert(
        "Atenção",
        "",
        "Nenhuma alteração foi realizada.",
      );
      return;
    }

    // Validar margem: cada preço alterado deve ser maior que o custo
    const precosValidos: any[] = [];
    const precosInvalidos: any[] = [];

    precosAlterados.forEach((preco) => {
      // Verificar cada tipo de preço que foi alterado
      let temPrecoValido = false;
      let temPrecoInvalido = false;
      const detalhesInvalidos: string[] = [];

      if (preco.val_novo_preco_a) {
        if (preco.val_novo_preco_a >= preco.val_custo_medio) {
          temPrecoValido = true;
        } else {
          temPrecoInvalido = true;
          detalhesInvalidos.push(
            `Preço A: R$ ${preco.val_novo_preco_a.toFixed(2)} < Custo: R$ ${preco.val_custo_medio?.toFixed(2) || "0,00"}`,
          );
        }
      }

      if (preco.val_novo_preco_b) {
        if (preco.val_novo_preco_b >= preco.val_custo_medio) {
          temPrecoValido = true;
        } else {
          temPrecoInvalido = true;
          detalhesInvalidos.push(
            `Preço B: R$ ${preco.val_novo_preco_b.toFixed(2)} < Custo: R$ ${preco.val_custo_medio?.toFixed(2) || "0,00"}`,
          );
        }
      }

      if (preco.val_novo_preco_c) {
        if (preco.val_novo_preco_c >= preco.val_custo_medio) {
          temPrecoValido = true;
        } else {
          temPrecoInvalido = true;
          detalhesInvalidos.push(
            `Preço C: R$ ${preco.val_novo_preco_c.toFixed(2)} < Custo: R$ ${preco.val_custo_medio?.toFixed(2) || "0,00"}`,
          );
        }
      }

      if (preco.val_novo_preco_d) {
        if (preco.val_novo_preco_d >= preco.val_custo_medio) {
          temPrecoValido = true;
        } else {
          temPrecoInvalido = true;
          detalhesInvalidos.push(
            `Preço D: R$ ${preco.val_novo_preco_d.toFixed(2)} < Custo: R$ ${preco.val_custo_medio?.toFixed(2) || "0,00"}`,
          );
        }
      }

      if (preco.val_novo_preco_e) {
        if (preco.val_novo_preco_e >= preco.val_custo_medio) {
          temPrecoValido = true;
        } else {
          temPrecoInvalido = true;
          detalhesInvalidos.push(
            `Preço E: R$ ${preco.val_novo_preco_e.toFixed(2)} < Custo: R$ ${preco.val_custo_medio?.toFixed(2) || "0,00"}`,
          );
        }
      }

      if (temPrecoInvalido) {
        precosInvalidos.push({
          ...preco,
          detalhesInvalidos: detalhesInvalidos.join(", "),
        });
      }

      // Só adiciona aos válidos se tiver pelo menos um preço válido
      if (temPrecoValido) {
        precosValidos.push(preco);
      }
    });

    // Se NÃO houver nenhum preço válido
    if (precosValidos.length === 0) {
      const itensComProblema = precosInvalidos
        .map((r) => `• ${r.des_item} (${r.detalhesInvalidos})`)
        .join("\n");

      this.alert.presentAlert(
        "⚠️ Negociação com Margem Inválida",
        "Novo preço abaixo do custo",
        `Os seguintes itens possuem o novo preço ABAIXO do custo e não serão enviados:\n\n${itensComProblema}\n\nAjuste os valores para que o novo preço seja maior que o custo.`,
      );
      return;
    }

    // Se há itens válidos E inválidos, avisa ao usuário
    if (precosInvalidos.length > 0) {
      this.alert.presentToast(
        `⚠️ ${precosInvalidos.length} item(ns) com preço abaixo do custo foram ignorados`,
        3000,
      );
    }

    // Preparar dados para envio (formato igual ao da tela de preços)
    const negociacoesParaEnviar: any[] = [];
    const dataDeHoje = moment();

    precosValidos.forEach((preco) => {
      // Para cada preço alterado, criar uma negociação
      if (preco.val_novo_preco_a) {
        negociacoesParaEnviar.push({
          cod_item: preco.cod_item,
          des_item: preco.des_item,
          cod_empresa: preco.cod_empresa,
          nom_fantasia: preco.nom_fantasia,
          cod_forma_pagto: preco.cod_forma_pagto,
          des_forma_pagto: preco.des_forma_pagto,
          cod_condicao_pagamento: preco.cod_condicao_pagamento,
          dta_inicio: preco.dta_inicio,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao: preco.ind_tipo_negociacao || "P",
          ind_percentual_valor: preco.ind_percentual_valor || "V",
          ind_tipo_preco_base: "A",
          val_preco_venda_a: preco.val_valor_informado || 0,
          val_preco_venda_b: 0,
          val_preco_venda_c: 0,
          val_preco_venda_d: 0,
          val_preco_venda_e: 0,
          val_custo_medio: preco.val_custo_medio,
          cod_pessoa: preco.cod_pessoa || 0,
          nom_pessoa: preco.nom_pessoa || "",
          valor_calculado: preco.val_novo_preco_a,
          valor: preco.val_novo_preco_a,
          valor_valido: true,
          margem: this.calculaMargem(
            preco.val_novo_preco_a,
            preco.val_custo_medio,
          ),
          margem_valor: this.calculaMargemValor(
            preco.val_novo_preco_a,
            preco.val_custo_medio,
          ),
          percentual_alteracao: this.calculaPercentualAlteracao(
            preco.val_preco_venda_a,
            preco.val_novo_preco_a,
          ),
          ind_adicionado: true,
        });
      }

      if (preco.val_novo_preco_b) {
        negociacoesParaEnviar.push({
          cod_item: preco.cod_item,
          des_item: preco.des_item,
          cod_empresa: preco.cod_empresa,
          nom_fantasia: preco.nom_fantasia,
          cod_forma_pagto: preco.cod_forma_pagto,
          des_forma_pagto: preco.des_forma_pagto,
          cod_condicao_pagamento: preco.cod_condicao_pagamento,
          dta_inicio: preco.dta_inicio,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao: preco.ind_tipo_negociacao || "P",
          ind_percentual_valor: preco.ind_percentual_valor || "V",
          ind_tipo_preco_base: "B",
          val_preco_venda_a: 0,
          val_preco_venda_b: preco.val_valor_informado || 0,
          val_preco_venda_c: 0,
          val_preco_venda_d: 0,
          val_preco_venda_e: 0,
          val_custo_medio: preco.val_custo_medio,
          cod_pessoa: preco.cod_pessoa || 0,
          nom_pessoa: preco.nom_pessoa || "",
          valor_calculado: preco.val_novo_preco_b,
          valor: preco.val_novo_preco_b,
          valor_valido: true,
          margem: this.calculaMargem(
            preco.val_novo_preco_b,
            preco.val_custo_medio,
          ),
          margem_valor: this.calculaMargemValor(
            preco.val_novo_preco_b,
            preco.val_custo_medio,
          ),
          percentual_alteracao: this.calculaPercentualAlteracao(
            preco.val_preco_venda_b,
            preco.val_novo_preco_b,
          ),
          ind_adicionado: true,
        });
      }

      if (preco.val_novo_preco_c) {
        negociacoesParaEnviar.push({
          cod_item: preco.cod_item,
          des_item: preco.des_item,
          cod_empresa: preco.cod_empresa,
          nom_fantasia: preco.nom_fantasia,
          cod_forma_pagto: preco.cod_forma_pagto,
          des_forma_pagto: preco.des_forma_pagto,
          cod_condicao_pagamento: preco.cod_condicao_pagamento,
          dta_inicio: preco.dta_inicio,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao: preco.ind_tipo_negociacao || "P",
          ind_percentual_valor: preco.ind_percentual_valor || "V",
          ind_tipo_preco_base: "C",
          val_preco_venda_a: 0,
          val_preco_venda_b: 0,
          val_preco_venda_c: preco.val_valor_informado || 0,
          val_preco_venda_d: 0,
          val_preco_venda_e: 0,
          val_custo_medio: preco.val_custo_medio,
          cod_pessoa: preco.cod_pessoa || 0,
          nom_pessoa: preco.nom_pessoa || "",
          valor_calculado: preco.val_novo_preco_c,
          valor: preco.val_novo_preco_c,
          valor_valido: true,
          margem: this.calculaMargem(
            preco.val_novo_preco_c,
            preco.val_custo_medio,
          ),
          margem_valor: this.calculaMargemValor(
            preco.val_novo_preco_c,
            preco.val_custo_medio,
          ),
          percentual_alteracao: this.calculaPercentualAlteracao(
            preco.val_preco_venda_c,
            preco.val_novo_preco_c,
          ),
          ind_adicionado: true,
        });
      }

      if (preco.val_novo_preco_d) {
        negociacoesParaEnviar.push({
          cod_item: preco.cod_item,
          des_item: preco.des_item,
          cod_empresa: preco.cod_empresa,
          nom_fantasia: preco.nom_fantasia,
          cod_forma_pagto: preco.cod_forma_pagto,
          des_forma_pagto: preco.des_forma_pagto,
          cod_condicao_pagamento: preco.cod_condicao_pagamento,
          dta_inicio: preco.dta_inicio,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao: preco.ind_tipo_negociacao || "P",
          ind_percentual_valor: preco.ind_percentual_valor || "V",
          ind_tipo_preco_base: "D",
          val_preco_venda_a: 0,
          val_preco_venda_b: 0,
          val_preco_venda_c: 0,
          val_preco_venda_d: preco.val_valor_informado || 0,
          val_preco_venda_e: 0,
          val_custo_medio: preco.val_custo_medio,
          cod_pessoa: preco.cod_pessoa || 0,
          nom_pessoa: preco.nom_pessoa || "",
          valor_calculado: preco.val_novo_preco_d,
          valor: preco.val_novo_preco_d,
          valor_valido: true,
          margem: this.calculaMargem(
            preco.val_novo_preco_d,
            preco.val_custo_medio,
          ),
          margem_valor: this.calculaMargemValor(
            preco.val_novo_preco_d,
            preco.val_custo_medio,
          ),
          percentual_alteracao: this.calculaPercentualAlteracao(
            preco.val_preco_venda_d,
            preco.val_novo_preco_d,
          ),
          ind_adicionado: true,
        });
      }

      if (preco.val_novo_preco_e) {
        negociacoesParaEnviar.push({
          cod_item: preco.cod_item,
          des_item: preco.des_item,
          cod_empresa: preco.cod_empresa,
          nom_fantasia: preco.nom_fantasia,
          cod_forma_pagto: preco.cod_forma_pagto,
          des_forma_pagto: preco.des_forma_pagto,
          cod_condicao_pagamento: preco.cod_condicao_pagamento,
          dta_inicio: preco.dta_inicio,
          dta_inclusao: dataDeHoje.format("YYYY-MM-DD"),
          ind_tipo_negociacao: preco.ind_tipo_negociacao || "P",
          ind_percentual_valor: preco.ind_percentual_valor || "V",
          ind_tipo_preco_base: "E",
          val_preco_venda_a: 0,
          val_preco_venda_b: 0,
          val_preco_venda_c: 0,
          val_preco_venda_d: 0,
          val_preco_venda_e: preco.val_valor_informado || 0,
          val_custo_medio: preco.val_custo_medio,
          cod_pessoa: preco.cod_pessoa || 0,
          nom_pessoa: preco.nom_pessoa || "",
          valor_calculado: preco.val_novo_preco_e,
          valor: preco.val_novo_preco_e,
          valor_valido: true,
          margem: this.calculaMargem(
            preco.val_novo_preco_e,
            preco.val_custo_medio,
          ),
          margem_valor: this.calculaMargemValor(
            preco.val_novo_preco_e,
            preco.val_custo_medio,
          ),
          percentual_alteracao: this.calculaPercentualAlteracao(
            preco.val_preco_venda_e,
            preco.val_novo_preco_e,
          ),
          ind_adicionado: true,
        });
      }
    });

    // Agruptar clientes únicos das negociações
    const clientesUnicos = new Set(
      precosValidos.map((p) => p.cod_pessoa).filter((c) => c && c > 0),
    );
    const clientes =
      clientesUnicos.size > 0
        ? Array.from(clientesUnicos).map((codPessoa) => {
            const preco = precosValidos.find((p) => p.cod_pessoa === codPessoa);
            return {
              cod_pessoa: codPessoa,
              nom_pessoa: preco?.nom_pessoa || "",
            };
          })
        : [{ cod_pessoa: 0, nom_pessoa: "" }]; // Se não houver clientes específicos

    const loading = await this.loadingCtrl.create({
      message: `Enviando ${negociacoesParaEnviar.length} preços...`,
      duration: 60000,
    });
    await loading.present();

    // Usar novaNegociacao (mesma função da tela de preços)
    this.movimento
      .novaNegociacao(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
        this.auth.userLogado.nom_usuario,
        this.auth.userLogado.cod_usuario,
        clientes,
        negociacoesParaEnviar,
      )
      .pipe(
        tap(() => {
          loading.dismiss();

          this.precosEncontrados.forEach((p) => {
            p.val_novo_preco_a = undefined;
            p.val_novo_preco_b = undefined;
            p.val_novo_preco_c = undefined;
            p.val_novo_preco_d = undefined;
            p.val_novo_preco_e = undefined;
          });

          setTimeout(() => {
            this.movimento.itemSelecionado = [];
            this.movimento.formaPagto = [];
            this.movimento.pessoasSelecionadas = [];
            this.router.navigate(["/home"]);
          }, 1500);
        }),
        timeout(61000),
        catchError((err) => {
          loading.dismiss();
          this.handleError(err);
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  // ========== SELEÇÃO DE NEGOCIAÇÕES ==========
  toggleNegociacao(index: number) {
    if (this.negociacoesSelecionadas.has(index)) {
      this.negociacoesSelecionadas.delete(index);
    } else {
      this.negociacoesSelecionadas.add(index);
    }
    this.atualizarTodasSelecionadas();
    this.cdr.detectChanges(); // Força detecção de mudanças
  }

  onCheckboxChange(event: any, index: number) {
    const isChecked = event.detail.checked;
    if (isChecked) {
      this.negociacoesSelecionadas.add(index);
    } else {
      this.negociacoesSelecionadas.delete(index);
    }
    this.atualizarTodasSelecionadas();
    this.cdr.detectChanges();
  }

  toggleNegociacaoComEvento(event: Event, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.toggleNegociacao(index);
  }

  isNegociacaoSelecionada(index: number): boolean {
    return this.negociacoesSelecionadas.has(index);
  }

  toggleTodasNegociacoes() {
    if (this.todasSelecionadas) {
      this.negociacoesSelecionadas.clear();
    } else {
      this.precosEncontrados.forEach((_, index) => {
        this.negociacoesSelecionadas.add(index);
      });
    }
    this.todasSelecionadas = !this.todasSelecionadas;
    this.cdr.detectChanges(); // Força detecção de mudanças
  }

  atualizarTodasSelecionadas() {
    this.todasSelecionadas =
      this.precosEncontrados.length > 0 &&
      this.negociacoesSelecionadas.size === this.precosEncontrados.length;
  }

  get quantidadeSelecionada(): number {
    return this.negociacoesSelecionadas.size;
  }

  // Verifica se há algum novo preço definido
  hasNovosPrecos(): boolean {
    return this.precosEncontrados.some((p) => p.val_novo_preco_a);
  }

  // ========== PAGINAÇÃO - TABELA DE NEGOCIAÇÕES ==========
  get precosEncontradosPaginados(): PrecoEmsys[] {
    const inicio =
      (this.paginaAtualNegociacoes - 1) * this.itensPorPaginaNegociacoes;
    const fim = inicio + this.itensPorPaginaNegociacoes;
    return this.precosEncontrados.slice(inicio, fim);
  }

  get totalPaginasNegociacoes(): number {
    return Math.ceil(
      this.precosEncontrados.length / this.itensPorPaginaNegociacoes,
    );
  }

  mudarPaginaNegociacoes(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasNegociacoes) {
      this.paginaAtualNegociacoes = pagina;
    }
  }

  mudarItensPorPaginaNegociacoes(event: any) {
    this.itensPorPaginaNegociacoes = parseInt(event.detail.value);
    this.paginaAtualNegociacoes = 1; // Volta para primeira página
  }

  // ========== PAGINAÇÃO - TABELA DE RESULTADOS ==========
  get precosComNovoPrecoPaginados(): PrecoEmsys[] {
    const precosFiltrados = this.precosEncontrados.filter(
      (p, i) => this.isNegociacaoSelecionada(i) && p.val_novo_preco_a,
    );
    const inicio =
      (this.paginaAtualResultados - 1) * this.itensPorPaginaResultados;
    const fim = inicio + this.itensPorPaginaResultados;
    return precosFiltrados.slice(inicio, fim);
  }

  get totalPaginasResultados(): number {
    const precosFiltrados = this.precosEncontrados.filter(
      (p, i) => this.isNegociacaoSelecionada(i) && p.val_novo_preco_a,
    );
    return Math.ceil(precosFiltrados.length / this.itensPorPaginaResultados);
  }

  mudarPaginaResultados(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasResultados) {
      this.paginaAtualResultados = pagina;
    }
  }

  mudarItensPorPaginaResultados(event: any) {
    this.itensPorPaginaResultados = parseInt(event.detail.value);
    this.paginaAtualResultados = 1; // Volta para primeira página
  }

  // ========== ALTERAÇÃO EM LOTE ==========
  onTipoOperacaoChange() {
    // Quando mudar para 'fixo', o tipoCalculo não é usado
    // Quando mudar para 'acrescimo' ou 'desconto', resetar para percentual
    if (this.tipoOperacao !== "fixo") {
      this.tipoCalculo = "percentual";
    }
    this.valorAlteracao = 0;
  }

  aplicarAlteracoes() {
    if (this.negociacoesSelecionadas.size === 0) {
      this.alert.presentAlert(
        "Atenção",
        "",
        "Selecione pelo menos uma negociação para alterar.",
      );
      return;
    }

    if (this.valorAlteracao === 0 || this.valorAlteracao === null) {
      this.alert.presentAlert(
        "Atenção",
        "",
        "Informe um valor para aplicar as alterações.",
      );
      return;
    }

    // Aplicar alterações nas negociações selecionadas
    this.negociacoesSelecionadas.forEach((index) => {
      const preco = this.precosEncontrados[index];

      // Usar o preço de venda da tabela tab_custo_preco como base para cálculo
      const precoAtual = preco.val_preco_venda || 0;
      let novoPreco = precoAtual;

      // Atualizar ind_percentual_valor baseado no tipo de cálculo
      preco.ind_percentual_valor =
        this.tipoCalculo === "percentual" ? "P" : "V";

      // Guardar o valor informado pelo usuário
      preco.val_valor_informado = this.valorAlteracao;

      if (this.tipoOperacao === "fixo") {
        novoPreco = this.valorAlteracao;
        preco.ind_tipo_negociacao = "P"; // Preço Fixo
        preco.ind_percentual_valor = "V"; // Sempre valor quando é fixo
      } else if (this.tipoOperacao === "acrescimo") {
        if (this.tipoCalculo === "percentual") {
          novoPreco = precoAtual + (precoAtual * this.valorAlteracao) / 100;
        } else {
          novoPreco = precoAtual + this.valorAlteracao;
        }
        preco.ind_tipo_negociacao = "A"; // Acréscimo
      } else if (this.tipoOperacao === "desconto") {
        if (this.tipoCalculo === "percentual") {
          novoPreco = precoAtual - (precoAtual * this.valorAlteracao) / 100;
        } else {
          novoPreco = precoAtual - this.valorAlteracao;
        }
        preco.ind_tipo_negociacao = "D"; // Desconto
      }

      preco.val_novo_preco_a = novoPreco;
    });

    this.alert.presentAlert(
      "Sucesso",
      "",
      `Alterações aplicadas em ${this.negociacoesSelecionadas.size} negociação(ões).`,
    );

    // Resetar página de resultados para mostrar os novos dados
    this.paginaAtualResultados = 1;

    // Força atualização da view
    this.cdr.detectChanges();

    // Scroll automático para a seção de resultados após um pequeno delay
    setTimeout(() => {
      const element = document.getElementById("resultados-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);

    // NÃO limpar seleções para que os resultados sejam exibidos na tabela de baixo
    // this.negociacoesSelecionadas.clear();
    // this.todasSelecionadas = false;
  }

  async excluirNegociacoesSelecionadas() {
    if (this.negociacoesSelecionadas.size === 0) {
      this.alert.presentAlert(
        "Atenção",
        "",
        "Selecione pelo menos uma negociação para excluir.",
      );
      return;
    }

    // Confirmar exclusão
    const confirmacao = await this.alert.presentAlertConfirm(
      "Confirmar Exclusão",
      "",
      `Deseja realmente excluir ${this.negociacoesSelecionadas.size} negociação(ões)?`,
    );

    if (confirmacao !== "sim") {
      return;
    }

    // TODO: Implementar chamada ao backend para excluir as negociações
    // Por enquanto, apenas remove da lista local
    const indicesSelecionados = Array.from(this.negociacoesSelecionadas).sort(
      (a, b) => b - a,
    );
    indicesSelecionados.forEach((index) => {
      this.precosEncontrados.splice(index, 1);
    });

    this.agruparPrecos();
    this.negociacoesSelecionadas.clear();
    this.todasSelecionadas = false;

    this.alert.presentAlert(
      "Sucesso",
      "",
      "Negociações excluídas com sucesso.",
    );
  }

  retornarParaFiltros() {
    this.currentStep = 1;
    this.negociacoesSelecionadas.clear();
    this.todasSelecionadas = false;
  }

  private handleError(error: any) {
    console.error("Erro:", error);
    let message = "Ocorreu um erro ao processar a solicitação.";

    if (error.name === "TimeoutError") {
      message = "A operação demorou muito tempo. Tente novamente.";
    } else if (error.error?.message) {
      message = error.error.message;
    }

    this.alert.presentAlert("Erro", "", message);
  }
}
