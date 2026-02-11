import { itemBomba } from './../../class/user';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { timeout, tap, finalize, catchError } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';

@Component({
  selector: 'app-precobomba',
  templateUrl: './precobomba.page.html',
  styleUrls: ['./precobomba.page.scss'],
  standalone: false
})
export class PrecobombaPage implements OnInit {

  public item: itemBomba[] = [];

  groupedItems: { nom_fantasia: string, cod_empresa: number, items: itemBomba[] }[] = [];

  constructor(public auth: AuthService, private loadingCtrl: LoadingController, public movimento: MovimentoService, private alert: Alert, private router: Router) { }

  ngOnInit() {
    this.buscaItemBomba();
  }

  setNovoPreco(ev, item){
    item.val_novo_preco_venda = parseInt(ev.detail.value)

  }

  enviarTroca(){

    const troca = this.item.filter(row => row.val_novo_preco_venda > 0)

    this.showLoading('Buscand Registros...', 50000)

    const trocaPrecoObservable = this.movimento.enviaTrocaPreco(this.auth.userLogado.schema, this.auth.userLogado.cod_usuario, this.auth.userLogado.nom_usuario, this.auth.userLogado.cod_empresa_sel, troca).pipe(
      timeout(301000),
    );

    trocaPrecoObservable
    .pipe(
      tap(data =>{
        //this.router.navigate(['/home']);
        this.alert.presentToast(data.message, 4000);
      }),
      finalize(() => this.loadingCtrl.dismiss()),
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    )
    .subscribe();
  }

  buscaItemBomba(){
    this.showLoading('Buscando dados...', 300000);

    const filtroObservable = this.movimento.buscaItemBomba(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel).pipe(
      timeout(301000),
    );

    filtroObservable
    .pipe(
      tap(data =>{
        this.item = data.item
        this.groupedItems = this.groupItemsByCodEmpresa(this.item);
      }),
      finalize(() => this.loadingCtrl.dismiss()),
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    )
    .subscribe();
  }

  groupItemsByCodEmpresa(items: itemBomba[]): { nom_fantasia: string, cod_empresa: number, items: itemBomba[] }[] {
    const groupedItems: { nom_fantasia: string, cod_empresa: number, items: itemBomba[] }[] = [];

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
