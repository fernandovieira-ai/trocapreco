import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { tap, timeout, catchError } from 'rxjs';
import { Alert } from 'src/app/class/alert';
import { pessoaNegociacao } from 'src/app/class/user';
import { AuthService } from 'src/app/services/auth.service';
import { MovimentoService } from 'src/app/services/movimento.service';

@Component({
  selector: 'app-preco-intervalo',
  templateUrl: './preco-intervalo.page.html',
  styleUrls: ['./preco-intervalo.page.scss'],
  standalone: false
})
export class PrecoIntervaloPage implements OnInit {

  customActionSheetOptions = {
    header: 'Selecione um tipo',
    subHeader: 'Será somado ou subtraido do preço atual',
  };

  precoInicial = 0
  precoFinal = 0
  valorRegra = 0
  tipoRegra = ''

  listaDePrecos: pessoaNegociacao[] = []

  constructor(public auth: AuthService, public movimento: MovimentoService, private loadingCtrl: LoadingController, public alert: Alert) { }

  ngOnInit() {
  }

  buscaPrecoIntervalo(){
    this.listaDePrecos = []
    this.showLoading('Buscando dados...', 50000);
    this.movimento.buscaPrecoIntervalo(this.auth.userLogado.schema, this.auth.userLogado.cod_empresa_sel, this.precoInicial, this.precoFinal).pipe(
      tap(data =>{
        this.listaDePrecos = data.message
      }),
      timeout(51000),
      catchError((err) => {
        this.loadingCtrl.dismiss();
        this.handleError(err);
        throw err;
      })
    ).subscribe(()=>{
      this.loadingCtrl.dismiss();
    });
  }



  aplicaRegra() {
    const fator = this.tipoRegra === 'A' ? 1 : this.tipoRegra === 'S' ? -1 : 0;

    this.listaDePrecos.forEach(row => {
      row.val_preco_venda_a += fator * this.valorRegra;
    });

    console.log(this.listaDePrecos)
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
