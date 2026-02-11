import { cod_empresa, formaPagto, pessoaNegociacao, tipoPreco } from './../../class/user';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonAccordionGroup, LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { timeout, tap, finalize, catchError, switchMap, EMPTY, of } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { item } from 'src/app/class/user';
import { AuthService } from 'src/app/services/auth.service';
import { DataloadService } from 'src/app/services/dataload.service';
import { MovimentoService } from 'src/app/services/movimento.service';


@Component({
  selector: 'app-precos',
  templateUrl: './precos.page.html',
  styleUrls: ['./precos.page.scss'],
  standalone: false
})
export class PrecosPage implements OnInit {

  @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;


  isConfigValid(): boolean {
    return true
  }
  expandAccordion() {
    throw new Error('Method not implemented.');
  }

  @ViewChild('popover') popover;
  isOpen = false;

  isModalFormaPagto = false
  isModalCombustivel = false
  multipleSelecion = true
  disabledListaFormaPagto = false

  tipoNegociacao = null
  tipoPreco = []
  valor = null
  percentual = null
  valCusto = null
  codigosItem: item[] = []
  codigosFilter: item[] = []
  tipoFormaPagto: formaPagto[] = []
  formaPagtoFiltrada: formaPagto[] = []

  negociacaoNova: pessoaNegociacao[] = []

  groupedItemsEmp: { nom_fantasia: string, cod_empresa: number, items: item[] }[] = [];

  constructor(public movimento: MovimentoService, public dataLoad: DataloadService, private router: Router, public auth: AuthService, private loadingCtrl: LoadingController, private alert: Alert) { }

  ngOnInit() {

    this.formaPagtoFiltrada = this.movimento.formaPagto;
    const nativeEl = this.accordionGroup
    nativeEl.value = 'first';
    this.movimento.formaPagto.map(row => {
      row.ind_selecionado_todos = false
      row.ind_selecionado = false
    })
    this.groupedItemsEmp = this.groupItemsByCodEmpresa(this.movimento.itemSelecionado);
    this.codigosFilter = this.removerDuplicados(this.movimento.itemSelecionado)
  }

  async enviarTroca() {
    const totalRegistros =
      this.negociacaoNova.length * this.movimento.pessoasSelecionadas.length;

    // 1️⃣ Validação rápida (fail fast)
    if (totalRegistros > 5000) {
      this.alert.presentAlert(
        'Atenção',
        'Limite Excedido',
        'O número total de negociações não pode exceder 5 mil registros. Por favor, ajuste suas seleções e tente novamente.'
      );
      return;
    }

    // 2️⃣ Filtra apenas regras válidas (uma única vez)
    const regras = this.negociacaoNova.filter(r => r.valor_valido);

    if (!regras.length) {
      this.alert.presentAlert(
        'Atenção',
        'Procedimento Incorreto',
        'Não existem negociações válidas a serem enviadas.'
      );
      return;
    }

    // 3️⃣ Loading real (sem timeout fixo)
    await this.showLoading('Enviando dados...', 50000);

    this.movimento
      .novaNegociacao(
        this.auth.userLogado.schema,
        this.auth.userLogado.cod_empresa_sel,
        this.auth.userLogado.nom_usuario,
        this.auth.userLogado.cod_usuario,
        this.movimento.pessoasSelecionadas,
        regras
      )
      .pipe(timeout(30000))
      .subscribe({
        next: (data) => {
          this.alert.presentToast(data.message, 5000);
          this.finalizarEnvio();
        },
        error: (err) => {
          this.handleError(err);
          this.finalizarEnvio();
        }
      });
  }

  private finalizarEnvio() {
    this.movimento.itemSelecionado = [];
    this.movimento.formaPagto = [];
    this.movimento.pessoasSelecionadas = [];
    this.loadingCtrl.dismiss();
    this.router.navigate(['/home']);
  }

  setTipoNegociacao(ev) {
    this.tipoNegociacao = ev.detail.value
    this.multipleSelecion = this.tipoNegociacao !== 'P';
  }

  setTipoPreco(ev) {
    this.tipoPreco = ev.detail.value
  }

  groupItemsByCodEmpresa(items: item[]): { nom_fantasia: string, cod_empresa: number, items: item[] }[] {
    const groupedItems: { nom_fantasia: string, cod_empresa: number, items: item[] }[] = [];

    items.forEach(item => {
      const foundGroup = groupedItems.find(group => group.cod_empresa === item.cod_empresa);
      if (foundGroup) {
        foundGroup.items.push(item);
      } else {
        groupedItems.push({ nom_fantasia: item.nom_fantasia, cod_empresa: item.cod_empresa, items: [item] });
      }
    });

    return groupedItems;
  }

