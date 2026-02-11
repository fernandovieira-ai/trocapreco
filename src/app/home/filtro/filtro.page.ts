import {
  subGrupo,
  regiao,
  item,
  pessoa,
  formaPagto,
  itemfull,
} from "./../../class/user";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { timeout, tap, catchError, finalize } from "rxjs";
import { Alert } from "src/app/class/alert";
import { AuthService } from "src/app/services/auth.service";
import { DataloadService } from "src/app/services/dataload.service";
import { MovimentoService } from "src/app/services/movimento.service";

@Component({
  selector: "app-filtro",
  templateUrl: "./filtro.page.html",
  styleUrls: ["./filtro.page.scss"],
  standalone: false,
})
export class FiltroPage implements OnInit {
  //public pessoa: pessoa[] = []
  //public filtroPessoa = [...this.pessoa]
  //public regiao: regiao[] = []
  public item: item[] = [];
  public itemfull: itemfull[] = [];
  //public subGrupo: subGrupo[] = []

  isModalOpenCliente = false;
  isModalSelecaoMassaOpen = false;
  filtro = "C";
  dataCadastroInicial: string = "";
  dataCadastroFinal: string = "";
  private dentroDoFluxo = false; // Flag para controlar se está navegando dentro do fluxo

  // Variáveis para modal de seleção em massa
  itensFiltradosModal: itemfull[] = [];
  itensSelecionadosModal: number[] = [];

  groupedItems: { nom_fantasia: string; cod_empresa: number; items: item[] }[] =
    [];

  // Variáveis de paginação para resultados de clientes
  private readonly TAMANHO_PAGINA = 50;
  public paginaAtual = 0;
  public resultadosVisiveis: pessoa[] = [];
  public todosResultados: pessoa[] = [];
  public temMaisResultados = false;

  constructor(
    public auth: AuthService,
    private loadingCtrl: LoadingController,
    public movimento: MovimentoService,
    private alert: Alert,
    public dataLoad: DataloadService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.buscaFiltros();
    this.movimento.itemSelecionado = [];
  }

