import { Component, OnInit } from "@angular/core";
import { LoadingController } from "@ionic/angular";
import { timeout, tap, finalize, catchError } from "rxjs";
import { Alert } from "src/app/class/alert";
import { item, itemfull, pessoa } from "src/app/class/user";
import { AuthService } from "src/app/services/auth.service";
import { DataloadService } from "src/app/services/dataload.service";
import { MovimentoService } from "src/app/services/movimento.service";

@Component({
  selector: "app-filtro-atualizacao",
  templateUrl: "./filtro-atualizacao.page.html",
  styleUrls: ["./filtro-atualizacao.page.scss"],
  standalone: false,
})
export class FiltroAtualizacaoPage implements OnInit {
  groupedItems: { nom_fantasia: string; cod_empresa: number; items: item[] }[] =
    [];
  public item: item[] = [];
  public itemfull: itemfull[] = [];
  //public pessoa: pessoa[] = []
  //public filtroPessoa = [...this.pessoa]

  filtro = "C";
  isModalOpenCliente = false;

  constructor(
    public auth: AuthService,
    private loadingCtrl: LoadingController,
    public movimento: MovimentoService,
    private alert: Alert,
    public dataLoad: DataloadService,
  ) {}

  ngOnInit() {
    this.buscaFiltrosItem();
    this.movimento.itemSelecionado = [];
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

  pesquisaCliente(event) {
    console.log(event.target.value);
    if (event.target.value.length === 0) {
      this.dataLoad.filtroPessoa = [];
    } else {
      const query = event.target.value.toLowerCase();
      this.dataLoad.filtroPessoa = this.dataLoad.pessoa.filter(
        (d) =>
          d.nom_pessoa.toLowerCase().indexOf(query) > -1 ||
          d.num_cnpj_cpf.toLowerCase().indexOf(query) > -1 ||
          d.cod_pessoa == query,
      );
    }
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

  addItem(item, { detail: { checked } }, index) {
    item.ind_selecionado = checked;

    if (checked) {
      this.movimento.itemSelecionado.push(item);
    } else {
      this.removerItemPorCodItem(this.movimento.itemSelecionado, item.cod_item);
    }

    console.log(this.movimento.itemSelecionado);
    console.log(this.movimento.itemSelecionado.length);
  }

  marcarItens(ev) {
    this.item.map((row) => (row.ind_selecionado = false));
    this.movimento.itemSelecionado = [];

    const itens = this.item.filter((row) =>
      ev.detail.value.includes(row.cod_item),
    );

    for (const row of itens) {
      for (const i of this.item) {
        if (row.cod_item === i.cod_item && row.cod_empresa === i.cod_empresa) {
          i.ind_selecionado = true;
          this.movimento.itemSelecionado.push(i);
        }
      }
    }
  }

  removerItemPorCodItem(array, cod_item) {
    // Encontra o índice do item com o código de empresa fornecido
    const index = array.findIndex((item) => item.cod_item == cod_item);

    // Se encontrar o item, remove-o do array
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  buscaFiltrosItem() {
    this.showLoading("Buscando dados...", 300000);

    const filtroObservable = this.movimento
      .buscaFiltroItem(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
      )
      .pipe(timeout(301000));

    filtroObservable
      .pipe(
        tap((data) => {
          this.item = data.item;
          //this.pessoa = data.pessoa
          this.itemfull = data.itemfull;
          this.movimento.tipoFormaPagto = data.tipoFormaPagto;
          this.movimento.formaPagto = data.formaPagto;
          this.groupedItems = this.groupItemsByCodEmpresa(this.item);
        }),
        finalize(() => this.loadingCtrl.dismiss()),
        catchError((error) => {
          this.handleError(error);
          throw error;
        }),
      )
      .subscribe();
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

  setOpen(isOpen: boolean) {
    this.isModalOpenCliente = isOpen;
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
}