  agruparPorDesItem(items: pessoaNegociacao[]): { des_item: string, itens: pessoaNegociacao[] }[] {
    const groupedItems: { [des_item: string]: pessoaNegociacao[] } = {};

    items.forEach(item => {
      if (!groupedItems[item.des_item]) {
        groupedItems[item.des_item] = [];
      }
      groupedItems[item.des_item].push(item);
    });

    return Object.keys(groupedItems).map(des_item => ({
      des_item,
      itens: groupedItems[des_item]
    }));
  }

  groupRegraByCodEmpresa(items: pessoaNegociacao[]): { nom_fantasia: string, cod_empresa: number, items: pessoaNegociacao[] }[] {
    const groupedItems: { nom_fantasia: string, cod_empresa: number, items: pessoaNegociacao[] }[] = [];

    items.forEach(item => {
      const foundGroup = groupedItems.find(group => group.cod_empresa === item.cod_empresa);
      if (foundGroup) {
        foundGroup.items.push(item);
      } else {
        groupedItems.push({ nom_fantasia: item.nom_fantasia, cod_empresa: item.cod_empresa, items: [item] });
      }
    });

    return groupedItems;
  }

  removerDuplicados(itens: any[]): any[] {
    const codItemSet = new Set();
    return itens.filter(item => {
      if (codItemSet.has(item.cod_item)) {
        return false; // Se já existir, não inclua
      }
      codItemSet.add(item.cod_item);
      return true; // Se não existir, inclua
    });
  }

  setItem(ev, item, index) {
    const status = ev.detail.checked
    item.ind_selecionado_regra = status
    if (status) {
      this.codigosItem.push(item)
    } else {
      this.codigosItem.splice(index, 1)
    }

    console.log(this.codigosItem, 'codigosItem fa funnção setItem')
  }

  marcarItens(ev) {

    this.codigosItem = []
    this.movimento.itemSelecionado.map(row => row.ind_selecionado_regra = false)

    for (const row of ev.detail.value) {
      for (const i of this.movimento.itemSelecionado) {

        if (row.cod_item === i.cod_item) {
          i.ind_selecionado_regra = true;
          this.codigosItem.push(i);
        }
      }
    }

  }

  marcarTodosItens() {

    this.codigosItem = []

    this.movimento.itemSelecionado.map(row => {
      row.ind_selecionado_regra = true
      this.codigosItem.push(row)
    })
  }

  desmarcarTodosItens() {
    this.movimento.itemSelecionado.map(row => {
      row.ind_selecionado_regra = false
    })
    this.codigosItem = []
  }


  marcarFormasPagto(ev) {

    this.movimento.formaPagto = this.formaPagtoFiltrada

    for (const row of ev.detail.value) {
      for (const i of this.movimento.formaPagto) {

        if (row.ind_tipo == i.ind_tipo) {
          i.ind_selecionado = true
        }
      }
    }
  }

  filtrarFormaPagto(event) {

    if (!event?.target?.value) {
      this.formaPagtoFiltrada = this.movimento.formaPagto;
      return;
    }

    const query = event.target.value.toLowerCase();

    this.formaPagtoFiltrada = this.movimento.formaPagto.filter((d) =>
      d.des_forma_pagto.toLowerCase().indexOf(query) > -1 ||
      d.cod_forma_pagto == query);
  }

  // marcarTodasFormasPagto(ev) {
  //   const status = ev.detail.checked

  //   this.disabledListaFormaPagto = status

  //   if (status) {
  //     this.movimento.formaPagto.map(row => {
  //       row.ind_selecionado_todos = true
  //       row.ind_selecionado = true
  //     })
  //   } else {
  //     this.movimento.formaPagto.map(row => {
  //       row.ind_selecionado_todos = false
  //       row.ind_selecionado = false
  //     })
  //   }

  // }

  desmarcarTodasFormasPagto() {
    this.movimento.formaPagto.map(row => {
      row.ind_selecionado = false
    })
  }

  addFormaPagto(item, event) {

    const codForma = item
    const status = event.detail.checked

    this.movimento.formaPagto.map(row => {
      if (row.cod_forma_pagto === codForma) {
        row.ind_selecionado = status
      }
    })

    console.log(this.movimento.formaPagto.filter(row => row.ind_selecionado === true), 'formaPagto na função addFormaPagto')
  }

