
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import * as moment from 'moment';
import { timeout, tap, finalize, catchError } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { negociacoesExistentes, pessoa } from 'src/app/class/user';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';

@Component({
  selector: 'app-preco-atualizacao',
  templateUrl: './preco-atualizacao.page.html',
  styleUrls: ['./preco-atualizacao.page.scss'],
  standalone: false
})
export class PrecoAtualizacaoPage implements OnInit {

  isModalFormaPagto = false
  isModalNegociacoes = false;
  tipoPreco = '';
  tipoNegociacao = '';
  valor = 0
  listaDeNegociacoes: negociacoesExistentes[] = []
  listaFiltrada: negociacoesExistentes[] = []
  listaNegociacaoModal: negociacoesExistentes[] = []

  constructor(public auth: AuthService, private loadingCtrl: LoadingController, public movimento: MovimentoService, private alert: Alert, private router: Router) { }

  ngOnInit() {

  }

  agruparPorDesItem(negociacoes: negociacoesExistentes[]): { des_item: string, itens: negociacoesExistentes[] }[] {
    const groupedItems: { des_item: string, itens: negociacoesExistentes[] }[] = [];

    negociacoes.forEach(negociacao => {
        const foundGroup = groupedItems.find(group => group.des_item === negociacao.des_item);
        if (foundGroup) {
            foundGroup.itens.push(negociacao);
        } else {
            groupedItems.push({ des_item: negociacao.des_item, itens: [negociacao] });
        }
    });

    return groupedItems;
  }

  buscaAtualizacao(){

    const formasSelecionadas = this.movimento.formaPagto.filter(row => row.ind_selecionado === true).map(row => row.cod_forma_pagto);
    const itemSelecionado = this.movimento.itemSelecionado
    .filter((row, index, self) => row.ind_selecionado === true && self.findIndex(r => r.cod_item === row.cod_item) === index)
    .map(row => row.cod_item);
    const clientes = this.movimento.pessoasSelecionadas.map(row => row.cod_pessoa)

    if(formasSelecionadas.length <= 0 || itemSelecionado.length <= 0 || clientes.length <= 0){
      this.alert.presentToast('Itens, Formas de Pagamento ou Clientes não informados', 3000)
    }else{
      this.showLoading('Buscando dados...', 300000);

      const filtroObservable = this.movimento.buscaAtualizacaoNegociacao(this.auth.userLogado.schema,
                                                                        this.auth.userLogado.cod_usuario,
                                                                        this.auth.userLogado.cod_empresa_sel,
                                                                        itemSelecionado, formasSelecionadas, clientes).pipe(
        timeout(301000),
      );

      filtroObservable
      .pipe(
        tap(data =>{
          console.log(data)
          if(data.message == 0){
            this.alert.presentToast('Nenhuma negociação existente com os criterios especificados', 3000)
          }
          this.listaDeNegociacoes = data.message
          this.listaFiltrada = [...this.listaDeNegociacoes]
        }),
        finalize(() => this.loadingCtrl.dismiss()),
        catchError((error) => {
          this.handleError(error);
          throw error;
        })
      )
      .subscribe();
    }

  }

  marcarFormasPagto(ev){

    this.movimento.formaPagto.map(row => row.ind_selecionado = false)

    for (const row of ev.detail.value) {
      for (const i of this.movimento.formaPagto) {

        if(row.ind_tipo == i.ind_tipo){
          i.ind_selecionado = true
        }
      }
    }
  }


  aplicarRegra() {
    const dataDeHoje = moment();

    this.listaFiltrada.forEach(row => {
      row.ind_alterado = true;
      row.dta_inclusao = dataDeHoje.format('YYYY-MM-DD');
      row.dta_inicio = dataDeHoje.format('YYYY-MM-DD');
        if (row.val_preco_venda_a > 0) {
            row.new_val_preco_venda_a = this.valor;
        }
        if (row.val_preco_venda_b > 0) {
            row.new_val_preco_venda_b = this.valor;
        }
        if (row.val_preco_venda_c > 0) {
            row.new_val_preco_venda_c = this.valor;
        }
        if (row.val_preco_venda_d > 0) {
          row.new_val_preco_venda_d = this.valor;
        }
        if (row.val_preco_venda_e > 0) {
          row.new_val_preco_venda_e = this.valor;
        }
    });
}

  setOpenModalFormaPagto(isOpen: boolean){
    this.isModalFormaPagto = isOpen;
  }

  setOpenNegociacoes(isOpen: boolean, item) {
    this.isModalNegociacoes = isOpen;
    this.listaNegociacaoModal = item;
    console.log(this.listaNegociacaoModal)
  }

  addFormaPagto(itemIndex, event) {
    this.movimento.formaPagto.forEach((row, index) => {
      if (index === itemIndex) {
        row.ind_selecionado = event.detail.checked;
      }
    });
  }

  filtraTipoNegociacao(event){ // A, D OU P
    const registro = event.detail.value
    this.listaFiltrada = this.listaDeNegociacoes.filter(row => row.ind_tipo_negociacao === registro)
    console.log(this.agruparPorDesItem(this.listaFiltrada));
  }

  filtraTipoPreco(event){ //P OU V
    const registro = event.detail.value
    this.listaFiltrada = this.listaDeNegociacoes.filter(row => row.ind_percentual_valor === registro && row.ind_tipo_negociacao === this.tipoNegociacao)
  }

  marcarTodasFormasPagto(){
    this.movimento.formaPagto.map(row => {
      row.ind_selecionado = true
    })
  }

  desmarcarTodasFormasPagto(){
    this.movimento.formaPagto.map(row => {
      row.ind_selecionado = false
    })
  }

  enviarTroca(){

  const regras = this.listaDeNegociacoes.filter(row => row.ind_alterado === true)

  if(regras.length > 0){
    this.showLoading('Enviando dados...', 500000)

    this.movimento.atualizaNegociacao(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel, this.auth.userLogado.nom_usuario, this.auth.userLogado.cod_usuario, regras).pipe(
      timeout(501000),
      catchError((err) => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe((data)=>{
      this.alert.presentToast(data.message, 4000)
      this.movimento.itemSelecionado = []
      this.movimento.formaPagto = []
      this.movimento.pessoasSelecionadas = []
      this.loadingCtrl.dismiss();
      this.router.navigate(['/home']);
    });
  }else{
    this.alert.presentAlert('Atenção', 'Procedimento Incorreto', 'Defina primeiramente os preços a serem enviados.')
  }
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
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    } else {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    }
  }
}