  groupItemsByCodEmpresa(
    items: item[],
  ): { nom_fantasia: string; cod_empresa: number; items: item[] }[] {
    const groupedItems: {
      nom_fantasia: string;
      cod_empresa: number;
      items: item[];
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

  tipoFiltro(ev) {
    const parametro = ev.detail.value;
    this.filtro = parametro;

    switch (parametro) {
      case "C":
        break;
      case "I":
        this.dataLoad.filtroPessoa = [];
        break;
    }
  }

  aplicarFiltroData() {
    // Busca apenas por data (sem precisar de texto na searchbar)
    if (this.dataCadastroInicial || this.dataCadastroFinal) {
      console.log("Aplicando filtro de data:", {
        inicial: this.dataCadastroInicial,
        final: this.dataCadastroFinal,
      });

      // Debug: Verifica se pessoas têm dta_cadastro
      console.log("Total de pessoas:", this.dataLoad.pessoa.length);
      if (this.dataLoad.pessoa.length > 0) {
        console.log("Exemplo de pessoa:", this.dataLoad.pessoa[0]);
        console.log(
          "Propriedades da pessoa:",
          Object.keys(this.dataLoad.pessoa[0]),
        );
      }

      const pessoasComData = this.dataLoad.pessoa.filter((d) => d.dta_cadastro);
      console.log(
        `Pessoas com dta_cadastro: ${pessoasComData.length} de ${this.dataLoad.pessoa.length}`,
      );

      if (pessoasComData.length === 0) {
        this.alert.presentToast(
          "⚠️ O campo 'dta_cadastro' não está disponível nos dados. Verifique se a procedure do backend retorna esse campo.",
          5000,
        );
        return;
      }

      // Filtra por data
      let resultadosFiltrados = this.dataLoad.pessoa.filter((d) => {
        if (!d.dta_cadastro) {
          return false;
        }

        const dataCadastro = d.dta_cadastro.substring(0, 10); // YYYY-MM-DD

        // Se só tem data inicial, filtra >= data inicial
        if (this.dataCadastroInicial && !this.dataCadastroFinal) {
          return dataCadastro >= this.dataCadastroInicial;
        }

        // Se só tem data final, filtra <= data final
        if (!this.dataCadastroInicial && this.dataCadastroFinal) {
          return dataCadastro <= this.dataCadastroFinal;
        }

        // Se tem ambas, filtra no intervalo
        if (this.dataCadastroInicial && this.dataCadastroFinal) {
          return (
            dataCadastro >= this.dataCadastroInicial &&
            dataCadastro <= this.dataCadastroFinal
          );
        }

        return true;
      });

      // Ordena em ordem alfabética
      resultadosFiltrados.sort((a, b) =>
        a.nom_pessoa.localeCompare(b.nom_pessoa),
      );

      this.todosResultados = resultadosFiltrados;
      this.dataLoad.filtroPessoa = resultadosFiltrados;

      // Reset de paginação e carrega primeira página
      this.paginaAtual = 0;
      this.resultadosVisiveis = [];
      this.carregarMaisResultados();

      console.log(
        `📅 ${resultadosFiltrados.length} clientes encontrados com filtro de data`,
      );
    }
  }

  limparFiltroData() {
    this.dataCadastroInicial = "";
    this.dataCadastroFinal = "";
    // Limpa os resultados ao limpar as datas
    this.dataLoad.filtroPessoa = [];
    this.todosResultados = [];
    this.resultadosVisiveis = [];
    this.paginaAtual = 0;
    this.temMaisResultados = false;
  }

  pesquisaCliente(event) {
    console.log(event.target.value);
    if (event.target.value.length === 0 || event.target.value.length < 3) {
      this.dataLoad.filtroPessoa = [];
      this.todosResultados = [];
      this.resultadosVisiveis = [];
      this.paginaAtual = 0;
      this.temMaisResultados = false;
    } else {
      const query = event.target.value.toLowerCase();

      // Filtra todos os resultados por nome, CNPJ ou código
      let resultadosFiltrados = this.dataLoad.pessoa.filter(
        (d) =>
          d.nom_pessoa.toLowerCase().indexOf(query) > -1 ||
          d.num_cnpj_cpf.toLowerCase().indexOf(query) > -1 ||
          d.cod_pessoa == query,
      );

      // Se houver período de data informado, filtra também por data
      if (this.dataCadastroInicial || this.dataCadastroFinal) {
        resultadosFiltrados = resultadosFiltrados.filter((d) => {
          if (!d.dta_cadastro) return false;

          const dataCadastro = d.dta_cadastro.substring(0, 10); // YYYY-MM-DD

          // Se só tem data inicial, filtra >= data inicial
          if (this.dataCadastroInicial && !this.dataCadastroFinal) {
            return dataCadastro >= this.dataCadastroInicial;
          }

          // Se só tem data final, filtra <= data final
          if (!this.dataCadastroInicial && this.dataCadastroFinal) {
            return dataCadastro <= this.dataCadastroFinal;
          }

          // Se tem ambas, filtra no intervalo
          if (this.dataCadastroInicial && this.dataCadastroFinal) {
            return (
              dataCadastro >= this.dataCadastroInicial &&
              dataCadastro <= this.dataCadastroFinal
            );
          }

          return true;
        });
      }

      this.todosResultados = resultadosFiltrados;

      // Ordena em ordem alfabética pelo nome
      this.todosResultados.sort((a, b) =>
        a.nom_pessoa.localeCompare(b.nom_pessoa),
      );

      // Se houver muitos resultados, notifica o usuário
      if (this.todosResultados.length > this.TAMANHO_PAGINA) {
        console.log(
          `🚀 Encontrados ${this.todosResultados.length} clientes. Mostrando ${this.TAMANHO_PAGINA} por vez.`,
        );
      }

      // Atualiza a lista antiga para compatibilidade
      this.dataLoad.filtroPessoa = this.todosResultados;

      // Reset de paginação e carrega primeira página
      this.paginaAtual = 0;
      this.resultadosVisiveis = [];
      this.carregarMaisResultados();
    }
  }

  carregarMaisResultados() {
    const inicio = this.paginaAtual * this.TAMANHO_PAGINA;
    const fim = inicio + this.TAMANHO_PAGINA;
    const novosResultados = this.todosResultados.slice(inicio, fim);

    this.resultadosVisiveis = [...this.resultadosVisiveis, ...novosResultados];
    this.paginaAtual++;
    this.temMaisResultados = fim < this.todosResultados.length;
  }

  onInfiniteScroll(event: any) {
    this.carregarMaisResultados();

    setTimeout(() => {
      event.target.complete();

      // Se não há mais resultados, desabilita o infinite scroll
      if (!this.temMaisResultados) {
        event.target.disabled = true;
      }
    }, 500);
  }

  async addRegiao(ev) {
    this.movimento.regiaoSelecionada = ev.detail.value;
    this.movimento.pessoasSelecionadas = [];

    const loading = await this.loadingCtrl.create({
      message: "Relacionando Clientes...", // Mensagem a ser exibida no controle de carga
      duration: 30000, // Duração do controle de carga (opcional)
    });
    await loading.present(); // Exibir o controle de carga

    for (const p of this.dataLoad.pessoa) {
      // Verificar se a pessoa já está na lista de pessoas selecionadas
      const pessoaJaSelecionada = this.movimento.pessoasSelecionadas.some(
        (ps) => ps.cod_pessoa === p.cod_pessoa,
      );

      // Verificar se a pessoa pertence à região selecionada
      const pertenceRegiao = this.movimento.regiaoSelecionada.some(
        (ps) => p.cod_regiao_venda === ps.cod_regiao_venda,
      );

      // Adicionar a pessoa apenas se ela pertence à região selecionada e não está na lista de pessoas selecionadas
      if (pertenceRegiao && !pessoaJaSelecionada) {
        this.movimento.pessoasSelecionadas.push(p);
      }
    }

    await loading.dismiss(); // Ocultar o controle de carga quando o processo estiver concluído
  }

  removeRegiao(regiao) {
    this.movimento.regiaoSelecionada = this.movimento.regiaoSelecionada.filter(
      (row) => row.cod_regiao_venda != regiao.cod_regiao_venda,
    );
    this.movimento.pessoasSelecionadas =
      this.movimento.pessoasSelecionadas.filter(
        (row) => row.cod_regiao_venda != regiao.cod_regiao_venda,
      );
  }

  addPessoa(item) {
    if (this.existeClienteComCodPessoa(item.cod_cliente)) {
      this.alert.presentToast(`❌ Cliente já adicionado anteriormente`, 1500);
      item.ind_selecionado = true;
    } else {
      this.movimento.pessoasSelecionadas.push(item);
      item.ind_selecionado = true;
      // Feedback visual silencioso - sem toast para não bloquear seleção rápida
    }
  }

  existeClienteComCodPessoa(codPessoa: number): boolean {
    return this.movimento.pessoasSelecionadas.some(
      (cliente) => cliente.cod_pessoa === codPessoa,
    );
  }

  removePessoa(item) {
    item.ind_selecionado = false;
    this.movimento.pessoasSelecionadas =
      this.movimento.pessoasSelecionadas.filter(
        (row) => row.cod_pessoa != item.cod_pessoa,
      );
    // Feedback visual silencioso - sem toast para não bloquear interação
  }

  addItem(item, { detail: { checked } }) {
    item.ind_selecionado = checked;

    if (checked) {
      this.movimento.itemSelecionado.push(item);
    } else {
      this.movimento.itemSelecionado = this.movimento.itemSelecionado.filter(
        (row) => row.cod_item !== item.cod_item,
      );
    }
  }

  marcarItens(ev) {
    // Limpa seleções anteriores
    this.item.forEach((row) => (row.ind_selecionado = false));
    this.movimento.itemSelecionado = [];

    const codItensParaMarcar = ev.detail.value;

    console.log("🔍 Itens para marcar:", codItensParaMarcar);

    // Marca todos os itens que têm cod_item na lista, independente da empresa
    this.item.forEach((item) => {
      if (codItensParaMarcar.includes(item.cod_item)) {
        item.ind_selecionado = true;
        this.movimento.itemSelecionado.push(item);
      }
    });

    console.log(
      "✅ Total de itens marcados:",
      this.movimento.itemSelecionado.length,
    );
  }

  buscaFiltros() {
    // Remove qualquer loading anterior que possa estar aberto
    this.loadingCtrl.dismiss().catch(() => {});

    // Busca filtros em background SEM loading (dados já carregados)
    const filtroObservable = this.movimento
      .buscaFiltro(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
      )
      .pipe(timeout(301000));

    filtroObservable
      .pipe(
        tap((data) => {
          console.log(data);
          this.item = data.item;
          this.itemfull = data.itemfull;
          this.movimento.formaPagto = data.formaPagto;
          this.groupedItems = this.groupItemsByCodEmpresa(this.item);
          this.movimento.tipoFormaPagto = data.tipoFormaPagto;
        }),
        catchError((error) => {
          this.handleError(error);
          throw error;
        }),
      )
      .subscribe();
  }

  async showLoading(message, duration) {
    const loading = await this.loadingCtrl.create({
      message: message,
      duration: duration,
    });
    loading.present();
  }

  private handleError(error: any) {
    if (error.name === "TimeoutError") {
      this.alert.presentToast(
        "Tempo de retorno da solicitação atingido, tente novamente",
        3000,
      );
    } else {
      this.alert.presentToast(
        "Tempo de retorno da solicitação atingido, tente novamente",
        3000,
      );
    }
  }

  setOpen(isOpen: boolean) {
    this.isModalOpenCliente = isOpen;
  }

  abrirModalSelecaoMassa() {
    this.itensFiltradosModal = [...this.itemfull];

    // Pré-seleciona os itens que já estão marcados
    this.itensSelecionadosModal = this.movimento.itemSelecionado.map(
      (item) => item.cod_item,
    );

    this.isModalSelecaoMassaOpen = true;
  }

  fecharModalSelecaoMassa() {
    this.isModalSelecaoMassaOpen = false;
    this.itensFiltradosModal = [];
    this.itensSelecionadosModal = [];
  }

  filtrarItensModal(event: any) {
    const query = event.target.value.toLowerCase();

    if (!query || query.length === 0) {
      this.itensFiltradosModal = [...this.itemfull];
    } else {
      this.itensFiltradosModal = this.itemfull.filter(
        (item) =>
          item.cod_item.toString().toLowerCase().indexOf(query) > -1 ||
          item.des_item.toLowerCase().indexOf(query) > -1,
      );
    }
  }

  toggleItemModal(item: itemfull) {
    const index = this.itensSelecionadosModal.indexOf(item.cod_item);

    if (index > -1) {
      this.itensSelecionadosModal.splice(index, 1);
    } else {
      this.itensSelecionadosModal.push(item.cod_item);
    }
  }

  isItemSelecionadoModal(item: itemfull): boolean {
    return this.itensSelecionadosModal.includes(item.cod_item);
  }

  confirmarSelecaoMassa() {
    if (this.itensSelecionadosModal.length === 0) {
      this.alert.presentToast("⚠️ Selecione pelo menos um item", 2000);
      return;
    }

    // Marca todos os itens selecionados
    this.marcarItens({
      detail: {
        value: this.itensSelecionadosModal,
      },
    });

    // Atualiza o groupedItems para refletir as seleções
    this.groupedItems = this.groupItemsByCodEmpresa(this.item);

    this.fecharModalSelecaoMassa();
  }

  limpaDados() {
    this.movimento.pessoasSelecionadas = [];
  }

  // TrackBy function para melhorar performance do ngFor
  trackByPessoa(index: number, pessoa: pessoa): number {
    return pessoa.cod_pessoa;
  }

  trackByItem(index: number, item: item): string {
    return `${item.cod_item}-${item.cod_empresa}`;
  }

  // Limpa seleções ao sair da página
  ionViewWillLeave() {
    console.log("🚪 Saindo da tela de filtro");
    // Marca que está dentro do fluxo (indo para tela de itens)
    this.dentroDoFluxo = true;
  }

  // Mostra clientes selecionados ao entrar na página
  ionViewWillEnter() {
    console.log("🚪 Entrando na tela de filtro");
    console.log("🔄 Dentro do fluxo?", this.dentroDoFluxo);
    console.log(
      "📊 Pessoas selecionadas:",
      this.movimento.pessoasSelecionadas.length,
    );

    // Se está voltando de dentro do fluxo (ex: tela de itens)
    if (this.dentroDoFluxo) {
      console.log("✅ Voltando de dentro do fluxo - mantém seleções");

      // Mostra os clientes selecionados
      if (
        this.movimento.pessoasSelecionadas &&
        this.movimento.pessoasSelecionadas.length > 0
      ) {
        console.log(
          `📋 Mostrando ${this.movimento.pessoasSelecionadas.length} clientes já selecionados`,
        );

        // Marca como selecionados no dataLoad.pessoa
        this.movimento.pessoasSelecionadas.forEach((pessoaSelecionada) => {
          const pessoa = this.dataLoad.pessoa.find(
            (p) => p.cod_pessoa === pessoaSelecionada.cod_pessoa,
          );
          if (pessoa) {
            pessoa.ind_selecionado = true;
          }
        });

        // Mostra os clientes selecionados nos resultados
        this.dataLoad.filtroPessoa = [...this.movimento.pessoasSelecionadas];
        this.todosResultados = [...this.movimento.pessoasSelecionadas];
        this.paginaAtual = 0;
        this.resultadosVisiveis = [];
        this.carregarMaisResultados();
      }
    } else {
      // Está vindo da home (novo fluxo) - limpa tudo
      console.log("🆕 Entrando em novo fluxo - limpa tudo");
      this.movimento.pessoasSelecionadas = [];
      this.movimento.regiaoSelecionada = [];
      this.movimento.itemSelecionado = [];
      this.limparSelecoes();

      // Desmarca todos os ind_selecionado
      this.dataLoad.pessoa.forEach((p) => (p.ind_selecionado = false));
    }

    // Reseta a flag para o próximo ciclo
    this.dentroDoFluxo = false;
  }

  private limparSelecoes() {
    // Limpa apenas os filtros de pesquisa, não as seleções confirmadas
    this.dataLoad.filtroPessoa = [];
    this.todosResultados = [];
    this.resultadosVisiveis = [];
    this.paginaAtual = 0;
    this.temMaisResultados = false;
  }
}