  getFormasSelecionadas(): formaPagto[] {
    console.log(this.movimento.formaPagto.filter(row => row.ind_selecionado === true), 'formas selecionadas na função getFormasSelecionadas')
    return this.movimento.formaPagto.filter(row => row.ind_selecionado === true);
  }

  aplicarRegra() {

    const nativeEl = this.accordionGroup;
    nativeEl.value = undefined;

    const dataDeHoje = moment();
    let formasSelecionadas;

    if (this.validarCampos(this.valor, this.percentual, this.tipoNegociacao, this.tipoPreco, this.codigosItem, this.movimento.formaPagto)) {
      let percentualValor = this.valor > 0 ? 'V' : this.percentual > 0 ? 'P' : null;

      // 1. Mapeia formas selecionadas para uma lista de condições de pagamento
      for (const forma of this.movimento.formaPagto) {
        if (forma.ind_selecionado_todos === true) {
          formasSelecionadas = this.movimento.formaPagto
            .filter(row => row.ind_selecionado_todos === true)
            .map(forma => ({
              cod_condicao_pagamento: null,
              des_forma_pagto: 'Todas as Formas'
            })).slice(0, 1);
        } else {
          formasSelecionadas = this.movimento.formaPagto
            .filter(row => row.ind_selecionado === true)
            .map(forma => ({
              cod_condicao_pagamento: forma.cod_forma_pagto,
              des_forma_pagto: forma.des_forma_pagto
            }));
        }
      }

      const existeRegistro = this.verificarPresencaItem(this.negociacaoNova, this.codigosItem, formasSelecionadas)

      if (existeRegistro) {

        this.alert.presentAlertConfirm('Atenção', 'Mensagem ao usuário', 'Existem negociações já informadas para uma dos combustiveis, deseja sobrepor?').then(data => {
          if (data === 'sim') {

            this.negociacaoNova = this.negociacaoNova.filter(elemento => {
              // Verifica se o elemento tem o cod_item presente em codigosItem
              const codItemPresente = this.codigosItem.some(codigo => codigo.cod_item === elemento.cod_item);

              // Verifica se o elemento tem o cod_condicao_pagamento presente em formasSelecionadas
              const formaPagtoPresente = formasSelecionadas.some(forma => forma.cod_condicao_pagamento === elemento.cod_condicao_pagamento);

              // Retorna verdadeiro apenas se ambos os valores não estiverem presentes
              return !(codItemPresente && formaPagtoPresente);
            });

            // 2. Atualiza pessoasNegociacaoNova com as formas selecionadas
            this.codigosItem.forEach(item => {
              formasSelecionadas.forEach(forma => {
                this.negociacaoNova.push({
                  cod_item: item.cod_item,
                  des_item: item.des_item,
                  dta_inicio: dataDeHoje.format('YYYY-MM-DD'),
                  val_preco_venda_a: 0,
                  val_preco_venda_b: 0,
                  val_preco_venda_c: 0,
                  val_preco_venda_d: 0,
                  val_preco_venda_e: 0,
                  val_custo_medio: item.val_custo_medio,
                  cod_pessoa: 0,
                  ...forma,
                  dta_inclusao: dataDeHoje.format('YYYY-MM-DD'),
                  ind_tipo_negociacao: '',
                  ind_percentual_valor: '',
                  ind_tipo_preco_base: 'A',
                  nom_pessoa: '',
                  ind_adicionado: true,
                  val_preco_venda: item.val_preco_venda,
                  valor_calculado: 0,
                  valor_valido: false,
                  valor: 0,
                  nom_fantasia: item.nom_fantasia,
                  cod_empresa: item.cod_empresa
                });
              });
            });

            // 3. Aplica regras de preço
            this.negociacaoNova.forEach(row => {
              this.tipoPreco.forEach(tp => {
                row.ind_adicionado = true
                row.ind_tipo_negociacao = this.tipoNegociacao
                row.ind_percentual_valor = percentualValor
                row.valor = this.valor > 0 ? this.valor : this.percentual
                row.valor_calculado = this.calculaValor(this.tipoNegociacao, this.valor, this.percentual, row.val_preco_venda)
                this.aplicarRegraPreco(row, `val_preco_venda_${tp.toLowerCase()}`);
                row.valor_valido = row.valor_calculado < row.val_custo_medio ? false : true
              })
            });

          } else {
            this.alert.presentToast("Operação Cancelada", 2000)
          }

        })
      } else {

        const existentesSet = new Set(
          this.negociacaoNova.map(n => n.cod_item)
        );
        // 2. Atualiza NegociacaoNova com as formas selecionadas
        this.codigosItem.forEach(item => {
          formasSelecionadas.forEach(forma => {
            this.negociacaoNova.push({
              cod_item: item.cod_item,
              des_item: item.des_item,
              dta_inicio: dataDeHoje.format('YYYY-MM-DD'),
              val_preco_venda_a: 0,
              val_preco_venda_b: 0,
              val_preco_venda_c: 0,
              val_preco_venda_d: 0,
              val_preco_venda_e: 0,
              val_custo_medio: item.val_custo_medio,
              cod_pessoa: 0,
              ...forma,
              dta_inclusao: dataDeHoje.format('YYYY-MM-DD'),
              ind_tipo_negociacao: '',
              ind_percentual_valor: '',
              ind_tipo_preco_base: 'A',
              nom_pessoa: '',
              ind_adicionado: true,
              val_preco_venda: item.val_preco_venda,
              valor_calculado: 0,
              valor_valido: false,
              valor: 0,
              nom_fantasia: item.nom_fantasia,
              cod_empresa: item.cod_empresa
            });
          });
        });

        // 3. Aplica regras de preço
        this.negociacaoNova.forEach(row => {
          if (existentesSet.has(row.cod_item)) return;
          this.tipoPreco.forEach(tp => {
            row.ind_adicionado = true
            row.ind_tipo_negociacao = this.tipoNegociacao
            row.ind_percentual_valor = percentualValor
            row.valor = this.valor > 0 ? this.valor : this.percentual
            row.valor_calculado = this.calculaValor(this.tipoNegociacao, this.valor, this.percentual, row.val_preco_venda)
            this.aplicarRegraPreco(row, `val_preco_venda_${tp.toLowerCase()}`);
            row.valor_valido = row.valor_calculado < row.val_custo_medio ? false : true
          })
        });

      }

    } else {
      this.alert.presentToast("Existem campos não preechidos!", 2000)
    }

    this.agruparPorDesItem(this.negociacaoNova)
    console.log(this.agruparPorDesItem(this.negociacaoNova))
  }

