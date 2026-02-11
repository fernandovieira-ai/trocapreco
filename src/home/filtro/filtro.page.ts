import { subGrupo, regiao, item, pessoa, formaPagto, itemfull } from './../../class/user';
import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { timeout, tap, catchError, finalize } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { AuthService } from 'src/app/services/auth.service';
import { DataloadService } from 'src/app/services/dataload.service';
import { MovimentoService } from 'src/app/services/movimento.service';

@Component({
  selector: 'app-filtro',
  templateUrl: './filtro.page.html',
  styleUrls: ['./filtro.page.scss'],
  standalone: false
})
export class FiltroPage implements OnInit {

  //public pessoa: pessoa[] = []
  //public filtroPessoa = [...this.pessoa]
  //public regiao: regiao[] = []
  public item: item[] = []
  public itemfull: itemfull[] = []
  //public subGrupo: subGrupo[] = []

  isModalOpenCliente = false;
  filtro = 'C'

  groupedItems: { nom_fantasia: string, cod_empresa: number, items: item[] }[] = [];

  constructor(public auth: AuthService, private loadingCtrl: LoadingController, public movimento: MovimentoService, private alert: Alert, public dataLoad: DataloadService) {}

  ngOnInit() {

    this.buscaFiltros();
    this.movimento.itemSelecionado = []
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

  tipoFiltro(ev){
    const parametro = ev.detail.value
    this.filtro = parametro;

    switch (parametro) {
      case 'C':

        break;
      case 'I':
        this.dataLoad.filtroPessoa = []
        break;
    }
  }

  pesquisaCliente(event){
    console.log(event.target.value)
    if(event.target.value.length === 0 || event.target.value.length < 3){
      this.dataLoad.filtroPessoa = []
    }else{
      const query = event.target.value.toLowerCase();
      this.dataLoad.filtroPessoa = this.dataLoad.pessoa.filter((d) =>
        d.nom_pessoa.toLowerCase().indexOf(query) > -1 ||
        d.num_cnpj_cpf.toLowerCase().indexOf(query) > -1 ||
        d.cod_pessoa == query );
    }
  }

  async addRegiao(ev) {
    this.movimento.regiaoSelecionada = ev.detail.value;
    this.movimento.pessoasSelecionadas = [];

    const loading = await this.loadingCtrl.create({
        message: 'Relacionando Clientes...', // Mensagem a ser exibida no controle de carga
        duration: 30000 // Duração do controle de carga (opcional)
    });
    await loading.present(); // Exibir o controle de carga

    for (const p of this.dataLoad.pessoa) {
        // Verificar se a pessoa já está na lista de pessoas selecionadas
        const pessoaJaSelecionada = this.movimento.pessoasSelecionadas.some(ps => ps.cod_pessoa === p.cod_pessoa);

        // Verificar se a pessoa pertence à região selecionada
        const pertenceRegiao = this.movimento.regiaoSelecionada.some(ps => p.cod_regiao_venda === ps.cod_regiao_venda);

        // Adicionar a pessoa apenas se ela pertence à região selecionada e não está na lista de pessoas selecionadas
        if (pertenceRegiao && !pessoaJaSelecionada) {
            this.movimento.pessoasSelecionadas.push(p);
        }
    }

    await loading.dismiss(); // Ocultar o controle de carga quando o processo estiver concluído
  }

  removeRegiao(regiao){
    this.movimento.regiaoSelecionada = this.movimento.regiaoSelecionada.filter(row => row.cod_regiao_venda != regiao.cod_regiao_venda)
    this.movimento.pessoasSelecionadas = this.movimento.pessoasSelecionadas.filter(row => row.cod_regiao_venda != regiao.cod_regiao_venda)
  }

  addPessoa(item){

    if (this.existeClienteComCodPessoa(item.cod_cliente)) {
      this.alert.presentToast(`Cliente já adicionada anteriormente.`, 4000);
      item.ind_selecionado = true
    } else {
      this.movimento.pessoasSelecionadas.push(item)
      item.ind_selecionado = true
      this.alert.presentToast(`Pessoa adicionada ${item.nom_pessoa}`, 3000);
    }
  }

  existeClienteComCodPessoa(codPessoa: number): boolean {
    return this.movimento.pessoasSelecionadas.some(cliente => cliente.cod_pessoa === codPessoa);
  }

  removePessoa(item){
    item.ind_selecionado = false
    this.movimento.pessoasSelecionadas = this.movimento.pessoasSelecionadas.filter(row => row.cod_pessoa != item.cod_pessoa)
  }

  addItem(item, { detail: { checked } }) {
    item.ind_selecionado = checked;

    if (checked) {
        this.movimento.itemSelecionado.push(item);
    } else {
        this.movimento.itemSelecionado = this.movimento.itemSelecionado.filter(row => row.cod_item !== item.cod_item);
    }
  }

  marcarItens(ev){

    this.item.map(row => row.ind_selecionado = false)
    this.movimento.itemSelecionado = []

    const itens = this.item.filter(row => ev.detail.value.includes(row.cod_item));

    for (const row of itens) {
      for (const i of this.item) {

        if(row.cod_item === i.cod_item && row.cod_empresa === i.cod_empresa){
          i.ind_selecionado = true;
          this.movimento.itemSelecionado.push(i);
        }
      }
    }

  }

  buscaFiltros(){
    this.showLoading('Preparando exibição...', 300000);

    const filtroObservable = this.movimento.buscaFiltro(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel).pipe(
      timeout(301000),
    );

    filtroObservable
    .pipe(
      tap(data =>{
        console.log(data)
        this.item = data.item
        this.itemfull = data.itemfull
        this.movimento.formaPagto = data.formaPagto
        this.groupedItems = this.groupItemsByCodEmpresa(this.item);
        this.movimento.tipoFormaPagto = data.tipoFormaPagto
      }),
      finalize(() => this.loadingCtrl.dismiss()),
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
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
    if (error.name === 'TimeoutError') {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    } else {
      this.alert.presentToast('Tempo de retorno da solicitação atingido, tente novamente', 3000);
    }
  }

  setOpen(isOpen: boolean) {
    this.isModalOpenCliente = isOpen;
  }

  limpaDados(){
    this.movimento.pessoasSelecionadas = []
  }

}