  verificarPresencaItem(negociacaoNova, codigosItem, formasSelecionadas) {
    return negociacaoNova.some(item =>
      codigosItem.some(codigo => codigo.cod_item === item.cod_item) &&
      formasSelecionadas.some(forma => forma.cod_condicao_pagamento === item.cod_condicao_pagamento)
    );
  }

  aplicarRegraPreco(row: any, campo: string) {
    const tipo = campo.substr(-1);
    row[campo] = this.valor > 0 ? this.valor : this.percentual
  }

  calculaValor(tipo, valor, percentual, valorVenda) {
    let valorCalculado;

    if (tipo === 'A') {
      valorCalculado = valor > 0 ? valorVenda + valor : valorVenda + (percentual / 100 * valorVenda);
    } else if (tipo === 'D') {
      valorCalculado = valor > 0 ? valorVenda - valor : valorVenda - (percentual / 100 * valorVenda);
    } else if (tipo === 'P') {
      valorCalculado = valor > 0 ? valor : undefined;
    }

    return valorCalculado;
  }

  removeItem(item) {
    this.negociacaoNova = this.negociacaoNova.filter(row => row.cod_item !== item)
  }


  setOpenModalFormaPagto(isOpen: boolean) {
    this.isModalFormaPagto = isOpen;
    this.formaPagtoFiltrada = this.movimento.formaPagto;
  }


  setOpenModalCombustivel(isOpen: boolean) {
    this.isModalCombustivel = isOpen;
  }

  async showLoading(message, duration) {
    const loading = await this.loadingCtrl.create({
      message: message,
      duration: duration,
    });
    loading.present();
  }

  private handleError(error: any) {
    if (error.name === 'TimeoutError') {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 30000);
    } else {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 30000);
    }
  }

  presentPopover(e: Event) {
    this.popover.event = e;
    this.isOpen = true;
  }

  validarCampos(valor, percentual, tipoNegociacao, tipoPreco, codigosItem, formaPagto) {

    // Verifica se valor ou quantidade é maior que zero
    if (!(valor > 0) && !(percentual > 0)) {
      return false;
    }
    // Verifica se há registros no array tipoNegociacao
    if (tipoNegociacao.length === 0) {
      return false;
    }
    // Verifica se tipoPreco está preenchido
    if (tipoPreco.length === 0) {
      return false;
    }
    // Verifica se há registros no array codigosItem
    if (codigosItem.length === 0) {
      return false;
    }
    // Verifica se há registros no array formaPagto
    if (!formaPagto.some(row => row.ind_selecionado)) {
      return false;
    }
    // Todos os critérios foram atendidos
    return true;
  }
}
